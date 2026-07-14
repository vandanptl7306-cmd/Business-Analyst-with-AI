// client/src/pages/AddSale.jsx

import React, { useState } from 'react';
import { 
  Plus, X, ChevronDown, Trash2, Phone, Printer, Download, MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createInvoice } from '../services/invoice';

const UNIT_OPTIONS = ['NONE', 'Bag', 'Box', 'Btl', 'Can', 'Ctn', 'Doz', 'Gm', 'Kg', 'Ltr', 'Meter', 'Nos', 'Pcs', 'Pkt', 'Roll', 'Ton'];
const TAX_OPTIONS = ['NONE', 'IGST@0%', 'GST@0%', 'GST@0.25%', 'IGST@3%', 'GST@3%', 'IGST@5%', 'GST@5%', 'IGST@12%', 'GST@12%', 'IGST@18%', 'GST@18%', 'IGST@28%', 'GST@28%'];

export default function AddSale() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  // Header State
  const [isFullMode, setIsFullMode] = useState(false);

  // Customer State
  const [customerName, setCustomerName] = useState('pratik');
  const [customerPhone, setCustomerPhone] = useState('9948946494');
  const [customerGSTIN, setCustomerGSTIN] = useState('');

  // Items State
  const [items, setItems] = useState([
    { id: 1, name: 'Sample Item', qty: 1, unit: 'NONE', price: 100, discountPercent: '', tax: 'NONE', total: 100 },
    { id: 2, name: 'Sample Item', qty: 1, unit: 'NONE', price: 100, discountPercent: '', tax: 'NONE', total: 100 },
    { id: 3, name: '', qty: '', unit: 'NONE', price: '', discountPercent: '', tax: 'NONE', total: 0 },
  ]);

  // Payment State
  const [received, setReceived] = useState('');
  const [fullyReceived, setFullyReceived] = useState(false);

  // Derived State
  const todayStr = `${String(new Date().getDate()).padStart(2, '0')}/${String(new Date().getMonth()+1).padStart(2, '0')}/${new Date().getFullYear()}`;

  // Calculations
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
    const recalculated = calcItem(newItems[index]);
    newItems[index].total = recalculated.total;
    setItems(newItems);
  };

  const addRow = () => {
    setItems([...items, { id: Date.now(), name: '', qty: '', unit: 'NONE', price: '', discountPercent: '', tax: 'NONE', total: 0 }]);
  };

  const removeRow = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const subTotal = items.reduce((sum, it) => sum + (parseFloat(it.total) || 0), 0);
  const totalAmount = Math.round(subTotal);
  
  const handleFullyReceived = (checked) => {
    setFullyReceived(checked);
    if (checked) {
      setReceived(totalAmount.toString());
    } else {
      setReceived('');
    }
  };

  const receivedAmt = parseFloat(received) || 0;
  const balance = totalAmount - receivedAmt;

  const handleSave = async () => {
    try {
      setSubmitting(true);
      
      const payload = {
        sellerName: 'My Company', 
        sellerGSTIN: '27AAAAA0000A1Z5', // Required by Invoice model
        sellerPIN: '400001',            // Required by Invoice model
        buyerName: customerName || 'Walk-in Customer',
        buyerGSTIN: customerGSTIN || '27BBBBB0000B1Z5',  // Required by Invoice model, uses entered GSTIN if available
        buyerBillingAddress: 'Idgar', 
        buyerPIN: '400001',             // Required by Invoice model
        items: items.filter(it => it.name).map(it => {
          let rate = 0;
          if (it.tax && it.tax !== 'NONE') {
            const match = it.tax.match(/@([\d.]+)%/);
            if (match) rate = parseFloat(match[1]);
          }
          return {
            description: it.name,
            hsnCode: '0000', // Default
            quantity: parseFloat(it.qty) || 1,
            price: parseFloat(it.price) || 0,
            gstRate: rate,
            isTaxInclusive: false,
            mrp: 0
          };
        })
      };

      if (payload.items.length === 0) {
        alert("Please add at least one valid item.");
        setSubmitting(false);
        return;
      }

      const res = await createInvoice(payload);
      if (res.success) {
        let msg = 'Sale saved successfully!';
        if (res.whatsappDelivery) {
          if (res.whatsappDelivery.status === 'Sent') {
            msg += '\n\nWhatsApp notification sent successfully!';
          } else if (res.whatsappDelivery.status === 'Skipped' || res.whatsappDelivery.status === 'Failed') {
            msg += `\n\nWhatsApp Notice: ${res.whatsappDelivery.message}`;
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

  return (
    <div className="flex flex-col h-screen bg-[#F4F6F8]" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-6 h-[50px] bg-white border-b border-gray-200 shrink-0 z-10 shadow-sm relative">
        <div className="flex items-center gap-6">
          <h1 className="text-[18px] font-bold text-gray-800">Sale</h1>
          <div className="h-4 border-l border-gray-300"></div>

        </div>
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-red-500">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── MAIN SPLIT PANE ── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ── LEFT PANE (FORM) ── */}
        <div className="w-[55%] flex flex-col bg-white border-r border-gray-200 overflow-y-auto relative pb-[80px]">
          <div className="p-6 pb-2">
            
            {/* Customer Details */}
            <div className="flex gap-6 mb-6">
              <div className="w-[300px]">
                <label className="block text-[11px] text-gray-600 font-semibold mb-1">Customer Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} 
                  placeholder="Customer Name"
                  className="w-full px-3 py-2 border border-gray-200 rounded-[6px] text-[13px] text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-shadow" 
                />
              </div>
              <div className="w-[300px]">
                <label className="block text-[11px] text-gray-600 font-semibold mb-1">Customer Phone Number</label>
                <div className="flex">
                  <div className="flex items-center justify-center px-3 border border-r-0 border-gray-200 rounded-l-[6px] bg-gray-50 text-[13px] text-gray-600">
                    +91
                  </div>
                  <input 
                    type="text" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="Phone Number"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-r-[6px] text-[13px] text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-shadow" 
                  />
                </div>
              </div>
              <div className="w-[300px]">
                <label className="block text-[11px] text-gray-600 font-semibold mb-1">Customer GSTIN (Optional)</label>
                <input 
                  type="text" value={customerGSTIN} onChange={e => setCustomerGSTIN(e.target.value)}
                  placeholder="GSTIN"
                  className="w-full px-3 py-2 border border-gray-200 rounded-[6px] text-[13px] text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-shadow" 
                />
              </div>
            </div>

            {/* Sales Items Table */}
            <div className="w-full mt-4">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-gray-500 font-semibold uppercase border-b border-gray-100">
                    <th className="py-2 px-1 text-left w-[30px]">#</th>
                    <th className="py-2 px-1 text-left">ITEM</th>
                    <th className="py-2 px-1 text-left w-[70px]">QTY</th>
                    <th className="py-2 px-1 text-left w-[100px]">UNIT</th>
                    <th className="py-2 px-1 text-left w-[90px]">PRICE</th>
                    <th className="py-2 px-1 text-left w-[100px]">DISCOUNT(%)</th>
                    <th className="py-2 px-1 text-left w-[110px]">TAX</th>
                    <th className="py-2 px-1 text-right w-[80px]">
                      TOTAL <span className="inline-block rounded-full bg-blue-50 text-blue-500 p-0.5 ml-1"><Plus className="w-3 h-3" /></span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={it.id} className="group">
                      <td className="py-2 px-1 align-top text-gray-400 font-medium relative">
                        <span className="inline-block mt-2">{idx + 1}</span>
                        {items.length > 1 && <Trash2 onClick={() => removeRow(idx)} className="w-3.5 h-3.5 text-red-400 opacity-0 group-hover:opacity-100 absolute left-4 top-2.5 cursor-pointer" />}
                      </td>
                      <td className="py-1 px-1 align-top">
                        <input type="text" placeholder="Enter Item" value={it.name} onChange={e => handleItemChange(idx, 'name', e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-[4px] text-[12px] text-gray-800 focus:outline-none focus:border-blue-400" />
                      </td>
                      <td className="py-1 px-1 align-top">
                        <input type="number" value={it.qty} onChange={e => handleItemChange(idx, 'qty', e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-[4px] text-[12px] text-gray-800 focus:outline-none focus:border-blue-400" />
                      </td>
                      <td className="py-1 px-1 align-top relative">
                        <select value={it.unit} onChange={e => handleItemChange(idx, 'unit', e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-[4px] text-[12px] text-gray-800 appearance-none bg-white focus:outline-none focus:border-blue-400 cursor-pointer">
                          {UNIT_OPTIONS.map(o => <option key={o}>{o}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      </td>
                      <td className="py-1 px-1 align-top">
                        <input type="number" value={it.price} onChange={e => handleItemChange(idx, 'price', e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-[4px] text-[12px] text-gray-800 focus:outline-none focus:border-blue-400" />
                      </td>
                      <td className="py-1 px-1 align-top">
                        <input type="number" value={it.discountPercent} onChange={e => handleItemChange(idx, 'discountPercent', e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-[4px] text-[12px] text-gray-800 focus:outline-none focus:border-blue-400" />
                      </td>
                      <td className="py-1 px-1 align-top relative">
                        <select value={it.tax} onChange={e => handleItemChange(idx, 'tax', e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-[4px] text-[12px] text-gray-800 appearance-none bg-white focus:outline-none focus:border-blue-400 cursor-pointer">
                          {TAX_OPTIONS.map(o => <option key={o}>{o}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      </td>
                      <td className="py-1 px-1 align-top text-right pt-2 font-semibold text-gray-700">
                        {it.total > 0 ? it.total.toFixed(2) : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="h-[2px] bg-gray-300 w-full mt-2 rounded"></div>
              
              <div className="flex justify-between mt-3 px-1">
                <button onClick={addRow} className="flex items-center gap-1 text-[12px] font-bold text-blue-600 hover:text-blue-700">
                  <Plus className="w-4 h-4" /> Add Row
                </button>
                <div className="text-[12px] text-gray-500 font-semibold flex gap-2 items-center">
                  Sub Total <span className="text-gray-800 text-[14px] font-bold">{subTotal.toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="mt-8 px-1 flex flex-col gap-6">
              <div className="flex justify-between items-end">
                <div className="w-[200px]">
                  <label className="block text-[12px] text-gray-600 font-semibold mb-1">Received</label>
                  {/* Empty space matching design */}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[12px] font-semibold text-gray-600">
                      <input type="checkbox" checked={fullyReceived} onChange={e => handleFullyReceived(e.target.checked)} className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 w-4 h-4" />
                      Fully Received
                    </label>
                    <input type="text" value={received} onChange={e => {setReceived(e.target.value); setFullyReceived(false);}} className="w-[120px] border border-gray-300 rounded-[4px] px-2 py-1.5 text-[13px] text-right font-semibold bg-white focus:outline-none focus:border-blue-400" />
                  </div>
                  <div className="text-[12px] font-semibold text-gray-600 mr-2">
                    Balance: <span className="text-gray-800">{balance.toFixed(0)}</span>
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
        <div className="w-[45%] bg-[#F0F2F5] p-6 flex justify-center overflow-y-auto">
          {/* Invoice Document Simulation */}
          <div id="invoice-printable-area" className="bg-white w-[500px] shadow-sm border border-gray-300 p-[20px] text-black shrink-0 relative flex flex-col" style={{ minHeight: '700px', zoom: 0.9 }}>
            {/* Outline border */}
            <div className="absolute inset-[15px] border-[1.5px] border-black pointer-events-none"></div>

            {/* Content within border */}
            <div className="relative z-10 p-2 flex flex-col h-full mt-[15px] mx-[15px]">
              <div className="text-center font-bold text-[12px] border-b border-black pb-1 mb-2">Tax Invoice</div>
              
              {/* Header Grid */}
              <div className="flex border-b-[1.5px] border-black pb-2 mb-0">
                <div className="flex-1 flex gap-3 pr-2">
                  <div className="w-[60px] h-[60px] bg-gray-400 flex items-center justify-center text-white font-bold text-[10px]">LOGO</div>
                  <div className="flex flex-col pt-1">
                    <div className="font-bold text-[15px]">My Company</div>
                    <div className="text-[9px] mt-1 text-gray-700">Phone: 9913039185</div>
                  </div>
                </div>
                <div className="w-[180px] border-l border-black pl-2 flex flex-col gap-1 text-[9px] pt-1">
                  <div className="flex gap-2">
                    <span className="w-[60px]">Invoice No.</span>: 2
                  </div>
                  <div className="flex gap-2">
                    <span className="w-[60px]">Date</span>: {todayStr}
                  </div>
                </div>
              </div>

              {/* Bill To */}
              <div className="border-b-[1.5px] border-black pb-2 pt-1 px-1">
                <div className="font-bold text-[10px] mb-1">Bill To:</div>
                <div className="text-[10px] font-bold">{customerName || '-'}</div>
                <div className="text-[9px] text-gray-700">Idgar</div>
                <div className="text-[9px] text-gray-700">Contact No: {customerPhone || '-'}</div>
              </div>

              {/* Items Table inside Invoice */}
              <div className="flex-1 mt-0 flex flex-col border-b-[1.5px] border-black border-l border-r -mx-1 px-1">
                <div className="flex border-b border-black text-[9px] font-bold py-1 bg-[#F9F9F9]">
                  <div className="w-[25px] pl-1">#</div>
                  <div className="flex-1">Item name</div>
                  <div className="w-[60px]">HSN/SAC</div>
                  <div className="w-[50px] text-right">Quantity</div>
                  <div className="w-[70px] text-right">Price/Unit(₹)</div>
                  <div className="w-[70px] text-right pr-1">Amount(₹)</div>
                </div>
                
                {/* Vertical lines container */}
                <div className="flex-1 relative flex">
                  {/* Vertical dividers */}
                  <div className="absolute left-[25px] top-0 bottom-0 border-l border-black/20"></div>
                  <div className="absolute left-[200px] top-0 bottom-0 border-l border-black/20"></div>
                  <div className="absolute left-[260px] top-0 bottom-0 border-l border-black/20"></div>
                  <div className="absolute left-[310px] top-0 bottom-0 border-l border-black/20"></div>
                  <div className="absolute left-[380px] top-0 bottom-0 border-l border-black/20"></div>

                  <div className="w-full pt-1 z-10">
                    {items.filter(it => it.name).map((it, idx) => (
                      <div key={idx} className="flex text-[9px] py-1">
                        <div className="w-[25px] pl-1 text-center">{idx + 1}</div>
                        <div className="flex-1 font-semibold">{it.name}</div>
                        <div className="w-[60px]"></div>
                        <div className="w-[50px] text-right pr-2">{it.qty}</div>
                        <div className="w-[70px] text-right pr-2">₹ {parseFloat(it.price||0).toFixed(2)}</div>
                        <div className="w-[70px] text-right pr-1">₹ {parseFloat(it.total||0).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Total */}
              <div className="flex text-[9px] font-bold pt-1 pb-1 px-1">
                <div className="flex-1">Total</div>
                <div className="w-[50px] text-right pr-2">{items.filter(it => it.name).reduce((s,i)=>s+(parseFloat(i.qty)||0),0)}</div>
                <div className="w-[140px] text-right pr-1">₹ {totalAmount.toFixed(2)}</div>
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
          <button className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 bg-white text-green-500 hover:bg-green-50 transition-colors shadow-sm cursor-pointer">
             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564c.173.087.289.129.332.202.043.073.043.423-.101.827z"/></svg>
          </button>
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
