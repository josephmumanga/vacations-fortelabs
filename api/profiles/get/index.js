const sql = require('mssql');
const { query } = require('../../lib/db');
const { getUserFromToken } = require('../../lib/auth');

module.exports = async function (context, req) {
  context.log('Get profile function processed a request.');

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      context.res = {
        status: 401,
        body: { error: 'No token provided' }
      };
      return;
    }

    const token = authHeader.substring(7);
    const currentUser = await getUserFromToken(token);

    if (!currentUser) {
      context.res = {
        status: 401,
        body: { error: 'Invalid or expired token' }
      };
      return;
    }

    const userId = req.query.userId || currentUser.id;

    // Users can only view their own profile unless they're Admin/HR
    if (userId !== currentUser.id && !['Admin', 'HR'].includes(currentUser.role)) {
      context.res = {
        status: 403,
        body: { error: 'Forbidden' }
      };
      return;
    }

    const profiles = await query(
      `SELECT id, name, role, department, position, leader_name, join_date, balance, has_project, created_at, updated_at
       FROM profiles WHERE id = @userId`,
      { userId: { type: sql.UniqueIdentifier, value: userId } }
    );

    if (profiles.length === 0) {
      context.res = {
        status: 404,
        body: { error: 'Profile not found' }
      };
      return;
    }

    context.res = {
      status: 200,
      body: profiles[0]
    };
  } catch (error) {
    context.log.error('Get profile error:', error);
    context.res = {
      status: 500,
      body: { error: 'Internal server error' }
    };
  }
};

