// client/src/pages/AddPurchase.jsx

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Upload, FileText, ChevronDown, 
  Trash2, GripVertical, PlusCircle, MinusCircle, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPurchase } from '../services/purchase';

const STATE_OPTIONS = [
  'None',
  'Andaman & Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra & Nagar Haveli and Daman & Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu & Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal'
];

const TAX_OPTIONS = [
  'NONE',
  'IGST@0%',
  'GST@0%',
  'GST@0.25%',
  'IGST@3%',
  'GST@3%',
  'IGST@5%',
  'GST@5%',
  'IGST@12%',
  'GST@12%',
  'IGST@18%',
  'GST@18%',
  'IGST@28%',
  'GST@28%'
];

const UNIT_OPTIONS = [
  'NONE', 'Bag', 'Box', 'Btl', 'Can', 'Ctn', 'Doz', 'Gm', 'Kg', 'Ltr', 'Meter', 'Nos', 'Pcs', 'Pkt', 'Roll', 'Ton'
];

// Reusable Custom Dropdown Component
function FloatingDropdown({ value, options, onChange, placeholder, width = 'w-full' }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${width}`} ref={dropdownRef}>
      <div 
        className="flex items-center justify-between px-2 py-1.5 border border-gray-300 rounded-[4px] bg-white text-[12px] cursor-pointer hover:border-blue-400 text-gray-800"
        onClick={() => setOpen(!open)}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
      </div>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-[4px] shadow-lg max-h-60 overflow-y-auto">
          {options.map((opt, i) => (
            <div 
              key={i} 
              className={`px-3 py-1.5 text-[12px] cursor-pointer hover:bg-gray-100 ${value === opt ? 'bg-gray-100 text-black font-semibold' : 'text-gray-700'}`}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AddPurchase() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  // Header State
  const [party, setParty] = useState('');
  const [phone, setPhone] = useState('');
  const [balance, setBalance] = useState('900');
  const [billNumber, setBillNumber] = useState('');
  
  // Format today's date in dd/MM/yyyy
  const d = new Date();
  const todayStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}/${d.getFullYear()}`;
  const [billDate, setBillDate] = useState(todayStr);
  const [stateOfSupply, setStateOfSupply] = useState('Select');

  // Table State
  const [items, setItems] = useState([
    { id: 1, name: 'Sample Item', qty: 1, unit: 'Bag', price: 5, discountPercent: '', discountAmt: '', tax: 'IGST@0.25%', taxAmt: 0.01, amount: 5.01 },
    { id: 2, name: 'Sample Item', qty: 1, unit: 'Box', price: 4, discountPercent: '', discountAmt: '', tax: 'NONE', taxAmt: '', amount: 4 },
    { id: 3, name: '', qty: '', unit: 'Ton', price: 5, discountPercent: '', discountAmt: '', tax: 'NONE', taxAmt: '', amount: '' },
    { id: 4, name: '', qty: '', unit: 'NONE', price: 4, discountPercent: '', discountAmt: '', tax: 'NONE', taxAmt: '', amount: '' },
    { id: 5, name: '', qty: '', unit: 'NONE', price: '', discountPercent: '', discountAmt: '', tax: 'NONE', taxAmt: '', amount: '' },
  ]);

  // Footer State
  const [paymentType, setPaymentType] = useState('Cash');
  const [description, setDescription] = useState('');
  const [roundOff, setRoundOff] = useState(true);
  const [roundOffAmount, setRoundOffAmount] = useState('-0.01');
  const [isPaid, setIsPaid] = useState(false);
  const [paidAmount, setPaidAmount] = useState('');

  // Calculations
  const calcItem = (item) => {
    let q = parseFloat(item.qty) || 0;
    let p = parseFloat(item.price) || 0;
    let base = q * p;
    
    let dAmt = parseFloat(item.discountAmt) || 0;
    if (item.discountPercent) {
      dAmt = base * (parseFloat(item.discountPercent) / 100);
    }
    base = base - dAmt;

    let tAmt = 0;
    if (item.tax && item.tax !== 'NONE') {
      const match = item.tax.match(/@([\d.]+)%/);
      if (match) {
        const rate = parseFloat(match[1]);
        tAmt = base * (rate / 100);
      }
    }
    return {
      calcDiscountAmt: dAmt ? dAmt.toFixed(2) : '',
      calcTaxAmt: tAmt ? tAmt.toFixed(2) : '',
      calcAmount: (base + tAmt).toFixed(2)
    };
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    if (field === 'discountAmt') newItems[index].discountPercent = '';
    
    const calcs = calcItem(newItems[index]);
    if (newItems[index].discountPercent) {
      newItems[index].discountAmt = calcs.calcDiscountAmt;
    }
    newItems[index].taxAmt = calcs.calcTaxAmt;
    newItems[index].amount = calcs.calcAmount;
    
    setItems(newItems);
  };

  const addRow = () => {
    setItems([...items, { id: Date.now(), name: '', qty: '', unit: 'NONE', price: '', discountPercent: '', discountAmt: '', tax: 'NONE', taxAmt: '', amount: '' }]);
  };

  const removeRow = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const totalQty = items.reduce((sum, it) => sum + (parseFloat(it.qty) || 0), 0);
  const totalTaxAmt = items.reduce((sum, it) => sum + (parseFloat(it.taxAmt) || 0), 0);
  const subTotalAmount = items.reduce((sum, it) => sum + (parseFloat(it.amount) || 0), 0);
  
  const grandTotal = roundOff ? Math.round(subTotalAmount) : subTotalAmount;
  const parsedPaid = parseFloat(paidAmount) || 0;
  const balanceDue = grandTotal - (isPaid ? parsedPaid : 0);
  const calculatedRoundOff = roundOff ? (grandTotal - subTotalAmount).toFixed(2) : '0.00';

  const handleSave = async () => {
    try {
      setSubmitting(true);
      
      const payload = {
        party: party || 'Walk-in Vendor',
        phone,
        billNumber,
        billDate,
        stateOfSupply,
        items: items.filter(it => it.name).map(it => {
          let rate = 0;
          if (it.tax && it.tax !== 'NONE') {
            const match = it.tax.match(/@([\d.]+)%/);
            if (match) rate = parseFloat(match[1]);
          }
          return {
            description: it.name,
            hsnCode: '0000',
            quantity: parseFloat(it.qty) || 1,
            price: parseFloat(it.price) || 0,
            gstRate: rate,
            discountAmt: parseFloat(it.discountAmt) || 0,
            taxAmt: parseFloat(it.taxAmt) || 0,
            amount: parseFloat(it.amount) || 0
          };
        }),
        paymentType,
        description,
        subTotalAmount,
        totalTaxAmt,
        grandTotal,
        isPaid,
        paidAmount: parsedPaid,
        balanceDue
      };

      if (payload.items.length === 0) {
        alert("Please add at least one valid item.");
        setSubmitting(false);
        return;
      }

      const res = await createPurchase(payload);
      if (res.success) {
        alert('Purchase saved successfully!');
        navigate('/dashboard'); // Or navigate to a purchase detail page if it existed
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save purchase: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Synchronize round off display
  useEffect(() => {
    if (roundOff) {
      setRoundOffAmount(calculatedRoundOff);
    }
  }, [subTotalAmount, roundOff, calculatedRoundOff]);

  return (
    <div className="flex flex-col h-screen bg-[#F7F8FA]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── HEADER ── */}
      <div className="flex items-center px-6 h-[50px] bg-white border-b border-gray-200 shrink-0 shadow-sm z-10">
        <h1 className="text-[18px] font-bold text-gray-800">Purchase</h1>
      </div>

      {/* ── MAIN SCROLLABLE AREA ── */}
      <div className="flex-1 overflow-auto bg-[#F2F4F7]">
        <div className="max-w-[1400px] mx-auto min-w-[1000px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-200/60 mt-4 rounded-[2px] flex flex-col mb-[80px]">
          
          {/* Top Form Section */}
          <div className="flex items-start justify-between p-4 border-b border-gray-200">
            {/* Left */}
            <div className="flex gap-4">
              <div className="w-[200px]">
                <label className="block text-[11px] text-gray-500 font-semibold mb-1">Party <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type="text" value={party} onChange={e => setParty(e.target.value)} placeholder="pratik" className="w-full px-2 py-1.5 border border-gray-300 rounded-[4px] text-[12px] text-gray-800 focus:outline-none focus:border-blue-500" />
                  <ChevronDown className="absolute right-2 top-2 w-3.5 h-3.5 text-gray-400" />
                </div>
                {balance && <div className="text-[10px] text-teal-600 font-bold mt-1 tracking-wide">BAL: {balance}</div>}
              </div>
              <div className="w-[160px]">
                <label className="block text-[11px] text-gray-500 font-semibold mb-1">Phone No.</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="9913039185" className="w-full px-2 py-1.5 border border-gray-300 rounded-[4px] text-[12px] text-gray-800 focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            {/* Right */}
            <div className="w-[240px] space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500 font-semibold w-24 text-right pr-3">Bill Number</span>
                <input type="text" value={billNumber} onChange={e => setBillNumber(e.target.value)} className="w-[130px] border-b border-gray-300 px-1 py-1 text-gray-800 focus:outline-none focus:border-blue-500 bg-transparent text-right" />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500 font-semibold w-24 text-right pr-3">Bill Date</span>
                <div className="w-[130px] relative">
                  <input type="text" value={billDate} onChange={e => setBillDate(e.target.value)} className="w-full border-b border-gray-300 px-1 py-1 text-gray-800 focus:outline-none focus:border-blue-500 bg-transparent text-right pr-5" />
                  <div className="absolute right-0 top-1.5"><svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-gray-500 font-semibold w-24 text-right pr-3">State of supply</span>
                <div className="w-[130px]">
                  <FloatingDropdown value={stateOfSupply} options={STATE_OPTIONS} onChange={setStateOfSupply} placeholder="Select" />
                </div>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                  <th className="py-2 px-2 border-r border-gray-200 w-[40px] text-center">#</th>
                  <th className="py-2 px-2 border-r border-gray-200 text-left">ITEM</th>
                  <th className="py-2 px-2 border-r border-gray-200 w-[60px] text-right">QTY</th>
                  <th className="py-2 px-2 border-r border-gray-200 w-[80px] text-left">UNIT</th>
                  <th className="py-2 px-2 border-r border-gray-200 w-[120px] text-right">
                    <div className="flex flex-col text-right items-end">
                      <span>PRICE/UNIT</span>
                      <span className="text-[9px] font-normal text-gray-400 mt-0.5">Without Tax <ChevronDown className="inline w-3 h-3 text-gray-400" /></span>
                    </div>
                  </th>
                  <th className="py-2 px-2 border-r border-gray-200 w-[140px]">
                    <div className="border-b border-gray-200 pb-1 mb-1 text-center">DISCOUNT</div>
                    <div className="flex"><span className="w-1/2 text-center border-r border-gray-200">%</span><span className="w-1/2 text-center">AMOUNT</span></div>
                  </th>
                  <th className="py-2 px-2 border-r border-gray-200 w-[180px]">
                    <div className="border-b border-gray-200 pb-1 mb-1 text-center">TAX</div>
                    <div className="flex"><span className="w-1/2 text-center border-r border-gray-200">%</span><span className="w-1/2 text-center">AMOUNT</span></div>
                  </th>
                  <th className="py-2 px-2 text-right w-[100px] relative">
                    AMOUNT
                    <div className="absolute right-1 top-2 cursor-pointer text-blue-500 hover:bg-blue-50 rounded-full p-0.5"><PlusCircle className="w-3.5 h-3.5" /></div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {items.map((it, idx) => {
                  const isFocusedRow = idx === 0; // matching reference image where row 1 has controls
                  return (
                    <tr key={it.id} className="border-b border-gray-200 hover:bg-gray-50 group transition-colors h-[32px]">
                      <td className="py-1 px-1 border-r border-gray-200 text-center text-gray-400 align-top relative">
                        {isFocusedRow && <div className="absolute left-0 top-[6px] flex items-center -ml-1"><GripVertical className="w-3 h-3" /><Trash2 className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => removeRow(idx)} /></div>}
                        <span className="inline-block mt-1">{idx + 1}</span>
                      </td>
                      <td className="py-0 px-1 border-r border-gray-200 align-top"><input type="text" value={it.name} onChange={e => handleItemChange(idx, 'name', e.target.value)} className="w-full px-2 py-1.5 border border-transparent focus:border-gray-300 focus:bg-white rounded-[2px] text-[12px] bg-transparent outline-none h-full" /></td>
                      <td className="py-0 px-1 border-r border-gray-200 align-top"><input type="number" value={it.qty} onChange={e => handleItemChange(idx, 'qty', e.target.value)} className="w-full px-2 py-1.5 border border-transparent focus:border-gray-300 focus:bg-white rounded-[2px] text-[12px] text-right bg-transparent outline-none h-full" /></td>
                      <td className="py-0 px-1 border-r border-gray-200 align-top flex items-center h-[32px]">
                        <div className="w-full relative px-1 h-full flex items-center">
                           <select value={it.unit} onChange={e => handleItemChange(idx, 'unit', e.target.value)} className="w-full bg-transparent appearance-none text-[12px] focus:outline-none cursor-pointer">
                              {UNIT_OPTIONS.map(o => <option key={o}>{o}</option>)}
                           </select>
                           <ChevronDown className="absolute right-1 w-3 h-3 text-gray-400 pointer-events-none" />
                        </div>
                      </td>
                      <td className="py-0 px-1 border-r border-gray-200 align-top"><input type="number" value={it.price} onChange={e => handleItemChange(idx, 'price', e.target.value)} className="w-full px-2 py-1.5 border border-transparent focus:border-gray-300 focus:bg-white rounded-[2px] text-[12px] text-right bg-transparent outline-none h-full" /></td>
                      <td className="py-0 px-0 border-r border-gray-200 align-top h-full">
                        <div className="flex w-full h-full">
                          <input type="number" value={it.discountPercent} onChange={e => handleItemChange(idx, 'discountPercent', e.target.value)} className="w-1/2 px-1 py-1.5 border-r border-transparent focus:border-gray-300 text-[12px] text-center bg-transparent outline-none h-[31px]" />
                          <input type="number" value={it.discountAmt} onChange={e => handleItemChange(idx, 'discountAmt', e.target.value)} className="w-1/2 px-1 py-1.5 border-l border-gray-100 text-[12px] text-right bg-transparent outline-none h-[31px]" />
                        </div>
                      </td>
                      <td className="py-0 px-0 border-r border-gray-200 align-top h-[32px]">
                        <div className="flex w-full h-full items-center">
                          <div className="w-1/2 px-1 relative h-full flex items-center">
                            <FloatingDropdown value={it.tax} options={TAX_OPTIONS} onChange={v => handleItemChange(idx, 'tax', v)} placeholder="Select" width="w-full" />
                          </div>
                          <div className="w-1/2 px-2 py-1.5 text-right text-gray-500 bg-transparent flex items-center justify-end">{it.taxAmt}</div>
                        </div>
                      </td>
                      <td className="py-0 px-2 align-top text-right font-semibold text-gray-800"><div className="mt-1.5">{it.amount}</div></td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <td colSpan="2" className="py-3 px-2 border-r border-gray-200">
                    <button onClick={addRow} className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 border border-blue-200 bg-white px-3 py-1.5 rounded-[4px] hover:bg-blue-50">
                      ADD ROW
                    </button>
                  </td>
                  <td className="py-3 px-2 border-r border-gray-200 text-right font-bold text-gray-700 text-[12px]">{totalQty || ''}</td>
                  <td colSpan="2" className="py-3 px-2 border-r border-gray-200 text-right font-bold text-gray-700 text-[10px]">TOTAL</td>
                  <td className="py-3 px-2 border-r border-gray-200 text-right font-bold text-gray-700 text-[12px]">{items.reduce((s,i)=>s+(parseFloat(i.discountAmt)||0),0) || 0}</td>
                  <td className="py-3 px-2 border-r border-gray-200 text-right font-bold text-gray-700 flex justify-end text-[12px]">
                    <span className="w-1/2 text-right">{totalTaxAmt.toFixed(2)}</span>
                  </td>
                  <td className="py-3 px-2 font-bold text-gray-800 text-right text-[12px]">{subTotalAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Bottom Details Section */}
          <div className="flex px-4 py-4 gap-8 bg-white pb-8">
            {/* Bottom Left - Removed Terms & Conditions */}
            <div className="w-[45%] flex flex-col gap-4">
            </div>

            {/* Bottom Center */}
            <div className="flex-1 flex flex-col gap-4 pl-4 pt-1">
              <div className="w-[180px]">
                <fieldset className="border border-gray-300 rounded-[4px] px-2 pb-1.5 pt-0 relative">
                  <legend className="text-[10px] text-gray-500 font-semibold px-1">Payment Type</legend>
                  <div className="relative">
                    <select value={paymentType} onChange={e => setPaymentType(e.target.value)} className="w-full text-[12px] text-gray-800 appearance-none bg-transparent focus:outline-none cursor-pointer">
                      <option value="Cash">Cash</option>
                      <option value="Bank">Bank</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                    <ChevronDown className="absolute right-0 top-1 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </fieldset>
                <div className="text-blue-500 text-[11px] font-bold mt-1.5 cursor-pointer">+ Add Payment type</div>
              </div>
              

            </div>

            {/* Bottom Right: Financial Summary */}
            <div className="w-[300px] flex flex-col gap-3 justify-end pt-14">
              <div className="flex items-center justify-end gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer text-[12px] font-semibold text-gray-700">
                  <input type="checkbox" checked={roundOff} onChange={e => setRoundOff(e.target.checked)} className="rounded border-gray-300 text-blue-500 focus:ring-blue-500" />
                  Round Off
                </label>
                <input type="text" value={roundOffAmount} onChange={e => setRoundOffAmount(e.target.value)} className="w-[60px] border border-gray-300 rounded-[4px] px-2 py-1 text-[11px] text-right bg-white focus:outline-none focus:border-blue-400" disabled={!roundOff} />
                
                <span className="text-[13px] font-bold text-gray-800 ml-2">Total</span>
                <div className="w-[120px] border border-gray-200 rounded-[4px] px-2 py-1 text-[13px] text-right font-bold bg-gray-50 text-gray-800">
                  {grandTotal.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4">
                <label className="flex items-center gap-1.5 cursor-pointer text-[12px] font-semibold text-gray-700">
                  <input type="checkbox" checked={isPaid} onChange={e => setIsPaid(e.target.checked)} className="rounded border-gray-300 text-blue-500 focus:ring-blue-500" />
                  Paid
                </label>
                <input type="text" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} disabled={!isPaid} className="w-[120px] border border-gray-300 rounded-[4px] px-2 py-1 text-[13px] text-right bg-white focus:outline-none focus:border-blue-400" />
              </div>

              <div className="flex items-center justify-end gap-3 mt-1 pr-[130px] relative">
                <span className="text-[13px] font-bold text-gray-800 absolute right-[140px]">Balance</span>
                <div className="w-[120px] text-right font-bold text-[14px] text-gray-900 absolute right-0">
                  {balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                </div>
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
        
        <div className="flex items-center gap-3">
          <div className="flex rounded-[6px] border border-blue-400 overflow-hidden shadow-sm">
            <button className="bg-white text-blue-600 px-4 py-2 text-[13px] font-bold hover:bg-blue-50 transition-colors">Generate e-Invoice</button>
            <button className="bg-white text-blue-600 px-2 py-2 border-l border-blue-400 hover:bg-blue-50 transition-colors"><ChevronDown className="w-4 h-4" /></button>
          </div>
          <button className="bg-blue-600 text-white px-8 py-2 rounded-[6px] text-[13px] font-bold hover:bg-blue-700 shadow-sm transition-colors cursor-pointer">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
