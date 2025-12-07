const { checkConnection } = require('../lib/db');

module.exports = async function (context, req) {
  context.log('Health check function processed a request.');

  const envVars = {
    hasSqlServer: !!process.env.AZURE_SQL_SERVER,
    hasSqlDatabase: !!process.env.AZURE_SQL_DATABASE,
    hasSqlUser: !!process.env.AZURE_SQL_USER,
    hasSqlPassword: !!process.env.AZURE_SQL_PASSWORD,
    hasJwtSecret: !!process.env.JWT_SECRET,
    nodeVersion: process.version,
    functionsRuntime: process.env.FUNCTIONS_WORKER_RUNTIME
  };

  // Check if database connection test is requested
  const testDb = req.query && req.query.db === 'true';
  let dbStatus = null;

  if (testDb) {
    try {
      dbStatus = await checkConnection(context);
    } catch (error) {
      dbStatus = {
        connected: false,
        error: error.message
      };
    }
  }

  context.res = {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: envVars,
      ...(dbStatus && { database: dbStatus })
    }
  };
};


