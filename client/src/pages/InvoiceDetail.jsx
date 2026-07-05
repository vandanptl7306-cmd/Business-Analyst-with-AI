// client/src/pages/InvoiceDetail.jsx

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInvoiceById, updateInvoiceStatus, sendInvoiceWhatsApp } from '../services/invoice';
import { getInvoicePayments } from '../services/payment';
import InvoiceComplianceForm from '../components/InvoiceComplianceForm';
import InvoiceStatusBadge from '../components/InvoiceStatusBadge';
import CheckoutModal from '../components/CheckoutModal';
import { ArrowLeft, Loader2, FileText, Calendar, Building, Landmark, Percent, Edit3, MessageSquare, Check, Share2, Printer, DollarSign } from 'lucide-react';

export default function InvoiceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('+919876543210');
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('Standard');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const data = await getInvoiceById(id);
        if (data.success) {
          setInvoice(data.invoice);
          setSelectedTemplate(data.invoice.templateType || 'Standard');
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to retrieve invoice details.');
      } finally {
        setLoading(false);
      }
    };

    const fetchPayments = async () => {
      try {
        const payData = await getInvoicePayments(id);
        if (payData.success) {
          setPayments(payData.transactions);
        }
      } catch (err) {
        console.error('Failed to load payments history:', err.message);
      } finally {
        setLoadingPayments(false);
      }
    };

    fetchInvoice();
    fetchPayments();
  }, [id]);

  const handleComplianceGenerated = (updatedInvoice) => {
    setInvoice(updatedInvoice);
  };

  const handlePaymentProcessed = (updatedInvoice) => {
    setInvoice(updatedInvoice);
    getInvoicePayments(id).then((payData) => {
      if (payData.success) {
        setPayments(payData.transactions);
      }
    });
  };

  const handleSendWhatsApp = async () => {
    setSendingWhatsApp(true);
    try {
      const data = await sendInvoiceWhatsApp(id, recipientPhone);
      if (data.success) {
        setInvoice(data.invoice);
        alert('Invoice shared successfully on WhatsApp!');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send WhatsApp message.');
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      const data = await updateInvoiceStatus(id, newStatus);
      if (data.success) {
        setInvoice(data.invoice);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update invoice status.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-brand-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-6">
          <div className="text-red-400 font-semibold">{error || 'Invoice not found'}</div>
          <Link to="/dashboard" className="text-brand-400 hover:text-brand-300 inline-flex items-center space-x-2 text-sm">
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Navigation back */}
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-slate-200 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-brand-500/10 text-brand-400 rounded-2xl border border-brand-500/20">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-100 flex items-center gap-3">
                <span>Invoice details</span>
                <InvoiceStatusBadge status={invoice.status} />
              </h1>
              <p className="text-xs text-slate-400 mt-1">Invoice Ref: #{invoice.invoiceNumber}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3.5 py-2.5 rounded-xl">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-slate-350">Date: {new Date(invoice.invoiceDate).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              <span className="text-slate-400 font-medium pl-1">Format Template:</span>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="bg-slate-950 border border-slate-855 text-slate-200 rounded-lg py-1 px-2.5 outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
              >
                <option value="Standard">Standard</option>
                <option value="Modern">Modern Gradient</option>
                <option value="Thermal">Thermal Receipt</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              <span className="text-slate-400 font-medium pl-1">Update Status:</span>
              <select
                value={invoice.status}
                onChange={handleStatusChange}
                className="bg-slate-950 border border-slate-855 text-slate-200 rounded-lg py-1 px-2.5 outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
              >
                <option value="Draft">Draft</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Paid">Paid</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => window.open(`http://localhost:5000/api/invoices/${invoice._id}/print?template=${selectedTemplate}`, '_blank')}
              className="flex items-center justify-center space-x-1.5 text-xs font-semibold bg-brand-500 hover:bg-brand-400 text-white px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-[0.98]"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Export PDF</span>
            </button>

            {invoice.status !== 'Paid' && invoice.status !== 'Cancelled' && (
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(true)}
                className="flex items-center justify-center space-x-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-[0.98]"
              >
                <DollarSign className="h-4 w-4" />
                <span>Collect Payment</span>
              </button>
            )}
          </div>
        </div>

        {/* Invoice details body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main invoice sheet */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              
              {/* Buyer & Seller details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Seller Info */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2 text-brand-400">
                    <Building className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Seller Details</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="font-semibold text-slate-200">{invoice.sellerName}</p>
                    <p className="text-slate-400">GSTIN: <span className="font-mono text-slate-300">{invoice.sellerGSTIN}</span></p>
                    <p className="text-slate-400">PIN Code: <span className="font-mono text-slate-300">{invoice.sellerPIN}</span></p>
                  </div>
                </div>

                {/* Buyer Info */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2 text-brand-400">
                    <Landmark className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Buyer Details</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="font-semibold text-slate-200">{invoice.buyerName}</p>
                    <p className="text-slate-400">{invoice.buyerBillingAddress}</p>
                    <p className="text-slate-400">GSTIN: <span className="font-mono text-slate-300">{invoice.buyerGSTIN}</span></p>
                    <p className="text-slate-400">PIN Code: <span className="font-mono text-slate-300">{invoice.buyerPIN}</span></p>
                  </div>
                </div>

              </div>

              {/* Items List */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Invoice Items</span>
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-800 text-sm">
                    <thead className="bg-slate-950 text-slate-400 text-xs">
                      <tr>
                        <th className="px-4 py-3 text-left">Description</th>
                        <th className="px-4 py-3 text-center">HSN</th>
                        <th className="px-4 py-3 text-center">Qty</th>
                        <th className="px-4 py-3 text-right">Price</th>
                        <th className="px-4 py-3 text-center">GST %</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {invoice.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 font-medium text-slate-200">{item.description}</td>
                          <td className="px-4 py-3 text-center font-mono text-xs">{item.hsnCode}</td>
                          <td className="px-4 py-3 text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-right">${item.price.toFixed(2)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300">
                              <Percent className="h-2.5 w-2.5 mr-0.5" />
                              {item.gstRate}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-200">
                            ${(item.quantity * item.price).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial calculations */}
              <div className="border-t border-slate-800 pt-6 flex justify-end">
                <div className="w-full max-w-xs space-y-2.5 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span>${invoice.subTotal.toFixed(2)}</span>
                  </div>
                  
                  {/* Tax splits */}
                  <div className="space-y-1.5 pl-3 border-l border-slate-800">
                    {invoice.items.some(i => i.cgst > 0) && (
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>CGST Split</span>
                        <span>
                          ${invoice.items.reduce((acc, i) => acc + i.cgst, 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {invoice.items.some(i => i.sgst > 0) && (
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>SGST Split</span>
                        <span>
                          ${invoice.items.reduce((acc, i) => acc + i.sgst, 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {invoice.items.some(i => i.igst > 0) && (
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>IGST Split</span>
                        <span>
                          ${invoice.items.reduce((acc, i) => acc + i.igst, 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>GST Tax Total</span>
                    <span>${invoice.taxTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-base font-bold text-slate-100 pt-2 border-t border-slate-800">
                    <span>Grand Total</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                      ${invoice.grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Payment Transactions Ledger History */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Landmark className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-lg font-bold text-slate-200">Transaction Payments Ledger</h3>
                </div>
                <div className="text-xs bg-slate-950 px-3 py-1.5 rounded-lg text-slate-400 font-mono">
                  Paid: ${invoice.amountPaid ? invoice.amountPaid.toFixed(2) : '0.00'} | Outstanding: ${invoice.outstandingAmount !== undefined ? invoice.outstandingAmount.toFixed(2) : invoice.grandTotal.toFixed(2)}
                </div>
              </div>

              {loadingPayments ? (
                <div className="py-6 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
                </div>
              ) : payments.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No payments recorded for this invoice yet.</p>
              ) : (
                <div className="space-y-3.5">
                  {payments.map((tx) => (
                    <div key={tx._id} className="flex justify-between items-center bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-200">{tx.paymentMethod}</span>
                          {tx.isAdvance && (
                            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded">
                              ADVANCE
                            </span>
                          )}
                        </div>
                        {tx.transactionReference && (
                          <div className="text-[10px] text-slate-500 font-mono">Ref: {tx.transactionReference}</div>
                        )}
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-mono font-bold text-emerald-400">+${tx.amountReceived.toFixed(2)}</div>
                        <div className="text-[9px] text-slate-500">{new Date(tx.receivedAt).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Compliance Sidebar */}
          <div className="space-y-6">
            <InvoiceComplianceForm invoice={invoice} onComplianceGenerated={handleComplianceGenerated} />
            
            {/* WhatsApp Invoicing */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
                <MessageSquare className="h-6 w-6 text-emerald-400" />
                <h3 className="text-lg font-bold text-slate-200">WhatsApp Invoicing</h3>
              </div>
              
              <p className="text-xs text-slate-400 leading-relaxed">
                Send a GST invoice notification directly to your client's phone number on WhatsApp.
              </p>

              {invoice.whatsappSentStatus === 'Sent' && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center">
                  <Check className="h-4 w-4 mr-2" />
                  <span>Shared successfully on WhatsApp</span>
                </div>
              )}

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Recipient Phone (E.164)
                  </label>
                  <input
                    type="text"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm outline-none focus:ring-1 focus:ring-brand-500 text-slate-250 font-mono"
                  />
                </div>

                <button
                  onClick={handleSendWhatsApp}
                  disabled={sendingWhatsApp}
                  className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {sendingWhatsApp ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Sending PDF Link...
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4 mr-2" />
                      <span>Share via WhatsApp</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Profit Insights (Admin Only) */}
            {user?.role === 'Admin' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
                  <Percent className="h-6 w-6 text-indigo-400" />
                  <h3 className="text-lg font-bold text-slate-200">Profit Insights</h3>
                </div>

                <div className="space-y-3.5 pt-1 text-sm">
                  <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-850">
                    <span className="text-xs text-slate-450">COGS (Cost price)</span>
                    <span className="font-mono font-bold text-slate-300">
                      ${invoice.totalCost ? invoice.totalCost.toFixed(2) : '0.00'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-850">
                    <span className="text-xs text-slate-450">Net Revenue</span>
                    <span className="font-mono font-bold text-slate-300">
                      ${invoice.totalRevenue ? invoice.totalRevenue.toFixed(2) : '0.00'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                    <span className="text-xs text-emerald-400 font-semibold">Net Profit</span>
                    <span className="font-mono font-extrabold text-emerald-450 text-base">
                      ${invoice.netProfit ? invoice.netProfit.toFixed(2) : '0.00'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
                    <span className="text-xs text-blue-400 font-semibold">Profit Margin</span>
                    <span className="font-mono font-extrabold text-blue-450">
                      {invoice.profitMarginPercentage ? invoice.profitMarginPercentage.toFixed(2) : '0.00'}%
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 leading-relaxed text-center pt-2">
                  * Locked unit costs logged at checkout for historical accuracy. Visible only to Admins.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
      
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        invoice={invoice}
        onPaymentProcessed={handlePaymentProcessed}
      />
    </div>
  );
}
