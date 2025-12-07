# Manual Deployment Steps

Since the automated commands are timing out, please run these commands manually in your terminal:

## Step 1: Add Remote and Push Code

```powershell
git remote add origin https://github.com/josephmumanga/vacations-fortelabs.git
git branch -M main
git push -u origin main
```

If the remote already exists, use:
```powershell
git remote set-url origin https://github.com/josephmumanga/vacations-fortelabs.git
git push -u origin main
```

## Step 2: Add GitHub Secret

```powershell
gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --body "d750df013e5e960526cbc5862128cc996e71bbebdddde3b68212bbdf0f4b3f2003-34740af1-a04b-4b95-80a8-341773fcc7eb00f0322049f4f80f"
```

## Step 3: Verify Deployment

1. Go to: https://github.com/josephmumanga/vacations-fortelabs/actions
2. You should see the workflow running automatically
3. Once complete, your app will be live at: https://vacations.fortelabs.cloud

## Alternative: Run the Script

Or simply run:
```powershell
.\complete-deployment.ps1
```

## What Happens Next

1. GitHub Actions will automatically:
   - Build your React app
   - Deploy to Azure Static Web Apps
   - Deploy Azure Functions from the `api/` folder

2. The deployment typically takes 3-5 minutes

3. Once deployed, visit: https://vacations.fortelabs.cloud

4. Create your admin user:
   - Email: `centro.id@forteinnovation.mx`
   - Password: `admin123`



