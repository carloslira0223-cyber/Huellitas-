# Datos persistentes de Huellitas

Huellitas guarda usuarios, mascotas, reportes, solicitudes, favoritos, notificaciones y puntajes en PostgreSQL cuando existe la variable `DATABASE_URL`.

## Activacion en Render

1. Crea una base de datos PostgreSQL en Render.
2. Copia su URL de conexion interna.
3. En el servicio web de Huellitas abre **Environment** y crea `DATABASE_URL` con esa URL.
4. Guarda y realiza un nuevo despliegue.

No pongas la URL de la base de datos, contrasenas ni claves en GitHub.

## Comprobacion

Abre:

```
https://huellitas-vi7v.onrender.com/api/health
```

La configuracion quedo lista cuando el resultado incluya:

```json
"storage": {
  "provider": "postgresql",
  "persistent": true
}
```

## Respaldos

- Cada cambio se sincroniza con PostgreSQL.
- Huellitas conserva hasta 30 copias automaticas del estado en la misma base de datos.
- El modo administrador mantiene la opcion de exportar y restaurar un respaldo manual.

Sin `DATABASE_URL`, Render puede borrar los archivos temporales al reiniciar el servicio.