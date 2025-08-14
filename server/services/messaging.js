const twilio = require('twilio');

class MessagingService {
  constructor() {
    this.client = null;
    this.phoneNumber = null;
    this.initialize();
  }

  initialize() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !phoneNumber) {
      console.warn('Twilio credentials not configured. SMS functionality will be disabled.');
      return;
    }

    try {
      this.client = twilio(accountSid, authToken);
      this.phoneNumber = phoneNumber;
      console.log('Twilio messaging service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Twilio:', error.message);
    }
  }

  /**
   * Send SMS message using Twilio
   * @param {string} to - Recipient phone number (with country code)
   * @param {string} message - Message content
   * @returns {Promise<Object>} - Twilio message object
   */
  async sendSMS(to, message) {
    if (!this.client || !this.phoneNumber) {
      throw new Error('Twilio service not initialized. Check your environment variables.');
    }

    try {
      // Format phone number to ensure it has country code
      const formattedNumber = this.formatPhoneNumber(to);
      
      const result = await this.client.messages.create({
        body: message,
        from: this.phoneNumber,
        to: formattedNumber
      });

      console.log(`SMS sent successfully to ${formattedNumber}. SID: ${result.sid}`);
      return result;
    } catch (error) {
      console.error('Failed to send SMS:', error.message);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Send OTP verification SMS
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} otp - OTP code
   * @returns {Promise<Object>} - Twilio message object
   */
  async sendOTP(phoneNumber, otp) {
    const message = `Your Ienerzy verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send battery status notification
   * @param {string} phoneNumber - Recipient phone number
   * @param {Object} batteryData - Battery information
   * @returns {Promise<Object>} - Twilio message object
   */
  async sendBatteryStatus(phoneNumber, batteryData) {
    const message = `Battery ${batteryData.id} Status: ${batteryData.status}. Voltage: ${batteryData.voltage}V, Temperature: ${batteryData.temperature}°C`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send service ticket notification
   * @param {string} phoneNumber - Recipient phone number
   * @param {Object} ticketData - Service ticket information
   * @returns {Promise<Object>} - Twilio message object
   */
  async sendServiceNotification(phoneNumber, ticketData) {
    const message = `Service Ticket #${ticketData.id} has been ${ticketData.status}. Priority: ${ticketData.priority}. Description: ${ticketData.description}`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send payment reminder
   * @param {string} phoneNumber - Recipient phone number
   * @param {Object} paymentData - Payment information
   * @returns {Promise<Object>} - Twilio message object
   */
  async sendPaymentReminder(phoneNumber, paymentData) {
    const message = `Payment Reminder: Amount due ₹${paymentData.amount} for ${paymentData.description}. Due date: ${paymentData.dueDate}`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Format phone number to ensure it has country code
   * @param {string} phoneNumber - Phone number to format
   * @returns {string} - Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // If number starts with 0, replace with 91 (India)
    if (cleaned.startsWith('0')) {
      cleaned = '91' + cleaned.substring(1);
    }
    
    // If number doesn't start with country code, assume India (+91)
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    // Add + prefix
    return '+' + cleaned;
  }

  /**
   * Check if Twilio service is available
   * @returns {boolean} - True if service is initialized
   */
  isAvailable() {
    return !!(this.client && this.phoneNumber);
  }

  /**
   * Get service status information
   * @returns {Object} - Service status details
   */
  getStatus() {
    return {
      available: this.isAvailable(),
      provider: 'Twilio',
      phoneNumber: this.phoneNumber,
      initialized: !!this.client
    };
  }
}

module.exports = new MessagingService(); 