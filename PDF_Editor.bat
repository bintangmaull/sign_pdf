@echo off
title PDF Editor Pro - Launcher Windows
cls
echo ====================================================================
echo   MEMULAI PDF EDITOR PRO WINDOWS...
echo ====================================================================
echo.
echo Sedang menyiapkan mode desktop aplikasi offline...
echo.

set "HTML_PATH=%~dp0index.html"

:: Coba jalankan menggunakan Microsoft Edge dalam mode Aplikasi Desktop (tanpa address bar)
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="file:///%HTML_PATH%" --window-size=1280,800
    goto end
)

if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" --app="file:///%HTML_PATH%" --window-size=1280,800
    goto end
)

:: Coba jalankan menggunakan Google Chrome dalam mode Aplikasi Desktop
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app="file:///%HTML_PATH%" --window-size=1280,800
    goto end
)

if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --app="file:///%HTML_PATH%" --window-size=1280,800
    goto end
)

:: Jika Edge dan Chrome tidak ada, buka dengan default browser standar Windows
start "" "%HTML_PATH%"

:end
echo Aplikasi telah terbuka! Anda dapat menutup jendela terminal ini.
timeout /t 3 >nul
exit
