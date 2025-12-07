const nodemailer = require('nodemailer');

// Get SMTP configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || 'noreply@forteinnovation.mx';
const APP_URL = process.env.APP_URL || 'https://vacations.fortelabs.cloud';

// Check if we're in development mode (no SMTP configured)
const isDevelopment = !SMTP_USER || !SMTP_PASS;

// Create transporter
let transporter = null;

if (!isDevelopment) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    tls: {
      // Do not fail on invalid certs (useful for some SMTP servers)
      rejectUnauthorized: false
    }
  });

  // Verify connection configuration
  transporter.verify().then(() => {
    console.log('[email] SMTP server is ready to send emails');
  }).catch((error) => {
    console.error('[email] SMTP configuration error:', error.message);
  });
}

/**
 * Send email (or log in development)
 */
async function sendEmail(to, subject, html, text = null) {
  if (isDevelopment) {
    // In development, just log the email
    console.log('=== EMAIL (Development Mode) ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('HTML:', html);
    console.log('==============================');
    return { success: true, message: 'Email logged (development mode)' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"FORTE Innovation" <${SMTP_FROM}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      html,
    });

    console.log('[email] Email sent successfully', { 
      messageId: info.messageId, 
      to,
      subject 
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[email] Email send error:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      to,
      subject
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Send magic link email
 */
async function sendMagicLinkEmail(email, token, context = null) {
  const magicLink = `${APP_URL}/auth/verify?token=${token}&type=magic`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e293b 0%, #e42935 100%); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background-color: #e42935; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FORTE Innovation</h1>
        </div>
        <div class="content">
          <h2 style="color: #494949;">Iniciar Sesión con Magic Link</h2>
          <p>Hola,</p>
          <p>Has solicitado iniciar sesión sin contraseña. Haz clic en el botón siguiente para acceder a tu cuenta:</p>
          <div style="text-align: center;">
            <a href="${magicLink}" class="button">Iniciar Sesión</a>
          </div>
          <p>O copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #666; font-size: 12px;">${magicLink}</p>
          <div class="warning">
            <strong>⚠️ Importante:</strong> Este enlace expirará en 15 minutos y solo puede usarse una vez.
          </div>
          <p>Si no solicitaste este enlace, puedes ignorar este correo de forma segura.</p>
        </div>
        <div class="footer">
          <p>FORTE Innovation Consulting - Gestión de Vacaciones</p>
          <p>Este es un correo automático, por favor no respondas.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    FORTE Innovation - Iniciar Sesión con Magic Link
    
    Hola,
    
    Has solicitado iniciar sesión sin contraseña. Usa el siguiente enlace para acceder a tu cuenta:
    
    ${magicLink}
    
    ⚠️ IMPORTANTE: Este enlace expirará en 15 minutos y solo puede usarse una vez.
    
    Si no solicitaste este enlace, puedes ignorar este correo de forma segura.
    
    FORTE Innovation Consulting - Gestión de Vacaciones
  `;

  if (context) {
    context.log('[email] Sending magic link email', { to: email });
  }

  return await sendEmail(email, 'Iniciar Sesión - FORTE Gestión de Vacaciones', html, text);
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email, token, context = null) {
  const resetLink = `${APP_URL}/auth/reset-password?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e293b 0%, #e42935 100%); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background-color: #e42935; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FORTE Innovation</h1>
        </div>
        <div class="content">
          <h2 style="color: #494949;">Restablecer Contraseña</h2>
          <p>Hola,</p>
          <p>Has solicitado restablecer tu contraseña. Haz clic en el botón siguiente para crear una nueva contraseña:</p>
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Restablecer Contraseña</a>
          </div>
          <p>O copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #666; font-size: 12px;">${resetLink}</p>
          <div class="warning">
            <strong>⚠️ Importante:</strong> Este enlace expirará en 1 hora y solo puede usarse una vez.
          </div>
          <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura. Tu contraseña no cambiará.</p>
        </div>
        <div class="footer">
          <p>FORTE Innovation Consulting - Gestión de Vacaciones</p>
          <p>Este es un correo automático, por favor no respondas.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    FORTE Innovation - Restablecer Contraseña
    
    Hola,
    
    Has solicitado restablecer tu contraseña. Usa el siguiente enlace para crear una nueva contraseña:
    
    ${resetLink}
    
    ⚠️ IMPORTANTE: Este enlace expirará en 1 hora y solo puede usarse una vez.
    
    Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura. Tu contraseña no cambiará.
    
    FORTE Innovation Consulting - Gestión de Vacaciones
  `;

  if (context) {
    context.log('[email] Sending password reset email', { to: email });
  }

  return await sendEmail(email, 'Restablecer Contraseña - FORTE Gestión de Vacaciones', html, text);
}

module.exports = {
  sendEmail,
  sendMagicLinkEmail,
  sendPasswordResetEmail,
  isDevelopment,
};

