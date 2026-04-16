# AutoTranslate Pro - Setup and Run Script
# Simple version - just run the server with npm

Write-Host "================================" -ForegroundColor Cyan
Write-Host "AutoTranslate Pro - Setup Script" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "MANUAL INSTALLATION REQUIRED:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://nodejs.org/ (LTS version)" -ForegroundColor White
    Write-Host "2. Run the installer, select 'Add to PATH'" -ForegroundColor White
    Write-Host "3. Restart this terminal" -ForegroundColor White
    Write-Host "4. Run this script again" -ForegroundColor White
    Write-Host ""
    Exit 1
}

# Create .env file
$envFile = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    @"
ADMIN_ACCESS_KEY=QuyenLinhFPT2026
FEEDBACK_DB_TYPE=local
PORT=8080
"@ | Out-File $envFile -Encoding UTF8
    Write-Host "✅ .env file created" -ForegroundColor Green
}

# Install dependencies
Write-Host ""
Write-Host "Installing npm packages..." -ForegroundColor Yellow
npm install 2>&1 | Select-Object -Last 5

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed" -ForegroundColor Red
    Exit 1
}

Write-Host "✅ Dependencies ready!" -ForegroundColor Green

# Start server
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Starting Server on Port 8080" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 http://localhost:8080/admin.html" -ForegroundColor Green
Write-Host "🔑 Key: QuyenLinhFPT2026" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Red
Write-Host ""

$env:PORT = 8080
node server.js
