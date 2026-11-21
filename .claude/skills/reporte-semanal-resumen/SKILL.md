---
name: reporte-semanal-resumen
description: Genera el resumen ejecutivo del informe semanal de avance para cualquier desarrollador y equipo, extrayendo los logros directamente desde el historial de Git (domingo a sábado). Traduce commits técnicos y zonas de código a lenguaje de gestión y negocio, resumiendo avances previos, tareas concluidas en el período, trabajo en curso y próximos hitos. Se invoca manualmente (/reporte-semanal-resumen [fecha opcional]).
---

# Generador de Reporte Semanal de Avance desde Git

Esta skill automatiza la redacción del reporte periódico de avance de desarrollo individual o de equipo, leyendo los commits reales de la persona en Git y traduciendo la actividad técnica a un lenguaje claro orientado a objetivos de negocio y gerencia.

---

## Principios del Reporte

1. **Basado en evidencia real:** Todo dato proviene de commits reales registrados en Git durante el período. No se inventan tareas ni se estiman avances sin respaldo en el repositorio.
2. **Lenguaje orientado a valor/negocio:** Evitar jerga de implementación (ej. en lugar de *"refactoricé el serializer y añadí un índice en PostgreSQL"*, redactar *"Se optimizó el tiempo de respuesta en la consulta de pedidos y se aseguró la integridad de datos"*).
3. **Semana estándar:** Ciclo de domingo a sábado por fecha de autoría de los commits.
4. **Desacoplado y configurable:** Lee el usuario activo desde `git config user.name` / `user.email` o desde la configuración de equipo en `toolkit.config.json`.

---

## Procedimiento de Generación

### Paso 1: Recolección Automatizada de Actividad
Ejecutar el script extractor de la skill:
```bash
python .claude/skills/reporte-semanal-resumen/recolectar.py [AAAA-MM-DD]
```
*(Si no se especifica fecha, toma la semana en curso).*

El script reporta:
* Identidad del desarrollador y período evaluado.
* Commits del período actual clasificados por zonas de la aplicación (`front:<modulo>`, `back:<modulo>`, etc.).
* Commits del período anterior para contexto comparativo.
* Archivos modificados sin commitear en el working tree local.
* Planes o roadmaps técnicos tocados.

### Paso 2: Redacción del Resumen Ejecutivo
Estructurar la salida directamente en el chat para copiar y pegar en el documento o canal de seguimiento del equipo:

```markdown
### INFORME SEMANAL DE AVANCE
**Responsable:** <Nombre del Desarrollador>
**Período:** <Fecha Inicio> al <Fecha Fin>

#### 1. Principales Avances Concluidos en el Período
* **<Módulo / Área A>:** Descripción en lenguaje funcional de lo que ahora puede hacer el usuario o el sistema (ej. *"Habilitación del flujo de aprobación de presupuestos con notificaciones por correo"*).
* **<Módulo / Área B>:** Mejora de rendimiento, corrección operativa o nueva pantalla desplegada.

#### 2. Tareas en Progreso (Working Tree / En Desarrollo)
* Descripción breve del módulo o funcionalidad que se encuentra en desarrollo activo en la rama local.

#### 3. Próximos Pasos (Siguiente Semana)
* Metas concretas planificadas para el siguiente ciclo según la prioridad del roadmap.

#### 4. Bloqueos o Dependencias Externas (Si existen)
* Servicios de terceros, aprobaciones de cliente o credenciales requeridas para continuar.
```

---

## Checklist de Verificación
- [ ] El reporte refleja únicamente el trabajo del desarrollador en el rango de fechas evaluado.
- [ ] Las descripciones son comprensibles para líderes de proyecto y directores sin requerir lectura de código.
- [ ] No se exponen nombres de variables internas, rutas de archivos ni hashes de commit en el texto final.
