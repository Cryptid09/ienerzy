const express = require('express');
const router = express.Router();
const emailService = require('../services/email');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   GET /api/email/status
 * @desc    Get email service status
 * @access  Private
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const status = emailService.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting email status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get email service status'
    });
  }
});

/**
 * @route   POST /api/email/send-test
 * @desc    Send test email
 * @access  Private
 */
router.post('/send-test', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    const result = await emailService.sendTestEmail(email);
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      data: {
        messageId: result.messageId,
        to: result.to,
        from: result.from
      }
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send test email'
    });
  }
});

/**
 * @route   POST /api/email/emi-reminder
 * @desc    Send EMI reminder email
 * @access  Private
 */
router.post('/emi-reminder', authenticateToken, async (req, res) => {
  try {
    const { email, emiData } = req.body;

    if (!email || !emiData) {
      return res.status(400).json({
        success: false,
        message: 'Email and EMI data are required'
      });
    }

    const result = await emailService.sendEMIReminder(email, emiData);
    
    res.json({
      success: true,
      message: 'EMI reminder email sent successfully',
      data: {
        messageId: result.messageId,
        to: result.to,
        from: result.from
      }
    });
  } catch (error) {
    console.error('Error sending EMI reminder email:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send EMI reminder email'
    });
  }
});

/**
 * @route   POST /api/email/ticket-update
 * @desc    Send service ticket status update email
 * @access  Private
 */
router.post('/ticket-update', authenticateToken, async (req, res) => {
  try {
    const { email, ticketData } = req.body;

    if (!email || !ticketData) {
      return res.status(400).json({
        success: false,
        message: 'Email and ticket data are required'
      });
    }

    const result = await emailService.sendTicketStatusUpdate(email, ticketData);
    
    res.json({
      success: true,
      message: 'Ticket status update email sent successfully',
      data: {
        messageId: result.messageId,
        to: result.to,
        from: result.from
      }
    });
  } catch (error) {
    console.error('Error sending ticket status update email:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send ticket status update email'
    });
  }
});

/**
 * @route   POST /api/email/finance-approval
 * @desc    Send finance approval email
 * @access  Private
 */
router.post('/finance-approval', authenticateToken, async (req, res) => {
  try {
    const { email, financeData } = req.body;

    if (!email || !financeData) {
      return res.status(400).json({
        success: false,
        message: 'Email and finance data are required'
      });
    }

    const result = await emailService.sendFinanceApproval(email, financeData);
    
    res.json({
      success: true,
      message: 'Finance approval email sent successfully',
      data: {
        messageId: result.messageId,
        to: result.to,
        from: result.from
      }
    });
  } catch (error) {
    console.error('Error sending finance approval email:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send finance approval email'
    });
  }
});

/**
 * @route   POST /api/email/finance-rejection
 * @desc    Send finance rejection email
 * @access  Private
 */
router.post('/finance-rejection', authenticateToken, async (req, res) => {
  try {
    const { email, financeData } = req.body;

    if (!email || !financeData) {
      return res.status(400).json({
        success: false,
        message: 'Email and finance data are required'
      });
    }

    const result = await emailService.sendFinanceRejection(email, financeData);
    
    res.json({
      success: true,
      message: 'Finance rejection email sent successfully',
      data: {
        messageId: result.messageId,
        to: result.to,
        from: result.from
      }
    });
  } catch (error) {
    console.error('Error sending finance rejection email:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send finance rejection email'
    });
  }
});

/**
 * @route   POST /api/email/send-custom
 * @desc    Send custom email
 * @access  Private
 */
router.post('/send-custom', authenticateToken, async (req, res) => {
  try {
    const { email, subject, message } = req.body;

    if (!email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Email, subject, and message are required'
      });
    }

    // Create simple HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 ${subject}</h1>
          </div>
          <div class="content">
            ${message.replace(/\n/g, '<br>')}
            <p>Best regards,<br>Team Ienerzy</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await emailService.sendEmail(email, subject, htmlContent, message);
    
    res.json({
      success: true,
      message: 'Custom email sent successfully',
      data: {
        messageId: result.messageId,
        to: result.to,
        from: result.from
      }
    });
  } catch (error) {
    console.error('Error sending custom email:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send custom email'
    });
  }
});

module.exports = router; 