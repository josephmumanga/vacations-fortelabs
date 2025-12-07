# Test Signup Endpoint Locally
# Make sure Azure Functions are running first: cd api; func start

Write-Host "=== Testing Signup Endpoint Locally ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:7071"
$testEmail = "test$(Get-Random)@forteinnovation.mx"
$testPassword = "TestPassword123!"

Write-Host "Test Email: $testEmail" -ForegroundColor Yellow
Write-Host "Test Password: $testPassword" -ForegroundColor Yellow
Write-Host ""

$signupBody = @{
    email = $testEmail
    password = $testPassword
    name = "Test User $(Get-Date -Format 'HH:mm:ss')"
} | ConvertTo-Json

Write-Host "Sending request to: $baseUrl/api/auth/signup" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/signup" -Method Post -Body $signupBody -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "✅✅✅ SIGNUP SUCCESS! ✅✅✅" -ForegroundColor Green
    Write-Host ""
    Write-Host "User ID: $($response.user.id)" -ForegroundColor Cyan
    Write-Host "Email: $($response.user.email)" -ForegroundColor Cyan
    Write-Host "Profile Name: $($response.profile.name)" -ForegroundColor Cyan
    Write-Host "Role: $($response.profile.role)" -ForegroundColor Cyan
    Write-Host "Token (first 50 chars): $($response.token.Substring(0, 50))..." -ForegroundColor Gray
    Write-Host ""
    Write-Host "✅ Test passed! You can now deploy to production." -ForegroundColor Green
    
} catch {
    Write-Host "❌ SIGNUP FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($errorObj) {
            Write-Host "Error: $($errorObj.error)" -ForegroundColor Red
            if ($errorObj.details) {
                Write-Host "Details: $($errorObj.details)" -ForegroundColor Yellow
            }
            if ($errorObj.code) {
                Write-Host "Code: $($errorObj.code)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "⚠️  Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Make sure Azure Functions are running: cd api; func start" -ForegroundColor White
    Write-Host "   2. Check if port 7071 is accessible" -ForegroundColor White
    Write-Host "   3. Verify database firewall allows your IP" -ForegroundColor White
    Write-Host "   4. Check Azure Functions console for detailed error logs" -ForegroundColor White
}

