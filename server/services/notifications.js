const messagingService = require('./messaging');
const emailService = require('./email');

class NotificationService {
  constructor() {
    this.smsAvailable = messagingService.isAvailable();
    this.emailAvailable = emailService.isAvailable();
  }

  /**
   * Send EMI reminder via both SMS and email
   * @param {Object} contactInfo - Contact information
   * @param {Object} emiData - EMI information
   * @returns {Promise<Object>} - Notification results
   */
  async sendEMIReminder(contactInfo, emiData) {
    const results = {
      sms: null,
      email: null,
      success: false
    };

    try {
      // Send SMS if available
      if (this.smsAvailable && contactInfo.phone) {
        try {
          results.sms = await messagingService.sendPaymentReminder(contactInfo.phone, {
            amount: emiData.amount,
            description: emiData.description,
            dueDate: emiData.dueDate
          });
        } catch (error) {
          console.error('SMS sending failed:', error.message);
        }
      }

      // Send email if available
      if (this.emailAvailable && contactInfo.email) {
        try {
          results.email = await emailService.sendEMIReminder(contactInfo.email, emiData);
        } catch (error) {
          console.error('Email sending failed:', error.message);
        }
      }

      results.success = results.sms || results.email;
      return results;
    } catch (error) {
      console.error('EMI reminder notification failed:', error.message);
      throw error;
    }
  }

  /**
   * Send service ticket status update via both SMS and email
   * @param {Object} contactInfo - Contact information
   * @param {Object} ticketData - Service ticket information
   * @returns {Promise<Object>} - Notification results
   */
  async sendTicketStatusUpdate(contactInfo, ticketData) {
    const results = {
      sms: null,
      email: null,
      success: false
    };

    try {
      // Send SMS if available
      if (this.smsAvailable && contactInfo.phone) {
        try {
          results.sms = await messagingService.sendServiceNotification(contactInfo.phone, ticketData);
        } catch (error) {
          console.error('SMS sending failed:', error.message);
        }
      }

      // Send email if available
      if (this.emailAvailable && contactInfo.email) {
        try {
          results.email = await emailService.sendTicketStatusUpdate(contactInfo.email, ticketData);
        } catch (error) {
          console.error('Email sending failed:', error.message);
        }
      }

      results.success = results.sms || results.email;
      return results;
    } catch (error) {
      console.error('Ticket status update notification failed:', error.message);
      throw error;
    }
  }

  /**
   * Send finance approval notification via both SMS and email
   * @param {Object} contactInfo - Contact information
   * @param {Object} financeData - Finance application information
   * @returns {Promise<Object>} - Notification results
   */
  async sendFinanceApproval(contactInfo, financeData) {
    const results = {
      sms: null,
      email: null,
      success: false
    };

    try {
      // Send SMS if available
      if (this.smsAvailable && contactInfo.phone) {
        try {
          const smsMessage = `Congratulations! Your finance application #${financeData.id} for ₹${financeData.amount} has been approved. EMI schedule will be sent shortly.`;
          results.sms = await messagingService.sendSMS(contactInfo.phone, smsMessage);
        } catch (error) {
          console.error('SMS sending failed:', error.message);
        }
      }

      // Send email if available
      if (this.emailAvailable && contactInfo.email) {
        try {
          results.email = await emailService.sendFinanceApproval(contactInfo.email, financeData);
        } catch (error) {
          console.error('Email sending failed:', error.message);
        }
      }

      results.success = results.sms || results.email;
      return results;
    } catch (error) {
      console.error('Finance approval notification failed:', error.message);
      throw error;
    }
  }

  /**
   * Send finance rejection notification via both SMS and email
   * @param {Object} contactInfo - Contact information
   * @param {Object} financeData - Finance application information
   * @returns {Promise<Object>} - Notification results
   */
  async sendFinanceRejection(contactInfo, financeData) {
    const results = {
      sms: null,
      email: null,
      success: false
    };

    try {
      // Send SMS if available
      if (this.smsAvailable && contactInfo.phone) {
        try {
          const smsMessage = `Your finance application #${financeData.id} requires additional information. Please contact our support team for details.`;
          results.sms = await messagingService.sendSMS(contactInfo.phone, smsMessage);
        } catch (error) {
          console.error('SMS sending failed:', error.message);
        }
      }

      // Send email if available
      if (this.emailAvailable && contactInfo.email) {
        try {
          results.email = await emailService.sendFinanceRejection(contactInfo.email, financeData);
        } catch (error) {
          console.error('Email sending failed:', error.message);
        }
      }

      results.success = results.sms || results.email;
      return results;
    } catch (error) {
      console.error('Finance rejection notification failed:', error.message);
      throw error;
    }
  }

