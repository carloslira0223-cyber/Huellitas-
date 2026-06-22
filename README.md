# Huellitas

Huellitas es una pagina web escolar tipo plataforma para conciencia animal, adopcion responsable y seguimiento de reportes. Incluye perfil de usuario, solicitudes de adopcion, panel admin, directorio, notificaciones, mascota virtual y minijuegos.

## Funciones principales

- Inicio con panel de impacto y accesos rapidos.
- Adopciones con filtros, favoritos, ficha de mascota y solicitud.
- Perfil con favoritos, solicitudes, reportes, logros, buzon y mascota virtual.
- Mascota virtual por usuario con nombre, nivel, patitas, inventario y accesorios.
- Arcade Perruno con minijuegos y tabla de mejores usuarios con foto.
- Directorio de centros y secciones informativas.
- Panel admin con solicitudes, reportes, citas, mensajes, mascotas, calendario, estadisticas y estado del sistema.
- Exportar/importar respaldo en JSON.
- Modo demo, restaurar base y reinicio total.
- Modo oscuro y vista movil.

## Como abrir la pagina

### Opcion rapida

Abre `pagina.html` en el navegador. Esta opcion funciona bien para GitHub Pages y guarda datos en el navegador con `localStorage`.

### Opcion con servidor local

Ejecuta `iniciar-huellitas.bat` y abre:

```txt
http://localhost:3000
```

Con servidor local, la pagina tambien puede guardar informacion compartida en:

```txt
data/huellitas-db.json
```

### GitHub Pages con servidor externo

GitHub Pages muestra la pagina, pero no ejecuta `server.js`. Para que las cuentas, solicitudes, reportes, favoritos y mensajes se compartan entre celulares/compus:

1. Sube o ejecuta `server.js` en una compu/hosting que quede accesible por URL.
2. Abre Huellitas en GitHub Pages.
3. En Ajustes, pega la URL del servidor en `Servidor de datos`.
4. Inicia sesion o crea cuentas desde la pagina.

El servidor incluye CORS para que GitHub Pages pueda conectarse. Puedes copiar `server-config.example.json` como `server-config.json` si quieres limitar origenes permitidos.

## Respaldo de datos

En el panel admin:

- `Exportar respaldo`: descarga un archivo `.json` con datos de Huellitas del navegador. Si el servidor local esta activo, tambien incluye la base local.
- `Importar respaldo`: restaura un archivo generado por Huellitas.
- `Restaurar base`: limpia datos de uso, conserva usuarios/sesion y regresa la configuracion visual inicial.
- `Reiniciar sitio`: borra todo. Usar solo cuando ya exista respaldo.

## Admin

El acceso admin esta reservado para el equipo. Por seguridad, no se escribe la clave en este README si el proyecto se sube a GitHub. Compartanla solo de forma privada entre ustedes.

## Sugerencias de capturas para entrega

- Inicio con panel de impacto.
- Adopciones con tarjetas y filtros.
- Perfil abierto con pestañas.
- Mi adopcion con progreso.
- Arcade Perruno con la mascota virtual.
- Panel admin con calendario, estado del sistema y graficas.
- Modo oscuro.
- Vista movil.

## Estructura importante

```txt
pagina.html              Inicio
adopcion_huellitas.html  Galeria de adopciones
adoptar.html             Solicitud de adopcion
mi_adopcion.html         Seguimiento del usuario
jueguitos.html           Mascota virtual y minijuegos
directorio.html          Centros y mapa/directorio
equipo.html              Panel admin
huellitas.css            Diseno global
huellitas.js             Funciones compartidas
server.js                Servidor local y API
assets/                  Imagenes, sprites y sonidos
data/huellitas-db.json   Base local cuando se usa servidor
```

## Nota para GitHub Pages

La pagina funciona de forma estatica y usa `index.html` como entrada. Si no configuras un servidor de datos, guarda datos en el navegador. Si configuras `Servidor de datos` en Ajustes, sincroniza con `server.js`.
