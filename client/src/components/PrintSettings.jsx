// client/src/components/PrintSettings.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Info, ChevronRight, ChevronLeft, X, Upload,
  Check, Minus, Plus, ChevronDown, Camera, QrCode, Trash2,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   Default Settings
───────────────────────────────────────────────────────────────────────────── */
const DEFAULT_REGULAR = {
  selectedLayout: 'Tally Theme',
  primaryColor: '#2563EB',
  secondaryColor: '#6B7280',
  headerBg: '#FFFFFF',
  headerText: '#111827',
  borderColor: '#D1D5DB',
  footerColor: '#F9FAFB',
  makeDefault: true,
  repeatHeader: true,
  printCompanyName: true,
  companyName: 'My Company',
  printLogo: true,
  logoUrl: '',
  printAddress: true,
  address: '',
  printEmail: true,
  email: '',
  printPhone: true,
  phone: '',
  printGSTIN: true,
  gstin: '',
  paperSize: 'A4',
  orientation: 'Portrait',
  companyNameTextSize: 'Large',
  invoiceTextSize: 'Medium',
  printDuplicate: false,
  extraSpaceTop: 0,
  transactionNames: {
    Invoice: 'Invoice', Estimate: 'Estimate', Quotation: 'Quotation',
    'Delivery Challan': 'Delivery Challan', Purchase: 'Purchase',
    'Purchase Order': 'Purchase Order', 'Credit Note': 'Credit Note',
    'Debit Note': 'Debit Note', Expense: 'Expense', Payment: 'Payment',
  },
  expandTable: true,
  minTableRows: 0,
  showItemCode: false,
  showHSN: true,
  showDiscount: true,
  showTax: true,
  showUnit: true,
  showQuantity: true,
  showRate: true,
  showAmount: true,
  showBatch: false,
  showBarcode: false,
  showSerialNumber: false,
  showDescription: true,
  showItemImage: false,
  totalItemQuantity: true,
  amountWithDecimal: true,
  receivedAmount: true,
  balanceAmount: true,
  currentBalanceParty: false,
  taxDetails: true,
  youSaved: true,
  printAmountWithGrouping: true,
  amountInWords: 'Indian',
  printDescription: true,
  printTermsAndConditions: true,
  printReceivedBy: true,
  printDeliveredBy: true,
  printSignature: true,
  signatureText: 'Authorized Signatory',
  paymentMode: false,
  printAcknowledgement: false,
  // Bank Details
  printBankDetails: true,
  bankName: '',
  bankAccountNumber: '',
  bankIfscCode: '',
  bankQrCodeUrl: '',
};

const DEFAULT_THERMAL = {
  selectedTheme: 'theme1',
  makeDefault: false,
  pageSize: '3inch',
  printingType: 'Text Printing',
  useTextStyling: true,
  autoCutPaper: false,
  openCashDrawer: false,
  extraLinesAtEnd: 0,
  numberOfCopies: 1,
  // Header
  printCompanyName: true,
  companyName: 'My Company',
  printLogo: true,
  logoUrl: '',
  printAddress: true,
  address: '',
  printEmail: true,
  email: '',
  printPhone: true,
  phone: '9913039185',
  printGSTIN: true,
  gstin: '',
  transactionNames: {
    Invoice: 'Invoice', Estimate: 'Estimate', Quotation: 'Quotation',
    'Delivery Challan': 'Delivery Challan', Purchase: 'Purchase',
    'Purchase Order': 'Purchase Order', 'Credit Note': 'Credit Note',
    'Debit Note': 'Debit Note', Expense: 'Expense', Payment: 'Payment',
  },
  // Item table
  showSNo: true,
  showHSN: true,
  showUOM: true,
  showMRP: true,
  showDescription: true,
  // Additional item details
  showBatchNo: true,
  showExpDate: true,
  showMfgDate: true,
  showSize: true,
  showModelNo: true,
  showSerialNo: true,
  // Totals & Taxes
  totalItemQuantity: true,
  amountWithDecimal: true,
  receivedAmount: true,
  balanceAmount: true,
  currentBalanceParty: false,
  taxDetails: true,
  youSaved: true,
  printAmountWithGrouping: true,
  amountInWords: 'Indian',
  // Footer
  printDescription: true,
  printTermsAndConditions: true,
};

const THEMES = [
  { id: 'tally',      name: 'Tally Theme' },
  { id: 'landscape1', name: 'Landscape Theme 1' },
  { id: 'landscape2', name: 'Landscape Theme 2' },
  { id: 'gst1',       name: 'GST Theme 1' },
  { id: 'gst2',       name: 'GST Theme 2' },
  { id: 'gst3',       name: 'GST Theme 3' },
  { id: 'modern',     name: 'Modern Theme' },
  { id: 'minimalist', name: 'Minimalist' },
];

/* ─────────────────────────────────────────────────────────────────────────────
   SVG Theme Previews
───────────────────────────────────────────────────────────────────────────── */
function ThemePreviewSVG({ id }) {
  const base = 'fill-none stroke-gray-300 stroke-[1.5]';
  const line = 'stroke-gray-200 stroke-[1]';
  const blue = '#2563EB';

  const svgs = {
    tally: (
      <svg viewBox="0 0 80 90" className="w-full h-full">
        <rect width="80" height="90" fill="white" stroke="#D1D5DB" strokeWidth="1"/>
        <rect x="2" y="2" width="76" height="14" fill="#EFF6FF" stroke={blue} strokeWidth="0.8"/>
        <line x1="2" y1="8" x2="78" y2="8" stroke={blue} strokeWidth="0.5"/>
        <rect x="2" y="18" width="76" height="7" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="0.5"/>
        <rect x="2" y="27" width="76" height="4" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="2" y="33" width="76" height="4" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="2" y="39" width="76" height="4" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="2" y="45" width="76" height="4" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="2" y="51" width="76" height="4" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="2" y="57" width="76" height="4" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="50" y="65" width="28" height="8" fill="#EFF6FF" stroke={blue} strokeWidth="0.5"/>
        <rect x="2" y="76" width="76" height="12" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="0.5"/>
      </svg>
    ),
    landscape1: (
      <svg viewBox="0 0 90 70" className="w-full h-full">
        <rect width="90" height="70" fill="white" stroke="#D1D5DB" strokeWidth="1"/>
        <rect x="2" y="2" width="86" height="10" fill={blue} stroke="none"/>
        <rect x="2" y="14" width="86" height="5" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="2" y="21" width="86" height="3" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="2" y="26" width="86" height="3" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="2" y="31" width="86" height="3" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="2" y="36" width="86" height="3" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="55" y="42" width="33" height="6" fill="#EFF6FF" stroke={blue} strokeWidth="0.5"/>
        <rect x="2" y="52" width="86" height="8" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="0.5"/>
      </svg>
    ),
    landscape2: (
      <svg viewBox="0 0 90 70" className="w-full h-full">
        <rect width="90" height="70" fill="white" stroke="#D1D5DB" strokeWidth="1"/>
        <rect x="2" y="2" width="86" height="10" fill="#111827" stroke="none"/>
        <rect x="2" y="14" width="40" height="18" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="44" y="14" width="44" height="18" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="2" y="34" width="86" height="4" fill="#EFF6FF" stroke={blue} strokeWidth="0.5"/>
        <rect x="2" y="40" width="86" height="3" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="2" y="45" width="86" height="3" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="55" y="51" width="33" height="5" fill="#EFF6FF" stroke={blue} strokeWidth="0.5"/>
        <rect x="2" y="59" width="86" height="8" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="0.5"/>
      </svg>
    ),
    gst1: (
      <svg viewBox="0 0 80 90" className="w-full h-full">
        <rect width="80" height="90" fill="white" stroke="#D1D5DB" strokeWidth="1"/>
        <rect x="2" y="2" width="76" height="6" fill="#1E40AF" stroke="none"/>
        <rect x="2" y="10" width="36" height="12" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="40" y="10" width="38" height="12" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="2" y="24" width="76" height="5" fill="#EFF6FF" stroke={blue} strokeWidth="0.5"/>
        <rect x="2" y="31" width="76" height="4" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="2" y="37" width="76" height="4" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="2" y="43" width="76" height="4" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="2" y="49" width="76" height="4" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="50" y="56" width="28" height="7" fill="#EFF6FF" stroke={blue} strokeWidth="0.5"/>
        <rect x="2" y="66" width="76" height="10" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="2" y="78" width="76" height="10" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="0.5"/>
      </svg>
    ),
    gst2: (
      <svg viewBox="0 0 80 90" className="w-full h-full">
        <rect width="80" height="90" fill="white" stroke="#D1D5DB" strokeWidth="1"/>
        <rect x="2" y="2" width="76" height="18" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="2" y="22" width="76" height="5" fill={blue} stroke="none"/>
        <rect x="2" y="29" width="76" height="4" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="2" y="35" width="76" height="4" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="2" y="41" width="76" height="4" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="50" y="48" width="28" height="7" fill="#EFF6FF" stroke={blue} strokeWidth="0.5"/>
        <rect x="2" y="57" width="76" height="10" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="0.5"/>
      </svg>
    ),
    gst3: (
      <svg viewBox="0 0 80 90" className="w-full h-full">
        <rect width="80" height="90" fill="white" stroke="#D1D5DB" strokeWidth="1"/>
        <rect x="2" y="2" width="20" height="14" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="24" y="2" width="54" height="14" fill="#EFF6FF" stroke={blue} strokeWidth="0.5"/>
        <rect x="2" y="18" width="76" height="5" fill="#111827" stroke="none"/>
        <rect x="2" y="25" width="76" height="4" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="2" y="31" width="76" height="4" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="2" y="37" width="76" height="4" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="2" y="43" width="76" height="4" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="50" y="50" width="28" height="7" fill="#EFF6FF" stroke={blue} strokeWidth="0.5"/>
        <rect x="2" y="60" width="76" height="10" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="0.5"/>
      </svg>
    ),
    modern: (
      <svg viewBox="0 0 80 90" className="w-full h-full">
        <rect width="80" height="90" fill="white" stroke="#D1D5DB" strokeWidth="1"/>
        <rect x="0" y="0" width="80" height="20" fill="#1E293B" stroke="none"/>
        <circle cx="10" cy="10" r="6" fill="white" opacity="0.2"/>
        <rect x="2" y="22" width="76" height="4" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="2" y="28" width="76" height="4" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="2" y="34" width="76" height="4" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="2" y="40" width="76" height="4" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="50" y="47" width="28" height="7" fill="#EFF6FF" stroke={blue} strokeWidth="0.5"/>
        <rect x="2" y="57" width="76" height="10" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="0.5"/>
      </svg>
    ),
    minimalist: (
      <svg viewBox="0 0 80 90" className="w-full h-full">
        <rect width="80" height="90" fill="white" stroke="#D1D5DB" strokeWidth="1"/>
        <line x1="2" y1="20" x2="78" y2="20" stroke="#111827" strokeWidth="2"/>
        <rect x="2" y="2" width="30" height="14" fill="none" stroke="#D1D5DB" strokeWidth="0.5"/>
        <rect x="2" y="24" width="76" height="4" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="2" y="30" width="76" height="4" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="2" y="36" width="76" height="4" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="2" y="42" width="76" height="4" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="50" y="49" width="28" height="7" fill="none" stroke="#111827" strokeWidth="0.8"/>
        <line x1="2" y1="59" x2="78" y2="59" stroke="#111827" strokeWidth="1"/>
      </svg>
    ),
  };
  return svgs[id] || svgs.tally;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Reusable UI Atoms
───────────────────────────────────────────────────────────────────────────── */
function InfoTooltip({ text }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative inline-flex" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      <Info className="w-[14px] h-[14px] text-gray-400 cursor-help flex-shrink-0" />
      {visible && text && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 w-48 rounded bg-gray-800 px-2 py-1 text-[11px] text-white shadow-lg whitespace-normal">
          {text}
        </span>
      )}
    </span>
  );
}

function Divider() {
  return <hr className="border-t border-gray-200 my-4" />;
}

function SettingsSection({ title, children }) {
  return (
    <div className="py-5">
      <h3 className="text-[15px] font-bold text-gray-900 mb-3">{title}</h3>
      <Divider />
      {children}
    </div>
  );
}