  /**
   * Send battery status notification via both SMS and email
   * @param {Object} contactInfo - Contact information
   * @param {Object} batteryData - Battery information
   * @returns {Promise<Object>} - Notification results
   */
  async sendBatteryStatusUpdate(contactInfo, batteryData) {
    const results = {
      sms: null,
      email: null,
      success: false
    };

    try {
      // Send SMS if available
      if (this.smsAvailable && contactInfo.phone) {
        try {
          results.sms = await messagingService.sendBatteryStatus(contactInfo.phone, batteryData);
        } catch (error) {
          console.error('SMS sending failed:', error.message);
        }
      }

      // Send email if available
      if (this.emailAvailable && contactInfo.email) {
        try {
          const subject = `Battery ${batteryData.id} Status Update`;
          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Battery Status Update</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
                .status { font-size: 18px; font-weight: bold; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔋 Battery Status Update</h1>
                </div>
                <div class="content">
                  <h2>Hello ${contactInfo.name || 'there'},</h2>
                  <p>Your battery status has been updated:</p>
                  
                  <p><strong>Battery ID:</strong> ${batteryData.id}</p>
                  <p><strong>Status:</strong> <span class="status">${batteryData.status}</span></p>
                  <p><strong>Voltage:</strong> ${batteryData.voltage}V</p>
                  <p><strong>Temperature:</strong> ${batteryData.temperature}°C</p>
                  
                  <p>Best regards,<br>Team Ienerzy</p>
                </div>
                <div class="footer">
                  <p>This is an automated notification. Please do not reply.</p>
                </div>
              </div>
            </body>
            </html>
          `;
          
          results.email = await emailService.sendEmail(contactInfo.email, subject, htmlContent);
        } catch (error) {
          console.error('Email sending failed:', error.message);
        }
      }

      results.success = results.sms || results.email;
      return results;
    } catch (error) {
      console.error('Battery status notification failed:', error.message);
      throw error;
    }
  }

  /**
   * Send OTP verification via both SMS and email
   * @param {Object} contactInfo - Contact information
   * @param {string} otp - OTP code
   * @returns {Promise<Object>} - Notification results
   */
  async sendOTPVerification(contactInfo, otp) {
    const results = {
      sms: null,
      email: null,
      success: false
    };

    try {
      // Send SMS if available
      if (this.smsAvailable && contactInfo.phone) {
        try {
          results.sms = await messagingService.sendOTP(contactInfo.phone, otp);
        } catch (error) {
          console.error('SMS sending failed:', error.message);
        }
      }

      // Send email if available
      if (this.emailAvailable && contactInfo.email) {
        try {
          const subject = 'OTP Verification - Ienerzy';
          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>OTP Verification</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
                .otp { background: #fef3c7; padding: 15px; border-radius: 4px; margin: 15px 0; text-align: center; font-size: 24px; font-weight: bold; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔐 OTP Verification</h1>
                </div>
                <div class="content">
                  <h2>Hello ${contactInfo.name || 'there'},</h2>
                  <p>Your verification code is:</p>
                  
                  <div class="otp">${otp}</div>
                  
                  <p>This code is valid for 10 minutes. Do not share this code with anyone.</p>
                  
                  <p>Best regards,<br>Team Ienerzy</p>
                </div>
                <div class="footer">
                  <p>This is an automated message. Please do not reply.</p>
                </div>
              </div>
            </body>
            </html>
          `;
          
          results.email = await emailService.sendEmail(contactInfo.email, subject, htmlContent);
        } catch (error) {
          console.error('Email sending failed:', error.message);
        }
      }

      results.success = results.sms || results.email;
      return results;
    } catch (error) {
      console.error('OTP verification notification failed:', error.message);
      throw error;
    }
  }

  /**
   * Get overall notification service status
   * @returns {Object} - Service status details
   */
  getStatus() {
    return {
      sms: {
        available: this.smsAvailable,
        provider: 'Twilio',
        status: messagingService.getStatus()
      },
      email: {
        available: this.emailAvailable,
        provider: 'Gmail SMTP',
        status: emailService.getStatus()
      },
      overall: {
        available: this.smsAvailable || this.emailAvailable,
        services: {
          sms: this.smsAvailable,
          email: this.emailAvailable
        }
      }
    };
  }

  /**
   * Check if any notification service is available
   * @returns {boolean} - True if at least one service is available
   */
  isAvailable() {
    return this.smsAvailable || this.emailAvailable;
  }
}

module.exports = new NotificationService(); 