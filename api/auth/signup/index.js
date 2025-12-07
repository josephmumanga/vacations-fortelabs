const bcrypt = require('bcrypt');
const sql = require('mssql');
const { query, execute } = require('../../lib/db');
const { generateToken, validateEmailDomain } = require('../../lib/auth');

module.exports = async function (context, req) {
  context.log('Signup function processed a request.');

  try {
    const { email, password, name, role } = req.body;

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

    const emailLower = email.toLowerCase().trim();

    // Check if user already exists
    const existingUsers = await query(
      `SELECT id FROM users WHERE email = @email`,
      { email: { type: sql.NVarChar, value: emailLower } }
    );

    if (existingUsers.length > 0) {
      context.res = {
        status: 409,
        body: { error: 'User already exists. Please sign in instead.' }
      };
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Determine role
    const userRole = emailLower === 'centro.id@forteinnovation.mx' ? 'Admin' : (role || 'Collaborator');
    const userName = name || emailLower.split('@')[0];

    // Create user
    const userId = sql.UniqueIdentifier();
    await execute(
      `INSERT INTO users (id, email, password_hash) 
       VALUES (@userId, @email, @passwordHash)`,
      {
        userId: { type: sql.UniqueIdentifier, value: userId },
        email: { type: sql.NVarChar, value: emailLower },
        passwordHash: { type: sql.NVarChar, value: passwordHash }
      }
    );

    // Create profile (leader_name will be set during profile completion)
    await execute(
      `INSERT INTO profiles (id, name, role) 
       VALUES (@userId, @name, @role)`,
      {
        userId: { type: sql.UniqueIdentifier, value: userId },
        name: { type: sql.NVarChar, value: userName },
        role: { type: sql.NVarChar, value: userRole }
      }
    );

    // Generate token
    const token = await generateToken(userId, emailLower);

    // Get created profile
    const profiles = await query(
      `SELECT id, name, role, department, position, leader_name, join_date, balance, has_project, created_at, updated_at
       FROM profiles WHERE id = @userId`,
      { userId: { type: sql.UniqueIdentifier, value: userId } }
    );

    const profile = profiles[0];

    context.res = {
      status: 201,
      body: {
        user: {
          id: userId,
          email: emailLower
        },
        profile: {
          id: profile.id,
          email: emailLower,
          name: profile.name,
          role: profile.role,
          department: profile.department,
          position: profile.position,
          leader_name: profile.leader_name,
          join_date: profile.join_date,
          balance: profile.balance || 0,
          has_project: profile.has_project || false,
          created_at: profile.created_at,
          updated_at: profile.updated_at
        },
        token
      }
    };
  } catch (error) {
    context.log.error('Signup error:', error);
    context.res = {
      status: 500,
      body: { error: 'Internal server error' }
    };
  }
};

