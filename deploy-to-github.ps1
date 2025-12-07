# Quick GitHub Deployment Script
# Run this script to deploy to GitHub Actions

Write-Host "=== GitHub Actions Deployment ===" -ForegroundColor Green
Write-Host ""

# Step 1: Create repository (if it doesn't exist)
Write-Host "Step 1: Creating GitHub repository..." -ForegroundColor Yellow
$repoName = "vacations-fortelabs"
$repoExists = gh repo view $repoName 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating new repository: $repoName" -ForegroundColor Cyan
    gh repo create $repoName --public --description "FORTE Vacation Management System - Azure SQL Database with Azure Functions"
} else {
    Write-Host "Repository already exists: $repoName" -ForegroundColor Green
}

# Step 2: Add remote and push
Write-Host "`nStep 2: Setting up remote and pushing code..." -ForegroundColor Yellow
$username = gh api user --jq .login
$remoteUrl = "https://github.com/$username/$repoName.git"

# Check if remote exists
$remoteExists = git remote get-url origin 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Adding remote: origin -> $remoteUrl" -ForegroundColor Cyan
    git remote add origin $remoteUrl
} else {
    Write-Host "Remote already exists, updating..." -ForegroundColor Cyan
    git remote set-url origin $remoteUrl
}

Write-Host "Pushing code to GitHub..." -ForegroundColor Cyan
git branch -M main
git push -u origin main

# Step 3: Add deployment secret
Write-Host "`nStep 3: Adding deployment token secret..." -ForegroundColor Yellow
$deploymentToken = "d750df013e5e960526cbc5862128cc996e71bbebdddde3b68212bbdf0f4b3f2003-34740af1-a04b-4b95-80a8-341773fcc7eb00f0322049f4f80f"

Write-Host "Setting secret: AZURE_STATIC_WEB_APPS_API_TOKEN" -ForegroundColor Cyan
gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --body $deploymentToken

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Deployment setup complete!" -ForegroundColor Green
    Write-Host "`nGitHub Actions will automatically deploy your app." -ForegroundColor Green
    Write-Host "Check deployment status at: https://github.com/$username/$repoName/actions" -ForegroundColor Cyan
    Write-Host "Your app will be available at: https://vacations.fortelabs.cloud" -ForegroundColor Cyan
} else {
    Write-Host "`n⚠️  Failed to set secret. Please add it manually:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://github.com/$username/$repoName/settings/secrets/actions" -ForegroundColor White
    Write-Host "2. Click 'New repository secret'" -ForegroundColor White
    Write-Host "3. Name: AZURE_STATIC_WEB_APPS_API_TOKEN" -ForegroundColor White
    Write-Host "4. Value: $deploymentToken" -ForegroundColor White
}



