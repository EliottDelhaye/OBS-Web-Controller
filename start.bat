@echo off
echo ================================
echo   OBS Controller - Demarrage
echo ================================
echo.

REM Vérification que Node.js est installé
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERREUR: Node.js n'est pas installé ou pas dans le PATH
    echo Téléchargez Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

REM Vérification que les dépendances sont installées
if not exist node_modules (
    echo Installation des dépendances...
    npm install
    if %errorlevel% neq 0 (
        echo ERREUR: Échec de l'installation des dépendances
        pause
        exit /b 1
    )
)

REM Affichage des informations réseau
echo Démarrage du serveur OBS Controller...
echo.
echo Accès local : http://localhost:3000
echo.
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"Adresse IPv4"') do (
    set ip=%%a
    setlocal enabledelayedexpansion
    set ip=!ip: =!
    echo Accès réseau : http://!ip!:3000
    endlocal
)

echo.
echo IMPORTANT:
echo 1. Assurez-vous qu'OBS Studio est démarré
echo 2. Vérifiez que WebSocket est activé dans OBS
echo 3. Ouvrez un navigateur et allez sur l'une des adresses ci-dessus
echo.
echo Appuyez sur Ctrl+C pour arrêter le serveur
echo ================================
echo.

REM Démarrage du serveur
npm start