const crypto = require('crypto');
const sql = require('mssql');
const { query, execute } = require('../lib/db');
const { validateEmailDomain } = require('../lib/auth');
const { sendPasswordResetEmail } = require('../lib/email');
const withErrorLogging = require('../lib/withErrorLogging');

async function passwordResetRequestHandler(context, req) {
  const { email } = req.body;

  // Step 1: Validate input
  if (!email) {
    context.res = {
      status: 400,
      body: { error: 'Email is required' }
    };
    return;
  }

  // Step 2: Validate email domain
  if (!validateEmailDomain(email)) {
    context.res = {
      status: 403,
      body: { error: 'Only @forteinnovation.mx email addresses are allowed' }
    };
    return;
  }

  const emailLower = email.toLowerCase().trim();

  // Step 3: Check if user exists
  const users = await query(
    `SELECT id FROM users WHERE email = @email`,
    { email: { type: sql.NVarChar, value: emailLower } },
    context
  );

  if (users.length === 0) {
    // Don't reveal if user exists for security
    context.res = {
      status: 200,
      body: { 
        message: 'If an account exists with this email, a password reset link has been sent.',
        sent: true
      }
    };
    return;
  }

  const userId = users[0].id;

  // Step 4: Rate limiting - check recent requests (max 3 per hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentTokens = await query(
    `SELECT COUNT(*) as count FROM password_reset_tokens 
     WHERE user_id = @userId AND created_at > @oneHourAgo`,
    {
      userId: { type: sql.UniqueIdentifier, value: userId },
      oneHourAgo: { type: sql.DateTime2, value: oneHourAgo }
    },
    context
  );

  if (recentTokens[0].count >= 3) {
    context.res = {
      status: 429,
      body: { error: 'Too many requests. Please wait before requesting another password reset.' }
    };
    return;
  }

  // Step 5: Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Step 6: Store token in database
  await execute(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at) 
     VALUES (@userId, @token, @expiresAt)`,
    {
      userId: { type: sql.UniqueIdentifier, value: userId },
      token: { type: sql.NVarChar, value: token },
      expiresAt: { type: sql.DateTime2, value: expiresAt }
    },
    context
  );

  // Step 7: Send email
  try {
    await sendPasswordResetEmail(emailLower, token, context);
  } catch (emailError) {
    context.log.error('[auth-password-reset-request] Email send failed', {
      error: emailError.message,
      email: emailLower
    });
    // Still return success to not reveal if email exists
  }

  // Step 8: Clean up expired tokens (async, don't wait)
  execute(
    `DELETE FROM password_reset_tokens WHERE expires_at < GETDATE()`,
    {},
    context
  ).catch(err => {
    context.log.error('[auth-password-reset-request] Cleanup failed', { error: err.message });
  });

  context.res = {
    status: 200,
    body: { 
      message: 'If an account exists with this email, a password reset link has been sent.',
      sent: true
    }
  };
}

module.exports = withErrorLogging(passwordResetRequestHandler, 'auth-password-reset-request');

