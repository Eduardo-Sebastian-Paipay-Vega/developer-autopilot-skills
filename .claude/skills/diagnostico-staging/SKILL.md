---
name: diagnostico-staging
description: Diagnostica entornos de staging y preproducción en Google Cloud Platform (Cloud Run, Cloud SQL y Cloud Jobs) para cualquier proyecto. Verifica sesión de gcloud, estado y revisiones de servicios, logs de error recientes, sincronización de jobs de migración respecto a imágenes de contenedor desplegadas, gestión segura de secretos (--update-secrets sin sobrescribir variables existentes), y mitigación de cuellos de botella de CPU throttling en tareas en segundo plano. Se invoca manualmente (/diagnostico-staging).
---

# Diagnóstico de Entornos de Staging (Google Cloud Platform)

Esta skill proporciona un protocolo estructurado y seguro para diagnosticar caídas, fallos de conectividad, errores de migración y discrepancias de despliegue en infraestructuras de backend y frontend alojadas en Google Cloud Platform (Cloud Run + Cloud SQL + Cloud Jobs).

---

## Configuración y Parametrización del Entorno

Antes de ejecutar comandos en la nube, la skill obtiene las coordenadas del proyecto mediante uno de los siguientes mecanismos (en orden de prioridad):

1. Archivo de configuración local `toolkit.config.json` (sección `cloud`).
2. Variables de entorno activas (`GCP_PROJECT_ID`, `GCP_REGION`, etc.).
3. Consulta interactiva al usuario en la primera invocación.

### Parámetros Requeridos:
* **`PROJECT_ID`**: ID del proyecto en Google Cloud (ej. `mi-empresa-staging`).
* **`REGION`**: Región de despliegue (ej. `southamerica-west1`, `us-central1`, etc.).
* **`BACKEND_SERVICE`**: Nombre del servicio Cloud Run del backend (ej. `backend-staging`).
* **`FRONTEND_SERVICE`**: Nombre del servicio Cloud Run del frontend (ej. `frontend-staging`).
* **`MIGRATION_JOB`**: Nombre del Cloud Run Job de migraciones (ej. `backend-staging-migrate`).
* **`SQL_INSTANCE`**: Nombre de la instancia de Cloud SQL (PostgreSQL / MySQL).

---

## Matriz de Comandos `gcloud`: Lectura vs. Modificación

| Comando | Propósito | Clasificación |
| :--- | :--- | :---: |
| `gcloud run services list` | Lista los servicios activos del proyecto y sus URLs. | **Solo lectura** |
| `gcloud run services describe <servicio>` | Consulta configuración, imagen activa y variables sin alterar nada. | **Solo lectura** |
| `gcloud run jobs describe <job>` | Muestra qué imagen y comandos ejecutará el job. | **Solo lectura** |
| `gcloud run revisions list --service=<servicio>` | Muestra versiones desplegadas y estados (`Ready`, `Retired`). | **Solo lectura** |
| `gcloud logging read "..."` | Consulta registros históricos de errores en Cloud Logging. | **Solo lectura** |
| `gcloud run jobs update <job> --image=<imagen>` | Cambia la imagen que utilizará el job de migración. | ⚠️ **Modifica estado** |
| `gcloud run jobs execute <job> --wait` | **Ejecuta la migración real** contra la base de datos de staging. | ⚠️ **Modifica estado** |
| `gcloud run services update <servicio> ...` | Despliega una nueva revisión con cambios de variables o configuración. | ⚠️ **Modifica estado** |

> [!CAUTION]
> Los comandos clasificados como **Modifica estado** NUNCA se ejecutan de forma automática: siempre se muestra el comando completo al usuario y se solicita confirmación explícita.

---

## Protocolo de Diagnóstico Paso a Paso

### Paso 0: Verificación de Sesión y CLI `gcloud`
Asegurar que el SDK de Google Cloud esté disponible en el PATH y autenticado:
```bash
gcloud version
gcloud auth list
gcloud config set project <PROJECT_ID>
```

### Paso 1: Estado General de Servicios
Consultar si los servicios están respondiendo y en estado `Ready`:
```bash
gcloud run services describe <BACKEND_SERVICE> --region=<REGION> --format="yaml(status.conditions)"
gcloud run services describe <FRONTEND_SERVICE> --region=<REGION> --format="yaml(status.conditions)"
```

### Paso 2: Detección de Desincronización de Imagen de Migración (Gotcha Crítico)
* **El Problema:** El backend despliega una imagen nueva (ej. `backend:v2.5`), pero el Job de migraciones sigue apuntando a una imagen antigua (`backend:v2.4`). Al ejecutar el job, este reporta *"No migrations to apply"* con código `exit 0` a pesar de haber migraciones pendientes en el código nuevo.
* **Diagnóstico comparativo:**
  ```bash
  # Imagen activa en el servicio de backend:
  gcloud run services describe <BACKEND_SERVICE> --region=<REGION> --format="value(spec.template.spec.containers[0].image)"

  # Imagen configurada en el Job de migración:
  gcloud run jobs describe <MIGRATION_JOB> --region=<REGION> --format="value(spec.template.spec.template.spec.containers[0].image)"
  ```
* **Solución si difieren:** Actualizar el job con la imagen idéntica del backend antes de correr las migraciones:
  ```bash
  gcloud run jobs update <MIGRATION_JOB> --image=<IMAGEN_BACKEND> --region=<REGION>
  gcloud run jobs execute <MIGRATION_JOB> --region=<REGION> --wait
  ```

### Paso 3: Análisis de Errores en Cloud Logging
Filtrar los errores recientes de la última hora:
```bash
gcloud logging read 'resource.type="cloud_run_revision" AND severity>=ERROR' --limit=25 --freshness=1h --format="table(timestamp, textPayload, jsonPayload.message)"
```

### Paso 4: Buenas Prácticas de Secretos y Variables de Entorno
* **Regla estricta:** Al agregar o modificar variables o secretos en Cloud Run, usar **`--update-secrets`** y **`--update-env-vars`**.
* **Peligro:** El uso accidental de `--set-secrets` o `--set-env-vars` **elimina todas las variables previas** del servicio que no se incluyan en el comando, lo que tumba inmediatamente el entorno.

### Paso 5: Alerta sobre Tareas en Background y Despliegues
* Si el servicio ejecuta importaciones, procesamiento de archivos o sincronizaciones en segundo plano dentro de hilos (`threads`), un nuevo despliegue o cambio de configuración retira la revisión anterior inmediatamente, interrumpiendo el proceso a mitad de camino y dejando registros inconsistentes.
* **Recomendación:** Verificar que no existan procesos activos antes de autorizar un redespliegue de staging.

---

## Checklist de Resolución
- [ ] La cuenta de Google Cloud y el proyecto activo coinciden con el entorno de staging objetivo.
- [ ] Las condiciones de salud (`Ready: True`) están verificadas en frontend y backend.
- [ ] La imagen del Job de migración está estrictamente sincronizada con la imagen del servicio backend.
- [ ] Los logs recientes de Cloud Logging no registran excepciones no capturadas ni errores de conexión a Cloud SQL.
- [ ] La URL pública de staging responde con código HTTP 200 en las pruebas de verificación.
