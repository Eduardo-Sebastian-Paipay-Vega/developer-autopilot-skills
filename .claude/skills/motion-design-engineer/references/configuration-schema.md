# Contrato de configuración (`mdes.config.json`)

Todo recurso MDES incluye un archivo `mdes.config.json` validado contra `schema/mdes.config.schema.json`. Es una especificación interna del sistema (no un estándar web) para garantizar que todos los recursos expongan la misma interfaz.

## Estructura mínima válida

```json
{
  "$schema": "../../schema/mdes.config.schema.json",
  "id": "document-processing-001",
  "name": "Document Processing",
  "category": "loading",
  "pattern": "document-processing",
  "complexity": "M2",
  "renderer": "svg-css",
  "canvas": { "width": 240, "height": 180, "viewBox": "0 0 240 180" },
  "visual": {
    "primaryColor": "#2563EB",
    "secondaryColor": "#93C5FD",
    "accentColor": "#10B981",
    "backgroundColor": "transparent",
    "strokeColor": "#1E3A8A",
    "strokeWidth": 2,
    "scale": 1,
    "opacity": 1
  },
  "motion": {
    "duration": 1800,
    "speed": 1,
    "easing": "standard",
    "loop": true,
    "direction": "normal",
    "delay": 0,
    "intensity": 0.7
  },
  "behavior": {
    "trigger": "automatic",
    "initialState": "processing",
    "states": ["idle", "processing", "success", "error"],
    "progressMode": "indeterminate",
    "reducedMotion": "static",
    "pauseWhenHidden": true
  },
  "accessibility": {
    "decorative": false,
    "ariaLabel": "Procesando documento",
    "stateLabels": {
      "processing": "Procesando documento",
      "success": "Documento procesado correctamente",
      "error": "Error al procesar el documento"
    }
  }
}
```

## Mapeo de parámetros a tokens CSS

| Parámetro `visual.*` | Token CSS |
| :--- | :--- |
| `primaryColor` *(obligatorio)* | `--motion-primary` |
| `secondaryColor` | `--motion-secondary` |
| `accentColor` | `--motion-accent` |
| `dangerColor` | `--motion-danger` |
| `backgroundColor` | `--motion-background` |
| `surfaceColor` | `--motion-surface` |
| `strokeColor` | `--motion-stroke` |
| `shadowColor` | `--motion-shadow` |

## API de interacción (`MotionController`)

Todos los recursos soportan el mismo controlador (`core/mdes-core.js`):
- Reproducción: `play()`, `pause()`, `restart()`, `reverse()`, `setSpeed(0.1..4)`
- Apariencia: `setColors({...})`, `resetColors()`, `setTheme('light'|'dark'|'brand')`, `setSize(w, h)`
- Estado y progreso: `setState('idle'|'processing'|'success'|'error'|'paused')`, `setProgress(0..1 | null)`
- Ciclo de vida: `destroy()` (cancela animaciones, desconecta `IntersectionObserver` y limpia listeners).

## Validación por CLI

```bash
node scripts/validate-config.mjs <ruta>/mdes.config.json
```
