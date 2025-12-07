const sql = require('mssql');

// Global connection pool promise (serverless-friendly pattern)
let poolPromise = null;

// Build database configuration
function getConfig(context) {
  const config = {
    server: process.env.AZURE_SQL_SERVER,
    database: process.env.AZURE_SQL_DATABASE,
    user: process.env.AZURE_SQL_USER,
    password: process.env.AZURE_SQL_PASSWORD,
    options: {
      encrypt: true,
      trustServerCertificate: false,
      enableArithAbort: true,
      connectTimeout: 30000,
      requestTimeout: 30000
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  };

  // Log configuration status (sanitized - no passwords)
  if (context) {
    context.log('[db] Configuration check', {
      server: config.server || '(missing)',
      database: config.database || '(missing)',
      user: config.user ? '[set]' : '(missing)',
      password: config.password ? '[set]' : '(missing)'
    });
  }

  // Validate required environment variables
  if (!config.server || !config.database || !config.user || !config.password) {
    const missing = [];
    if (!config.server) missing.push('AZURE_SQL_SERVER');
    if (!config.database) missing.push('AZURE_SQL_DATABASE');
    if (!config.user) missing.push('AZURE_SQL_USER');
    if (!config.password) missing.push('AZURE_SQL_PASSWORD');
    
    throw new Error(`Missing required database configuration. Please check environment variables: ${missing.join(', ')}`);
  }

  return config;
}

// Get or create connection pool (serverless-friendly)
async function getPool(context) {
  // If pool exists and is connected, return it
  if (poolPromise) {
    try {
      const pool = await poolPromise;
      if (pool && pool.connected) {
        return pool;
      }
      // Pool exists but not connected, reset it
      poolPromise = null;
    } catch (err) {
      // Previous connection failed, reset promise
      poolPromise = null;
    }
  }

  // Create new connection pool
  const config = getConfig(context);
  
  if (context) {
    context.log('[db] Initializing connection pool', {
      server: config.server,
      database: config.database
    });
  }

  poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
      if (context) {
        context.log('[db] Connected to SQL Server successfully');
      }
      return pool;
    })
    .catch(err => {
      poolPromise = null; // Reset promise on failure
      if (context) {
        context.log.error('[db] Connection failed', {
          message: err.message,
          code: err.code,
          number: err.number
        });
      }
      throw err;
    });

  return poolPromise;
}

// Legacy function name for backward compatibility
async function getConnection(context) {
  return getPool(context);
}

async function query(queryText, params = {}, context = null) {
  try {
    const pool = await getPool(context);
    const request = pool.request();
    
    // Add parameters
    Object.keys(params).forEach(key => {
      const param = params[key];
      if (param && typeof param === 'object' && param.type && param.value !== undefined) {
        // Parameter with type specified
        request.input(key, param.type, param.value);
      } else {
        // Simple value - infer type
        request.input(key, param);
      }
    });
    
    const result = await request.query(queryText);
    return result.recordset;
  } catch (error) {
    // Reset pool on connection errors to force reconnection
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || 
        error.message.includes('Connection is closed') || 
        error.message.includes('ConnectionError')) {
      poolPromise = null;
      if (context) {
        context.log('[db] Connection error detected, pool reset', {
          code: error.code,
          message: error.message
        });
      }
    }
    throw error;
  }
}

async function execute(queryText, params = {}, context = null) {
  try {
    const pool = await getPool(context);
    const request = pool.request();
    
    // Add parameters
    Object.keys(params).forEach(key => {
      const param = params[key];
      if (param && typeof param === 'object' && param.type && param.value !== undefined) {
        // Parameter with type specified
        request.input(key, param.type, param.value);
      } else {
        // Simple value - infer type
        request.input(key, param);
      }
    });
    
    const result = await request.query(queryText);
    return result;
  } catch (error) {
    // Reset pool on connection errors to force reconnection
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || 
        error.message.includes('Connection is closed') || 
        error.message.includes('ConnectionError')) {
      poolPromise = null;
      if (context) {
        context.log('[db] Connection error detected, pool reset', {
          code: error.code,
          message: error.message
        });
      }
    }
    throw error;
  }
}

// Connection health check
async function checkConnection(context = null) {
  try {
    const pool = await getPool(context);
    const request = pool.request();
    const result = await request.query('SELECT 1 AS health_check');
    return { connected: true, health: result.recordset[0] };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}

module.exports = { 
  sql, // Export sql for type access (UniqueIdentifier, NVarChar, etc.)
  getConnection, // Legacy name for backward compatibility
  getPool, // New recommended function name
  query, 
  execute,
  checkConnection
};

