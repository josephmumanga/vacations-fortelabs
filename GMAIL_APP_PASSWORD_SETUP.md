# Gmail App Password Setup for SMTP

## Problem
Gmail blocks SMTP authentication with regular passwords when:
- 2-Step Verification is enabled (recommended)
- "Less secure app access" is disabled (default)

## Solution: Generate a Gmail App Password

### Steps to Generate App Password:

1. **Go to your Google Account**
   - Visit: https://myaccount.google.com/
   - Sign in with: `fortecentroid@gmail.com`

2. **Enable 2-Step Verification** (if not already enabled)
   - Go to: Security > 2-Step Verification
   - Follow the setup process

3. **Generate App Password**
   - Go to: Security > 2-Step Verification
   - Scroll down to "App passwords"
   - Click "App passwords"
   - Select "Mail" as the app
   - Select "Other (Custom name)" as the device
   - Enter name: "FORTE Vacations SMTP"
   - Click "Generate"
   - **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)

4. **Update Azure Static Web Apps Configuration**
   ```powershell
   az staticwebapp appsettings set `
     --name vacations-app `
     --resource-group vacations-rg `
     --setting-names SMTP_PASS="<your-16-char-app-password>"
   ```

   **Important:** Remove spaces from the App Password when setting it.

### Alternative: Use "Less Secure App Access" (NOT RECOMMENDED)

⚠️ **Security Warning:** This is less secure and Google may disable it.

1. Go to: https://myaccount.google.com/lesssecureapps
2. Turn on "Allow less secure apps"
3. Use your regular Gmail password

## Testing

After updating the App Password, test the magic link:
1. Go to: https://vacations.fortelabs.cloud
2. Click "Magic Link" tab
3. Enter your email
4. Check your inbox (and spam folder)

## Troubleshooting

### Still not receiving emails?
1. Check Azure Functions logs for SMTP errors
2. Verify the App Password has no spaces
3. Make sure 2-Step Verification is enabled
4. Check spam/junk folder
5. Verify email address is correct

### Common Error Messages:
- **"Invalid login"** → App Password is incorrect
- **"Authentication failed"** → Need to enable 2-Step Verification first
- **"Connection timeout"** → Check firewall/network settings

