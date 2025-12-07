# GitHub Actions Deployment Setup Script

Write-Host "Setting up GitHub Actions deployment..." -ForegroundColor Green

# Step 1: Login to GitHub CLI
Write-Host "`nStep 1: GitHub Authentication" -ForegroundColor Yellow
Write-Host "You need to authenticate with GitHub CLI." -ForegroundColor Cyan
Write-Host "Run: gh auth login" -ForegroundColor White
Write-Host "Then follow the prompts to authenticate." -ForegroundColor White

# Step 2: Create GitHub repository
Write-Host "`nStep 2: Creating GitHub Repository" -ForegroundColor Yellow
$repoName = Read-Host "Enter GitHub repository name (e.g., vacations-app)"
$repoDescription = "FORTE Vacation Management System - Azure SQL Database with Azure Functions"

Write-Host "Creating repository: $repoName" -ForegroundColor Cyan
gh repo create $repoName --public --description $repoDescription --source=. --remote=origin --push

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nRepository created and code pushed successfully!" -ForegroundColor Green
    
    # Step 3: Add GitHub Secret
    Write-Host "`nStep 3: Adding Deployment Token Secret" -ForegroundColor Yellow
    $deploymentToken = "d750df013e5e960526cbc5862128cc996e71bbebdddde3b68212bbdf0f4b3f2003-34740af1-a04b-4b95-80a8-341773fcc7eb00f0322049f4f80f"
    
    Write-Host "Adding secret: AZURE_STATIC_WEB_APPS_API_TOKEN" -ForegroundColor Cyan
    gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --body $deploymentToken --repo $repoName
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nSecret added successfully!" -ForegroundColor Green
        Write-Host "`nDeployment will start automatically via GitHub Actions!" -ForegroundColor Green
        Write-Host "Check status at: https://github.com/$(gh api user --jq .login)/$repoName/actions" -ForegroundColor Cyan
    } else {
        Write-Host "`nFailed to add secret. Please add it manually:" -ForegroundColor Red
        Write-Host "1. Go to: https://github.com/$(gh api user --jq .login)/$repoName/settings/secrets/actions" -ForegroundColor White
        Write-Host "2. Click 'New repository secret'" -ForegroundColor White
        Write-Host "3. Name: AZURE_STATIC_WEB_APPS_API_TOKEN" -ForegroundColor White
        Write-Host "4. Value: $deploymentToken" -ForegroundColor White
    }
} else {
    Write-Host "`nFailed to create repository. Please create it manually:" -ForegroundColor Red
    Write-Host "1. Go to: https://github.com/new" -ForegroundColor White
    Write-Host "2. Create a new repository" -ForegroundColor White
    Write-Host "3. Then run: git remote add origin https://github.com/YOUR_USERNAME/$repoName.git" -ForegroundColor White
    Write-Host "4. Then run: git push -u origin main" -ForegroundColor White
}

Write-Host "`nSetup complete!" -ForegroundColor Green



