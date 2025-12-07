// Error logging wrapper for Azure Functions
// Provides structured error logging and sanitized error responses

module.exports = function withErrorLogging(handler, name) {
  return async function (context, req) {
    const tag = name || context.executionContext?.functionName || 'unknown-fn';
    const startTime = Date.now();

    try {
      context.log(`[${tag}] START`, {
        method: req.method,
        url: req.url,
        timestamp: new Date().toISOString()
      });

      await handler(context, req);

      const duration = Date.now() - startTime;
      context.log(`[${tag}] END`, {
        status: context.res?.status || 200,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      const duration = Date.now() - startTime;
      
      // Build comprehensive error payload
      const errorPayload = {
        message: err.message,
        stack: err.stack,
        code: err.code,
        number: err.number,
        name: err.name,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      };

      // mssql-specific error details
      if (err.originalError) {
        errorPayload.originalError = {
          message: err.originalError.message,
          info: err.originalError.info,
          number: err.originalError.number,
          state: err.originalError.state,
          class: err.originalError.class,
          serverName: err.originalError.serverName,
          procName: err.originalError.procName,
          lineNumber: err.originalError.lineNumber
        };
      }

      // SQL Server error details
      if (err.info) {
        errorPayload.sqlInfo = {
          number: err.info.number,
          state: err.info.state,
          class: err.info.class,
          message: err.info.message,
          server: err.info.server,
          procName: err.info.procName,
          lineNumber: err.info.lineNumber
        };
      }

      // Log full error details
      context.log.error(`[${tag}] ERROR`, errorPayload);

      // Return sanitized error response to client
      // Full details are in logs, client gets generic message
      if (!context.res) {
        context.res = {};
      }
      
      context.res.status = context.res.status || 500;
      context.res.headers = {
        ...context.res.headers,
        'Content-Type': 'application/json'
      };
      context.res.body = {
        error: 'Internal server error',
        // Optionally expose a minimal, non-sensitive code for client-side handling
        code: err.code || 'UNEXPECTED_ERROR',
        // In development, include more details (but not in production)
        ...(process.env.NODE_ENV === 'development' && {
          message: err.message
        })
      };
    }
  };
};

