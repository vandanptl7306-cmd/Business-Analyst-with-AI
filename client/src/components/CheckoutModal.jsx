// client/src/components/CheckoutModal.jsx

import React, { useState } from 'react';
import { recordPayment } from '../services/payment';
import { X, CheckCircle, ShieldAlert, Loader2, DollarSign, Send, HelpCircle } from 'lucide-react';

export default function CheckoutModal({ isOpen, onClose, invoice, onPaymentProcessed }) {
  if (!isOpen || !invoice) return null;

  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountReceived, setAmountReceived] = useState((invoice.outstandingAmount ?? invoice.grandTotal).toString());
  const [reference, setReference] = useState('');
  const [isAdvance, setIsAdvance] = useState(false);

  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const outstanding = invoice.outstandingAmount ?? invoice.grandTotal;

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setProcessing(true);

    const amt = parseFloat(amountReceived);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Please input a valid positive amount.');
      setProcessing(false);
      return;
    }

    // ERROR LIMIT VALIDATION POLICY:
    // Block payment if amount exceeds remaining balance, unlessAdvance is active.
    if (amt > outstanding && !isAdvance) {
      setErrorMsg(`Payment amount $${amt} exceeds the remaining outstanding balance of $${outstanding}. Please toggle the 'Mark as Advance Payment' setting to override.`);
      setProcessing(false);
      return;
    }

    try {
      const response = await recordPayment({
        invoiceId: invoice._id,
        paymentMethod,
        amountReceived: amt,
        transactionReference: reference,
        isAdvance,
      });

      if (response.success) {
        setSuccessMsg(`Payment of $${amt} processed successfully via ${paymentMethod}.`);
        setTimeout(() => {
          onPaymentProcessed(response.invoice);
          onClose();
        }, 1500);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to record transaction.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="pb-3 border-b border-slate-800">
          <h3 className="text-xl font-bold text-slate-100">Process Checkout</h3>
          <p className="text-xs text-slate-400 mt-1">Invoice Ref: #{invoice.invoiceNumber}</p>
        </div>

        {/* Messages */}
        {successMsg && (
          <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-450 text-xs flex items-center space-x-2">
            <CheckCircle className="h-4.5 w-4.5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs flex items-center space-x-2">
            <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0" />
            <span className="leading-normal">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleCheckoutSubmit} className="space-y-4 text-sm">
          
          {/* Outstanding details */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-850 text-xs">
            <div>
              <span className="text-slate-500 block uppercase tracking-wider font-bold mb-0.5">Grand Total</span>
              <span className="font-mono text-slate-300 font-bold text-sm">${invoice.grandTotal.toFixed(2)}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block uppercase tracking-wider font-bold mb-0.5">Outstanding Balance</span>
              <span className="font-mono text-brand-400 font-bold text-sm">${outstanding.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Payment Method</label>
            <div className="grid grid-cols-2 gap-2.5">
              {['Cash', 'UPI', 'Card', 'Bank Transfer'].map((method) => {
                const isActive = paymentMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-brand-500/10 border-brand-500 text-brand-400'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-750 text-slate-400'
                    }`}
                  >
                    {method}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Amount Received ($)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <DollarSign className="h-4 w-4" />
              </div>
              <input
                type="number"
                step="0.01"
                required
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:ring-2 focus:ring-brand-500 text-sm font-mono"
              />
            </div>
          </div>

          {/* Reference Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Transaction Reference (Optional)</label>
            <input
              type="text"
              placeholder="e.g. UPI Ref / Card Tx ID"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:ring-2 focus:ring-brand-500 text-xs font-mono"
            />
          </div>

          {/* Advance Overrides Toggle */}
          <div className="flex items-center space-x-2.5 pt-2">
            <input
              type="checkbox"
              id="isAdvance"
              checked={isAdvance}
              onChange={(e) => setIsAdvance(e.target.checked)}
              className="w-4 h-4 text-brand-600 border-slate-800 rounded bg-slate-950 focus:ring-brand-500 cursor-pointer"
            />
            <label htmlFor="isAdvance" className="text-xs text-slate-350 select-none cursor-pointer flex items-center space-x-1">
              <span>Mark as Advance Payment (overrides balance constraints)</span>
            </label>
          </div>

          {/* Checkout CTA */}
          <button
            type="submit"
            disabled={processing}
            className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {processing ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Processing Payment...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                <span>Submit payment</span>
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
}
