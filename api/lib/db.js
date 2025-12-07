const sql = require('mssql');

let pool = null;

async function getConnection() {
  if (!pool) {
    const config = {
      server: process.env.AZURE_SQL_SERVER,
      database: process.env.AZURE_SQL_DATABASE,
      user: process.env.AZURE_SQL_USER,
      password: process.env.AZURE_SQL_PASSWORD,
      options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true
      }
    };
    
    pool = await sql.connect(config);
  }
  return pool;
}

async function query(queryText, params = {}) {
  const pool = await getConnection();
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
}

async function execute(queryText, params = {}) {
  const pool = await getConnection();
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
}

module.exports = { getConnection, query, execute };

