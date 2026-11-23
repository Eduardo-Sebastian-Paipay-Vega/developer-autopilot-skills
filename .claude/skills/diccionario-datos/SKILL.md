---
name: diccionario-datos
description: Estandariza la documentación del esquema de base de datos directamente en el código fuente (modelos Django / ORM y comentarios PostgreSQL via db_table_comment y db_comment) y genera/actualiza el Diccionario de Datos del proyecto en Markdown y formato documental. Se invoca manualmente (/diccionario-datos) al crear o modificar tablas, campos o relaciones.
---

# Diccionario de Datos Automatizado desde Modelos y Base de Datos

Esta skill establece la regla de **fuente única de verdad** para el modelo de datos: la documentación de tablas, columnas y relaciones reside directamente en los metadatos y comentarios del modelo (ORM) y se traslada a la base de datos (PostgreSQL / SQL), desde donde se genera el Diccionario de Datos de forma automática. Tras actualizar comentarios o migraciones, sincroniza el snapshot vivo, el diagrama ER Mermaid y el historial `DB-XXXX` ejecutando `/db-guardian` (`autopilot bd registrar --motivo "..."`).

---

## Principio Fundamental: Comentarios Nativos en Base de Datos

Nunca redactar un diccionario de datos en documentos aislados que quedan desfasados al primer cambio de código.
* En **Django / PostgreSQL**, utilizar los atributos nativos:
  * `Meta.db_table_comment = 'Descripción del propósito de negocio de la tabla'`
  * `models.Field(db_comment='Descripción del campo, formato, unidades y valores válidos')`
* Estos comentarios se escriben directamente en el catálogo de PostgreSQL (`pg_description`) mediante las migraciones y son visibles en herramientas de administración como DataGrip, DBeaver o pgAdmin.

---

## Estándar de Comentarios de Negocio

### 1. Definición del Modelo
```python
from django.db import models

class OrdenCompra(models.Model):
    """Órdenes formalizadas emitidas por clientes institucionales."""

    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_column='codigo',
        db_comment='Identificador único alfanumérico de la orden.'
    )
    monto_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        db_column='monto_total',
        db_comment='Monto total de la orden expresado en moneda local, incluye impuestos.'
    )
    estado = models.CharField(
        max_length=20,
        db_column='estado',
        db_comment='Estado operativo: PENDIENTE, EN_PROCESO, COMPLETADO o ANULADO.'
    )
    fecha_registro = models.DateTimeField(
        auto_now_add=True,
        db_column='fecha_registro',
        db_comment='Fecha y hora exacta de registro en zona horaria UTC.'
    )

    class Meta:
        db_table = 'ordenes_compra'
        db_table_comment = 'Órdenes formalizadas emitidas por clientes institucionales.'
```

### 2. Reglas de Calidad para los Comentarios
* **Todas las columnas llevan `db_comment`:** Incluyendo claves foráneas (`ForeignKey`), fechas de auditoría y banderas booleanas.
* **Orientación al negocio:** Explicar qué representa el dato y para qué sirve en la operativa, no limitarse a repetir el nombre del campo.
* **Formatos y Unidades:** Especificar siempre monedas, zonas horarias, unidades de medida y catálogo de opciones válidas.

---

## Flujo de Actualización del Diccionario de Datos

### Paso 1: Creación o Modificación del Modelo
Al añadir un nuevo modelo o campos, asegurar que incluyan sus respectivos `db_table_comment` y `db_comment`.

### Paso 2: Generación de Migraciones
Generar la migración que aplica los comentarios a nivel de motor de base de datos:
```bash
python manage.py makemigrations <app>
```
Verificar que el archivo de migración contenga las operaciones `AlterModelTableComment` o declaraciones con `db_comment`.

### Paso 3: Generación del Diccionario en Markdown
Ejecutar el script o comando de extracción del proyecto (por ejemplo `python manage.py generar_diccionario_datos` o script de introspección del esquema):
* El comando recorre los modelos del proyecto.
* Extrae las tablas, comentarios, campos, tipos de datos y restricciones.
* Actualiza el archivo de referencia (habitualmente en `docs/arquitectura/diccionario-datos.md`).

### Paso 4: Exportación Documental (Opcional)
Si el proyecto cuenta con un generador a formato Word/PDF (mediante herramientas como `python-docx`, `jsreport` o `pandoc`), generar el entregable corporativo utilizando la plantilla y logotipo institucional del proyecto configurado.

---

## Checklist de Verificación
- [ ] La tabla y cada una de sus columnas tienen un comentario claro orientado al negocio.
- [ ] La migración de base de datos fue generada correctamente.
- [ ] El archivo Markdown del diccionario de datos refleja los nuevos cambios.
- [ ] No existen columnas huérfanas sin descripción en el esquema activo.
