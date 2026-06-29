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
- Modo demo, respaldo e importacion controlada.
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

Para usarlo en varios celulares dentro de la misma red Wi-Fi, abre la pagina desde la IP de la computadora que tiene prendido el servidor:

```txt
http://IP-DE-LA-COMPU:3000
```

### GitHub Pages con servidor externo

GitHub Pages muestra la pagina, pero no ejecuta `server.js`. Para que las cuentas, solicitudes, reportes, favoritos y mensajes se compartan entre celulares/compus:

1. Sube o ejecuta `server.js` en una compu/hosting que quede accesible por URL.
2. Abre Huellitas en GitHub Pages.
3. En Ajustes, pega la URL del servidor en `Servidor de datos`.
4. Inicia sesion o crea cuentas desde la pagina.

El servidor incluye CORS para que GitHub Pages pueda conectarse. Puedes copiar `server-config.example.json` como `server-config.json` si quieres limitar origenes permitidos.

#### Configuracion recomendada en Render

- Tipo: Web Service.
- Repositorio: `Huellitas-`.
- Runtime/Language: Node.
- Build command: `npm install`.
- Start command: `npm start`.
- Health check path: `/api/health`.
- Variable opcional: `ALLOWED_ORIGINS=https://carloslira0223-cyber.github.io`.
- Para datos persistentes: crea un disco y usa `DATA_DIR` apuntando a la carpeta montada, por ejemplo `/var/data`.

## Respaldo de datos

En el panel admin:

- `Exportar respaldo`: descarga un archivo `.json` con datos de Huellitas del navegador. Si el servidor local esta activo, tambien incluye la base local.
- `Importar respaldo`: restaura un archivo generado por Huellitas.
- Las opciones de restaurar base y reiniciar sitio se retiraron del panel para evitar borrados accidentales.

## Admin seguro

El acceso admin se valida en `server.js` y la clave no se guarda en el navegador. En el hosting configura la variable secreta `HUELLITAS_ADMIN_PASSWORD`; no escribas esa clave en archivos del repositorio. Las sesiones administrativas caducan y los intentos fallidos tienen limite.

Sin el servidor activo no se habilitan acciones administrativas. Los visitantes solo reciben datos publicos; solicitudes, correos, respaldos y bandeja interna requieren una sesion admin valida.

## Sugerencias de capturas para entrega

- Inicio con panel de impacto.
- Adopciones con tarjetas y filtros.
- Perfil abierto con pestanas.
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


## App instalable

Huellitas incluye `manifest.webmanifest` y `sw.js`. En navegadores compatibles aparecera la opcion **Instalar Huellitas** en el footer. El modo sin conexion conserva la pantalla de respaldo y recursos visitados; las acciones que usan el servidor siguen necesitando internet.

## Derechos de autor

Copyright (c) 2026 Carlos Alexis Lira Alcala. Todos los derechos reservados.

No se concede permiso para copiar, modificar, distribuir o presentar Huellitas como un proyecto propio. Consulta `LICENSE` y `AVISO_DERECHOS.md`.
