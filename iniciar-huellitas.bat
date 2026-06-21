@echo off
cd /d "%~dp0"
set NODE_EXE=
set LOCAL_NODE=%~dp0node\node.exe
set CODEX_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe

if exist "%LOCAL_NODE%" (
    set NODE_EXE=%LOCAL_NODE%
)

if "%NODE_EXE%"=="" if exist "%CODEX_NODE%" (
    set NODE_EXE=%CODEX_NODE%
)

if "%NODE_EXE%"=="" (
    where node >nul 2>nul
    if not errorlevel 1 (
        set NODE_EXE=node
    )
)

if "%NODE_EXE%"=="" (
    echo No se encontro Node.js en esta computadora.
    echo Se abrira Huellitas en modo normal, sin base de datos del servidor.
    echo.
    echo Para activar login seguro y correos reales, instala Node.js o copia Node portable en la carpeta node.
    start "" "%~dp0app.html"
    pause
    exit /b
)

start "" cmd /c "timeout /t 2 >nul && start http://localhost:3000"
echo Iniciando Huellitas con base de datos local...
echo No cierres esta ventana mientras uses la pagina.
"%NODE_EXE%" server.js
pause
