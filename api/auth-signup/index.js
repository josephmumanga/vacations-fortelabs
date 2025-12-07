const crypto = require('crypto');
const sql = require('mssql');
const { query, execute } = require('../lib/db');
const { validateEmailDomain } = require('../lib/auth');
const { sendMagicLinkEmail } = require('../lib/emailClient');
const withErrorLogging = require('../lib/withErrorLogging');

async function signupHandler(context, req) {
  // Step 1: Validate input
  const { email, name, role } = req.body;

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

  // Step 3: Check rate limiting (max 3 magic links per hour per email)
  // Simple approach: prevent sending if last request was within 20 minutes (1/3 of hour)
  // This effectively limits to 3 requests per hour
  const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
  const existingUsers = await query(
    `SELECT id, LastMagicLinkSentAt FROM users WHERE email = @email`,
    { email: { type: sql.NVarChar, value: emailLower } },
    context
  );

  if (existingUsers.length > 0) {
    const user = existingUsers[0];
    if (user.LastMagicLinkSentAt) {
      const lastSent = new Date(user.LastMagicLinkSentAt);
      if (lastSent > twentyMinutesAgo) {
        context.log('[auth-signup] Rate limit exceeded', {
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
  }

  // Step 4: Generate magic token
  const token = crypto.randomUUID();
  const ttl = Number(process.env.MAGIC_LINK_TTL_MINUTES || 30);
  const expiresAt = new Date(Date.now() + ttl * 60000);

  // Step 5: Determine role and name
  const userRole = emailLower === 'centro.id@forteinnovation.mx' ? 'Admin' : (role || 'Collaborator');
  const userName = name || emailLower.split('@')[0];

  // Step 6: Get or create user
  let userId;

  if (existingUsers.length > 0) {
    // User exists - update with magic token and last sent timestamp
    userId = existingUsers[0].id;
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
  } else {
    // New user - create with INSERT
    userId = crypto.randomUUID();
    const now = new Date();
    await execute(
      `INSERT INTO users (id, email, MagicToken, MagicTokenExpires, LastMagicLinkSentAt)
       VALUES (@userId, @email, @token, @expiresAt, @now)`,
      {
        userId: { type: sql.UniqueIdentifier, value: userId },
        email: { type: sql.NVarChar, value: emailLower },
        token: { type: sql.NVarChar, value: token },
        expiresAt: { type: sql.DateTime2, value: expiresAt },
        now: { type: sql.DateTime2, value: now }
      },
      context
    );

    // Step 7: Create profile if user is new
    await execute(
      `INSERT INTO profiles (id, name, role) 
       VALUES (@userId, @name, @role)`,
      {
        userId: { type: sql.UniqueIdentifier, value: userId },
        name: { type: sql.NVarChar, value: userName },
        role: { type: sql.NVarChar, value: userRole }
      },
      context
    );
  }

  // Step 8: Build magic link URL
  const magicLink = `${process.env.APP_BASE_URL || process.env.APP_URL}/magic?token=${token}`;

  // Step 9: Send magic link email
  try {
    await sendMagicLinkEmail(emailLower, magicLink, ttl);
    context.log('[auth-signup] Magic link email sent successfully', {
      email: emailLower
    });
  } catch (emailError) {
    context.log.error('[auth-signup] Email send failed', {
      error: emailError.message,
      stack: emailError.stack,
      email: emailLower
    });
    // Still return success to not reveal if email exists, but log the error
  }

  // Step 10: Return success response
  context.res = {
    status: 200,
    body: {
      ok: true,
      message: "Magic link sent. Please check your email to complete signup."
    }
  };
}

// Export wrapped handler with error logging
module.exports = withErrorLogging(signupHandler, 'auth-signup');
