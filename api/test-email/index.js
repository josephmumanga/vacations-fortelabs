const { sendMagicLinkEmail } = require('../lib/emailClient');
const withErrorLogging = require('../lib/withErrorLogging');

async function testEmailHandler(context, req) {
  const { email } = req.body;

  if (!email) {
    context.res = {
      status: 400,
      body: { error: 'Email is required' }
    };
    return;
  }

  try {
    const testLink = `${process.env.APP_BASE_URL || process.env.APP_URL}/magic?token=test-token-123`;
    await sendMagicLinkEmail(email, testLink, 30);
    
    context.res = {
      status: 200,
      body: {
        success: true,
        message: 'Test email sent successfully',
        email,
        smtpConfig: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER,
          from: process.env.SMTP_FROM,
          hasPassword: !!process.env.SMTP_PASS
        }
      }
    };
  } catch (error) {
    context.log.error('[test-email] Failed to send test email', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      response: error.response,
      email
    });
    
    context.res = {
      status: 500,
      body: {
        success: false,
        error: error.message,
        details: {
          code: error.code,
          response: error.response,
          command: error.command
        },
        smtpConfig: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER,
          from: process.env.SMTP_FROM,
          hasPassword: !!process.env.SMTP_PASS
        }
      }
    };
  }
}

module.exports = withErrorLogging(testEmailHandler, 'test-email');

