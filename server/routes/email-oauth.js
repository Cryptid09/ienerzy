const express = require('express');
const router = express.Router();
const emailServiceOAuth = require('../services/email-oauth');
const auth = require('../middleware/auth');

/**
 * @route   GET /api/email/oauth/auth
 * @desc    Get OAuth 2.0 authorization URL
 * @access  Private
 */
router.get('/auth', auth, async (req, res) => {
  try {
    const authUrl = emailServiceOAuth.getAuthUrl();
    res.json({
      success: true,
      data: {
        authUrl: authUrl,
        message: 'Visit this URL to authorize Gmail access'
      }
    });
  } catch (error) {
    console.error('Error getting auth URL:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get authorization URL'
    });
  }
});

/**
 * @route   GET /api/email/oauth/callback
 * @desc    OAuth 2.0 callback handler
 * @access  Public (called by Google)
 */
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required'
      });
    }

    const tokens = await emailServiceOAuth.getTokensFromCode(code);
    
    // Return tokens to the user (they need to save these)
    res.json({
      success: true,
      message: 'Authorization successful! Save these tokens in your .env file:',
      data: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        token_type: tokens.token_type,
        expiry_date: tokens.expiry_date
      },
      instructions: [
        '1. Copy the refresh_token to your .env file as GMAIL_REFRESH_TOKEN',
        '2. The access_token will be automatically refreshed by the service',
        '3. You can now close this page and test the email service'
      ]
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'OAuth callback failed'
    });
  }
});

/**
 * @route   GET /api/email/oauth/status
 * @desc    Get OAuth 2.0 email service status
 * @access  Private
 */
router.get('/status', auth, async (req, res) => {
  try {
    const status = emailServiceOAuth.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting OAuth email status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get OAuth email service status'
    });
  }
});

/**
 * @route   POST /api/email/oauth/test
 * @desc    Send test email using OAuth 2.0
 * @access  Private
 */
router.post('/test', auth, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    const result = await emailServiceOAuth.sendTestEmail(email);
    
    res.json({
      success: true,
      message: 'Test email sent successfully using OAuth 2.0',
      data: {
        messageId: result.messageId,
        to: result.to,
        from: result.from,
        authType: 'OAuth 2.0'
      }
    });
  } catch (error) {
    console.error('Error sending OAuth test email:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send test email'
    });
  }
});

/**
 * @route   POST /api/email/oauth/emi-reminder
 * @desc    Send EMI reminder email using OAuth 2.0
 * @access  Private
 */
router.post('/emi-reminder', auth, async (req, res) => {
  try {
    const { email, emiData } = req.body;

    if (!email || !emiData) {
      return res.status(400).json({
        success: false,
        message: 'Email and EMI data are required'
      });
    }

    const result = await emailServiceOAuth.sendEMIReminder(email, emiData);
    
    res.json({
      success: true,
      message: 'EMI reminder email sent successfully using OAuth 2.0',
      data: {
        messageId: result.messageId,
        to: result.to,
        from: result.from,
        authType: 'OAuth 2.0'
      }
    });
  } catch (error) {
    console.error('Error sending OAuth EMI reminder email:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send EMI reminder email'
    });
  }
});

/**
 * @route   POST /api/email/oauth/ticket-update
 * @desc    Send service ticket status update email using OAuth 2.0
 * @access  Private
 */
router.post('/ticket-update', auth, async (req, res) => {
  try {
    const { email, ticketData } = req.body;

    if (!email || !ticketData) {
      return res.status(400).json({
        success: false,
        message: 'Email and ticket data are required'
      });
    }

    const result = await emailServiceOAuth.sendTicketStatusUpdate(email, ticketData);
    
    res.json({
      success: true,
      message: 'Ticket status update email sent successfully using OAuth 2.0',
      data: {
        messageId: result.messageId,
        to: result.to,
        from: result.from,
        authType: 'OAuth 2.0'
      }
    });
  } catch (error) {
    console.error('Error sending OAuth ticket update email:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send ticket update email'
    });
  }
});

/**
 * @route   POST /api/email/oauth/finance-approval
 * @desc    Send finance approval email using OAuth 2.0
 * @access  Private
 */
router.post('/finance-approval', auth, async (req, res) => {
  try {
    const { email, financeData } = req.body;

    if (!email || !financeData) {
      return res.status(400).json({
        success: false,
        message: 'Email and finance data are required'
      });
    }

    const result = await emailServiceOAuth.sendFinanceApproval(email, financeData);
    
    res.json({
      success: true,
      message: 'Finance approval email sent successfully using OAuth 2.0',
      data: {
        messageId: result.messageId,
        to: result.to,
        from: result.from,
        authType: 'OAuth 2.0'
      }
    });
  } catch (error) {
    console.error('Error sending OAuth finance approval email:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send finance approval email'
    });
  }
});

/**
 * @route   POST /api/email/oauth/finance-rejection
 * @desc    Send finance rejection email using OAuth 2.0
 * @access  Private
 */
router.post('/finance-rejection', auth, async (req, res) => {
  try {
    const { email, financeData } = req.body;

    if (!email || !financeData) {
      return res.status(400).json({
        success: false,
        message: 'Email and finance data are required'
      });
    }

    const result = await emailServiceOAuth.sendFinanceRejection(email, financeData);
    
    res.json({
      success: true,
      message: 'Finance rejection email sent successfully using OAuth 2.0',
      data: {
        messageId: result.messageId,
        to: result.to,
        from: result.from,
        authType: 'OAuth 2.0'
      }
    });
  } catch (error) {
    console.error('Error sending OAuth finance rejection email:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send finance rejection email'
    });
  }
});

module.exports = router; 