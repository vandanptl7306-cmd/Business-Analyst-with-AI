// src/controllers/pdfController.js

const Invoice = require('../models/Invoice');
const StoreSettings = require('../models/StoreSettings');

/**
 * Generates an HTML invoice template with custom CSS injects based on the selected layout style.
 */
const getInvoiceHTML = (invoice, store, template) => {
  const isInterState = store.gstin.substring(0, 2) !== invoice.buyerGSTIN.substring(0, 2);

  // Common Header Styles
  let customStyle = '';

  if (template === 'Modern') {
    customStyle = `
      body { font-family: 'Inter', sans-serif; background-color: #ffffff; color: #1e293b; padding: 40px; }
      .invoice-container { max-w: 800px; margin: auto; }
      .header-accent { background: linear-gradient(135deg, #3b82f6, #6366f1); color: #ffffff; padding: 24px; border-radius: 16px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
      .logo { max-height: 55px; border-radius: 8px; }
      .bill-info { display: grid; grid-cols: 2; gap: 20px; margin-bottom: 30px; }
      .info-card { padding: 16px; border: 1px solid #f1f5f9; border-radius: 12px; background: #f8fafc; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th { background-color: #f1f5f9; color: #475569; padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
      td { padding: 14px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
      .totals-section { display: flex; justify-content: flex-end; margin-top: 30px; }
      .totals-table { width: 280px; }
      .totals-table td { padding: 6px 12px; border: none; }
      .grand-total { font-size: 18px; font-weight: 800; color: #2563eb; border-top: 2px solid #e2e8f0; padding-top: 10px; }
    `;
  } else if (template === 'Thermal') {
    customStyle = `
      body { font-family: 'monospace'; background-color: #ffffff; color: #000000; padding: 10px; width: 280px; margin: auto; font-size: 11px; }
      .invoice-container { width: 100%; }
      .header-accent { text-align: center; border-bottom: 1px dashed #000000; padding-bottom: 10px; margin-bottom: 10px; }
      .logo { max-height: 40px; display: block; margin: 0 auto 5px; }
      .bill-info { margin-bottom: 10px; line-height: 1.4; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th { border-bottom: 1px dashed #000000; padding: 4px 0; text-align: left; font-size: 10px; }
      td { padding: 5px 0; font-size: 10px; border-bottom: 1px dotted #e2e8f0; }
      .totals-section { margin-top: 10px; border-top: 1px dashed #000000; padding-top: 5px; }
      .totals-table { width: 100%; }
      .totals-table td { padding: 3px 0; }
      .grand-total { font-weight: bold; border-top: 1px dashed #000000; padding-top: 4px; }
    `;
  } else {
    // Standard Template
    customStyle = `
      body { font-family: 'Arial', sans-serif; background-color: #ffffff; color: #333333; padding: 30px; }
      .invoice-container { max-w: 800px; margin: auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 8px; }
      .header-accent { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
      .logo { max-height: 50px; }
      .bill-info { display: flex; justify-content: space-between; margin-bottom: 30px; gap: 40px; }
      .info-card { flex: 1; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th { background-color: #3b82f6; color: #ffffff; padding: 10px; text-align: left; }
      td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
      .totals-section { display: flex; justify-content: flex-end; margin-top: 35px; }
      .totals-table { width: 260px; }
      .totals-table td { padding: 5px 10px; border: none; }
      .grand-total { font-size: 16px; font-weight: bold; border-top: 1px solid #333333; padding-top: 8px; }
    `;
  }

  // Generate Cart Table rows
  const itemRows = invoice.items
    .map(
      (item) => `
    <tr>
      <td>${item.description}<br><small style="color: #64748b">HSN: ${item.hsnCode}</small></td>
      <td style="text-align: center;">${item.gstRate}%</td>
      <td style="text-align: center;">${item.quantity}</td>
      <td style="text-align: right;">$${(item.isTaxInclusive ? item.mrp : item.price).toFixed(2)}</td>
      <td style="text-align: right;">$${item.totalAmount.toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${invoice.billType || 'Invoice'} #${invoice.invoiceNumber}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
      <style>
        ${customStyle}
      </style>
    </head>
    <body onload="window.print()">
      <div class="invoice-container">
        
        {/* Header Block */}
        <div class="header-accent">
          <div>
            ${store.logoUrl ? `<img src="${store.logoUrl}" class="logo" alt="logo" />` : ''}
            <h2 style="margin: 5px 0 0 0; font-size: 20px; font-weight: 800;">${store.shopName}</h2>
            <p style="margin: 2px 0; font-size: 11px; color: #e2e8f0; font-family: monospace;">GSTIN: ${store.gstin}</p>
          </div>
          <div style="text-align: right;">
            <h1 style="margin: 0; font-size: 24px; text-transform: uppercase;">${invoice.billType || 'Invoice'}</h1>
            <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 12px;">Ref: #${invoice.invoiceNumber}</p>
            <p style="margin: 2px 0; font-size: 11px;">Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Addresses */}
        <div class="bill-info">
          <div class="info-card">
            <h4 style="margin: 0 0 8px 0; text-transform: uppercase; font-size: 11px; color: #64748b;">From</h4>
            <p style="margin: 0; font-weight: 600; font-size: 13px;">${store.shopName}</p>
            <p style="margin: 4px 0; font-size: 12px; color: #475569;">${store.address}</p>
            <p style="margin: 2px 0; font-size: 12px; color: #475569;">Ph: ${store.phoneNumber || ''}</p>
            <p style="margin: 2px 0; font-size: 12px; color: #475569;">Email: ${store.email || ''}</p>
          </div>
          
          <div class="info-card">
            <h4 style="margin: 0 0 8px 0; text-transform: uppercase; font-size: 11px; color: #64748b;">Bill To</h4>
            <p style="margin: 0; font-weight: 600; font-size: 13px;">${invoice.buyerName}</p>
            <p style="margin: 4px 0; font-size: 12px; color: #475569;">${invoice.buyerBillingAddress}</p>
            <p style="margin: 2px 0; font-size: 12px; color: #475569;">GSTIN: <span style="font-family: monospace;">${invoice.buyerGSTIN}</span></p>
            <p style="margin: 2px 0; font-size: 12px; color: #475569;">PIN Code: <span style="font-family: monospace;">${invoice.buyerPIN}</span></p>
          </div>
        </div>

        {/* Line Items */}
        <table>
          <thead>
            <tr>
              <th>Item Description</th>
              <th style="text-align: center;">GST %</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Rate</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        {/* Totals Summary */}
        <div class="totals-section">
          <table class="totals-table">
            <tr>
              <td>Subtotal:</td>
              <td style="text-align: right; font-family: monospace;">$${invoice.subTotal.toFixed(2)}</td>
            </tr>
            ${
              !isInterState
                ? `
              <tr>
                <td>CGST Split:</td>
                <td style="text-align: right; font-family: monospace;">$${invoice.items.reduce((acc, i) => acc + i.cgst, 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>SGST Split:</td>
                <td style="text-align: right; font-family: monospace;">$${invoice.items.reduce((acc, i) => acc + i.sgst, 0).toFixed(2)}</td>
              </tr>
            `
                : `
              <tr>
                <td>IGST Split:</td>
                <td style="text-align: right; font-family: monospace;">$${invoice.items.reduce((acc, i) => acc + i.igst, 0).toFixed(2)}</td>
              </tr>
            `
            }
            <tr>
              <td>Tax Total:</td>
              <td style="text-align: right; font-family: monospace;">$${invoice.taxTotal.toFixed(2)}</td>
            </tr>
            <tr class="grand-total">
              <td>Grand Total:</td>
              <td style="text-align: right; font-family: monospace; font-weight: bold;">$${invoice.grandTotal.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        ${
          invoice.irn
            ? `
          <div style="margin-top: 40px; padding-top: 15px; border-top: 1px dashed #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span style="font-size: 9px; font-weight: bold; color: #94a3b8; display: block; text-transform: uppercase;">GST IRN (E-Invoice Registry Hash)</span>
              <span style="font-family: monospace; font-size: 10px; color: #475569; word-break: break-all;">${invoice.irn}</span>
              ${invoice.eWayBillNo ? `<span style="font-size: 10px; color: #475569; display: block; margin-top: 4px;">E-way Bill: <strong>${invoice.eWayBillNo}</strong></span>` : ''}
            </div>
            <div style="width: 50px; height: 50px; background: #ccc; font-size: 7px; display: flex; align-items: center; text-align: center; border: 1px solid #aaa; border-radius: 4px; padding: 2px;">
              MOCK compliance QR
            </div>
          </div>
        `
            : ''
        }

      </div>
    </body>
    </html>
  `;
};

/**
 * @desc    Render and print an invoice using chosen template type
 * @route   GET /api/invoices/:id/print
 * @access  Private
 */
const printInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const templateQuery = req.query.template; // standard, modern, thermal

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).send('Invoice not found');
    }

    // Retrieve active store settings config
    let store = await StoreSettings.findOne({});
    if (!store) {
      store = {
        shopName: 'IntellectBill AI Operations',
        address: '101, Business Enclave, Cyber City, Gurgaon',
        phoneNumber: '+919876543210',
        email: 'billing@intellectbill.ai',
        gstin: '27AAAAA1111A1Z1',
        logoUrl: '',
        defaultInvoiceTemplate: 'Standard'
      };
    }

    // Capture settings snapshot inside invoice document if not already stored
    if (!invoice.storeSnapshot || !invoice.storeSnapshot.shopName) {
      invoice.storeSnapshot = {
        shopName: store.shopName,
        address: store.address,
        phoneNumber: store.phoneNumber,
        email: store.email,
        gstin: store.gstin,
        logoUrl: store.logoUrl,
      };
      // Save snapshot for history
      await invoice.save();
    }

    const selectedTemplate = templateQuery || invoice.templateType || store.defaultInvoiceTemplate || 'Standard';

    // Update template preference on the invoice record
    if (templateQuery && invoice.templateType !== templateQuery) {
      invoice.templateType = templateQuery;
      await invoice.save();
    }

    const htmlContent = getInvoiceHTML(invoice, invoice.storeSnapshot, selectedTemplate);
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(htmlContent);
  } catch (error) {
    console.error('Print PDF invoice error:', error.message);
    res.status(500).send('Server error generating print preview layout');
  }
};

module.exports = {
  printInvoice,
};
