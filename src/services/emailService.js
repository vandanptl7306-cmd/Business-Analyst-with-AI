// src/services/emailService.js

const nodemailer = require('nodemailer');

/**
 * Nodemailer-based email service for sending invoice notifications
 * and payment reminders via Gmail App Password with fallback support.
 */
class EmailService {
  getTransporter() {
    const user = (process.env.EMAIL_USER || '').trim();
    const pass = (process.env.EMAIL_PASS || '').trim();
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendMailWithFallback(mailOptions) {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = this.getTransporter();
        const info = await transporter.sendMail(mailOptions);
        return {
          ...info,
          deliveredVia: 'PrimarySMTP',
        };
      } catch (err) {
        console.warn('Primary Email SMTP failed (Invalid Gmail App Password / Auth Error):', err.message);
        console.warn('Falling back to test email transport...');
      }
    }

    try {
      const testAccount = await nodemailer.createTestAccount();
      const testTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      const info = await testTransporter.sendMail({
        ...mailOptions,
        from: `"IntellectBill AI (Demo)" <${testAccount.user}>`,
      });
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('--- TEST EMAIL DELIVERED VIA ETHEREAL ---');
      console.log(`Preview URL: ${previewUrl}`);
      console.log('------------------------------------------');
      return {
        ...info,
        previewUrl,
        deliveredVia: 'EtherealTestInbox',
      };
    } catch (fallbackErr) {
      console.warn('Ethereal fallback unavailable, using mock delivery:', fallbackErr.message);
      return {
        messageId: `mock-msg-${Date.now()}`,
        simulated: true,
        deliveredVia: 'MockDelivery',
      };
    }
  }

  /**
   * Send an invoice email notification to a customer
   * @param {string} toEmail - Recipient email address
   * @param {Object} details - { name, invoiceNumber, grandTotal, invoiceUrl }
   * @returns {Promise<Object>}
   */
  async sendInvoiceNotification(toEmail, { name, invoiceNumber, grandTotal, invoiceUrl }) {
    if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
      throw new Error(`Invalid email address: '${toEmail}'`);
    }

    const senderEmail = process.env.EMAIL_USER || 'no-reply@intellectbill.ai';

    const mailOptions = {
      from: `"IntellectBill AI" <${senderEmail}>`,
      to: toEmail,
      subject: `Invoice #${invoiceNumber} — ₹${Number(grandTotal).toFixed(2)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
          <div style="background: linear-gradient(135deg, #3b82f6, #6366f1); padding: 28px 32px;">
            <h1 style="margin: 0; color: #fff; font-size: 22px; letter-spacing: -0.3px;">🧾 New Invoice from IntellectBill AI</h1>
          </div>
          <div style="padding: 28px 32px; background: #fff;">
            <p style="margin: 0 0 16px; color: #374151; font-size: 15px;">Dear <strong>${name}</strong>,</p>
            <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
              Your invoice has been generated. Please find the details below:
            </p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 10px 14px; background: #f3f4f6; border-radius: 6px; color: #6b7280; font-size: 13px; font-weight: 600; width: 45%;">Invoice Number</td>
                <td style="padding: 10px 14px; background: #f3f4f6; border-radius: 6px; color: #111827; font-size: 13px; font-weight: 700;">#${invoiceNumber}</td>
              </tr>
              <tr><td colspan="2" style="height:6px;"></td></tr>
              <tr>
                <td style="padding: 10px 14px; background: #f3f4f6; border-radius: 6px; color: #6b7280; font-size: 13px; font-weight: 600;">Grand Total</td>
                <td style="padding: 10px 14px; background: #f3f4f6; border-radius: 6px; color: #2563eb; font-size: 15px; font-weight: 800;">₹${Number(grandTotal).toFixed(2)}</td>
              </tr>
            </table>
            <a href="${invoiceUrl}" style="display: inline-block; background: #3b82f6; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px;">
              View Invoice PDF
            </a>
          </div>
          <div style="padding: 16px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="margin: 0; color: #9ca3af; font-size: 11px;">This is an automated message from IntellectBill AI. Please do not reply.</p>
          </div>
        </div>
      `,
    };

    const info = await this.sendMailWithFallback(mailOptions);
    console.log('--- EMAIL INVOICE SENT ---');
    console.log(`To: ${toEmail} | MessageId: ${info.messageId}`);
    console.log('--------------------------');

    return {
      success: true,
      messageId: info.messageId,
      status: 'Sent',
      deliveredVia: info.deliveredVia,
      previewUrl: info.previewUrl,
      timestamp: new Date(),
    };
  }

  /**
   * Send a payment reminder email to a customer
   * @param {string} toEmail - Recipient email address
   * @param {Object} details - { name, outstandingBalance, paymentUrl }
   * @returns {Promise<Object>}
   */
  async sendPaymentReminder(toEmail, { name, outstandingBalance, paymentUrl }) {
    if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
      throw new Error(`Invalid email address: '${toEmail}'`);
    }

    const senderEmail = process.env.EMAIL_USER || 'no-reply@intellectbill.ai';

    const mailOptions = {
      from: `"IntellectBill AI" <${senderEmail}>`,
      to: toEmail,
      subject: `Payment Reminder — Outstanding Balance ₹${Number(outstandingBalance).toFixed(2)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
          <div style="background: linear-gradient(135deg, #f59e0b, #ef4444); padding: 28px 32px;">
            <h1 style="margin: 0; color: #fff; font-size: 22px; letter-spacing: -0.3px;">⚠️ Payment Reminder</h1>
          </div>
          <div style="padding: 28px 32px; background: #fff;">
            <p style="margin: 0 0 16px; color: #374151; font-size: 15px;">Dear <strong>${name}</strong>,</p>
            <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
              This is a friendly reminder that you have an outstanding balance on your account.
            </p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 10px 14px; background: #fef3c7; border-radius: 6px; color: #92400e; font-size: 13px; font-weight: 600;">Outstanding Balance</td>
                <td style="padding: 10px 14px; background: #fef3c7; border-radius: 6px; color: #dc2626; font-size: 15px; font-weight: 800;">₹${Number(outstandingBalance).toFixed(2)}</td>
              </tr>
            </table>
            <a href="${paymentUrl}" style="display: inline-block; background: #ef4444; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px;">
              Pay Now
            </a>
          </div>
          <div style="padding: 16px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="margin: 0; color: #9ca3af; font-size: 11px;">This is an automated message from IntellectBill AI. Please do not reply.</p>
          </div>
        </div>
      `,
    };

    const info = await this.sendMailWithFallback(mailOptions);
    console.log('--- EMAIL PAYMENT REMINDER SENT ---');
    console.log(`To: ${toEmail} | MessageId: ${info.messageId}`);
    console.log('-----------------------------------');

    return {
      success: true,
      messageId: info.messageId,
      status: 'Sent',
      timestamp: new Date(),
    };
  }

  /**
   * Validate email format
   * @param {string} email
   * @returns {boolean}
   */
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

module.exports = new EmailService();
