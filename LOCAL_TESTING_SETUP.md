# Local Testing Setup

## ✅ What's Been Configured

1. **Created `api/local.settings.json`** with database credentials
2. **Updated `vite.config.js`** to proxy API requests to `http://localhost:7071`
3. **Improved error handling** in:
   - `src/lib/api.js` - Better JSON parsing and error messages
   - `api/auth/signup/index.js` - More detailed error messages in development
4. **Installed API dependencies** - All npm packages are installed

## 🚀 How to Start Local Development

### Terminal 1: Start Azure Functions
```powershell
cd api
func start
```

The functions will be available at: `http://localhost:7071`

### Terminal 2: Start Frontend Dev Server
```powershell
npm run dev
```

The frontend will be available at: `http://localhost:5173`

## ⚠️ Common Issues & Solutions

### Issue 1: Azure Functions Not Starting
**Symptoms:** Connection refused on port 7071

**Solutions:**
- Make sure Azure Functions Core Tools is installed: `func --version`
- Check if port 7071 is already in use
- Verify `api/local.settings.json` exists and has correct values

### Issue 2: Database Connection Errors (500 errors)
**Symptoms:** API returns 500 Internal Server Error

**Most Likely Cause:** Azure SQL Database firewall doesn't allow your local IP

**Solution:**
1. Go to Azure Portal
2. Navigate to your SQL Database: `vacations-sql-4819.database.windows.net`
3. Go to "Networking" or "Firewall rules"
4. Add your current IP address
5. Or enable "Allow Azure services and resources to access this server" (less secure)

**Alternative:** Use Azure SQL Database's query editor in the portal to test connections

### Issue 3: API Returns 404
**Symptoms:** API endpoint not found

**Solutions:**
- Verify Azure Functions are running: Check Terminal 1
- Verify the proxy is working in `vite.config.js`
- Check browser console for proxy errors

### Issue 4: CORS Errors
**Symptoms:** CORS policy errors in browser console

**Solution:** Azure Functions should handle CORS automatically, but if issues persist:
- Check `api/host.json` for CORS settings
- Verify the proxy configuration in `vite.config.js`

## 🧪 Testing the Signup Flow

1. Open `http://localhost:5173` in your browser
2. Click "Don't have an account? Sign up"
3. Fill in:
   - Email: `test.user@forteinnovation.mx`
   - Password: `TestPassword123!`
4. Click "Create Account"
5. Check browser console (F12) for any errors
6. Check Terminal 1 (Azure Functions) for server-side errors

## 📝 Current Status

- ✅ Frontend error handling improved
- ✅ API error handling improved  
- ✅ Local configuration files created
- ⚠️ Database connection may need firewall rule update
- ⚠️ Azure Functions need to be running

## 🔍 Debugging Tips

1. **Check Azure Functions Logs:**
   - Look at Terminal 1 where `func start` is running
   - Errors will be displayed there

2. **Check Browser Console:**
   - Press F12 in browser
   - Look at Console tab for JavaScript errors
   - Look at Network tab for API request/response details

3. **Test API Directly:**
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:7071/api/auth/signup" -Method POST -ContentType "application/json" -Body '{"email":"test@forteinnovation.mx","password":"test123"}' -UseBasicParsing
   ```

4. **Check Database Connection:**
   - Use Azure Portal's Query Editor
   - Or test connection using Azure Data Studio
   - Verify firewall rules allow your IP

## 📚 Next Steps

1. **Fix Database Firewall:** Add your IP to Azure SQL Database firewall
2. **Restart Services:** After fixing firewall, restart both services
3. **Test Signup:** Try creating an account again
4. **Check Logs:** Review both browser console and function logs for any remaining issues



