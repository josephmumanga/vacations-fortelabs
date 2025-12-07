const { getUserFromToken } = require('../lib/auth');

module.exports = async function (context, req) {
  context.log('Session validation function processed a request.');

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
    const user = await getUserFromToken(token);

    if (!user) {
      context.res = {
        status: 401,
        body: { error: 'Invalid or expired token' }
      };
      return;
    }

    context.res = {
      status: 200,
      body: {
        user: {
          id: user.id,
          email: user.email
        },
        profile: user
      }
    };
  } catch (error) {
    context.log.error('Session validation error:', error);
    context.res = {
      status: 500,
      body: { error: 'Internal server error' }
    };
  }
};

