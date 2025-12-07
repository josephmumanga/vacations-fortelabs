const bcrypt = require('bcryptjs');
const sql = require('mssql');
const { query, execute } = require('../lib/db');
const withErrorLogging = require('../lib/withErrorLogging');

async function passwordResetConfirmHandler(context, req) {
  const { token, newPassword } = req.body;

  // Step 1: Validate input
  if (!token || !newPassword) {
    context.res = {
      status: 400,
      body: { error: 'Token and new password are required' }
    };
    return;
  }

  // Step 2: Validate password strength
  if (newPassword.length < 6) {
    context.res = {
      status: 400,
      body: { error: 'Password must be at least 6 characters long' }
    };
    return;
  }

  // Step 3: Find token in database
  const tokens = await query(
    `SELECT t.id, t.user_id, t.expires_at, t.used, u.email
     FROM password_reset_tokens t
     INNER JOIN users u ON t.user_id = u.id
     WHERE t.token = @token`,
    { token: { type: sql.NVarChar, value: token } },
    context
  );

  if (tokens.length === 0) {
    context.res = {
      status: 404,
      body: { error: 'Invalid or expired token' }
    };
    return;
  }

  const tokenRecord = tokens[0];

  // Step 4: Check if token is expired
  const now = new Date();
  const expiresAt = new Date(tokenRecord.expires_at);
  if (now > expiresAt) {
    // Mark as used and delete
    await execute(
      `DELETE FROM password_reset_tokens WHERE id = @tokenId`,
      { tokenId: { type: sql.UniqueIdentifier, value: tokenRecord.id } },
      context
    );
    context.res = {
      status: 410,
      body: { error: 'Token has expired. Please request a new password reset.' }
    };
    return;
  }

  // Step 5: Check if token is already used
  if (tokenRecord.used) {
    context.res = {
      status: 410,
      body: { error: 'This password reset link has already been used. Please request a new one.' }
    };
    return;
  }

  // Step 6: Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Step 7: Update user password
  await execute(
    `UPDATE users SET password_hash = @passwordHash, updated_at = GETDATE() 
     WHERE id = @userId`,
    {
      passwordHash: { type: sql.NVarChar, value: passwordHash },
      userId: { type: sql.UniqueIdentifier, value: tokenRecord.user_id }
    },
    context
  );

  // Step 8: Mark token as used
  await execute(
    `UPDATE password_reset_tokens SET used = 1 WHERE id = @tokenId`,
    { tokenId: { type: sql.UniqueIdentifier, value: tokenRecord.id } },
    context
  );

  // Step 9: Clean up expired tokens (async)
  execute(
    `DELETE FROM password_reset_tokens WHERE expires_at < GETDATE()`,
    {},
    context
  ).catch(err => {
    context.log.error('[auth-password-reset-confirm] Cleanup failed', { error: err.message });
  });

  context.res = {
    status: 200,
    body: { 
      message: 'Password has been reset successfully. You can now sign in with your new password.'
    }
  };
}

module.exports = withErrorLogging(passwordResetConfirmHandler, 'auth-password-reset-confirm');

