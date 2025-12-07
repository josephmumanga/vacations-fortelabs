const bcrypt = require('bcrypt');
const sql = require('mssql');
const { query, execute } = require('../../lib/db');
const { generateToken, validateEmailDomain } = require('../../lib/auth');

module.exports = async function (context, req) {
  context.log('Login function processed a request.');

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      context.res = {
        status: 400,
        body: { error: 'Email and password are required' }
      };
      return;
    }

    // Validate email domain
    if (!validateEmailDomain(email)) {
      context.res = {
        status: 403,
        body: { error: 'Only @forteinnovation.mx email addresses are allowed' }
      };
      return;
    }

    // Find user
    const users = await query(
      `SELECT u.id, u.email, u.password_hash, p.name, p.role, p.department, p.position, 
              p.leader_name, p.join_date, p.balance, p.has_project, p.created_at, p.updated_at
       FROM users u
       LEFT JOIN profiles p ON u.id = p.id
       WHERE u.email = @email`,
      { email: { type: sql.NVarChar, value: email.toLowerCase().trim() } }
    );

    if (users.length === 0) {
      context.res = {
        status: 401,
        body: { error: 'Invalid email or password' }
      };
      return;
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      context.res = {
        status: 401,
        body: { error: 'Invalid email or password' }
      };
      return;
    }

    // Generate token
    const token = await generateToken(user.id, user.email);

    // Return user profile and token
    const profile = {
      id: user.id,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      role: user.role || 'Collaborator',
      department: user.department,
      position: user.position,
      leader_name: user.leader_name,
      join_date: user.join_date,
      balance: user.balance || 0,
      has_project: user.has_project || false,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    context.res = {
      status: 200,
      body: {
        user: {
          id: user.id,
          email: user.email
        },
        profile,
        token
      }
    };
  } catch (error) {
    context.log.error('Login error:', error);
    context.res = {
      status: 500,
      body: { error: 'Internal server error' }
    };
  }
};

