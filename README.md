# Landing Design Guardian — kit de skills para Claude Code

**Objetivo:** usar el landing existente como fuente de verdad visual, documentarlo con evidencias y aplicar esa identidad **solo** a rutas y componentes públicos explícitamente autorizados. El dashboard, el sistema autenticado y el backend quedan fuera del alcance.

## Instalación en un repositorio

1. Descomprime este ZIP en la **raíz del repositorio**, de modo que aparezca `.claude/skills/landing-design-guardian/SKILL.md`.
2. Abre `.claude/landing-design/scope.json`. Indica `baseUrl` (servidor local), `referenceRoute`, `publicRoutes` y, especialmente, las carpetas exactas de `allowedSourcePaths`. No agregues carpetas genéricas que incluyan el sistema privado.
3. Para capturar estilos renderizados, dentro del proyecto instala Playwright si no existe:
   ```powershell
   npm install --save-dev playwright
   npx playwright install chromium
   ```
   Si el repositorio ya tiene Playwright, reutilízalo. Inicia el servidor del landing como lo haces normalmente.
4. Reinicia Claude Code para descubrir las skills y ejecuta, en orden:
   ```text
   /landing-recopilar
   /landing-auditar
   /landing-aplicar
   /landing-verificar
   ```
   Alternativamente, usa `/landing-uniformizar` para orquestar los cuatro pasos en una ejecución, siempre que `allowedSourcePaths` esté bien configurado.
   Usa `/landing-actualizar` solo cuando cambie *deliberadamente* el diseño de referencia.

**No ejecutes `npm install` si el proyecto no usa npm**: el agente deberá identificar su gestor real (pnpm, yarn, bun) antes de proponer comandos equivalentes. La script usa `playwright` como dependencia ya instalada.

## Comandos

- `/landing-uniformizar`: orquestador integral (recopilar → auditar → aplicar → verificar), con freno si falta allowlist.

- `/landing-recopilar`: captura datos medidos del landing + inspección de su código, construye la especificación visual sin cambiar el producto.
- `/landing-auditar`: clasifica las pantallas públicas, encuentra divergencias y propone un plan por archivo.
- `/landing-aplicar`: crea una línea base, realiza cambios solo en archivos permitidos, reutiliza componentes y valida que no alteró archivos fuera de alcance.
- `/landing-verificar`: revisa responsive, estados, regresiones y build; emite veredicto con evidencias.
- `/landing-actualizar`: actualiza la fuente de verdad tras cambios aprobados, versionando diferencias.

## Herramientas incluidas

Captura visual (con el servidor local encendido):

```powershell
node .claude/skills/landing-design-guardian/scripts/capture-landing.mjs
```

Verificar un cambio de alcance (tomar snapshot **antes** de editar):

```powershell
node .claude/skills/landing-design-guardian/scripts/guard-changes.mjs snapshot
# ... /landing-aplicar realiza modificaciones ...
node .claude/skills/landing-design-guardian/scripts/guard-changes.mjs verify
```

`capture-landing.mjs` genera capturas PNG y JSON con estilos computados para tres resoluciones. No emplea scraping remoto ni transmite información. `guard-changes.mjs` compara archivos antes/después y falla ante cambios fuera del alcance explícito. No hace commits.

## Límites y seguridad

- **No** migrar automáticamente estilos al dashboard, intranet, panel privado, login operativo o cualquier superficie que forme parte del sistema sin una decisión explícita.
- **No** reemplazar variables CSS globales si también las consume el sistema interno. Usar tokens aislados por contenedor o estilos del landing.
- **No** refactorizar lógica de negocio, APIs, autenticación, modelos, migraciones, routing privado ni backend.
- **No** inventar colores, fuentes, animaciones, tamaños o comportamientos. Distinguir *medido* vs. *inferido* vs. *no encontrado*.
- **No** hacer commit, push, despliegue ni instalar herramientas sin permiso del usuario. El comando `/landing-aplicar` autoriza únicamente los cambios visuales acotados que describe.
- Si la referencia y los archivos permitidos no están identificados, `recopilar` puede inventariar y proponer, pero `aplicar` debe detenerse sin escribir código.

## Evidencias creadas durante el uso

`.claude/landing-design/` contendrá `DESIGN.md`, `TOKENS.json`, `COMPONENTS.md`, `PAGE-INVENTORY.md`, `AUDIT.md`, `VERIFICATION.md`, capturas en `evidence/`, y `change-baseline.json` (archivo técnico, local).

**Nota:** este ZIP es un kit original diseñado para el flujo solicitado. No incluye código copiado de las skills públicas citadas en la respuesta.
