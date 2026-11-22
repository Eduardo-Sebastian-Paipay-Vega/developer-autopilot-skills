---
name: update-main-staging
description: Orquesta el ciclo de despliegue y promoción continua desde el entorno de desarrollo local hasta el entorno de staging (CI/CD con Git, Cloud Build y Cloud Run). Valida localmente el código (tests, linters, compilación y migraciones), propone commits estructurados, promueve cambios a la rama principal o de staging, supervisa la compilación de imágenes de contenedor, alinea jobs de migración de base de datos y ejecuta pruebas de disponibilidad (smoke tests). Se invoca manualmente (/update-main-staging).
---

# Flujo de Promoción y Despliegue Continuo a Staging

Esta skill automatiza y asegura el ciclo completo de entrega continua (CI/CD) desde la máquina local hasta los servidores de staging en la nube, previniendo despliegues rotos y asegurando la sincronización de servicios y bases de datos.

---

## Configuración del Pipeline

La skill obtiene las variables del pipeline desde `toolkit.config.json` o las solicita de forma interactiva:

* **`PROJECT_ID`**: ID del proyecto en Cloud (ej. `mi-empresa-dev`).
* **`REGION`**: Región de despliegue (ej. `southamerica-west1`).
* **`BRANCH_MAIN`**: Rama de producción o base (`main` o `master`).
* **`BRANCH_DEV`**: Rama de desarrollo activo (`dev` o `staging`).
* **`SERVICES`**: Lista de servicios web a verificar (`backend`, `frontend`).
* **`MIGRATION_JOB`**: Job de migraciones automatizadas de base de datos.
* **`STAGING_URLS`**: URLs públicas para los smoke tests de verificación.

---

## Fases del Despliegue de Punta a Punta

```
[1. Validación Local] ──> [2. Git & Commits] ──> [3. Promoción / Push]
                                                         │
[6. Smoke Test 200]  <── [5. Migraciones DB] <── [4. Cloud Build / CI]
```

---

### Fase 1: Validación y Puertas de Calidad Locales (Quality Gates)
Antes de tocar cualquier rama remota o disparar pipelines de nube, detectar qué capas existen y ejecutar solo las validaciones válidas para cada stack:
1. **Frontend (si existe `package.json`):**
   ```bash
   npm run build --if-present
   npm run lint --if-present
   ```
   *(En pnpm/yarn usar el gestor real del repositorio).*
2. **Backend Django (solo si existe `manage.py`):**
   ```bash
   python manage.py check
   python manage.py makemigrations --check --dry-run
   ```
3. **Suite de pruebas Python (solo si existe `pytest.ini`, `pyproject.toml` o carpeta `tests/`):**
   ```bash
   python -m pytest
   ```
4. **Backend Node/TypeScript (si existe `package.json` en backend):**
   ```bash
   npm run build --if-present
   npm test --if-present
   ```
5. Si alguna prueba o validación falla, el despliegue **se detiene inmediatamente** para evitar propagar errores a staging.

### Fase 2: Convención de Commits Estructurados (Puerta de autorización #1)
* Analizar los cambios locales con `git status` y `git diff`.
* Proponer el mensaje de commit siguiendo Conventional Commits (`feat`, `fix`, `refactor`, `docs`).
* **🛑 PUERTA OBLIGATORIA:** Mostrar archivos y mensaje propuesto y esperar confirmación explícita del usuario antes de ejecutar `git commit`.

### Fase 3: Promoción de Ramas en Git (Puerta de autorización #2)
* **🛑 PUERTA OBLIGATORIA:** Nunca encadenar `push` a `dev` ni `merge` + `push` a `main` sin autorización expresa en esa sesión. Verificar antes que la rama destino esté al día (`git fetch origin`).
1. Enviar cambios a la rama de desarrollo remoto (solo con confirmación):
   ```bash
   git push origin <BRANCH_DEV>
   ```
2. Promoción a la rama principal (requiere confirmación separada y explícita, nunca automática):
   ```bash
   git checkout <BRANCH_MAIN>
   git pull --ff-only origin <BRANCH_MAIN>
   git merge <BRANCH_DEV> --no-ff -m "Promoción de staging: integración de <BRANCH_DEV>"
   git push origin <BRANCH_MAIN>
   git checkout <BRANCH_DEV>
   ```

### Fase 4: Monitoreo de Build en la Nube (Cloud Build / CI — solo lectura)
Consultar el estado de ejecución del trigger de integración continua:
```bash
gcloud builds list --limit=3 --project=<PROJECT_ID> --region=<REGION> --format="table(id, status, createTime, duration)"
```
Esperar a que el estado sea `SUCCESS` antes de continuar con la alineación de base de datos.

### Fase 5: Alineación de Imágenes y Migraciones de Base de Datos (Puerta de autorización #3)
* **🛑 PUERTA OBLIGATORIA:** Confirmar antes que no existan importaciones o tareas en segundo plano activas (ver `/diagnostico-staging`) y solicitar autorización explícita antes de actualizar o ejecutar el Job de migración.
1. Obtener el hash o tag de la imagen recién construida por el pipeline (solo lectura):
   ```bash
   IMAGEN_NUEVA=$(gcloud run services describe <BACKEND_SERVICE> --region=<REGION> --project=<PROJECT_ID> --format="value(spec.template.spec.containers[0].image)")
   ```
2. Con confirmación explícita, actualizar el Job de migraciones con la imagen idéntica y ejecutar:
   ```bash
   gcloud run jobs update <MIGRATION_JOB> --image="$IMAGEN_NUEVA" --region=<REGION> --project=<PROJECT_ID>
   gcloud run jobs execute <MIGRATION_JOB> --region=<REGION> --project=<PROJECT_ID> --wait
   ```
3. Revisar logs del job para confirmar que las migraciones se aplicaron con éxito (`OK`).

### Fase 6: Verificación de Disponibilidad (Smoke Tests)
Realizar peticiones de salud HTTP a los endpoints públicos de staging:
```bash
# Verificar Backend (código 200 esperado en healthcheck o root)
curl -s -o /dev/null -w "%{http_code}\n" "<URL_BACKEND_STAGING>/api/health/"

# Verificar Frontend (código 200 esperado en la raíz)
curl -s -o /dev/null -w "%{http_code}\n" "<URL_FRONTEND_STAGING>/"
```

---

## Salida de Seguridad y Control
* Toda acción que consuma minutos de compilación en la nube o que aplique cambios irreversibles en base de datos requiere autorización expresa del operador en la terminal.
* Si el build de Cloud Build falla o el smoke test arroja códigos 5xx, la skill reporta inmediatamente los logs de error para diagnóstico con `/diagnostico-staging`.
