# Escenarios de Verificación Conductual de `/busqueda`

| # | Escenario | Comportamiento esperado |
| :---: | :--- | :--- |
| 1 | Next.js con SSR | Identificar Metadata API (`generateMetadata`), `sitemap.ts`/`robots.ts` y renderizado real |
| 2 | Angular con CSR | Detectar limitaciones de CSR puro y evaluar Angular SSR / prerendering |
| 3 | Django + React | Auditar backend y frontend por separado sin mezclar responsabilidades |
| 4 | Web con Cloudflare | Examinar CDN, Cache Rules (separación público/privado), DNS y headers |
| 5 | Sitemap existente pero incorrecto | Detectar errores reales (URLs privadas, 404 o duplicadas) y no marcar L2 por existir el archivo |
| 6 | JSON-LD duplicado o inválido | Identificar conflictos y sintaxis inválida con ubicación exacta |
| 7 | Página privada indexable | Marcar severidad **Crítica** (fuga de privacidad) y bloquear `--strict` |
| 8 | Canonical incorrecta | Localizar origen (FE vs BE) y proponer corrección mínima segura |
| 9 | API/página con `200 OK` en ruta inexistente | Identificar *soft 404* con evidencia HTTP real (`--url`) |
| 10 | Proyecto sin SEO | Diseñar arquitectura por fases sin inventar implementaciones existentes |
| 11 | Proyecto bien optimizado | Confirmar niveles `L2/L3` sin recomendar cambios innecesarios |
| 12 | Auditoría sin autorización | Entregar informe y plan en **modo solo lectura** sin modificar archivos |
