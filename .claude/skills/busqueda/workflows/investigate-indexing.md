# Workflow: Investigación de Problemas de Indexación

1. **Verificar accesibilidad HTTP real:** confirmar status (`200`, `301`, `404`, `410`, `5xx`), cadenas de redirección y ausencia de *soft 404*.
2. **Contrastar `robots.txt` vs `noindex`:** verificar que `robots.txt` no bloquee una página pública ni impida leer una directiva `noindex` o `X-Robots-Tag` cuando se busca desindexar.
3. **Inspeccionar `canonical` y duplicidad:** comprobar si `canonical` apunta a otra URL, si existen conflictos entre HTTP/HTTPS o `www`/non-`www`, o si el frontend y backend emiten canonicals distintos.
4. **Verificar HTML inicial (SSR/SSG vs CSR):** comprobar si el contenido principal y los enlaces `<a href>` aparecen en el HTML servido antes de hidratación JS.
5. **Validar `sitemap.xml` y enlazado interno:** confirmar que la URL existe en el sitemap (si es pública), que no es huérfana y que coincide exactamente con su `canonical`.
6. **Entregar diagnóstico con evidencia** (sin editar archivos hasta autorización).
