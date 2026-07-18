// client/src/pages/AddSale.jsx

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, X, ChevronDown, Trash2, Printer, Download, Search, Package
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createInvoice } from '../services/invoice';
import { getProductsList } from '../services/product';
import { useCurrency } from '../context/CurrencyContext';
import { getStoreSettings } from '../services/settings';

const UNIT_OPTIONS = ['NONE', 'Bag', 'Box', 'Btl', 'Can', 'Ctn', 'Doz', 'Gm', 'Kg', 'Ltr', 'Meter', 'Nos', 'Pcs', 'Pkt', 'Roll', 'Ton'];
const TAX_OPTIONS = ['NONE', 'IGST@0%', 'GST@0%', 'GST@0.25%', 'IGST@3%', 'GST@3%', 'IGST@5%', 'GST@5%', 'IGST@12%', 'GST@12%', 'IGST@18%', 'GST@18%', 'IGST@28%', 'GST@28%'];

function taxRateToOption(rate) {
  if (!rate || rate === 0) return 'NONE';
  return `GST@${rate}%`;
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

  useEffect(() => {
    getStoreSettings()
      .then(res => { if (res?.success && res.settings) setStoreProfile(res.settings); })
      .catch(() => {});
    
    // Load in-stock products for the dropdown
    getProductsList()
      .then(res => { if (res?.success && res.products) setProducts(res.products); })
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
      alert('Failed to save sale: ' + (err.response?.data?.error || err.message));
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
                <input
                  type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
                  placeholder="Customer Name"
                  className="w-full px-3 py-2 border border-gray-200 rounded-[6px] text-[13px] text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
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

        {/* ── RIGHT PANE (PREVIEW) ── */}
        <div className="w-[42%] bg-[#F0F2F5] p-6 flex justify-center overflow-y-auto">
          <div id="invoice-printable-area" className="bg-white w-full max-w-[480px] shadow-sm border border-gray-300 p-[20px] text-black shrink-0 relative flex flex-col" style={{ minHeight: '700px', zoom: 0.9 }}>
            <div className="absolute inset-[15px] border-[1.5px] border-black pointer-events-none" />

            <div className="relative z-10 p-2 flex flex-col h-full mt-[15px] mx-[15px]">
              <div className="text-center font-bold text-[12px] border-b border-black pb-1 mb-2">Tax Invoice</div>

              {/* Header Grid */}
              <div className="flex border-b-[1.5px] border-black pb-2 mb-0">
                <div className="flex-1 flex gap-3 pr-2">
                  <div className="w-[60px] h-[60px] bg-gray-400 flex items-center justify-center text-white font-bold text-[10px]">LOGO</div>
                  <div className="flex flex-col pt-1">
                    <div className="font-bold text-[15px]">{storeProfile?.shopName || 'My Company'}</div>
                    <div className="text-[9px] mt-1 text-gray-700">Phone: {storeProfile?.phoneNumber || '-'}</div>
                  </div>
                </div>
                <div className="w-[180px] border-l border-black pl-2 flex flex-col gap-1 text-[9px] pt-1">
                  <div className="flex gap-2"><span className="w-[60px]">Invoice No.</span>: —</div>
                  <div className="flex gap-2"><span className="w-[60px]">Date</span>: {todayStr}</div>
                </div>
              </div>

              {/* Bill To */}
              <div className="border-b-[1.5px] border-black pb-2 pt-1 px-1">
                <div className="font-bold text-[10px] mb-1">Bill To:</div>
                <div className="text-[10px] font-bold">{customerName || '—'}</div>
                <div className="text-[9px] text-gray-700">{customerAddress || ''}</div>
                <div className="text-[9px] text-gray-700">Contact No: {customerPhone || '-'}</div>
              </div>

              {/* Items Table inside Invoice */}
              <div className="flex-1 mt-0 flex flex-col border-b-[1.5px] border-black border-l border-r -mx-1 px-1">
                <div className="flex border-b border-black text-[9px] font-bold py-1 bg-[#F9F9F9]">
                  <div className="w-[22px] pl-1">#</div>
                  <div className="flex-1">Item name</div>
                  <div className="w-[40px] text-right">Qty</div>
                  <div className="w-[65px] text-right">Price(₹)</div>
                  <div className="w-[65px] text-right pr-1">Amt(₹)</div>
                </div>

                <div className="flex-1 pt-1">
                  {items.filter(it => it.name).length === 0 ? (
                    <div className="text-[9px] text-gray-300 text-center py-4 italic">No items added yet</div>
                  ) : (
                    items.filter(it => it.name).map((it, idx) => (
                      <div key={idx} className="flex text-[9px] py-0.5 border-b border-gray-100">
                        <div className="w-[22px] pl-1 text-center">{idx + 1}</div>
                        <div className="flex-1 font-semibold truncate pr-1">{it.name}</div>
                        <div className="w-[40px] text-right pr-1">{it.qty}</div>
                        <div className="w-[65px] text-right pr-1">₹ {parseFloat(it.price || 0).toFixed(2)}</div>
                        <div className="w-[65px] text-right pr-1">₹ {parseFloat(it.total || 0).toFixed(2)}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Footer Total */}
              <div className="flex text-[9px] font-bold pt-1 pb-1 px-1">
                <div className="flex-1">Total</div>
                <div className="w-[40px] text-right pr-1">{items.filter(it => it.name).reduce((s, i) => s + (parseFloat(i.qty) || 0), 0)}</div>
                <div className="w-[130px] text-right pr-1">₹ {totalAmount.toFixed(2)}</div>
              </div>
            </div>
          </div>
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
          <button onClick={() => window.print()} className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 bg-white text-blue-500 hover:bg-blue-50 transition-colors shadow-sm cursor-pointer">
            <Printer className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 bg-white text-blue-500 hover:bg-blue-50 transition-colors shadow-sm cursor-pointer">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
