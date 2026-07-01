@echo off
title SignaDoc Pro Launcher
echo ===================================================
echo   Memulai SignaDoc Pro - Document Signer...
echo ===================================================

set "APP_PATH=%~dp0index.html"
set "APP_URL=file:///%APP_PATH:\=/%"

:: Mencoba menjalankan dengan Microsoft Edge (App Mode - Tampilan Windows Native)
start "" msedge.exe --app="%APP_URL%" 2>nul
if %errorlevel% equ 0 goto end

:: Jika Microsoft Edge tidak ditemukan, coba dengan Google Chrome
start "" chrome.exe --app="%APP_URL%" 2>nul
if %errorlevel% equ 0 goto end

:: Jika keduanya tidak ada, buka dengan browser default standar
start "" "%APP_PATH%"

:end
exit
