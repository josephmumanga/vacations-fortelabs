const nodemailer = require('nodemailer');

// Log SMTP configuration (without password)
console.log('[emailClient] SMTP Configuration:', {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER,
  from: process.env.SMTP_FROM,
  hasPassword: !!process.env.SMTP_PASS,
  passwordLength: process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465, // SSL for port 465, STARTTLS for 587
  requireTLS: Number(process.env.SMTP_PORT) === 587, // Only require TLS for port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Add connection timeout
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  // Allow self-signed certificates if needed
  tls: {
    rejectUnauthorized: false
  }
});

async function sendMagicLinkEmail(to, magicLinkUrl, ttl) {
  try {
    // Verify transporter configuration first
    await transporter.verify();
    
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: "Your secure login link",
      text: `Sign in using the following link (valid for ${ttl} minutes): ${magicLinkUrl}`,
      html: `
        <p>Click the link below to sign in:</p>
        <p><a href="${magicLinkUrl}">${magicLinkUrl}</a></p>
        <p>This link is valid for <strong>${ttl} minutes</strong>.</p>
      `,
    });
    
    console.log('[emailClient] Email sent successfully', {
      messageId: info.messageId,
      to,
      from: process.env.SMTP_FROM
    });
    
    return info;
  } catch (error) {
    console.error('[emailClient] Email send error:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      to,
      from: process.env.SMTP_FROM,
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER
    });
    throw error;
  }
}

module.exports = { sendMagicLinkEmail };

