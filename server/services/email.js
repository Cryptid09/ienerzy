const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.fromEmail = null;
    this.fromName = null;
    this.initialize();
  }

  initialize() {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;
    const fromName = process.env.GMAIL_FROM_NAME || 'Ienerzy Notifications';

    if (!gmailUser || !gmailPassword) {
      console.warn('Gmail credentials not configured. Email functionality will be disabled.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPassword
        }
      });

      this.fromEmail = gmailUser;
      this.fromName = fromName;
      
      console.log('Gmail email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Gmail email service:', error.message);
    }
  }

  /**
   * Send email using Gmail SMTP
   * @param {string} to - Recipient email address
   * @param {string} subject - Email subject
   * @param {string} htmlContent - HTML email content
   * @param {string} textContent - Plain text email content (optional)
   * @returns {Promise<Object>} - Nodemailer result object
   */
  async sendEmail(to, subject, htmlContent, textContent = null) {
    if (!this.transporter || !this.fromEmail) {
      throw new Error('Email service not initialized. Check your Gmail environment variables.');
    }

    try {
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: to,
        subject: subject,
        html: htmlContent
      };

      if (textContent) {
        mailOptions.text = textContent;
      }

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`Email sent successfully to ${to}. Message ID: ${result.messageId}`);
      return result;
    } catch (error) {
      console.error('Failed to send email:', error.message);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send EMI reminder email
   * @param {string} email - Recipient email
   * @param {Object} emiData - EMI information
   * @returns {Promise<Object>} - Email result
   */
  async sendEMIReminder(email, emiData) {
    const subject = `EMI Reminder - Payment Due on ${emiData.dueDate}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>EMI Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .amount { font-size: 24px; font-weight: bold; color: #dc2626; }
          .due-date { background: #fef3c7; padding: 10px; border-radius: 4px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 EMI Payment Reminder</h1>
          </div>
          <div class="content">
            <h2>Hello ${emiData.consumerName},</h2>
            <p>This is a friendly reminder that your EMI payment is due soon.</p>
            
            <div class="due-date">
              <strong>Due Date:</strong> ${emiData.dueDate}
            </div>
            
            <p><strong>Amount Due:</strong> <span class="amount">₹${emiData.amount}</span></p>
            <p><strong>Description:</strong> ${emiData.description}</p>
            
            <p>Please ensure timely payment to avoid any late fees or service interruptions.</p>
            
            <p>If you have already made the payment, please disregard this reminder.</p>
            
            <p>Best regards,<br>Team Ienerzy</p>
          </div>
          <div class="footer">
            <p>This is an automated reminder. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      EMI Payment Reminder
      
      Hello ${emiData.consumerName},
      
      This is a friendly reminder that your EMI payment is due soon.
      
      Due Date: ${emiData.dueDate}
      Amount Due: ₹${emiData.amount}
      Description: ${emiData.description}
      
      Please ensure timely payment to avoid any late fees or service interruptions.
      
      If you have already made the payment, please disregard this reminder.
      
      Best regards,
      Team Ienerzy
      
      This is an automated reminder. Please do not reply to this email.
    `;

    return this.sendEmail(email, subject, htmlContent, textContent);
  }

  /**
   * Send service ticket status update email
   * @param {string} email - Recipient email
   * @param {Object} ticketData - Service ticket information
   * @returns {Promise<Object>} - Email result
   */
  async sendTicketStatusUpdate(email, ticketData) {
    const subject = `Service Ticket #${ticketData.id} - Status Updated to ${ticketData.status}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Service Ticket Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .ticket-id { background: #dbeafe; padding: 10px; border-radius: 4px; margin: 15px 0; }
          .status { font-size: 18px; font-weight: bold; }
          .priority-high { color: #dc2626; }
          .priority-medium { color: #ea580c; }
          .priority-low { color: #059669; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔧 Service Ticket Update</h1>
          </div>
          <div class="content">
            <h2>Hello ${ticketData.consumerName},</h2>
            <p>Your service ticket has been updated with the following information:</p>
            
            <div class="ticket-id">
              <strong>Ticket ID:</strong> #${ticketData.id}
            </div>
            
            <p><strong>New Status:</strong> <span class="status">${ticketData.status}</span></p>
            <p><strong>Priority:</strong> <span class="priority-${ticketData.priority.toLowerCase()}">${ticketData.priority}</span></p>
            <p><strong>Issue Category:</strong> ${ticketData.issueCategory}</p>
            <p><strong>Description:</strong> ${ticketData.description}</p>
            
            ${ticketData.assignedTo ? `<p><strong>Assigned To:</strong> ${ticketData.assignedTo}</p>` : ''}
            ${ticketData.location ? `<p><strong>Location:</strong> ${ticketData.location}</p>` : ''}
            
            <p>We will keep you updated on any further developments.</p>
            
            <p>Best regards,<br>Team Ienerzy</p>
          </div>
          <div class="footer">
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Service Ticket Update
      
      Hello ${ticketData.consumerName},
      
      Your service ticket has been updated with the following information:
      
      Ticket ID: #${ticketData.id}
      New Status: ${ticketData.status}
      Priority: ${ticketData.priority}
      Issue Category: ${ticketData.issueCategory}
      Description: ${ticketData.description}
      ${ticketData.assignedTo ? `Assigned To: ${ticketData.assignedTo}` : ''}
      ${ticketData.location ? `Location: ${ticketData.location}` : ''}
      
      We will keep you updated on any further developments.
      
      Best regards,
      Team Ienerzy
      
      This is an automated notification. Please do not reply to this email.
    `;

    return this.sendEmail(email, ticketData.consumerEmail, subject, htmlContent, textContent);
  }

  /**
   * Send finance approval email
   * @param {string} email - Recipient email
   * @param {Object} financeData - Finance application information
   * @returns {Promise<Object>} - Email result
   */
  async sendFinanceApproval(email, financeData) {
    const subject = `Finance Application Approved - ₹${financeData.amount}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Finance Application Approved</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .approved { background: #d1fae5; padding: 15px; border-radius: 4px; margin: 15px 0; text-align: center; }
          .amount { font-size: 24px; font-weight: bold; color: #059669; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Finance Application Approved</h1>
          </div>
          <div class="content">
            <h2>Congratulations ${financeData.consumerName}!</h2>
            
            <div class="approved">
              <h3>Your finance application has been approved!</h3>
            </div>
            
            <p><strong>Application ID:</strong> #${financeData.id}</p>
            <p><strong>Approved Amount:</strong> <span class="amount">₹${financeData.amount}</span></p>
            <p><strong>Battery ID:</strong> ${financeData.batteryId}</p>
            <p><strong>Approval Date:</strong> ${financeData.approvalDate}</p>
            
            <p>Your EMI schedule will be sent to you shortly. Please ensure timely payments to maintain a good credit score.</p>
            
            <p>If you have any questions, please contact our support team.</p>
            
            <p>Best regards,<br>Team Ienerzy</p>
          </div>
          <div class="footer">
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Finance Application Approved
      
      Congratulations ${financeData.consumerName}!
      
      Your finance application has been approved!
      
      Application ID: #${financeData.id}
      Approved Amount: ₹${financeData.amount}
      Battery ID: ${financeData.batteryId}
      Approval Date: ${financeData.approvalDate}
      
      Your EMI schedule will be sent to you shortly. Please ensure timely payments to maintain a good credit score.
      
      If you have any questions, please contact our support team.
      
      Best regards,
      Team Ienerzy
      
      This is an automated notification. Please do not reply to this email.
    `;

    return this.sendEmail(email, subject, htmlContent, textContent);
  }

  /**
   * Send finance rejection email
   * @param {string} email - Recipient email
   * @param {Object} financeData - Finance application information
   * @returns {Promise<Object>} - Email result
   */
  async sendFinanceRejection(email, financeData) {
    const subject = `Finance Application Update - Application #${financeData.id}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Finance Application Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .rejection { background: #fee2e2; padding: 15px; border-radius: 4px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Finance Application Update</h1>
          </div>
          <div class="content">
            <h2>Hello ${financeData.consumerName},</h2>
            
            <div class="rejection">
              <h3>Your finance application requires additional information</h3>
            </div>
            
            <p><strong>Application ID:</strong> #${financeData.id}</p>
            <p><strong>Requested Amount:</strong> ₹${financeData.amount}</p>
            <p><strong>Battery ID:</strong> ${financeData.batteryId}</p>
            
            <p>We regret to inform you that your finance application could not be processed at this time. This may be due to:</p>
            <ul>
              <li>Incomplete documentation</li>
              <li>Credit score requirements not met</li>
              <li>Additional verification needed</li>
            </ul>
            
            <p>Please contact our support team to discuss the next steps and requirements.</p>
            
            <p>Best regards,<br>Team Ienerzy</p>
          </div>
          <div class="footer">
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Finance Application Update
      
      Hello ${financeData.consumerName},
      
      Your finance application requires additional information
      
      Application ID: #${financeData.id}
      Requested Amount: ₹${financeData.amount}
      Battery ID: ${financeData.batteryId}
      
      We regret to inform you that your finance application could not be processed at this time. This may be due to:
      - Incomplete documentation
      - Credit score requirements not met
      - Additional verification needed
      
      Please contact our support team to discuss the next steps and requirements.
      
      Best regards,
      Team Ienerzy
      
      This is an automated notification. Please do not reply to this email.
    `;

    return this.sendEmail(email, subject, htmlContent, textContent);
  }

  /**
   * Send test email
   * @param {string} email - Recipient email
   * @returns {Promise<Object>} - Email result
   */
  async sendTestEmail(email) {
    const subject = 'Test Email from Ienerzy Email Service';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Test Email</title>
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
            <h1>🧪 Test Email</h1>
          </div>
          <div class="content">
            <h2>Hello!</h2>
            <p>This is a test email from the Ienerzy email service.</p>
            <p>If you receive this email, it means:</p>
            <ul>
              <li>✅ Gmail SMTP is properly configured</li>
              <li>✅ Email service is working correctly</li>
              <li>✅ You can now receive automated notifications</li>
            </ul>
            <p>Best regards,<br>Team Ienerzy</p>
          </div>
          <div class="footer">
            <p>This is a test email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Test Email from Ienerzy Email Service
      
      Hello!
      
      This is a test email from the Ienerzy email service.
      
      If you receive this email, it means:
      - Gmail SMTP is properly configured
      - Email service is working correctly
      - You can now receive automated notifications
      
      Best regards,
      Team Ienerzy
      
      This is a test email. Please do not reply.
    `;

    return this.sendEmail(email, subject, htmlContent, textContent);
  }

  /**
   * Check if email service is available
   * @returns {boolean} - True if service is initialized
   */
  isAvailable() {
    return !!(this.transporter && this.fromEmail);
  }

  /**
   * Get service status information
   * @returns {Object} - Service status details
   */
  getStatus() {
    return {
      available: this.isAvailable(),
      provider: 'Gmail SMTP',
      email: this.fromEmail,
      name: this.fromName,
      initialized: !!this.transporter
    };
  }
}

module.exports = new EmailService(); 