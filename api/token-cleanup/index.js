const sql = require('mssql');
const { execute } = require('../lib/db');
const withErrorLogging = require('../lib/withErrorLogging');

async function cleanupHandler(context, myTimer) {
  context.log('[token-cleanup] Starting cleanup of expired magic tokens');

  try {
    // Clear expired magic tokens (MagicTokenExpires < NOW())
    const result = await execute(
      `UPDATE users 
       SET MagicToken = NULL, MagicTokenExpires = NULL 
       WHERE MagicTokenExpires IS NOT NULL 
       AND MagicTokenExpires < GETDATE()`,
      {},
      context
    );

    const rowsAffected = result.rowsAffected || 0;
    
    context.log('[token-cleanup] Cleanup completed', {
      expiredTokensCleared: rowsAffected,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      expiredTokensCleared: rowsAffected,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    context.log.error('[token-cleanup] Cleanup failed', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

module.exports = withErrorLogging(cleanupHandler, 'token-cleanup');

