# Start Development Servers
# This script helps you start both the frontend and Azure Functions

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Vacation Management - Dev Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Azure Functions Core Tools is installed
$funcVersion = & func --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Azure Functions Core Tools not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Azure Functions Core Tools:" -ForegroundColor Yellow
    Write-Host "  https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✅ Azure Functions Core Tools found: $funcVersion" -ForegroundColor Green
Write-Host ""

# Check if api/local.settings.json exists
if (-not (Test-Path "api/local.settings.json")) {
    Write-Host "❌ api/local.settings.json not found!" -ForegroundColor Red
    Write-Host "   Please create this file with your database credentials." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✅ Configuration files found" -ForegroundColor Green
Write-Host ""
Write-Host "Starting development servers..." -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Instructions:" -ForegroundColor Yellow
Write-Host "   1. Azure Functions will start in this window" -ForegroundColor White
Write-Host "   2. Open a NEW terminal and run: npm run dev" -ForegroundColor White
Write-Host "   3. Frontend will be at: http://localhost:5173" -ForegroundColor White
Write-Host "   4. API will be at: http://localhost:7071" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop Azure Functions" -ForegroundColor Gray
Write-Host ""

# Start Azure Functions
Set-Location api
func start

