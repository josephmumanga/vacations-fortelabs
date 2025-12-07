const sql = require('mssql');
const { query, execute } = require('../lib/db');
const { generateToken } = require('../lib/auth');
const withErrorLogging = require('../lib/withErrorLogging');

async function magicLinkVerifyHandler(context, req) {
  const { token } = req.query;

  // Step 1: Validate input
  if (!token) {
    context.res = {
      status: 400,
      body: { error: 'Token is required' }
    };
    return;
  }

  // Step 2: Find token in database
  const tokens = await query(
    `SELECT t.id, t.user_id, t.expires_at, t.used, u.email
     FROM magic_link_tokens t
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

  // Step 3: Check if token is expired
  const now = new Date();
  const expiresAt = new Date(tokenRecord.expires_at);
  if (now > expiresAt) {
    // Mark as used and delete
    await execute(
      `DELETE FROM magic_link_tokens WHERE id = @tokenId`,
      { tokenId: { type: sql.UniqueIdentifier, value: tokenRecord.id } },
      context
    );
    context.res = {
      status: 410,
      body: { error: 'Token has expired. Please request a new magic link.' }
    };
    return;
  }

  // Step 4: Check if token is already used
  if (tokenRecord.used) {
    context.res = {
      status: 410,
      body: { error: 'This magic link has already been used. Please request a new one.' }
    };
    return;
  }

  // Step 5: Mark token as used
  await execute(
    `UPDATE magic_link_tokens SET used = 1 WHERE id = @tokenId`,
    { tokenId: { type: sql.UniqueIdentifier, value: tokenRecord.id } },
    context
  );

  // Step 6: Get user profile
  const profiles = await query(
    `SELECT id, name, role, department, position, join_date, balance, has_project, created_at, updated_at
     FROM profiles WHERE id = @userId`,
    { userId: { type: sql.UniqueIdentifier, value: tokenRecord.user_id } },
    context
  );

  if (profiles.length === 0) {
    context.res = {
      status: 404,
      body: { error: 'User profile not found' }
    };
    return;
  }

  const profile = profiles[0];

  // Step 7: Generate JWT token
  const jwtToken = await generateToken(tokenRecord.user_id, tokenRecord.email);

  // Step 8: Return success with user data
  context.res = {
    status: 200,
    body: {
      user: {
        id: tokenRecord.user_id,
        email: tokenRecord.email
      },
      profile: {
        id: profile.id,
        email: tokenRecord.email,
        name: profile.name,
        role: profile.role || 'Collaborator',
        department: profile.department,
        position: profile.position,
        join_date: profile.join_date,
        balance: profile.balance || 0,
        has_project: profile.has_project || false,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      },
      token: jwtToken
    }
  };

  // Step 9: Clean up expired tokens (async)
  execute(
    `DELETE FROM magic_link_tokens WHERE expires_at < GETDATE()`,
    {},
    context
  ).catch(err => {
    context.log.error('[auth-magic-link-verify] Cleanup failed', { error: err.message });
  });
}

module.exports = withErrorLogging(magicLinkVerifyHandler, 'auth-magic-link-verify');

