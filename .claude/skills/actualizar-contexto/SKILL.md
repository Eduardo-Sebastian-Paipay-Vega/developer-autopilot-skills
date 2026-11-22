---
name: actualizar-contexto
description: Revisa los cambios realizados en el árbol de trabajo (working tree o commits recientes de Git) y propone actualizaciones a la documentación viva de arquitectura del proyecto (contexto de arquitectura, estructura de carpetas, endpoints y decisiones de diseño). Se invoca manualmente (/actualizar-contexto) al finalizar una sesión de desarrollo con modificaciones estructurales relevantes. Muestra la propuesta antes de aplicar cualquier cambio.
---

# Actualización de Contexto de Arquitectura y Documentación Viva

Esta skill mantiene sincronizada la documentación técnica y de arquitectura del proyecto con la realidad del código fuente tras cada sesión de trabajo, evitando la degradación del conocimiento ("knowledge drift").

---

## Principio de Documentación Viva

Los documentos de contexto de arquitectura (habitualmente ubicados en `docs/arquitectura/`, `docs/architecture/`, `docs/design/` o en la raíz del proyecto) representan la **fuente de verdad** para los desarrolladores, agentes de IA y nuevos miembros del equipo antes de escribir código.
Si la documentación se desactualiza:
* Se reimplementan soluciones que ya existen.
* Se asume que un módulo es un prototipo o mock cuando ya consume datos reales.
* Se rompen contratos de API o modelos de datos asumidos erróneamente.

---

## Flujo de Trabajo

### Paso 1: Detección y Análisis de Cambios en Git
Ejecutar las consultas de inspección:
```bash
git status                           # Archivos modificados y nuevos en working tree
git diff HEAD                        # Cambios exactos de código (staged + unstaged)
git log --oneline -10                # Commits recientes de la sesión activa
```
*(Si se indica un rango específico, usar `git diff main...HEAD` o la rama base correspondiente).*

### Paso 2: Localización de los Documentos de Arquitectura
Localizar los archivos vivos del repositorio actual:
1. Buscar en rutas estándar:
   * `docs/arquitectura/` o `docs/architecture/` (`contexto-proyecto.md`, `architecture.md`, `estructura-proyecto.md`).
   * `docs/` (`ARCHITECTURE.md`, `SYSTEM_DESIGN.md`).
   * `README.md` o `.github/` si el repositorio centraliza allí su arquitectura.
2. Si no existe un archivo de arquitectura formal, consultar al usuario si desea inicializar `docs/arquitectura/contexto-proyecto.md` y `estructura-proyecto.md`.

### Paso 3: Filtro de Relevancia Arquitectónica

#### ✅ QUÉ ES RELEVANTE DOCUMENTAR:
* **Evolución de estado:** Un módulo pasó de mock / datos simulados a integración con API real (o viceversa).
* **Rutas, endpoints y WebSockets:** si se agregaron, movieron o eliminaron rutas frontend o endpoints API, sincroniza `docs/arquitectura/routes-map.json` y `CATALOGO_RUTAS.md` vía `autopilot rutas extraer --merge && autopilot rutas generar`.
* **Estructura de directorios:** Creación, reubicación o eliminación de módulos de primer y segundo nivel.
* **Contratos de datos:** Nuevos modelos de entidad, endpoints REST, serializers, schemas de base de datos o contratos gRPC.
* **Decisiones técnicas:** Modificación de librerías base, integraciones con servicios externos o cambios en políticas de seguridad/autenticación.
* **Deuda técnica:** Resolución de problemas conocidos previamente registrados o registro de nuevas limitaciones detectadas.

#### ❌ QUÉ NO DEBE SATURAR LA DOCUMENTACIÓN:
* Refactorizaciones internas de variables o funciones privadas sin impacto en contratos públicos.
* Correcciones menores de bugs ("bugfixes") que no alteran la arquitectura.
* Ajustes estéticos, cambios de copy de texto o márgenes CSS.

---

## Paso 4: Propuesta y Aprobación
1. Presentar al usuario un resumen conciso:
   * Archivo de documentación a modificar.
   * Sección específica y cambio propuesto (1 línea por punto).
2. **Regla de preservación:** Nunca eliminar documentación histórica válida ni recortar secciones útiles. La documentación viva se expande, precisa y actualiza, no se mutila.
3. Esperar la confirmación del usuario antes de guardar los cambios en disco.

---

## Checklist de Calidad
- [ ] La propuesta documenta cambios de arquitectura y decisiones, no logs línea por línea.
- [ ] Los nombres de módulos, carpetas y endpoints coinciden 1:1 con el código fuente real.
- [ ] No se eliminaron explicaciones o contextos históricos previos sin justificación explícita.
- [ ] El formato Markdown mantiene consistencia visual con el resto de la documentación existente.
