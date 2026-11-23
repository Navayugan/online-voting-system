@echo off
echo ========================================================
echo   RESETTING ONLINE VOTING SYSTEM DATABASE TO CLEAN STATE
echo ========================================================
echo.

cd /d "%~dp0..\server"
call npm run migrate

echo.
echo ========================================================
echo   DATABASE RESET COMPLETE!
echo   Open the app at http://localhost:3000 to create your Super Admin account.
echo ========================================================
pause
