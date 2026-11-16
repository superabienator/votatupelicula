@echo off
title VotaTuPelicula - Modo Demo Local
cd /d "%~dp0"
echo ====================================================
echo   Iniciando VotaTuPelicula (Modo Demo Local)...
echo   Se abrira automaticamente en http://localhost:5173
echo   Clave del Panel Profesorado: demo1234
echo ====================================================
start "" "http://localhost:5173"
npm run dev
pause
