# Principios, Gobernanza, Niveles de Madurez y Protocolo de Auditoría

## 1. Los 6 Principios Obligatorios (P1–P6)

- **P1. Evidence-Based Engineering:** nunca declarar una capacidad como cumplida por existir un archivo o dependencia (`sitemap.xml`, JSON-LD, SSR, caché). Exigir evidencia verificable de funcionamiento real.
- **P2. Full-Stack Coverage:** evaluar frontend, backend, base de datos, infraestructura/CDN, configuración, CI/CD y observabilidad según aplique.
- **P3. No Assumptions:** prohibido inventar rutas, endpoints, tablas, componentes, métricas ni pruebas no ejecutadas.
- **P4. Audit Before Implementation:** modo solo lectura por defecto. Una solicitud de auditoría **nunca** se convierte automáticamente en modificación de código sin autorización explícita.
- **P5. Non-Regression:** las mejoras SEO jamás deben romper autenticación, autorización (RBAC), flujos de negocio, contratos API, navegación, UX ni rendimiento funcional.
- **P6. Continuous Verification:** toda mejora requiere criterio de aceptación medible y evidencia de validación antes de cerrarse.

## 2. Protocolo de Auditoría de 7 Dimensiones (por módulo)

Cada módulo aplicable de los 16 dominios se evalúa bajo las mismas 7 dimensiones:
1. **Inventario:** qué componentes, archivos o servicios existen realmente.
2. **Configuración:** cómo están configurados hoy.
3. **Funcionamiento:** si operan realmente en ejecución/HTML/HTTP.
4. **Integración:** cómo interactúan con el resto de capas (FE ↔ BE ↔ BD ↔ CDN).
5. **Riesgos:** fallos de indexación, privacidad, duplicidad o regresión.
6. **Validación:** prueba determinista o manual que demuestra el estado real.
7. **Mejora:** cambio mínimo seguro, justificado y priorizado.

## 3. Niveles de Madurez (L0–L3) y Severidades

| Nivel | Significado |
| :---: | :--- |
| **L0** | No implementado (capacidad inexistente) |
| **L1** | Implementado parcialmente (existe con deficiencias o sin validación) |
| **L2** | Implementado (funciona con evidencia verificada) |
| **L3** | Automatizado y monitorizado (validado en CI/CD y producción) |

**Severidades (según impacto demostrado):**
- **Crítica:** exposición de rutas/datos privados, bloqueo masivo de indexación, *soft 404* generalizado, caídas 5xx.
- **Alta:** `canonical` incorrecta en páginas clave, CSR sin contenido inicial en páginas públicas críticas, `sitemap` que excluye contenido principal o incluye privadas.
- **Media:** títulos/descripciones duplicados, enlaces internos rotos, HTML semántico o JSON-LD incompleto.
- **Baja:** mejoras editoriales u optimizaciones menores no bloqueantes.

## 4. Política de Fuentes Técnicas (P0 / P1 / P2)

Distinguir siempre entre **estándar oficial**, **recomendación del proveedor**, **buena práctica de ingeniería**, **convención comunitaria** e **hipótesis**:
- **P0:** Google Search Central, especificación Agent Skills, documentación oficial del framework y del servidor/CDN.
- **P1:** `web.dev` (CWV: `LCP ≤ 2.5s`, `INP ≤ 200ms`, `CLS ≤ 0.1` en p75), `Schema.org`, Bing Webmaster.
- **P2:** repositorios y herramientas de referencia contrastadas.
- **Regla de honestidad:** `llms.txt` es una convención emergente (no requisito oficial de Google) y un puntaje de Lighthouse **no** garantiza posicionamiento orgánico.
