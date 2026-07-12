// src/services/whatsappService.js

/**
 * Mock WhatsApp Business / Twilio API integration helper.
 */
class WhatsAppService {
  /**
   * Helper to validate if phone number is in E.164 international format
   * (e.g. +919876543210, +14155552671)
   */
  isValidE164(phone) {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  }

  /**
   * Simulate sending a PDF invoice notification to a user's WhatsApp number
   * @param {string} phoneNumber - E.164 phone number
   * @param {Object} details - { name, invoiceNumber, grandTotal, invoiceUrl }
   * @returns {Promise<Object>} Mock response
   */
  async sendInvoiceNotification(phoneNumber, { name, invoiceNumber, grandTotal, invoiceUrl }) {
    if (!this.isValidE164(phoneNumber)) {
      throw new Error(`Phone number '${phoneNumber}' must be in standard E.164 format (e.g. +919876543210).`);
    }

    if (!process.env.WHATSAPP_API_KEY) {
      throw new Error('WhatsApp API key is not configured in the environment variables.');
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Construct mock API request template body
    const mockRequestPayload = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'template',
      template: {
        name: 'invoice_billing_notification',
        language: { code: 'en_US' },
        components: [
          {
            type: 'header',
            parameters: [{ type: 'document', document: { link: invoiceUrl, filename: `${invoiceNumber}.pdf` } }]
          },
          {
            type: 'body',
            parameters: [
              { type: 'text', text: name },
              { type: 'text', text: invoiceNumber },
              { type: 'currency', currency: { fallback_value: `$${grandTotal.toFixed(2)}`, code: 'USD', amount_1000: grandTotal * 1000 } }
            ]
          }
        ]
      }
    };

    console.log('--- MOCK WHATSAPP OUTGOING ---');
    console.log(JSON.stringify(mockRequestPayload, null, 2));
    console.log('------------------------------');

    return {
      success: true,
      messageId: `wamid.HBgL${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      status: 'Sent',
      timestamp: new Date()
    };
  }

  /**
   * Simulate sending an outstanding balance reminder to a user's WhatsApp number
   * @param {string} phoneNumber - E.164 phone number
   * @param {Object} details - { name, outstandingBalance, paymentUrl }
   * @returns {Promise<Object>} Mock response
   */
  async sendPaymentReminder(phoneNumber, { name, outstandingBalance, paymentUrl }) {
    if (!this.isValidE164(phoneNumber)) {
      throw new Error(`Phone number '${phoneNumber}' must be in standard E.164 format (e.g. +919876543210).`);
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Construct mock text reminder template body
    const mockRequestPayload = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'template',
      template: {
        name: 'payment_reminder_outstanding',
        language: { code: 'en_US' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: name },
              { type: 'currency', currency: { fallback_value: `$${outstandingBalance.toFixed(2)}`, code: 'USD', amount_1000: outstandingBalance * 1000 } },
              { type: 'text', text: paymentUrl }
            ]
          }
        ]
      }
    };

    console.log('--- MOCK WHATSAPP OUTGOING REMINDER ---');
    console.log(JSON.stringify(mockRequestPayload, null, 2));
    console.log('---------------------------------------');

    return {
      success: true,
      messageId: `wamid.HBgL${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      status: 'Sent',
      timestamp: new Date()
    };
  }
}

module.exports = new WhatsAppService();
