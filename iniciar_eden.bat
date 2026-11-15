@echo off
setlocal
cd /d "%~dp0"

title PROJECT E.D.E.N. - Servidor Local

where npm >nul 2>nul
if errorlevel 1 (
  if exist "C:\Program Files\nodejs\npm.cmd" (
    set "PATH=C:\Program Files\nodejs;%PATH%"
  ) else (
    echo [ERROR] No se encontro Node.js / npm en el sistema.
    pause
    exit /b 1
  )
)

if not exist "node_modules" (
  echo Instalando dependencias por primera vez...
  call npm install
  if errorlevel 1 (
    echo [ERROR] Fallo la instalacion de dependencias.
    pause
    exit /b 1
  )
)

echo Iniciando PROJECT E.D.E.N. y abriendo el navegador...
echo (Deja esta ventana abierta mientras uses la app. Presiona Ctrl+C para detenerla.)
call npm run dev -- --open

if errorlevel 1 (
  echo.
  echo [ERROR] El servidor se detuvo con un error.
  pause
)
