// src/controllers/pdfController.js

const Invoice = require('../models/Invoice');
const StoreSettings = require('../models/StoreSettings');

/**
 * Generates an HTML invoice template with custom CSS injects based on the selected layout style.
 */
const getInvoiceHTML = (invoice, store, template) => {
  const isInterState = store.gstin && invoice.buyerGSTIN && store.gstin.substring(0, 2) !== invoice.buyerGSTIN.substring(0, 2);
  const themeColor = store.regularThemeColor || store.invoiceThemeColor || '#2563eb';
  const isIndianFormat = store.amountInWordsFormat === 'Indian';
  const currencySymbol = isIndianFormat ? '₹' : '$';

  // Helper: Amount decimal and grouping formatter
  const formatAmount = (num) => {
    if (num === undefined || num === null) num = 0;
    const decimals = store.amountWithDecimal !== false ? 2 : 0;
    if (store.printAmountWithGrouping !== false) {
      if (isIndianFormat) {
        return num.toLocaleString('en-IN', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        });
      } else {
        return num.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        });
      }
    } else {
      return num.toFixed(decimals);
    }
  };

  // Helper: Convert Number to Words (Indian vs International)
  const numberToWords = (amount) => {
    const isInd = store.amountInWordsFormat === 'Indian';
    const mainUnit = isInd ? 'Rupees' : 'Dollars';
    const subUnit = isInd ? 'Paise' : 'Cents';
    
    const num = Math.floor(amount);
    const fractional = Math.round((amount - num) * 100);

    const convertToWords = (n, isIndSys) => {
      const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      
      if (n === 0) return '';
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convertToWords(n % 100, isIndSys) : '');

      if (isIndSys) {
        if (n < 100000) return convertToWords(Math.floor(n / 1000), isIndSys) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convertToWords(n % 1000, isIndSys) : '');
        if (n < 10000000) return convertToWords(Math.floor(n / 100000), isIndSys) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convertToWords(n % 100000, isIndSys) : '');
        return convertToWords(Math.floor(n / 10000000), isIndSys) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convertToWords(n % 10000000, isIndSys) : '');
      } else {
        if (n < 1000000) return convertToWords(Math.floor(n / 1000), isIndSys) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convertToWords(n % 1000, isIndSys) : '');
        if (n < 1000000000) return convertToWords(Math.floor(n / 1000000), isIndSys) + ' Million' + (n % 1000000 !== 0 ? ' ' + convertToWords(n % 1000000, isIndSys) : '');
        return convertToWords(Math.floor(n / 1000000000), isIndSys) + ' Billion' + (n % 1000000000 !== 0 ? ' ' + convertToWords(n % 1000000000, isIndSys) : '');
      }
    };

    if (amount === 0) return 'Zero ' + mainUnit + ' Only';

    let words = '';
    const mainWords = convertToWords(num, isInd);
    if (mainWords) {
      words += mainWords + ' ' + mainUnit;
    }

    if (fractional > 0 && store.amountWithDecimal !== false) {
      const fractionalWords = convertToWords(fractional, isInd);
      if (fractionalWords) {
        words += (words ? ' and ' : '') + fractionalWords + ' ' + subUnit;
      }
    }

    return words + ' Only';
  };

  // Reusable HTML generator for Company Info / Header
  const logoHTML = (store.printCompanyLogo !== false && (store.customLogoUrl || store.logoUrl))
    ? `<img src="${store.customLogoUrl || store.logoUrl}" class="logo" style="max-height: 50px; display: block; margin-bottom: 8px;" alt="logo" />`
    : '';

  const companyNameSize = store.companyNameTextSize === 'Small' ? '13px' : store.companyNameTextSize === 'Large' ? '25px' : '18px';
  const companyNameHTML = (store.printCompanyName !== false)
    ? `<strong style="font-size: ${companyNameSize}; display: block; margin-bottom: 4px;">${store.customCompanyName || store.shopName}</strong>`
    : '';

  const addressHTML = (store.printAddress !== false && (store.customAddress || store.address))
    ? `<div style="font-size: 11px; margin-bottom: 2px;">${store.customAddress || store.address}</div>`
    : '';

  const gstinHTML = (store.printGSTIN !== false && (store.customGSTIN || store.gstin))
    ? `<div style="font-size: 11px; margin-bottom: 2px;">GSTIN/UIN: <strong>${store.customGSTIN || store.gstin}</strong></div>`
    : '';

  const emailHTML = (store.printEmail !== false && (store.customEmail || store.email))
    ? `<div style="font-size: 11px; margin-bottom: 2px;">Email: ${store.customEmail || store.email}</div>`
    : '';

  const phoneHTML = (store.printPhone !== false && (store.customPhone || store.phoneNumber))
    ? `<div style="font-size: 11px; margin-bottom: 2px;">Phone: ${store.customPhone || store.phoneNumber}</div>`
    : '';

  const invoiceTitleSize = store.invoiceTextSize === 'Small' ? '12px' : store.invoiceTextSize === 'Large' ? '24px' : '15px';
  const footerHTML = store.printDescription !== false
    ? `<div style="margin-top: 25px; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 10px; color: #64748b;">
        <strong>Note/Declaration:</strong> We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
       </div>`
    : '';

  // Helper to compile totals rows
  const getTotalsTableRowsHTML = () => {
    let rows = `
      <tr>
        <td style="padding: 4px 8px;">Subtotal:</td>
        <td style="text-align: right; font-family: monospace; padding: 4px 8px;">${currencySymbol}${formatAmount(invoice.subTotal)}</td>
      </tr>
    `;

    if (store.printTaxDetails !== false) {
      if (!isInterState) {
        rows += `
          <tr>
            <td style="padding: 4px 8px; color: #4b5563;">CGST Split:</td>
            <td style="text-align: right; font-family: monospace; padding: 4px 8px; color: #4b5563;">${currencySymbol}${formatAmount(invoice.items.reduce((acc, i) => acc + (i.cgst || 0), 0))}</td>
          </tr>
          <tr>
            <td style="padding: 4px 8px; color: #4b5563;">SGST Split:</td>
            <td style="text-align: right; font-family: monospace; padding: 4px 8px; color: #4b5563;">${currencySymbol}${formatAmount(invoice.items.reduce((acc, i) => acc + (i.sgst || 0), 0))}</td>
          </tr>
        `;
      } else {
        rows += `
          <tr>
            <td style="padding: 4px 8px; color: #4b5563;">IGST Split:</td>
            <td style="text-align: right; font-family: monospace; padding: 4px 8px; color: #4b5563;">${currencySymbol}${formatAmount(invoice.items.reduce((acc, i) => acc + (i.igst || 0), 0))}</td>
          </tr>
        `;
      }
      rows += `
        <tr>
          <td style="padding: 4px 8px;">Tax Total:</td>
          <td style="text-align: right; font-family: monospace; padding: 4px 8px;">${currencySymbol}${formatAmount(invoice.taxTotal)}</td>
        </tr>
      `;
    }

    if (store.printYouSaved !== false) {
      const youSaved = invoice.items.reduce((acc, item) => acc + ((item.mrp && item.mrp > item.price) ? (item.mrp - item.price) * item.quantity : 0), 0);
      if (youSaved > 0) {
        rows += `
          <tr style="color: #10b981; font-weight: bold;">
            <td style="padding: 4px 8px;">You Saved:</td>
            <td style="text-align: right; font-family: monospace; padding: 4px 8px;">${currencySymbol}${formatAmount(youSaved)}</td>
          </tr>
        `;
      }
    }

    rows += `
      <tr class="grand-total" style="font-weight: bold; border-top: 1.5px solid #000;">
        <td style="padding: 6px 8px; font-size: 14px;">Grand Total:</td>
        <td style="text-align: right; font-family: monospace; padding: 6px 8px; font-size: 14px;">${currencySymbol}${formatAmount(invoice.grandTotal)}</td>
      </tr>
    `;

    if (store.printReceivedAmount !== false && invoice.amountPaid !== undefined) {
      rows += `
        <tr>
          <td style="padding: 4px 8px; color: #6b7280;">Received Amount:</td>
          <td style="text-align: right; font-family: monospace; padding: 4px 8px; color: #6b7280;">${currencySymbol}${formatAmount(invoice.amountPaid)}</td>
        </tr>
      `;
    }

    if (store.printBalanceAmount !== false && invoice.outstandingAmount !== undefined) {
      rows += `
        <tr>
          <td style="padding: 4px 8px; color: #dc2626; font-weight: bold;">Balance Amount:</td>
          <td style="text-align: right; font-family: monospace; padding: 4px 8px; color: #dc2626; font-weight: bold;">${currencySymbol}${formatAmount(invoice.outstandingAmount)}</td>
        </tr>
      `;
    }

    if (store.printCurrentBalance !== false) {
      rows += `
        <tr>
          <td style="padding: 4px 8px; color: #6b7280;">Current Balance:</td>
          <td style="text-align: right; font-family: monospace; padding: 4px 8px; color: #6b7280;">${currencySymbol}${formatAmount(invoice.outstandingAmount || 0)}</td>
        </tr>
      `;
    }

    return rows;
  };

  // 1. --- GST TAX INVOICE TEMPLATE ---
  if (template === 'TaxInvoice') {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Tax Invoice #${invoice.invoiceNumber}</title>
        <style>
          @page { size: ${store.paperSize || 'A4'} ${store.orientation || 'portrait'}; margin: 10mm; }
          body { font-family: 'Arial', sans-serif; font-size: 11px; line-height: 1.4; color: #000000; padding: 20px; background-color: #ffffff; }
          .tax-invoice-container { max-width: 800px; margin: auto; border: 1.5px solid #000000; }
          .title-banner { text-align: center; border-bottom: 1.5px solid #000000; padding: 8px; font-weight: bold; font-size: ${invoiceTitleSize}; letter-spacing: 1px; text-transform: uppercase; }
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
              ${logoHTML}
              ${companyNameHTML}
              ${addressHTML}
              ${gstinHTML}
              ${emailHTML}
              ${phoneHTML}
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
                ${store.printTotalQty !== false ? '<th style="width: 8%; text-align: center;">Qty</th>' : ''}
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
                      ${(store.printTaxDetails !== false) ? (!isInterState ? `
                        <div style="margin-top: 4px; padding-left: 10px; font-size: 9px; font-style: italic; color: #555;">
                          CGST Split<br/>
                          SGST Split
                        </div>
                      ` : `
                        <div style="margin-top: 4px; padding-left: 10px; font-size: 9px; font-style: italic; color: #555;">
                          IGST Split
                        </div>
                      `) : ''}
                    </td>
                    <td style="text-align: center; font-family: monospace; font-size: 10px;">${hsn}</td>
                    ${store.printTotalQty !== false ? `<td style="text-align: center;">${item.quantity}</td>` : ''}
                    <td style="text-align: right; font-family: monospace;">${currencySymbol}${formatAmount(rate)}</td>
                    <td style="text-align: right; font-family: monospace;">
                      ${currencySymbol}${formatAmount(totalAmount)}
                      ${(store.printTaxDetails !== false) ? (!isInterState ? `
                        <div style="margin-top: 4px; font-size: 9px; font-family: monospace; color: #555;">
                          ${currencySymbol}${formatAmount(cgst)}<br/>
                          ${currencySymbol}${formatAmount(sgst)}
                        </div>
                      ` : `
                        <div style="margin-top: 4px; font-size: 9px; font-family: monospace; color: #555;">
                          ${currencySymbol}${formatAmount(igst)}
                        </div>
                      `) : ''}
                    </td>
                  </tr>
                `;
              }).join('')}
              
              <tr class="totals-row">
                <td colspan="3" style="text-align: right;">Total</td>
                ${store.printTotalQty !== false ? `<td style="text-align: center;">${invoice.items.reduce((acc, i) => acc + i.quantity, 0)}</td>` : ''}
                <td></td>
                <td style="text-align: right; font-family: monospace;">${currencySymbol}${formatAmount(invoice.grandTotal || 0)}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="amount-words">
            Amount Chargeable (in words): <span style="font-size: 10px; font-weight: normal;">${numberToWords(invoice.grandTotal)}</span>
          </div>
          
          ${store.printTaxDetails !== false ? `
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
                    <td style="font-family: monospace;">${currencySymbol}${formatAmount(taxableValue)}</td>
                    ${!isInterState ? `
                      <td>${(gstRate / 2)}%</td>
                      <td style="font-family: monospace;">${currencySymbol}${formatAmount(cgst)}</td>
                      <td>${(gstRate / 2)}%</td>
                      <td style="font-family: monospace;">${currencySymbol}${formatAmount(sgst)}</td>
                    ` : `
                      <td>${gstRate}%</td>
                      <td style="font-family: monospace;">${currencySymbol}${formatAmount(igst)}</td>
                    `}
                    <td style="font-family: monospace;">${currencySymbol}${formatAmount(cgst + sgst + igst)}</td>
                  </tr>
                `;
              }).join('')}
              <tr style="font-weight: bold; background: #f9fafb;">
                <td>Total</td>
                <td style="font-family: monospace;">${currencySymbol}${formatAmount(invoice.subTotal || 0)}</td>
                ${!isInterState ? `
                  <td></td>
                  <td style="font-family: monospace;">${currencySymbol}${formatAmount(invoice.items.reduce((acc, i) => acc + (i.cgst || 0), 0))}</td>
                  <td></td>
                  <td style="font-family: monospace;">${currencySymbol}${formatAmount(invoice.items.reduce((acc, i) => acc + (i.sgst || 0), 0))}</td>
                ` : `
                  <td></td>
                  <td style="font-family: monospace;">${currencySymbol}${formatAmount(invoice.items.reduce((acc, i) => acc + (i.igst || 0), 0))}</td>
                `}
                <td style="font-family: monospace;">${currencySymbol}${formatAmount(invoice.taxTotal || 0)}</td>
              </tr>
            </tbody>
          </table>
          ` : ''}
          
          <div class="declaration-section">
            <div class="decl-left">
              <strong>Declaration:</strong><br/>
              We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
            </div>
            <div class="signature-right">
              <small style="color: #444;">for <strong>${store.customCompanyName || store.shopName}</strong></small>
              <span style="font-size: 9px; font-weight: bold; border-top: 1px dotted #000; display: inline-block; width: 130px; margin-left: auto; text-align: center;">Authorised Signatory</span>
            </div>
          </div>
        </div>
        ${footerHTML}
      </body>
      </html>
    `;
  }  // 2. --- MINIMALIST CORPORATE TEMPLATE (Photo 2) ---
  if (template === 'Minimalist') {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Invoice #${invoice.invoiceNumber}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;750&display=swap" rel="stylesheet">
        <style>
          @page { size: ${store.paperSize || 'A4'} ${store.orientation || 'portrait'}; margin: 0; }
          body { 
            font-family: 'Inter', sans-serif; 
            background-color: #ffffff; 
            color: #000000; 
            padding: 0; 
            margin: 0; 
            line-height: 1.4;
            border-top: 16px solid ${themeColor};
            border-bottom: 16px solid ${themeColor};
          }
          .invoice-content { padding: 40px 50px; }
          .header-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
          .company-details { font-size: 11px; line-height: 1.5; }
          .company-name { font-size: 14px; font-weight: bold; margin-bottom: 4px; }
          .logo-container { max-height: 60px; }
          .billing-columns { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 30px; font-size: 11px; }
          .bill-section h3 { font-size: 11px; font-weight: bold; text-transform: uppercase; margin: 0 0 8px 0; color: #000000; }
          .bill-section p { margin: 3px 0; }
          
          .invoice-total-banner { 
            display: flex; 
            justify-content: space-between; 
            align-items: baseline; 
            border-bottom: 2.5px solid #000000; 
            padding-bottom: 8px; 
            margin-bottom: 30px; 
          }
          .total-title { font-size: 26px; font-weight: bold; }
          .total-value { font-size: 26px; font-weight: bold; font-family: monospace; }
          
          .minimal-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .minimal-table th { font-size: 11px; font-weight: bold; text-transform: uppercase; border-bottom: 1.5px solid #000000; padding: 8px 0; text-align: left; }
          .minimal-table td { padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-size: 11px; vertical-align: top; }
          .subtotals-box { display: flex; flex-direction: column; align-items: flex-end; margin-top: 15px; }
          .subtotals-table { width: 220px; font-size: 11px; }
          .subtotals-table td { padding: 4px 0; }
          
          .terms-footer { margin-top: 50px; font-size: 10px; line-height: 1.5; }
          .terms-title { font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 6px; }
        </style>
      </head>
      <body onload="window.print()">
        <div class="invoice-content">
          <div class="header-section">
            <div class="company-details">
              <div class="company-name">${store.customCompanyName || store.shopName}</div>
              <div>${store.customAddress || store.address}</div>
              ${store.printPhone !== false ? `<div>Phone: ${store.customPhone || store.phoneNumber}</div>` : ''}
              ${store.printEmail !== false ? `<div>Email: ${store.customEmail || store.email}</div>` : ''}
              ${store.printGSTIN !== false ? `<div>GSTIN: ${store.customGSTIN || store.gstin}</div>` : ''}
            </div>
            <div class="logo-container">
              ${logoHTML ? logoHTML : `<svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:${themeColor}"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg>`}
            </div>
          </div>
          
          <div class="billing-columns">
            <div class="bill-section">
              <h3>BILL TO</h3>
              <p><strong>${invoice.buyerName}</strong></p>
              <p>${invoice.buyerBillingAddress}</p>
            </div>
            <div class="bill-section">
              <h3>SHIP TO</h3>
              <p><strong>${invoice.buyerName}</strong></p>
              <p>${invoice.buyerBillingAddress}</p>
            </div>
            <div class="bill-section">
              <h3>INVOICE DETAILS</h3>
              <p><strong>INVOICE #</strong> ${invoice.invoiceNumber}</p>
              <p><strong>INVOICE DATE</strong> ${new Date(invoice.invoiceDate).toLocaleDateString()}</p>
              <p><strong>DUE DATE</strong> ${new Date(new Date(invoice.invoiceDate).getTime() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
            </div>
          </div>
          
          <div class="invoice-total-banner">
            <span class="total-title">Invoice Total</span>
            <span class="total-value">${currencySymbol}${formatAmount(invoice.grandTotal)}</span>
          </div>
          
          <table class="minimal-table">
            <thead>
              <tr>
                <th style="width: 10%; text-align: center;">QTY</th>
                <th style="width: 60%;">DESCRIPTION</th>
                <th style="width: 15%; text-align: right;">UNIT PRICE</th>
                <th style="width: 15%; text-align: right;">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => {
                const rate = (item.isTaxInclusive ? item.mrp : item.price) || 0;
                const amount = item.totalAmount || 0;
                return `
                  <tr>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td>
                      <strong>${item.description}</strong>
                      <div style="font-size: 9px; color: #64748b; margin-top: 2px;">HSN: ${item.hsnCode || 'N/A'}</div>
                    </td>
                    <td style="text-align: right; font-family: monospace;">${currencySymbol}${formatAmount(rate)}</td>
                    <td style="text-align: right; font-family: monospace;">${currencySymbol}${formatAmount(amount)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="subtotals-box">
            <table class="subtotals-table">
              ${getTotalsTableRowsHTML()}
            </table>
          </div>
          
          <div class="terms-footer">
            <div class="terms-title">TERMS & CONDITIONS</div>
            <p>Payment is due within 15 days of invoice date.</p>
            <p>Thank you for choosing ${store.customCompanyName || store.shopName}! We appreciate your business.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // 3. --- COMMERCIAL INVOICE TEMPLATE (Photo 1) ---
  if (template === 'Commercial') {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Commercial Invoice #${invoice.invoiceNumber}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;750&display=swap" rel="stylesheet">
        <style>
          @page { size: ${store.paperSize || 'A4'} ${store.orientation || 'portrait'}; margin: 10mm; }
          body { font-family: 'Inter', sans-serif; background-color: #ffffff; color: #000000; padding: 40px; line-height: 1.4; }
          .header-block { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
          .company-info { font-size: 11px; line-height: 1.5; }
          .company-name { font-size: 13px; font-weight: bold; margin-bottom: 4px; }
          .title-area { text-align: right; }
          .title-area h1 { font-size: 32px; font-weight: bold; margin: 0; color: #000000; }
          .title-area .po-number { font-size: 14px; font-weight: 600; margin-top: 4px; }
          
          .info-block { display: flex; justify-content: space-between; margin-bottom: 40px; font-size: 11px; }
          .bill-to h3 { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #777777; margin: 0 0 6px 0; }
          .bill-to p { margin: 3px 0; }
          .dates-area { text-align: right; }
          .date-row { margin-bottom: 12px; }
          .date-label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #777777; margin-bottom: 2px; }
          .date-val { font-size: 12px; font-weight: 600; }
          
          .commercial-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .commercial-table th { background-color: #4b5563; color: #ffffff; padding: 8px 12px; font-size: 10px; text-transform: uppercase; font-weight: bold; text-align: left; border: 1px solid #4b5563; }
          .commercial-table td { padding: 12px; border: 1px solid #e2e8f0; font-size: 11px; }
          .commercial-table tr:nth-child(even) { background-color: #f8fafc; }
          
          .totals-flex { display: grid; grid-template-columns: 1.5fr 1fr; gap: 40px; margin-top: 20px; font-size: 11px; }
          .notes-side { background-color: #f1f5f9; padding: 15px; border-radius: 8px; height: fit-content; }
          .notes-title { font-weight: bold; margin-bottom: 6px; }
          .totals-side { display: flex; flex-direction: column; gap: 2px; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 12px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; }
          .total-row.highlight { background-color: #cbd5e1; font-weight: bold; }
          
          .agreement-section { margin-top: 60px; border-top: 1px solid #cbd5e1; padding-top: 25px; }
          .agreement-title { font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 30px; }
          .signature-lines { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
          .sig-field { border-bottom: 1px solid #94a3b8; margin-top: 25px; padding-bottom: 4px; font-size: 10px; color: #64748b; }
        </style>
      </head>
      <body onload="window.print()">
        <div class="header-block">
          <div class="company-info">
            <div class="company-name">${store.customCompanyName || store.shopName}</div>
            <div>${store.customAddress || store.address}</div>
            ${store.printPhone !== false ? `<div>Phone: ${store.customPhone || store.phoneNumber}</div>` : ''}
            ${store.printEmail !== false ? `<div>Email: ${store.customEmail || store.email}</div>` : ''}
            ${store.printGSTIN !== false ? `<div>GSTIN: ${store.customGSTIN || store.gstin}</div>` : ''}
          </div>
          <div class="title-area">
            ${logoHTML ? logoHTML : '<svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom:8px; color:#4b5563;"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>'}
            <h1>Commercial Invoice</h1>
            <div class="po-number">P.O. # ${invoice.invoiceNumber}</div>
          </div>
        </div>
        
        <div class="info-block">
          <div class="bill-to">
            <h3>BILL TO</h3>
            <p><strong>${invoice.buyerName}</strong></p>
            <p>${invoice.buyerBillingAddress}</p>
            <p style="font-family: monospace; font-size: 10px; color: #64748b; margin-top: 6px;">GST: ${invoice.buyerGSTIN}</p>
          </div>
          <div class="dates-area">
            <div class="date-row">
              <div class="date-label">PREPARED DATE</div>
              <div class="date-val">${new Date(invoice.invoiceDate).toLocaleDateString()}</div>
            </div>
            <div class="date-row">
              <div class="date-label">DUE DATE</div>
              <div class="date-val">${new Date(new Date(invoice.invoiceDate).getTime() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
        
        <table class="commercial-table">
          <thead>
            <tr>
              <th style="width: 50%;">ITEM</th>
              ${store.printTotalQty !== false ? '<th style="width: 15%; text-align: center;">QTY</th>' : ''}
              <th style="width: 15%; text-align: right;">PRICE</th>
              <th style="width: 20%; text-align: right;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => {
              const rate = (item.isTaxInclusive ? item.mrp : item.price) || 0;
              const amount = item.totalAmount || 0;
              return `
                <tr>
                  <td><strong>${item.description}</strong><br/><small style="color: #64748b; font-family: monospace;">HSN: ${item.hsnCode || 'N/A'}</small></td>
                  ${store.printTotalQty !== false ? `<td style="text-align: center;">${item.quantity}</td>` : ''}
                  <td style="text-align: right; font-family: monospace;">${currencySymbol}${formatAmount(rate)}</td>
                  <td style="text-align: right; font-family: monospace;">${currencySymbol}${formatAmount(amount)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div class="totals-flex">
          <div class="notes-side">
            <div class="notes-title">Notes:</div>
            <p style="margin: 0; color: #475569;">Payment upon delivery.</p>
          </div>
          <div class="totals-side">
            <div class="total-row">
              <span>Subtotal:</span>
              <span style="font-family: monospace;">${currencySymbol}${formatAmount(invoice.subTotal)}</span>
            </div>
            ${store.printTaxDetails !== false ? `
              <div class="total-row">
                <span>Sales Tax:</span>
                <span style="font-family: monospace;">${currencySymbol}${formatAmount(invoice.taxTotal)}</span>
              </div>
            ` : ''}
            <div class="total-row highlight">
              <span>Total:</span>
              <span style="font-family: monospace;">${currencySymbol}${formatAmount(invoice.grandTotal)}</span>
            </div>
          </div>
        </div>
        
        <div class="agreement-section">
          <div class="agreement-title">AGREED AND ACCEPTED:</div>
          <div class="signature-lines">
            <div>
              <div class="sig-field">Name:</div>
              <div class="sig-field">Title:</div>
              <div class="sig-field">Date:</div>
            </div>
            <div>
              <div class="sig-field">Name:</div>
              <div class="sig-field">Title:</div>
              <div class="sig-field">Date:</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // 4. --- MODERN HEXAGON LOGO TEMPLATE (Photo 3) ---
  if (template === 'Modern') {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Invoice #${invoice.invoiceNumber}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          @page { size: ${store.paperSize || 'A4'} ${store.orientation || 'portrait'}; margin: 0; }
          body { 
            font-family: 'Inter', sans-serif; 
            background-color: #ffffff; 
            color: #334155; 
            padding: 0; 
            margin: 0; 
            line-height: 1.4;
            border-top: 6px solid ${themeColor};
          }
          .invoice-wrapper { padding: 40px 50px; }
          .top-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 35px; }
          .invoice-title { font-size: 28px; font-weight: 700; color: #1e293b; }
          .brand-logo-area { text-align: right; }
          .brand-logo-img { height: 45px; margin-bottom: 6px; }
          .brand-company-name { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #000000; }
          .brand-tagline { font-size: 9px; color: #64748b; text-transform: uppercase; margin-top: 1px; letter-spacing: 0.05em; }
          
          .address-details-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; margin-bottom: 35px; font-size: 11px; }
          .address-col h4 { font-size: 11px; font-weight: bold; color: #64748b; margin: 0 0 6px 0; }
          .address-col p { margin: 3px 0; line-height: 1.4; }
          
          .modern-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .modern-table th { background-color: ${themeColor}; color: #ffffff; padding: 10px 12px; font-size: 10px; font-weight: bold; text-transform: uppercase; text-align: left; }
          .modern-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
          
          .bottom-flex { display: grid; grid-template-columns: 1.5fr 1fr; gap: 40px; margin-top: 20px; font-size: 11px; }
          .notes-block { font-size: 10px; line-height: 1.5; color: #64748b; }
          .totals-block { display: flex; flex-direction: column; gap: 2px; }
          .totals-table { width: 100%; border-collapse: collapse; }
          .totals-table td { padding: 5px 8px; font-size: 11px; color: #334155; }
          .totals-table tr.total-due { font-weight: bold; font-size: 13px; border-top: 2.5px double #cbd5e1; padding-top: 8px; }
        </style>
      </head>
      <body onload="window.print()">
        <div class="invoice-wrapper">
          <div class="top-row">
            <div class="invoice-title">Invoice</div>
            <div class="brand-logo-area">
              ${logoHTML 
                ? logoHTML 
                : `<svg class="brand-logo-img" viewBox="0 0 100 100" style="display:inline-block; height: 35px; stroke: #dc2626; fill: none; stroke-width: 6;">
                     <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" />
                   </svg>`
              }
              <div class="brand-company-name">${store.customCompanyName || store.shopName}</div>
              <div class="brand-tagline">Dynamic Enterprise solutions</div>
            </div>
          </div>
          
          <div class="address-details-grid">
            <div class="address-col">
              <h4>From</h4>
              <p><strong>${store.customCompanyName || store.shopName}</strong></p>
              <p>${store.customAddress || store.address}</p>
              ${store.printPhone !== false ? `<p>Phone: ${store.customPhone || store.phoneNumber}</p>` : ''}
              ${store.printEmail !== false ? `<p>Email: ${store.customEmail || store.email}</p>` : ''}
              ${store.printGSTIN !== false ? `<p>GSTIN: ${store.customGSTIN || store.gstin}</p>` : ''}
            </div>
            
            <div class="address-col">
              <h4>For</h4>
              <p><strong>${invoice.buyerName}</strong></p>
              <p>${invoice.buyerBillingAddress}</p>
              ${invoice.buyerGSTIN ? `<p style="font-family: monospace; font-size: 10px; color: #64748b;">GSTIN: ${invoice.buyerGSTIN}</p>` : ''}
            </div>
            
            <div class="address-col">
              <h4>Details</h4>
              <p><strong>Number:</strong> <span style="font-family: monospace;">${invoice.invoiceNumber}</span></p>
              <p><strong>Date:</strong> ${new Date(invoice.invoiceDate).toLocaleDateString()}</p>
              <p><strong>Terms:</strong> Immediate Payment</p>
              <p><strong>Due Date:</strong> ${new Date(new Date(invoice.invoiceDate).getTime() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
            </div>
          </div>
          
          <table class="modern-table">
            <thead>
              <tr>
                <th style="width: 50%;">Description</th>
                <th style="width: 15%; text-align: right;">Price</th>
                ${store.printTotalQty !== false ? '<th style="width: 15%; text-align: center;">Qty</th>' : ''}
                <th style="width: 20%; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => {
                const rate = (item.isTaxInclusive ? item.mrp : item.price) || 0;
                const amount = item.totalAmount || 0;
                return `
                  <tr>
                    <td><strong>${item.description}</strong><br/><small style="color: #64748b; font-family: monospace;">HSN: ${item.hsnCode || 'N/A'}</small></td>
                    <td style="text-align: right; font-family: monospace;">${currencySymbol}${formatAmount(rate)}</td>
                    ${store.printTotalQty !== false ? `<td style="text-align: center;">${item.quantity}</td>` : ''}
                    <td style="text-align: right; font-family: monospace;">${currencySymbol}${formatAmount(amount)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="bottom-flex">
            <div class="notes-block">
              <strong>Notes:</strong>
              <p style="margin: 4px 0 0 0;">Thank you for your business! Please remit payment according to terms.</p>
            </div>
            <div class="totals-block">
              <table class="totals-table">
                ${getTotalsTableRowsHTML()}
              </table>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // 5. --- PROFORMA PURPLE LAYOUT TEMPLATE (User Design) ---
  if (template === 'Proforma') {
    // Generate Padded Rows for Proforma
    const paddedItems = [...invoice.items];
    while (paddedItems.length < 5) {
      paddedItems.push({
        description: '',
        hsnCode: '',
        quantity: '',
        price: '',
        totalAmount: 0
      });
    }

    const itemRowsPadded = paddedItems.map((item, idx) => {
      const isPlaceholder = !item.description;
      const desc = isPlaceholder ? '' : item.description;
      const subDesc = isPlaceholder ? '' : `<div style="font-size: 9px; color: #64748b; margin-top: 2px;">HSN: ${item.hsnCode || 'N/A'}</div>`;
      const rate = isPlaceholder ? '' : `${formatAmount(item.isTaxInclusive ? item.mrp : item.price)}`;
      const qty = isPlaceholder ? '' : item.quantity;
      const amount = isPlaceholder ? '0' : `${formatAmount(item.totalAmount)}`;
      return `
        <tr>
          <td class="index-col">${idx + 1}</td>
          <td>
            <strong>${desc}</strong>
            ${subDesc}
          </td>
          <td style="text-align: right; font-family: monospace;">${rate}</td>
          <td style="text-align: center;">${qty}</td>
          <td style="text-align: right; font-family: monospace;">${amount}</td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Proforma Invoice #${invoice.invoiceNumber}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
          @page { size: ${store.paperSize || 'A4'} ${store.orientation || 'portrait'}; margin: 10mm; }
          body {
            font-family: 'Inter', sans-serif;
            background-color: #ffffff;
            color: #334155;
            padding: 0;
            margin: 0;
            line-height: 1.4;
            font-size: 11px;
          }
          .proforma-container {
            max-width: 800px;
            margin: auto;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
            padding-bottom: 20px;
          }
          .top-banner {
            background-color: ${themeColor};
            color: #ffffff;
            padding: 24px;
            text-align: center;
            position: relative;
          }
          .top-banner .banner-logo {
            position: absolute;
            left: 24px;
            top: 50%;
            transform: translateY(-50%);
            max-height: 60px;
          }
          .top-banner h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .top-banner p {
            margin: 4px 0 0 0;
            font-size: 10px;
            opacity: 0.9;
          }
          .section-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            padding: 20px 24px 0 24px;
          }
          .sub-banner {
            background-color: ${themeColor};
            color: #ffffff;
            padding: 6px 12px;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 10px;
            border-radius: 2px;
            margin-bottom: 10px;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
          }
          .info-table td {
            padding: 4px 0;
            vertical-align: top;
            font-size: 11px;
          }
          .info-table td.label {
            font-weight: 700;
            color: #0f172a;
            width: 120px;
          }
          .items-table {
            width: calc(100% - 48px);
            margin: 20px 24px;
            border-collapse: collapse;
          }
          .items-table th {
            background-color: #f1f5f9;
            color: #0f172a;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 10px;
            padding: 10px 12px;
            border-bottom: 2px solid #cbd5e1;
          }
          .items-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 11px;
            vertical-align: middle;
          }
          .items-table td.index-col {
            background-color: ${themeColor}0d;
            font-weight: 700;
            text-align: center;
            width: 30px;
            border-right: 1px solid #cbd5e1;
            color: ${themeColor};
          }
          .bottom-section {
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: 30px;
            padding: 0 24px;
            margin-top: 15px;
          }
          .checkbox-block {
            display: flex;
            align-items: flex-start;
            margin: 12px 0;
            font-size: 10px;
            color: #64748b;
          }
          .checkbox-block input {
            margin-right: 6px;
            margin-top: 2px;
          }
          .signature-block {
            margin-top: 15px;
          }
          .signature-block td {
            padding: 4px 0;
          }
          .totals-box {
            width: 100%;
          }
          .totals-box table {
            width: 100%;
            border-collapse: collapse;
          }
          .totals-box td {
            padding: 6px 8px;
            font-size: 11px;
          }
          .totals-box tr.highlight {
            background-color: ${themeColor}15;
            font-weight: 700;
            color: ${themeColor};
            border-top: 1.5px solid ${themeColor};
          }
          .totals-box tr.highlight td {
            font-size: 13px;
            padding: 8px;
          }
          .notes-block {
            padding: 0 24px;
            font-size: 10px;
            color: #64748b;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="proforma-container">
          <div class="top-banner">
            <div class="banner-logo">
              ${logoHTML ? logoHTML : `<svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg>`}
            </div>
            <h1>Proforma Invoice</h1>
            <p>${store.customAddress || store.address}</p>
            <p>
              ${store.printPhone !== false ? `Ph: ${store.customPhone || store.phoneNumber}` : ''} 
              ${store.printEmail !== false ? ` • Email: ${store.customEmail || store.email}` : ''}
              ${store.printGSTIN !== false ? ` • GSTIN: ${store.customGSTIN || store.gstin}` : ''}
            </p>
          </div>

          <div class="section-grid">
            <div>
              <div class="sub-banner">Bill To</div>
              <table class="info-table">
                <tr>
                  <td class="label">Name</td>
                  <td>${invoice.buyerName}</td>
                </tr>
                <tr>
                  <td class="label">Email</td>
                  <td>${invoice.buyerEmail || 'customer@example.com'}</td>
                </tr>
                <tr>
                  <td class="label">Phone Number</td>
                  <td>${invoice.buyerPhone || 'N/A'}</td>
                </tr>
                <tr>
                  <td class="label">Address</td>
                  <td>${invoice.buyerBillingAddress}</td>
                </tr>
              </table>
            </div>
            <div>
              <div class="sub-banner">Ship To</div>
              <table class="info-table">
                <tr>
                  <td class="label">Name</td>
                  <td>${invoice.buyerName}</td>
                </tr>
                <tr>
                  <td class="label">Email</td>
                  <td>${invoice.buyerEmail || 'customer@example.com'}</td>
                </tr>
                <tr>
                  <td class="label">Phone Number</td>
                  <td>${invoice.buyerPhone || 'N/A'}</td>
                </tr>
                <tr>
                  <td class="label">Address</td>
                  <td>${invoice.buyerBillingAddress}</td>
                </tr>
              </table>
            </div>
          </div>

          <div class="section-grid" style="margin-top: 10px;">
            <div>
              <div class="sub-banner">Shipping Details</div>
              <table class="info-table">
                <tr>
                  <td class="label">Est. Ship Date</td>
                  <td>${new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td class="label">Est. Weight (kg)</td>
                  <td>100</td>
                </tr>
                <tr>
                  <td class="label">Transportation</td>
                  <td>Land</td>
                </tr>
                <tr>
                  <td class="label">Carrier</td>
                  <td>LBC Delivery</td>
                </tr>
              </table>
            </div>
            <div>
              <div class="sub-banner">Invoice Details</div>
              <table class="info-table">
                <tr>
                  <td class="label">Invoice #</td>
                  <td>${invoice.invoiceNumber}</td>
                </tr>
                <tr>
                  <td class="label">Invoice Date</td>
                  <td>${new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td class="label">Due Date</td>
                  <td>${new Date(new Date(invoice.invoiceDate).getTime() + 15*24*60*60*1000).toLocaleDateString()}</td>
                </tr>
              </table>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 5%; text-align: center;">#</th>
                <th style="width: 55%; text-align: left;">Description</th>
                <th style="width: 15%; text-align: right;">Price (${currencySymbol})</th>
                <th style="width: 10%; text-align: center;">Quantity</th>
                <th style="width: 15%; text-align: right;">Amount (${currencySymbol})</th>
              </tr>
            </thead>
            <tbody>
              ${itemRowsPadded}
            </tbody>
          </table>

          <div class="bottom-section">
            <div>
              <table class="info-table">
                <tr>
                  <td class="label">Payment Method</td>
                  <td>${invoice.paymentMode || 'Check'}</td>
                </tr>
              </table>
              
              <div class="checkbox-block">
                <input type="checkbox" checked onclick="return false;" />
                <span>I acknowledge that the information above is accurate and true.</span>
              </div>

              <table class="info-table signature-block">
                <tr>
                  <td class="label">Shipper Name</td>
                  <td>Jamie Thomas</td>
                </tr>
                <tr>
                  <td class="label">Shipper Signature</td>
                  <td style="font-style: italic; color: #64748b; font-family: 'Georgia', serif;">Jamie Thomas</td>
                </tr>
              </table>
            </div>
            
            <div class="totals-box">
              <table>
                <tr>
                  <td>Subtotal:</td>
                  <td style="text-align: right; font-family: monospace;">${currencySymbol}${formatAmount(invoice.subTotal)}</td>
                </tr>
                <tr>
                  <td>Tax (${currencySymbol}):</td>
                  <td style="text-align: right; font-family: monospace;">${currencySymbol}${formatAmount(invoice.taxTotal)}</td>
                </tr>
                <tr>
                  <td>Shipping (${currencySymbol}):</td>
                  <td style="text-align: right; font-family: monospace;">${currencySymbol}${formatAmount(0)}</td>
                </tr>
                <tr class="highlight">
                  <td>Total Amount:</td>
                  <td style="text-align: right; font-family: monospace;">${currencySymbol}${formatAmount(invoice.grandTotal)}</td>
                </tr>
              </table>
            </div>
          </div>

          <div class="notes-block">
            <strong>Notes:</strong> This invoice is in ${isIndianFormat ? 'INR' : 'USD'}. Total payment due is 30 days.
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
      @page { size: ${store.paperSize || 'A4'} ${store.orientation || 'portrait'}; margin: 10mm; }
      body { font-family: 'Inter', sans-serif; background-color: #ffffff; color: #1e293b; padding: 40px; }
      .invoice-container { max-width: 800px; margin: auto; }
      .header-accent { background: linear-gradient(135deg, ${themeColor}, ${themeColor}dd); color: #ffffff; padding: 24px; border-radius: 16px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
      .logo { max-height: 55px; border-radius: 8px; }
      .bill-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
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
    // Thermal formatting styling overrides
    const boldClass = store.thermalUseTextStylingBold !== false ? 'font-weight: bold;' : '';
    customStyle = `
      body { font-family: 'monospace'; background-color: #ffffff; color: #000000; padding: 5px; width: 280px; margin: auto; font-size: 11px; ${boldClass} }
      .invoice-container { width: 100%; }
      .header-accent { text-align: center; border-bottom: 1px dashed #000000; padding-bottom: 10px; margin-bottom: 10px; }
      .logo { max-height: 40px; display: block; margin: 0 auto 5px; }
      .bill-info { margin-bottom: 10px; line-height: 1.4; font-size: 10px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th { border-bottom: 1px dashed #000000; padding: 4px 0; text-align: left; font-size: 10px; }
      td { padding: 5px 0; font-size: 10px; border-bottom: 1px dotted #e2e8f0; }
      .totals-section { margin-top: 10px; border-top: 1px dashed #000000; padding-top: 5px; }
      .totals-table { width: 100%; }
      .totals-table td { padding: 3px 0; font-size: 10px; }
      .grand-total { font-weight: bold; border-top: 1px dashed #000000; padding-top: 4px; }
    `;
  } else {
    // Standard Template
    customStyle = `
      @page { size: ${store.paperSize || 'A4'} ${store.orientation || 'portrait'}; margin: 10mm; }
      body { font-family: 'Arial', sans-serif; background-color: #ffffff; color: #333333; padding: 30px; }
      .invoice-container { max-width: 800px; margin: auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 8px; }
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
      ${store.printTaxDetails !== false ? `<td style="text-align: center;">${item.gstRate}%</td>` : ''}
      ${store.printTotalQty !== false ? `<td style="text-align: center;">${item.quantity}</td>` : ''}
      <td style="text-align: right;">${currencySymbol}${formatAmount(item.isTaxInclusive ? item.mrp : item.price)}</td>
      <td style="text-align: right;">${currencySymbol}${formatAmount(item.totalAmount)}</td>
    </tr>
  `
    )
    .join('');

  // Thermal Single Receipt Generator helper
  const renderThermalReceipt = () => {
    // Overriding company name block in thermal if thermal overrides exist
    const showThermalCompany = store.thermalPrintCompanyName !== false;
    const thermalCompanyNameText = store.thermalCompanyName || store.customCompanyName || store.shopName;
    const thermalHeaderHTML = showThermalCompany ? `
      <div>
        <h2 style="margin: 5px 0 0 0; font-size: 14px; font-weight: bold; text-align: center;">${thermalCompanyNameText}</h2>
        <p style="margin: 2px 0; font-size: 9px; text-align: center; color: #444;">${store.customAddress || store.address}</p>
        <p style="margin: 2px 0; font-size: 9px; text-align: center; color: #444;">GSTIN: ${store.customGSTIN || store.gstin}</p>
      </div>
    ` : '';

    const linesFeedHTML = Array.from({ length: store.thermalExtraLines || 0 }).map(() => '<br/>').join('');

    return `
      <div class="invoice-container">
        <div class="header-accent">
          ${logoHTML}
          ${thermalHeaderHTML}
          <div style="margin-top: 8px; font-weight: bold; font-size: ${invoiceTitleSize}; text-transform: uppercase;">
            ${invoice.billType || 'Invoice'} Receipt
          </div>
          <div style="font-family: monospace; font-size: 9px; margin-top: 4px;">
            No: #${invoice.invoiceNumber} | Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}
          </div>
        </div>

        <div class="bill-info">
          <div><strong>Bill To:</strong> ${invoice.buyerName}</div>
          <div><strong>GSTIN:</strong> ${invoice.buyerGSTIN}</div>
          <div><strong>Address:</strong> ${invoice.buyerBillingAddress}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              ${store.printTotalQty !== false ? '<th style="text-align: center;">Qty</th>' : ''}
              <th style="text-align: right;">Rate</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${item.description}</td>
                ${store.printTotalQty !== false ? `<td style="text-align: center;">${item.quantity}</td>` : ''}
                <td style="text-align: right;">${currencySymbol}${formatAmount(item.isTaxInclusive ? item.mrp : item.price)}</td>
                <td style="text-align: right;">${currencySymbol}${formatAmount(item.totalAmount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals-section">
          <table class="totals-table">
            ${getTotalsTableRowsHTML()}
          </table>
        </div>

        <div style="margin-top: 10px; font-size: 9px; text-align: center; font-family: monospace;">
          ${numberToWords(invoice.grandTotal)}
        </div>

        ${footerHTML}
        ${linesFeedHTML}
      </div>
    `;
  };

  if (template === 'Thermal') {
    const totalCopies = store.thermalCopies || 1;
    const receipts = Array.from({ length: totalCopies }).map(() => renderThermalReceipt()).join('<div style="page-break-after: always; margin-top: 20px; border-top: 2px dashed #000; padding-top: 20px;"></div>');
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Thermal Receipt #${invoice.invoiceNumber}</title>
        <style>
          ${customStyle}
        </style>
      </head>
      <body onload="window.print()">
        ${receipts}
      </body>
      </html>
    `;
  }

  // Fallback / standard formatting
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
            ${logoHTML}
            ${companyNameHTML}
            ${gstinHTML}
          </div>
          <div style="text-align: right;">
            <h1 style="margin: 0; font-size: ${invoiceTitleSize}; text-transform: uppercase;">${invoice.billType || 'Invoice'}</h1>
            <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 12px;">Ref: #${invoice.invoiceNumber}</p>
            <p style="margin: 2px 0; font-size: 11px;">Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Addresses */}
        <div class="bill-info">
          <div class="info-card">
            <h4 style="margin: 0 0 8px 0; text-transform: uppercase; font-size: 11px; color: #64748b;">From</h4>
            ${companyNameHTML}
            ${addressHTML}
            ${phoneHTML}
            ${emailHTML}
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
              ${store.printTaxDetails !== false ? '<th style="text-align: center;">GST %</th>' : ''}
              ${store.printTotalQty !== false ? '<th style="text-align: center;">Qty</th>' : ''}
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
            ${getTotalsTableRowsHTML()}
          </table>
        </div>

        <div style="margin-top: 20px;">
          <span style="font-size: 11px; font-weight: bold; color: #64748b; display: block; text-transform: uppercase;">Amount in Words</span>
          <span style="font-size: 13px; font-weight: 600; color: #1e293b;">${numberToWords(invoice.grandTotal)}</span>
        </div>

        ${footerHTML}
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

    // Default template: if printer type is Thermal and no override, set to Thermal
    const selectedTemplate = templateQuery || invoice.templateType || store.defaultInvoiceTemplate || (store.printerType === 'Thermal' ? 'Thermal' : 'Standard');

    // Update template preference on the invoice record
    if (templateQuery && invoice.templateType !== templateQuery) {
      invoice.templateType = templateQuery;
      await invoice.save();
    }

    // Merge settings configurations from current store schema to the merging state
    const storeSnapshotMerged = {
      ...(invoice.storeSnapshot ? (typeof invoice.storeSnapshot.toObject === 'function' ? invoice.storeSnapshot.toObject() : invoice.storeSnapshot) : {}),
      ...(store ? (typeof store.toObject === 'function' ? store.toObject() : store) : {}),
      invoiceThemeColor: store ? (store.regularThemeColor || store.invoiceThemeColor) : '#2563eb'
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
