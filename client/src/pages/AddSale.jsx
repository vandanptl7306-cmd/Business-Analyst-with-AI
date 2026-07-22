// client/src/pages/AddSale.jsx

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, X, ChevronDown, Trash2, Printer, Download, Search, Package
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createInvoice } from '../services/invoice';
import { getProductsList } from '../services/product';
import { getPartiesList } from '../services/party';
import { useCurrency } from '../context/CurrencyContext';
import { getStoreSettings } from '../services/settings';

const UNIT_OPTIONS = ['NONE', 'Bag', 'Box', 'Btl', 'Can', 'Ctn', 'Doz', 'Gm', 'Kg', 'Ltr', 'Meter', 'Nos', 'Pcs', 'Pkt', 'Roll', 'Ton'];
const TAX_OPTIONS = ['NONE', 'IGST@0%', 'GST@0%', 'GST@0.25%', 'IGST@3%', 'GST@3%', 'IGST@5%', 'GST@5%', 'IGST@12%', 'GST@12%', 'IGST@18%', 'GST@18%', 'IGST@28%', 'GST@28%'];

function taxRateToOption(rate) {
  if (!rate || rate === 0) return 'NONE';
  return `GST@${rate}%`;
}

// ── Customer Search Dropdown ───────────────────────────────────────────────────
function CustomerDropdown({ value, customers, onChange, onSelect }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value || '');
  const ref = useRef(null);

  useEffect(() => { setSearch(value || ''); }, [value]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.phoneNumber && c.phoneNumber.includes(search))
  );

  const handleInput = (e) => {
    setSearch(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  };

  const handlePick = (c) => {
    setSearch(c.name);
    setOpen(false);
    onSelect(c);
  };

  return (
    <div ref={ref} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-2 w-3 h-3 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          placeholder="Customer Name"
          className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-[6px] text-[13px] text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 bg-white"
        />
      </div>

      {open && (
        <div className="absolute z-50 left-0 right-0 top-full mt-0.5 bg-white border border-gray-200 rounded-[6px] shadow-lg max-h-[200px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-gray-400 italic">
              {search ? 'No matching customers found' : 'No customers saved yet'}
            </div>
          ) : (
            filtered.map(c => (
              <button
                key={c._id}
                type="button"
                onMouseDown={() => handlePick(c)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between group transition-colors"
              >
                <div>
                  <div className="text-[12px] font-semibold text-gray-800">{c.name}</div>
                  <div className="text-[10px] text-gray-400">
                    {c.phoneNumber} {c.gstin ? `· GSTIN: ${c.gstin}` : ''}
                  </div>
                </div>
              </button>
            ))
          )}
          {/* Allow free-text entry */}
          {search && !filtered.find(c => c.name.toLowerCase() === search.toLowerCase()) && (
            <button
              type="button"
              onMouseDown={() => { setOpen(false); onChange(search); }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 border-t border-gray-100"
            >
              <div className="text-[11px] text-blue-600 font-semibold">+ Add "{search}" as custom customer</div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Product Search Dropdown ────────────────────────────────────────────────────
function ProductDropdown({ value, products, onChange, onSelect }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value || '');
  const ref = useRef(null);

  // Sync search with external value
  useEffect(() => { setSearch(value || ''); }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) && p.quantity > 0
  );

  const handleInput = (e) => {
    setSearch(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  };

  const handlePick = (p) => {
    setSearch(p.name);
    setOpen(false);
    onSelect(p);
  };

  return (
    <div ref={ref} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-2 w-3 h-3 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          placeholder="Search or type item..."
          className="w-full pl-6 pr-2 py-1.5 border border-gray-200 rounded-[4px] text-[12px] text-gray-800 focus:outline-none focus:border-blue-400 bg-white"
        />
      </div>

      {open && (
        <div className="absolute z-50 left-0 right-0 top-full mt-0.5 bg-white border border-gray-200 rounded-[6px] shadow-lg max-h-[200px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-gray-400 italic">
              {search ? 'No matching in-stock items' : 'No products in stock'}
            </div>
          ) : (
            filtered.map(p => (
              <button
                key={p._id}
                type="button"
                onMouseDown={() => handlePick(p)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between group transition-colors"
              >
                <div>
                  <div className="text-[12px] font-semibold text-gray-800">{p.name}</div>
                  <div className="text-[10px] text-gray-400">
                    ₹{(p.sellingPrice || p.mrp || 0).toFixed(2)} · Stock: {p.quantity} {p.unit}
                  </div>
                </div>
                <Package className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100" />
              </button>
            ))
          )}
          {/* Allow free-text entry */}
          {search && !filtered.find(p => p.name.toLowerCase() === search.toLowerCase()) && (
            <button
              type="button"
              onMouseDown={() => { setOpen(false); onChange(search); }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 border-t border-gray-100"
            >
              <div className="text-[11px] text-blue-600 font-semibold">+ Add "{search}" as custom item</div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AddSale() {
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const [submitting, setSubmitting] = useState(false);
  const [storeProfile, setStoreProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    getStoreSettings()
      .then(res => { if (res?.success && res.settings) setStoreProfile(res.settings); })
      .catch(() => {});
    
    // Load in-stock products for the dropdown
    getProductsList()
      .then(res => { if (res?.success && res.products) setProducts(res.products); })
      .catch(() => {});
      
    getPartiesList()
      .then(res => { if (res?.success && res.customers) setCustomers(res.customers); })
      .catch(() => {});
  }, []);

  // Customer State
  const [customerName, setCustomerName]     = useState('');
  const [customerPhone, setCustomerPhone]   = useState('');
  const [customerGSTIN, setCustomerGSTIN]   = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPIN, setCustomerPIN]       = useState('');

  // Items State
  const [items, setItems] = useState([
    { id: 1, name: '', qty: 1, unit: 'NONE', price: '', discountPercent: '', tax: 'NONE', total: 0 },
  ]);

  // Payment State
  const [received, setReceived]         = useState('');
  const [fullyReceived, setFullyReceived] = useState(false);

  const todayStr = `${String(new Date().getDate()).padStart(2,'0')}/${String(new Date().getMonth()+1).padStart(2,'0')}/${new Date().getFullYear()}`;

  // ── Calculations ────────────────────────────────────────────────
  const calcItem = (item) => {
    let q = parseFloat(item.qty) || 0;
    let p = parseFloat(item.price) || 0;
    let base = q * p;
    let dAmt = item.discountPercent ? base * (parseFloat(item.discountPercent) / 100) : 0;
    base = base - dAmt;
    let tAmt = 0;
    if (item.tax && item.tax !== 'NONE') {
      const match = item.tax.match(/@([\d.]+)%/);
      if (match) tAmt = base * (parseFloat(match[1]) / 100);
    }
    return { ...item, total: base + tAmt };
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    newItems[index].total = calcItem(newItems[index]).total;
    setItems(newItems);
  };

  // When user picks a product from dropdown — auto-fill fields
  const handleProductSelect = (index, product) => {
    const newItems = [...items];
    newItems[index].name  = product.name;
    newItems[index].price = product.sellingPrice || product.mrp || 0;
    newItems[index].tax   = taxRateToOption(product.taxRate);
    newItems[index].unit  = product.unit || 'NONE';
    newItems[index].qty   = newItems[index].qty || 1;
    newItems[index].total = calcItem(newItems[index]).total;
    setItems(newItems);
  };

  const addRow = () => {
    setItems([...items, { id: Date.now(), name: '', qty: 1, unit: 'NONE', price: '', discountPercent: '', tax: 'NONE', total: 0 }]);
  };

  const removeRow = (index) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const subTotal    = items.reduce((sum, it) => sum + (parseFloat(it.total) || 0), 0);
  const totalAmount = Math.round(subTotal);

  const handleFullyReceived = (checked) => {
    setFullyReceived(checked);
    setReceived(checked ? totalAmount.toString() : '');
  };

  const receivedAmt = parseFloat(received) || 0;
  const balance     = totalAmount - receivedAmt;

  // ── Save ────────────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      setSubmitting(true);
      const payload = {
        sellerName:           storeProfile?.shopName || storeProfile?.customCompanyName || 'My Company',
        sellerGSTIN:          storeProfile?.gstin || '27AAAAA0000A1Z5',
        sellerPIN:            storeProfile?.address?.match(/\d{6}/)?.[0] || '000000',
        sellerAddress:        storeProfile?.address || '',
        sellerPhone:          storeProfile?.phoneNumber || '',
        sellerEmail:          storeProfile?.email || '',
        buyerName:            customerName || 'Walk-in Customer',
        buyerGSTIN:           customerGSTIN || 'CONSUMER',
        buyerBillingAddress:  customerAddress || '',
        buyerPIN:             customerPIN || '000000',
        amountPaid:           receivedAmt,
        items: items.filter(it => it.name).map(it => {
          let rate = 0;
          if (it.tax && it.tax !== 'NONE') {
            const match = it.tax.match(/@([\d.]+)%/);
            if (match) rate = parseFloat(match[1]);
          }
          return {
            description:    it.name,
            hsnCode:        '0000',
            quantity:       parseFloat(it.qty) || 1,
            price:          parseFloat(it.price) || 0,
            gstRate:        rate,
            isTaxInclusive: false,
            mrp:            0,
          };
        }),
      };

      if (payload.items.length === 0) {
        alert('Please add at least one valid item.');
        setSubmitting(false);
        return;
      }

      const res = await createInvoice(payload);
      if (res.success) {
        let msg = 'Sale saved successfully!';
        if (res.emailDelivery) {
          if (res.emailDelivery.status === 'Sent') {
            msg += '\n\nEmail notification sent successfully!';
          } else if (res.emailDelivery.status === 'Skipped' || res.emailDelivery.status === 'Failed') {
            msg += `\n\nEmail Notice: ${res.emailDelivery.message}`;
          }
        }
        alert(msg);
        navigate(`/invoices/${res.invoice._id}`);
      }
    } catch (err) {
      console.error(err);
      let errorMsg = err.response?.data?.error || err.message;
      if (err.response?.data?.details && Array.isArray(err.response.data.details)) {
        errorMsg += '\n\nDetails:\n- ' + err.response.data.details.join('\n- ');
      }
      alert('Failed to save sale: ' + errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-[#F4F6F8]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-6 h-[50px] bg-white border-b border-gray-200 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-6">
          <h1 className="text-[18px] font-bold text-gray-800">Sale</h1>
          <div className="h-4 border-l border-gray-300" />
        </div>
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-red-500">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── MAIN SPLIT PANE ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT PANE (FORM) ── */}
        <div className="w-[58%] flex flex-col bg-white border-r border-gray-200 overflow-y-auto relative pb-[80px]">
          <div className="p-6 pb-2">

            {/* Customer Details */}
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="min-w-[180px] flex-1">
                <label className="block text-[11px] text-gray-600 font-semibold mb-1">Customer Name <span className="text-red-500">*</span></label>
                <CustomerDropdown
                  value={customerName}
                  customers={customers}
                  onChange={val => setCustomerName(val)}
                  onSelect={c => {
                    setCustomerName(c.name);
                    setCustomerPhone(c.phoneNumber ? c.phoneNumber.replace(/^\+91/, '') : '');
                    setCustomerGSTIN(c.gstin || '');
                    setCustomerAddress(c.billingAddress || '');
                    setCustomerPIN(c.pinCode || '');
                  }}
                />
              </div>
              <div className="min-w-[180px] flex-1">
                <label className="block text-[11px] text-gray-600 font-semibold mb-1">Customer Phone Number</label>
                <div className="flex">
                  <div className="flex items-center justify-center px-3 border border-r-0 border-gray-200 rounded-l-[6px] bg-gray-50 text-[13px] text-gray-600">+91</div>
                  <input
                    type="text" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="Phone Number"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-r-[6px] text-[13px] text-gray-800 focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
              {storeProfile?.gstinNumber !== false && (
                <div className="min-w-[150px] flex-1">
                  <label className="block text-[11px] text-gray-600 font-semibold mb-1">Customer GSTIN (Optional)</label>
                  <input
                    type="text" value={customerGSTIN} onChange={e => setCustomerGSTIN(e.target.value)}
                    placeholder="GSTIN"
                    className="w-full px-3 py-2 border border-gray-200 rounded-[6px] text-[13px] text-gray-800 focus:outline-none focus:border-blue-400"
                  />
                </div>
              )}
              <div className="min-w-[180px] flex-1">
                <label className="block text-[11px] text-gray-600 font-semibold mb-1">Customer Address (Optional)</label>
                <input
                  type="text" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)}
                  placeholder="Billing Address"
                  className="w-full px-3 py-2 border border-gray-200 rounded-[6px] text-[13px] text-gray-800 focus:outline-none focus:border-blue-400"
                />
              </div>
              <div className="w-[120px]">
                <label className="block text-[11px] text-gray-600 font-semibold mb-1">PIN Code</label>
                <input
                  type="text" value={customerPIN} onChange={e => setCustomerPIN(e.target.value)}
                  placeholder="400001"
                  className="w-full px-3 py-2 border border-gray-200 rounded-[6px] text-[13px] text-gray-800 focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>

            {/* ── In-Stock badge ── */}
            {products.filter(p => p.quantity > 0).length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-3.5 h-3.5 text-green-500" />
                <span className="text-[11px] text-green-700 font-semibold">
                  {products.filter(p => p.quantity > 0).length} products in stock — type to search
                </span>
              </div>
            )}

            {/* Sales Items Table */}
            <div className="w-full mt-1 overflow-x-auto">
              <table className="w-full text-[11px] min-w-[620px]">
                <thead>
                  <tr className="text-gray-500 font-semibold uppercase border-b border-gray-100">
                    <th className="py-2 px-1 text-left w-[28px]">#</th>
                    <th className="py-2 px-1 text-left" style={{ minWidth: 180 }}>ITEM</th>
                    <th className="py-2 px-1 text-left w-[60px]">QTY</th>
                    <th className="py-2 px-1 text-left w-[90px]">UNIT</th>
                    <th className="py-2 px-1 text-left w-[80px]">PRICE</th>
                    <th className="py-2 px-1 text-left w-[80px]">DISC %</th>
                    <th className="py-2 px-1 text-left w-[110px]">TAX</th>
                    <th className="py-2 px-1 text-right w-[70px]">
                      TOTAL <span className="inline-block rounded-full bg-blue-50 text-blue-500 p-0.5 ml-1"><Plus className="w-3 h-3" /></span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={it.id} className="group border-b border-gray-50">

                      {/* Row number + delete */}
                      <td className="py-1.5 px-1 align-top">
                        <div className="relative flex items-center justify-center h-[30px]">
                          <span className="text-gray-400 font-medium text-[11px] group-hover:invisible">{idx + 1}</span>
                          {items.length > 1 && (
                            <Trash2
                              onClick={() => removeRow(idx)}
                              className="w-3.5 h-3.5 text-red-400 absolute inset-0 m-auto opacity-0 group-hover:opacity-100 cursor-pointer"
                            />
                          )}
                        </div>
                      </td>

                      {/* ITEM — searchable product dropdown */}
                      <td className="py-1 px-1 align-top" style={{ minWidth: 180 }}>
                        <ProductDropdown
                          value={it.name}
                          products={products}
                          onChange={(val) => handleItemChange(idx, 'name', val)}
                          onSelect={(product) => handleProductSelect(idx, product)}
                        />
                      </td>

                      {/* QTY */}
                      <td className="py-1 px-1 align-top w-[60px]">
                        <input
                          type="number" value={it.qty}
                          onChange={e => handleItemChange(idx, 'qty', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-[4px] text-[12px] text-gray-800 focus:outline-none focus:border-blue-400"
                        />
                      </td>

                      {/* UNIT */}
                      <td className="py-1 px-1 align-top relative w-[90px]">
                        <select
                          value={it.unit}
                          onChange={e => handleItemChange(idx, 'unit', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-[4px] text-[12px] text-gray-800 appearance-none bg-white focus:outline-none focus:border-blue-400 cursor-pointer"
                        >
                          {UNIT_OPTIONS.map(o => <option key={o}>{o}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-3 w-3 h-3 text-gray-400 pointer-events-none" />
                      </td>

                      {/* PRICE */}
                      <td className="py-1 px-1 align-top w-[80px]">
                        <input
                          type="number" value={it.price}
                          onChange={e => handleItemChange(idx, 'price', e.target.value)}
                          placeholder="0"
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-[4px] text-[12px] text-gray-800 focus:outline-none focus:border-blue-400"
                        />
                      </td>

                      {/* DISCOUNT */}
                      <td className="py-1 px-1 align-top w-[80px]">
                        <input
                          type="number" value={it.discountPercent}
                          onChange={e => handleItemChange(idx, 'discountPercent', e.target.value)}
                          placeholder="0"
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-[4px] text-[12px] text-gray-800 focus:outline-none focus:border-blue-400"
                        />
                      </td>

                      {/* TAX */}
                      <td className="py-1 px-1 align-top relative w-[110px]">
                        <select
                          value={it.tax}
                          onChange={e => handleItemChange(idx, 'tax', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-[4px] text-[12px] text-gray-800 appearance-none bg-white focus:outline-none focus:border-blue-400 cursor-pointer"
                        >
                          {TAX_OPTIONS.map(o => <option key={o}>{o}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-3 w-3 h-3 text-gray-400 pointer-events-none" />
                      </td>

                      {/* TOTAL */}
                      <td className="py-1 px-1 align-top text-right pt-2 font-semibold text-gray-700 w-[70px]">
                        {it.total > 0 ? it.total.toFixed(2) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="h-[2px] bg-gray-200 w-full mt-2 rounded" />

              <div className="flex justify-between mt-3 px-1">
                <button onClick={addRow} className="flex items-center gap-1 text-[12px] font-bold text-blue-600 hover:text-blue-700">
                  <Plus className="w-4 h-4" /> Add Row
                </button>
                <div className="text-[12px] text-gray-500 font-semibold flex gap-2 items-center">
                  Sub Total <span className="text-gray-800 text-[14px] font-bold">{subTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="mt-8 px-1 flex flex-col gap-6">
              <div className="flex justify-between items-end">
                <div className="w-[200px]">
                  <label className="block text-[12px] text-gray-600 font-semibold mb-1">Received</label>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[12px] font-semibold text-gray-600">
                      <input type="checkbox" checked={fullyReceived} onChange={e => handleFullyReceived(e.target.checked)} className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 w-4 h-4" />
                      Fully Received
                    </label>
                    <input
                      type="text" value={received}
                      onChange={e => { setReceived(e.target.value); setFullyReceived(false); }}
                      className="w-[120px] border border-gray-300 rounded-[4px] px-2 py-1.5 text-[13px] text-right font-semibold bg-white focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="text-[12px] font-semibold text-gray-600 mr-2">
                    Balance: <span className="text-gray-800">{balance.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Total Summary Bar */}
              <div className="bg-[#EBF4FA] rounded-[6px] p-4 flex justify-between items-center mt-2">
                <span className="text-[16px] font-bold text-[#1F2937]">Total Amount (₹)</span>
                <span className="text-[20px] font-bold text-[#1F2937]">{totalAmount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANE (DYNAMIC THEME PREVIEW MATCHING PRINT SETTINGS) ── */}
        <div className="w-[42%] bg-[#F0F2F5] p-6 flex justify-center overflow-y-auto">
          {(() => {
            const activeTheme = storeProfile?.regularLayoutTheme || 'GST Theme 1';
            
            // --- TALLY THEME PREVIEW ---
            if (activeTheme === 'Tally Theme' || activeTheme === 'tally') {
              return (
                <div id="invoice-printable-area" className="bg-white w-full max-w-[500px] shadow-md border border-slate-700 p-4 text-black shrink-0 relative flex flex-col text-[10px]" style={{ minHeight: '750px', fontFamily: "'Segoe UI', Arial, sans-serif" }}>
                  <div className="text-center font-bold text-[12px] uppercase mb-2 border border-slate-700 py-1 bg-slate-50 text-slate-800">
                    Tax Invoice
                  </div>
                  <div className="border border-slate-700 flex-1 flex flex-col">
                    <div className="flex border-b border-slate-700 p-2 items-center">
                      <div className="w-12 h-12 bg-slate-200 border border-slate-700 flex items-center justify-center text-[8px] text-slate-500 mr-3 flex-shrink-0">
                        {storeProfile?.customLogoUrl || storeProfile?.logoUrl ? (
                          <img src={storeProfile.customLogoUrl || storeProfile.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : ('Image')}
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-slate-900">{storeProfile?.customCompanyName || storeProfile?.shopName || 'My Company'}</div>
                        <div className="text-[9px] text-slate-700 mt-0.5 font-semibold">Phone: {storeProfile?.customPhone || storeProfile?.phoneNumber || '9913039185'}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 border-b border-slate-700">
                      <div className="p-2 border-r border-slate-700">
                        <div className="font-bold text-[10px] underline mb-1">Buyer (Bill to)</div>
                        <div className="font-bold text-slate-900">{customerName || 'Walk-in Customer'}</div>
                        <div className="text-slate-600">{customerAddress || ''}</div>
                        <div className="text-slate-600">Contact: {customerPhone || '-'}</div>
                      </div>
                      <div className="p-2">
                        <div className="font-bold text-[10px] underline mb-1">Invoice Details</div>
                        <div>Invoice No: Draft</div>
                        <div>Dated: {todayStr}</div>
                      </div>
                    </div>
                    {/* Table */}
                    <div className="flex-1">
                      <table className="w-full text-left text-[9px] border-collapse">
                        <thead>
                          <tr className="border-b border-slate-700 bg-slate-100 font-bold">
                            <th className="p-1 text-center border-r border-slate-700">#</th>
                            <th className="p-1 border-r border-slate-700">Description of Goods</th>
                            <th className="p-1 text-center border-r border-slate-700">HSN</th>
                            <th className="p-1 text-center border-r border-slate-700">Qty</th>
                            <th className="p-1 text-right border-r border-slate-700">Rate</th>
                            <th className="p-1 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.filter(it => it.name).map((it, idx) => (
                            <tr key={idx} className="border-b border-slate-200">
                              <td className="p-1 text-center border-r border-slate-700">{idx + 1}</td>
                              <td className="p-1 font-bold border-r border-slate-700">{it.name}</td>
                              <td className="p-1 text-center border-r border-slate-700">0000</td>
                              <td className="p-1 text-center border-r border-slate-700">{it.qty}</td>
                              <td className="p-1 text-right border-r border-slate-700">₹{parseFloat(it.price || 0).toFixed(2)}</td>
                              <td className="p-1 text-right font-bold">₹{parseFloat(it.total || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Footer */}
                    <div className="border-t border-slate-700 p-2 flex justify-between items-end">
                      <div>
                        <div className="font-bold">Total: ₹{totalAmount.toFixed(2)}</div>
                        <div className="text-[8px] text-slate-500">Rupees {totalAmount} Only</div>
                      </div>
                      <div className="text-right">
                        <div>For {storeProfile?.shopName || 'My Company'}</div>
                        <div className="mt-4 font-bold">Authorized Signatory</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // --- LANDSCAPE THEME PREVIEW ---
            if (activeTheme === 'Landscape Theme 1' || activeTheme === 'landscape1' || activeTheme === 'Landscape Theme 2' || activeTheme === 'landscape2') {
              return (
                <div id="invoice-printable-area" className="bg-white w-full max-w-[540px] shadow-md border border-gray-200 p-5 text-black shrink-0 relative flex flex-col text-[10px]" style={{ minHeight: '650px' }}>
                  <div className="bg-blue-600 text-white p-3 rounded mb-3 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-base">{storeProfile?.customCompanyName || storeProfile?.shopName || 'My Company'}</div>
                      <div className="text-[10px]">Ph: {storeProfile?.customPhone || storeProfile?.phoneNumber || '9913039185'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">TAX INVOICE</div>
                      <div>Date: {todayStr}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3 p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-bold text-gray-700">BILL TO</div>
                      <div className="font-bold">{customerName || 'Customer'}</div>
                      <div>{customerAddress}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-700">INVOICE NO</div>
                      <div className="font-bold">INV-Draft</div>
                    </div>
                  </div>
                  <table className="w-full text-left text-[9px] border-collapse mb-4">
                    <thead>
                      <tr className="bg-blue-600 text-white font-bold">
                        <th className="p-1">#</th>
                        <th className="p-1">Item Description</th>
                        <th className="p-1 text-center">Qty</th>
                        <th className="p-1 text-right">Price</th>
                        <th className="p-1 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.filter(it => it.name).map((it, idx) => (
                        <tr key={idx} className="border-b border-gray-200">
                          <td className="p-1">{idx + 1}</td>
                          <td className="p-1 font-bold">{it.name}</td>
                          <td className="p-1 text-center">{it.qty}</td>
                          <td className="p-1 text-right">₹{parseFloat(it.price || 0).toFixed(2)}</td>
                          <td className="p-1 text-right font-bold">₹{parseFloat(it.total || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-auto flex justify-between items-end border-t pt-2">
                    <div>
                      <div className="font-bold text-blue-600 text-sm">Grand Total: ₹{totalAmount.toFixed(2)}</div>
                    </div>
                    <div className="text-right font-bold">Authorized Signatory</div>
                  </div>
                </div>
              );
            }

            // --- MINIMALIST THEME PREVIEW ---
            if (activeTheme === 'Minimalist Theme' || activeTheme === 'minimalist') {
              // Calculate dynamic tax summary for Minimalist Theme
              const taxSummary = {};
              items.filter(it => it.name).forEach(it => {
                const qty = parseFloat(it.qty) || 1;
                const price = parseFloat(it.price) || 0;
                const disc = it.discountPercent ? (qty * price * (parseFloat(it.discountPercent) / 100)) : 0;
                let gstRate = 0;
                if (it.tax && it.tax !== 'NONE') {
                  const match = it.tax.match(/@([\d.]+)%/);
                  if (match) gstRate = parseFloat(match[1]);
                }
                const taxable = (qty * price) - disc;
                const totalGstAmt = taxable * (gstRate / 100);
                if (gstRate > 0) {
                  const key = `IGST@${gstRate}%`;
                  taxSummary[key] = (taxSummary[key] || 0) + totalGstAmt;
                }
              });

              return (
                <div id="invoice-printable-area" className="bg-white w-full max-w-[500px] shadow-md border border-[#D0D0D0] p-0 text-black shrink-0 relative flex flex-col text-[9px] overflow-hidden" style={{ minHeight: '750px', fontFamily: "'Poppins', 'Roboto', sans-serif" }}>
                  <div className="p-4 flex flex-col h-full">
                    {/* Header Section */}
                    <div className="flex justify-between items-start mb-3 shrink-0">
                      <div className="w-[200px]">
                        <div className="bg-[#0C7DA8] text-white text-[16px] font-bold text-center py-2 mb-2 tracking-wide uppercase">
                          Tax Invoice
                        </div>
                        <div className="text-[#0C7DA8] font-bold text-[14px] leading-tight mb-1">{storeProfile?.customCompanyName || storeProfile?.shopName || 'My Company'}</div>
                        <div className="text-gray-700 leading-tight">
                          <span className="text-[#0C7DA8] text-[8px]">Phone:</span><br/>{storeProfile?.customPhone || storeProfile?.phoneNumber || '9913039185'}
                        </div>
                        <div className="text-gray-700 leading-tight mt-1">
                          <span className="text-[#0C7DA8] text-[8px]">Email:</span><br/>{storeProfile?.email || 'company@email.com'}
                        </div>
                      </div>
                      <div className="w-[60px] h-[60px] bg-gray-200 flex items-center justify-center text-gray-500 text-[9px]">
                        {storeProfile?.customLogoUrl || storeProfile?.logoUrl ? <img src={storeProfile.customLogoUrl || storeProfile.logoUrl} className="w-full h-full object-contain" alt="logo" /> : 'Image'}
                      </div>
                    </div>

                    <div className="border-b border-[#0C7DA8] mb-3 shrink-0"></div>

                    {/* 3 Column Grid */}
                    <div className="grid grid-cols-3 gap-2 mb-3 shrink-0">
                      <div>
                        <div className="text-gray-700 flex justify-between items-center mb-1"><span className="text-[#0C7DA8] text-[10px]">Invoice No.:</span><span className="text-[#0C7DA8] text-[12px] font-bold">INV-Draft</span></div>
                        <div className="text-gray-700 flex justify-between"><span>Invoice Date:</span><span>{todayStr}</span></div>
                        <div className="text-gray-700 flex justify-between"><span>Invoice Time:</span><span>{new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}</span></div>
                        <div className="text-gray-700 flex justify-between"><span>Place of Supply:</span><span>-</span></div>
                        <div className="text-gray-700 flex justify-between"><span>PO date:</span><span>-</span></div>
                      </div>
                      <div>
                        <div className="text-[#0C7DA8] font-bold text-[10px] mb-1">Bill To:</div>
                        <div className="font-bold">{customerName || 'Walk-in Customer'}</div>
                        <div className="text-gray-700 leading-tight">{customerAddress || ''}</div>
                        <div className="text-gray-700 flex justify-between mt-1"><span>Contact No.:</span><span>{customerPhone || '-'}</span></div>
                        <div className="text-gray-700 flex justify-between"><span>GSTIN:</span><span>-</span></div>
                        <div className="text-gray-700 flex justify-between"><span>State:</span><span>-</span></div>
                      </div>
                      <div>
                        <div className="text-[#0C7DA8] font-bold text-[10px] mb-1">Transportation Details:</div>
                        <div className="text-gray-700 flex justify-between"><span>Transport Name:</span><span className="text-right">-</span></div>
                        <div className="text-gray-700 flex justify-between mt-1"><span>Vehicle Number:</span><span>-</span></div>
                        <div className="text-gray-700 flex justify-between"><span>Delivery Date:</span><span>-</span></div>
                      </div>
                    </div>

                    {/* Item Table */}
                    <div className="flex-1 flex flex-col">
                      <table className="w-full text-left border-collapse border border-[#CFCFCF] mb-3">
                        <thead>
                          <tr className="bg-[#0C7DA8] text-white font-bold text-[9px]">
                            <th className="p-1.5 border-r border-[#CFCFCF] w-[20px] text-center">#</th>
                            <th className="p-1.5 border-r border-[#CFCFCF]">Item name</th>
                            <th className="p-1.5 text-center border-r border-[#CFCFCF]">HSN/ SAC</th>
                            <th className="p-1.5 text-center border-r border-[#CFCFCF]">Quantity</th>
                            <th className="p-1.5 text-right border-r border-[#CFCFCF]">Price/ unit</th>
                            <th className="p-1.5 text-right border-r border-[#CFCFCF]">Discount</th>
                            <th className="p-1.5 text-right border-r border-[#CFCFCF]">GST</th>
                            <th className="p-1.5 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.filter(it => it.name).length === 0 ? (
                            <tr>
                              <td colSpan="8" className="p-4 text-center text-gray-400 italic">No items added</td>
                            </tr>
                          ) : (
                            items.filter(it => it.name).map((it, idx) => {
                              const qty = parseFloat(it.qty) || 1;
                              const price = parseFloat(it.price) || 0;
                              const disc = it.discountPercent ? (qty * price * (parseFloat(it.discountPercent) / 100)) : 0;
                              let gstRate = 0;
                              if (it.tax && it.tax !== 'NONE') {
                                const match = it.tax.match(/@([\d.]+)%/);
                                if (match) gstRate = parseFloat(match[1]);
                              }
                              const totalGstAmt = ((qty * price - disc) * (gstRate / 100));
                              const amt = parseFloat(it.total || 0);

                              return (
                                <tr key={idx} className="bg-white border-b border-[#CFCFCF]">
                                  <td className="p-1 border-r border-[#CFCFCF] text-center">{idx + 1}</td>
                                  <td className="p-1 font-bold border-r border-[#CFCFCF]">{it.name}</td>
                                  <td className="p-1 border-r border-[#CFCFCF] text-center">0000</td>
                                  <td className="p-1 text-center border-r border-[#CFCFCF]">{qty}</td>
                                  <td className="p-1 text-right border-r border-[#CFCFCF]">₹{price.toFixed(2)}</td>
                                  <td className="p-1 text-right border-r border-[#CFCFCF]">₹{disc.toFixed(2)}</td>
                                  <td className="p-1 text-right border-r border-[#CFCFCF]">₹{totalGstAmt.toFixed(2)} ({gstRate}%)</td>
                                  <td className="p-1 text-right">₹{amt.toFixed(2)}</td>
                                </tr>
                              );
                            })
                          )}
                          {/* Totals Row */}
                          <tr className="bg-[#0C7DA8] text-white font-bold border-b border-[#CFCFCF]">
                            <td colSpan="3" className="p-1.5 border-r border-[#CFCFCF]">Total</td>
                            <td className="p-1.5 text-center border-r border-[#CFCFCF]">{items.filter(it => it.name).reduce((s, i) => s + (parseFloat(i.qty) || 0), 0)}</td>
                            <td className="p-1.5 border-r border-[#CFCFCF]"></td>
                            <td className="p-1.5 text-right border-r border-[#CFCFCF]">₹0.00</td>
                            <td className="p-1.5 text-right border-r border-[#CFCFCF]">₹{(totalAmount - subTotal).toFixed(2)}</td>
                            <td className="p-1.5 text-right">₹{totalAmount.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Bottom Section */}
                      <div className="flex gap-4 mt-auto">
                        {/* Left Col */}
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="flex gap-2">
                            <div className="w-[45px] h-[45px] bg-gray-200 flex items-center justify-center text-[7px] text-gray-500 rounded">QR</div>
                            <div className="flex flex-col gap-0.5 justify-center">
                              <div className="text-[#0C7DA8] font-bold text-[10px]">Pay To:</div>
                              <div>Bank Name: {storeProfile?.bankName || '123123123'}</div>
                              <div>A/C No.: {storeProfile?.bankAccountNumber || '12312312312'}</div>
                              <div>IFSC: {storeProfile?.bankIfscCode || '123123123'}</div>
                            </div>
                          </div>
                          <div><span className="bg-emerald-500 text-white px-1 font-bold text-[8px] rounded italic">UPI</span><span className="bg-emerald-500 text-white px-1 font-bold text-[8px] rounded ml-0.5">PAY NOW</span></div>
                          
                          <div className="mt-1">
                            <div className="text-[#0C7DA8] font-bold text-[11px]">Invoice Amount In Words</div>
                            <div>Rupees {totalAmount} Only</div>
                          </div>
                          
                          <div className="mt-1">
                            <div className="text-[#0C7DA8] font-bold text-[11px]">Terms And Conditions</div>
                            <div>{storeProfile?.invoiceNotes || 'Thanks for doing business with us!'}</div>
                          </div>

                          <div className="mt-3">
                            <div>For : {storeProfile?.customCompanyName || storeProfile?.shopName || 'My Company'}</div>
                            <div className="w-[60px] h-[30px] bg-gray-200 flex items-center justify-center text-[8px] text-gray-500 my-1">Image</div>
                            <div className="font-bold text-[10px]">Authorized Signatory</div>
                          </div>
                        </div>
                        {/* Right Col Summary Table */}
                        <div className="w-[180px]">
                          <table className="w-full text-left border-collapse border border-[#CFCFCF]">
                            <tbody>
                              <tr className="border-b border-[#CFCFCF]">
                                <td className="p-1 border-r border-[#CFCFCF]">Sub Total</td>
                                <td className="p-1 text-right">₹{subTotal.toFixed(2)}</td>
                              </tr>
                              <tr className="border-b border-[#CFCFCF]">
                                <td className="p-1 border-r border-[#CFCFCF]">Discount</td>
                                <td className="p-1 text-right">₹0.00</td>
                              </tr>
                              {Object.entries(taxSummary).map(([key, val]) => (
                                <tr key={key} className="border-b border-[#CFCFCF]">
                                  <td className="p-1 border-r border-[#CFCFCF]">{key}</td>
                                  <td className="p-1 text-right">₹{val.toFixed(2)}</td>
                                </tr>
                              ))}
                              {Object.keys(taxSummary).length === 0 && (
                                <tr className="border-b border-[#CFCFCF]">
                                  <td className="p-1 border-r border-[#CFCFCF]">GST</td>
                                  <td className="p-1 text-right">₹0.00</td>
                                </tr>
                              )}
                              <tr className="border-b border-[#CFCFCF]">
                                <td className="p-1 border-r border-[#CFCFCF]">Round off</td>
                                <td className="p-1 text-right">₹0.00</td>
                              </tr>
                              <tr className="bg-[#0C7DA8] text-white font-bold border-b border-[#CFCFCF]">
                                <td className="p-1 border-r border-[#CFCFCF]">Total</td>
                                <td className="p-1 text-right">₹{totalAmount.toFixed(2)}</td>
                              </tr>
                              <tr className="border-b border-[#CFCFCF]">
                                <td className="p-1 border-r border-[#CFCFCF]">Received</td>
                                <td className="p-1 text-right">₹{receivedAmt.toFixed(2)}</td>
                              </tr>
                              <tr className="border-b border-[#CFCFCF]">
                                <td className="p-1 border-r border-[#CFCFCF]">Balance</td>
                                <td className="p-1 text-right">₹{balance.toFixed(2)}</td>
                              </tr>
                              <tr className="bg-[#0C7DA8] text-white font-bold border-b border-[#CFCFCF]">
                                <td className="p-1 border-r border-[#CFCFCF]">You Saved</td>
                                <td className="p-1 text-right">₹0.00</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // --- MODERN THEME PREVIEW ---
            if (activeTheme === 'Modern Theme' || activeTheme === 'modern') {
              // Calculate dynamic tax summary for Modern Theme
              const taxSummary = {};
              items.filter(it => it.name).forEach(it => {
                const qty = parseFloat(it.qty) || 1;
                const price = parseFloat(it.price) || 0;
                const disc = it.discountPercent ? (qty * price * (parseFloat(it.discountPercent) / 100)) : 0;
                let gstRate = 0;
                if (it.tax && it.tax !== 'NONE') {
                  const match = it.tax.match(/@([\d.]+)%/);
                  if (match) gstRate = parseFloat(match[1]);
                }
                const taxable = (qty * price) - disc;
                const totalGstAmt = taxable * (gstRate / 100);
                if (gstRate > 0) {
                  // Standard splitting (IGST vs CGST/SGST depends on state, but we'll show IGST as per reference for simplicity if not specified, or just GST)
                  // For the preview, we'll just group by GST rate.
                  const key = `GST@${gstRate}%`;
                  taxSummary[key] = (taxSummary[key] || 0) + totalGstAmt;
                }
              });

              return (
                <div id="invoice-printable-area" className="bg-white w-full max-w-[500px] shadow-md border border-[#D0D0D0] p-0 text-black shrink-0 relative flex flex-col text-[9px] overflow-hidden" style={{ minHeight: '750px', fontFamily: "'Poppins', 'Roboto', sans-serif" }}>
                  {/* Header Section */}
                  <div className="relative h-[80px] w-full mb-3 shrink-0">
                    {/* Red Banner */}
                    <div className="absolute top-0 right-0 h-[40px] bg-[#E61C35] flex items-center z-10" style={{ left: '160px' }}>
                      <div className="text-white text-[10px] ml-4 flex items-center gap-1">
                        <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>
                        {storeProfile?.customPhone || storeProfile?.phoneNumber || '9913039185'}
                      </div>
                    </div>
                    {/* Dark Charcoal Curve */}
                    <div className="absolute top-0 left-0 bg-[#232A34] w-[260px] h-[80px] z-20 flex flex-col justify-center" style={{ borderBottomRightRadius: '50px' }}>
                      <div className="px-3 flex items-center gap-3">
                        <div className="w-[45px] h-[45px] bg-gray-500 flex items-center justify-center text-gray-300 text-[8px]">
                          {storeProfile?.customLogoUrl || storeProfile?.logoUrl ? <img src={storeProfile.customLogoUrl || storeProfile.logoUrl} className="w-full h-full object-contain" alt="logo" /> : 'Image'}
                        </div>
                        <div className="text-white font-bold text-[14px] leading-tight flex-1">{storeProfile?.customCompanyName || storeProfile?.shopName || 'My Company'}</div>
                      </div>
                    </div>
                    {/* Tax Invoice Text */}
                    <div className="absolute top-[40px] right-4 z-0">
                      <div className="text-[20px] font-light text-black">Tax Invoice</div>
                    </div>
                  </div>

                  <div className="px-3 pb-3 flex flex-col flex-1">
                    {/* 3 Column Grid */}
                    <div className="grid grid-cols-3 gap-2 mb-3 shrink-0">
                      <div>
                        <div className="text-[#E61C35] font-bold text-[10px] mb-1">Bill To:</div>
                        <div className="font-bold">{customerName || 'Walk-in Customer'}</div>
                        <div className="text-gray-700 leading-tight">{customerAddress || ''}</div>
                        <div className="text-gray-700 flex justify-between mt-1"><span>Contact No.:</span><span>{customerPhone || '-'}</span></div>
                        <div className="text-gray-700 flex justify-between"><span>GSTIN:</span><span>-</span></div>
                        <div className="text-gray-700 flex justify-between"><span>State:</span><span>-</span></div>
                      </div>
                      <div>
                        <div className="text-[#E61C35] font-bold text-[10px] mb-1">Transportation Details:</div>
                        <div className="text-gray-700 flex justify-between"><span>Transport Name:</span><span className="text-right">-</span></div>
                        <div className="text-gray-700 flex justify-between mt-1"><span>Vehicle Number:</span><span>-</span></div>
                        <div className="text-gray-700 flex justify-between"><span>Delivery Date:</span><span>-</span></div>
                      </div>
                      <div>
                        <div className="text-gray-700 flex justify-between mt-4"><span>Invoice No.:</span><span>INV-Draft</span></div>
                        <div className="text-gray-700 flex justify-between"><span>Invoice Date:</span><span>{todayStr}</span></div>
                        <div className="text-gray-700 flex justify-between"><span>Invoice Time:</span><span>{new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}</span></div>
                        <div className="text-gray-700 flex justify-between"><span>Place of Supply:</span><span>-</span></div>
                        <div className="text-gray-700 flex justify-between"><span>PO date:</span><span>-</span></div>
                      </div>
                    </div>

                    {/* Item Table */}
                    <div className="flex-1 flex flex-col">
                      <table className="w-full text-left border-collapse border border-[#D0D0D0] mb-3">
                        <thead>
                          <tr className="bg-[#E61C35] text-white font-bold text-[9px]">
                            <th className="p-1.5 border-r border-[#D0D0D0] w-[20px] text-center">#</th>
                            <th className="p-1.5 border-r border-[#D0D0D0]">Item name</th>
                            <th className="p-1.5 text-center border-r border-[#D0D0D0]">HSN/ SAC</th>
                            <th className="p-1.5 text-center border-r border-[#D0D0D0]">Quantity</th>
                            <th className="p-1.5 text-right border-r border-[#D0D0D0]">Price/ unit</th>
                            <th className="p-1.5 text-right border-r border-[#D0D0D0]">Discount</th>
                            <th className="p-1.5 text-right border-r border-[#D0D0D0]">GST</th>
                            <th className="p-1.5 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.filter(it => it.name).length === 0 ? (
                            <tr>
                              <td colSpan="8" className="p-4 text-center text-gray-400 italic">No items added</td>
                            </tr>
                          ) : (
                            items.filter(it => it.name).map((it, idx) => {
                              const qty = parseFloat(it.qty) || 1;
                              const price = parseFloat(it.price) || 0;
                              const disc = it.discountPercent ? (qty * price * (parseFloat(it.discountPercent) / 100)) : 0;
                              let gstRate = 0;
                              if (it.tax && it.tax !== 'NONE') {
                                const match = it.tax.match(/@([\d.]+)%/);
                                if (match) gstRate = parseFloat(match[1]);
                              }
                              const totalGstAmt = ((qty * price - disc) * (gstRate / 100));
                              const amt = parseFloat(it.total || 0);

                              return (
                                <tr key={idx} className="bg-white border-b border-[#D0D0D0]">
                                  <td className="p-1 border-r border-[#D0D0D0] text-center">{idx + 1}</td>
                                  <td className="p-1 font-bold border-r border-[#D0D0D0]">{it.name}</td>
                                  <td className="p-1 border-r border-[#D0D0D0] text-center">0000</td>
                                  <td className="p-1 text-center border-r border-[#D0D0D0]">{qty}</td>
                                  <td className="p-1 text-right border-r border-[#D0D0D0]">₹{price.toFixed(2)}</td>
                                  <td className="p-1 text-right border-r border-[#D0D0D0]">₹{disc.toFixed(2)}</td>
                                  <td className="p-1 text-right border-r border-[#D0D0D0]">₹{totalGstAmt.toFixed(2)} ({gstRate}%)</td>
                                  <td className="p-1 text-right">₹{amt.toFixed(2)}</td>
                                </tr>
                              );
                            })
                          )}
                          {/* Totals Row */}
                          <tr className="bg-[#E61C35] text-white font-bold border-b border-[#D0D0D0]">
                            <td colSpan="3" className="p-1.5 border-r border-[#D0D0D0]">Total</td>
                            <td className="p-1.5 text-center border-r border-[#D0D0D0]">{items.filter(it => it.name).reduce((s, i) => s + (parseFloat(i.qty) || 0), 0)}</td>
                            <td className="p-1.5 border-r border-[#D0D0D0]"></td>
                            <td className="p-1.5 text-right border-r border-[#D0D0D0]">₹0.00</td>
                            <td className="p-1.5 text-right border-r border-[#D0D0D0]">₹{(totalAmount - subTotal).toFixed(2)}</td>
                            <td className="p-1.5 text-right">₹{totalAmount.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Bottom Section */}
                      <div className="flex gap-4 mt-auto">
                        {/* Left Col */}
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="flex gap-2">
                            <div className="w-[45px] h-[45px] bg-gray-200 flex items-center justify-center text-[7px] text-gray-500 rounded">QR</div>
                            <div className="flex flex-col gap-0.5 justify-center">
                              <div className="text-[#E61C35] font-bold text-[10px]">Pay To:</div>
                              <div>Bank Name: {storeProfile?.bankName || '123123123'}</div>
                              <div>A/C No.: {storeProfile?.bankAccountNumber || '12312312312'}</div>
                              <div>IFSC: {storeProfile?.bankIfscCode || '123123123'}</div>
                            </div>
                          </div>
                          <div><span className="bg-emerald-500 text-white px-1 font-bold text-[8px] rounded italic">UPI</span><span className="bg-emerald-500 text-white px-1 font-bold text-[8px] rounded ml-0.5">PAY NOW</span></div>
                          
                          <div className="mt-1">
                            <div className="text-[#E61C35] font-bold text-[11px]">Invoice Amount In Words</div>
                            <div>Rupees {totalAmount} Only</div>
                          </div>
                          
                          <div className="mt-1">
                            <div className="text-[#E61C35] font-bold text-[11px]">Terms And Conditions</div>
                            <div>{storeProfile?.invoiceNotes || 'Thanks for doing business with us!'}</div>
                          </div>

                          <div className="mt-3">
                            <div>For : {storeProfile?.customCompanyName || storeProfile?.shopName || 'My Company'}</div>
                            <div className="w-[60px] h-[30px] bg-gray-200 flex items-center justify-center text-[8px] text-gray-500 my-1">Image</div>
                            <div className="font-bold text-[10px]">Authorized Signatory</div>
                          </div>
                        </div>
                        {/* Right Col Summary Table */}
                        <div className="w-[180px]">
                          <table className="w-full text-left border-collapse border border-[#D0D0D0]">
                            <tbody>
                              <tr className="border-b border-[#D0D0D0]">
                                <td className="p-1 border-r border-[#D0D0D0]">Sub Total</td>
                                <td className="p-1 text-right">₹{subTotal.toFixed(2)}</td>
                              </tr>
                              <tr className="border-b border-[#D0D0D0]">
                                <td className="p-1 border-r border-[#D0D0D0]">Discount</td>
                                <td className="p-1 text-right">₹0.00</td>
                              </tr>
                              {Object.entries(taxSummary).map(([key, val]) => (
                                <tr key={key} className="border-b border-[#D0D0D0]">
                                  <td className="p-1 border-r border-[#D0D0D0]">{key}</td>
                                  <td className="p-1 text-right">₹{val.toFixed(2)}</td>
                                </tr>
                              ))}
                              {Object.keys(taxSummary).length === 0 && (
                                <tr className="border-b border-[#D0D0D0]">
                                  <td className="p-1 border-r border-[#D0D0D0]">GST</td>
                                  <td className="p-1 text-right">₹0.00</td>
                                </tr>
                              )}
                              <tr className="border-b border-[#D0D0D0]">
                                <td className="p-1 border-r border-[#D0D0D0]">Round off</td>
                                <td className="p-1 text-right">₹0.00</td>
                              </tr>
                              <tr className="bg-[#E61C35] text-white font-bold border-b border-[#D0D0D0]">
                                <td className="p-1 border-r border-[#D0D0D0]">Total</td>
                                <td className="p-1 text-right">₹{totalAmount.toFixed(2)}</td>
                              </tr>
                              <tr className="border-b border-[#D0D0D0]">
                                <td className="p-1 border-r border-[#D0D0D0]">Received</td>
                                <td className="p-1 text-right">₹{receivedAmt.toFixed(2)}</td>
                              </tr>
                              <tr className="border-b border-[#D0D0D0]">
                                <td className="p-1 border-r border-[#D0D0D0]">Balance</td>
                                <td className="p-1 text-right">₹{balance.toFixed(2)}</td>
                              </tr>
                              <tr className="bg-[#E61C35] text-white font-bold border-b border-[#D0D0D0]">
                                <td className="p-1 border-r border-[#D0D0D0]">You Saved</td>
                                <td className="p-1 text-right">₹0.00</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              );
            }

            // --- GST THEME 3 PREVIEW ---
            if (activeTheme === 'GST Theme 3' || activeTheme === 'gst3') {
              return (
                <div id="invoice-printable-area" className="bg-white w-full max-w-[500px] shadow-md border border-[#BDBDBD] p-0 text-black shrink-0 relative flex flex-col text-[9px]" style={{ minHeight: '750px', fontFamily: "'Poppins', 'Roboto', sans-serif" }}>
                  <div className="text-center font-bold text-[12px] text-black py-2 bg-white">
                    Sale
                  </div>
                  <div className="border-t border-[#BDBDBD] flex flex-col flex-1">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start p-3 border-b border-[#BDBDBD]">
                      <div className="w-[60px] h-[60px] bg-gray-200 text-gray-400 flex items-center justify-center text-[10px]">
                        {storeProfile?.customLogoUrl || storeProfile?.logoUrl ? <img src={storeProfile.customLogoUrl || storeProfile.logoUrl} className="w-full h-full object-contain" alt="logo" /> : 'Image'}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-[16px] text-gray-900">{storeProfile?.customCompanyName || storeProfile?.shopName || 'My Company'}</div>
                        <div className="text-gray-700 mt-1 text-[10px]">Ph. no.: {storeProfile?.customPhone || storeProfile?.phoneNumber || '9913039185'}</div>
                      </div>
                    </div>

                    {/* 3 Column Info Header */}
                    <div className="grid grid-cols-3 bg-[#0C7DA8] text-white font-bold border-b border-[#BDBDBD] text-[10px]">
                      <div className="p-1.5 border-r border-[#BDBDBD]">Bill To:</div>
                      <div className="p-1.5 border-r border-[#BDBDBD]">Shipping To</div>
                      <div className="p-1.5 text-right">Invoice Details</div>
                    </div>
                    <div className="grid grid-cols-3 border-b border-[#BDBDBD]">
                      <div className="p-2 border-r border-[#BDBDBD]">
                        <div className="font-bold text-gray-900 mb-0.5">{customerName || 'Walk-in Customer'}</div>
                        <div className="text-gray-600 leading-tight">{customerAddress || ''}</div>
                        <div className="text-gray-600 mt-1">Contact No.: {customerPhone || '-'}</div>
                      </div>
                      <div className="p-2 border-r border-[#BDBDBD]">
                        <div className="text-gray-600 leading-tight">{customerAddress || ''}</div>
                      </div>
                      <div className="p-2 text-right">
                        <div className="text-gray-700 mb-0.5">Invoice No.: INV-Draft</div>
                        <div className="text-gray-700 mb-0.5">Date: {todayStr}</div>
                        <div className="text-gray-700 mb-0.5">Time: {new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}</div>
                        <div className="text-gray-700">Due Date: {todayStr}</div>
                      </div>
                    </div>

                    {/* Item Table */}
                    <div className="flex-1 flex flex-col">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#0C7DA8] text-white font-bold">
                            <th className="p-1.5 text-center border-r border-[#BDBDBD] w-[20px]">#</th>
                            <th className="p-1.5 border-r border-[#BDBDBD]">Item name</th>
                            <th className="p-1.5 text-center border-r border-[#BDBDBD]">HSC/SAC</th>
                            <th className="p-1.5 text-center border-r border-[#BDBDBD]">Qty</th>
                            <th className="p-1.5 text-right border-r border-[#BDBDBD]">Price/unit</th>
                            <th className="p-1.5 text-right border-r border-[#BDBDBD]">Discount</th>
                            <th className="p-1.5 text-right border-r border-[#BDBDBD]">GST</th>
                            <th className="p-1.5 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.filter(it => it.name).length === 0 ? (
                            <tr>
                              <td colSpan="8" className="p-4 text-center text-gray-400 italic">No items added</td>
                            </tr>
                          ) : (
                            items.filter(it => it.name).map((it, idx) => {
                              const qty = parseFloat(it.qty) || 1;
                              const price = parseFloat(it.price) || 0;
                              const disc = it.discountPercent ? (qty * price * (parseFloat(it.discountPercent) / 100)) : 0;
                              let gstRate = 0;
                              if (it.tax && it.tax !== 'NONE') {
                                const match = it.tax.match(/@([\d.]+)%/);
                                if (match) gstRate = parseFloat(match[1]);
                              }
                              const totalGstAmt = ((qty * price - disc) * (gstRate / 100));
                              const amt = parseFloat(it.total || 0);

                              return (
                                <tr key={idx} className="bg-white border-b border-[#BDBDBD]">
                                  <td className="p-1 text-center border-r border-[#BDBDBD]">{idx + 1}</td>
                                  <td className="p-1 font-bold border-r border-[#BDBDBD]">{it.name}</td>
                                  <td className="p-1 text-center border-r border-[#BDBDBD]">0000</td>
                                  <td className="p-1 text-center border-r border-[#BDBDBD]">{qty}</td>
                                  <td className="p-1 text-right border-r border-[#BDBDBD]">₹{price.toFixed(2)}</td>
                                  <td className="p-1 text-right border-r border-[#BDBDBD]">₹{disc.toFixed(2)}</td>
                                  <td className="p-1 text-right border-r border-[#BDBDBD]">₹{totalGstAmt.toFixed(2)} ({gstRate}%)</td>
                                  <td className="p-1 text-right font-bold">₹{amt.toFixed(2)}</td>
                                </tr>
                              );
                            })
                          )}
                          {/* Totals Row */}
                          <tr className="font-bold border-b border-[#BDBDBD] bg-white">
                            <td colSpan="3" className="p-1 border-r border-[#BDBDBD]">Total</td>
                            <td className="p-1 text-center border-r border-[#BDBDBD]">{items.filter(it => it.name).reduce((s, i) => s + (parseFloat(i.qty) || 0), 0)}</td>
                            <td className="p-1 border-r border-[#BDBDBD]"></td>
                            <td className="p-1 text-right border-r border-[#BDBDBD]">₹0.00</td>
                            <td className="p-1 text-right border-r border-[#BDBDBD]">₹0.00</td>
                            <td className="p-1 text-right">₹{totalAmount.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Sub-Tables (Tax & Amounts) */}
                      <div className="flex border-b border-[#BDBDBD]">
                        {/* Left Tax Table */}
                        <div className="w-[50%] border-r border-[#BDBDBD] flex flex-col">
                          <div className="grid grid-cols-4 bg-[#0C7DA8] text-white font-bold p-1">
                            <div>Tax type</div>
                            <div className="text-right">Taxable amount</div>
                            <div className="text-right">Rate</div>
                            <div className="text-right">Tax amount</div>
                          </div>
                          <div className="p-2 text-center text-gray-500 italic mt-4">
                            Dynamically calculated tax breakdown will appear here.
                          </div>
                        </div>
                        {/* Right Amounts Table */}
                        <div className="w-[50%] flex flex-col">
                          <div className="bg-[#0C7DA8] text-white font-bold p-1">Amounts</div>
                          <div className="flex justify-between p-1.5 border-b border-gray-100"><span>Sub Total</span><span>₹{subTotal.toFixed(2)}</span></div>
                          <div className="flex justify-between p-1.5 border-b border-gray-100"><span>Discount</span><span>₹0.00</span></div>
                          <div className="flex justify-between p-1.5 border-b border-gray-100"><span>Tax</span><span>₹{(totalAmount - subTotal).toFixed(2)}</span></div>
                          <div className="flex justify-between p-1.5 border-b border-[#BDBDBD] font-bold"><span>Total</span><span>₹{totalAmount.toFixed(2)}</span></div>
                          <div className="flex justify-between p-1.5 border-b border-gray-100"><span>Received</span><span>₹{receivedAmt.toFixed(2)}</span></div>
                          <div className="flex justify-between p-1.5 border-b border-[#BDBDBD] font-bold"><span>Balance</span><span>₹{balance.toFixed(2)}</span></div>
                          <div className="flex justify-between p-1.5 font-bold"><span>You Saved</span><span>₹0.00</span></div>
                        </div>
                      </div>

                      {/* Invoice Amount In Words & Description */}
                      <div className="grid grid-cols-2 border-b border-[#BDBDBD]">
                        <div className="border-r border-[#BDBDBD]">
                          <div className="bg-[#0C7DA8] text-white font-bold p-1 text-center border-b border-[#BDBDBD]">Invoice Amount In Words</div>
                          <div className="p-3 text-center text-gray-700 h-full">Rupees {totalAmount} Only</div>
                        </div>
                        <div>
                          <div className="bg-[#0C7DA8] text-white font-bold p-1 text-center border-b border-[#BDBDBD]">Description</div>
                          <div className="p-3 text-center text-gray-700 h-full">Sale Description</div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex mt-auto text-[8px]">
                        <div className="w-[33.33%] border-r border-[#BDBDBD] flex flex-col">
                          <div className="bg-[#0C7DA8] text-white font-bold p-1">Bank Details</div>
                          <div className="p-2 flex gap-2">
                            <div className="w-[40px] h-[40px] bg-gray-200 flex items-center justify-center text-[7px] text-gray-500 rounded">QR</div>
                            <div className="flex flex-col gap-0.5 justify-center">
                              <div>Bank Name: {storeProfile?.bankName || '123123123'}</div>
                              <div>A/C No.: {storeProfile?.bankAccountNumber || '12312312312'}</div>
                              <div>IFSC: {storeProfile?.bankIfscCode || '123123123'}</div>
                            </div>
                          </div>
                          <div className="px-2 pb-2 text-[6px] font-bold text-emerald-600"><span className="border border-emerald-600 px-1 py-0.5 rounded">UPI PAY NOW</span></div>
                        </div>
                        <div className="w-[33.33%] border-r border-[#BDBDBD] flex flex-col">
                          <div className="bg-[#0C7DA8] text-white font-bold p-1">Terms and conditions</div>
                          <div className="p-2 text-gray-700">{storeProfile?.invoiceNotes || 'Thanks for doing business with us!'}</div>
                        </div>
                        <div className="w-[33.33%] flex flex-col items-center justify-center p-2">
                          <div>For : {storeProfile?.customCompanyName || storeProfile?.shopName || 'My Company'}</div>
                          <div className="w-[60px] h-[30px] bg-gray-200 flex items-center justify-center text-[8px] text-gray-500 my-1">Image</div>
                          <div className="font-bold">Authorized Signatory</div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              );
            }

            // --- GST THEME 2 PREVIEW ---
            if (activeTheme === 'GST Theme 2' || activeTheme === 'gst2') {
              return (
                <div id="invoice-printable-area" className="bg-white w-full max-w-[500px] shadow-md border border-[#BDBDBD] p-0 text-black shrink-0 relative flex flex-col text-[9px]" style={{ minHeight: '750px', fontFamily: "'Poppins', 'Roboto', sans-serif" }}>
                  <div className="text-center font-bold text-[12px] text-black py-2 bg-white">
                    Sale
                  </div>
                  <div className="border-t border-[#BDBDBD] flex flex-col flex-1">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start p-3 border-b border-[#BDBDBD]">
                      <div className="w-[60px] h-[60px] bg-gray-200 text-gray-400 flex items-center justify-center text-[10px]">
                        {storeProfile?.customLogoUrl || storeProfile?.logoUrl ? <img src={storeProfile.customLogoUrl || storeProfile.logoUrl} className="w-full h-full object-contain" alt="logo" /> : 'Image'}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-[16px] text-gray-900">{storeProfile?.customCompanyName || storeProfile?.shopName || 'My Company'}</div>
                        <div className="text-gray-700 mt-1 text-[10px]">Ph. no.: {storeProfile?.customPhone || storeProfile?.phoneNumber || '9913039185'}</div>
                      </div>
                    </div>

                    {/* 3 Column Info Header */}
                    <div className="grid grid-cols-3 bg-[#8D84E8] text-white font-bold border-b border-[#BDBDBD] text-[10px]">
                      <div className="p-1.5 border-r border-[#BDBDBD]">Bill To:</div>
                      <div className="p-1.5 border-r border-[#BDBDBD]">Shipping To</div>
                      <div className="p-1.5 text-right">Invoice Details</div>
                    </div>
                    <div className="grid grid-cols-3 border-b border-[#BDBDBD]">
                      <div className="p-2 border-r border-[#BDBDBD]">
                        <div className="font-bold text-gray-900 mb-0.5">{customerName || 'Walk-in Customer'}</div>
                        <div className="text-gray-600 leading-tight">{customerAddress || ''}</div>
                        <div className="text-gray-600 mt-1">Contact No.: {customerPhone || '-'}</div>
                      </div>
                      <div className="p-2 border-r border-[#BDBDBD]">
                        <div className="text-gray-600 leading-tight">{customerAddress || ''}</div>
                      </div>
                      <div className="p-2 text-right">
                        <div className="text-gray-700 mb-0.5">Invoice No.: INV-Draft</div>
                        <div className="text-gray-700 mb-0.5">Date: {todayStr}</div>
                        <div className="text-gray-700 mb-0.5">Time: {new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}</div>
                        <div className="text-gray-700">Due Date: {todayStr}</div>
                      </div>
                    </div>

                    {/* Item Table */}
                    <div className="flex-1 flex flex-col">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#8D84E8] text-white font-bold">
                            <th className="p-1.5 text-center border-r border-[#BDBDBD] w-[20px]">#</th>
                            <th className="p-1.5 border-r border-[#BDBDBD]">Item name</th>
                            <th className="p-1.5 text-center border-r border-[#BDBDBD]">HSC/SAC</th>
                            <th className="p-1.5 text-center border-r border-[#BDBDBD]">Qty</th>
                            <th className="p-1.5 text-right border-r border-[#BDBDBD]">Price/unit</th>
                            <th className="p-1.5 text-right border-r border-[#BDBDBD]">Discount</th>
                            <th className="p-1.5 text-right border-r border-[#BDBDBD]">CGST</th>
                            <th className="p-1.5 text-right border-r border-[#BDBDBD]">SGST</th>
                            <th className="p-1.5 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.filter(it => it.name).length === 0 ? (
                            <tr>
                              <td colSpan="9" className="p-4 text-center text-gray-400 italic">No items added</td>
                            </tr>
                          ) : (
                            items.filter(it => it.name).map((it, idx) => {
                              const qty = parseFloat(it.qty) || 1;
                              const price = parseFloat(it.price) || 0;
                              const disc = it.discountPercent ? (qty * price * (parseFloat(it.discountPercent) / 100)) : 0;
                              let gstRate = 0;
                              if (it.tax && it.tax !== 'NONE') {
                                const match = it.tax.match(/@([\d.]+)%/);
                                if (match) gstRate = parseFloat(match[1]);
                              }
                              const halfGstAmt = ((qty * price - disc) * (gstRate / 100)) / 2;
                              const amt = parseFloat(it.total || 0);

                              return (
                                <tr key={idx} className="bg-white border-b border-[#BDBDBD]">
                                  <td className="p-1 text-center border-r border-[#BDBDBD]">{idx + 1}</td>
                                  <td className="p-1 font-bold border-r border-[#BDBDBD]">{it.name}</td>
                                  <td className="p-1 text-center border-r border-[#BDBDBD]">0000</td>
                                  <td className="p-1 text-center border-r border-[#BDBDBD]">{qty}</td>
                                  <td className="p-1 text-right border-r border-[#BDBDBD]">₹{price.toFixed(2)}</td>
                                  <td className="p-1 text-right border-r border-[#BDBDBD]">₹{disc.toFixed(2)}</td>
                                  <td className="p-1 text-right border-r border-[#BDBDBD]">₹{halfGstAmt.toFixed(2)}</td>
                                  <td className="p-1 text-right border-r border-[#BDBDBD]">₹{halfGstAmt.toFixed(2)}</td>
                                  <td className="p-1 text-right font-bold">₹{amt.toFixed(2)}</td>
                                </tr>
                              );
                            })
                          )}
                          {/* Totals Row */}
                          <tr className="font-bold border-b border-[#BDBDBD] bg-white">
                            <td colSpan="3" className="p-1 border-r border-[#BDBDBD]">Total</td>
                            <td className="p-1 text-center border-r border-[#BDBDBD]">{items.filter(it => it.name).reduce((s, i) => s + (parseFloat(i.qty) || 0), 0)}</td>
                            <td className="p-1 border-r border-[#BDBDBD]"></td>
                            <td className="p-1 text-right border-r border-[#BDBDBD]">₹0.00</td>
                            <td className="p-1 text-right border-r border-[#BDBDBD]">₹0.00</td>
                            <td className="p-1 text-right border-r border-[#BDBDBD]">₹0.00</td>
                            <td className="p-1 text-right">₹{totalAmount.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Sub-Tables (Tax & Amounts) */}
                      <div className="flex border-b border-[#BDBDBD]">
                        {/* Left Tax Table */}
                        <div className="w-[50%] border-r border-[#BDBDBD] flex flex-col">
                          <div className="grid grid-cols-4 bg-[#8D84E8] text-white font-bold p-1">
                            <div>Tax type</div>
                            <div className="text-right">Taxable amount</div>
                            <div className="text-right">Rate</div>
                            <div className="text-right">Tax amount</div>
                          </div>
                          <div className="p-2 text-center text-gray-500 italic mt-4">
                            Dynamically calculated tax breakdown will appear here.
                          </div>
                        </div>
                        {/* Right Amounts Table */}
                        <div className="w-[50%] flex flex-col">
                          <div className="bg-[#8D84E8] text-white font-bold p-1">Amounts</div>
                          <div className="flex justify-between p-1.5 border-b border-gray-100"><span>Sub Total</span><span>₹{subTotal.toFixed(2)}</span></div>
                          <div className="flex justify-between p-1.5 border-b border-gray-100"><span>Discount</span><span>₹0.00</span></div>
                          <div className="flex justify-between p-1.5 border-b border-gray-100"><span>Tax</span><span>₹{(totalAmount - subTotal).toFixed(2)}</span></div>
                          <div className="flex justify-between p-1.5 border-b border-[#BDBDBD] font-bold"><span>Total</span><span>₹{totalAmount.toFixed(2)}</span></div>
                          <div className="flex justify-between p-1.5 border-b border-gray-100"><span>Received</span><span>₹{receivedAmt.toFixed(2)}</span></div>
                          <div className="flex justify-between p-1.5 border-b border-[#BDBDBD] font-bold"><span>Balance</span><span>₹{balance.toFixed(2)}</span></div>
                          <div className="flex justify-between p-1.5 font-bold"><span>You Saved</span><span>₹0.00</span></div>
                        </div>
                      </div>

                      {/* Invoice Amount In Words & Description */}
                      <div className="grid grid-cols-2 border-b border-[#BDBDBD]">
                        <div className="border-r border-[#BDBDBD]">
                          <div className="bg-[#8D84E8] text-white font-bold p-1 text-center border-b border-[#BDBDBD]">Invoice Amount In Words</div>
                          <div className="p-3 text-center text-gray-700 h-full">Rupees {totalAmount} Only</div>
                        </div>
                        <div>
                          <div className="bg-[#8D84E8] text-white font-bold p-1 text-center border-b border-[#BDBDBD]">Description</div>
                          <div className="p-3 text-center text-gray-700 h-full">Sale Description</div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex mt-auto text-[8px]">
                        <div className="w-[33.33%] border-r border-[#BDBDBD] flex flex-col">
                          <div className="bg-[#8D84E8] text-white font-bold p-1">Bank Details</div>
                          <div className="p-2 flex gap-2">
                            <div className="w-[40px] h-[40px] bg-gray-200 flex items-center justify-center text-[7px] text-gray-500 rounded">QR</div>
                            <div className="flex flex-col gap-0.5 justify-center">
                              <div>Bank Name: {storeProfile?.bankName || '123123123'}</div>
                              <div>A/C No.: {storeProfile?.bankAccountNumber || '12312312312'}</div>
                              <div>IFSC: {storeProfile?.bankIfscCode || '123123123'}</div>
                            </div>
                          </div>
                          <div className="px-2 pb-2 text-[6px] font-bold text-emerald-600"><span className="border border-emerald-600 px-1 py-0.5 rounded">UPI PAY NOW</span></div>
                        </div>
                        <div className="w-[33.33%] border-r border-[#BDBDBD] flex flex-col">
                          <div className="bg-[#8D84E8] text-white font-bold p-1">Terms and conditions</div>
                          <div className="p-2 text-gray-700">{storeProfile?.invoiceNotes || 'Thanks for doing business with us!'}</div>
                        </div>
                        <div className="w-[33.33%] flex flex-col items-center justify-center p-2">
                          <div>For : {storeProfile?.customCompanyName || storeProfile?.shopName || 'My Company'}</div>
                          <div className="w-[60px] h-[30px] bg-gray-200 flex items-center justify-center text-[8px] text-gray-500 my-1">Image</div>
                          <div className="font-bold">Authorized Signatory</div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              );
            }

            // --- GST THEME 1 PREVIEW (DEFAULT & EXPLICIT) ---
            return (
              <div id="invoice-printable-area" className="bg-white w-full max-w-[500px] shadow-md border border-gray-200 p-[24px] text-black shrink-0 relative flex flex-col text-[11px]" style={{ minHeight: '750px', fontFamily: "'Poppins', 'Roboto', sans-serif" }}>
                
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-[16px] font-bold text-gray-900">{storeProfile?.customCompanyName || storeProfile?.shopName || 'My Company'}</div>
                    <div className="text-[11px] text-gray-700 mt-0.5">Ph. no.: {storeProfile?.customPhone || storeProfile?.phoneNumber || '9913039185'}</div>
                  </div>
                  <div>
                    {storeProfile?.customLogoUrl || storeProfile?.logoUrl ? (
                      <img src={storeProfile.customLogoUrl || storeProfile.logoUrl} className="w-[60px] h-[60px] object-contain" alt="logo" />
                    ) : (
                      <div className="w-[60px] h-[60px] bg-gray-200 text-gray-400 flex items-center justify-center text-[10px] rounded">Image</div>
                    )}
                  </div>
                </div>

                {/* Thin Purple Divider */}
                <div className="h-[1px] bg-[#8D84E8] my-2" />

                {/* Title */}
                <div className="text-center text-[22px] font-bold text-[#8D84E8] mb-3">
                  Sale
                </div>

                {/* 3 Column Info Section */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-[10px]">
                  <div>
                    <div className="font-bold text-[11px] mb-1">Bill To:</div>
                    <div className="font-bold text-gray-900">{customerName || 'Walk-in Customer'}</div>
                    <div className="text-gray-600 leading-tight">{customerAddress || 'Customer Address'}</div>
                    <div className="text-gray-600 mt-1">Contact No.: {customerPhone || '-'}</div>
                  </div>
                  <div>
                    <div className="font-bold text-[11px] mb-1">Shipping To</div>
                    <div className="text-gray-600 leading-tight">{customerAddress || 'Shipping Address'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[11px] mb-1">Invoice Details</div>
                    <div className="text-gray-700">Invoice No.: <span className="font-medium">INV-Draft</span></div>
                    <div className="text-gray-700">Date: {todayStr}</div>
                    <div className="text-gray-700">Time: {new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}</div>
                  </div>
                </div>

                {/* Item Table */}
                <div className="border border-gray-200 rounded overflow-hidden mb-4">
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-[#8D84E8] text-white font-bold">
                        <th className="p-1.5 text-center w-[20px]">#</th>
                        <th className="p-1.5">Item name</th>
                        <th className="p-1.5 text-center">HSC/SAC</th>
                        <th className="p-1.5 text-center">Qty</th>
                        <th className="p-1.5 text-right">Price/unit</th>
                        <th className="p-1.5 text-right">Discount</th>
                        <th className="p-1.5 text-right">GST</th>
                        <th className="p-1.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.filter(it => it.name).length === 0 ? (
                        <tr>
                          <td colSpan="8" className="p-4 text-center text-gray-400 italic">No items added</td>
                        </tr>
                      ) : (
                        items.filter(it => it.name).map((it, idx) => {
                          const qty = parseFloat(it.qty) || 1;
                          const price = parseFloat(it.price) || 0;
                          const disc = it.discountPercent ? (qty * price * (parseFloat(it.discountPercent) / 100)) : 0;
                          let gstRate = 0;
                          if (it.tax && it.tax !== 'NONE') {
                            const match = it.tax.match(/@([\d.]+)%/);
                            if (match) gstRate = parseFloat(match[1]);
                          }
                          const gstAmt = (qty * price - disc) * (gstRate / 100);
                          const amt = parseFloat(it.total || 0);

                          return (
                            <tr key={idx} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                              <td className="p-1.5 text-center border-b border-gray-100">{idx + 1}</td>
                              <td className="p-1.5 font-bold uppercase border-b border-gray-100">{it.name}</td>
                              <td className="p-1.5 text-center border-b border-gray-100">0000</td>
                              <td className="p-1.5 text-center border-b border-gray-100">{qty}</td>
                              <td className="p-1.5 text-right border-b border-gray-100">₹{price.toFixed(2)}</td>
                              <td className="p-1.5 text-right border-b border-gray-100">₹{disc.toFixed(2)}</td>
                              <td className="p-1.5 text-right border-b border-gray-100">₹{gstAmt.toFixed(2)}</td>
                              <td className="p-1.5 text-right font-bold border-b border-gray-100">₹{amt.toFixed(2)}</td>
                            </tr>
                          );
                        })
                      )}
                      {/* Totals Row */}
                      <tr className="font-bold border-t border-b border-gray-300 bg-white">
                        <td className="p-1.5"></td>
                        <td className="p-1.5">Total</td>
                        <td className="p-1.5"></td>
                        <td className="p-1.5 text-center">{items.filter(it => it.name).reduce((s, i) => s + (parseFloat(i.qty) || 0), 0)}</td>
                        <td className="p-1.5"></td>
                        <td className="p-1.5 text-right">₹0.00</td>
                        <td className="p-1.5 text-right">₹0.00</td>
                        <td className="p-1.5 text-right">₹{totalAmount.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Bottom Section */}
                <div className="flex justify-between gap-4 mb-4 text-[10px]">
                  <div className="w-[50%]">
                    <div className="font-bold mb-0.5">Description</div>
                    <div className="text-gray-600 mb-3">Sale Description</div>

                    <div className="font-bold uppercase mb-0.5">Invoice Amount in Words</div>
                    <div className="text-gray-600 mb-3">Rupees {totalAmount} Only</div>

                    <div className="font-bold uppercase mb-0.5">Terms and Conditions</div>
                    <div className="text-gray-600">{storeProfile?.invoiceNotes || 'Thanks for doing business with us!'}</div>
                  </div>

                  <div className="w-[45%] text-[10px]">
                    <div className="flex justify-between py-0.5"><span>Sub Total</span><span>₹{subTotal.toFixed(2)}</span></div>
                    <div className="flex justify-between py-0.5"><span>Discount</span><span>₹0.00</span></div>
                    <div className="flex justify-between py-[#4px] px-1.5 bg-[#8D84E8] text-white font-bold my-1 rounded">
                      <span>Total</span><span>₹{totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-0.5"><span>Received</span><span>₹{receivedAmt.toFixed(2)}</span></div>
                    <div className="flex justify-between py-0.5 border-b border-gray-200"><span>Balance</span><span>₹{balance.toFixed(2)}</span></div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-auto flex justify-between items-end pt-2 border-t border-gray-100 text-[9px]">
                  <div className="flex gap-2 items-center">
                    <div className="text-center">
                      <div className="w-[45px] h-[45px] bg-gray-200 text-gray-400 flex items-center justify-center text-[7px] rounded">QR</div>
                      <div className="text-[7px] font-bold text-emerald-600 border border-emerald-600 px-1 mt-0.5 rounded">UPI PAY</div>
                    </div>
                    <div>
                      <div className="font-bold">Pay To:</div>
                      <div>Bank: {storeProfile?.bankName || '123123123'}</div>
                      <div>A/C: {storeProfile?.bankAccountNumber || '12312312312'}</div>
                      <div>IFSC: {storeProfile?.bankIfscCode || '123123123'}</div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div>For : {storeProfile?.customCompanyName || storeProfile?.shopName || 'My Company'}</div>
                    <div className="w-[70px] h-[35px] bg-gray-200 text-gray-400 flex items-center justify-center text-[8px] my-1 mx-auto rounded">Image</div>
                    <div className="font-bold">Authorized Signatory</div>
                  </div>
                </div>

              </div>
            );
          })()}
        </div>

      </div>

      {/* ── BOTTOM ACTION BAR ── */}
      <div className="fixed bottom-0 left-[56px] right-0 h-[60px] bg-white border-t border-gray-200 flex items-center justify-center gap-4 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
        <button
          onClick={handleSave}
          disabled={submitting}
          className="bg-[#E91E63] text-white px-10 py-2 rounded-full text-[13px] font-bold hover:bg-[#D81B60] transition-colors shadow-sm cursor-pointer disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Save & New'}
        </button>

        <div className="flex items-center gap-3 absolute right-6">
          <button onClick={() => window.print()} className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 bg-white text-blue-500 hover:bg-blue-50 transition-colors shadow-sm cursor-pointer" title="Print Invoice">
            <Printer className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 bg-white text-blue-500 hover:bg-blue-50 transition-colors shadow-sm cursor-pointer" title="Download PDF">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
