# Email Troubleshooting Guide

## Issue: Magic Link Emails Not Arriving

### Step 1: Check Azure Functions Logs

Look at the terminal where `func start` is running. You should see error messages like:
- `[emailClient] Email send error:`
- `[auth-signup] Email send failed`
- `[auth-login] Email send failed`

### Step 2: Common Issues

#### Issue A: Authentication Failure
**Symptoms:** Error code `EAUTH` or "Invalid login"
**Solution:** 
- Verify password in `api/local.settings.json` matches Hostinger
- Password: `NoReply2024!Forte@Cloud#Secure`
- Check if password needs URL encoding (special characters)

#### Issue B: Port/Connection Issue
**Symptoms:** Connection timeout or "ECONNREFUSED"
**Solution:**
- Try port 465 (SSL) instead of 587 (STARTTLS)
- Update `SMTP_PORT` in `api/local.settings.json` to `"465"`
- Update `secure: true` in `api/lib/emailClient.js`

#### Issue C: DNS/Network Issue
**Symptoms:** "ENOTFOUND" or "ETIMEDOUT"
**Solution:**
- Verify `smtp.hostinger.com` is reachable
- Check firewall/network settings

### Step 3: Test Email Configuration

1. Restart Azure Functions:
   ```bash
   cd api
   func start
   ```

2. In another terminal, test the email endpoint:
   ```bash
   curl -X POST http://localhost:7071/api/test-email \
     -H "Content-Type: application/json" \
     -d '{"email":"your-email@forteinnovation.mx"}'
   ```

3. Check the response for error details

### Step 4: Verify SMTP Settings

Current configuration in `api/local.settings.json`:
- SMTP_HOST: `smtp.hostinger.com`
- SMTP_PORT: `587` (STARTTLS)
- SMTP_USER: `noreply@fortelabs.cloud`
- SMTP_PASS: `NoReply2024!Forte@Cloud#Secure`

### Step 5: Try Port 465 (SSL)

If port 587 doesn't work, try port 465:

1. Update `api/local.settings.json`:
   ```json
   "SMTP_PORT": "465"
   ```

2. Update `api/lib/emailClient.js`:
   ```javascript
   secure: true, // SSL on port 465
   requireTLS: false,
   ```

3. Restart Azure Functions

### Step 6: Check Email Account

1. Log into Hostinger hPanel
2. Go to Email → Email Accounts
3. Verify `noreply@fortelabs.cloud` is active
4. Try logging into webmail to verify credentials work
5. Check if account has any restrictions

### Step 7: Check Spam Folder

- Emails might be going to spam
- Check spam/junk folder
- Verify SPF/DKIM records are properly configured

## Quick Fix: Switch to Port 465

If port 587 isn't working, here's the quick fix:

1. **Update `api/local.settings.json`:**
   ```json
   "SMTP_PORT": "465"
   ```

2. **Update `api/lib/emailClient.js`:**
   Change:
   ```javascript
   secure: false, // using TLS on port 587
   requireTLS: true,
   ```
   To:
   ```javascript
   secure: true, // SSL on port 465
   requireTLS: false,
   ```

3. **Restart Azure Functions**

