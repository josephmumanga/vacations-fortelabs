const fs = require('fs');
const path = require('path');

// Load environment variables manually from local.settings.json
try {
  const settingsPath = path.join(__dirname, 'api', 'local.settings.json');
  if (fs.existsSync(settingsPath)) {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    if (settings.Values) {
      Object.assign(process.env, settings.Values);
    }
  } else {
    console.warn('⚠️ api/local.settings.json not found. Using existing environment variables.');
  }
} catch (err) {
  console.error('Error loading local.settings.json:', err.message);
}

// Add api/node_modules to require path
module.paths.push(path.join(__dirname, 'api', 'node_modules'));

async function checkSetup() {
  console.log('🔍 Checking Magic Link Setup...');

  // 1. Check Database
  try {
    console.log('\n--- Database Check ---');
    const { sql, query } = require('./api/lib/db');
    
    // Check if table exists
    const result = await query(
      `
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'magic_link_tokens'
    `
    );
    
    if (result && result[0].count > 0) {
      console.log('✅ Table magic_link_tokens exists.');
    } else {
      console.error('❌ Table magic_link_tokens DOES NOT exist.');
      console.log('   Run "azure-sql-migration-auth-tokens.sql" to fix this.');
    }

  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }

  // 2. Check SMTP Config
  console.log('\n--- SMTP Configuration Check ---');
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error('❌ Missing SMTP configuration in local.settings.json');
  } else {
    console.log(`✅ SMTP Host: ${smtpHost}`);
    console.log(`✅ SMTP User: ${smtpUser}`);
    
    if (smtpHost.includes('gmail.com')) {
      if (smtpPass.length === 16 && !smtpPass.includes(' ')) {
        console.log('✅ SMTP Password looks like a Google App Password (16 chars).');
      } else {
        console.warn('⚠️ SMTP Password does NOT look like a standard Google App Password (usually 16 chars).');
        console.warn('   If using Gmail with 2FA, you MUST use an App Password.');
      }
    }
  }

  // 3. Check App URL
  console.log('\n--- App URL Check ---');
  const appUrl = process.env.APP_URL;
  if (!appUrl) {
    console.error('❌ APP_URL is not set.');
  } else {
    console.log(`✅ APP_URL: ${appUrl}`);
    if (appUrl.includes('localhost')) {
      console.log('ℹ️  Running in localhost mode. Magic links will point to localhost.');
    } else {
      console.log('ℹ️  Running in production mode.');
    }
  }

  process.exit(0);
}

checkSetup().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
