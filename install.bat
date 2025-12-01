@echo off
REM Cursor Contexts Extension - Quick Install Script for Windows
REM =============================================================

echo.
echo  Cursor Contexts Extension Installer
echo ======================================
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo  X npm is not installed. Please install Node.js first.
    echo    Visit: https://nodejs.org/
    pause
    exit /b 1
)

echo  + npm found
echo.

REM Install dependencies
echo  Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo  X Failed to install dependencies
    pause
    exit /b 1
)

echo  + Dependencies installed
echo.

REM Compile TypeScript
echo  Compiling TypeScript...
call npm run compile

if %errorlevel% neq 0 (
    echo  X Failed to compile TypeScript
    pause
    exit /b 1
)

echo  + Compilation complete
echo.

REM Ask about vsce installation
set /p install_vsce="Install vsce for packaging? (y/n): "
if /i "%install_vsce%"=="y" (
    echo Installing vsce globally...
    call npm install -g @vscode/vsce
    echo  + vsce installed
)

echo.
echo  ============================================
echo   Installation Complete!
echo  ============================================
echo.
echo  Next steps:
echo  1. Open VS Code/Cursor in this directory
echo  2. Press F5 to launch the extension
echo  3. Look for the 'Contexts' icon in the Activity Bar
echo.
echo  To package the extension:
echo    vsce package
echo.
echo  Happy coding!
echo.
pause
