// src/services/gspService.js

const crypto = require('crypto');

/**
 * Mock GSP service that simulates interaction with the National Informatics Centre (NIC) GST portal.
 */
class GSPService {
  /**
   * Simulates generating an E-invoice (IRN & QR code)
   * @param {Object} invoiceData - Invoice document info
   * @returns {Promise<Object>} Mock response from NIC/GSP
   */
  async generateEInvoice(invoiceData) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate a random 64-hexadecimal character string mimicking NIC IRN hash
    const hash = crypto.createHash('sha256');
    hash.update(`${invoiceData.sellerGSTIN}-${invoiceData.invoiceNumber}-${invoiceData.invoiceDate}`);
    const irn = hash.digest('hex');

    // Mock signed QR Code
    const qrCodeData = `GSTIN:${invoiceData.sellerGSTIN}*BUYER:${invoiceData.buyerGSTIN}*DOC:${invoiceData.invoiceNumber}*AMT:${invoiceData.grandTotal}*IRN:${irn}`;

    return {
      status: 'Generated',
      irn,
      qrCodeData,
      generatedAt: new Date(),
    };
  }

  /**
   * Simulates generating an E-way Bill
   * @param {Object} transportData - Transporter / vehicle details
   * @param {Object} invoiceData - Invoice details
   * @returns {Promise<Object>} Mock response from NIC/GSP
   */
  async generateEWayBill(transportData, invoiceData) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // E-Way Bill Number is a unique 12-digit number starting with a code
    const random12Digits = Math.floor(100000000000 + Math.random() * 900000000000).toString();

    return {
      status: 'Generated',
      eWayBillNo: random12Digits,
      generatedAt: new Date(),
    };
  }
}

module.exports = new GSPService();
