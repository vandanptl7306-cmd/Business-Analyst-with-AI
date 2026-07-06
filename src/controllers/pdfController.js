// src/controllers/pdfController.js

const Invoice = require('../models/Invoice');
const StoreSettings = require('../models/StoreSettings');

/**
 * Generates an HTML invoice template with custom CSS injects based on the selected layout style.
 */
const getInvoiceHTML = (invoice, store, template) => {
  const isInterState = store.gstin.substring(0, 2) !== invoice.buyerGSTIN.substring(0, 2);
  const themeColor = store.invoiceThemeColor || '#2563eb';

  // 1. --- GST TAX INVOICE TEMPLATE (IMAGE 1) ---
  if (template === 'TaxInvoice') {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Tax Invoice #${invoice.invoiceNumber}</title>
        <style>
          body { font-family: 'Arial', sans-serif; font-size: 11px; line-height: 1.4; color: #000000; padding: 20px; background-color: #ffffff; }
          .tax-invoice-container { max-width: 800px; margin: auto; border: 1.5px solid #000000; }
          .title-banner { text-align: center; border-bottom: 1.5px solid #000000; padding: 8px; font-weight: bold; font-size: 15px; letter-spacing: 1px; text-transform: uppercase; }
          .grid-header { display: grid; grid-template-columns: 1.2fr 1fr; border-bottom: 1px solid #000000; }
          .header-left { border-right: 1.5px solid #000000; padding: 8px; }
          .header-right { display: grid; grid-template-columns: 1fr 1fr; }
          .header-cell { border-bottom: 1px solid #000000; border-right: 1px solid #000000; padding: 6px; }
          .header-cell:nth-child(2n) { border-right: none; }
          .header-cell.full { grid-column: span 2; border-right: none; }
          .buyer-box { border-bottom: 1.5px solid #000000; padding: 8px; }
          .items-table { width: 100%; border-collapse: collapse; }
          .items-table th, .items-table td { border-right: 1px solid #000000; border-bottom: 1px solid #000000; padding: 6px; font-size: 11px; }
          .items-table th { background: #f3f4f6; text-transform: uppercase; font-weight: bold; text-align: left; }
          .items-table td { height: 40px; vertical-align: top; }
          .items-table tr:last-child td { border-bottom: none; }
          .items-table th:last-child, .items-table td:last-child { border-right: none; }
          .totals-row td { font-weight: bold; height: auto; vertical-align: middle; border-top: 1.5px solid #000000; }
          .amount-words { padding: 8px; border-bottom: 1.5px solid #000000; font-weight: bold; }
          .hsn-table { width: 100%; border-collapse: collapse; }
          .hsn-table th, .hsn-table td { border-right: 1px solid #000000; border-bottom: 1px solid #000000; padding: 5px; font-size: 10px; text-align: center; }
          .hsn-table th { background: #f3f4f6; }
          .hsn-table tr:last-child td { border-bottom: none; }
          .hsn-table th:last-child, .hsn-table td:last-child { border-right: none; }
          .declaration-section { display: grid; grid-template-columns: 1.5fr 1fr; border-top: 1.5px solid #000000; }
          .decl-left { border-right: 1.5px solid #000000; padding: 8px; font-size: 10px; }
          .signature-right { padding: 8px; text-align: right; display: flex; flex-direction: column; justify-content: space-between; height: 80px; }
        </style>
      </head>
      <body onload="window.print()">
        <div class="tax-invoice-container">
          <div class="title-banner">Tax Invoice</div>
          
          <div class="grid-header">
            <div class="header-left">
              <strong style="font-size: 12px;">${store.shopName}</strong><br/>
              ${store.address}<br/>
              GSTIN/UIN: <strong>${store.gstin}</strong><br/>
              Email: ${store.email || 'N/A'}<br/>
              Phone: ${store.phoneNumber || 'N/A'}
            </div>
            <div class="header-right">
              <div class="header-cell">
                <small style="color: #555; display:block; font-size: 8px;">Invoice No.</small>
                <strong>${invoice.invoiceNumber}</strong>
              </div>
              <div class="header-cell">
                <small style="color: #555; display:block; font-size: 8px;">Dated</small>
                <strong>${new Date(invoice.invoiceDate).toLocaleDateString()}</strong>
              </div>
              <div class="header-cell">
                <small style="color: #555; display:block; font-size: 8px;">Delivery Note</small>
                Standard
              </div>
              <div class="header-cell">
                <small style="color: #555; display:block; font-size: 8px;">Mode/Terms of Payment</small>
                Immediate
              </div>
              <div class="header-cell">
                <small style="color: #555; display:block; font-size: 8px;">Reference No. & Date</small>
                N/A
              </div>
              <div class="header-cell">
                <small style="color: #555; display:block; font-size: 8px;">Other References</small>
                N/A
              </div>
              <div class="header-cell">
                <small style="color: #555; display:block; font-size: 8px;">Dispatch Doc No.</small>
                RW/${invoice.invoiceNumber.substring(invoice.invoiceNumber.length - 3)}
              </div>
              <div class="header-cell">
                <small style="color: #555; display:block; font-size: 8px;">Dispatched through</small>
                Road
              </div>
              <div class="header-cell full">
                <small style="color: #555; display:block; font-size: 8px;">Terms of Delivery</small>
                Delivery at buyer's billing address.
              </div>
            </div>
          </div>
          
          <div class="buyer-box">
            <small style="color: #555; display:block; text-transform:uppercase; font-size: 8px; margin-bottom: 2px;">Buyer (Bill to)</small>
            <strong style="font-size: 12px;">${invoice.buyerName}</strong><br/>
            ${invoice.buyerBillingAddress}<br/>
            GSTIN/UIN: <strong>${invoice.buyerGSTIN}</strong><br/>
            PIN Code: ${invoice.buyerPIN}
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 6%; text-align: center;">SI No.</th>
                <th style="width: 48%;">Description of Goods</th>
                <th style="width: 14%; text-align: center;">HSN/SAC</th>
                <th style="width: 8%; text-align: center;">Qty</th>
                <th style="width: 12%; text-align: right;">Rate</th>
                <th style="width: 12%; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map((item, idx) => {
                const cgst = item.cgst || 0;
                const sgst = item.sgst || 0;
                const igst = item.igst || 0;
                const rate = (item.isTaxInclusive ? item.mrp : item.price) || 0;
                const totalAmount = item.totalAmount || 0;
                const hsn = item.hsnCode || 'N/A';
                return `
                  <tr>
                    <td style="text-align: center;">${idx + 1}</td>
                    <td>
                      <strong>${item.description}</strong>
                      ${!isInterState ? `
                        <div style="margin-top: 4px; padding-left: 10px; font-size: 9px; font-style: italic; color: #555;">
                          CGST Split<br/>
                          SGST Split
                        </div>
                      ` : `
                        <div style="margin-top: 4px; padding-left: 10px; font-size: 9px; font-style: italic; color: #555;">
                          IGST Split
                        </div>
                      `}
                    </td>
                    <td style="text-align: center; font-family: monospace; font-size: 10px;">${hsn}</td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: right; font-family: monospace;">$${rate.toFixed(2)}</td>
                    <td style="text-align: right; font-family: monospace;">
                      $${totalAmount.toFixed(2)}
                      ${!isInterState ? `
                        <div style="margin-top: 4px; font-size: 9px; font-family: monospace; color: #555;">
                          $${cgst.toFixed(2)}<br/>
                          $${sgst.toFixed(2)}
                        </div>
                      ` : `
                        <div style="margin-top: 4px; font-size: 9px; font-family: monospace; color: #555;">
                          $${igst.toFixed(2)}
                        </div>
                      `}
                    </td>
                  </tr>
                `;
              }).join('')}
              
              <tr class="totals-row">
                <td colspan="3" style="text-align: right;">Total</td>
                <td style="text-align: center;">${invoice.items.reduce((acc, i) => acc + i.quantity, 0)}</td>
                <td></td>
                <td style="text-align: right; font-family: monospace;">$${(invoice.grandTotal || 0).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="amount-words">
            Amount Chargeable (in words): <span style="font-size: 10px; font-weight: normal;">$${(invoice.grandTotal || 0).toFixed(2)} Dollars Only</span>
          </div>
          
          <table class="hsn-table">
            <thead>
              <tr>
                <th rowspan="2">HSN/SAC</th>
                <th rowspan="2">Taxable Value</th>
                ${!isInterState ? `
                  <th colspan="2">Central Tax</th>
                  <th colspan="2">State Tax</th>
                ` : `
                  <th colspan="2">Integrated Tax</th>
                `}
                <th rowspan="2">Total Tax Amount</th>
              </tr>
              <tr>
                <th>Rate</th>
                <th>Amount</th>
                ${!isInterState ? `
                  <th>Rate</th>
                  <th>Amount</th>
                ` : ''}
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => {
                const cgst = item.cgst || 0;
                const sgst = item.sgst || 0;
                const igst = item.igst || 0;
                const totalAmount = item.totalAmount || 0;
                const taxableValue = totalAmount - (cgst + sgst + igst);
                const gstRate = item.gstRate || 0;
                const hsn = item.hsnCode || 'N/A';
                return `
                  <tr>
                    <td style="font-family: monospace;">${hsn}</td>
                    <td style="font-family: monospace;">$${taxableValue.toFixed(2)}</td>
                    ${!isInterState ? `
                      <td>${(gstRate / 2)}%</td>
                      <td style="font-family: monospace;">$${cgst.toFixed(2)}</td>
                      <td>${(gstRate / 2)}%</td>
                      <td style="font-family: monospace;">$${sgst.toFixed(2)}</td>
                    ` : `
                      <td>${gstRate}%</td>
                      <td style="font-family: monospace;">$${igst.toFixed(2)}</td>
                    `}
                    <td style="font-family: monospace;">$${(cgst + sgst + igst).toFixed(2)}</td>
                  </tr>
                `;
              }).join('')}
              <tr style="font-weight: bold; background: #f9fafb;">
                <td>Total</td>
                <td style="font-family: monospace;">$${(invoice.subTotal || 0).toFixed(2)}</td>
                ${!isInterState ? `
                  <td></td>
                  <td style="font-family: monospace;">$${invoice.items.reduce((acc, i) => acc + (i.cgst || 0), 0).toFixed(2)}</td>
                  <td></td>
                  <td style="font-family: monospace;">$${invoice.items.reduce((acc, i) => acc + (i.sgst || 0), 0).toFixed(2)}</td>
                ` : `
                  <td></td>
                  <td style="font-family: monospace;">$${invoice.items.reduce((acc, i) => acc + (i.igst || 0), 0).toFixed(2)}</td>
                `}
                <td style="font-family: monospace;">$${(invoice.taxTotal || 0).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="declaration-section">
            <div class="decl-left">
              <strong>Declaration:</strong><br/>
              We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
            </div>
            <div class="signature-right">
              <small style="color: #444;">for <strong>${store.shopName}</strong></small>
              <span style="font-size: 9px; font-weight: bold; border-top: 1px dotted #000; display: inline-block; width: 130px; margin-left: auto; text-align: center;">Authorised Signatory</span>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // 2. --- MINIMALIST CORPORATE TEMPLATE (IMAGE 4) ---
  if (template === 'Minimalist') {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Minimalist Invoice #${invoice.invoiceNumber}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; background-color: #ffffff; color: #1f2937; padding: 0; margin: 0; line-height: 1.6; }
          .top-blue-bar { height: 12px; background-color: #2563eb; width: 100%; }
          .bottom-blue-bar { height: 12px; background-color: #2563eb; width: 100%; position: fixed; bottom: 0; left: 0; }
          .invoice-content { max-width: 800px; margin: 40px auto; padding: 0 40px 60px 40px; }
          .header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 50px; }
          .logo-name { display: flex; flex-direction: column; }
          .shop-title { font-size: 24px; font-weight: 700; color: #111827; letter-spacing: -0.02em; }
          .shop-subtitle { font-size: 13px; color: #6b7280; margin-top: 4px; }
          .total-display { text-align: right; }
          .total-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; font-weight: 600; }
          .total-amount { font-size: 36px; font-weight: 700; color: #2563eb; margin-top: 4px; }
          .billing-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; border-bottom: 2px solid #f3f4f6; padding-bottom: 30px; margin-bottom: 40px; }
          .bill-col h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 10px; font-weight: 600; }
          .bill-col p { font-size: 13px; margin: 4px 0; color: #374151; }
          .minimal-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .minimal-table th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; border-bottom: 2px solid #f3f4f6; padding: 12px 6px; text-align: left; font-weight: 600; }
          .minimal-table td { padding: 16px 6px; border-bottom: 1px solid #f3f4f6; font-size: 13px; color: #374151; }
          .subtotals-box { display: flex; flex-direction: column; align-items: flex-end; margin-top: 20px; gap: 8px; }
          .subtotal-item { display: flex; justify-content: space-between; width: 220px; font-size: 13px; color: #4b5563; }
          .subtotal-item.bold-total { font-size: 17px; font-weight: 700; color: #111827; border-top: 2px solid #f3f4f6; padding-top: 10px; margin-top: 6px; }
          .terms-box { margin-top: 70px; border-top: 1px solid #f3f4f6; padding-top: 25px; }
          .terms-box h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 8px; }
          .terms-box p { font-size: 12px; color: #6b7280; line-height: 1.5; margin: 4px 0; }
        </style>
      </head>
      <body onload="window.print()">
        <div class="top-blue-bar"></div>
        <div class="invoice-content">
          
          <div class="header-row">
            <div class="logo-name">
              <div class="shop-title">${store.shopName}</div>
              <div class="shop-subtitle">${store.address}</div>
            </div>
            <div class="total-display">
              <div class="total-title">Invoice Total</div>
              <div class="total-amount">$${(invoice.grandTotal || 0).toFixed(2)}</div>
            </div>
          </div>
          
          <div class="billing-row">
            <div class="bill-col">
              <h3>Bill To</h3>
              <p><strong>${invoice.buyerName}</strong></p>
              <p>${invoice.buyerBillingAddress}</p>
              <p style="font-family: monospace; font-size: 12px; color: #4b5563; margin-top: 8px;">GST: ${invoice.buyerGSTIN}</p>
            </div>
            <div class="bill-col">
              <h3>Ship To</h3>
              <p><strong>${invoice.buyerName}</strong></p>
              <p>${invoice.buyerBillingAddress}</p>
            </div>
            <div class="bill-col">
              <h3>Invoice Details</h3>
              <p><strong>Invoice #:</strong> <span style="font-family: monospace;">${invoice.invoiceNumber}</span></p>
              <p><strong>Date:</strong> ${new Date(invoice.invoiceDate).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${invoice.status}</p>
            </div>
          </div>
          
          <table class="minimal-table">
            <thead>
              <tr>
                <th style="width: 10%;">Qty</th>
                <th style="width: 60%;">Description</th>
                <th style="width: 15%; text-align: right;">Unit Price</th>
                <th style="width: 15%; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => {
                const rate = (item.isTaxInclusive ? item.mrp : item.price) || 0;
                const amount = item.totalAmount || 0;
                return `
                  <tr>
                    <td>${item.quantity}</td>
                    <td><strong>${item.description}</strong><br/><small style="color: #9ca3af; font-family: monospace;">HSN: ${item.hsnCode}</small></td>
                    <td style="text-align: right; font-family: monospace;">$${rate.toFixed(2)}</td>
                    <td style="text-align: right; font-family: monospace;">$${amount.toFixed(2)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="subtotals-box">
            <div class="subtotal-item">
              <span>Subtotal</span>
              <span style="font-family: monospace;">$${(invoice.subTotal || 0).toFixed(2)}</span>
            </div>
            <div class="subtotal-item">
              <span>Tax Total</span>
              <span style="font-family: monospace;">$${(invoice.taxTotal || 0).toFixed(2)}</span>
            </div>
            <div class="subtotal-item bold-total">
              <span>Total</span>
              <span style="font-family: monospace;">$${(invoice.grandTotal || 0).toFixed(2)}</span>
            </div>
          </div>
          
          <div class="terms-box">
            <h4>Terms & Conditions</h4>
            <p>Payment is due within 15 days of invoice date.</p>
            <p>Thank you for choosing ${store.shopName}! We appreciate your business.</p>
          </div>
          
        </div>
        <div class="bottom-blue-bar"></div>
      </body>
      </html>
    `;
  }

  // 3. --- COMMERCIAL INVOICE TEMPLATE (IMAGE 3) ---
  if (template === 'Commercial') {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Commercial Invoice #${invoice.invoiceNumber}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; background-color: #ffffff; color: #1e293b; padding: 40px; }
          .invoice-container { max-width: 800px; margin: auto; }
          .logo-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
          .logo-section { display: flex; align-items: center; gap: 10px; }
          .logo-symbol { width: 30px; height: 30px; background-color: ${themeColor}; border-radius: 6px; }
          .logo-text { font-size: 18px; font-weight: 700; color: #0f172a; }
          .title-section { text-align: right; }
          .title-text { font-size: 24px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin: 0; }
          .po-text { font-size: 12px; color: #64748b; margin-top: 4px; font-family: monospace; }
          .info-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 40px; margin-bottom: 40px; }
          .bill-to h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 8px; font-weight: 700; }
          .bill-to p { font-size: 13px; margin: 4px 0; color: #334155; }
          .dates-box { background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .date-item h4 { font-size: 10px; text-transform: uppercase; color: #94a3b8; margin: 0 0 4px 0; }
          .date-item p { font-size: 13px; font-weight: 600; color: #334155; margin: 0; }
          .commercial-table { width: 100%; border-collapse: collapse; margin-top: 30px; }
          .commercial-table th { background-color: ${themeColor}; color: #ffffff; padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; font-weight: 700; }
          .commercial-table td { padding: 14px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155; }
          .commercial-table tr:hover { background: #f8fafc; }
          .totals-wrapper { display: flex; justify-content: flex-end; margin-top: 30px; }
          .totals-table { width: 280px; }
          .totals-table td { padding: 6px 12px; border: none; font-size: 13px; color: #475569; }
          .totals-table tr.grand-total td { font-size: 16px; font-weight: 800; color: ${themeColor}; border-top: 2.5px double #e2e8f0; padding-top: 12px; }
          .agreement-box { margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 30px; }
          .agreement-title { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #94a3b8; margin-bottom: 25px; letter-spacing: 0.05em; }
          .signature-row { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; }
          .sig-line { border-bottom: 1px solid #94a3b8; margin-top: 35px; padding-bottom: 5px; font-size: 11px; color: #64748b; }
        </style>
      </head>
      <body onload="window.print()">
        <div class="invoice-container">
          
          <div class="logo-header">
            <div class="logo-section">
              <div class="logo-symbol"></div>
              <div class="logo-text">${store.shopName}</div>
            </div>
            <div class="title-section">
              <div class="title-text">Commercial Invoice</div>
              <div class="po-text">Invoice #: ${invoice.invoiceNumber}</div>
            </div>
          </div>
          
          <div class="info-grid">
            <div class="bill-to">
              <h3>Bill To</h3>
              <p><strong>${invoice.buyerName}</strong></p>
              <p>${invoice.buyerBillingAddress}</p>
              <p style="font-family: monospace; font-size: 11px; color: #64748b; margin-top: 8px;">GSTIN: ${invoice.buyerGSTIN}</p>
            </div>
            <div class="dates-box">
              <div class="date-item">
                <h4>Prepared Date</h4>
                <p>${new Date(invoice.invoiceDate).toLocaleDateString()}</p>
              </div>
              <div class="date-item">
                <h4>Due Date</h4>
                <p>${new Date(new Date(invoice.invoiceDate).getTime() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          
          <table class="commercial-table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: center; width: 12%;">Qty</th>
                <th style="text-align: right; width: 18%;">Price</th>
                <th style="text-align: right; width: 18%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => {
                const rate = (item.isTaxInclusive ? item.mrp : item.price) || 0;
                const total = item.totalAmount || 0;
                return `
                  <tr>
                    <td><strong>${item.description}</strong><br/><small style="color: #64748b; font-family: monospace;">HSN: ${item.hsnCode}</small></td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: right; font-family: monospace;">$${rate.toFixed(2)}</td>
                    <td style="text-align: right; font-family: monospace;">$${total.toFixed(2)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="totals-wrapper">
            <table class="totals-table">
              <tr>
                <td>Subtotal:</td>
                <td style="text-align: right; font-family: monospace;">$${(invoice.subTotal || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Discount:</td>
                <td style="text-align: right; font-family: monospace;">$0.00</td>
              </tr>
              <tr>
                <td>Sales Tax:</td>
                <td style="text-align: right; font-family: monospace;">$${(invoice.taxTotal || 0).toFixed(2)}</td>
              </tr>
              <tr class="grand-total">
                <td>Total:</td>
                <td style="text-align: right; font-family: monospace; font-weight: bold;">$${(invoice.grandTotal || 0).toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <div class="agreement-box">
            <div class="agreement-title">Agreed and Accepted:</div>
            <div class="signature-row">
              <div>
                <div class="sig-line">Name:</div>
                <div class="sig-line">Title:</div>
                <div class="sig-line">Date:</div>
              </div>
              <div>
                <div class="sig-line">Name:</div>
                <div class="sig-line">Title:</div>
                <div class="sig-line">Date:</div>
              </div>
            </div>
          </div>
          
        </div>
      </body>
      </html>
    `;
  }

  // 4. --- Standard / Modern / Thermal layouts fallback ---
  let customStyle = '';

  if (template === 'Modern') {
    customStyle = `
      body { font-family: 'Inter', sans-serif; background-color: #ffffff; color: #1e293b; padding: 40px; }
      .invoice-container { max-w: 800px; margin: auto; }
      .header-accent { background: linear-gradient(135deg, ${themeColor}, ${themeColor}dd); color: #ffffff; padding: 24px; border-radius: 16px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
      .logo { max-height: 55px; border-radius: 8px; }
      .bill-info { display: grid; grid-cols: 2; gap: 20px; margin-bottom: 30px; }
      .info-card { padding: 16px; border: 1px solid #f1f5f9; border-radius: 12px; background: #f8fafc; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th { background-color: ${themeColor}; color: #ffffff; padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
      td { padding: 14px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
      .totals-section { display: flex; justify-content: flex-end; margin-top: 30px; }
      .totals-table { width: 280px; }
      .totals-table td { padding: 6px 12px; border: none; }
      .grand-total { font-size: 18px; font-weight: 800; color: ${themeColor}; border-top: 2px solid #e2e8f0; padding-top: 10px; }
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
      .header-accent { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${themeColor}; padding-bottom: 20px; margin-bottom: 30px; }
      .logo { max-height: 50px; }
      .bill-info { display: flex; justify-content: space-between; margin-bottom: 30px; gap: 40px; }
      .info-card { flex: 1; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th { background-color: ${themeColor}; color: #ffffff; padding: 10px; text-align: left; }
      td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
      .totals-section { display: flex; justify-content: flex-end; margin-top: 35px; }
      .totals-table { width: 260px; }
      .totals-table td { padding: 5px 10px; border: none; }
      .grand-total { font-size: 16px; font-weight: bold; border-top: 1px solid #333333; padding-top: 8px; color: ${themeColor}; }
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

    const storeSnapshotMerged = {
      ...(invoice.storeSnapshot ? invoice.storeSnapshot.toObject() : {}),
      invoiceThemeColor: store ? store.invoiceThemeColor : '#2563eb'
    };

    const htmlContent = getInvoiceHTML(invoice, storeSnapshotMerged, selectedTemplate);
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
