// client/src/pages/CreateInvoice.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createInvoice, getUpcomingInvoiceNumber } from '../services/invoice';
import { getPartiesList } from '../services/party';
import { getStoreSettings } from '../services/settings';
import { getProductsList, deductStock } from '../services/product';
import {
  ArrowLeft, Plus, Trash2, FileText, CheckCircle, ShieldAlert,
  Loader2, Calculator, Barcode, Package, Search, X, AlertTriangle, Users,
} from 'lucide-react';

// ── helpers ───────────────────────────────────────────────────────────────────
const stockBadge = (qty, threshold) => {
  if (qty === 0)
    return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">Out of Stock</span>;
  if (qty <= threshold)
    return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100">Low: {qty} left</span>;
  return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">{qty} in stock</span>;
};

export default function CreateInvoice() {
  const navigate = useNavigate();

  // ── meta state ────────────────────────────────────────────────────────────
  const [parties, setParties] = useState([]);
  const [products, setProducts] = useState([]);
  const [upcomingNumber, setUpcomingNumber] = useState('');
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [errorDetails, setErrorDetails] = useState([]);

  // ── stock picker state ─────────────────────────────────────────────────────
  const [showStockPicker, setShowStockPicker] = useState(false);
  const [stockSearch, setStockSearch] = useState('');
  const stockSearchRef = useRef(null);

  // ── buyer / seller ────────────────────────────────────────────────────────
  const [buyerId, setBuyerId] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerGSTIN, setBuyerGSTIN] = useState('');
  const [buyerBillingAddress, setBuyerBillingAddress] = useState('');
  const [buyerPIN, setBuyerPIN] = useState('');
  const [sellerName, setSellerName] = useState('IntellectBill AI Ltd');
  const [sellerGSTIN, setSellerGSTIN] = useState('27AAAAA1111A1Z1');
  const [sellerPIN, setSellerPIN] = useState('400001');
  const [businessProfile, setBusinessProfile] = useState('Retail');

  // ── cart ──────────────────────────────────────────────────────────────────
  const [cart, setCart] = useState([
    { description: 'Enterprise Billing License', hsnCode: '998311', quantity: 1, mrp: 1180.0, price: 1000.0, gstRate: 18, isTaxInclusive: true, batchNumber: 'B-902', minOrderQty: 1, rawMaterials: [], _stockId: null },
  ]);

  useEffect(() => {
    const init = async () => {
      try {
        const [partyData, seqData, settingsData, productData] = await Promise.all([
          getPartiesList(),
          getUpcomingInvoiceNumber(),
          getStoreSettings(),
          getProductsList(),
        ]);
        if (partyData.success) setParties(partyData.parties);
        if (seqData.success) setUpcomingNumber(seqData.upcomingNumber);
        if (settingsData.success && settingsData.settings)
          setBusinessProfile(settingsData.settings.businessType || 'Retail');
        if (productData.success) setProducts(productData.products);
      } catch (err) {
        console.error('Failed to load metadata:', err.message);
      } finally {
        setLoadingUpcoming(false);
      }
    };
    init();
  }, []);

  // Focus the stock search input when picker opens
  useEffect(() => {
    if (showStockPicker) setTimeout(() => stockSearchRef.current?.focus(), 80);
  }, [showStockPicker]);

  // ── stock picker: add from inventory ─────────────────────────────────────
  const filteredStockProducts = products.filter((p) =>
    p.quantity > 0 && (
      p.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(stockSearch.toLowerCase())
    )
  );

  const handlePickFromStock = (product) => {
    if (product.quantity === 0) return; // block out-of-stock
    setCart((prev) => [
      ...prev,
      {
        description: product.name,
        hsnCode: '9999',                          // user can override
        quantity: 1,
        mrp: product.mrp,
        price: Number(((product.mrp * 100) / (100 + (product.taxRate || 18))).toFixed(2)),
        gstRate: product.taxRate || 18,
        isTaxInclusive: true,
        batchNumber: product.batchNumber || '',
        minOrderQty: product.minimumOrderQuantity || 1,
        rawMaterials: [],
        _stockId: product._id,                   // track for deduction on submit
        _maxStock: product.quantity,              // guard over-billing
      },
    ]);
    setShowStockPicker(false);
    setStockSearch('');
  };

  // ── buyer select ──────────────────────────────────────────────────────────
  const handleSelectBuyer = (e) => {
    const id = e.target.value;
    setBuyerId(id);
    if (id === 'manual') {
      setBuyerName(''); setBuyerGSTIN(''); setBuyerBillingAddress(''); setBuyerPIN('');
      return;
    }
    const selected = parties.find((p) => p._id === id);
    if (selected) {
      setBuyerName(selected.name);
      setBuyerGSTIN('27AAAAA2222B1Z3');
      setBuyerBillingAddress('B-302, Trade Tower, Bandra East, Mumbai');
      setBuyerPIN('400051');
    }
  };

  // ── cart helpers ──────────────────────────────────────────────────────────
  const handleAddItem = () => {
    setCart([...cart, {
      description: 'Cloud API Multiplier', hsnCode: '998313', quantity: 1,
      mrp: 590.0, price: 500.0, gstRate: 18, isTaxInclusive: true, _stockId: null,
    }]);
  };

  const handleRemoveItem = (index) => {
    if (cart.length === 1) return;
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...cart];
    updated[index][field] = value;

    if (['isTaxInclusive', 'mrp', 'price', 'gstRate', 'quantity'].includes(field)) {
      const isInc = updated[index].isTaxInclusive;
      const rate = updated[index].gstRate;

      if (isInc) {
        const mrpVal = updated[index].mrp;
        updated[index].price = Number(((mrpVal * 100) / (100 + rate)).toFixed(2));
      } else {
        const priceVal = updated[index].price;
        updated[index].mrp = Number((priceVal * (1 + rate / 100)).toFixed(2));
      }
    }
    setCart(updated);
  };

  // ── totals ────────────────────────────────────────────────────────────────
  const calculateCartTotals = () => {
    let subTotal = 0, taxTotal = 0;
    const itemsBreakdown = cart.map((item) => {
      const isInc = item.isTaxInclusive;
      const rate = item.gstRate;
      const qty = item.quantity;
      let base = 0, tax = 0, lineTotal = 0;

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
      return { base, tax, lineTotal };
    });

    return { subTotal, taxTotal, grandTotal: Number((subTotal + taxTotal).toFixed(2)), itemsBreakdown };
  };

  const totals = calculateCartTotals();

  // ── submit: create invoice + deduct stock ─────────────────────────────────
  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setApiError('');
    setErrorDetails([]);

    // Guard: check quantity doesn't exceed available stock for picked items
    const stockErrors = cart
      .filter((item) => item._stockId && item._maxStock !== undefined && item.quantity > item._maxStock)
      .map((item) => `"${item.description}" — requested ${item.quantity} but only ${item._maxStock} in stock.`);

    if (stockErrors.length > 0) {
      setApiError('Insufficient stock for one or more items.');
      setErrorDetails(stockErrors);
      setSubmitting(false);
      return;
    }

    const payload = {
      sellerName, sellerGSTIN, sellerPIN,
      buyerName, buyerGSTIN, buyerBillingAddress, buyerPIN,
      items: cart.map((item) => ({
        description: item.description,
        hsnCode: item.hsnCode,
        quantity: item.quantity,
        price: item.isTaxInclusive ? item.mrp : item.price,
        gstRate: item.gstRate,
        isTaxInclusive: item.isTaxInclusive,
        mrp: item.mrp,
      })),
    };

    try {
      const response = await createInvoice(payload);
      if (response.success) {
        // Deduct stock for every cart item linked to inventory
        const stockItems = cart.filter((item) => item._stockId);
        await Promise.allSettled(
          stockItems.map((item) => deductStock(item._stockId, item.quantity))
        );
        navigate(`/invoices/${response.invoice._id}`);
      }
    } catch (err) {
      const responseData = err.response?.data;
      setApiError(responseData?.error || 'Failed to create invoice.');
      if (responseData?.details) setErrorDetails(responseData.details);
    } finally {
      setSubmitting(false);
    }
  };


  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* Page header banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-indigo-50/5 rounded-full blur-2xl"></div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link to="/dashboard"
              className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors group mr-1">
              <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
              <span>Back</span>
            </Link>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Create New Bill</h1>
                <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold px-2.5 py-0.5 rounded-lg uppercase">
                  {businessProfile} Mode
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">MRP-Inclusive taxation calculator with auto-splitting and adaptive workflows</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Upcoming invoice:</span>
            <span className="font-mono text-indigo-600 font-bold text-xs">{loadingUpcoming ? 'Loading...' : upcomingNumber}</span>
          </div>
        </div>
      </div>

      {/* API Error */}
      {apiError && (
        <div className="p-4 rounded-xl border border-red-100 bg-red-50 text-red-600 text-sm space-y-2">
          <div className="font-semibold">{apiError}</div>
          {errorDetails.length > 0 && (
            <ul className="list-disc list-inside text-xs text-red-500 pl-2 space-y-1">
              {errorDetails.map((detail, i) => <li key={i}>{detail}</li>)}
            </ul>
          )}
        </div>
      )}

      <form onSubmit={handleGenerateInvoice} className="space-y-6">

        {/* Party Details */}
        <div className="card-module space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Customer (Party) Details</h3>
              <p className="text-xs text-slate-500 mt-0.5">Select a registered customer or enter details manually</p>
            </div>
            <Link 
              to="/customers" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center justify-center space-x-1.5 text-xs font-bold text-indigo-650 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-4 py-2 rounded-xl transition-all w-fit"
            >
              <Users className="h-4.5 w-4.5" />
              <span>Manage Customers</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Select Registered Customer</label>
              <select value={buyerId} onChange={handleSelectBuyer}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300">
                <option value="">-- Select --</option>
                <option value="manual">Manual Entry / One-time Customer</option>
                {parties.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Buyer Full Name</label>
              <input type="text" required placeholder="Acme Enterprise" value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Buyer GSTIN (15 characters)</label>
              <input type="text" required placeholder="27AAAAA2222B1Z3" value={buyerGSTIN}
                onChange={(e) => setBuyerGSTIN(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 font-mono" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Billing Address</label>
              <input type="text" required placeholder="404 Business Tower, Cyber Hub" value={buyerBillingAddress}
                onChange={(e) => setBuyerBillingAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">PIN Code (6 digits)</label>
              <input type="text" required placeholder="400051" value={buyerPIN}
                onChange={(e) => setBuyerPIN(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 font-mono" />
            </div>
          </div>
        </div>

        {/* Credit Warning (Wholesale) */}
        {businessProfile === 'Wholesale' && buyerName && (
          <div className="p-4 rounded-xl border border-red-100 bg-red-50 text-red-600 text-xs flex items-center space-x-2.5">
            <ShieldAlert className="h-4 w-4 flex-shrink-0" />
            <span>Credit Guard: Wholesale credit balance limit check. Customer {buyerName} credit limit is ₹5,00,000.</span>
          </div>
        )}

        {/* Barcode Quick Search (Retail) */}
        {businessProfile === 'Retail' && (
          <div className="card-module flex items-center space-x-3.5">
            <Barcode className="h-5 w-5 text-indigo-500 flex-shrink-0" />
            <div className="flex-1">
              <input type="text"
                placeholder="Scan barcode or input SKU to auto-add retail items... (Scan '12345' for demo)"
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-300 font-mono"
                onChange={(e) => {
                  if (e.target.value === '12345') {
                    setCart([...cart, { description: 'Barcoded Kirana Soda Case', hsnCode: '220210', quantity: 1, mrp: 24.0, price: 20.0, gstRate: 18, isTaxInclusive: true, batchNumber: 'B-POS', minOrderQty: 1, rawMaterials: [], _stockId: null }]);
                    e.target.value = '';
                    alert('Kirana Barcode Match found! Added Soda Case (MRP: ₹24.00) to POS cart.');
                  }
                }} />
            </div>
          </div>
        )}

        {/* Cart Table */}
        <div className="card-module space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Billing Cart Items</h3>
              <p className="text-xs text-slate-500 mt-0.5">Add items manually or pick from your stock inventory</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowStockPicker(true)}
                className="flex items-center space-x-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 px-3.5 py-2 rounded-xl transition-all">
                <Package className="h-3.5 w-3.5" />
                <span>Pick from Stock</span>
              </button>
              <button type="button" onClick={handleAddItem}
                className="flex items-center space-x-1.5 text-xs text-indigo-600 font-bold bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3.5 py-2 rounded-xl transition-all">
                <Plus className="h-3.5 w-3.5" />
                <span>Add Item Line</span>
              </button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
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
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {cart.map((item, index) => {
                  const breakdown = totals.itemsBreakdown[index] || { base: 0, tax: 0, lineTotal: 0 };
                  const isOverStock = item._stockId && item._maxStock !== undefined && item.quantity > item._maxStock;
                  return (
                    <tr key={index} className={isOverStock ? 'bg-red-50' : 'hover:bg-slate-50/60 transition-colors'}>
                      <td className="px-4 py-3">
                        <input type="text" required value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Item Name"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-200" />
                        {item._stockId && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <Package className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                            <span className="text-[9px] text-emerald-600 font-semibold">From stock</span>
                            {item._maxStock !== undefined && stockBadge(item._maxStock, 5)}
                            {isOverStock && (
                              <span className="text-[9px] font-bold text-red-600 flex items-center gap-0.5">
                                <AlertTriangle className="h-3 w-3" /> Exceeds stock
                              </span>
                            )}
                          </div>
                        )}
                        {businessProfile === 'Wholesale' && (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[9px] text-slate-400 uppercase font-bold">Batch No:</span>
                              <input type="text" placeholder="e.g. BAT-202" value={item.batchNumber || ''}
                                onChange={(e) => handleItemChange(index, 'batchNumber', e.target.value)}
                                className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[10px] text-slate-700 font-mono outline-none w-28" />
                            </div>
                            {item.quantity < 5 && (
                              <span className="text-[9px] text-amber-700 font-bold bg-amber-50 border border-amber-100 px-2 py-0.5 rounded block w-fit">
                                MOQ Warning: Minimum 5 units required
                              </span>
                            )}
                          </div>
                        )}
                        {businessProfile === 'Manufacturing' && (
                          <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-[10px] space-y-1">
                            <div className="font-bold text-slate-500 uppercase tracking-wider">Bill of Materials (BOM)</div>
                            <div className="text-slate-500">Consuming: Steel Plates (x2), Hardware Bolts (x10), Assembly labor.</div>
                            <div className="text-indigo-600 font-bold">Estimated Cost Price: ₹700.00 / finished unit</div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center w-24">
                        <input type="text" required value={item.hsnCode}
                          onChange={(e) => handleItemChange(index, 'hsnCode', e.target.value)}
                          placeholder="998311"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-center text-sm text-slate-800 font-mono outline-none focus:ring-2 focus:ring-indigo-200" />
                      </td>
                      <td className="px-4 py-3 text-center w-36">
                        <button type="button" onClick={() => handleItemChange(index, 'isTaxInclusive', !item.isTaxInclusive)}
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all ${
                            item.isTaxInclusive
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                              : 'bg-blue-50 border-blue-100 text-blue-600'
                          }`}>
                          {item.isTaxInclusive ? 'Inclusive (MRP)' : 'Exclusive Tax'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center w-24">
                        <select value={item.gstRate}
                          onChange={(e) => handleItemChange(index, 'gstRate', Number(e.target.value))}
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-200">
                          {[0, 5, 12, 18, 28].map((r) => <option key={r} value={r}>{r}%</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center w-20">
                        <input type="number" required min="1" value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                          className={`w-full bg-white border rounded-lg px-2 py-1.5 text-center text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-200 ${
                            isOverStock ? 'border-red-300' : 'border-slate-200'
                          }`} />
                      </td>
                      <td className="px-4 py-3 text-right w-36">
                        {item.isTaxInclusive ? (
                          <input type="number" step="0.01" value={item.mrp}
                            onChange={(e) => handleItemChange(index, 'mrp', Number(e.target.value))}
                            placeholder="MRP Price"
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-right text-sm text-slate-800 outline-none font-mono focus:ring-2 focus:ring-indigo-200" />
                        ) : (
                          <input type="number" step="0.01" value={item.price}
                            onChange={(e) => handleItemChange(index, 'price', Number(e.target.value))}
                            placeholder="Base Price"
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-right text-sm text-slate-800 outline-none font-mono focus:ring-2 focus:ring-indigo-200" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-bold text-slate-800">
                        ₹{breakdown.lineTotal.toFixed(2)}
                        <div className="text-[10px] text-slate-400 font-normal">
                          Base: ₹{breakdown.base.toFixed(2)} | Tax: ₹{breakdown.tax.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center w-16">
                        <button type="button" disabled={cart.length === 1} onClick={() => handleRemoveItem(index)}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all disabled:opacity-40">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals + Submit */}
          <div className="border-t border-slate-200 pt-5 flex justify-end">
            <div className="w-full max-w-sm space-y-3 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal Base Amount</span>
                <span className="font-mono font-semibold text-slate-700">₹{totals.subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>GST Tax Total Amount</span>
                <span className="font-mono font-semibold text-slate-700">₹{totals.taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-800 pt-3 border-t border-slate-200">
                <span>Invoice Grand Total</span>
                <span className="font-mono text-lg text-indigo-600">₹{totals.grandTotal.toFixed(2)}</span>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-sm shadow-indigo-200 active:scale-[0.98] disabled:opacity-50 mt-2">
                {submitting ? (
                  <><Loader2 className="animate-spin mr-2 h-5 w-5" />Creating GST Invoice...</>
                ) : (
                  <><Calculator className="h-5 w-5 mr-2" /><span>Generate GST Invoice</span></>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* ── Stock Picker Modal ─────────────────────────────────────────────────── */}
      {showStockPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Package className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-slate-800">Pick from Stock</h2>
              </div>
              <button onClick={() => { setShowStockPicker(false); setStockSearch(''); }}
                className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-3 border-b border-slate-100 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input ref={stockSearchRef} type="text" value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  placeholder="Search by product name or SKU..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300" />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
              {filteredStockProducts.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">No products found.</div>
              ) : (
                filteredStockProducts.map((p) => {
                  const isOut = p.quantity === 0;
                  const isExpiring = p.expiryDate &&
                    Math.ceil((new Date(p.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) <= 30;
                  return (
                    <button key={p._id} type="button"
                      onClick={() => handlePickFromStock(p)}
                      disabled={isOut}
                      className={`w-full text-left flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                        isOut
                          ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                          : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40 cursor-pointer'
                      }`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800 truncate">{p.name}</span>
                          {isExpiring && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 flex-shrink-0">
                              Expiring Soon
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-mono">{p.sku}</span>
                          <span className="text-[10px] text-slate-400">GST {p.taxRate || 18}%</span>
                          <span className="text-[10px] text-slate-600 font-semibold">MRP ₹{p.mrp}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        {stockBadge(p.quantity, p.lowStockThreshold)}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            <div className="px-6 py-3 border-t border-slate-100 text-[10px] text-slate-400 flex-shrink-0">
              Click a product to add it to the cart. Out-of-stock items are disabled. Stock is deducted automatically on invoice creation.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
