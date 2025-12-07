const crypto = require('crypto');
const sql = require('mssql');
const { query, execute } = require('../lib/db');
const { validateEmailDomain } = require('../lib/auth');
const { sendMagicLinkEmail } = require('../lib/emailClient');
const withErrorLogging = require('../lib/withErrorLogging');

async function loginHandler(context, req) {
  // Step 1: Validate input
  const { email } = req.body;

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
    `SELECT id, LastMagicLinkSentAt FROM users WHERE email = @email`,
    { email: { type: sql.NVarChar, value: emailLower } },
    context
  );

  if (users.length === 0) {
    // Don't reveal if user exists for security
    context.res = {
      status: 200,
      body: {
        ok: true,
        message: "If an account exists with this email, a magic link has been sent."
      }
    };
    return;
  }

  const user = users[0];
  const userId = user.id;

  // Step 3.5: Check rate limiting (max 3 magic links per hour per email)
  // Simple approach: prevent sending if last request was within 20 minutes (1/3 of hour)
  // This effectively limits to 3 requests per hour
  const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
  if (user.LastMagicLinkSentAt) {
    const lastSent = new Date(user.LastMagicLinkSentAt);
    if (lastSent > twentyMinutesAgo) {
      context.log('[auth-login] Rate limit exceeded', {
        email: emailLower,
        lastSent: lastSent.toISOString(),
        minutesSinceLastSent: Math.round((Date.now() - lastSent.getTime()) / 60000)
      });
      context.res = {
        status: 429,
        body: { error: 'Too many requests. Please wait before requesting another magic link.' }
      };
      return;
    }
  }

  // Step 4: Generate magic token
  const token = crypto.randomUUID();
  const ttl = Number(process.env.MAGIC_LINK_TTL_MINUTES || 30);
  const expiresAt = new Date(Date.now() + ttl * 60000);

  // Step 5: Update user with magic token and last sent timestamp
  const now = new Date();
  await execute(
    `UPDATE users SET MagicToken = @token, MagicTokenExpires = @expiresAt, LastMagicLinkSentAt = @now WHERE id = @userId`,
    {
      userId: { type: sql.UniqueIdentifier, value: userId },
      token: { type: sql.NVarChar, value: token },
      expiresAt: { type: sql.DateTime2, value: expiresAt },
      now: { type: sql.DateTime2, value: now }
    },
    context
  );

  // Step 6: Build magic link URL
  const magicLink = `${process.env.APP_BASE_URL || process.env.APP_URL}/magic?token=${token}`;

  // Step 7: Send magic link email
  try {
    await sendMagicLinkEmail(emailLower, magicLink, ttl);
    context.log('[auth-login] Magic link email sent successfully', {
      email: emailLower
    });
  } catch (emailError) {
    context.log.error('[auth-login] Email send failed', {
      error: emailError.message,
      stack: emailError.stack,
      email: emailLower
    });
    // Still return success to not reveal if email exists, but log the error
  }

  // Step 8: Return success response
  context.res = {
    status: 200,
    body: {
      ok: true,
      message: "If an account exists with this email, a magic link has been sent."
    }
  };
}

// Export wrapped handler with error logging
module.exports = withErrorLogging(loginHandler, 'auth-login');

