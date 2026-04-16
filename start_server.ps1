#Requires -Version 5.1

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "    CAR AUTOMOTIVE WEBSITE SERVER" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Get IP address
$ipAddress = (Get-NetIPAddress | Where-Object { $_.AddressFamily -eq "IPv4" -and $_.InterfaceAlias -notlike "*Loopback*" } | Select-Object -First 1).IPAddress

Write-Host "Starting web server..." -ForegroundColor Green
Write-Host ""
Write-Host "Your website will be available at:" -ForegroundColor White
Write-Host "- Local:   http://localhost:8080/car.html" -ForegroundColor Green
Write-Host "- Network: http://$($ipAddress):8080/car.html" -ForegroundColor Green
Write-Host ""
Write-Host "Share this link with your friends: http://$($ipAddress):8080/car.html" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Red
Write-Host "============================================" -ForegroundColor Cyan

# Change to script directory
Set-Location $PSScriptRoot

# Try to start Python server
try {
    & python -m http.server 8080 --bind 0.0.0.0
} catch {
    Write-Host ""
    Write-Host "ERROR: Python not found!" -ForegroundColor Red
    Write-Host "Please install Python from: https://www.python.org/downloads/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: Use online hosting services like GitHub Pages or Netlify" -ForegroundColor Cyan
    Read-Host "Press Enter to exit"
}