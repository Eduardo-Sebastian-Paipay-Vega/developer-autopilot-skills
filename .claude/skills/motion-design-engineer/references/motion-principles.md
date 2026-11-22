# Principios de Motion Design (aplicados a interfaces)

## 1. Los 10 principios operativos

| Principio | Qué significa en UI | Cómo se implementa en MDES |
| :--- | :--- | :--- |
| **Anticipación** | Preparar la acción para que no sorprenda. | Pequeño movimiento contrario (−2 a −4 % de escala o 2–4 px) antes del movimiento principal; curva `--motion-ease-anticipate`. |
| **Timing** | La duración comunica peso e importancia. | Escala de duraciones (abajo). Objetos grandes = más lentos. |
| **Easing** | Nada en el mundo real se mueve linealmente. | Tokens `--motion-ease-*`. `linear` solo para rotaciones continuas y desplazamientos de fondo infinitos. |
| **Stagger** | Elementos de un grupo entran escalonados. | `animation-delay: calc(var(--motion-duration) * <fracción> * i)`; 40–120 ms entre elementos. |
| **Follow-through** | Las partes siguen moviéndose un poco tras detenerse el cuerpo. | Keyframe de rebote leve (overshoot ≤ 8 %) o `--motion-ease-emphasized`. |
| **Movimiento secundario** | Detalles que acompañan sin robar protagonismo. | Brillos, sombras, partículas con menor amplitud y opacidad. |
| **Acción superpuesta** | Las partes no empiezan ni terminan a la vez. | Desfasar inicios 10–25 % del ciclo. |
| **Consistencia** | Misma lógica de movimiento en todo el producto. | Reutilizar tokens; no inventar curvas por recurso. |
| **Jerarquía** | El elemento principal capta la atención primero. | Protagonista: mayor amplitud y contraste. Secundarios: ≤ 50 % de amplitud. |
| **Feedback / Continuidad** | Cada acción tiene respuesta y no hay saltos entre estados. | Transiciones entre `data-motion-state`; nunca cambiar de forma abrupta salvo errores críticos. |

## 2. Escala de duraciones

| Token | Valor | Uso |
| :--- | :--- | :--- |
| `--motion-dur-instant` | 100 ms | Hover, press, cambios de color. |
| `--motion-dur-fast` | 200 ms | Iconos, toggles, check pequeño. |
| `--motion-dur-base` | 320 ms | Entradas/salidas de componentes, pop de insignias. |
| `--motion-dur-slow` | 560 ms | Objetos grandes, cambios de escena, apertura de libro/carpeta. |
| `--motion-dur-loop` | `--motion-duration` (1200–2400 ms típico) | Ciclos de espera (loaders, procesos). |

Guía: salidas ≈ 70–80 % de la duración de la entrada. Bucles de espera: 1,2–2,4 s por ciclo (más rápido se percibe ansioso, más lento se percibe colgado).

## 3. Curvas

| Token | Curva | Uso |
| :--- | :--- | :--- |
| `--motion-ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Movimiento general dentro de la pantalla. |
| `--motion-ease-enter` | `cubic-bezier(0, 0, 0.2, 1)` | Elementos que aparecen (desaceleran al llegar). |
| `--motion-ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Elementos que salen (aceleran al irse). |
| `--motion-ease-emphasized` | `cubic-bezier(0.3, 0, 0, 1.3)` | Pop con overshoot: check, insignias, éxito. |
| `--motion-ease-anticipate` | `cubic-bezier(0.6, -0.28, 0.74, 0.05)` | Preparación antes de un salto. |
| `--motion-ease-loop` | `cubic-bezier(0.45, 0, 0.55, 1)` | Flotación, respiración, ida y vuelta. |
| `linear` | — | Rotación continua, scroll infinito de fondo, ruedas. |

## 4. Intensidad y amplitud

Toda amplitud se multiplica por `--motion-intensity` (0..1):

```css
@keyframes mdes-float {
  50% { transform: translateY(calc(-6px * var(--motion-intensity))); }
}
```

Así un mismo recurso sirve para una landing (`intensity: 1`) y para un panel administrativo sobrio (`intensity: 0.3`), y el modo `reducedMotion: "minimal"` baja la amplitud sin reescribir nada.

## 5. Estados

Estados estándar: `idle`, `processing`, `success`, `error`, `paused` (atributo `data-motion-state` en la raíz).

- `processing → success`: detener bucle, transición de cierre con `--motion-ease-emphasized` (≤ 560 ms), mantener frame final.
- `processing → error`: sacudida corta (2 oscilaciones, ≤ 400 ms, amplitud ≤ 4 px) y color `--motion-danger`. Nunca bucle infinito de error.
- El estado debe ser comprensible sin movimiento: forma (check/cruz) + color + texto accesible.
