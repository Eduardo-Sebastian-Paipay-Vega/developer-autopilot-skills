# Catálogo de las 15 Pantallas de Estado y Error (UX, Copy, CTAs y ARIA)

## A. Pantallas de Estado del Sistema y Transición

| # | Pantalla / Estado | Cuándo aparece | Copy base sugerido | CTAs / Acciones | ARIA |
| :-: | :--- | :--- | :--- | :--- | :--- |
| 1 | **Full-page Loader** | Operación crítica bloqueante (pago, cierre de periodo, firma). | "Procesando operación… No cierres esta ventana." | Ninguno (bloqueo intencional + focus trap). | `role="status"` `aria-busy="true"` |
| 2 | **Skeleton Screen** | Carga inicial de listados, tarjetas, tablas o fichas. | *(Sin texto invasivo; imita el layout exacto)* | Ninguno. | `aria-busy="true"` `aria-label="Cargando contenido"` |
| 3a | **Empty: Primer uso** | Módulo sin registros aún. | "Aún no tienes `<entidad>` registrados." | **Primario:** "+ Crear primer `<entidad>`". | `role="status"` |
| 3b | **Empty: Sin resultados** | Búsqueda o filtros sin coincidencias. | "No encontramos resultados para tus filtros actuales." | **Primario:** "Limpiar filtros". | `role="status"` |
| 3c | **Empty: Zero Inbox** | Todas las tareas/notificaciones atendidas. | "¡Todo al día! No tienes pendientes por revisar." | **Secundario (opcional):** "Ver historial". | `role="status"` |
| 4 | **Success / Confirmación** | Acción crítica finalizada (compra, envío, emisión). | "`<Acción>` completada correctamente." + resumen/recibo. | **Primario:** "Continuar" · **Secundario:** "Descargar comprobante". | `role="status"` `aria-live="polite"` |
| 5 | **Procesamiento en 2.º plano** | Exportación masiva, reporte pesado, importación CSV en cola. | "Estamos procesando tu solicitud en segundo plano. Te avisaremos al terminar." | **Primario:** "Seguir trabajando" · **Secundario:** "Ver cola de tareas". | `role="status"` `aria-live="polite"` |

## B. Pantallas de Error, Excepción y Bloqueo

| # | Código / Estado | Causa | Copy base sugerido | CTAs / Acciones | ARIA |
| :-: | :--- | :--- | :--- | :--- | :--- |
| 6 | **400 Bad Request** | Solicitud mal formada o datos corruptos. | "No pudimos procesar la solicitud porque algunos datos no son válidos." | "Revisar y corregir" / "Volver". | `role="alert"` |
| 7 | **401 Unauthorized** | No autenticado o sesión expirada. | "Tu sesión ha expirado. Inicia sesión nuevamente para continuar." | **Primario:** "Iniciar sesión" (conserva `returnUrl`). | `role="alert"` |
| 8 | **403 Forbidden** | Autenticado, pero sin rol/permiso para ese recurso. | "No tienes permisos para acceder a esta sección." | **Primario:** "Volver al inicio" · **Secundario:** "Solicitar acceso". *(NO cerrar sesión)* | `role="alert"` |
| 9 | **404 Not Found** | URL inexistente o registro eliminado. | "No encontramos la página o el recurso que buscas." | **Primario:** "Ir al inicio" · **Secundario:** "Volver atrás". | `role="alert"` |
| 10 | **429 Too Many Requests** | Rate limit superado. | "Has realizado demasiadas solicitudes. Intenta nuevamente en `<N>` segundos." | "Reintentar" (deshabilitado hasta que termine el contador `Retry-After`). | `role="alert"` `aria-live="polite"` |
| 11 | **500 Internal Server Error** | Fallo inesperado del backend o BD. | "Ocurrió un problema inesperado en el servidor." + `Código de referencia: <traceId>`. | **Primario:** "Reintentar" · **Secundario:** "Volver al inicio". | `role="alert"` |
| 12 | **502 / 504 Gateway Error** | Servicio externo caído o tiempo de espera agotado. | "El servidor tardó demasiado en responder. Es posible que sea temporal." | **Primario:** "Reintentar ahora" · **Secundario:** "Volver". | `role="alert"` |
| 13 | **503 Mantenimiento** | Mantenimiento programado o sobrecarga controlada. | "Estamos realizando mejoras programadas. Volveremos pronto." (+ hora estimada). | "Comprobar disponibilidad". | `role="alert"` |
| 14 | **Offline State** | Dispositivo sin conexión a internet. | "Sin conexión a internet." (+ "Mostrando datos guardados en caché" si aplica). | "Reintentar conexión" (se oculta automáticamente al recuperar `online`). | `role="status"` `aria-live="assertive"` |
| 15 | **Force Update** | Versión obsoleta de app o navegador no soportado. | "Hay una actualización obligatoria disponible para seguir usando el sistema de forma segura." | **Primario (bloqueante):** "Actualizar ahora". | `role="alertdialog"` `aria-modal="true"` |
