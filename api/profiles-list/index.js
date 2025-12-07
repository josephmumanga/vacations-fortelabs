const { query } = require('../lib/db');
const { getUserFromToken } = require('../lib/auth');

module.exports = async function (context, req) {
  context.log('List profiles function processed a request.');

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

    // Only admins can list all profiles
    if (currentUser.role !== 'Admin') {
      context.res = {
        status: 403,
        body: { error: 'Forbidden - Admin access required' }
      };
      return;
    }

    const profiles = await query(
      `SELECT id, name, role, department, position, join_date, balance, has_project, created_at, updated_at
       FROM profiles
       ORDER BY name`,
      {},
      context
    );

    context.res = {
      status: 200,
      body: profiles
    };
  } catch (error) {
    context.log.error('List profiles error:', error);
    context.res = {
      status: 500,
      body: { error: 'Internal server error' }
    };
  }
};

