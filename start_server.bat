@echo off
echo ============================================
echo    CAR AUTOMOTIVE WEBSITE SERVER
echo ============================================
echo.
echo Starting web server on port 8080...
echo.
echo Your website will be available at:
echo - Local: http://localhost:8080/car.html
echo - Network: http://YOUR_IP_ADDRESS:8080/car.html
echo.
echo To find your IP address, run: ipconfig
echo.
echo Press Ctrl+C to stop the server
echo ============================================

REM Try Python first
python -m http.server 8080 --bind 0.0.0.0 2>nul
if %errorlevel% neq 0 (
    REM If Python fails, try Node.js
    npx http-server -p 8080 -a 0.0.0.0 2>nul
    if %errorlevel% neq 0 (
        REM If Node.js fails, try PHP
        php -S 0.0.0.0:8080 2>nul
        if %errorlevel% neq 0 (
            echo.
            echo ERROR: No web server found!
            echo Please install one of the following:
            echo - Python: https://www.python.org/downloads/
            echo - Node.js: https://nodejs.org/
            echo - PHP: https://windows.php.net/download/
            echo.
            echo Or use online hosting services.
            pause
        )
    )
)