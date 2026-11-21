---
name: support-db
description: Inspecciona y analiza el esquema de base de datos en tiempo real leyendo directamente los archivos de modelos ORM (como models.py en Django o entidades en SQLAlchemy/Prisma/TypeORM) y las migraciones del proyecto activo. Proporciona información verificada de nombres exactos de campos, tipos de datos, opciones de enums, relaciones foráneas (FK/M2M) y estado de migraciones aplicadas. Se invoca manualmente (/support-db [consulta]). Es de solo lectura.
---

# Soporte e Inspección Viva de Esquemas de Base de Datos

Esta skill responde consultas técnicas sobre el modelo de datos analizando directamente el código fuente y las migraciones activas en el repositorio, eliminando respuestas basadas en suposiciones o documentación desactualizada.

---

## Principio de Inspección Viva del Código Fuente

Los documentos de arquitectura a menudo quedan desfasados respecto a los cambios de esquema introducidos en ramas recientes. Esta skill:
1. **Nunca responde de memoria:** Localiza el archivo de modelo correspondiente en el repositorio y lee la definición exacta del campo o relación.
2. **Es de solo lectura:** No altera modelos, no ejecuta migraciones ni realiza operaciones DDL sobre la base de datos.

---

## Flujo de Consulta Paso a Paso

### Paso 1: Detección y Mapeo Dinámico de Modelos
Localizar las definiciones de datos en el backend del proyecto:
* **En proyectos Django:** Buscar en directorios con archivos `models.py`:
  ```bash
  # Localizar todos los modelos del proyecto
  git ls-files "*models.py" "**/*/models.py"
  ```
* **Búsqueda por entidad:** Si la consulta pregunta por un modelo específico (ej. `Orden`, `Usuario`, `Factura`), buscar su declaración de clase:
  ```bash
  grep -rnE "^class\s+<NombreModelo>\b" .
  ```

### Paso 2: Análisis Detallado del Modelo
Leer la clase identificada prestando atención a:
1. **Nombre exacto de campos:** Distinguir entre el atributo en el ORM y el nombre físico en base de datos (`db_column`).
2. **Tipos de datos y restricciones:** Longitudes máximas (`max_length`), valores nulos (`null=True`, `blank=True`), unicidad (`unique=True`) y valores por defecto (`default`).
3. **Catálogos y Enums (`choices`):** Extraer los valores permitidos y sus etiquetas legibles.
4. **Relaciones entre Entidades:**
   * `ForeignKey` y `OneToOneField`: Identificar el modelo de destino, la regla de borrado (`on_delete=CASCADE|PROTECT|SET_NULL`) y el nombre de relación inversa (`related_name`).
   * `ManyToManyField`: Identificar la tabla intermedia (`through`) si está personalizada.
5. **Comentarios de negocio:** Leer `db_comment` y `db_table_comment` para contextualizar el uso operativo de cada dato.

### Paso 3: Verificación de Estado de Migraciones
Comprobar si el modelo en código ya cuenta con su archivo de migración o si está pendiente de generarse:
* **En Django:**
  ```bash
  python manage.py showmigrations --list
  python manage.py makemigrations --dry-run
  ```
* Verificar si las migraciones del módulo están aplicadas (`[X]`) o pendientes (`[ ]`).

---

## Formato de Respuesta al Usuario

Al responder una consulta de esquema, estructurar la salida de forma concisa:

* **Modelo:** `<NombreModelo>` (`db_table='nombre_tabla_en_bd'`)
* **Ubicación:** `ruta/al/archivo/models.py:Línea`
* **Campos Relevantes:**
  * `campo_1` (`TipoDato`): Comentario o propósito / restricciones.
  * `campo_fk_id` (`ForeignKey` → `ModeloDestino`): Regla de borrado (`on_delete`), relación inversa.
* **Opciones Válidas (Choices):** Lista de enums permitidos si aplica.
* **Estado de Migración:** Sincronizado / Pendiente de migración.
