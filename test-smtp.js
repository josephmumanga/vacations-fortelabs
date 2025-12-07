import nodemailer from 'nodemailer';

// SMTP configuration for Hostinger
const SMTP_HOST = 'smtp.hostinger.com';
const SMTP_PORT = 465; // SSL port
const SMTP_USER = 'noreply@fortelabs.cloud';
const SMTP_PASS = 'NoReply2024!Forte@Cloud#Secure';
const SMTP_FROM = 'noreply@fortelabs.cloud';

// Test email recipient
const TEST_EMAIL = 'joseph.mumanga@forteinnovation.mx';

console.log('=== SMTP Test Script ===');
console.log('Configuration:');
console.log('  Host:', SMTP_HOST);
console.log('  Port:', SMTP_PORT);
console.log('  User:', SMTP_USER);
console.log('  From:', SMTP_FROM);
console.log('  To:', TEST_EMAIL);
console.log('');

// Create transporter with SSL (port 465)
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: true, // SSL for port 465
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  debug: true, // Enable debug output
  logger: true, // Log to console
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
  tls: {
    rejectUnauthorized: false
  }
});

async function testSMTP() {
  try {
    console.log('Step 1: Verifying SMTP connection...');
    await transporter.verify();
    console.log('✓ SMTP connection verified successfully!\n');

    console.log('Step 2: Sending test email...');
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to: TEST_EMAIL,
      subject: 'Test Email from Magic Link Setup',
      text: 'This is a test email to verify SMTP configuration for magic link authentication.',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email to verify SMTP configuration for magic link authentication.</p>
        <p>If you received this, the email setup is working correctly!</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `,
    });

    console.log('✓ Email sent successfully!');
    console.log('  Message ID:', info.messageId);
    console.log('  Response:', info.response);
    console.log('');
    console.log('Check your inbox (and spam folder) for the test email.');
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error('  Code:', error.code);
    console.error('  Command:', error.command);
    console.error('  Response:', error.response);
    console.error('  ResponseCode:', error.responseCode);
    console.error('');
    
    if (error.code === 'EAUTH') {
      console.error('Authentication failed. Please verify:');
      console.error('  1. The email account noreply@fortelabs.cloud exists');
      console.error('  2. The password is correct');
      console.error('  3. The account is not locked');
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error('Connection failed. Please verify:');
      console.error('  1. SMTP host is correct (smtp.hostinger.com)');
      console.error('  2. Port 465 is not blocked by firewall');
      console.error('  3. Internet connection is working');
    }
  }
}

testSMTP();

