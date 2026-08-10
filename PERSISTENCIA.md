# Datos persistentes de Huellitas

Huellitas guarda usuarios, mascotas, reportes, solicitudes, favoritos, notificaciones y puntajes en PostgreSQL cuando existe la variable `DATABASE_URL`.

## Activacion recomendada en Render

Este repositorio ya incluye la base y su conexión interna dentro de `render.yaml`, sin publicar contraseñas.

1. En el panel de Render abre el servicio o proyecto de Huellitas.
2. Sincroniza el Blueprint del repositorio para aplicar el archivo `render.yaml`.
3. Render creará o enlazará `huellitas-db` y entregará su conexión interna al servicio como `DATABASE_URL`.
4. Espera a que termine el despliegue y abre la comprobación de abajo.

Si el servicio actual no está administrado por Blueprint, crea una base PostgreSQL en la misma región y agrega manualmente la variable `DATABASE_URL` desde **Environment**. No pongas la URL de la base de datos, contraseñas ni claves en GitHub.

## Comprobacion

Abre:

```
https://huellitas-vi7v.onrender.com/api/health
```

La configuración quedó lista cuando el resultado incluya:

```json
"storage": {
  "provider": "postgresql",
  "persistent": true
}
```


## Seguridad del modo administrador

En **Environment** de Render agrega también `ADMIN_PASSWORD_HASH` con el hash SHA-256 de una contraseña nueva y privada. Esa variable reemplaza la clave de respaldo del proyecto sin dejar la contraseña escrita en GitHub.

- Elige una contraseña distinta de `huellitas0524`.
- No uses `ADMIN_PASSWORD` ni escribas la contraseña en texto normal.
- Guarda la variable solo en Render y vuelve a desplegar el servicio.

## Respaldos

- Cada cambio se sincroniza con PostgreSQL.
- Huellitas conserva hasta 30 copias automáticas del estado en la misma base de datos.
- El modo administrador mantiene la opción de exportar y restaurar un respaldo manual.

Sin `DATABASE_URL`, Render puede borrar los archivos temporales al reiniciar el servicio.
