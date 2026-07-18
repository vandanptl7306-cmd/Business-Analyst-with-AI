// src/services/emailService.js

const nodemailer = require('nodemailer');

/**
 * Nodemailer-based email service for sending invoice notifications
 * and payment reminders via Gmail App Password.
 */
class EmailService {
  /**
   * Creates a fresh transporter on every call so it always reads
   * the latest process.env values (avoids stale values at startup).
   */
  getTransporter() {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
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

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email credentials are not configured in environment variables.');
    }

    const mailOptions = {
      from: `"IntellectBill AI" <${process.env.EMAIL_USER}>`,
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

    const transporter = this.getTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log('--- EMAIL INVOICE SENT ---');
    console.log(`To: ${toEmail} | MessageId: ${info.messageId}`);
    console.log('--------------------------');

    return {
      success: true,
      messageId: info.messageId,
      status: 'Sent',
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

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email credentials are not configured in environment variables.');
    }

    const mailOptions = {
      from: `"IntellectBill AI" <${process.env.EMAIL_USER}>`,
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

    const transporter = this.getTransporter();
    const info = await transporter.sendMail(mailOptions);
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
