# Adaptadores de frameworks (MDES)

El núcleo (`mdes-base.css` + `mdes-core.js`) **no depende de ningún framework**. Cada adaptador es una envoltura fina que monta el HTML/SVG, crea `MotionController` al montarse, sincroniza props/inputs y llama a `destroy()` al desmontarse.

## 1. Vanilla JS

```js
import { MotionController } from './core/mdes-core.js';
const ctrl = new MotionController(document.getElementById('mi-anim'), config);
// Limpieza: ctrl.destroy();
```

## 2. Angular 20.2+ / 21 (Standalone + Signals + CSS nativo)

> No usar `@angular/animations` (deprecado en Angular v20.2). Para entrada/salida del contenedor usa `animate.enter` y `animate.leave` con clases CSS nativas.

```ts
import { Component, ElementRef, effect, input, viewChild, DestroyRef, inject, afterNextRender } from '@angular/core';
import { MotionController } from './mdes-core';

@Component({
  selector: 'app-mdes-motion',
  standalone: true,
  template: `
    <div #host class="mdes mdes-doc" animate.enter="mdes-fade-in" animate.leave="mdes-fade-out">
      <!-- SVG del recurso -->
    </div>
  `,
})
export class MdesMotionComponent {
  readonly state = input<'idle' | 'processing' | 'success' | 'error'>('processing');
  readonly speed = input(1);
  readonly primaryColor = input<string | undefined>(undefined);
  readonly host = viewChild.required<ElementRef<HTMLElement>>('host');

  private ctrl?: MotionController;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.ctrl = new MotionController(this.host().nativeElement, config);
      destroyRef.onDestroy(() => this.ctrl?.destroy());
    });
    effect(() => this.ctrl?.setState(this.state()));
    effect(() => this.ctrl?.setSpeed(this.speed()));
    effect(() => { const c = this.primaryColor(); if (c) this.ctrl?.setColors({ primaryColor: c }); });
  }
}
```

## 3. React / Next.js (Client Component)

En Next.js App Router, añade `'use client';` en la primera línea cuando el recurso use `MotionController` o interactividad. Las animaciones puramente CSS (`svg-css` sin controlador) pueden renderizarse en Server Components.

```tsx
'use client';
import { useEffect, useRef } from 'react';
import { MotionController } from './mdes-core';

export function MdesMotion({ state = 'processing', speed = 1, primaryColor, config }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const ctrlRef = useRef<MotionController | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    ctrlRef.current = new MotionController(ref.current, config);
    return () => { ctrlRef.current?.destroy(); ctrlRef.current = null; };
  }, [config]);

  useEffect(() => { ctrlRef.current?.setState(state); }, [state]);
  useEffect(() => { ctrlRef.current?.setSpeed(speed); }, [speed]);
  useEffect(() => { if (primaryColor) ctrlRef.current?.setColors({ primaryColor }); }, [primaryColor]);

  return <div ref={ref} className="mdes mdes-doc">{/* SVG del recurso */}</div>;
}
```

## 4. Vue 3 (`<script setup>`)

```vue
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { MotionController } from './mdes-core';
const props = defineProps<{ state?: string; speed?: number; primaryColor?: string; config: object }>();
const root = ref<HTMLElement | null>(null);
let ctrl: MotionController | null = null;
onMounted(() => { if (root.value) ctrl = new MotionController(root.value, props.config); });
onUnmounted(() => { ctrl?.destroy(); ctrl = null; });
watch(() => props.state, (s) => s && ctrl?.setState(s));
watch(() => props.speed, (v) => v && ctrl?.setSpeed(v));
watch(() => props.primaryColor, (c) => c && ctrl?.setColors({ primaryColor: c }));
</script>
<template><div ref="root" class="mdes"><!-- SVG --></div></template>
```

## 5. Web Component (reutilizable en cualquier stack)

```js
class MdesElement extends HTMLElement {
  static observedAttributes = ['state', 'speed', 'theme', 'primary-color'];
  connectedCallback() { this.ctrl = new MotionController(this, this._config); }
  disconnectedCallback() { this.ctrl?.destroy(); }
  attributeChangedCallback(name, _, val) {
    if (!this.ctrl || val == null) return;
    if (name === 'state') this.ctrl.setState(val);
    if (name === 'speed') this.ctrl.setSpeed(Number(val));
    if (name === 'theme') this.ctrl.setTheme(val);
    if (name === 'primary-color') this.ctrl.setColors({ primaryColor: val });
  }
}
```
