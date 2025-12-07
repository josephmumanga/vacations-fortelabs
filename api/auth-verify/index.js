const sql = require('mssql');
const { query, execute } = require('../lib/db');
const { generateToken } = require('../lib/auth');
const withErrorLogging = require('../lib/withErrorLogging');

async function verifyHandler(context, req) {
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
  const users = await query(
    `SELECT u.id, u.email, u.MagicToken, u.MagicTokenExpires,
            p.name, p.role, p.department, p.position, p.join_date, 
            p.balance, p.has_project, p.created_at, p.updated_at
     FROM users u
     LEFT JOIN profiles p ON u.id = p.id
     WHERE u.MagicToken = @token`,
    { token: { type: sql.NVarChar, value: token } },
    context
  );

  if (users.length === 0) {
    context.res = {
      status: 401,
      body: { error: 'Invalid or expired token' }
    };
    return;
  }

  const user = users[0];

  // Step 3: Check if token is expired
  const now = new Date();
  const expiresAt = user.MagicTokenExpires ? new Date(user.MagicTokenExpires) : null;
  
  if (!expiresAt || now > expiresAt) {
    // Clear expired token
    await execute(
      `UPDATE users SET MagicToken = NULL, MagicTokenExpires = NULL WHERE id = @userId`,
      { userId: { type: sql.UniqueIdentifier, value: user.id } },
      context
    );
    context.res = {
      status: 401,
      body: { error: 'Token has expired. Please request a new magic link.' }
    };
    return;
  }

  // Step 4: Clear token (one-time use)
  await execute(
    `UPDATE users SET MagicToken = NULL, MagicTokenExpires = NULL WHERE id = @userId`,
    { userId: { type: sql.UniqueIdentifier, value: user.id } },
    context
  );

  // Step 5: Generate JWT token
  const jwtToken = await generateToken(user.id, user.email);

  // Step 6: Build profile object
  const profile = {
    id: user.id,
    email: user.email,
    name: user.name || user.email.split('@')[0],
    role: user.role || 'Collaborator',
    department: user.department,
    position: user.position,
    leader_name: user.leader_name || null,
    join_date: user.join_date,
    balance: user.balance || 0,
    has_project: user.has_project || false,
    created_at: user.created_at,
    updated_at: user.updated_at
  };

  // Step 7: Return success response
  context.res = {
    status: 200,
    body: {
      user: {
        id: user.id,
        email: user.email
      },
      profile,
      token: jwtToken
    }
  };
}

module.exports = withErrorLogging(verifyHandler, 'auth-verify');

