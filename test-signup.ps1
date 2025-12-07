# Test Signup API
# This script tests the signup endpoint directly

Write-Host "Testing Signup API..." -ForegroundColor Cyan
Write-Host ""

$body = @{
    email = "centro.id@forteinnovation.mx"
    password = "admin123"
    name = "Centro ID"
    role = "Admin"
} | ConvertTo-Json

try {
    Write-Host "Sending request to: http://localhost:7071/api/auth/signup" -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "http://localhost:7071/api/auth/signup" -Method POST -ContentType "application/json" -Body $body
    
    Write-Host ""
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
    
    if ($response.token) {
        Write-Host ""
        Write-Host "Token received: $($response.token.Substring(0, 20))..." -ForegroundColor Green
    }
    
    if ($response.user) {
        Write-Host ""
        Write-Host "User created:" -ForegroundColor Cyan
        Write-Host "  ID: $($response.user.id)" -ForegroundColor White
        Write-Host "  Email: $($response.user.email)" -ForegroundColor White
    }
    
    if ($response.profile) {
        Write-Host ""
        Write-Host "Profile created:" -ForegroundColor Cyan
        Write-Host "  Name: $($response.profile.name)" -ForegroundColor White
        Write-Host "  Role: $($response.profile.role)" -ForegroundColor White
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ ERROR!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Error Message: $($errorDetails.error)" -ForegroundColor Red
        if ($errorDetails.details) {
            Write-Host "Details: $($errorDetails.details)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure Azure Functions is running: cd api && func start" -ForegroundColor White
    Write-Host "2. Check if the endpoint is accessible: http://localhost:7071/admin/functions" -ForegroundColor White
    Write-Host "3. Verify function.json files are correct" -ForegroundColor White
}