function CBRow({ checked, onChange, label, info, children }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-[18px] h-[18px] rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors duration-150 ${
          checked ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'
        }`}
      >
        {checked && <Check className="w-3 h-3 text-white stroke-[3]" />}
      </button>
      <span className="text-[13px] text-gray-800 select-none flex items-center gap-1.5">
        {label}
        {info && <InfoTooltip text={typeof info === 'string' ? info : ''} />}
      </span>
      {children}
    </div>
  );
}

function FloatingInput({ label, value, onChange, type = 'text', placeholder, className = '', readOnly }) {
  return (
    <div className={`relative border border-gray-300 rounded-[6px] h-11 ${className}`} style={{ background: '#fff' }}>
      {label && (
        <span className="absolute -top-2.5 left-3 bg-white px-1 text-[11px] text-gray-500 font-medium leading-none">
          {label}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder || label}
        readOnly={readOnly}
        className="w-full h-full px-3 text-[13px] text-gray-800 outline-none bg-transparent rounded-[6px] placeholder-gray-400"
      />
    </div>
  );
}

function DropdownSetting({ label, value, onChange, options, info, inline = true }) {
  if (inline) {
    return (
      <div className="flex items-center justify-between py-2.5">
        <span className="text-[13px] text-gray-800 flex items-center gap-1.5">
          {label}
          {info && <InfoTooltip text={info} />}
        </span>
        <div className="relative">
          <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className="appearance-none border border-gray-300 rounded-[6px] h-9 pl-3 pr-8 text-[13px] text-gray-800 bg-white outline-none cursor-pointer focus:border-blue-500 transition-colors min-w-[120px]"
          >
            {options.map(o => (
              <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
                {typeof o === 'string' ? o : o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1 py-2">
      <span className="text-[12px] text-gray-500 font-medium">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="appearance-none w-full border border-gray-300 rounded-[6px] h-11 pl-3 pr-8 text-[13px] text-gray-800 bg-white outline-none cursor-pointer focus:border-blue-500 transition-colors"
        >
          {options.map(o => (
            <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
              {typeof o === 'string' ? o : o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      </div>
    </div>
  );
}

function NumberStepper({ label, value, onChange, min = 0, max = 200, info }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="text-[13px] text-gray-800 flex items-center gap-1.5">
        {label}
        {info && <InfoTooltip text={info} />}
      </span>
      <div className="flex items-center border border-gray-300 rounded-[6px] overflow-hidden ml-1">
        <input
          type="number"
          value={value}
          onChange={e => onChange(Math.min(max, Math.max(min, Number(e.target.value))))}
          className="w-12 h-7 text-center text-[13px] text-gray-800 outline-none border-none bg-white"
        />
        <div className="flex flex-col border-l border-gray-300">
          <button
            type="button"
            onClick={() => onChange(Math.min(max, value + 1))}
            className="h-3.5 w-6 flex items-center justify-center hover:bg-gray-100 transition-colors border-b border-gray-200"
          >
            <svg width="8" height="5" viewBox="0 0 8 5"><path d="M1 4L4 1L7 4" stroke="#6B7280" strokeWidth="1.5" fill="none"/></svg>
          </button>
          <button
            type="button"
            onClick={() => onChange(Math.max(min, value - 1))}
            className="h-3.5 w-6 flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <svg width="8" height="5" viewBox="0 0 8 5"><path d="M1 1L4 4L7 1" stroke="#6B7280" strokeWidth="1.5" fill="none"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Layout Theme Selector
───────────────────────────────────────────────────────────────────────────── */
function ThemeSelector({ selected, onSelect }) {
  const scrollRef = useRef(null);
  const scroll = (dir) => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: dir * 140, behavior: 'smooth' });
  };
  return (
    <div className="relative flex items-center gap-2 py-4">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {THEMES.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.name)}
            className={`flex-shrink-0 flex flex-col items-center rounded-[6px] border-2 transition-all duration-150 cursor-pointer overflow-hidden
              ${selected === t.name
                ? 'border-blue-600 bg-[#ECECEC]'
                : 'border-gray-200 bg-white hover:border-gray-300'}`}
            style={{ width: 120, minHeight: 140 }}
          >
            <div className="w-full p-2" style={{ height: 100 }}>
              <ThemePreviewSVG id={t.id} />
            </div>
            <div className="w-full text-center text-[12px] font-medium text-gray-700 px-1 py-1.5 leading-tight">
              {t.name}
            </div>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => scroll(1)}
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 shadow-sm"
      >
        <ChevronRight className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Logo Uploader
───────────────────────────────────────────────────────────────────────────── */
function LogoUploader({ logoUrl, onUpload, onRemove }) {
  const fileRef = useRef(null);
  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => onUpload(ev.target.result);
    reader.readAsDataURL(f);
    e.target.value = '';
  };
  return (
    <div>
      <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.svg" className="hidden" onChange={handleFile} />
      {logoUrl ? (
        <div className="flex items-center gap-3 mt-2">
          <img src={logoUrl} alt="Logo" className="h-10 w-auto max-w-[80px] object-contain border border-gray-200 rounded p-1" />
          <button type="button" onClick={() => fileRef.current?.click()} className="text-[12px] text-blue-600 hover:underline">Change</button>
          <button type="button" onClick={onRemove} className="text-[12px] text-red-500 hover:underline">Remove</button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mt-2 flex items-center gap-2 border border-dashed border-gray-300 rounded-[6px] px-4 py-2 text-[12px] text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          <Upload className="w-3.5 h-3.5" /> Upload Logo
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Transaction Names Modal
───────────────────────────────────────────────────────────────────────────── */
function TransactionNamesModal({ open, onClose, names, onChange }) {
  const [local, setLocal] = useState({ ...names });
  useEffect(() => { setLocal({ ...names }); }, [names, open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-[16px] font-bold text-gray-900">Transaction Names</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {Object.entries(local).map(([key, val]) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-[13px] text-gray-600 w-36 flex-shrink-0">{key}</span>
              <input
                value={val}
                onChange={e => setLocal(p => ({ ...p, [key]: e.target.value }))}
                className="flex-1 border border-gray-300 rounded-[6px] h-9 px-3 text-[13px] text-gray-800 outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
          <button
            onClick={() => { onChange(local); onClose(); }}
            className="px-5 py-2 bg-blue-600 text-white text-[13px] font-semibold rounded-[6px] hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Item Table Customization Modal
───────────────────────────────────────────────────────────────────────────── */
function ItemTableModal({ open, onClose }) {
  if (!open) return null;
  const cols = ['Sr. No.', 'Item Name', 'Item Code', 'HSN/SAC', 'MRP', 'Qty', 'Unit', 'Rate', 'Discount', 'Tax%', 'Tax Amt', 'Amount'];
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-[16px] font-bold text-gray-900">Item Table Columns</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {cols.map(c => (
            <label key={c} className="flex items-center gap-3 cursor-pointer py-1">
              <span className="w-5 h-5 rounded border-2 border-blue-500 bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-white stroke-[3]" />
              </span>
              <span className="text-[13px] text-gray-800">{c}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-gray-600 hover:text-gray-900">Cancel</button>
          <button onClick={onClose} className="px-5 py-2 bg-blue-600 text-white text-[13px] font-semibold rounded-[6px] hover:bg-blue-700">Save</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Color Picker row
───────────────────────────────────────────────────────────────────────────── */
function ColorRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-[13px] text-gray-800">{label}</span>
      <label className="flex items-center gap-2 cursor-pointer">
        <div className="w-8 h-8 rounded-[6px] border border-gray-300 overflow-hidden shadow-sm">
          <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-full h-full cursor-pointer opacity-0 absolute" style={{ width: 32, height: 32 }} />
          <div style={{ background: value }} className="w-full h-full" />
        </div>
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="sr-only"
          id={`color-${label}`}
        />
        <label htmlFor={`color-${label}`}>
          <span className="text-[12px] text-blue-600 cursor-pointer hover:underline">{value}</span>
        </label>
      </label>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Regular Printer Content
───────────────────────────────────────────────────────────────────────────── */
function RegularPrinterPanel({ s, set }) {
  const [subTab, setSubTab] = useState('layout');
  const [txnModal, setTxnModal] = useState(false);
  const [itemTableModal, setItemTableModal] = useState(false);

  const upd = useCallback((key, val) => set(prev => ({ ...prev, [key]: val })), [set]);

  return (
    <div className="bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Sub tabs: CHANGE LAYOUT | CHANGE COLORS */}
      <div className="border-b border-gray-200">
        {['layout', 'colors'].map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setSubTab(tab)}
            className={`px-5 py-3.5 text-[13px] font-semibold transition-all duration-150 ${
              subTab === tab
                ? 'text-pink-600 border-b-2 border-[#E91E63]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'layout' ? 'CHANGE LAYOUT' : 'CHANGE COLORS'}
          </button>
        ))}
      </div>

      {/* CHANGE LAYOUT TAB */}
      {subTab === 'layout' && (
        <div className="px-8 py-2 max-w-[820px]">
          <ThemeSelector selected={s.selectedLayout} onSelect={v => upd('selectedLayout', v)} />

          {/* ── Print Company Info / Header ── */}
          <SettingsSection title="Print Company Info / Header">
            <CBRow checked={s.makeDefault} onChange={v => upd('makeDefault', v)} label="Make Regular Printer Default" info="Sets this as the default printer" />
            <CBRow checked={s.repeatHeader} onChange={v => upd('repeatHeader', v)} label="Print repeat header in all pages" info="Repeats company header on each page" />

            {/* Company Name */}
            <div className="flex items-center gap-3 py-2.5">
              <button type="button" onClick={() => upd('printCompanyName', !s.printCompanyName)}
                className={`w-[18px] h-[18px] rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${s.printCompanyName ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'}`}>
                {s.printCompanyName && <Check className="w-3 h-3 text-white stroke-[3]" />}
              </button>
              <div className="flex-1">
                <FloatingInput
                  label="Company Name"
                  value={s.companyName}
                  onChange={e => upd('companyName', e.target.value)}
                />
              </div>
              <InfoTooltip text="Company name shown on invoice header" />
            </div>

            {/* Company Logo */}
            <div className="py-2.5">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => upd('printLogo', !s.printLogo)}
                  className={`w-[18px] h-[18px] rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${s.printLogo ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'}`}>
                  {s.printLogo && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </button>
                <span className="text-[13px] text-gray-800">Company Logo</span>
                <button type="button" onClick={() => document.getElementById('logo-upload')?.click()}
                  className="text-[13px] text-blue-600 hover:underline font-medium">(Change)</button>
                <InfoTooltip text="Upload PNG, JPG, JPEG or SVG" />
              </div>
              <input id="logo-upload" type="file" accept=".png,.jpg,.jpeg,.svg" className="hidden"
                onChange={e => {
                  const f = e.target.files[0];
                  if (f) { const r = new FileReader(); r.onload = ev => upd('logoUrl', ev.target.result); r.readAsDataURL(f); }
                  e.target.value = '';
                }} />
              {s.logoUrl && (
                <div className="flex items-center gap-3 mt-2 ml-9">
                  <img src={s.logoUrl} alt="Logo" className="h-10 w-auto max-w-[80px] object-contain border border-gray-200 rounded p-1" />
                  <button onClick={() => upd('logoUrl', '')} className="text-[12px] text-red-500 hover:underline">Remove</button>
                </div>
              )}
            </div>

            {/* Address */}
            <div className="flex items-center gap-3 py-2.5">
              <button type="button" onClick={() => upd('printAddress', !s.printAddress)}
                className={`w-[18px] h-[18px] rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${s.printAddress ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'}`}>
                {s.printAddress && <Check className="w-3 h-3 text-white stroke-[3]" />}
              </button>
              <FloatingInput className="flex-1" placeholder="Address" value={s.address} onChange={e => upd('address', e.target.value)} />
              <InfoTooltip text="Business address on invoice" />
            </div>

            {/* Email */}
            <div className="flex items-center gap-3 py-2.5">
              <button type="button" onClick={() => upd('printEmail', !s.printEmail)}
                className={`w-[18px] h-[18px] rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${s.printEmail ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'}`}>
                {s.printEmail && <Check className="w-3 h-3 text-white stroke-[3]" />}
              </button>
              <FloatingInput className="flex-1" placeholder="Email" value={s.email} onChange={e => upd('email', e.target.value)} />
              <InfoTooltip text="Business email on invoice" />
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3 py-2.5">
              <button type="button" onClick={() => upd('printPhone', !s.printPhone)}
                className={`w-[18px] h-[18px] rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${s.printPhone ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'}`}>
                {s.printPhone && <Check className="w-3 h-3 text-white stroke-[3]" />}
              </button>
              <FloatingInput className="flex-1" label="Phone Number" value={s.phone} onChange={e => upd('phone', e.target.value.replace(/\D/g, ''))} type="tel" />
              <InfoTooltip text="Phone number shown on invoice" />
            </div>

            {/* GSTIN */}
            <div className="flex items-center gap-3 py-2.5">
              <button type="button" onClick={() => upd('printGSTIN', !s.printGSTIN)}
                className={`w-[18px] h-[18px] rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${s.printGSTIN ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'}`}>
                {s.printGSTIN && <Check className="w-3 h-3 text-white stroke-[3]" />}
              </button>
              <FloatingInput className="flex-1" placeholder="GSTIN on Sale" value={s.gstin} onChange={e => upd('gstin', e.target.value.toUpperCase())} />
              <InfoTooltip text="GST number displayed on invoice" />
            </div>
          </SettingsSection>

          {/* ── Paper Settings ── */}
          <SettingsSection title="">
            <DropdownSetting label="Paper Size" value={s.paperSize} onChange={v => upd('paperSize', v)}
              options={['A4', 'A5', 'Letter', 'Legal']} info="Select paper size for printing" />
            <Divider />
            <DropdownSetting label="Orientation" value={s.orientation} onChange={v => upd('orientation', v)}
              options={['Portrait', 'Landscape']} info="Page orientation" />
            <Divider />
            <DropdownSetting label="Company Name Text Size" value={s.companyNameTextSize} onChange={v => upd('companyNameTextSize', v)}
              options={['Small', 'Medium', 'Large', 'Extra Large']} info="Font size for company name" />
            <Divider />
            <DropdownSetting label="Invoice Text Size" value={s.invoiceTextSize} onChange={v => upd('invoiceTextSize', v)}
              options={['Small', 'Medium', 'Large']} info="Font size for invoice text" />
            <Divider />
            <CBRow checked={s.printDuplicate} onChange={v => upd('printDuplicate', v)} label="Print Original/Duplicate" info="Prints Original and Duplicate copies" />
            <div className="flex items-center gap-3 py-2">
              <span className="text-[13px] text-gray-800 flex items-center gap-1.5">
                Extra space on Top of PDF <InfoTooltip text="Adds blank space at top of PDF" />
              </span>
              <NumberStepper label="" value={s.extraSpaceTop} onChange={v => upd('extraSpaceTop', v)} min={0} max={200} />
            </div>
            <button type="button" onClick={() => setTxnModal(true)} className="text-[13px] text-blue-600 hover:underline font-medium py-1 flex items-center gap-0.5">
              Change Transaction Names <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </SettingsSection>

          {/* ── Item Table ── */}
          <SettingsSection title="Item Table">
            <CBRow checked={s.expandTable} onChange={v => upd('expandTable', v)} label="Expand table to print on whole page" info="Table expands to fill entire page" />
            <div className="flex items-center gap-3 py-2.5">
              <span className="text-[13px] text-gray-800 flex items-center gap-1.5">
                Min No. of Rows in Item Table <InfoTooltip text="Minimum rows shown in item table" />
              </span>
              <div className="border border-gray-300 rounded-[6px] ml-2">
                <input type="number" value={s.minTableRows} min={0}
                  onChange={e => upd('minTableRows', Math.max(0, Number(e.target.value)))}
                  className="w-12 h-7 text-center text-[13px] outline-none bg-transparent" />
              </div>
            </div>
            <button type="button" onClick={() => setItemTableModal(true)} className="text-[13px] text-blue-600 hover:underline font-medium py-1 flex items-center gap-0.5">
              Item Table Customization <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </SettingsSection>

          {/* ── Totals & Taxes ── */}
          <SettingsSection title="Totals &amp; Taxes">
            <CBRow checked={s.totalItemQuantity} onChange={v => upd('totalItemQuantity', v)} label="Total Item Quantity" info="Show total qty in invoice footer" />
            <CBRow checked={s.amountWithDecimal} onChange={v => upd('amountWithDecimal', v)}
              label={<>Amount with Decimal <span className="text-[12px] text-gray-400 ml-1">e.g. 0.00</span></>} info="Show amounts with decimal places" />
            <CBRow checked={s.receivedAmount} onChange={v => upd('receivedAmount', v)} label="Received Amount" info="Show received amount on invoice" />
            <CBRow checked={s.balanceAmount} onChange={v => upd('balanceAmount', v)} label="Balance Amount" info="Show outstanding balance" />
            <CBRow checked={s.currentBalanceParty} onChange={v => upd('currentBalanceParty', v)} label="Current Balance of Party" info="Show party's current balance" />
            <CBRow checked={s.taxDetails} onChange={v => upd('taxDetails', v)} label="Tax Details" info="Show tax breakdown" />
            <CBRow checked={s.youSaved} onChange={v => upd('youSaved', v)} label="You Saved" info="Show discount savings" />
            <CBRow checked={s.printAmountWithGrouping} onChange={v => upd('printAmountWithGrouping', v)} label="Print Amount with Grouping" info="Use number grouping (1,00,000)" />
            <DropdownSetting label="Amount in Words" value={s.amountInWords} onChange={v => upd('amountInWords', v)}
              options={['Indian', 'International']} info="Format for amount in words" />
          </SettingsSection>

          {/* ── Footer ── */}
          <SettingsSection title="Footer">
            <CBRow checked={s.printDescription} onChange={v => upd('printDescription', v)} label="Print Description" info="Print item descriptions" />
            <CBRow checked={s.printTermsAndConditions} onChange={v => upd('printTermsAndConditions', v)} label="Print Terms and Conditions" info="Show T&C on invoice" />
            <CBRow checked={s.printReceivedBy} onChange={v => upd('printReceivedBy', v)} label="Print Received by details" info="Show receiver signature field" />
            <CBRow checked={s.printDeliveredBy} onChange={v => upd('printDeliveredBy', v)} label="Print Delivered by details" info="Show delivery signature field" />

            {/* Signature */}
            <div className="flex items-center gap-3 py-2.5">
              <button type="button" onClick={() => upd('printSignature', !s.printSignature)}
                className={`w-[18px] h-[18px] rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${s.printSignature ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'}`}>
                {s.printSignature && <Check className="w-3 h-3 text-white stroke-[3]" />}
              </button>
              <FloatingInput label="Print Signature Text" value={s.signatureText} onChange={e => upd('signatureText', e.target.value)} className="w-48" />
              <InfoTooltip text="Signature text shown on invoice footer" />
              <button type="button" className="text-[13px] text-blue-600 hover:underline ml-1">Change Signature</button>
            </div>

            <CBRow checked={s.paymentMode} onChange={v => upd('paymentMode', v)} label="Payment Mode" info="Show payment method on invoice" />
            <CBRow checked={s.printAcknowledgement} onChange={v => upd('printAcknowledgement', v)} label="Print Acknowledgement" info="Add acknowledgement section" />
          </SettingsSection>

          <div className="pb-10" />
        </div>
      )}

      {/* CHANGE COLORS TAB */}
      {subTab === 'colors' && (
        <div className="px-8 py-2 max-w-[820px]">

          {/* ── Circular swatch palette ── */}
          <div className="py-5">
            {[
              [
                '#F5D020','#008080','#9E9E9E','#616161','#6B6B3A','#9B8EC4',
                '#00BCD4','#388E3C','#8BC34A','#795548','#9C27B0','#880E4F',
                '#6D4C41','#E64A19',
              ],
              [
                '#AB47BC','#E91E63','#D4A054','#C8A84B','#F48FB1','#FF9800',
                '#D32F2F','#FF5722','#3E2723','#FFFFFF',
              ],
            ].map((row, ri) => (
              <div key={ri} className="flex flex-wrap gap-2.5 mb-3">
                {row.map(color => {
                  const selected = s.primaryColor === color;
                  const isLight = color === '#FFFFFF' || color === '#F5D020' || color === '#F48FB1' || color === '#8BC34A';
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => upd('primaryColor', color)}
                      title={color}
                      className="relative flex-shrink-0 transition-transform duration-100 active:scale-90"
                      style={{ width: 34, height: 34 }}
                    >
                      {/* Outer ring for selected state */}
                      {selected && (
                        <span
                          className="absolute inset-0 rounded-full"
                          style={{
                            border: `2.5px solid ${color === '#FFFFFF' ? '#9CA3AF' : color}`,
                            transform: 'scale(1.3)',
                            opacity: 0.55,
                          }}
                        />
                      )}
                      <span
                        className="block w-full h-full rounded-full shadow-sm"
                        style={{
                          background: color,
                          border: isLight ? '1px solid #D1D5DB' : 'none',
                          outline: selected ? `2px solid ${color === '#FFFFFF' ? '#9CA3AF' : color}` : 'none',
                          outlineOffset: selected ? '2px' : '0',
                        }}
                      />
                      {selected && (
                        <Check
                          className="absolute inset-0 m-auto w-4 h-4 stroke-[3]"
                          style={{ color: isLight ? '#374151' : '#FFFFFF' }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* ── Print Company Info / Header ── */}
          <SettingsSection title="Print Company Info / Header">
            <CBRow checked={s.makeDefault} onChange={v => upd('makeDefault', v)} label="Make Regular Printer Default" info="Sets this as the default printer" />
            <CBRow checked={s.repeatHeader} onChange={v => upd('repeatHeader', v)} label="Print repeat header in all pages" info="Repeats company header on each page" />

            {/* Company Name */}
            <div className="flex items-center gap-3 py-2.5">
              <button type="button" onClick={() => upd('printCompanyName', !s.printCompanyName)}
                className={`w-[18px] h-[18px] rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${s.printCompanyName ? 'border-blue-600' : 'bg-white border-gray-400'}`}
                style={{ background: s.printCompanyName ? s.primaryColor : '' }}>
                {s.printCompanyName && <Check className="w-3 h-3 text-white stroke-[3]" />}
              </button>
              <div className="flex-1">
                <FloatingInput label="Company Name" value={s.companyName} onChange={e => upd('companyName', e.target.value)} />
              </div>
              <InfoTooltip text="Company name shown on invoice header" />
            </div>

            {/* Company Logo */}
            <div className="py-2.5">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => upd('printLogo', !s.printLogo)}
                  className={`w-[18px] h-[18px] rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${s.printLogo ? 'border-blue-600' : 'bg-white border-gray-400'}`}
                  style={{ background: s.printLogo ? s.primaryColor : '' }}>
                  {s.printLogo && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </button>
                <span className="text-[13px] text-gray-800">Company Logo</span>
                <button type="button" onClick={() => document.getElementById('logo-upload-c')?.click()}
                  className="text-[13px] hover:underline font-medium" style={{ color: s.primaryColor }}>(Change)</button>
                <InfoTooltip text="Upload PNG, JPG, JPEG or SVG" />
              </div>
              <input id="logo-upload-c" type="file" accept=".png,.jpg,.jpeg,.svg" className="hidden"
                onChange={e => {
                  const f = e.target.files[0];
                  if (f) { const r = new FileReader(); r.onload = ev => upd('logoUrl', ev.target.result); r.readAsDataURL(f); }
                  e.target.value = '';
                }} />
              {s.logoUrl && (
                <div className="flex items-center gap-3 mt-2 ml-9">
                  <img src={s.logoUrl} alt="Logo" className="h-10 w-auto max-w-[80px] object-contain border border-gray-200 rounded p-1" />
                  <button onClick={() => upd('logoUrl', '')} className="text-[12px] text-red-500 hover:underline">Remove</button>
                </div>
              )}
            </div>

            {/* Address */}
            <div className="flex items-center gap-3 py-2.5">
              <button type="button" onClick={() => upd('printAddress', !s.printAddress)}
                className={`w-[18px] h-[18px] rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors`}
                style={{ background: s.printAddress ? s.primaryColor : '#fff', borderColor: s.printAddress ? s.primaryColor : '#9CA3AF' }}>
                {s.printAddress && <Check className="w-3 h-3 text-white stroke-[3]" />}
              </button>
              <FloatingInput className="flex-1" placeholder="Address" value={s.address} onChange={e => upd('address', e.target.value)} />
              <InfoTooltip text="Business address on invoice" />
            </div>

            {/* Email */}
            <div className="flex items-center gap-3 py-2.5">
              <button type="button" onClick={() => upd('printEmail', !s.printEmail)}
                className="w-[18px] h-[18px] rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors"
                style={{ background: s.printEmail ? s.primaryColor : '#fff', borderColor: s.printEmail ? s.primaryColor : '#9CA3AF' }}>
                {s.printEmail && <Check className="w-3 h-3 text-white stroke-[3]" />}
              </button>
              <FloatingInput className="flex-1" placeholder="Email" value={s.email} onChange={e => upd('email', e.target.value)} />
              <InfoTooltip text="Business email on invoice" />
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3 py-2.5">
              <button type="button" onClick={() => upd('printPhone', !s.printPhone)}
                className="w-[18px] h-[18px] rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors"
                style={{ background: s.printPhone ? s.primaryColor : '#fff', borderColor: s.printPhone ? s.primaryColor : '#9CA3AF' }}>
                {s.printPhone && <Check className="w-3 h-3 text-white stroke-[3]" />}
              </button>
              <FloatingInput className="flex-1" label="Phone Number" value={s.phone} onChange={e => upd('phone', e.target.value.replace(/\D/g, ''))} type="tel" />
              <InfoTooltip text="Phone number shown on invoice" />
            </div>

            {/* GSTIN */}
            <div className="flex items-center gap-3 py-2.5">
              <button type="button" onClick={() => upd('printGSTIN', !s.printGSTIN)}
                className="w-[18px] h-[18px] rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors"
                style={{ background: s.printGSTIN ? s.primaryColor : '#fff', borderColor: s.printGSTIN ? s.primaryColor : '#9CA3AF' }}>
                {s.printGSTIN && <Check className="w-3 h-3 text-white stroke-[3]" />}
              </button>
              <FloatingInput className="flex-1" placeholder="GSTIN on Sale" value={s.gstin} onChange={e => upd('gstin', e.target.value.toUpperCase())} />
              <InfoTooltip text="GST number displayed on invoice" />
            </div>
          </SettingsSection>

          {/* ── Paper Settings ── */}
          <SettingsSection title="">
            <DropdownSetting label="Paper Size" value={s.paperSize} onChange={v => upd('paperSize', v)} options={['A4', 'A5', 'Letter', 'Legal']} info="Select paper size for printing" />
            <Divider />
            <DropdownSetting label="Orientation" value={s.orientation} onChange={v => upd('orientation', v)} options={['Portrait', 'Landscape']} info="Page orientation" />
            <Divider />
            <DropdownSetting label="Company Name Text Size" value={s.companyNameTextSize} onChange={v => upd('companyNameTextSize', v)} options={['Small', 'Medium', 'Large', 'Extra Large']} info="Font size for company name" />
            <Divider />
            <DropdownSetting label="Invoice Text Size" value={s.invoiceTextSize} onChange={v => upd('invoiceTextSize', v)} options={['Small', 'Medium', 'Large']} info="Font size for invoice text" />
            <Divider />
            <CBRow checked={s.printDuplicate} onChange={v => upd('printDuplicate', v)} label="Print Original/Duplicate" info="Prints Original and Duplicate copies" />
            <div className="flex items-center gap-3 py-2">
              <span className="text-[13px] text-gray-800 flex items-center gap-1.5">
                Extra space on Top of PDF <InfoTooltip text="Adds blank space at top of PDF" />
              </span>
              <NumberStepper label="" value={s.extraSpaceTop} onChange={v => upd('extraSpaceTop', v)} min={0} max={200} />
            </div>
            <button type="button" onClick={() => setTxnModal(true)}
              className="text-[13px] hover:underline font-medium py-1 flex items-center gap-0.5"
              style={{ color: s.primaryColor }}>
              Change Transaction Names <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </SettingsSection>

          {/* ── Item Table ── */}
          <SettingsSection title="Item Table">
            <CBRow checked={s.expandTable} onChange={v => upd('expandTable', v)} label="Expand table to print on whole page" info="Table expands to fill entire page" />
            <div className="flex items-center gap-3 py-2.5">
              <span className="text-[13px] text-gray-800 flex items-center gap-1.5">
                Min No. of Rows in Item Table <InfoTooltip text="Minimum rows shown in item table" />
              </span>
              <div className="border border-gray-300 rounded-[6px] ml-2">
                <input type="number" value={s.minTableRows} min={0}
                  onChange={e => upd('minTableRows', Math.max(0, Number(e.target.value)))}
                  className="w-12 h-7 text-center text-[13px] outline-none bg-transparent" />
              </div>
            </div>
            <button type="button" onClick={() => setItemTableModal(true)}
              className="text-[13px] hover:underline font-medium py-1 flex items-center gap-0.5"
              style={{ color: s.primaryColor }}>
              Item Table Customization <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </SettingsSection>

          {/* ── Totals & Taxes ── */}
          <SettingsSection title="Totals &amp; Taxes">
            <CBRow checked={s.totalItemQuantity} onChange={v => upd('totalItemQuantity', v)} label="Total Item Quantity" info="Show total qty in invoice footer" />
            <CBRow checked={s.amountWithDecimal} onChange={v => upd('amountWithDecimal', v)}
              label={<>Amount with Decimal <span className="text-[12px] text-gray-400 ml-1">e.g. 0.00</span></>} info="Show amounts with decimal places" />
            <CBRow checked={s.receivedAmount} onChange={v => upd('receivedAmount', v)} label="Received Amount" info="Show received amount on invoice" />
            <CBRow checked={s.balanceAmount} onChange={v => upd('balanceAmount', v)} label="Balance Amount" info="Show outstanding balance" />
            <CBRow checked={s.currentBalanceParty} onChange={v => upd('currentBalanceParty', v)} label="Current Balance of Party" info="Show party's current balance" />
            <CBRow checked={s.taxDetails} onChange={v => upd('taxDetails', v)} label="Tax Details" info="Show tax breakdown" />
            <CBRow checked={s.youSaved} onChange={v => upd('youSaved', v)} label="You Saved" info="Show discount savings" />
            <CBRow checked={s.printAmountWithGrouping} onChange={v => upd('printAmountWithGrouping', v)} label="Print Amount with Grouping" info="Use number grouping (1,00,000)" />
            <DropdownSetting label="Amount in Words" value={s.amountInWords} onChange={v => upd('amountInWords', v)} options={['Indian', 'International']} info="Format for amount in words" />
          </SettingsSection>

          {/* ── Footer ── */}
          <SettingsSection title="Footer">
            <CBRow checked={s.printDescription} onChange={v => upd('printDescription', v)} label="Print Description" info="Print item descriptions" />
            <CBRow checked={s.printTermsAndConditions} onChange={v => upd('printTermsAndConditions', v)} label="Print Terms and Conditions" info="Show T&C on invoice" />
            <CBRow checked={s.printReceivedBy} onChange={v => upd('printReceivedBy', v)} label="Print Received by details" info="Show receiver signature field" />
            <CBRow checked={s.printDeliveredBy} onChange={v => upd('printDeliveredBy', v)} label="Print Delivered by details" info="Show delivery signature field" />
            <div className="flex items-center gap-3 py-2.5">
              <button type="button" onClick={() => upd('printSignature', !s.printSignature)}
                className="w-[18px] h-[18px] rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors"
                style={{ background: s.printSignature ? s.primaryColor : '#fff', borderColor: s.printSignature ? s.primaryColor : '#9CA3AF' }}>
                {s.printSignature && <Check className="w-3 h-3 text-white stroke-[3]" />}
              </button>
              <FloatingInput label="Print Signature Text" value={s.signatureText} onChange={e => upd('signatureText', e.target.value)} className="w-48" />
              <InfoTooltip text="Signature text shown on invoice footer" />
              <button type="button" className="text-[13px] hover:underline ml-1" style={{ color: s.primaryColor }}>Change Signature</button>
            </div>
            <CBRow checked={s.paymentMode} onChange={v => upd('paymentMode', v)} label="Payment Mode" info="Show payment method on invoice" />
            <CBRow checked={s.printAcknowledgement} onChange={v => upd('printAcknowledgement', v)} label="Print Acknowledgement" info="Add acknowledgement section" />
          </SettingsSection>

          {/* ── Bank Details ── */}
          <SettingsSection title="Bank Details">
            <CBRow checked={s.printBankDetails} onChange={v => upd('printBankDetails', v)} label="Print Bank Details" info="Show bank info and QR code on invoice" />

            {s.printBankDetails && (
              <div className="ml-9 space-y-3 mt-2">
                {/* Bank Name */}
                <FloatingInput
                  label="Bank Name"
                  value={s.bankName}
                  onChange={e => upd('bankName', e.target.value)}
                  className="w-full"
                />

                {/* Account Number */}
                <FloatingInput
                  label="Bank Account Number"
                  value={s.bankAccountNumber}
                  onChange={e => upd('bankAccountNumber', e.target.value)}
                  className="w-full"
                />

                {/* IFSC Code */}
                <FloatingInput
                  label="Bank IFSC Code"
                  value={s.bankIfscCode}
                  onChange={e => upd('bankIfscCode', e.target.value.toUpperCase())}
                  className="w-full"
                />

                {/* QR Code Scanner / Photo */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <QrCode className="w-4 h-4 text-gray-500" />
                    <span className="text-[13px] font-semibold text-gray-700">Payment QR Code</span>
                    <InfoTooltip text="Upload or scan your UPI/bank QR code for invoices" />
                  </div>

                  {s.bankQrCodeUrl ? (
                    <div className="flex items-center gap-4">
                      <div className="relative w-24 h-24 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 p-1">
                        <img src={s.bankQrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-blue-600 border border-blue-200 rounded-[6px] hover:bg-blue-50 cursor-pointer transition-colors">
                          <Camera className="w-3.5 h-3.5" />
                          Change Photo
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={e => {
                              const f = e.target.files[0];
                              if (!f) return;
                              const reader = new FileReader();
                              reader.onload = ev => upd('bankQrCodeUrl', ev.target.result);
                              reader.readAsDataURL(f);
                              e.target.value = '';
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => upd('bankQrCodeUrl', '')}
                          className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-red-500 border border-red-200 rounded-[6px] hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-lg px-5 py-3 text-[12px] text-gray-500 hover:border-blue-400 hover:text-blue-600 cursor-pointer transition-colors">
                        <Upload className="w-4 h-4" />
                        Upload QR Image
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const f = e.target.files[0];
                            if (!f) return;
                            const reader = new FileReader();
                            reader.onload = ev => upd('bankQrCodeUrl', ev.target.result);
                            reader.readAsDataURL(f);
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <label className="flex items-center gap-2 border-2 border-dashed border-blue-300 rounded-lg px-5 py-3 text-[12px] text-blue-600 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors">
                        <Camera className="w-4 h-4" />
                        Scan with Camera
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={e => {
                            const f = e.target.files[0];
                            if (!f) return;
                            const reader = new FileReader();
                            reader.onload = ev => upd('bankQrCodeUrl', ev.target.result);
                            reader.readAsDataURL(f);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}
          </SettingsSection>

          <div className="pb-10" />
        </div>
      )}

      <TransactionNamesModal
        open={txnModal}
        onClose={() => setTxnModal(false)}
        names={s.transactionNames}
        onChange={v => upd('transactionNames', v)}
      />
      <ItemTableModal open={itemTableModal} onClose={() => setItemTableModal(false)} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Thermal Printer Theme Preview SVGs
───────────────────────────────────────────────────────────────────────────── */
function ThermalThemeSVG({ id }) {
  const svgs = {
    theme1: (
      <svg viewBox="0 0 60 80" className="w-full h-full">
        <rect width="60" height="80" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1"/>
        <rect x="5" y="5" width="50" height="8" fill="#E5E7EB" rx="1"/>
        <rect x="10" y="7" width="30" height="4" fill="#9CA3AF" rx="0.5"/>
        <line x1="5" y1="16" x2="55" y2="16" stroke="#D1D5DB" strokeWidth="0.5" strokeDasharray="2,2"/>
        <rect x="5" y="19" width="50" height="3" fill="#E5E7EB" rx="0.5"/>
        <rect x="5" y="24" width="50" height="3" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="5" y="29" width="50" height="3" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="5" y="34" width="50" height="3" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <line x1="5" y1="40" x2="55" y2="40" stroke="#D1D5DB" strokeWidth="0.5" strokeDasharray="2,2"/>
        <rect x="30" y="43" width="25" height="4" fill="#E5E7EB" rx="0.5"/>
        <line x1="5" y1="50" x2="55" y2="50" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="3,2"/>
      </svg>
    ),
    theme2: (
      <svg viewBox="0 0 60 80" className="w-full h-full">
        <rect width="60" height="80" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1"/>
        <rect x="5" y="5" width="50" height="10" fill="#6B7280" rx="1"/>
        <rect x="12" y="7.5" width="26" height="5" fill="#D1D5DB" rx="0.5"/>
        <line x1="5" y1="18" x2="55" y2="18" stroke="#D1D5DB" strokeWidth="0.5" strokeDasharray="2,2"/>
        <rect x="5" y="21" width="50" height="3" fill="#E5E7EB" rx="0.5"/>
        <rect x="5" y="26" width="50" height="3" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="5" y="31" width="50" height="3" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="5" y="36" width="50" height="3" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <line x1="5" y1="42" x2="55" y2="42" stroke="#D1D5DB" strokeWidth="0.5" strokeDasharray="2,2"/>
        <rect x="28" y="45" width="27" height="4" fill="#E5E7EB" rx="0.5"/>
        <line x1="5" y1="52" x2="55" y2="52" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="3,2"/>
      </svg>
    ),
    theme3: (
      <svg viewBox="0 0 60 80" className="w-full h-full">
        <rect width="60" height="80" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1"/>
        <circle cx="30" cy="11" r="6" fill="#E5E7EB"/>
        <rect x="5" y="20" width="50" height="4" fill="#E5E7EB" rx="0.5"/>
        <line x1="5" y1="27" x2="55" y2="27" stroke="#D1D5DB" strokeWidth="0.5" strokeDasharray="2,2"/>
        <rect x="5" y="30" width="50" height="3" fill="#F3F4F6" rx="0.5"/>
        <rect x="5" y="35" width="50" height="3" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="5" y="40" width="50" height="3" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="5" y="45" width="50" height="3" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <line x1="5" y1="51" x2="55" y2="51" stroke="#D1D5DB" strokeWidth="0.5" strokeDasharray="2,2"/>
        <rect x="28" y="54" width="27" height="4" fill="#E5E7EB" rx="0.5"/>
        <line x1="5" y1="61" x2="55" y2="61" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="3,2"/>
      </svg>
    ),
    theme4: (
      <svg viewBox="0 0 60 80" className="w-full h-full">
        <rect width="60" height="80" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1"/>
        <rect x="5" y="5" width="50" height="6" fill="#1F2937" rx="0.5"/>
        <rect x="5" y="13" width="50" height="8" fill="#F3F4F6" rx="0.5"/>
        <line x1="5" y1="24" x2="55" y2="24" stroke="#D1D5DB" strokeWidth="0.5" strokeDasharray="2,2"/>
        <rect x="5" y="27" width="50" height="3" fill="#F3F4F6" rx="0.5"/>
        <rect x="5" y="32" width="50" height="3" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="5" y="37" width="50" height="3" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <rect x="5" y="42" width="50" height="3" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
        <line x1="5" y1="48" x2="55" y2="48" stroke="#D1D5DB" strokeWidth="0.5" strokeDasharray="2,2"/>
        <rect x="28" y="51" width="27" height="4" fill="#E5E7EB" rx="0.5"/>
        <line x1="5" y1="58" x2="55" y2="58" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="3,2"/>
      </svg>
    ),
  };
  return svgs[id] || svgs.theme1;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Thermal Printer Content
───────────────────────────────────────────────────────────────────────────── */
function ThermalPrinterPanel({ s, set }) {
  const upd = useCallback((key, val) => set(prev => ({ ...prev, [key]: val })), [set]);
  const [txnModal, setTxnModal] = useState(false);

  const THERMAL_THEMES = [
    { id: 'theme1', name: 'Theme 1' },
    { id: 'theme2', name: 'Theme 2' },
    { id: 'theme3', name: 'Theme 3' },
    { id: 'theme4', name: 'Theme 4' },
  ];

  const PAGE_SIZES = [
    { id: '2inch', label: '2 Inch', sub: '58mm' },
    { id: '3inch', label: '3 Inch', sub: '68mm' },
    { id: '4inch', label: '4 Inch', sub: '88mm' },
    { id: 'custom', label: 'Custom', sub: '48', extra: '(Chars)' },
  ];

  // Derive receipt width from page size
  const receiptWidth = s.pageSize === '2inch' ? 160 : s.pageSize === '4inch' ? 240 : 200;

  return (
    <div className="bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Sub tab: CHANGE LAYOUT only */}
      <div className="border-b border-gray-200">
        <button
          type="button"
          className="px-5 py-3.5 text-[13px] font-semibold text-pink-600 border-b-2 border-[#E91E63]"
        >
          CHANGE LAYOUT
        </button>
      </div>

      <div className="px-8 py-4 max-w-[820px]">

        {/* ── Theme Cards ── */}
        <div className="flex items-center gap-3 py-4">
          {THERMAL_THEMES.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => upd('selectedTheme', t.id)}
              className={`flex flex-col items-center rounded-[6px] border-2 cursor-pointer overflow-hidden transition-all duration-150 ${
                s.selectedTheme === t.id
                  ? 'border-blue-500 bg-[#ECECEC]'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              style={{ width: 110, minHeight: 130 }}
            >
              <div className="w-full p-2" style={{ height: 98 }}>
                <ThermalThemeSVG id={t.id} />
              </div>
              <div className={`w-full text-center text-[12px] font-medium py-1.5 leading-tight ${
                s.selectedTheme === t.id ? 'text-orange-500' : 'text-gray-600'
              }`}>
                {t.name}
              </div>
            </button>
          ))}
          {/* scroll arrow */}
          <div className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-200 bg-white cursor-pointer hover:bg-gray-50 flex-shrink-0">
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </div>
        </div>

        {/* ── Make Thermal Printer Default ── */}
        <div className="py-3">
          <CBRow checked={s.makeDefault} onChange={v => upd('makeDefault', v)} label="Make Thermal Printer Default" info="Sets this thermal printer as the default" />
        </div>

        <Divider />

        {/* ── Page Size ── */}
        <div className="flex items-center gap-5 py-3">
          <span className="text-[13px] text-gray-800 font-medium w-20 flex-shrink-0">Page Size</span>
          <div className="flex border border-gray-300 rounded-[6px] overflow-hidden divide-x divide-gray-300">
            {PAGE_SIZES.map(ps => (
              <button
                key={ps.id}
                type="button"
                onClick={() => upd('pageSize', ps.id)}
                className={`flex flex-col items-center justify-center px-4 py-2 transition-colors duration-150 cursor-pointer min-w-[68px] ${
                  s.pageSize === ps.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className={`text-[12px] font-semibold leading-none ${
                  s.pageSize === ps.id ? 'text-white' : 'text-gray-800'
                }`}>{ps.label}</span>
                <span className={`text-[11px] leading-tight mt-0.5 ${
                  s.pageSize === ps.id ? 'text-blue-100' : 'text-gray-500'
                }`}>{ps.sub}</span>
                {ps.extra && (
                  <span className={`text-[10px] leading-tight ${
                    s.pageSize === ps.id ? 'text-blue-100' : 'text-gray-400'
                  }`}>{ps.extra}</span>
                )}
              </button>
            ))}
          </div>
          <InfoTooltip text="Select thermal paper roll width" />
        </div>

        <Divider />

        {/* ── Printing Type ── */}
        <DropdownSetting label="Printing Type" value={s.printingType} onChange={v => upd('printingType', v)}
          options={['Text Printing', 'Graphic Printing', 'Mixed']} info="Choose the printing mode" />

        <Divider />

        {/* ── Checkboxes ── */}
        <CBRow checked={s.useTextStyling} onChange={v => upd('useTextStyling', v)}
          label={<>Use Text Styling<strong>(Bold)</strong></>} info="Apply bold styling to text" />
        <CBRow checked={s.autoCutPaper} onChange={v => upd('autoCutPaper', v)}
          label="Auto Cut Paper After Printing" info="Automatically cut paper after each print" />
        <CBRow checked={s.openCashDrawer} onChange={v => upd('openCashDrawer', v)}
          label="Open Cash Drawer After Printing" info="Triggers cash drawer to open after printing" />

        <Divider />

        {/* ── Numeric Inputs ── */}
        <div className="flex items-center gap-4 py-2">
          <span className="text-[13px] text-gray-800">Extra lines at the end</span>
          <div className="border border-gray-300 rounded-[6px] w-14 h-9 flex items-center">
            <input
              type="number" min={0} value={s.extraLinesAtEnd}
              onChange={e => upd('extraLinesAtEnd', Math.max(0, Number(e.target.value)))}
              className="w-full text-center text-[13px] text-gray-800 outline-none bg-transparent"
            />
          </div>
          <InfoTooltip text="Blank lines printed at receipt end" />
        </div>

        <div className="flex items-center gap-4 py-2">
          <span className="text-[13px] text-gray-800">Number of copies</span>
          <div className="border border-gray-300 rounded-[6px] w-14 h-9 flex items-center">
            <input
              type="number" min={1} value={s.numberOfCopies}
              onChange={e => upd('numberOfCopies', Math.max(1, Number(e.target.value)))}
              className="w-full text-center text-[13px] text-gray-800 outline-none bg-transparent"
            />
          </div>
          <InfoTooltip text="How many copies to print each time" />
        </div>

        {/* ── Print Company Info / Header ── */}
        <SettingsSection title="Print Company Info / Header">

          {/* Company Name */}
          <div className="flex items-center gap-3 py-2.5">
            <button type="button" onClick={() => upd('printCompanyName', !s.printCompanyName)}
              className={`w-[18px] h-[18px] rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${s.printCompanyName ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'}`}>
              {s.printCompanyName && <Check className="w-3 h-3 text-white stroke-[3]" />}
            </button>
            <FloatingInput label="Company Name" value={s.companyName} onChange={e => upd('companyName', e.target.value)} className="flex-1" />
            <InfoTooltip text="Company name shown on receipt" />
          </div>

          {/* Logo */}
          <div className="flex items-center gap-3 py-2.5">
            <button type="button" onClick={() => upd('printLogo', !s.printLogo)}
              className={`w-[18px] h-[18px] rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${s.printLogo ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'}`}>
              {s.printLogo && <Check className="w-3 h-3 text-white stroke-[3]" />}
            </button>
            <span className="text-[13px] text-gray-800">Company Logo</span>
            <button type="button" onClick={() => document.getElementById('thermal-logo')?.click()}
              className="text-[13px] text-blue-600 hover:underline font-medium">(Change)</button>
            <InfoTooltip text="Upload company logo for receipt" />
            <input id="thermal-logo" type="file" accept=".png,.jpg,.jpeg,.svg" className="hidden"
              onChange={e => {
                const f = e.target.files[0];
                if (f) { const r = new FileReader(); r.onload = ev => upd('logoUrl', ev.target.result); r.readAsDataURL(f); }
                e.target.value = '';
              }} />
          </div>
          {s.logoUrl && (
            <div className="flex items-center gap-3 ml-9 mb-1">
              <img src={s.logoUrl} alt="Logo" className="h-8 w-auto max-w-[60px] object-contain border border-gray-200 rounded p-1" />
              <button onClick={() => upd('logoUrl', '')} className="text-[12px] text-red-500 hover:underline">Remove</button>
            </div>
          )}

          {/* Address */}
          <div className="flex items-center gap-3 py-2.5">
            <button type="button" onClick={() => upd('printAddress', !s.printAddress)}
              className={`w-[18px] h-[18px] rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${s.printAddress ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'}`}>
              {s.printAddress && <Check className="w-3 h-3 text-white stroke-[3]" />}
            </button>
            <FloatingInput className="flex-1" placeholder="Address" value={s.address} onChange={e => upd('address', e.target.value)} />
            <InfoTooltip text="Business address on receipt" />
          </div>

          {/* Email */}
          <div className="flex items-center gap-3 py-2.5">
            <button type="button" onClick={() => upd('printEmail', !s.printEmail)}
              className={`w-[18px] h-[18px] rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${s.printEmail ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'}`}>
              {s.printEmail && <Check className="w-3 h-3 text-white stroke-[3]" />}
            </button>
            <FloatingInput className="flex-1" placeholder="Email" value={s.email} onChange={e => upd('email', e.target.value)} />
            <InfoTooltip text="Email shown on receipt" />
          </div>

          {/* Phone */}
          <div className="flex items-center gap-3 py-2.5">
            <button type="button" onClick={() => upd('printPhone', !s.printPhone)}
              className={`w-[18px] h-[18px] rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${s.printPhone ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'}`}>
              {s.printPhone && <Check className="w-3 h-3 text-white stroke-[3]" />}
            </button>
            <FloatingInput label="Phone Number" className="flex-1" value={s.phone} onChange={e => upd('phone', e.target.value.replace(/\D/g, ''))} type="tel" />
            <InfoTooltip text="Phone number on receipt" />
          </div>

          {/* GSTIN */}
          <div className="flex items-center gap-3 py-2.5">
            <button type="button" onClick={() => upd('printGSTIN', !s.printGSTIN)}
              className={`w-[18px] h-[18px] rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${s.printGSTIN ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'}`}>
              {s.printGSTIN && <Check className="w-3 h-3 text-white stroke-[3]" />}
            </button>
            <FloatingInput className="flex-1" placeholder="GSTIN on Sale" value={s.gstin} onChange={e => upd('gstin', e.target.value.toUpperCase())} />
            <InfoTooltip text="GST number on receipt" />
          </div>

          {/* Change Transaction Names */}
          <button type="button" onClick={() => setTxnModal(true)}
            className="text-[13px] text-blue-600 hover:underline font-medium py-1.5 flex items-center gap-0.5">
            Change Transaction Names <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </SettingsSection>

        {/* ── Item Table ── */}
        <SettingsSection title="Item table">
          <CBRow checked={s.showSNo} onChange={v => upd('showSNo', v)} label="S.No" info="Show serial number column" />
          <CBRow checked={s.showHSN} onChange={v => upd('showHSN', v)} label="HSN/SAC Code" info="Show HSN/SAC code on receipt" />
          <CBRow checked={s.showUOM} onChange={v => upd('showUOM', v)} label="Units of Measurement" info="Show unit of measurement" />
          <CBRow checked={s.showMRP} onChange={v => upd('showMRP', v)} label="MRP" info="Show Maximum Retail Price" />
          <CBRow checked={s.showDescription} onChange={v => upd('showDescription', v)} label="Description" info="Show item description" />
        </SettingsSection>

        {/* ── Additional Item Details ── */}
        <SettingsSection title="Additional Item Details">
          <CBRow checked={s.showBatchNo} onChange={v => upd('showBatchNo', v)} label="Batch No." info="Show batch number" />
          <CBRow checked={s.showExpDate} onChange={v => upd('showExpDate', v)} label="Exp. Date" info="Show expiry date" />
          <CBRow checked={s.showMfgDate} onChange={v => upd('showMfgDate', v)} label="Mfg. Date" info="Show manufacturing date" />
          <CBRow checked={s.showSize} onChange={v => upd('showSize', v)} label="Size" info="Show product size" />
          <CBRow checked={s.showModelNo} onChange={v => upd('showModelNo', v)} label="Model No." info="Show model number" />
          <CBRow checked={s.showSerialNo} onChange={v => upd('showSerialNo', v)} label="Serial No." info="Show serial number" />
        </SettingsSection>

        {/* ── Totals & Taxes ── */}
        <SettingsSection title="Totals &amp; Taxes">
          <CBRow checked={s.totalItemQuantity} onChange={v => upd('totalItemQuantity', v)} label="Total Item Quantity" info="Show total quantity" />
          <CBRow checked={s.amountWithDecimal} onChange={v => upd('amountWithDecimal', v)}
            label={<>Amount with Decimal <span className="text-[12px] text-gray-400 ml-1">e.g. 0.00</span></>} info="Show amounts with decimal" />
          <CBRow checked={s.receivedAmount} onChange={v => upd('receivedAmount', v)} label="Received Amount" info="Show received amount" />
          <CBRow checked={s.balanceAmount} onChange={v => upd('balanceAmount', v)} label="Balance Amount" info="Show balance amount" />
          <CBRow checked={s.currentBalanceParty} onChange={v => upd('currentBalanceParty', v)} label="Current Balance of Party" info="Show party's running balance" />
          <CBRow checked={s.taxDetails} onChange={v => upd('taxDetails', v)} label="Tax Details" info="Show tax breakdown" />
          <CBRow checked={s.youSaved} onChange={v => upd('youSaved', v)} label="You Saved" info="Show discount savings" />
          <CBRow checked={s.printAmountWithGrouping} onChange={v => upd('printAmountWithGrouping', v)} label="Print Amount with Grouping" info="Use 1,00,000 grouping" />
          <DropdownSetting label="Amount in Words" value={s.amountInWords} onChange={v => upd('amountInWords', v)}
            options={['Indian', 'International']} info="Format for amount in words" />
        </SettingsSection>

        {/* ── Footer ── */}
        <SettingsSection title="Footer">
          <CBRow checked={s.printDescription} onChange={v => upd('printDescription', v)} label="Print Description" info="Include description in footer" />
          <CBRow checked={s.printTermsAndConditions} onChange={v => upd('printTermsAndConditions', v)} label="Print Terms and Conditions" info="Include T&C in footer" />
        </SettingsSection>

        {/* ── Live Thermal Receipt Preview ── */}
        <div className="py-5">
          <div className="text-[12px] font-semibold text-gray-500 mb-3 uppercase tracking-wide">Live Preview</div>
          <div
            className="border border-gray-300 rounded-lg overflow-hidden shadow-sm"
            style={{ width: receiptWidth, fontFamily: 'monospace', fontSize: 10 }}
          >
            {/* Header */}
            <div className="bg-gray-50 text-center py-2 px-2 border-b border-dashed border-gray-300">
              {s.printLogo && s.logoUrl && (
                <img src={s.logoUrl} alt="Logo" className="h-6 w-auto mx-auto object-contain mb-1" />
              )}
              {s.printCompanyName && <div className="font-bold text-[10px] text-gray-900 uppercase">{s.companyName}</div>}
              {s.printAddress && s.address && <div className="text-[8px] text-gray-500">{s.address}</div>}
              {s.printEmail && s.email && <div className="text-[8px] text-gray-500">{s.email}</div>}
              {s.printPhone && s.phone && <div className="text-[8px] text-gray-500">Ph: {s.phone}</div>}
              {s.printGSTIN && s.gstin && <div className="text-[8px] text-gray-500">GSTIN: {s.gstin}</div>}
            </div>

            {/* Items */}
            <div className="px-2 py-1.5 border-b border-dashed border-gray-300">
              <div className="flex justify-between text-[9px] font-bold text-gray-700 border-b border-gray-200 pb-0.5 mb-1">
                {s.showSNo && <span>#</span>}
                <span className="flex-1 ml-1">Item</span>
                {s.showMRP && <span className="mr-1">MRP</span>}
                <span>Amt</span>
              </div>
              {[1].map(i => (
                <div key={i} className="flex justify-between text-[8px] text-gray-600">
                  {s.showSNo && <span>1</span>}
                  <span className="flex-1 ml-1 truncate">Sample Item</span>
                  {s.showMRP && <span className="mr-1">120</span>}
                  <span>₹100</span>
                </div>
              ))}
              {s.showHSN && <div className="text-[7px] text-gray-400 mt-0.5">HSN: 1234</div>}
            </div>

            {/* Totals */}
            <div className="px-2 py-1.5 border-b border-dashed border-gray-300">
              {s.totalItemQuantity && (
                <div className="flex justify-between text-[8px] text-gray-600">
                  <span>Total Qty</span><span>1</span>
                </div>
              )}
              {s.taxDetails && (
                <div className="flex justify-between text-[8px] text-gray-600">
                  <span>GST 18%</span><span>₹15.25</span>
                </div>
              )}
              <div className="flex justify-between text-[9px] font-bold text-gray-800 border-t border-gray-200 mt-0.5 pt-0.5">
                <span>Total</span><span>₹100</span>
              </div>
              {s.receivedAmount && (
                <div className="flex justify-between text-[8px] text-gray-600">
                  <span>Received</span><span>₹100</span>
                </div>
              )}
              {s.balanceAmount && (
                <div className="flex justify-between text-[8px] text-gray-600">
                  <span>Balance</span><span>₹0</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-2 py-1 text-center">
              {s.printDescription && <div className="text-[7px] text-gray-400">Goods once sold will not be returned.</div>}
              {s.printTermsAndConditions && <div className="text-[7px] text-gray-400">All disputes subject to local jurisdiction.</div>}
              <div className="text-[8px] text-gray-500 font-medium mt-0.5">Thank you! Visit again.</div>
            </div>

            {s.autoCutPaper && <div className="border-t-2 border-dashed border-gray-400 mx-2 mt-1" />}
          </div>
        </div>

        <div className="pb-10" />
      </div>

      <TransactionNamesModal
        open={txnModal}
        onClose={() => setTxnModal(false)}
        names={s.transactionNames}
        onChange={v => upd('transactionNames', v)}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Toolbar: Save, Reset, Export, Import
───────────────────────────────────────────────────────────────────────────── */
function PrintToolbar({ onSave, onReset, onExport, onImport, saved }) {
  const fileRef = useRef(null);
  return (
    <div className="flex items-center justify-between px-8 py-3 border-b border-gray-100 bg-gray-50/60">
      <div className="flex items-center gap-2">
        {saved && (
          <span className="text-[12px] text-emerald-600 font-semibold flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Saved
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-gray-500 hover:text-gray-800 border border-gray-200 rounded-[6px] hover:bg-white transition-all">
          <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
        </button>
        <button type="button" onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-gray-500 hover:text-gray-800 border border-gray-200 rounded-[6px] hover:bg-white transition-all">
          <Download className="w-3.5 h-3.5" /> Export
        </button>
        <button type="button" onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-gray-500 hover:text-gray-800 border border-gray-200 rounded-[6px] hover:bg-white transition-all">
          <FolderOpen className="w-3.5 h-3.5" /> Import
        </button>
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={onImport} />
        <button type="button" onClick={onSave}
          className="px-5 py-1.5 bg-blue-600 text-white text-[13px] font-semibold rounded-[6px] hover:bg-blue-700 transition-colors">
          Save
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Regular Printer — Live A4 Invoice Preview
───────────────────────────────────────────────────────────────────────────── */
function RegularInvoicePreview({ s }) {
  if (s.selectedLayout === 'Landscape Theme 1') {
    const border = s.borderColor || '#334155';
    return (
      <div
        className="bg-white shadow-xl mx-auto"
        style={{
          width: 680,
          fontFamily: "'Segoe UI', Arial, sans-serif",
          color: '#000000',
          padding: '16px',
          boxSizing: 'border-box',
          fontSize: '9px',
          lineHeight: '1.3',
        }}
      >
        {/* Centered Title */}
        <div className="text-center font-bold text-xs uppercase mb-2 border py-1 bg-slate-50 text-slate-800" style={{ borderColor: border }}>
          Tax Invoice
        </div>

        {/* Outer container */}
        <div className="border" style={{ borderColor: border }}>
          {/* Header */}
          <div className="flex border-b" style={{ borderColor: border }}>
            {/* Left side: Logo next to Company Name & Phone */}
            <div className="w-[60%] border-r p-2 flex items-center" style={{ borderColor: border }}>
              <div className="w-12 h-12 bg-slate-200 border flex items-center justify-center text-[8px] text-slate-500 mr-3 flex-shrink-0" style={{ borderColor: border }}>
                {s.printLogo && s.logoUrl ? (
                  <img src={s.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  'Image'
                )}
              </div>
              <div>
                {s.printCompanyName && (
                  <div className="font-extrabold text-sm text-slate-900 leading-tight">
                    {s.companyName || 'My Company'}
                  </div>
                )}
                {s.printPhone && (
                  <div className="text-[9px] text-slate-700 mt-0.5 font-semibold">
                    Phone: {s.phone || '9913039185'}
                  </div>
                )}
              </div>
            </div>
            {/* Right side: Invoice Details */}
            <div className="w-[40%] p-2 space-y-0.5 bg-slate-50/50">
              <div className="font-bold text-[8.5px] text-slate-900 mb-0.5">Invoice Details:</div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                <div><span className="font-semibold text-slate-600">Invoice No.:</span> <span className="font-bold text-slate-800">Inv. 101</span></div>
                <div><span className="font-semibold text-slate-600">Date:</span> 02-07-2019</div>
                <div><span className="font-semibold text-slate-600">Time:</span> 12:30 PM</div>
                <div><span className="font-semibold text-slate-600">Due Date:</span> 17-07-2019</div>
              </div>
            </div>
          </div>

          {/* Billing and shipping section */}
          <div className="flex border-b" style={{ borderColor: border }}>
            {/* Left column: Bill To */}
            <div className="w-1/2 border-r p-2" style={{ borderColor: border }}>
              <div className="font-bold text-[9px] text-slate-900 mb-0.5">Bill To:</div>
              <div className="font-bold text-slate-800">Classic enterprises</div>
              <div className="text-slate-750">Plot No. 1, Shop No. 8, Koramangala, Banglore, 560034</div>
              <div className="text-slate-600 mt-1"><span className="font-semibold">Contact No.:</span> 8888888888</div>
            </div>
            {/* Right column: Ship To */}
            <div className="w-1/2 p-2">
              <div className="font-bold text-[9px] text-slate-900 mb-0.5">Ship To:</div>
              <div className="text-slate-850 font-medium">Mehta Textiles, Marathalli Road, Banglore, Karnataka, 560034</div>
            </div>
          </div>

          {/* Item details table */}
          <table className="w-full border-collapse text-left text-[9px]" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="bg-slate-50 border-b text-slate-700 font-bold" style={{ borderColor: border }}>
                <th className="border-r p-1 text-center w-6" style={{ borderColor: border }}>#</th>
                <th className="border-r p-1" style={{ borderColor: border }}>Item name</th>
                <th className="border-r p-1 text-center w-12" style={{ borderColor: border }}>HSC/SAC</th>
                <th className="border-r p-1 text-center w-12" style={{ borderColor: border }}>Quantity</th>
                <th className="border-r p-1 text-right w-14" style={{ borderColor: border }}>Price/unit</th>
                <th className="border-r p-1 text-right w-16" style={{ borderColor: border }}>Discount</th>
                <th className="border-r p-1 text-right w-16" style={{ borderColor: border }}>GST</th>
                <th className="p-1 text-right w-14">Amount</th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1 */}
              <tr className="border-b border-slate-200">
                <td className="border-r p-1 text-center" style={{ borderColor: border }}>1</td>
                <td className="border-r p-1 font-semibold text-slate-850" style={{ borderColor: border }}>ITEM 1</td>
                <td className="border-r p-1 text-center text-slate-600 font-mono" style={{ borderColor: border }}>1234</td>
                <td className="border-r p-1 text-center text-slate-800" style={{ borderColor: border }}>1 + 1</td>
                <td className="border-r p-1 text-right text-slate-700 font-mono" style={{ borderColor: border }}>10.00</td>
                <td className="border-r p-1 text-right text-slate-600 font-mono" style={{ borderColor: border }}>0.10 (1%)</td>
                <td className="border-r p-1 text-right text-slate-600 font-mono" style={{ borderColor: border }}>0.50 (5%)</td>
                <td className="p-1 text-right font-bold text-slate-800 font-mono">10.40</td>
              </tr>
              {/* Row 2 */}
              <tr className="border-b bg-slate-50/30" style={{ borderColor: border }}>
                <td className="border-r p-1 text-center" style={{ borderColor: border }}>2</td>
                <td className="border-r p-1 font-semibold text-slate-850" style={{ borderColor: border }}>ITEM 2</td>
                <td className="border-r p-1 text-center text-slate-600 font-mono" style={{ borderColor: border }}>6325</td>
                <td className="border-r p-1 text-center text-slate-800" style={{ borderColor: border }}>1</td>
                <td className="border-r p-1 text-right text-slate-700 font-mono" style={{ borderColor: border }}>30.00</td>
                <td className="border-r p-1 text-right text-slate-600 font-mono" style={{ borderColor: border }}>0.00 (0%)</td>
                <td className="border-r p-1 text-right text-slate-600 font-mono" style={{ borderColor: border }}>5.40 (18%)</td>
                <td className="p-1 text-right font-bold text-slate-800 font-mono">35.40</td>
              </tr>
              {/* Total Row */}
              <tr className="bg-slate-50 font-bold border-b text-slate-800" style={{ borderColor: border }}>
                <td className="border-r p-1" style={{ borderColor: border }}></td>
                <td className="border-r p-1 text-left" style={{ borderColor: border }}>TOTAL</td>
                <td className="border-r p-1" style={{ borderColor: border }}></td>
                <td className="border-r p-1 text-center" style={{ borderColor: border }}>2 + 1</td>
                <td className="border-r p-1" style={{ borderColor: border }}></td>
                <td className="border-r p-1 text-right font-mono" style={{ borderColor: border }}>0.10</td>
                <td className="border-r p-1 text-right font-mono" style={{ borderColor: border }}>5.90</td>
                <td className="p-1 text-right font-mono">45.80</td>
              </tr>
            </tbody>
          </table>

          {/* Summary bar */}
          <div className="border-b" style={{ borderColor: border }}>
            {/* Row 1 */}
            <div className="flex border-b bg-slate-50/50 text-[8.5px] font-bold text-slate-800" style={{ borderColor: border }}>
              <div className="w-[15%] border-r p-1" style={{ borderColor: border }}>Sub Total: 45.80</div>
              <div className="w-[20%] border-r p-1" style={{ borderColor: border }}>Discount (12%): 5.50</div>
              <div className="w-[15%] border-r p-1" style={{ borderColor: border }}>Tax (5%): 2.02</div>
              <div className="w-[15%] border-r p-1" style={{ borderColor: border }}>TCS (1%): 0.42</div>
              <div className="w-[35%] p-1">Total: ₹ 42.32 (Forty Two Rupees and Thirty Two Paisa only)</div>
            </div>
            {/* Row 2 */}
            <div className="flex bg-slate-50/20 text-[8.5px] font-bold text-slate-800">
              <div className="w-[25%] border-r p-1" style={{ borderColor: border }}>Received: 12.00</div>
              <div className="w-[25%] border-r p-1" style={{ borderColor: border }}>Balance: 30.32</div>
              <div className="w-[25%] border-r p-1" style={{ borderColor: border }}>Current Balance: 1,24,097.11</div>
              <div className="w-[25%] p-1 text-emerald-600">You Saved: 111.60</div>
            </div>
          </div>

          {/* Tax summary & bank details section */}
          <div className="flex border-b" style={{ borderColor: border }}>
            {/* Left side: Tax Summary table */}
            <div className="w-[65%] border-r p-1.5" style={{ borderColor: border }}>
              <table className="w-full border-collapse text-[8px] text-center border" style={{ borderCollapse: 'collapse', borderColor: border }}>
                <thead>
                  <tr className="bg-slate-50 font-bold text-slate-700">
                    <th className="border p-0.5" rowSpan="2" style={{ borderColor: border }}>HSN/ SAC</th>
                    <th className="border p-0.5" rowSpan="2" style={{ borderColor: border }}>Taxable amount(₹)</th>
                    <th className="border p-0.5" colSpan="2" style={{ borderColor: border }}>CGST</th>
                    <th className="border p-0.5" colSpan="2" style={{ borderColor: border }}>SGST</th>
                    <th className="border p-0.5" rowSpan="2" style={{ borderColor: border }}>Total Tax Amount(₹)</th>
                  </tr>
                  <tr className="bg-slate-50 font-bold text-slate-700">
                    <th className="border p-0.5" style={{ borderColor: border }}>Rate(%)</th>
                    <th className="border p-0.5" style={{ borderColor: border }}>Amount(₹)</th>
                    <th className="border p-0.5" style={{ borderColor: border }}>Rate(%)</th>
                    <th className="border p-0.5" style={{ borderColor: border }}>Amount(₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border" style={{ borderColor: border }}>
                    <td className="border p-0.5 font-mono" style={{ borderColor: border }}>1234</td>
                    <td className="border p-0.5 text-right font-mono" style={{ borderColor: border }}>50.20</td>
                    <td className="border p-0.5">2.5%</td>
                    <td className="border p-0.5 text-right font-mono" style={{ borderColor: border }}>1.26</td>
                    <td className="border p-0.5">2.5%</td>
                    <td className="border p-0.5 text-right font-mono" style={{ borderColor: border }}>1.26</td>
                    <td className="border p-0.5 text-right font-mono font-bold" style={{ borderColor: border }}>2.52</td>
                  </tr>
                  <tr className="border" style={{ borderColor: border }}>
                    <td className="border p-0.5 font-mono" style={{ borderColor: border }}>6325</td>
                    <td className="border p-0.5 text-right font-mono" style={{ borderColor: border }}>30.00</td>
                    <td className="border p-0.5">9.0%</td>
                    <td className="border p-0.5 text-right font-mono" style={{ borderColor: border }}>2.70</td>
                    <td className="border p-0.5">9.0%</td>
                    <td className="border p-0.5 text-right font-mono" style={{ borderColor: border }}>2.70</td>
                    <td className="border p-0.5 text-right font-mono font-bold" style={{ borderColor: border }}>5.40</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold border" style={{ borderColor: border }}>
                    <td className="border p-0.5" style={{ borderColor: border }}>Total</td>
                    <td className="border p-0.5 text-right font-mono" style={{ borderColor: border }}>80.20</td>
                    <td className="border p-0.5"></td>
                    <td className="border p-0.5 text-right font-mono" style={{ borderColor: border }}>3.96</td>
                    <td className="border p-0.5"></td>
                    <td className="border p-0.5 text-right font-mono" style={{ borderColor: border }}>3.96</td>
                    <td className="border p-0.5 text-right font-mono">9.92</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Right side: Bank Details box */}
            <div className="w-[35%] p-1.5 space-y-1">
              <div className="font-bold text-[8.5px] uppercase text-slate-500 mb-0.5">Bank Details:</div>
              <div className="flex items-center gap-2">
                {/* QR code */}
                <div className="w-10 h-10 border border-slate-400 bg-white p-0.5 flex-shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-slate-800">
                    <rect x="0" y="0" width="25" height="25" fill="currentColor"/>
                    <rect x="5" y="5" width="15" height="15" fill="white"/>
                    <rect x="75" y="0" width="25" height="25" fill="currentColor"/>
                    <rect x="75" y="5" width="15" height="15" fill="white"/>
                    <rect x="0" y="75" width="25" height="25" fill="currentColor"/>
                    <rect x="5" y="75" width="15" height="15" fill="white"/>
                    <rect x="35" y="35" width="30" height="30" fill="currentColor"/>
                    <rect x="45" y="45" width="10" height="10" fill="white"/>
                    <rect x="10" y="35" width="15" height="10" fill="currentColor"/>
                    <rect x="40" y="10" width="25" height="15" fill="currentColor"/>
                    <rect x="75" y="40" width="15" height="25" fill="currentColor"/>
                  </svg>
                </div>
                <div className="text-[7.5px] text-slate-700 font-medium leading-tight">
                  <div>Bank: {s.bankName || '123123123123'}</div>
                  <div className="truncate">A/C: {s.bankAccountNumber || '12312312312'}</div>
                  <div>IFSC: {s.bankIfscCode || '123123123'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Grid */}
          <div className="flex text-[8.5px]">
            {/* Left column: Description */}
            <div className="w-[35%] border-r p-1.5" style={{ borderColor: border }}>
              <div className="font-bold text-[8px] uppercase text-slate-500 mb-0.5">Description:</div>
              <div className="text-slate-800 font-semibold">Sale Description</div>
            </div>
            {/* Center column: Terms */}
            <div className="w-[35%] border-r p-1.5" style={{ borderColor: border }}>
              <div className="font-bold text-[8px] uppercase text-slate-500 mb-0.5">Terms & Conditions:</div>
              <div className="text-slate-650 leading-relaxed font-semibold">Thanks for doing business with us!</div>
            </div>
            {/* Right column: Signature */}
            <div className="w-[30%] p-1.5 flex flex-col justify-between h-20 bg-slate-50/30">
              <div className="font-bold text-[8px] text-right text-slate-700">For: {s.companyName || 'My Company'}</div>
              <div className="flex justify-end pr-2">
                <div className="w-14 h-5 border border-dashed border-slate-300 bg-white/70 flex items-center justify-center text-[7.5px] text-slate-400 italic">
                  Image
                </div>
              </div>
              <div className="text-right font-bold text-[8px] text-slate-700">Authorized Signatory</div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  if (s.selectedLayout === 'Landscape Theme 2') {
    const border = s.borderColor || '#334155';
    return (
      <div
        className="bg-white shadow-xl mx-auto"
        style={{
          width: 680,
          fontFamily: "'Segoe UI', Arial, sans-serif",
          color: '#000000',
          padding: '12px',
          boxSizing: 'border-box',
          fontSize: '9px',
          lineHeight: '1.3',
        }}
      >
        {/* Centered Title */}
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', border: `1px solid ${border}`, padding: '3px', background: '#f8fafc', marginBottom: '5px', letterSpacing: '0.04em' }}>
          Tax Invoice
        </div>

        {/* Outer container */}
        <div style={{ border: `1px solid ${border}` }}>

          {/* Header */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${border}` }}>
            {/* Logo + Company */}
            <div style={{ width: '60%', borderRight: `1px solid ${border}`, padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, background: '#e2e8f0', border: `1px solid #94a3b8`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', color: '#64748b', marginRight: 10, flexShrink: 0 }}>
                {s.printLogo && s.logoUrl ? <img src={s.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : 'Image'}
              </div>
              <div>
                {s.printCompanyName && <div style={{ fontWeight: 900, fontSize: '13px', color: '#0f172a', lineHeight: '1.2', marginBottom: 2 }}>{s.companyName || 'My Company'}</div>}
                {s.printPhone && <div style={{ fontWeight: 700, fontSize: '9px', color: '#334155' }}>Phone: {s.phone || '9913039185'}</div>}
              </div>
            </div>
            {/* Invoice details */}
            <div style={{ width: '40%', padding: '6px 8px', background: '#f8fafc' }}>
              <div style={{ fontWeight: 'bold', fontSize: '8.5px', color: '#0f172a', marginBottom: 3 }}>Invoice Details:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 6px', fontSize: '8px' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>Invoice No.:</span><span style={{ fontWeight: 700, color: '#0f172a' }}>Inv. 101</span>
                <span style={{ color: '#475569', fontWeight: 600 }}>Date:</span><span>02-07-2019</span>
                <span style={{ color: '#475569', fontWeight: 600 }}>Time:</span><span>12:30 PM</span>
                <span style={{ color: '#475569', fontWeight: 600 }}>Due Date:</span><span>17-07-2019</span>
              </div>
            </div>
          </div>

          {/* Bill To / Ship To */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${border}` }}>
            <div style={{ width: '50%', borderRight: `1px solid ${border}`, padding: '5px 8px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '8.5px', color: '#0f172a', marginBottom: 2 }}>Bill To:</div>
              <div style={{ fontWeight: 'bold', color: '#334155' }}>Classic enterprises</div>
              <div style={{ color: '#334155' }}>Plot No. 1, Shop No. 8, Koramangala, Banglore, 560034</div>
              <div style={{ marginTop: 2 }}><span style={{ fontWeight: 600 }}>Contact No.:</span> 8888888888</div>
            </div>
            <div style={{ width: '50%', padding: '5px 8px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '8.5px', color: '#0f172a', marginBottom: 2 }}>Ship To:</div>
              <div style={{ fontWeight: 500, color: '#0f172a' }}>Mehta Textiles, Marathalli Road, Banglore, Karnataka, 560034</div>
            </div>
          </div>

          {/* Item table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: `1px solid ${border}` }}>
                <th style={{ textAlign: 'center', borderRight: `1px solid #94a3b8`, padding: '4px 5px', width: 20, fontWeight: 700, color: '#334155' }}>#</th>
                <th style={{ textAlign: 'left', borderRight: `1px solid #94a3b8`, padding: '4px 5px', fontWeight: 700, color: '#334155' }}>Item name</th>
                <th style={{ textAlign: 'center', borderRight: `1px solid #94a3b8`, padding: '4px 5px', width: 48, fontWeight: 700, color: '#334155' }}>HSC/SAC</th>
                <th style={{ textAlign: 'center', borderRight: `1px solid #94a3b8`, padding: '4px 5px', width: 48, fontWeight: 700, color: '#334155' }}>Quantity</th>
                <th style={{ textAlign: 'right', borderRight: `1px solid #94a3b8`, padding: '4px 5px', width: 58, fontWeight: 700, color: '#334155' }}>Price/unit</th>
                <th style={{ textAlign: 'right', borderRight: `1px solid #94a3b8`, padding: '4px 5px', width: 64, fontWeight: 700, color: '#334155' }}>Discount</th>
                <th style={{ textAlign: 'right', borderRight: `1px solid #94a3b8`, padding: '4px 5px', width: 64, fontWeight: 700, color: '#334155' }}>GST</th>
                <th style={{ textAlign: 'right', padding: '4px 5px', width: 56, fontWeight: 700, color: '#334155' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ textAlign: 'center', borderRight: `1px solid #cbd5e1`, padding: '3px 5px' }}>1</td>
                <td style={{ borderRight: `1px solid #cbd5e1`, padding: '3px 5px', fontWeight: 600 }}>ITEM 1</td>
                <td style={{ textAlign: 'center', borderRight: `1px solid #cbd5e1`, padding: '3px 5px', fontFamily: 'monospace' }}>1234</td>
                <td style={{ textAlign: 'center', borderRight: `1px solid #cbd5e1`, padding: '3px 5px' }}>1+1</td>
                <td style={{ textAlign: 'right', borderRight: `1px solid #cbd5e1`, padding: '3px 5px', fontFamily: 'monospace' }}>10.00</td>
                <td style={{ textAlign: 'right', borderRight: `1px solid #cbd5e1`, padding: '3px 5px', fontFamily: 'monospace' }}>0.10 (1%)</td>
                <td style={{ textAlign: 'right', borderRight: `1px solid #cbd5e1`, padding: '3px 5px', fontFamily: 'monospace' }}>0.50 (5%)</td>
                <td style={{ textAlign: 'right', padding: '3px 5px', fontFamily: 'monospace', fontWeight: 700 }}>10.40</td>
              </tr>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ textAlign: 'center', borderRight: `1px solid #cbd5e1`, padding: '3px 5px' }}>2</td>
                <td style={{ borderRight: `1px solid #cbd5e1`, padding: '3px 5px', fontWeight: 600 }}>ITEM 2</td>
                <td style={{ textAlign: 'center', borderRight: `1px solid #cbd5e1`, padding: '3px 5px', fontFamily: 'monospace' }}>6325</td>
                <td style={{ textAlign: 'center', borderRight: `1px solid #cbd5e1`, padding: '3px 5px' }}>1</td>
                <td style={{ textAlign: 'right', borderRight: `1px solid #cbd5e1`, padding: '3px 5px', fontFamily: 'monospace' }}>30.00</td>
                <td style={{ textAlign: 'right', borderRight: `1px solid #cbd5e1`, padding: '3px 5px', fontFamily: 'monospace' }}>0.00 (0%)</td>
                <td style={{ textAlign: 'right', borderRight: `1px solid #cbd5e1`, padding: '3px 5px', fontFamily: 'monospace' }}>5.40 (18%)</td>
                <td style={{ textAlign: 'right', padding: '3px 5px', fontFamily: 'monospace', fontWeight: 700 }}>35.40</td>
              </tr>
              <tr style={{ background: '#f1f5f9', fontWeight: 700, borderTop: `1px solid ${border}` }}>
                <td style={{ borderRight: `1px solid #94a3b8`, padding: '3px 5px' }}></td>
                <td style={{ borderRight: `1px solid #94a3b8`, padding: '3px 5px' }}>TOTAL</td>
                <td style={{ borderRight: `1px solid #94a3b8`, padding: '3px 5px' }}></td>
                <td style={{ textAlign: 'center', borderRight: `1px solid #94a3b8`, padding: '3px 5px' }}>2+1</td>
                <td style={{ borderRight: `1px solid #94a3b8`, padding: '3px 5px' }}></td>
                <td style={{ textAlign: 'right', borderRight: `1px solid #94a3b8`, padding: '3px 5px', fontFamily: 'monospace' }}>0.10</td>
                <td style={{ textAlign: 'right', borderRight: `1px solid #94a3b8`, padding: '3px 5px', fontFamily: 'monospace' }}>5.90</td>
                <td style={{ textAlign: 'right', padding: '3px 5px', fontFamily: 'monospace' }}>45.80</td>
              </tr>
            </tbody>
          </table>

          {/* Tax summary + Totals panel */}
          <div style={{ display: 'flex', borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}` }}>
            {/* Left: Tax Summary */}
            <div style={{ width: '58%', borderRight: `1px solid ${border}`, padding: '5px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.5px', border: `1px solid #94a3b8` }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', fontWeight: 700, color: '#334155' }}>
                    <th style={{ border: `1px solid #94a3b8`, padding: '2px 3px' }} rowSpan="2">HSN/ SAC</th>
                    <th style={{ border: `1px solid #94a3b8`, padding: '2px 3px' }} rowSpan="2">Taxable amount(₹)</th>
                    <th style={{ border: `1px solid #94a3b8`, padding: '2px 3px' }} colSpan="2">CGST</th>
                    <th style={{ border: `1px solid #94a3b8`, padding: '2px 3px' }} colSpan="2">SGST</th>
                    <th style={{ border: `1px solid #94a3b8`, padding: '2px 3px' }} rowSpan="2">Total Tax Amount(₹)</th>
                  </tr>
                  <tr style={{ background: '#f1f5f9', fontWeight: 700, color: '#334155' }}>
                    <th style={{ border: `1px solid #94a3b8`, padding: '2px 3px' }}>Rate(%)</th>
                    <th style={{ border: `1px solid #94a3b8`, padding: '2px 3px' }}>Amount(₹)</th>
                    <th style={{ border: `1px solid #94a3b8`, padding: '2px 3px' }}>Rate(%)</th>
                    <th style={{ border: `1px solid #94a3b8`, padding: '2px 3px' }}>Amount(₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: `1px solid #94a3b8`, padding: '2px 3px', fontFamily: 'monospace', textAlign: 'center' }}>1234</td>
                    <td style={{ border: `1px solid #94a3b8`, padding: '2px 3px', fontFamily: 'monospace', textAlign: 'right' }}>50.20</td>
                    <td style={{ border: `1px solid #94a3b8`, padding: '2px 3px', textAlign: 'center' }}>2.5%</td>
                    <td style={{ border: `1px solid #94a3b8`, padding: '2px 3px', fontFamily: 'monospace', textAlign: 'right' }}>1.26</td>
                    <td style={{ border: `1px solid #94a3b8`, padding: '2px 3px', textAlign: 'center' }}>2.5%</td>
                    <td style={{ border: `1px solid #94a3b8`, padding: '2px 3px', fontFamily: 'monospace', textAlign: 'right' }}>1.26</td>
                    <td style={{ border: `1px solid #94a3b8`, padding: '2px 3px', fontFamily: 'monospace', textAlign: 'right', fontWeight: 700 }}>2.52</td>
                  </tr>
                  <tr>
                    <td style={{ border: `1px solid #94a3b8`, padding: '2px 3px', fontFamily: 'monospace', textAlign: 'center' }}>6325</td>
                    <td style={{ border: `1px solid #94a3b8`, padding: '2px 3px', fontFamily: 'monospace', textAlign: 'right' }}>30.00</td>
                    <td style={{ border: `1px solid #94a3b8`, padding: '2px 3px', textAlign: 'center' }}>9.0%</td>
                    <td style={{ border: `1px solid #94a3b8`, padding: '2px 3px', fontFamily: 'monospace', textAlign: 'right' }}>2.70</td>
                    <td style={{ border: `1px solid #94a3b8`, padding: '2px 3px', textAlign: 'center' }}>9.0%</td>
                    <td style={{ border: `1px solid #94a3b8`, padding: '2px 3px', fontFamily: 'monospace', textAlign: 'right' }}>2.70</td>
                    <td style={{ border: `1px solid #94a3b8`, padding: '2px 3px', fontFamily: 'monospace', textAlign: 'right', fontWeight: 700 }}>5.40</td>
                  </tr>
                  <tr style={{ background: '#f1f5f9', fontWeight: 700 }}>
                    <td style={{ border: `1px solid #94a3b8`, padding: '2px 3px', textAlign: 'right' }}>TOTAL</td>
                    <td style={{ border: `1px solid #94a3b8`, padding: '2px 3px', fontFamily: 'monospace', textAlign: 'right' }}>80.20</td>
                    <td style={{ border: `1px solid #94a3b8`, padding: '2px 3px' }}></td>
                    <td style={{ border: `1px solid #94a3b8`, padding: '2px 3px', fontFamily: 'monospace', textAlign: 'right' }}>3.96</td>
                    <td style={{ border: `1px solid #94a3b8`, padding: '2px 3px' }}></td>
                    <td style={{ border: `1px solid #94a3b8`, padding: '2px 3px', fontFamily: 'monospace', textAlign: 'right' }}>3.96</td>
                    <td style={{ border: `1px solid #94a3b8`, padding: '2px 3px', fontFamily: 'monospace', textAlign: 'right' }}>9.92</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Right: Totals panel */}
            <div style={{ width: '42%', padding: '5px 8px', fontSize: '8px' }}>
              {[
                ['Sub Total', ':', '45.80'],
                ['Discount (12%)', ':', '5.50'],
                ['Tax (5%)', ':', '2.02'],
                ['TCS (1%)', ':', '0.42'],
                ['Total', ':', '₹ 42.32', true],
              ].map(([label, colon, value, bold], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #e2e8f0', fontWeight: bold ? 800 : 600 }}>
                  <span style={{ color: '#334155' }}>{label}</span>
                  <span style={{ display: 'flex', gap: 8 }}>
                    <span style={{ color: '#94a3b8' }}>{colon}</span>
                    <span style={{ fontFamily: 'monospace', color: '#0f172a' }}>{value}</span>
                  </span>
                </div>
              ))}
              <div style={{ padding: '3px 0', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 600, color: '#334155', marginBottom: 1 }}>Invoice Amount In Words :</div>
                <div style={{ color: '#1d4ed8', fontStyle: 'italic', fontWeight: 600, fontSize: '7.5px', lineHeight: '1.3' }}>Forty Two Rupees and Thirty Two Paisa only</div>
              </div>
              {[
                ['Received', ':', '12.00'],
                ['Balance', ':', '30.32'],
                ['You Saved', ':', '₹ 111.60', true, '#059669'],
              ].map(([label, colon, value, bold, color], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #e2e8f0', fontWeight: bold ? 800 : 600 }}>
                  <span style={{ color: '#334155' }}>{label}</span>
                  <span style={{ display: 'flex', gap: 8 }}>
                    <span style={{ color: '#94a3b8' }}>{colon}</span>
                    <span style={{ fontFamily: 'monospace', color: color || '#0f172a' }}>{value}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer — first row: Description | Terms */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${border}` }}>
            <div style={{ width: '50%', borderRight: `1px solid ${border}`, padding: '5px 8px' }}>
              <div style={{ fontWeight: 700, fontSize: '8px', color: '#475569', textTransform: 'uppercase', marginBottom: 2 }}>Description:</div>
              <div style={{ fontWeight: 600, color: '#1d4ed8' }}>Sale Description</div>
            </div>
            <div style={{ width: '50%', padding: '5px 8px' }}>
              <div style={{ fontWeight: 700, fontSize: '8px', color: '#475569', textTransform: 'uppercase', marginBottom: 2 }}>Terms &amp; Conditions:</div>
              <div style={{ fontWeight: 600, color: '#1d4ed8' }}>Thanks for doing business with us!</div>
            </div>
          </div>

          {/* Footer — second row: Bank Details | For/Signature */}
          <div style={{ display: 'flex' }}>
            <div style={{ width: '50%', borderRight: `1px solid ${border}`, padding: '5px 8px' }}>
              <div style={{ fontWeight: 700, fontSize: '8px', color: '#475569', textTransform: 'uppercase', marginBottom: 3 }}>Bank Details:</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 36, height: 36, border: '1px solid #94a3b8', flexShrink: 0, padding: 1 }}>
                  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                    <rect x="0" y="0" width="25" height="25" fill="#000"/><rect x="5" y="5" width="15" height="15" fill="white"/>
                    <rect x="75" y="0" width="25" height="25" fill="#000"/><rect x="75" y="5" width="15" height="15" fill="white"/>
                    <rect x="0" y="75" width="25" height="25" fill="#000"/><rect x="5" y="75" width="15" height="15" fill="white"/>
                    <rect x="35" y="35" width="30" height="30" fill="#000"/><rect x="45" y="45" width="10" height="10" fill="white"/>
                    <rect x="10" y="35" width="15" height="10" fill="#000"/>
                    <rect x="40" y="10" width="25" height="15" fill="#000"/>
                    <rect x="75" y="40" width="15" height="25" fill="#000"/>
                  </svg>
                </div>
                <div style={{ fontSize: '7.5px', lineHeight: 1.5, color: '#1d4ed8', fontWeight: 600 }}>
                  <div>Bank Name: {s.bankName || '123123123123'}</div>
                  <div>Bank Account No.: {s.bankAccountNumber || '12312312312'}</div>
                  <div>Bank IFSC code: {s.bankIfscCode || '123123123'}</div>
                </div>
              </div>
            </div>
            <div style={{ width: '50%', padding: '5px 8px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontWeight: 700, fontSize: '8px', color: '#475569', textTransform: 'uppercase', marginBottom: 2 }}>For: {s.companyName || 'My Company'}:</div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 60, height: 22, border: '1px dashed #94a3b8', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', color: '#94a3b8', fontStyle: 'italic' }}>
                  Image
                </div>
              </div>
              <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '8px', color: '#334155' }}>Authorized Signatory</div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  if (s.selectedLayout === 'Tally Theme' || !s.selectedLayout) {

    const pc = s.primaryColor || '#2563EB';
    const border = s.borderColor || '#334155';
    return (
      <div
        className="bg-white shadow-xl mx-auto"
        style={{
          width: 480,
          fontFamily: "'Segoe UI', Arial, sans-serif",
          color: '#000000',
          padding: '16px',
          boxSizing: 'border-box',
          fontSize: '9px',
          lineHeight: '1.3',
        }}
      >
        {/* Centered Title */}
        <div className="text-center font-bold text-xs uppercase mb-2 border py-1 bg-slate-50 text-slate-800" style={{ borderColor: border }}>
          Tax Invoice
        </div>

        {/* Outer border container */}
        <div className="border" style={{ borderColor: border }}>
          {/* Header */}
          <div className="flex border-b p-2 items-center" style={{ borderColor: border }}>
            {/* Logo */}
            <div className="w-12 h-12 bg-slate-200 border flex items-center justify-center text-[8px] text-slate-500 mr-3 flex-shrink-0" style={{ borderColor: border }}>
              {s.printLogo && s.logoUrl ? (
                <img src={s.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                'Image'
              )}
            </div>
            {/* Company Info */}
            <div>
              {s.printCompanyName && (
                <div className="font-extrabold text-sm text-slate-900 leading-tight">
                  {s.companyName || 'My Company'}
                </div>
              )}
              {s.printPhone && (
                <div className="text-[9px] text-slate-700 mt-0.5 font-semibold">
                  Phone: {s.phone || '9913039185'}
                </div>
              )}
            </div>
          </div>

          {/* Bill To & Invoice Details columns */}
          <div className="flex border-b" style={{ borderColor: border }}>
            {/* Bill To */}
            <div className="w-1/2 border-r p-2" style={{ borderColor: border }}>
              <div className="font-bold text-[9px] text-slate-900 mb-0.5">Bill To:</div>
              <div className="font-bold text-slate-800">Classic enterprises</div>
              <div className="text-slate-750">Plot No. 1, Shop No. 8, Koramangala, Banglore, 560034</div>
              <div className="text-slate-600 mt-1"><span className="font-semibold">Contact No.:</span> 8888888888</div>
            </div>
            {/* Invoice Details */}
            <div className="w-1/2 p-2 space-y-0.5 bg-slate-50/50">
              <div className="font-bold text-[9px] text-slate-900 mb-0.5">Invoice Details:</div>
              <div><span className="font-semibold text-slate-600">Invoice No.:</span> <span className="font-bold text-slate-800">Inv. 101</span></div>
              <div><span className="font-semibold text-slate-600">Date:</span> 02-07-2019</div>
              <div><span className="font-semibold text-slate-600">Time:</span> 12:30 PM</div>
              <div><span className="font-semibold text-slate-600">Due Date:</span> 17-07-2019</div>
            </div>
          </div>

          {/* Ship To Row */}
          <div className="border-b p-2" style={{ borderColor: border }}>
            <div className="font-bold text-[9px] text-slate-900 mb-0.5">Ship To:</div>
            <div className="text-slate-800 font-medium">Mehta Textiles, Marathalli Road, Banglore, Karnataka, 560034</div>
          </div>

          {/* Item Table */}
          <table className="w-full border-collapse text-left text-[9px]" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="bg-slate-50 border-b text-slate-700 font-bold" style={{ borderColor: border }}>
                <th className="border-r p-1 text-center w-6" style={{ borderColor: border }}>#</th>
                <th className="border-r p-1" style={{ borderColor: border }}>Item name</th>
                <th className="border-r p-1 text-center w-12" style={{ borderColor: border }}>HSC/SAC</th>
                <th className="border-r p-1 text-center w-12" style={{ borderColor: border }}>Quantity</th>
                <th className="border-r p-1 text-right w-14" style={{ borderColor: border }}>Price/unit</th>
                <th className="border-r p-1 text-right w-16" style={{ borderColor: border }}>Discount</th>
                <th className="border-r p-1 text-right w-16" style={{ borderColor: border }}>GST</th>
                <th className="p-1 text-right w-14">Amount</th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1 */}
              <tr className="border-b border-slate-200">
                <td className="border-r p-1 text-center" style={{ borderColor: border }}>1</td>
                <td className="border-r p-1 font-semibold text-slate-850" style={{ borderColor: border }}>ITEM 1</td>
                <td className="border-r p-1 text-center text-slate-600 font-mono" style={{ borderColor: border }}>1234</td>
                <td className="border-r p-1 text-center text-slate-800" style={{ borderColor: border }}>1 + 1</td>
                <td className="border-r p-1 text-right text-slate-700 font-mono" style={{ borderColor: border }}>₹ 10.00</td>
                <td className="border-r p-1 text-right text-slate-600 font-mono" style={{ borderColor: border }}>₹ 0.10 (1%)</td>
                <td className="border-r p-1 text-right text-slate-600 font-mono" style={{ borderColor: border }}>₹ 0.50 (5%)</td>
                <td className="p-1 text-right font-bold text-slate-800 font-mono">₹ 10.40</td>
              </tr>
              {/* Row 2 */}
              <tr className="border-b bg-slate-50/30" style={{ borderColor: border }}>
                <td className="border-r p-1 text-center" style={{ borderColor: border }}>2</td>
                <td className="border-r p-1 font-semibold text-slate-850" style={{ borderColor: border }}>ITEM 2</td>
                <td className="border-r p-1 text-center text-slate-600 font-mono" style={{ borderColor: border }}>6325</td>
                <td className="border-r p-1 text-center text-slate-800" style={{ borderColor: border }}>1</td>
                <td className="border-r p-1 text-right text-slate-700 font-mono" style={{ borderColor: border }}>₹ 30.00</td>
                <td className="border-r p-1 text-right text-slate-600 font-mono" style={{ borderColor: border }}>₹ 0.00 (0%)</td>
                <td className="border-r p-1 text-right text-slate-600 font-mono" style={{ borderColor: border }}>₹ 5.40 (18%)</td>
                <td className="p-1 text-right font-bold text-slate-800 font-mono">₹ 35.40</td>
              </tr>
              {/* Total Row */}
              <tr className="bg-slate-50 font-bold border-b text-slate-800" style={{ borderColor: border }}>
                <td className="border-r p-1" style={{ borderColor: border }}></td>
                <td className="border-r p-1 text-left" style={{ borderColor: border }}>TOTAL</td>
                <td className="border-r p-1" style={{ borderColor: border }}></td>
                <td className="border-r p-1 text-center" style={{ borderColor: border }}>2 + 1</td>
                <td className="border-r p-1" style={{ borderColor: border }}></td>
                <td className="border-r p-1 text-right font-mono" style={{ borderColor: border }}>₹ 0.10</td>
                <td className="border-r p-1 text-right font-mono" style={{ borderColor: border }}>₹ 5.90</td>
                <td className="p-1 text-right font-mono">₹ 45.80</td>
              </tr>
            </tbody>
          </table>

          {/* Tax Summary & Totals Panel columns */}
          <div className="flex border-b" style={{ borderColor: border }}>
            {/* Left Column: Tax Summary */}
            <div className="w-[60%] border-r p-1.5" style={{ borderColor: border }}>
              <div className="font-bold text-[8px] uppercase text-slate-500 mb-1">Tax Summary:</div>
              <table className="w-full border-collapse text-[8px] text-center border" style={{ borderCollapse: 'collapse', borderColor: border }}>
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-700">
                    <th className="border p-0.5" rowSpan="2" style={{ borderColor: border }}>HSN/ SAC</th>
                    <th className="border p-0.5" rowSpan="2" style={{ borderColor: border }}>Taxable amount(₹)</th>
                    <th className="border p-0.5" colSpan="2" style={{ borderColor: border }}>CGST</th>
                    <th className="border p-0.5" colSpan="2" style={{ borderColor: border }}>SGST</th>
                    <th className="border p-0.5" rowSpan="2" style={{ borderColor: border }}>Total Tax Amount(₹)</th>
                  </tr>
                  <tr className="bg-slate-100 font-bold text-slate-700">
                    <th className="border p-0.5" style={{ borderColor: border }}>Rate(%)</th>
                    <th className="border p-0.5" style={{ borderColor: border }}>Amount(₹)</th>
                    <th className="border p-0.5" style={{ borderColor: border }}>Rate(%)</th>
                    <th className="border p-0.5" style={{ borderColor: border }}>Amount(₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border" style={{ borderColor: border }}>
                    <td className="border p-0.5 font-mono" style={{ borderColor: border }}>1234</td>
                    <td className="border p-0.5 text-right font-mono" style={{ borderColor: border }}>₹ 50.20</td>
                    <td className="border p-0.5" style={{ borderColor: border }}>2.5%</td>
                    <td className="border p-0.5 text-right font-mono" style={{ borderColor: border }}>₹ 1.26</td>
                    <td className="border p-0.5" style={{ borderColor: border }}>2.5%</td>
                    <td className="border p-0.5 text-right font-mono" style={{ borderColor: border }}>₹ 1.26</td>
                    <td className="border p-0.5 text-right font-mono font-bold" style={{ borderColor: border }}>₹ 2.52</td>
                  </tr>
                  <tr className="border" style={{ borderColor: border }}>
                    <td className="border p-0.5 font-mono" style={{ borderColor: border }}>6325</td>
                    <td className="border p-0.5 text-right font-mono" style={{ borderColor: border }}>₹ 30.00</td>
                    <td className="border p-0.5" style={{ borderColor: border }}>9.0%</td>
                    <td className="border p-0.5 text-right font-mono" style={{ borderColor: border }}>₹ 2.70</td>
                    <td className="border p-0.5" style={{ borderColor: border }}>9.0%</td>
                    <td className="border p-0.5 text-right font-mono" style={{ borderColor: border }}>₹ 2.70</td>
                    <td className="border p-0.5 text-right font-mono font-bold" style={{ borderColor: border }}>₹ 5.40</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold border" style={{ borderColor: border }}>
                    <td className="border p-0.5" style={{ borderColor: border }}>Total</td>
                    <td className="border p-0.5 text-right font-mono" style={{ borderColor: border }}>₹ 80.20</td>
                    <td className="border p-0.5" style={{ borderColor: border }}></td>
                    <td className="border p-0.5 text-right font-mono" style={{ borderColor: border }}>₹ 3.96</td>
                    <td className="border p-0.5" style={{ borderColor: border }}></td>
                    <td className="border p-0.5 text-right font-mono" style={{ borderColor: border }}>₹ 3.96</td>
                    <td className="border p-0.5 text-right font-mono" style={{ borderColor: border }}>₹ 7.92</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Right Column: Invoice Totals */}
            <div className="w-[40%] p-1.5 text-[8.5px] space-y-0.5">
              <div className="flex justify-between border-b border-slate-205 pb-0.5"><span className="text-slate-600 font-semibold">Sub Total:</span><span className="font-bold font-mono">₹ 45.80</span></div>
              <div className="flex justify-between border-b border-slate-205 pb-0.5"><span className="text-slate-600">Discount (12%):</span><span className="font-mono">₹ 5.50</span></div>
              <div className="flex justify-between border-b border-slate-205 pb-0.5"><span className="text-slate-600">Tax (5%):</span><span className="font-mono">₹ 2.02</span></div>
              <div className="flex justify-between border-b border-slate-205 pb-0.5"><span className="text-slate-600">TCS (1%):</span><span className="font-mono">₹ 0.42</span></div>
              <div className="flex justify-between font-bold border-b pb-1 text-slate-900" style={{ borderColor: border }}><span className="text-[9px]">Total:</span><span className="text-[9px] font-mono">₹ 42.32</span></div>
              <div className="pt-0.5"><span className="text-slate-600 font-semibold block">Invoice Amount In Words:</span><span className="italic font-medium text-slate-800">Forty Two Rupees and Thirty Two Paisa only</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-1"><span className="text-slate-600">Received:</span><span className="font-mono">₹ 12.00</span></div>
              <div className="flex justify-between text-red-600 font-bold"><span className="">Balance:</span><span className="font-mono">₹ 30.32</span></div>
              <div className="flex justify-between text-emerald-600 font-bold border-t border-slate-200 pt-1"><span className="">You Saved:</span><span className="font-mono">₹ 111.60</span></div>
            </div>
          </div>

          {/* Footer Grid */}
          <div className="flex">
            {/* Left side: Description & Bank details */}
            <div className="w-1/2 border-r flex flex-col justify-between" style={{ borderColor: border }}>
              {/* Description */}
              <div className="border-b p-2" style={{ borderColor: border }}>
                <div className="font-bold text-[8.5px] uppercase text-slate-500 mb-0.5">Description:</div>
                <div className="text-slate-800 font-semibold">Sale Description</div>
              </div>
              {/* Bank Details */}
              <div className="p-2">
                <div className="font-bold text-[8.5px] uppercase text-slate-500 mb-1">Bank Details:</div>
                <div className="flex items-center gap-2.5">
                  {/* QR placeholder */}
                  <div className="w-10 h-10 border border-slate-400 bg-white p-0.5 flex-shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-slate-800">
                      <rect x="0" y="0" width="25" height="25" fill="currentColor"/>
                      <rect x="5" y="5" width="15" height="15" fill="white"/>
                      <rect x="75" y="0" width="25" height="25" fill="currentColor"/>
                      <rect x="75" y="5" width="15" height="15" fill="white"/>
                      <rect x="0" y="75" width="25" height="25" fill="currentColor"/>
                      <rect x="5" y="75" width="15" height="15" fill="white"/>
                      <rect x="35" y="35" width="30" height="30" fill="currentColor"/>
                      <rect x="45" y="45" width="10" height="10" fill="white"/>
                      <rect x="10" y="35" width="15" height="10" fill="currentColor"/>
                      <rect x="40" y="10" width="25" height="15" fill="currentColor"/>
                      <rect x="75" y="40" width="15" height="25" fill="currentColor"/>
                    </svg>
                  </div>
                  {/* Info */}
                  <div className="text-[8px] text-slate-700 font-medium leading-normal">
                    <div>Bank Name: {s.bankName || '123123123123'}</div>
                    <div>Bank Account No.: {s.bankAccountNumber || '12312312312'}</div>
                    <div>Bank IFSC code: {s.bankIfscCode || '123123123'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Terms & Conditions & For Signature */}
            <div className="w-1/2 flex flex-col justify-between">
              {/* Terms */}
              <div className="border-b p-2" style={{ borderColor: border }}>
                <div className="font-bold text-[8.5px] uppercase text-slate-500 mb-0.5">Terms & Conditions:</div>
                <div className="text-slate-650 leading-relaxed font-semibold">Thanks for doing business with us!</div>
              </div>
              {/* For signature */}
              <div className="p-2 flex flex-col justify-between h-20 bg-slate-50/30">
                <div className="font-bold text-[8px] text-right text-slate-700">For: {s.companyName || 'My Company'}</div>
                <div className="flex justify-end pr-3">
                  {/* Signature mockup image */}
                  <div className="w-16 h-6 border border-dashed border-slate-300 bg-white/70 flex items-center justify-center text-[8px] text-slate-400 italic">
                    Image
                  </div>
                </div>
                <div className="text-right font-bold text-[8px] text-slate-700">Authorized Signatory</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  const pc = s.primaryColor || '#2563EB';
  const border = s.borderColor || '#D1D5DB';
  const headerBg = s.headerBg || '#FFFFFF';
  const headerText = s.headerText || '#111827';
  const footerBg = s.footerColor || '#F9FAFB';

  // Font size map
  const companySize = { Small: 13, Medium: 16, Large: 20, 'Extra Large': 24 }[s.companyNameTextSize] || 18;
  const bodySize = { Small: 9, Medium: 10, Large: 11 }[s.invoiceTextSize] || 10;

  const ITEMS = [
    { name: 'Sample Product A', hsn: '8471', qty: 2, unit: 'PCS', rate: 500, discount: 50, tax: 18, mrp: 600 },
    { name: 'Sample Product B', hsn: '8473', qty: 1, unit: 'PCS', rate: 1200, discount: 0, tax: 12, mrp: 1200 },
  ];

  const calcAmount = (item) => item.qty * item.rate - item.discount;
  const subtotal = ITEMS.reduce((acc, i) => acc + calcAmount(i), 0);
  const totalTax = ITEMS.reduce((acc, i) => acc + (calcAmount(i) * i.tax) / 100, 0);
  const grandTotal = subtotal + totalTax;

  return (
    <div
      className="bg-white shadow-xl rounded-lg overflow-hidden border"
      style={{
        width: 480,
        fontFamily: "'Inter', sans-serif",
        fontSize: bodySize,
        borderColor: border,
        color: '#111827',
      }}
    >
      {/* Header */}
      <div style={{ background: headerBg, borderBottom: `1px solid ${border}`, padding: '16px 18px' }}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {s.printLogo && s.logoUrl && (
              <img src={s.logoUrl} alt="logo" className="mb-2 object-contain" style={{ height: 36, maxWidth: 100 }} />
            )}
            {s.printCompanyName && (
              <div className="font-bold leading-tight" style={{ fontSize: companySize, color: headerText }}>
                {s.companyName || 'My Company'}
              </div>
            )}
            {s.printAddress && (
              <div className="mt-1 text-gray-500" style={{ fontSize: bodySize }}>
                {s.address || '123 Business Street, City, State - 400001'}
              </div>
            )}
            {s.printPhone && (
              <div className="text-gray-500" style={{ fontSize: bodySize }}>
                Ph: {s.phone || '9913039185'}
              </div>
            )}
            {s.printEmail && (
              <div className="text-gray-500" style={{ fontSize: bodySize }}>
                {s.email || 'info@mycompany.com'}
              </div>
            )}
            {s.printGSTIN && (
              <div className="text-gray-500" style={{ fontSize: bodySize }}>
                GSTIN: {s.gstin || '27AAAAA0000A1Z5'}
              </div>
            )}
          </div>
          {/* Invoice title */}
          <div className="text-right flex-shrink-0 ml-4">
            <div className="font-bold tracking-wide" style={{ color: pc, fontSize: bodySize + 5 }}>
              {s.transactionNames?.Invoice || 'INVOICE'}
            </div>
            <div className="mt-2 text-gray-500" style={{ fontSize: bodySize }}>
              <span className="text-gray-700 font-semibold">Invoice No:</span> INV-001
            </div>
            <div className="text-gray-500" style={{ fontSize: bodySize }}>
              <span className="text-gray-700 font-semibold">Date:</span> {new Date().toLocaleDateString('en-IN')}
            </div>
            <div className="text-gray-500" style={{ fontSize: bodySize }}>
              <span className="text-gray-700 font-semibold">Due Date:</span> {new Date(Date.now() + 15 * 86400000).toLocaleDateString('en-IN')}
            </div>
          </div>
        </div>

        {/* Party */}
        <div className="mt-3 flex gap-4">
          <div className="flex-1 p-2 rounded" style={{ background: '#F9FAFB', border: `1px solid ${border}` }}>
            <div className="font-semibold mb-0.5" style={{ color: pc, fontSize: bodySize }}>BILL TO</div>
            <div className="font-medium text-gray-800" style={{ fontSize: bodySize }}>John Doe / Acme Corp</div>
            <div className="text-gray-500" style={{ fontSize: bodySize }}>456 Client Ave, Mumbai</div>
            <div className="text-gray-500" style={{ fontSize: bodySize }}>GSTIN: 27BBBBB0000B1Z6</div>
          </div>
          <div className="flex-1 p-2 rounded" style={{ background: '#F9FAFB', border: `1px solid ${border}` }}>
            <div className="font-semibold mb-0.5" style={{ color: pc, fontSize: bodySize }}>SHIP TO</div>
            <div className="font-medium text-gray-800" style={{ fontSize: bodySize }}>John Doe</div>
            <div className="text-gray-500" style={{ fontSize: bodySize }}>456 Client Ave, Mumbai</div>
            <div className="text-gray-500" style={{ fontSize: bodySize }}>Mobile: 9876543210</div>
          </div>
        </div>
      </div>

      {/* Item Table */}
      <div style={{ borderBottom: `1px solid ${border}` }}>
        {/* Column headers */}
        <div
          className="flex items-center px-3 py-1.5 font-semibold"
          style={{ background: pc, color: '#fff', fontSize: bodySize }}
        >
          <span className="w-5 flex-shrink-0">#</span>
          <span className="flex-1">Item Name</span>
          {s.showHSN && <span className="w-12 text-right">HSN</span>}
          {s.showQuantity !== false && <span className="w-8 text-right">Qty</span>}
          {s.showUnit && <span className="w-8 text-center">Unit</span>}
          {s.showRate !== false && <span className="w-12 text-right">Rate</span>}
          {s.showDiscount && <span className="w-10 text-right">Disc.</span>}
          {s.showTax && <span className="w-10 text-right">Tax%</span>}
          {s.showAmount !== false && <span className="w-14 text-right">Amount</span>}
        </div>

        {/* Rows */}
        {ITEMS.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center px-3 py-1"
            style={{
              borderBottom: `1px solid ${border}`,
              background: idx % 2 === 1 ? '#FAFAFA' : '#FFFFFF',
              fontSize: bodySize,
            }}
          >
            <span className="w-5 flex-shrink-0 text-gray-500">{idx + 1}</span>
            <span className="flex-1 text-gray-800 font-medium">{item.name}</span>
            {s.showHSN && <span className="w-12 text-right text-gray-500">{item.hsn}</span>}
            {s.showQuantity !== false && <span className="w-8 text-right text-gray-700">{item.qty}</span>}
            {s.showUnit && <span className="w-8 text-center text-gray-500">{item.unit}</span>}
            {s.showRate !== false && <span className="w-12 text-right text-gray-700">₹{item.rate}</span>}
            {s.showDiscount && <span className="w-10 text-right text-gray-500">₹{item.discount}</span>}
            {s.showTax && <span className="w-10 text-right text-gray-500">{item.tax}%</span>}
            {s.showAmount !== false && (
              <span className="w-14 text-right font-medium" style={{ color: pc }}>₹{calcAmount(item).toLocaleString('en-IN')}</span>
            )}
          </div>
        ))}

        {/* Min empty rows */}
        {Array.from({ length: Math.max(0, (s.minTableRows || 0) - ITEMS.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="flex px-3 py-1" style={{ borderBottom: `1px solid ${border}`, fontSize: bodySize, color: '#transparent' }}>
            <span className="w-5">&nbsp;</span>
            <span className="flex-1">&nbsp;</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="flex" style={{ borderBottom: `1px solid ${border}` }}>
        {/* Left: taxes */}
        {s.taxDetails && (
          <div className="flex-1 px-3 py-2" style={{ fontSize: bodySize }}>
            <div className="font-semibold mb-1" style={{ color: pc }}>Tax Summary</div>
            {ITEMS.map((item, i) => (
              <div key={i} className="flex justify-between text-gray-500">
                <span>{item.tax}% GST on ₹{calcAmount(item)}</span>
                <span>₹{((calcAmount(item) * item.tax) / 100).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Right: totals */}
        <div className="w-44 px-3 py-2" style={{ fontSize: bodySize }}>
          <div className="flex justify-between text-gray-600 mb-0.5">
            <span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          {s.taxDetails && (
            <div className="flex justify-between text-gray-600 mb-0.5">
              <span>GST</span><span>₹{totalTax.toFixed(2)}</span>
            </div>
          )}
          {s.youSaved && (
            <div className="flex justify-between mb-0.5" style={{ color: '#16A34A' }}>
              <span>You Saved</span><span>-₹50</span>
            </div>
          )}
          <div
            className="flex justify-between font-bold border-t mt-1 pt-1"
            style={{ fontSize: bodySize + 1, color: pc, borderColor: border }}
          >
            <span>Total</span><span>₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: s.amountWithDecimal ? 2 : 0 })}</span>
          </div>
          {s.receivedAmount && (
            <div className="flex justify-between text-gray-600 mt-0.5">
              <span>Received</span><span>₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
          )}
          {s.balanceAmount && (
            <div className="flex justify-between font-semibold" style={{ color: '#EF4444' }}>
              <span>Balance</span><span>₹0</span>
            </div>
          )}
          {s.totalItemQuantity && (
            <div className="flex justify-between text-gray-500 border-t mt-1 pt-1" style={{ borderColor: border }}>
              <span>Total Qty</span><span>3</span>
            </div>
          )}
          {s.amountInWords && (
            <div className="mt-1 text-gray-400 italic" style={{ fontSize: bodySize - 1 }}>
              Rupees {grandTotal > 0 ? 'One Thousand Eight Hundred Fourteen' : 'Zero'} Only
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: footerBg, padding: '10px 18px', borderTop: `1px solid ${border}` }}>
        {s.printTermsAndConditions && (
          <div className="mb-2" style={{ fontSize: bodySize }}>
            <span className="font-semibold text-gray-700">Terms & Conditions: </span>
            <span className="text-gray-500">Goods once sold will not be returned. All disputes subject to local jurisdiction.</span>
          </div>
        )}
        {s.printDescription && (
          <div className="mb-2 text-gray-500" style={{ fontSize: bodySize }}>
            Note: Please make payment within 15 days of invoice date.
          </div>
        )}
        <div className="flex items-end justify-between mt-3">
          {s.printReceivedBy && (
            <div className="text-center" style={{ fontSize: bodySize }}>
              <div className="border-t pt-1 w-24" style={{ borderColor: '#6B7280' }}>
                <span className="text-gray-500">Received By</span>
              </div>
            </div>
          )}
          {s.printSignature && (
            <div className="text-center ml-auto" style={{ fontSize: bodySize }}>
              <div className="text-gray-400 italic mb-1 text-right" style={{ fontSize: bodySize - 1 }}>For {s.companyName || 'My Company'}</div>
              <div className="border-t pt-1 w-28" style={{ borderColor: '#6B7280' }}>
                <span className="text-gray-700 font-medium">{s.signatureText || 'Authorized Signatory'}</span>
              </div>
            </div>
          )}
        </div>
        {s.printAcknowledgement && (
          <div className="mt-2 p-1.5 rounded text-center text-gray-500" style={{ fontSize: bodySize, background: '#F3F4F6', border: `1px dashed ${border}` }}>
            Acknowledgement Copy
          </div>
        )}
        {s.printDuplicate && (
          <div className="mt-2 border-t-2 border-dashed pt-2 text-center text-gray-400" style={{ borderColor: '#9CA3AF', fontSize: bodySize }}>- - - DUPLICATE - - -</div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Thermal — Live Receipt Preview
───────────────────────────────────────────────────────────────────────────── */
function ThermalReceiptPreview({ s }) {
  const receiptWidth = s.pageSize === '2inch' ? 200 : s.pageSize === '4inch' ? 280 : 230;
  const ITEMS = [
    { name: 'Sample Item A', sno: 1, hsn: '1234', qty: 2, mrp: 120, rate: 100, amount: 200 },
    { name: 'Sample Item B', sno: 2, hsn: '5678', qty: 1, mrp: 150, rate: 130, amount: 130 },
  ];
  const subtotal = ITEMS.reduce((a, i) => a + i.amount, 0);
  const tax = s.taxDetails ? Math.round(subtotal * 0.18 * 100) / 100 : 0;
  const total = subtotal + tax;

  return (
    <div
      className="bg-white shadow-lg rounded border border-gray-300 overflow-hidden"
      style={{ width: receiptWidth, fontFamily: 'monospace', fontSize: 10 }}
    >
      {/* Header */}
      <div className="text-center py-3 px-3 border-b-2 border-dashed border-gray-400">
        {s.printLogo && s.logoUrl && <img src={s.logoUrl} alt="" className="h-8 w-auto mx-auto mb-1 object-contain" />}
        {s.printCompanyName && (
          <div className="font-bold text-[11px] uppercase tracking-wide">{s.companyName || 'MY COMPANY'}</div>
        )}
        {s.printAddress && <div className="text-[9px] text-gray-500 mt-0.5">{s.address || '123 Business Street, City'}</div>}
        {s.printPhone && <div className="text-[9px] text-gray-500">Ph: {s.phone || '9913039185'}</div>}
        {s.printEmail && s.email && <div className="text-[9px] text-gray-500">{s.email}</div>}
        {s.printGSTIN && <div className="text-[9px] text-gray-500">GSTIN: {s.gstin || '27AAAAA0000A1Z5'}</div>}
        <div className="mt-1 text-[8px] text-gray-400">────────────────────</div>
        <div className="text-[10px] font-bold">TAX INVOICE</div>
        <div className="text-[8px] text-gray-500 flex justify-between px-2 mt-0.5">
          <span>No: INV-001</span><span>{new Date().toLocaleDateString('en-IN')}</span>
        </div>
      </div>

      {/* Items */}
      <div className="px-2 py-1 border-b-2 border-dashed border-gray-400">
        {/* Header row */}
        <div className="flex text-[8px] font-bold text-gray-700 border-b border-gray-300 pb-0.5 mb-1">
          {s.showSNo && <span className="w-5">#</span>}
          <span className="flex-1">Item</span>
          {s.showMRP && <span className="w-8 text-right">MRP</span>}
          {s.showHSN && <span className="w-10 text-right">HSN</span>}
          <span className="w-12 text-right">Amt</span>
        </div>
        {ITEMS.map((item, i) => (
          <div key={i}>
            <div className="flex text-[8px] text-gray-700">
              {s.showSNo && <span className="w-5 text-gray-400">{item.sno}</span>}
              <span className="flex-1 truncate">{item.name}</span>
              {s.showMRP && <span className="w-8 text-right text-gray-400">{item.mrp}</span>}
              {s.showHSN && <span className="w-10 text-right text-gray-400">{item.hsn}</span>}
              <span className="w-12 text-right font-medium">₹{item.amount}</span>
            </div>
            {s.showUOM && <div className="text-[7px] text-gray-400 ml-5">Qty: {item.qty} PCS @ ₹{item.rate}</div>}
            {s.showDescription && <div className="text-[7px] text-gray-400 ml-5 italic">Quality assured product</div>}
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="px-2 py-1.5 border-b-2 border-dashed border-gray-400">
        {s.totalItemQuantity && (
          <div className="flex justify-between text-[8px] text-gray-500">
            <span>Total Qty</span><span>3</span>
          </div>
        )}
        {s.taxDetails && (
          <>
            <div className="flex justify-between text-[8px] text-gray-500">
              <span>Subtotal</span><span>₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-[8px] text-gray-500">
              <span>GST @18%</span><span>₹{tax}</span>
            </div>
          </>
        )}
        <div className="flex justify-between text-[10px] font-bold border-t border-gray-300 mt-0.5 pt-0.5">
          <span>TOTAL</span><span>₹{total}</span>
        </div>
        {s.receivedAmount && (
          <div className="flex justify-between text-[8px] text-gray-500">
            <span>Paid</span><span>₹{total}</span>
          </div>
        )}
        {s.balanceAmount && (
          <div className="flex justify-between text-[8px] text-gray-500">
            <span>Balance</span><span>₹0.00</span>
          </div>
        )}
        {s.amountWithDecimal && (
          <div className="text-[7px] text-gray-400 italic mt-0.5">
            Rupees {total > 0 ? 'Three Hundred Seventy-Eight' : 'Zero'} Only
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-2 py-1.5 text-center">
        {s.printDescription && (
          <div className="text-[7px] text-gray-500 mb-0.5">Goods once sold will not be returned.</div>
        )}
        {s.printTermsAndConditions && (
          <div className="text-[7px] text-gray-500 mb-0.5">All disputes subject to local jurisdiction.</div>
        )}
        <div className="text-[8px] text-gray-700 font-semibold mt-1">*** Thank You! Visit Again ***</div>
        <div className="text-[8px] text-gray-400 mt-0.5">────────────────────</div>
      </div>

      {s.autoCutPaper && (
        <div className="border-t-2 border-dashed border-gray-500 mx-3 mt-1 mb-2" />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main Export
───────────────────────────────────────────────────────────────────────────── */
const LS_KEY_REGULAR = 'print_settings_regular';
const LS_KEY_THERMAL = 'print_settings_thermal';

function loadLS(key, def) {
  try { return { ...def, ...JSON.parse(localStorage.getItem(key) || '{}') }; } catch { return def; }
}

export default function PrintSettings() {
  const [activeTab, setActiveTab] = useState('regular');
  const [regular, setRegular] = useState(() => loadLS(LS_KEY_REGULAR, DEFAULT_REGULAR));
  const [thermal, setThermal] = useState(() => loadLS(LS_KEY_THERMAL, DEFAULT_THERMAL));
  const debounceRef = useRef(null);

  // Auto-save with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      localStorage.setItem(LS_KEY_REGULAR, JSON.stringify(regular));
      localStorage.setItem(LS_KEY_THERMAL, JSON.stringify(thermal));
    }, 800);
    return () => clearTimeout(debounceRef.current);
  }, [regular, thermal]);

  return (
    <div className="bg-white" style={{ fontFamily: "'Inter', sans-serif", maxWidth: 1400 }}>
      {/* Top Tabs: REGULAR PRINTER | THERMAL PRINTER */}
      <div className="border-b border-gray-200 bg-white">
        {[
          { id: 'regular', label: 'REGULAR PRINTER' },
          { id: 'thermal', label: 'THERMAL PRINTER' },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-8 font-semibold text-[14px] transition-all duration-150 ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-[3px] border-blue-600'
                : 'text-gray-700 border-b-[3px] border-transparent hover:text-gray-900'
            }`}
            style={{ height: 60 }}
          >
            {tab.label}
          </button>
        ))}
      </div>


      {/* Split layout: settings left | preview right */}
      <div className="flex" style={{ height: 'calc(100vh - 118px)' }}>

        {/* ── Left: scrollable settings ── */}
        <div className="flex-1 overflow-y-auto min-w-0">
          {activeTab === 'regular'
            ? <RegularPrinterPanel s={regular} set={setRegular} />
            : <ThermalPrinterPanel s={thermal} set={setThermal} />
          }
        </div>

        {/* ── Right: sticky live preview ── */}
        <div
          className="flex-shrink-0 overflow-y-auto border-l border-gray-200"
          style={{ width: 520, background: '#F3F4F6' }}
        >
          {/* Preview header */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-5 py-2.5 flex items-center justify-between">
            <span className="text-[12px] font-bold text-gray-600 uppercase tracking-wide">Live Preview</span>
            <span className="text-[11px] text-gray-400">
              {activeTab === 'regular' ? (regular.paperSize || 'A4') : (
                { '2inch': '58mm Roll', '3inch': '68mm Roll', '4inch': '88mm Roll', custom: 'Custom' }[thermal.pageSize] || '68mm'
              )}
            </span>
          </div>

          {/* Preview body */}
          <div className="p-5 flex justify-center">
            {activeTab === 'regular'
              ? (
                <div
                  style={{
                    transform: 'scale(0.72)',
                    transformOrigin: 'top center',
                    marginBottom: -250,
                  }}
                >
                  <RegularInvoicePreview s={regular} />
                </div>
              )
              : (
                <div
                  style={{
                    transform: 'scale(0.9)',
                    transformOrigin: 'top center',
                    marginBottom: -30,
                  }}
                >
                  <ThermalReceiptPreview s={thermal} />
                </div>
              )
            }
          </div>
        </div>

      </div>
    </div>
  );
}
