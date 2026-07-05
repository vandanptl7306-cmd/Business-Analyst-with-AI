// client/src/pages/CreateInvoice.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createInvoice, getUpcomingInvoiceNumber } from '../services/invoice';
import { getPartiesList } from '../services/party';
import { getStoreSettings } from '../services/settings';
import { ArrowLeft, Plus, Trash2, FileText, CheckCircle, ShieldAlert, Loader2, Calculator, Barcode } from 'lucide-react';

export default function CreateInvoice() {
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [upcomingNumber, setUpcomingNumber] = useState('');
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [errorDetails, setErrorDetails] = useState([]);

  // Invoice form state
  const [buyerId, setBuyerId] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerGSTIN, setBuyerGSTIN] = useState('');
  const [buyerBillingAddress, setBuyerBillingAddress] = useState('');
  const [buyerPIN, setBuyerPIN] = useState('');

  const [sellerName, setSellerName] = useState('IntellectBill AI Ltd');
  const [sellerGSTIN, setSellerGSTIN] = useState('27AAAAA1111A1Z1');
  const [sellerPIN, setSellerPIN] = useState('400001');
  const [businessProfile, setBusinessProfile] = useState('Retail');

  // Cart / Items state
  const [cart, setCart] = useState([
    { description: 'Enterprise Billing License', hsnCode: '998311', quantity: 1, mrp: 1180.0, price: 1000.0, gstRate: 18, isTaxInclusive: true, batchNumber: 'B-902', minOrderQty: 1, rawMaterials: [] },
  ]);

  useEffect(() => {
    const init = async () => {
      try {
        const partyData = await getPartiesList();
        if (partyData.success) {
          setParties(partyData.parties);
        }
        const seqData = await getUpcomingInvoiceNumber();
        if (seqData.success) {
          setUpcomingNumber(seqData.upcomingNumber);
        }
        const settingsData = await getStoreSettings();
        if (settingsData.success && settingsData.settings) {
          setBusinessProfile(settingsData.settings.businessType || 'Retail');
        }
      } catch (err) {
        console.error('Failed to load metadata:', err.message);
      } finally {
        setLoadingUpcoming(false);
      }
    };
    init();
  }, []);

  const handleSelectBuyer = (e) => {
    const id = e.target.value;
    setBuyerId(id);
    if (id === 'manual') {
      setBuyerName('');
      setBuyerGSTIN('');
      setBuyerBillingAddress('');
      setBuyerPIN('');
      return;
    }
    const selected = parties.find((p) => p._id === id);
    if (selected) {
      setBuyerName(selected.name);
      setBuyerGSTIN('27AAAAA2222B1Z3'); // mock valid format GSTIN for testing
      setBuyerBillingAddress('B-302, Trade Tower, Bandra East, Mumbai');
      setBuyerPIN('400051');
    }
  };

  const handleAddItem = () => {
    setCart([
      ...cart,
      { description: 'Cloud API Multiplier', hsnCode: '998313', quantity: 1, mrp: 590.0, price: 500.0, gstRate: 18, isTaxInclusive: true },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (cart.length === 1) return;
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...cart];
    updated[index][field] = value;

    // Recalculate fields based on toggle changes
    if (field === 'isTaxInclusive' || field === 'mrp' || field === 'price' || field === 'gstRate' || field === 'quantity') {
      const isInc = updated[index].isTaxInclusive;
      const rate = updated[index].gstRate;
      const qty = updated[index].quantity;

      if (isInc) {
        // Price represents inclusive MRP
        const mrpVal = updated[index].mrp;
        const singleBase = (mrpVal * 100) / (100 + rate);
        updated[index].price = Number(singleBase.toFixed(2));
      } else {
        // Price represents exclusive Base
        const priceVal = updated[index].price;
        const singleMrp = priceVal * (1 + rate / 100);
        updated[index].mrp = Number(singleMrp.toFixed(2));
      }
    }

    setCart(updated);
  };

  // Math totals calculation for display on screen
  const calculateCartTotals = () => {
    let subTotal = 0;
    let taxTotal = 0;

    const itemsBreakdown = cart.map((item) => {
      const isInc = item.isTaxInclusive;
      const rate = item.gstRate;
      const qty = item.quantity;
      let base = 0;
      let tax = 0;
      let lineTotal = 0;

      if (isInc) {
        const singleBase = (item.mrp * 100) / (100 + rate);
        base = Number((singleBase * qty).toFixed(2));
        lineTotal = Number((item.mrp * qty).toFixed(2));
        tax = Number((lineTotal - base).toFixed(2));
      } else {
        base = Number((item.price * qty).toFixed(2));
        tax = Number((base * (rate / 100)).toFixed(2));
        lineTotal = Number((base + tax).toFixed(2));
      }

      subTotal += base;
      taxTotal += tax;

      return {
        base,
        tax,
        lineTotal,
      };
    });

    const grandTotal = Number((subTotal + taxTotal).toFixed(2));

    return {
      subTotal,
      taxTotal,
      grandTotal,
      itemsBreakdown,
    };
  };

  const totals = calculateCartTotals();

  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setApiError('');
    setErrorDetails([]);

    const payload = {
      sellerName,
      sellerGSTIN,
      sellerPIN,
      buyerName,
      buyerGSTIN,
      buyerBillingAddress,
      buyerPIN,
      items: cart.map((item) => ({
        description: item.description,
        hsnCode: item.hsnCode,
        quantity: item.quantity,
        price: item.isTaxInclusive ? item.mrp : item.price, // backend handles pricing logic based on flag
        gstRate: item.gstRate,
        isTaxInclusive: item.isTaxInclusive,
        mrp: item.mrp,
      })),
    };

    try {
      const response = await createInvoice(payload);
      if (response.success) {
        navigate(`/invoices/${response.invoice._id}`);
      }
    } catch (err) {
      const responseData = err.response?.data;
      setApiError(responseData?.error || 'Failed to create invoice.');
      if (responseData?.details) {
        setErrorDetails(responseData.details);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
        
        {/* Navigation */}
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-slate-200 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-800 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-brand-500/10 text-brand-400 rounded-2xl border border-brand-500/20">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-3xl font-extrabold text-slate-100">Create New Bill</h1>
                <span className="bg-brand-500/10 text-brand-400 border border-brand-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-lg uppercase">
                  {businessProfile} Mode
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">MRP-Inclusive taxation calculator with auto-splitting and adaptive workflows</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-xs">
            <span className="text-slate-500 font-bold uppercase tracking-wider">Upcoming invoice:</span>
            <span className="font-mono text-brand-400 font-bold">{loadingUpcoming ? 'Loading...' : upcomingNumber}</span>
          </div>
        </div>

        {apiError && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm space-y-2">
            <div className="font-semibold">{apiError}</div>
            {errorDetails.length > 0 && (
              <ul className="list-disc list-inside text-xs text-red-450 pl-2 space-y-1">
                {errorDetails.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form onSubmit={handleGenerateInvoice} className="space-y-6">
          {/* Party Details Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <h3 className="text-lg font-bold text-slate-200">Customer (Party) Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Select Registered Customer</label>
                <select
                  value={buyerId}
                  onChange={handleSelectBuyer}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">-- Select --</option>
                  <option value="manual">Manual Entry / One-time Customer</option>
                  {parties.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Buyer Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Acme Enterprise"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Buyer GSTIN (15 characters)</label>
                <input
                  type="text"
                  required
                  placeholder="27AAAAA2222B1Z3"
                  value={buyerGSTIN}
                  onChange={(e) => setBuyerGSTIN(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Billing Address</label>
                <input
                  type="text"
                  required
                  placeholder="404 Business Tower, Cyber Hub"
                  value={buyerBillingAddress}
                  onChange={(e) => setBuyerBillingAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">PIN Code (6 digits)</label>
                <input
                  type="text"
                  required
                  placeholder="400051"
                  value={buyerPIN}
                  onChange={(e) => setBuyerPIN(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Credit Warning Alerts (Wholesale only) */}
          {businessProfile === 'Wholesale' && buyerName && (
            <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs flex items-center space-x-2.5">
              <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0" />
              <span>Credit Guard: Wholesale credit balance limit check. Customer {buyerName} credit limit is $5,000.00.</span>
            </div>
          )}

          {/* Barcode Quick Search (Retail only) */}
          {businessProfile === 'Retail' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center space-x-3.5">
              <Barcode className="h-6 w-6 text-brand-400 flex-shrink-0" />
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Scan barcode or input SKU key to auto-add retail items... (Scan '12345' for Soda Case demo)"
                  className="w-full bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs text-slate-200 outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                  onChange={(e) => {
                    if (e.target.value === '12345') {
                      setCart([...cart, { description: 'Barcoded Kirana Soda Case', hsnCode: '220210', quantity: 1, mrp: 24.0, price: 20.0, gstRate: 18, isTaxInclusive: true, batchNumber: 'B-POS', minOrderQty: 1, rawMaterials: [] }]);
                      e.target.value = '';
                      alert(' Kirana Barcode Match found! Added Soda Case (MRP: $24.00) to POS cart.');
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Cart Table Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-200">Billing Cart Items</h3>
              
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center space-x-1.5 text-xs text-brand-400 hover:text-brand-300 font-semibold bg-brand-500/10 border border-brand-500/20 px-3.5 py-2.5 rounded-xl transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Add Item Line</span>
              </button>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <table className="min-w-full divide-y divide-slate-800 text-sm">
                <thead className="bg-slate-900/50 text-slate-400 text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left w-2/5">Description</th>
                    <th className="px-4 py-3 text-center">HSN</th>
                    <th className="px-4 py-3 text-center">Tax Split</th>
                    <th className="px-4 py-3 text-center">GST %</th>
                    <th className="px-4 py-3 text-center">Quantity</th>
                    <th className="px-4 py-3 text-right">Price / MRP</th>
                    <th className="px-4 py-3 text-right">Net Total</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-350">
                  {cart.map((item, index) => {
                    const breakdown = totals.itemsBreakdown[index] || { base: 0, tax: 0, lineTotal: 0 };
                    return (
                      <tr key={index}>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            required
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            placeholder="Item Name"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-sm text-slate-200 outline-none"
                          />

                          {/* Wholesale Custom Fields */}
                          {businessProfile === 'Wholesale' && (
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center space-x-1.5">
                                <span className="text-[9px] text-slate-500 uppercase font-bold">Batch No:</span>
                                <input
                                  type="text"
                                  placeholder="e.g. BAT-202"
                                  value={item.batchNumber || ''}
                                  onChange={(e) => handleItemChange(index, 'batchNumber', e.target.value)}
                                  className="bg-slate-950 border border-slate-850 px-2 py-0.5 rounded text-[10px] text-slate-300 font-mono outline-none w-28"
                                />
                              </div>
                              {item.quantity < 5 && (
                                <span className="text-[9px] text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded block w-fit">
                                  MOQ Warning: Minimum 5 units required
                                </span>
                              )}
                            </div>
                          )}

                          {/* Manufacturing Custom Fields */}
                          {businessProfile === 'Manufacturing' && (
                            <div className="mt-2 p-2 bg-slate-950 rounded-lg border border-slate-850 text-[10px] space-y-1">
                              <div className="font-bold text-slate-500 uppercase tracking-wider">Bill of Materials (BOM)</div>
                              <div className="text-slate-400">Consuming: Steel Plates (x2), Hardware Bolts (x10), Assembly labor.</div>
                              <div className="text-brand-400 font-bold">Estimated Cost Price: $700.00 / finished unit</div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center w-24">
                          <input
                            type="text"
                            required
                            value={item.hsnCode}
                            onChange={(e) => handleItemChange(index, 'hsnCode', e.target.value)}
                            placeholder="998311"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-center text-sm text-slate-200 font-mono outline-none"
                          />
                        </td>
                        <td className="px-4 py-3 text-center w-36">
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleItemChange(index, 'isTaxInclusive', !item.isTaxInclusive)}
                              className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all ${
                                item.isTaxInclusive
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                  : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                              }`}
                            >
                              {item.isTaxInclusive ? 'Inclusive (MRP)' : 'Exclusive Tax'}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center w-24">
                          <select
                            value={item.gstRate}
                            onChange={(e) => handleItemChange(index, 'gstRate', Number(e.target.value))}
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-sm text-slate-200 outline-none"
                          >
                            <option value={0}>0%</option>
                            <option value={5}>5%</option>
                            <option value={12}>12%</option>
                            <option value={18}>18%</option>
                            <option value={28}>28%</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-center w-20">
                          <input
                            type="number"
                            required
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-center text-sm text-slate-200 outline-none"
                          />
                        </td>
                        <td className="px-4 py-3 text-right w-36">
                          {item.isTaxInclusive ? (
                            <input
                              type="number"
                              step="0.01"
                              value={item.mrp}
                              onChange={(e) => handleItemChange(index, 'mrp', Number(e.target.value))}
                              placeholder="MRP Price"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-right text-sm text-slate-200 outline-none font-mono"
                            />
                          ) : (
                            <input
                              type="number"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => handleItemChange(index, 'price', Number(e.target.value))}
                              placeholder="Base Price"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-right text-sm text-slate-200 outline-none font-mono"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-slate-200">
                          ${breakdown.lineTotal.toFixed(2)}
                          <div className="text-[10px] text-slate-500 font-normal">
                            Base: ${breakdown.base.toFixed(2)} | Tax: ${breakdown.tax.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center w-16">
                          <button
                            type="button"
                            disabled={cart.length === 1}
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-500 hover:text-red-400 p-1.5 rounded-lg border border-transparent hover:border-slate-800 transition-colors disabled:opacity-55"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Calculations summaries */}
            <div className="border-t border-slate-800 pt-6 flex justify-end">
              <div className="w-full max-w-sm space-y-3 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal Base Amount</span>
                  <span className="font-mono">${totals.subTotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>GST Tax Total Amount</span>
                  <span className="font-mono">${totals.taxTotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-base font-bold text-slate-100 pt-3 border-t border-slate-800">
                  <span>Invoice Grand Total</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 font-mono text-lg">
                    ${totals.grandTotal.toFixed(2)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-5 w-5" />
                      Creating GST Invoice...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-5 w-5 mr-2" />
                      <span>Generate GST Invoice</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
