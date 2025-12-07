# Quick Deployment Steps

## ✅ Completed Steps

1. ✅ Azure SQL Database created and schema deployed
2. ✅ Azure Static Web App created
3. ✅ Environment variables configured
4. ✅ Custom domain configured (vacations.fortelabs.cloud)
5. ✅ DNS CNAME record added
6. ✅ Application built successfully

## 🚀 Final Deployment Options

### Option 1: GitHub Actions (Recommended - Automatic)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Azure migration"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Configure GitHub Secret:**
   - Go to your GitHub repository
   - Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - Value: `d750df013e5e960526cbc5862128cc996e71bbebdddde3b68212bbdf0f4b3f2003-34740af1-a04b-4b95-80a8-341773fcc7eb00f0322049f4f80f`
   - Click "Add secret"

3. **Automatic Deployment:**
   - The workflow file (`.github/workflows/azure-static-web-apps.yml`) is already created
   - On push to `main`, it will automatically build and deploy

### Option 2: Azure Portal (Manual Upload)

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Static Web App: `vacations-app`
3. Click "Overview" → "Manage deployment token"
4. Copy the deployment token
5. Go to "Deployment Center"
6. Choose "Other" as source
7. Use the deployment token to deploy

### Option 3: Install SWA CLI and Deploy

```bash
npm install -g @azure/static-web-apps-cli
swa deploy ./dist --api-location ./api --deployment-token "d750df013e5e960526cbc5862128cc996e71bbebdddde3b68212bbdf0f4b3f2003-34740af1-a04b-4b95-80a8-341773fcc7eb00f0322049f4f80f" --app-name vacations-app
```

## 📋 Post-Deployment Checklist

After deployment:

1. ✅ Visit `https://vacations.fortelabs.cloud` to verify it's live
2. ✅ Create admin user:
   - Email: `centro.id@forteinnovation.mx`
   - Password: `admin123`
3. ✅ Test authentication flow
4. ✅ Test creating a vacation request
5. ✅ Test approval workflow

## 🔧 Troubleshooting

### If the site shows 404:
- Wait 5-10 minutes for DNS propagation
- Check DNS: `nslookup vacations.fortelabs.cloud`
- Verify CNAME in Hostinger points to: `gray-river-049f4f80f.3.azurestaticapps.net`

### If API calls fail:
- Check Azure Portal → Static Web App → Functions
- Verify environment variables are set correctly
- Check Function logs for errors

### If database connection fails:
- Verify SQL Server firewall allows Azure services (0.0.0.0 - 0.0.0.0)
- Check connection string in environment variables
- Test connection in Azure Portal SQL query editor

## 📝 Important Credentials

**SQL Database:**
- Server: `vacations-sql-4819.database.windows.net`
- Database: `vacations-db`
- Username: `vacationsadmin`
- Password: `Vacations2024!Secure`

**Static Web App:**
- Name: `vacations-app`
- URL: `https://vacations.fortelabs.cloud`
- Default URL: `https://gray-river-049f4f80f.3.azurestaticapps.net`



