# Complete GitHub Deployment
# Repository: https://github.com/josephmumanga/vacations-fortelabs

Write-Host "=== Completing GitHub Deployment ===" -ForegroundColor Green

# Add remote and push
Write-Host "`n1. Adding remote and pushing code..." -ForegroundColor Yellow
git remote add origin https://github.com/josephmumanga/vacations-fortelabs.git 2>$null
git remote set-url origin https://github.com/josephmumanga/vacations-fortelabs.git
git branch -M main
git push -u origin main

# Add deployment secret
Write-Host "`n2. Adding deployment token secret..." -ForegroundColor Yellow
$token = "d750df013e5e960526cbc5862128cc996e71bbebdddde3b68212bbdf0f4b3f2003-34740af1-a04b-4b95-80a8-341773fcc7eb00f0322049f4f80f"
gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --body $token

Write-Host "`n✅ Deployment setup complete!" -ForegroundColor Green
Write-Host "Check actions: https://github.com/josephmumanga/vacations-fortelabs/actions" -ForegroundColor Cyan



