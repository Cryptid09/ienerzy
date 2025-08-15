const express = require('express');
const router = express.Router();
const messagingService = require('../services/messaging');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   GET /api/messaging/status
 * @desc    Get messaging service status
 * @access  Private
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const status = messagingService.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting messaging status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get messaging service status'
    });
  }
});

/**
 * @route   POST /api/messaging/send-sms
 * @desc    Send SMS message
 * @access  Private
 */
router.post('/send-sms', authenticateToken, async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and message are required'
      });
    }

    const result = await messagingService.sendSMS(phoneNumber, message);
    
    res.json({
      success: true,
      message: 'SMS sent successfully',
      data: {
        sid: result.sid,
        status: result.status,
        to: result.to,
        from: result.from
      }
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send SMS'
    });
  }
});

/**
 * @route   POST /api/messaging/send-otp
 * @desc    Send OTP verification SMS
 * @access  Private
 */
router.post('/send-otp', authenticateToken, async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required'
      });
    }

    const result = await messagingService.sendOTP(phoneNumber, otp);
    
    res.json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        sid: result.sid,
        status: result.status,
        to: result.to
      }
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP'
    });
  }
});

/**
 * @route   POST /api/messaging/battery-status
 * @desc    Send battery status notification
 * @access  Private
 */
router.post('/battery-status', authenticateToken, async (req, res) => {
  try {
    const { phoneNumber, batteryData } = req.body;

    if (!phoneNumber || !batteryData) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and battery data are required'
      });
    }

    const result = await messagingService.sendBatteryStatus(phoneNumber, batteryData);
    
    res.json({
      success: true,
      message: 'Battery status notification sent successfully',
      data: {
        sid: result.sid,
        status: result.status,
        to: result.to
      }
    });
  } catch (error) {
    console.error('Error sending battery status notification:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send battery status notification'
    });
  }
});

/**
 * @route   POST /api/messaging/service-notification
 * @desc    Send service ticket notification
 * @access  Private
 */
router.post('/service-notification', authenticateToken, async (req, res) => {
  try {
    const { phoneNumber, ticketData } = req.body;

    if (!phoneNumber || !ticketData) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and ticket data are required'
      });
    }

    const result = await messagingService.sendServiceNotification(phoneNumber, ticketData);
    
    res.json({
      success: true,
      message: 'Service notification sent successfully',
      data: {
        sid: result.sid,
        status: result.status,
        to: result.to
      }
    });
  } catch (error) {
    console.error('Error sending service notification:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send service notification'
    });
  }
});

/**
 * @route   POST /api/messaging/payment-reminder
 * @desc    Send payment reminder
 * @access  Private
 */
router.post('/payment-reminder', authenticateToken, async (req, res) => {
  try {
    const { phoneNumber, paymentData } = req.body;

    if (!phoneNumber || !paymentData) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and payment data are required'
      });
    }

    const result = await messagingService.sendPaymentReminder(phoneNumber, paymentData);
    
    res.json({
      success: true,
      message: 'Payment reminder sent successfully',
      data: {
        sid: result.sid,
        status: result.status,
        to: result.to
      }
    });
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send payment reminder'
    });
  }
});

/**
 * @route   POST /api/messaging/test
 * @desc    Test messaging service (for development)
 * @access  Private
 */
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const testMessage = 'This is a test message from Ienerzy messaging service. If you receive this, the SMS integration is working correctly!';
    const result = await messagingService.sendSMS(phoneNumber, testMessage);
    
    res.json({
      success: true,
      message: 'Test SMS sent successfully',
      data: {
        sid: result.sid,
        status: result.status,
        to: result.to,
        from: result.from
      }
    });
  } catch (error) {
    console.error('Error sending test SMS:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send test SMS'
    });
  }
});

module.exports = router; 