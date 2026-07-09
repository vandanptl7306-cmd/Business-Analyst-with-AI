// client/src/pages/Settings.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoreSettings, updateStoreSettings, updateStoreProfile } from '../services/settings';
import { 
  ShieldCheck, Store, Sliders, CheckCircle, ShieldAlert, 
  Loader2, Printer, Layout, Palette, Check, Info, Sparkles,
  ShoppingBag, Truck, Factory
} from 'lucide-react';

const profiles = [
  {
    id: 'Retail',
    title: 'Retail & Kirana Stores',
    desc: 'Optimized for rapid checkout counter workflows, barcodes scanning, and fast receipt prints.',
    icon: ShoppingBag,
    color: 'from-blue-600 to-cyan-500',
    accent: 'text-blue-600 border-blue-100 bg-blue-50/50',
  },
  {
    id: 'Wholesale',
    title: 'Wholesalers & Distributors',
    desc: 'Optimized for bulk pricing lists, minimum order limits, batch logs, and customer credit limits.',
    icon: Truck,
    color: 'from-purple-600 to-pink-500',
    accent: 'text-purple-600 border-purple-100 bg-purple-50/50',
  },
  {
    id: 'Manufacturing',
    title: 'Manufacturers & Producers',
    desc: 'Optimized for raw material consumption logs, finished product assembly, and BOM cost tracks.',
    icon: Factory,
    color: 'from-orange-600 to-amber-500',
    accent: 'text-orange-600 border-orange-100 bg-orange-50/50',
  },
];

const colorPalette = [
  { name: 'Classic Blue',  hex: '#2563eb' },
  { name: 'Emerald',       hex: '#059669' },
  { name: 'Indigo',        hex: '#4f46e5' },
  { name: 'Rose',          hex: '#e11d48' },
  { name: 'Amber',         hex: '#d97706' },
  { name: 'Violet',        hex: '#7c3aed' },
  { name: 'Teal',          hex: '#0d9488' },
  { name: 'Slate',         hex: '#475569' },
  { name: 'Navy Teal',     hex: '#1b3a4b' },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [apiError, setApiError] = useState('');

  // Main Tabs: 'Profile' or 'Regular' or 'Thermal'
  const [activeTab, setActiveTab] = useState('Profile');
  
  // Regular sub-tabs: 'Layout' or 'Colors'
  const [regularSubTab, setRegularSubTab] = useState('Layout');

  // Business Profile States
  const [businessType, setBusinessType] = useState('Retail');

  // Regular Printer States
  const [regularLayoutTheme, setRegularLayoutTheme] = useState('Standard');
  const [regularThemeColor, setRegularThemeColor] = useState('#2563eb');
  const [printRepeatHeader, setPrintRepeatHeader] = useState(false);
  
  const [printCompanyName, setPrintCompanyName] = useState(true);
  const [customCompanyName, setCustomCompanyName] = useState('');
  const [printCompanyLogo, setPrintCompanyLogo] = useState(true);
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [printAddress, setPrintAddress] = useState(true);
  const [customAddress, setCustomAddress] = useState('');
  const [printEmail, setPrintEmail] = useState(true);
  const [customEmail, setCustomEmail] = useState('');
  const [printPhone, setPrintPhone] = useState(true);
  const [customPhone, setCustomPhone] = useState('');
  const [printGSTIN, setPrintGSTIN] = useState(true);
  const [customGSTIN, setCustomGSTIN] = useState('');

  const [paperSize, setPaperSize] = useState('A4');
  const [orientation, setOrientation] = useState('Portrait');
  const [companyNameTextSize, setCompanyNameTextSize] = useState('Large');
  const [invoiceTextSize, setInvoiceTextSize] = useState('Large');

  const [printTotalQty, setPrintTotalQty] = useState(true);
  const [amountWithDecimal, setAmountWithDecimal] = useState(true);
  const [printReceivedAmount, setPrintReceivedAmount] = useState(true);
  const [printBalanceAmount, setPrintBalanceAmount] = useState(false);
  const [printCurrentBalance, setPrintCurrentBalance] = useState(false);
  const [printTaxDetails, setPrintTaxDetails] = useState(true);
  const [printYouSaved, setPrintYouSaved] = useState(false);
  const [printAmountWithGrouping, setPrintAmountWithGrouping] = useState(true);
  const [amountInWordsFormat, setAmountInWordsFormat] = useState('Indian');
  const [printDescription, setPrintDescription] = useState(true);

  // Layout-specific extra fields
  const [companyTagline, setCompanyTagline] = useState('');
  const [poReference, setPoReference] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // Bank Details States
  const [printBankDetails, setPrintBankDetails] = useState(false);
  const [bankAccountHolderName, setBankAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfscCode, setBankIfscCode] = useState('');
  const [bankBranchName, setBankBranchName] = useState('');

  // Thermal Printer States
  const [thermalPrintingType, setThermalPrintingType] = useState('Text Printing');
  const [thermalUseTextStylingBold, setThermalUseTextStylingBold] = useState(true);
  const [thermalAutoCut, setThermalAutoCut] = useState(true);
  const [thermalOpenCashDrawer, setThermalOpenCashDrawer] = useState(true);
  const [thermalExtraLines, setThermalExtraLines] = useState(0);
  const [thermalCopies, setThermalCopies] = useState(1);
  const [thermalPrintCompanyName, setThermalPrintCompanyName] = useState(true);
  const [thermalCompanyName, setThermalCompanyName] = useState('');

  // Fallbacks for preview details
  const [storeDefaults, setStoreDefaults] = useState({
    shopName: 'IntellectBill AI Operations',
    address: '101, Business Enclave, Cyber City, Gurgaon',
    phoneNumber: '+919876543210',
    email: 'billing@intellectbill.ai',
    gstin: '27AAAAA1111A1Z1',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150'
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await getStoreSettings();
        if (response.success && response.settings) {
          const s = response.settings;
          setStoreDefaults({
            shopName: s.shopName || 'IntellectBill AI Operations',
            address: s.address || '101, Business Enclave, Cyber City, Gurgaon',
            phoneNumber: s.phoneNumber || '+919876543210',
            email: s.email || 'billing@intellectbill.ai',
            logoUrl: s.logoUrl || ''
          });

          // Business Type
          setBusinessType(s.businessType || 'Retail');

          // Regular settings loading
          setRegularLayoutTheme(s.regularLayoutTheme || s.defaultInvoiceTemplate || 'Standard');
          setRegularThemeColor(s.regularThemeColor || s.invoiceThemeColor || '#2563eb');
          setPrintRepeatHeader(s.printRepeatHeader ?? false);
          
          setPrintCompanyName(s.printCompanyName ?? true);
          setCustomCompanyName(s.customCompanyName || s.shopName || '');
          setPrintCompanyLogo(s.printCompanyLogo ?? true);
          setCustomLogoUrl(s.customLogoUrl || s.logoUrl || '');
          setPrintAddress(s.printAddress ?? true);
          setCustomAddress(s.customAddress || s.address || '');
          setPrintEmail(s.printEmail ?? true);
          setCustomEmail(s.customEmail || s.email || '');
          setPrintPhone(s.printPhone ?? true);
          setCustomPhone(s.customPhone || s.phoneNumber || '');
          setPrintGSTIN(s.printGSTIN ?? true);
          setCustomGSTIN(s.customGSTIN || s.gstin || '');

          setPaperSize(s.paperSize || 'A4');
          setOrientation(s.orientation || 'Portrait');
          setCompanyNameTextSize(s.companyNameTextSize || 'Large');
          setInvoiceTextSize(s.invoiceTextSize || 'Large');

          setPrintTotalQty(s.printTotalQty ?? true);
          setAmountWithDecimal(s.amountWithDecimal ?? true);
          setPrintReceivedAmount(s.printReceivedAmount ?? true);
          setPrintBalanceAmount(s.printBalanceAmount ?? false);
          setPrintCurrentBalance(s.printCurrentBalance ?? false);
          setPrintTaxDetails(s.printTaxDetails ?? true);
          setPrintYouSaved(s.printYouSaved ?? false);
          setPrintAmountWithGrouping(s.printAmountWithGrouping ?? true);
          setAmountInWordsFormat(s.amountInWordsFormat || 'Indian');
          setPrintDescription(s.printDescription ?? true);

          // Thermal settings loading
          setThermalPrintingType(s.thermalPrintingType || 'Text Printing');
          setThermalUseTextStylingBold(s.thermalUseTextStylingBold ?? true);
          setThermalAutoCut(s.thermalAutoCut ?? true);
          setThermalOpenCashDrawer(s.thermalOpenCashDrawer ?? true);
          setThermalExtraLines(s.thermalExtraLines ?? 0);
          setThermalCopies(s.thermalCopies ?? 1);
          setThermalPrintCompanyName(s.thermalPrintCompanyName ?? true);
          setThermalCompanyName(s.thermalCompanyName || s.shopName || '');

          // Bank details loading
          setPrintBankDetails(s.printBankDetails ?? false);
          setBankAccountHolderName(s.bankAccountHolderName || '');
          setBankName(s.bankName || '');
          setBankAccountNumber(s.bankAccountNumber || '');
          setBankIfscCode(s.bankIfscCode || '');
          setBankBranchName(s.bankBranchName || '');

          // Layout-specific extra fields
          setCompanyTagline(s.companyTagline || '');
          setPoReference(s.poReference || '');
          setInvoiceNotes(s.invoiceNotes || '');
        }
      } catch (err) {
        setApiError('Failed to load store printer preferences.');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSaveAll = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setApiError('');
    setSuccessMsg('');

    const payload = {
      printerType: activeTab === 'Profile' ? (businessType === 'Retail' ? 'Regular' : 'Regular') : activeTab,
      regularLayoutTheme,
      regularThemeColor,
      printRepeatHeader,
      printCompanyName,
      customCompanyName,
      printCompanyLogo,
      customLogoUrl,
      printAddress,
      customAddress,
      printEmail,
      customEmail,
      printPhone,
      customPhone,
      printGSTIN,
      customGSTIN,
      paperSize,
      orientation,
      companyNameTextSize,
      invoiceTextSize,
      printTotalQty,
      amountWithDecimal,
      printReceivedAmount,
      printBalanceAmount,
      printCurrentBalance,
      printTaxDetails,
      printYouSaved,
      printAmountWithGrouping,
      amountInWordsFormat,
      printDescription,
      thermalPrintingType,
      thermalUseTextStylingBold,
      thermalAutoCut,
      thermalOpenCashDrawer,
      thermalExtraLines,
      thermalCopies,
      thermalPrintCompanyName,
      thermalCompanyName,
      printBankDetails,
      bankAccountHolderName,
      bankName,
      bankAccountNumber,
      bankIfscCode,
      bankBranchName,
      companyTagline,
      poReference,
      invoiceNotes,
    };

    try {
      // 1. Save profile type
      const pRes = await updateStoreProfile(businessType);
      
      // 2. Save layout preferences
      const sRes = await updateStoreSettings(payload);

      if (pRes.success && sRes.success) {
        setSuccessMsg('Settings configurations saved successfully.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to update configurations.');
    } finally {
      setUpdating(false);
    }
  };

  const formatPreviewAmount = (amount) => {
    const decDigits = amountWithDecimal ? 2 : 0;
    if (printAmountWithGrouping) {
      const locale = amountInWordsFormat === 'Indian' ? 'en-IN' : 'en-US';
      return amount.toLocaleString(locale, {
        minimumFractionDigits: decDigits,
        maximumFractionDigits: decDigits,
      });
    }
    return amount.toFixed(decDigits);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-10 w-10 text-indigo-650 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Block */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-indigo-50/5 rounded-full blur-2xl pointer-events-none"></div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Workspace Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Configure your business profile archetype, receipt layout variables, paper orientations, colors, and taxes</p>
      </div>

      {/* Success/Error Alerts */}
      {successMsg && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle className="h-4.5 w-4.5 text-emerald-600 flex-shrink-0 animate-bounce" />
          <span>{successMsg}</span>
        </div>
      )}

      {apiError && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs font-semibold flex items-center space-x-2">
          <ShieldAlert className="h-4.5 w-4.5 text-red-600 flex-shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Settings Forms Left */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Module Tabs (Business Profile vs. Regular vs. Thermal) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex space-x-1.5 shadow-sm">
            {[
              { id: 'Profile', label: 'Business Profile', icon: Store },
              { id: 'Regular', label: 'Regular Printer', icon: Printer },
              { id: 'Thermal', label: 'Thermal Printer', icon: Layout }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === t.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <t.icon className="h-4 w-4" />
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSaveAll} className="space-y-6">
            
            {/* BUSINESS PROFILE CONFIGURATOR TAB */}
            {activeTab === 'Profile' && (
              <div className="space-y-6">
                <div className="card-module space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-indigo-650" />
                    <span>Select Operating Model</span>
                  </h3>
                  <p className="text-xs text-slate-450 leading-normal">
                    Changing your business profile automatically updates invoices properties, HSN defaults, safety threshold ratios, and dynamic stock calculation features across the workspace.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-4 pt-2">
                    {profiles.map((prof) => {
                      const Icon = prof.icon;
                      const isSelected = businessType === prof.id;
                      return (
                        <div
                          key={prof.id}
                          onClick={() => setBusinessType(prof.id)}
                          className={`border rounded-2xl p-5 cursor-pointer hover:border-slate-350 transition-all flex items-start space-x-4 ${
                            isSelected 
                              ? 'border-indigo-600 bg-indigo-50/10 shadow-sm ring-1 ring-indigo-500/20' 
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className={`p-2.5 rounded-xl border ${prof.accent} flex-shrink-0`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                              <span>{prof.title}</span>
                              {isSelected && <Check className="h-4 w-4 text-indigo-600" />}
                            </h4>
                            <p className="text-xs text-slate-450 leading-relaxed">{prof.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* REGULAR PRINTER TAB */}
            {activeTab === 'Regular' && (
              <div className="space-y-6">
                
                {/* Selection Sub-tabs */}
                <div className="bg-slate-100/60 border border-slate-200/60 rounded-xl p-1 flex space-x-1.5 w-fit">
                  <button
                    type="button"
                    onClick={() => setRegularSubTab('Layout')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      regularSubTab === 'Layout'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Change Layout
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegularSubTab('Colors')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      regularSubTab === 'Colors'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Change Colors
                  </button>
                </div>

                {/* sub tab Content */}
                {regularSubTab === 'Layout' ? (
                  <div className="card-module space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Layout Format</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { id: 'Standard', name: 'Standard Theme' },
                        { id: 'TaxInvoice', name: 'GST Tax Invoice' },
                        { id: 'Minimalist', name: 'Minimalist Layout' },
                        { id: 'Commercial', name: 'Commercial Layout' },
                        { id: 'Modern', name: 'Modern Layout' },
                        { id: 'Proforma', name: 'Proforma Purple Layout' }
                      ].map((lay) => (
                        <div
                          key={lay.id}
                          onClick={() => setRegularLayoutTheme(lay.id)}
                          className={`p-4 border rounded-xl cursor-pointer text-xs font-semibold text-center transition-all ${
                            regularLayoutTheme === lay.id
                              ? 'border-indigo-600 bg-indigo-50/10 text-indigo-700 font-bold'
                              : 'border-slate-200 hover:border-slate-300 text-slate-650'
                          }`}
                        >
                          {lay.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="card-module space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Select Accent Theme Color</h3>
                    <div className="grid grid-cols-5 sm:grid-cols-9 gap-3">
                      {colorPalette.map((col) => (
                        <button
                          key={col.hex}
                          type="button"
                          onClick={() => setRegularThemeColor(col.hex)}
                          className="h-10 w-full rounded-xl transition-all relative flex items-center justify-center shadow-inner group border border-slate-100"
                          style={{ backgroundColor: col.hex }}
                          title={col.name}
                        >
                          {regularThemeColor === col.hex && (
                            <Check className="h-5 w-5 text-white drop-shadow-md" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Company Info toggles & custom overrides — dynamic per layout */}
                <div className="card-module space-y-5">

                  {/* Section title with current layout badge */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Header Configuration</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                      style={{ color: regularThemeColor, borderColor: regularThemeColor + '40', backgroundColor: regularThemeColor + '10' }}>
                      {regularLayoutTheme === 'Standard' && 'Standard Theme'}
                      {regularLayoutTheme === 'TaxInvoice' && 'GST Tax Invoice'}
                      {regularLayoutTheme === 'Minimalist' && 'Minimalist Layout'}
                      {regularLayoutTheme === 'Commercial' && 'Commercial Layout'}
                      {regularLayoutTheme === 'Modern' && 'Modern Layout'}
                      {regularLayoutTheme === 'Proforma' && 'Proforma Layout'}
                    </span>
                  </div>

                  {/* ── FIELDS SHARED BY ALL LAYOUTS ── */}
                  <div className="space-y-4">

                    {/* Company Name — all layouts */}
                    <div className="space-y-2">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input type="checkbox" checked={printCompanyName}
                          onChange={(e) => setPrintCompanyName(e.target.checked)}
                          className="rounded bg-slate-50 border-slate-300 text-indigo-600 focus:ring-indigo-500/20" />
                        <span className="text-xs font-semibold text-slate-700">Company Name</span>
                      </label>
                      {printCompanyName && (
                        <div className="pl-7">
                          <input type="text" placeholder="Override Company Name"
                            value={customCompanyName} onChange={(e) => setCustomCompanyName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650" />
                        </div>
                      )}
                    </div>

                    {/* Company Tagline — TaxInvoice only */}
                    {regularLayoutTheme === 'TaxInvoice' && (
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700">
                          Company Tagline
                          <span className="ml-2 text-[9px] font-normal text-slate-400">(shown below company name as a colored band)</span>
                        </label>
                        <input type="text" placeholder="e.g. Manufacturing & Supply of Precision Tools"
                          value={companyTagline} onChange={(e) => setCompanyTagline(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650" />
                      </div>
                    )}

                    {/* Company Logo — Standard, TaxInvoice, Minimalist, Modern */}
                    {['Standard', 'TaxInvoice', 'Minimalist', 'Modern'].includes(regularLayoutTheme) && (
                      <div className="space-y-2">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input type="checkbox" checked={printCompanyLogo}
                            onChange={(e) => setPrintCompanyLogo(e.target.checked)}
                            className="rounded bg-slate-50 border-slate-300 text-indigo-600 focus:ring-indigo-500/20" />
                          <span className="text-xs font-semibold text-slate-700">Company Logo</span>
                        </label>
                        {printCompanyLogo && (
                          <div className="pl-7">
                            <input type="text" placeholder="Logo URL e.g. https://domain.com/logo.png"
                              value={customLogoUrl} onChange={(e) => setCustomLogoUrl(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Address — Standard, TaxInvoice, Minimalist */}
                    {['Standard', 'TaxInvoice', 'Minimalist'].includes(regularLayoutTheme) && (
                      <div className="space-y-2">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input type="checkbox" checked={printAddress}
                            onChange={(e) => setPrintAddress(e.target.checked)}
                            className="rounded bg-slate-50 border-slate-300 text-indigo-600 focus:ring-indigo-500/20" />
                          <span className="text-xs font-semibold text-slate-700">Address Details</span>
                        </label>
                        {printAddress && (
                          <div className="pl-7">
                            <input type="text" placeholder="Override Address Details"
                              value={customAddress} onChange={(e) => setCustomAddress(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Phone — Standard, TaxInvoice */}
                    {['Standard', 'TaxInvoice'].includes(regularLayoutTheme) && (
                      <div className="space-y-2">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input type="checkbox" checked={printPhone}
                            onChange={(e) => setPrintPhone(e.target.checked)}
                            className="rounded bg-slate-50 border-slate-300 text-indigo-600 focus:ring-indigo-500/20" />
                          <span className="text-xs font-semibold text-slate-700">Phone Number</span>
                        </label>
                        {printPhone && (
                          <div className="pl-7">
                            <input type="text" placeholder="Override Phone Number"
                              value={customPhone} onChange={(e) => setCustomPhone(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Email — Standard, TaxInvoice */}
                    {['Standard', 'TaxInvoice'].includes(regularLayoutTheme) && (
                      <div className="space-y-2">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input type="checkbox" checked={printEmail}
                            onChange={(e) => setPrintEmail(e.target.checked)}
                            className="rounded bg-slate-50 border-slate-300 text-indigo-600 focus:ring-indigo-500/20" />
                          <span className="text-xs font-semibold text-slate-700">Email / Website</span>
                        </label>
                        {printEmail && (
                          <div className="pl-7">
                            <input type="text" placeholder="Override Email or Website URL"
                              value={customEmail} onChange={(e) => setCustomEmail(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* GSTIN — Standard, TaxInvoice */}
                    {['Standard', 'TaxInvoice'].includes(regularLayoutTheme) && (
                      <div className="space-y-2">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input type="checkbox" checked={printGSTIN}
                            onChange={(e) => setPrintGSTIN(e.target.checked)}
                            className="rounded bg-slate-50 border-slate-300 text-indigo-600 focus:ring-indigo-500/20" />
                          <span className="text-xs font-semibold text-slate-700">
                            {regularLayoutTheme === 'TaxInvoice' ? 'PAN / GSTIN' : 'GSTIN on Sale'}
                          </span>
                        </label>
                        {printGSTIN && (
                          <div className="pl-7">
                            <input type="text"
                              placeholder={regularLayoutTheme === 'TaxInvoice' ? 'e.g. 26CORPP3939N1' : 'Override Seller GSTIN'}
                              value={customGSTIN} onChange={(e) => setCustomGSTIN(e.target.value.toUpperCase())}
                              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* PO Reference — Commercial only */}
                    {regularLayoutTheme === 'Commercial' && (
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700">
                          PO Reference
                          <span className="ml-2 text-[9px] font-normal text-slate-400">(purchase order number shown in header)</span>
                        </label>
                        <input type="text" placeholder="e.g. #PO-99201"
                          value={poReference} onChange={(e) => setPoReference(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650" />
                      </div>
                    )}

                    {/* Invoice Notes — Commercial only */}
                    {regularLayoutTheme === 'Commercial' && (
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700">
                          Invoice Notes
                          <span className="ml-2 text-[9px] font-normal text-slate-400">(bottom-left notes section)</span>
                        </label>
                        <textarea placeholder="e.g. Remit payments to business address."
                          value={invoiceNotes} onChange={(e) => setInvoiceNotes(e.target.value)} rows={2}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650 resize-none" />
                      </div>
                    )}

                    {/* Bank Details — Standard, TaxInvoice, Commercial, Modern */}
                    {['Standard', 'TaxInvoice', 'Commercial', 'Modern'].includes(regularLayoutTheme) && (
                      <div className="space-y-3 border-t border-slate-100 pt-4">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input type="checkbox" checked={printBankDetails}
                            onChange={(e) => setPrintBankDetails(e.target.checked)}
                            className="rounded bg-slate-50 border-slate-300 text-indigo-600 focus:ring-indigo-500/20" />
                          <span className="text-xs font-semibold text-slate-700">Bank Details</span>
                        </label>
                        {printBankDetails && (
                          <div className="pl-7 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Account Holder Name</label>
                                <input type="text" placeholder="e.g. IntellectBill Pvt. Ltd."
                                  value={bankAccountHolderName} onChange={(e) => setBankAccountHolderName(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Bank Name</label>
                                <input type="text" placeholder="e.g. State Bank of India"
                                  value={bankName} onChange={(e) => setBankName(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Account Number</label>
                                <input type="text" placeholder="e.g. 1234567890123"
                                  value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">IFSC Code</label>
                                <input type="text" placeholder="e.g. SBIN0001234"
                                  value={bankIfscCode} onChange={(e) => setBankIfscCode(e.target.value.toUpperCase())}
                                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650" />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Branch Name</label>
                                <input type="text" placeholder="e.g. Cyber City, Gurgaon"
                                  value={bankBranchName} onChange={(e) => setBankBranchName(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Info hint for Minimalist / Proforma only */}
                    {['Minimalist', 'Proforma'].includes(regularLayoutTheme) && (
                      <div className="flex items-start space-x-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <Info className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] text-slate-500 leading-normal">
                          {regularLayoutTheme === 'Minimalist' && 'Minimalist layout shows Company Name, Logo, and Address only — keeping the design clean and distraction-free.'}
                          {regularLayoutTheme === 'Proforma' && 'Proforma layout uses Company Name as the main identity in its colored header band. No extra contact lines are shown by design.'}
                        </p>
                      </div>
                    )}

                  </div>

                  {/* Dropdowns (Paper Size, Orientation, etc.) */}
                  <div className="border-t border-slate-100 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">Paper Size</label>
                      <select
                        value={paperSize}
                        onChange={(e) => setPaperSize(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                      >
                        <option value="A4">A4</option>
                        <option value="A5">A5</option>
                        <option value="Letter">Letter</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">Orientation</label>
                      <select
                        value={orientation}
                        onChange={(e) => setOrientation(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                      >
                        <option value="Portrait">Portrait</option>
                        <option value="Landscape">Landscape</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">Company Name Text Size</label>
                      <select
                        value={companyNameTextSize}
                        onChange={(e) => setCompanyNameTextSize(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                      >
                        <option value="Small">Small</option>
                        <option value="Medium">Medium</option>
                        <option value="Large">Large</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">Invoice Text Size</label>
                      <select
                        value={invoiceTextSize}
                        onChange={(e) => setInvoiceTextSize(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                      >
                        <option value="Small">Small</option>
                        <option value="Medium">Medium</option>
                        <option value="Large">Large</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Totals & Taxes */}
                <div className="card-module space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Totals & Taxes</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printTotalQty}
                        onChange={(e) => setPrintTotalQty(e.target.checked)}
                        className="rounded bg-slate-50 border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                      />
                      <span className="text-xs text-slate-600 font-semibold">Total Item Quantity</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={amountWithDecimal}
                        onChange={(e) => setAmountWithDecimal(e.target.checked)}
                        className="rounded bg-slate-50 border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                      />
                      <span className="text-xs text-slate-600 font-semibold">Amount with Decimal e.g. 0.00</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printReceivedAmount}
                        onChange={(e) => setPrintReceivedAmount(e.target.checked)}
                        className="rounded bg-slate-50 border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                      />
                      <span className="text-xs text-slate-600 font-semibold">Received Amount</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printBalanceAmount}
                        onChange={(e) => setPrintBalanceAmount(e.target.checked)}
                        className="rounded bg-slate-50 border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                      />
                      <span className="text-xs text-slate-600 font-semibold">Balance Amount</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printCurrentBalance}
                        onChange={(e) => setPrintCurrentBalance(e.target.checked)}
                        className="rounded bg-slate-50 border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                      />
                      <span className="text-xs text-slate-600 font-semibold">Current Balance of Party</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printTaxDetails}
                        onChange={(e) => setPrintTaxDetails(e.target.checked)}
                        className="rounded bg-slate-50 border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                      />
                      <span className="text-xs text-slate-600 font-semibold">Tax Details</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printYouSaved}
                        onChange={(e) => setPrintYouSaved(e.target.checked)}
                        className="rounded bg-slate-50 border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                      />
                      <span className="text-xs text-slate-600 font-semibold">You Saved</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printAmountWithGrouping}
                        onChange={(e) => setPrintAmountWithGrouping(e.target.checked)}
                        className="rounded bg-slate-50 border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                      />
                      <span className="text-xs text-slate-600 font-semibold">Print Amount with Grouping</span>
                    </label>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">Amount in Words</label>
                    <select
                      value={amountInWordsFormat}
                      onChange={(e) => setAmountInWordsFormat(e.target.value)}
                      className="w-full sm:w-1/2 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                    >
                      <option value="Indian">Indian (Rupees/Paise)</option>
                      <option value="International">International (Dollars/Cents)</option>
                    </select>
                  </div>
                </div>

              </div>
            )}

            {/* THERMAL PRINTER TAB */}
            {activeTab === 'Thermal' && (
              <div className="space-y-6">
                <div className="card-module space-y-5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Receipt Configurations</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">Printing Type</label>
                      <select
                        value={thermalPrintingType}
                        onChange={(e) => setThermalPrintingType(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                      >
                        <option value="Text Printing">Text Printing (Fast, Standard POS)</option>
                        <option value="Graphic Printing">Graphic Printing (Rendered Template)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={thermalUseTextStylingBold}
                          onChange={(e) => setThermalUseTextStylingBold(e.target.checked)}
                          className="rounded bg-slate-50 border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                        />
                        <span className="text-xs text-slate-600 font-semibold">Enable Bold text tags</span>
                      </label>

                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={thermalAutoCut}
                          onChange={(e) => setThermalAutoCut(e.target.checked)}
                          className="rounded bg-slate-50 border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                        />
                        <span className="text-xs text-slate-600 font-semibold">Auto Cut Paper after printing</span>
                      </label>

                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={thermalOpenCashDrawer}
                          onChange={(e) => setThermalOpenCashDrawer(e.target.checked)}
                          className="rounded bg-slate-50 border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                        />
                        <span className="text-xs text-slate-600 font-semibold">Trigger Cash Drawer pulse</span>
                      </label>

                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={thermalPrintCompanyName}
                          onChange={(e) => setThermalPrintCompanyName(e.target.checked)}
                          className="rounded bg-slate-50 border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                        />
                        <span className="text-xs text-slate-600 font-semibold">Print Company Name Header</span>
                      </label>
                    </div>

                    {thermalPrintCompanyName && (
                      <div className="pt-2">
                        <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">Thermal Company Header Override</label>
                        <input
                          type="text"
                          placeholder="Override Company Name on Receipt"
                          value={thermalCompanyName}
                          onChange={(e) => setThermalCompanyName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">Extra Feed Lines (Spacing)</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={thermalExtraLines}
                          onChange={(e) => setThermalExtraLines(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">Number of Copies</label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={thermalCopies}
                          onChange={(e) => setThermalCopies(parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-4 flex items-center justify-between">
              <button
                type="submit"
                disabled={updating}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold bg-indigo-650 hover:bg-indigo-600 text-white flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
              >
                {updating ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    <span>Saving Configurations...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4.5 w-4.5" />
                    <span>Save Settings Configurations</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

        {/* Live Preview Pane Right */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-100/50 border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
              <Printer className="h-4.5 w-4.5 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Live Layout Mockup</h3>
            </div>

            {/* Regular PDF preview sheet */}
            {activeTab !== 'Thermal' ? (() => {
              const currencySymbol = amountInWordsFormat === 'Indian' ? '₹' : '$';
              
              // 1. MINIMALIST PREVIEW
              if (regularLayoutTheme === 'Minimalist') {
                return (
                  <div
                    className="bg-white mx-auto max-w-[340px] text-[7px] text-slate-800 select-none overflow-hidden transition-all duration-300"
                    style={{ fontFamily: 'Inter, sans-serif', border: '1px solid #e2e8f0' }}
                  >
                    {/* ── TOP HEADER ── */}
                    <div className="flex justify-between items-start p-3 pb-2">
                      {/* Left: INVOICE black box */}
                      <div>
                        <div
                          className="px-3 py-2 font-extrabold text-white text-[14px] tracking-widest uppercase"
                          style={{ backgroundColor: regularThemeColor || '#111827' }}
                        >
                          INVOICE
                        </div>
                        {printCompanyName && (
                          <div className="mt-1.5 font-extrabold text-[7px] tracking-wider uppercase text-slate-800">
                            {customCompanyName || storeDefaults.shopName}
                          </div>
                        )}
                      </div>
                      {/* Right: address + accent square */}
                      <div className="text-right text-[6px] text-slate-600 space-y-0.5 flex items-start space-x-1.5">
                        <div>
                          {printAddress && <div>{customAddress || storeDefaults.address}</div>}
                          {printEmail && <div>{customEmail || storeDefaults.email}</div>}
                          {printPhone && <div>{customPhone || storeDefaults.phoneNumber}</div>}
                        </div>
                        <div className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ backgroundColor: regularThemeColor || '#111827' }}></div>
                      </div>
                    </div>

                    {/* ── COMPANY + INVOICE NUMBER DIVIDER ── */}
                    <div className="flex justify-between items-center px-3 py-1.5 border-t border-b border-slate-200">
                      <span className="font-extrabold text-[6.5px] tracking-wider uppercase text-slate-800">
                        {customCompanyName || storeDefaults.shopName}
                      </span>
                      <span className="text-[6px] text-slate-600">
                        Invoice Number: <span className="font-extrabold text-slate-900">INV-2026-001</span>
                      </span>
                    </div>

                    {/* ── BILL FROM / BILL TO ── */}
                    <div className="grid grid-cols-2 gap-3 px-3 py-2 text-[6px] text-left">
                      <div className="space-y-0.5">
                        <div className="font-extrabold text-[6.5px] text-slate-900 mb-0.5">Bill From:</div>
                        <div className="font-semibold text-slate-800">{customCompanyName || storeDefaults.shopName}</div>
                        {printAddress && <div className="text-slate-600 leading-tight">{customAddress || storeDefaults.address}</div>}
                        {printPhone && <div className="text-slate-600">{customPhone || storeDefaults.phoneNumber}</div>}
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-extrabold text-[6.5px] text-slate-900 mb-0.5">Bill To:</div>
                        <div className="font-semibold text-slate-800">ABC Corporation</div>
                        <div className="text-slate-600 leading-tight">873 Liberty Street Montgomery, AL 36109</div>
                        <div className="text-slate-600">725-320-2997</div>
                      </div>
                    </div>

                    {/* ── ITEMS TABLE ── */}
                    <table className="w-full text-left text-[6px] border-collapse">
                      <thead>
                        <tr className="text-white font-extrabold uppercase tracking-wide"
                          style={{ backgroundColor: regularThemeColor || '#111827' }}>
                          <th className="px-2 py-1.5 w-6">Item</th>
                          <th className="px-2 py-1.5">Product</th>
                          {printTotalQty && <th className="px-2 py-1.5 text-center">Hours/Rate</th>}
                          <th className="px-2 py-1.5 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { no: 1, name: 'Web Design',      hrs: '10 Hours', amt: 800 },
                          { no: 2, name: 'Content Writing', hrs: '8 Hours',  amt: 200 },
                          { no: 3, name: 'Graphic Design',  hrs: '6 Hours',  amt: 50  },
                        ].map((item) => (
                          <tr key={item.no} className="border-b border-slate-200">
                            <td className="px-2 py-1.5 text-slate-500">{item.no}</td>
                            <td className="px-2 py-1.5 text-slate-800">{item.name}</td>
                            {printTotalQty && <td className="px-2 py-1.5 text-center text-slate-600">{item.hrs}</td>}
                            <td className="px-2 py-1.5 text-right font-semibold text-slate-800">
                              {currencySymbol}{formatPreviewAmount(item.amt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* ── BOTTOM SECTION ── */}
                    <div className="grid grid-cols-2 gap-2 px-3 pt-2 pb-3">
                      {/* Left: Payment Method + Thank you */}
                      <div className="space-y-2 text-[6px] text-left">
                        <div>
                          <div className="font-extrabold text-[6.5px] text-slate-900 mb-1">Payment Method:</div>
                          <div className="flex items-center space-x-2 text-slate-600">
                            <span className="flex items-center space-x-0.5">
                              <span className="w-2 h-2 border border-slate-400 inline-block flex-shrink-0"></span>
                              <span>Paypal</span>
                            </span>
                            <span className="flex items-center space-x-0.5">
                              <span className="w-2 h-2 border border-slate-400 inline-block flex-shrink-0"></span>
                              <span>Cash</span>
                            </span>
                            <span className="flex items-center space-x-0.5">
                              <span className="w-2 h-2 border border-slate-400 inline-block flex-shrink-0"></span>
                              <span>Debit Card</span>
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start space-x-1 pt-2">
                          <div className="w-2.5 h-6 flex-shrink-0" style={{ backgroundColor: regularThemeColor || '#111827' }}></div>
                          <div className="text-[5.5px] text-slate-600 leading-tight">
                            Thank you for choosing our services!<br />Please remit payment by the due date.
                          </div>
                        </div>
                      </div>

                      {/* Right: Totals + Date + Signature */}
                      <div className="text-[6px] text-right space-y-0.5">
                        <div className="flex justify-between font-semibold">
                          <span className="text-slate-700">SUB TOTAL</span>
                          <span>{currencySymbol}{formatPreviewAmount(1050)}</span>
                        </div>
                        {printTaxDetails && (
                          <div className="flex justify-between text-slate-600">
                            <span>TAX</span>
                            <span>(7%)</span>
                          </div>
                        )}
                        <div className="flex justify-between font-extrabold text-[7px] border-t border-slate-300 pt-0.5 text-slate-900">
                          <span>TOTAL</span>
                          <span>{currencySymbol}{formatPreviewAmount(printTaxDetails ? 1123.50 : 1050)}</span>
                        </div>
                        <div className="pt-1 text-slate-500 text-[5.5px]">
                          Date : {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="pt-2 border-t border-slate-800 mt-1 text-[5.5px] text-slate-600 font-medium">
                          {customCompanyName || 'Authorised Signatory'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // 2. COMMERCIAL PREVIEW
              if (regularLayoutTheme === 'Commercial') {
                const borderCell = 'border border-slate-300 px-1.5 py-1 text-[5.5px] text-slate-700 align-top';
                const labelText  = 'text-[5.5px] text-slate-600';
                return (
                  <div
                    className="bg-white mx-auto max-w-[340px] text-[6px] text-slate-800 select-none overflow-hidden transition-all duration-300"
                    style={{ fontFamily: 'Inter, sans-serif', border: '1px solid #cbd5e1' }}
                  >
                    {/* ── TITLE BAR ── */}
                    <div
                      className="text-center py-2 font-extrabold text-[10px] tracking-widest text-white uppercase"
                      style={{ backgroundColor: regularThemeColor }}
                    >
                      COMMERCIAL INVOICE
                    </div>

                    {/* ── TOP INFO GRID ── */}
                    <table className="w-full border-collapse">
                      <tbody>
                        <tr>
                          {/* Vendor/Exporter — spans 4 sub-rows in height */}
                          <td className={`${borderCell} w-[34%] h-12`} rowSpan={4}>
                            <span className={labelText}>Vendor/Exporter:</span>
                            {printCompanyName && (
                              <div className="mt-0.5 font-semibold text-slate-800">{customCompanyName || storeDefaults.shopName}</div>
                            )}
                            {printAddress && (
                              <div className="text-slate-500 leading-tight mt-0.5">{customAddress || storeDefaults.address}</div>
                            )}
                            {printPhone && <div className="text-slate-500 mt-0.5">{customPhone || storeDefaults.phoneNumber}</div>}
                          </td>
                          <td className={`${borderCell} w-[33%]`}>
                            <span className={labelText}>Invoice Number:</span>
                            <div className="font-semibold mt-0.5">INV-2026-001</div>
                          </td>
                          <td className={borderCell}>
                            <span className={labelText}>Date of Shipment:</span>
                            <div className="mt-0.5">{new Date().toLocaleDateString()}</div>
                          </td>
                        </tr>
                        <tr>
                          <td className={borderCell}>
                            <span className={labelText}>Letter of Credit Number:</span>
                          </td>
                          <td className={borderCell}>
                            <span className={labelText}>AWB/BL Number:</span>
                          </td>
                        </tr>
                        <tr>
                          <td className={borderCell}>
                            <span className={labelText}>Currency:</span>
                            <span className="ml-1 font-semibold">{amountInWordsFormat === 'Indian' ? 'INR (₹)' : 'USD ($)'}</span>
                          </td>
                          <td className={borderCell}>
                            <span className={labelText}>Country of Origin:</span>
                          </td>
                        </tr>
                        <tr>
                          <td className={borderCell} colSpan={2}>
                            <span className={labelText}>Conditions of Sale / Terms of Sale:</span>
                            {invoiceNotes ? <div className="mt-0.5 text-slate-600">{invoiceNotes}</div> : null}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* ── CONSIGNEE / IMPORTER ── */}
                    <table className="w-full border-collapse">
                      <tbody>
                        <tr>
                          <td className={`${borderCell} w-1/2 h-8`}>
                            <span className={labelText}>Consignee:</span>
                            <div className="mt-0.5 font-semibold text-slate-800">ABC Corporation</div>
                          </td>
                          <td className={`${borderCell} w-1/2 h-8`}>
                            <span className={labelText}>Importer:</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* ── TRANSPORTATION ROW ── */}
                    <table className="w-full border-collapse">
                      <tbody>
                        <tr>
                          <td className={`${borderCell} w-[34%]`}>
                            <div className={labelText}>Transportation:</div>
                            <div className="text-slate-500 mt-0.5">-- Via:</div>
                            <div className="text-slate-500">-- From:</div>
                          </td>
                          <td className={`${borderCell} w-[33%]`}>
                            <div className={labelText}>Total Number of Packages:</div>
                            <div className="text-slate-500 mt-0.5">-- Total Net Weight:</div>
                            <div className="text-slate-500">-- Total Gross Weight:</div>
                          </td>
                          <td className={borderCell}>
                            <span className={labelText}>Total Invoice:</span>
                            {printTaxDetails && (
                              <div className="mt-0.5 font-bold text-slate-800">{currencySymbol}{formatPreviewAmount(4490)}</div>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* ── PRODUCTS TABLE ── */}
                    <table className="w-full border-collapse mt-2">
                      <thead>
                        <tr style={{ backgroundColor: regularThemeColor }}>
                          <th className="border border-slate-300 px-1.5 py-1 text-[5.5px] text-white font-bold text-left w-[40%]">Product Description</th>
                          <th className="border border-slate-300 px-1.5 py-1 text-[5.5px] text-white font-bold text-center w-[12%]">Qty</th>
                          <th className="border border-slate-300 px-1.5 py-1 text-[5.5px] text-white font-bold text-center w-[15%]">Weight</th>
                          <th className="border border-slate-300 px-1.5 py-1 text-[5.5px] text-white font-bold text-right w-[16%]">Unit Price</th>
                          <th className="border border-slate-300 px-1.5 py-1 text-[5.5px] text-white font-bold text-right">Total Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: 'Bosch Hand Tool Kit',     qty: '1 NOS', wt: '2.5 kg', price: 2535, total: 2535 },
                          { name: 'Taparia Universal Kit',   qty: '1 NOS', wt: '1.8 kg', price: 1270, total: 1270 },
                          { name: 'Flexi-Pipe Conduit 10m',  qty: '2 NOS', wt: '3.2 kg', price: 685,  total: 1370 },
                        ].map((item, i) => (
                          <tr key={i} className="border-b border-slate-200">
                            <td className="border border-slate-200 px-1.5 py-1 text-[5.5px] text-slate-700">{item.name}</td>
                            <td className="border border-slate-200 px-1.5 py-1 text-[5.5px] text-center text-slate-600">{item.qty}</td>
                            <td className="border border-slate-200 px-1.5 py-1 text-[5.5px] text-center text-slate-600">{item.wt}</td>
                            <td className="border border-slate-200 px-1.5 py-1 text-[5.5px] text-right font-mono text-slate-700">{currencySymbol}{formatPreviewAmount(item.price)}</td>
                            <td className="border border-slate-200 px-1.5 py-1 text-[5.5px] text-right font-mono font-semibold text-slate-800">{currencySymbol}{formatPreviewAmount(item.total)}</td>
                          </tr>
                        ))}
                        {/* empty filler row */}
                        <tr>
                          <td className="border border-slate-200 px-1.5 py-3" colSpan={5}></td>
                        </tr>
                      </tbody>
                    </table>

                    {/* ── LEGAL DISCLAIMER ── */}
                    <div className="px-1.5 py-2 text-[5px] text-slate-500 leading-relaxed">
                      These commodities, technologies, or softwares were exported from the country in accordance with export administration regulations.
                      Diversion contrary to applicable law prohibited. We certify that this commercial invoice is true and correct.
                    </div>

                    {/* ── NAME / SIGNATURE / DATE FOOTER ── */}
                    <table className="w-full border-collapse">
                      <tbody>
                        <tr>
                          <td className={`${borderCell} w-1/3 h-6`}>
                            <span className={labelText}>Name</span>
                            {printCompanyName && <div className="mt-0.5 font-semibold text-slate-800">{customCompanyName || storeDefaults.shopName}</div>}
                          </td>
                          <td className={`${borderCell} w-1/3 h-6`}>
                            <span className={labelText}>Signature</span>
                          </td>
                          <td className={`${borderCell} w-1/3 h-6`}>
                            <span className={labelText}>Date</span>
                            <div className="mt-0.5">{new Date().toLocaleDateString()}</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              }

              // 3. MODERN PREVIEW
              if (regularLayoutTheme === 'Modern') {
                return (
                  <div
                    className="bg-white mx-auto max-w-[340px] text-[6px] text-slate-800 select-none overflow-hidden transition-all duration-300"
                    style={{ fontFamily: 'Inter, sans-serif', border: '1px solid #e2e8f0' }}
                  >
                    {/* ── TOP HEADER BAND ── */}
                    <div className="relative" style={{ backgroundColor: regularThemeColor }}>
                      <div className="flex justify-between items-start px-3 pt-3 pb-6">
                        {/* Left: Company name + tagline + invoice meta */}
                        <div className="text-white space-y-0.5">
                          {printCompanyName && (
                            <div className="font-extrabold text-[9px] tracking-tight uppercase">
                              {customCompanyName || storeDefaults.shopName}
                            </div>
                          )}
                          <div className="text-[5.5px] opacity-75">
                            {companyTagline || 'Your Tagline Goes Here'}
                          </div>
                          <div className="pt-1.5 space-y-0.5 text-[5.5px] text-white/80">
                            <div>Invoice &nbsp;: <span className="font-bold text-white">#INV-2026-001</span></div>
                            <div>Date &nbsp;&nbsp;&nbsp;&nbsp;: <span className="font-bold text-white">{new Date().toLocaleDateString()}</span></div>
                          </div>
                        </div>
                        {/* Right: INVOICE title */}
                        <div className="font-extrabold text-white text-[16px] tracking-widest leading-none mt-1">
                          INVOICE
                        </div>
                      </div>
                      {/* Wave curve cutout — white half-ellipse at bottom-right */}
                      <div
                        className="absolute bottom-0 right-0 w-20 h-8 bg-white"
                        style={{ borderTopLeftRadius: '9999px' }}
                      ></div>
                    </div>

                    {/* ── PAYMENT INFO (left dark) / INVOICE TO (right) ── */}
                    <div className="flex">
                      {/* Left: Payment Info on dark bg */}
                      <div className="w-[48%] relative" style={{ backgroundColor: regularThemeColor }}>
                        <div className="px-3 pt-2 pb-4 text-white">
                          <div className="font-extrabold text-[6px] mb-1">Payment Info:</div>
                          <table className="text-[5.5px] text-white/80 w-full">
                            <tbody>
                              <tr>
                                <td className="pr-1 whitespace-nowrap">Account No</td>
                                <td>: {bankAccountNumber || '000 000 000 000'}</td>
                              </tr>
                              <tr>
                                <td className="pr-1">A/C Name</td>
                                <td>: {bankAccountHolderName || 'John Smith'}</td>
                              </tr>
                              <tr>
                                <td className="pr-1 whitespace-nowrap">Bank Details</td>
                                <td>: {bankName || 'John Smith'}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        {/* Wave curve cutout — white quarter-circle top-right */}
                        <div
                          className="absolute top-0 right-0 w-8 h-8 bg-white"
                          style={{ borderBottomLeftRadius: '9999px' }}
                        ></div>
                      </div>
                      {/* Right: Invoice To */}
                      <div className="w-[52%] px-3 pt-2 pb-3 text-left">
                        <div className="font-extrabold text-[6.5px] text-slate-800">Invoice To:</div>
                        <div className="font-extrabold text-[8px] text-slate-900 border-b-2 pb-0.5 mb-1" style={{ borderColor: regularThemeColor }}>
                          John Smith
                        </div>
                        <div className="text-[5.5px] text-slate-600 leading-relaxed">
                          123 Your Street Address, City, Country NY, Lorem Ipsum is simply dummy text of the printing industry.
                        </div>
                      </div>
                    </div>

                    {/* ── ITEMS TABLE ── */}
                    <table className="w-full text-left text-[5.5px] border-collapse">
                      <thead>
                        <tr className="text-white font-bold" style={{ backgroundColor: regularThemeColor }}>
                          <th className="px-2 py-1 w-7 text-center">SL.</th>
                          <th className="px-2 py-1">Product Description</th>
                          <th className="px-1 py-1 text-right">Price</th>
                          {printTotalQty && <th className="px-1 py-1 text-center">Qty</th>}
                          <th className="px-2 py-1 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { sl: '01.', name: 'Product No 01', desc: 'Lorem Ipsum is simply dummy text of the printing industry.', price: 20,  qty: 2,  total: 40  },
                          { sl: '02.', name: 'Product No 02', desc: 'Lorem Ipsum is simply dummy text of the printing industry.', price: 10,  qty: 8,  total: 80  },
                          { sl: '03.', name: 'Product No 03', desc: 'Lorem Ipsum is simply dummy text of the printing industry.', price: 30,  qty: 10, total: 300 },
                          { sl: '04.', name: 'Product No 04', desc: 'Lorem Ipsum is simply dummy text of the printing industry.', price: 15,  qty: 12, total: 180 },
                          { sl: '05.', name: 'Product No 05', desc: 'Lorem Ipsum is simply dummy text of the printing industry.', price: 18,  qty: 9,  total: 162 },
                          { sl: '06.', name: 'Product No 06', desc: 'Lorem Ipsum is simply dummy text of the printing industry.', price: 50,  qty: 15, total: 750 },
                        ].map((item, i) => (
                          <tr key={i} className="border-b border-slate-100" style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                            <td className="px-2 py-1 text-center text-slate-500 font-semibold">{item.sl}</td>
                            <td className="px-2 py-1">
                              <div className="font-bold text-slate-800">{item.name}</div>
                              <div className="text-[4.5px] text-slate-400 leading-tight mt-0.5">{item.desc}</div>
                            </td>
                            <td className="px-1 py-1 text-right font-mono text-slate-700">{currencySymbol}{formatPreviewAmount(item.price)}</td>
                            {printTotalQty && <td className="px-1 py-1 text-center text-slate-600">{item.qty}</td>}
                            <td className="px-2 py-1 text-right font-bold font-mono text-slate-800">{currencySymbol}{formatPreviewAmount(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* ── BOTTOM SECTION ── */}
                    <div className="flex">
                      {/* Left: Contact + Terms — dark bg with curve */}
                      <div className="w-[48%] relative" style={{ backgroundColor: regularThemeColor }}>
                        {/* Wave curve cutout — white quarter-circle top-right */}
                        <div
                          className="absolute top-0 right-0 w-8 h-8 bg-white"
                          style={{ borderBottomLeftRadius: '9999px' }}
                        ></div>
                        <div className="px-3 pt-3 pb-3 text-white space-y-0.5">
                          {printEmail && (
                            <div className="text-[5.5px]">
                              <span className="font-bold">Email</span>
                              <span className="opacity-75"> : {customEmail || storeDefaults.email}</span>
                            </div>
                          )}
                          {printPhone && (
                            <div className="text-[5.5px]">
                              <span className="font-bold">Web</span>
                              <span className="opacity-75"> : {customEmail || storeDefaults.email}</span>
                            </div>
                          )}
                          {printAddress && (
                            <div className="text-[5.5px]">
                              <span className="font-bold">Address</span>
                              <span className="opacity-75"> : {customAddress || storeDefaults.address}</span>
                            </div>
                          )}
                          <div className="pt-1.5">
                            <div className="font-extrabold text-[6px] mb-0.5">Terms &amp; Conditions</div>
                            <div className="text-[4.5px] opacity-70 leading-relaxed">
                              Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's.
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Sub Total / Tax / Discount / Total + Signature */}
                      <div className="w-[52%] px-2 pt-2 pb-3 space-y-0">
                        {/* Sub Total — medium grey bg like image */}
                        <div className="flex justify-between items-center px-2 py-1" style={{ backgroundColor: '#cbd5e1' }}>
                          <span className="text-[5.5px] text-slate-700 font-semibold">Sub Total</span>
                          <span className="text-[5.5px] text-slate-500 mx-1">:</span>
                          <span className="text-[5.5px] font-bold font-mono text-slate-800">{currencySymbol}{formatPreviewAmount(1512)}</span>
                        </div>
                        {/* Tax — white bg */}
                        {printTaxDetails && (
                          <div className="flex justify-between items-center px-2 py-1 bg-white border-y border-slate-200">
                            <span className="text-[5.5px] text-slate-700 font-semibold">Tax</span>
                            <span className="text-[5.5px] text-slate-500 mx-1">:</span>
                            <span className="text-[5.5px] font-mono text-slate-600">00%</span>
                          </div>
                        )}
                        {/* Discount — medium grey bg like image */}
                        <div className="flex justify-between items-center px-2 py-1" style={{ backgroundColor: '#cbd5e1' }}>
                          <span className="text-[5.5px] text-slate-700 font-semibold">Discount</span>
                          <span className="text-[5.5px] text-slate-500 mx-1">:</span>
                          <span className="text-[5.5px] font-mono text-slate-600">00%</span>
                        </div>
                        {/* Total — same dark theme color as panels, white text */}
                        <div className="flex justify-between items-center px-2 py-1 text-white font-extrabold"
                          style={{ backgroundColor: regularThemeColor }}>
                          <span className="text-[6px]">Total</span>
                          <span className="text-[5.5px] opacity-75 mx-1">:</span>
                          <span className="text-[6px] font-mono">{currencySymbol}{formatPreviewAmount(1512)}</span>
                        </div>
                        {/* Signature */}
                        <div className="pt-3 text-right pr-2">
                          <div className="border-t border-slate-400 pt-0.5 inline-block">
                            <span className="text-[5.5px] text-slate-500">Signature</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // 4. PROFORMA PREVIEW
              if (regularLayoutTheme === 'Proforma') {
                const thBg  = { backgroundColor: regularThemeColor };
                const thCls = 'px-1.5 py-0.5 text-white font-bold text-[5.5px] uppercase border border-white/20';
                const tdCls = 'px-1.5 py-0.5 text-[5.5px] text-slate-700 border border-slate-200 align-top';
                const labelCls = 'text-[5px] text-slate-500';
                const valCls   = 'text-[5.5px] text-slate-800';
                return (
                  <div
                    className="bg-white mx-auto max-w-[340px] text-[5.5px] text-slate-800 select-none overflow-hidden"
                    style={{ fontFamily: 'Inter, sans-serif', border: '1px solid #cbd5e1' }}
                  >
                    {/* ── TOP HEADER ── */}
                    <div className="flex justify-between items-start px-2 pt-2 pb-1 border-b border-slate-200">
                      {/* Left: company info */}
                      <div className="text-left space-y-0.5">
                        {printCompanyName && (
                          <div className="font-extrabold text-[8px] text-slate-900">[{customCompanyName || storeDefaults.shopName}]</div>
                        )}
                        {printAddress && <div className={labelCls}>{customAddress || storeDefaults.address}</div>}
                        {printPhone  && <div className={labelCls}>Phone: {customPhone || storeDefaults.phoneNumber}</div>}
                        {printEmail  && <div className={labelCls}>Fax: {customEmail || storeDefaults.email}</div>}
                        <div className={labelCls}>Website:</div>
                      </div>
                      {/* Right: title + meta grid */}
                      <div className="text-right space-y-1">
                        <div className="font-extrabold text-[10px] tracking-wide" style={{ color: regularThemeColor }}>
                          PRO FORMA INVOICE
                        </div>
                        <table className="text-[5px] border-collapse ml-auto">
                          <tbody>
                            {[
                              ['Date',            '1/1/2025'],
                              ['Expiration Date', '1/30/2025'],
                              ['Invoice #',       '[123456]'],
                              ['Customer ID',     '[123]'],
                            ].map(([lbl, val]) => (
                              <tr key={lbl}>
                                <td className="pr-1 text-slate-600 whitespace-nowrap">{lbl}</td>
                                <td className="border border-slate-300 px-1 py-0.5 text-slate-800 font-mono min-w-[36px] text-center">{val}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* ── CUSTOMER / SHIP TO / SHIPPING DETAILS ── */}
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className={thCls} style={thBg}>Customer</th>
                          <th className={thCls} style={thBg}>Ship To</th>
                          <th className={thCls} style={thBg}>Shipping Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className={`${tdCls} w-[34%]`}>
                            <div>[Name]</div><div>[Company Name]</div>
                            <div>[Street Address]</div><div>[City, ST ZIP]</div><div>[Phone]</div>
                          </td>
                          <td className={`${tdCls} w-[33%]`}>
                            <div>[Name]</div><div>[Company Name]</div>
                            <div>[Street Address]</div><div>[City, ST ZIP]</div><div>[Phone]</div>
                          </td>
                          <td className={`${tdCls}`}>
                            {[
                              ['Freight Type',     '[Air or Ocean]'],
                              ['Est Ship Date',    '[Date]'],
                              ['Est Gross Weight', '[weight] [units]'],
                              ['Est Cubic Weight', '[weight] [units]'],
                              ['Total Packages',   '[Qty]'],
                            ].map(([l, v]) => (
                              <div key={l} className="flex justify-between space-x-1">
                                <span className={labelCls}>{l}</span>
                                <span className={valCls}>{v}</span>
                              </div>
                            ))}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* ── ITEMS TABLE ── */}
                    <table className="w-full border-collapse">
                      <thead>
                        <tr style={thBg}>
                          <th className={`${thCls} w-[13%]`}>Part<br/>Number</th>
                          <th className={`${thCls} w-[13%]`}>Unit of<br/>Measure</th>
                          <th className={thCls}>Description</th>
                          <th className={`${thCls} text-center w-[8%]`}>QTY</th>
                          <th className={`${thCls} text-right w-[12%]`}>Unit<br/>Price</th>
                          <th className={`${thCls} text-center w-[8%]`}>TAX</th>
                          <th className={`${thCls} text-right w-[13%]`}>Total<br/>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className={tdCls}>123ABC</td>
                          <td className={tdCls}>pounds</td>
                          <td className={tdCls}>Material ABC</td>
                          <td className={`${tdCls} text-center`}>3</td>
                          <td className={`${tdCls} text-right font-mono`}>45.23</td>
                          <td className={`${tdCls} text-center`}>X</td>
                          <td className={`${tdCls} text-right font-mono`}>{formatPreviewAmount(135.69)}</td>
                        </tr>
                        {/* filler rows */}
                        {[...Array(5)].map((_, i) => (
                          <tr key={i} className="border-b border-slate-100">
                            <td className={tdCls}>&nbsp;</td>
                            <td className={tdCls}></td>
                            <td className={tdCls}></td>
                            <td className={tdCls}></td>
                            <td className={tdCls}></td>
                            <td className={tdCls}></td>
                            <td className={`${tdCls} bg-slate-50`}>-</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* ── TERMS + TOTALS ── */}
                    <div className="flex border-t border-slate-200">
                      {/* Left: Terms */}
                      <div className="w-[52%] border-r border-slate-200">
                        <div className="px-1.5 py-0.5 font-bold text-[5.5px] text-white uppercase" style={thBg}>
                          Terms of Sale and Other Comments
                        </div>
                        <div className="px-1.5 py-1 text-[5px] text-slate-500 leading-relaxed min-h-[40px]">
                          <div>[Include any terms of sale or other information as needed]</div>
                          <div className="mt-0.5">[Include payment terms such as Letter of Credit, Open Account or other terms.]</div>
                        </div>
                      </div>
                      {/* Right: Totals breakdown */}
                      <div className="w-[48%]">
                        {[
                          ['Subtotal',          formatPreviewAmount(135.69), false],
                          ['Taxable',           formatPreviewAmount(135.69), false],
                          ['Tax rate',          '6.250%',                    false],
                          ['Tax',               formatPreviewAmount(8.48),   false],
                          ['Freight',           '-',                         false],
                          ['Insurance',         '-',                         false],
                          ['Legal/Consular',    '-',                         false],
                          ['Inspection/Cert.',  '-',                         false],
                          ['Other (specify)',   '-',                         false],
                          ['Other (specify)',   '-',                         false],
                        ].map(([lbl, val], i) => (
                          <div key={i} className="flex justify-between px-1.5 py-0.5 border-b border-slate-100 text-[5px]">
                            <span className="text-slate-600">{lbl}</span>
                            <span className="font-mono text-slate-700">{val}</span>
                          </div>
                        ))}
                        {/* TOTAL row */}
                        <div className="flex justify-between px-1.5 py-0.5 border-b border-slate-200 text-[5.5px] font-extrabold">
                          <span className="text-slate-900">TOTAL</span>
                          <span className="font-mono">
                            <span className="mr-1 text-slate-500">$</span>
                            {formatPreviewAmount(144.17)}
                          </span>
                        </div>
                        <div className="flex justify-between px-1.5 py-0.5 text-[5px]">
                          <span className="text-slate-600">Currency</span>
                          <span className="font-mono font-bold text-slate-700">{amountInWordsFormat === 'Indian' ? 'INR' : 'USD'}</span>
                        </div>
                      </div>
                    </div>

                    {/* ── ADDITIONAL DETAILS ── */}
                    <div>
                      <div className="px-1.5 py-0.5 font-bold text-[5.5px] text-white uppercase bg-slate-400">
                        Additional Details
                      </div>
                      <div className="px-2 py-1 space-y-0.5 text-[5px]">
                        {[
                          ['Country of Origin',    '[Country]'],
                          ['Port of Embarkation',  '[Name]'],
                          ['Port of Discharge',    '[Name]'],
                        ].map(([lbl, val]) => (
                          <div key={lbl} className="flex space-x-4">
                            <span className="text-slate-600 w-24 flex-shrink-0">{lbl}</span>
                            <span className="text-slate-800">{val}</span>
                          </div>
                        ))}
                        <div className="flex items-center space-x-2 pt-0.5">
                          <span className="text-slate-600 w-24 flex-shrink-0">Reason for Export:</span>
                          <div className="flex-1 border border-slate-300 h-3"></div>
                        </div>
                        <div className="pt-1 text-[4.5px] text-slate-600">
                          I certify the above to be true and correct to the best of my knowledge.
                        </div>
                      </div>
                    </div>

                    {/* ── SIGNATURE FOOTER ── */}
                    <div className="px-2 pb-2 pt-1 border-t border-slate-200">
                      <div className="text-[5px] text-slate-700 mb-1">x</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border-t border-slate-400 pt-0.5">
                          <div className="text-[4.5px] text-slate-600">[Typed Name]</div>
                          {printCompanyName && (
                            <div className="text-[4.5px] text-slate-600">{customCompanyName || storeDefaults.shopName}</div>
                          )}
                        </div>
                        <div className="border-t border-slate-400 pt-0.5">
                          <div className="text-[4.5px] text-slate-600">Date</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // 5. GST TAX INVOICE PREVIEW
              if (regularLayoutTheme === 'TaxInvoice') {
                return (
                  <div
                    className="bg-white rounded-xl shadow-xl mx-auto max-w-[340px] text-[6px] text-slate-700 select-none overflow-hidden transition-all duration-300"
                    style={{ fontFamily: 'Inter, sans-serif', border: '1px solid #d1d5db' }}
                  >
                    {/* ── TOP HEADER: Company name banner + logo ── */}
                    <div className="px-3 pt-3 pb-1 flex justify-between items-start">
                      <div className="text-left">
                        {printCompanyName && (
                          <div
                            className="font-extrabold uppercase tracking-tight leading-tight"
                            style={{
                              fontSize: companyNameTextSize === 'Large' ? '11px' : companyNameTextSize === 'Medium' ? '9px' : '7.5px',
                              color: regularThemeColor,
                            }}
                          >
                            {customCompanyName || storeDefaults.shopName}
                          </div>
                        )}
                        {/* Tagline band */}
                        <div
                          className="mt-0.5 px-1.5 py-0.5 text-white font-bold text-[5.5px] rounded-sm"
                          style={{ backgroundColor: regularThemeColor }}
                        >
                          {companyTagline || 'Manufacturing & Supply of Precision Tools & Components'}
                        </div>
                        {printAddress && (
                          <div className="mt-1 text-[6px] text-slate-600 leading-tight">
                            {customAddress || storeDefaults.address}
                          </div>
                        )}
                      </div>
                      {printCompanyLogo && (customLogoUrl || storeDefaults.logoUrl) && (
                        <img
                          src={customLogoUrl || storeDefaults.logoUrl}
                          alt="Logo"
                          className="h-10 w-10 object-contain flex-shrink-0 ml-2"
                        />
                      )}
                    </div>

                    {/* Contact line */}
                    <div className="px-3 pb-1.5 flex justify-between text-[5.5px] text-slate-500 border-b border-slate-200">
                      <span>{printPhone ? `Tel : ${customPhone || storeDefaults.phoneNumber}` : ''}</span>
                      <span>{printEmail ? `Web : ${customEmail || storeDefaults.email}` : ''}</span>
                    </div>

                    {/* ── PAN + TAX INVOICE TITLE ROW ── */}
                    <div className="grid grid-cols-3 border-b border-slate-300">
                      <div className="px-2 py-1 border-r border-slate-300 flex items-center">
                        {printGSTIN && (
                          <span className="font-bold text-[6px]">PAN: <span className="font-mono">{customGSTIN || storeDefaults.gstin}</span></span>
                        )}
                      </div>
                      <div className="px-2 py-1 text-center border-r border-slate-300">
                        <span className="text-[9px] font-extrabold text-slate-800 tracking-wide">TAX INVOICE</span>
                      </div>
                      <div className="px-2 py-1 text-right">
                        <span className="text-[5.5px] font-bold text-slate-500 uppercase tracking-wide">Original for Recipient</span>
                      </div>
                    </div>

                    {/* ── CUSTOMER DETAIL + INVOICE META ── */}
                    <div className="grid grid-cols-2 border-b border-slate-200">
                      {/* Left: Customer Detail */}
                      <div className="border-r border-slate-200">
                        <div className="px-2 py-0.5 text-center font-bold text-[6px] text-slate-700 bg-slate-100 border-b border-slate-200">Customer Detail</div>
                        <table className="w-full text-[6px]">
                          <tbody>
                            <tr className="border-b border-slate-100">
                              <td className="px-1.5 py-0.5 font-bold text-slate-600 w-12">M/S</td>
                              <td className="px-1 py-0.5 text-slate-700 font-medium">Shiv Engineering</td>
                            </tr>
                            <tr className="border-b border-slate-100">
                              <td className="px-1.5 py-0.5 font-bold text-slate-600">Address</td>
                              <td className="px-1 py-0.5 text-slate-600 leading-tight">Sumel Business Park 7, Kochi, Kerala - 380023</td>
                            </tr>
                            <tr className="border-b border-slate-100">
                              <td className="px-1.5 py-0.5 font-bold text-slate-600">Phone</td>
                              <td className="px-1 py-0.5 text-slate-700">9878789878</td>
                            </tr>
                            <tr className="border-b border-slate-100">
                              <td className="px-1.5 py-0.5 font-bold text-slate-600">GSTIN</td>
                              <td className="px-1 py-0.5 font-mono text-slate-700">32AABBA7890B1ZB</td>
                            </tr>
                            <tr>
                              <td className="px-1.5 py-0.5 font-bold text-slate-600">Place of Supply</td>
                              <td className="px-1 py-0.5 text-slate-700">Kerala (32)</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      {/* Right: Invoice Meta */}
                      <div>
                        <table className="w-full text-[6px]">
                          <tbody>
                            <tr className="border-b border-slate-100">
                              <td className="px-1.5 py-0.5 font-bold text-slate-600">Invoice No.</td>
                              <td className="px-1 py-0.5 font-bold text-slate-800">GST-3425-26</td>
                              <td className="px-1 py-0.5 font-bold text-slate-600">Invoice Date</td>
                              <td className="px-1 py-0.5 text-slate-700">23-Jul-2025</td>
                            </tr>
                            <tr className="border-b border-slate-100">
                              <td className="px-1.5 py-0.5 font-bold text-slate-600">Challan No</td>
                              <td className="px-1 py-0.5 text-slate-700">33</td>
                              <td className="px-1 py-0.5 font-bold text-slate-600">Challan Date</td>
                              <td className="px-1 py-0.5 text-slate-700">23-Jul-2025</td>
                            </tr>
                            <tr className="border-b border-slate-100">
                              <td className="px-1.5 py-0.5 font-bold text-slate-600">E-Way Bill No.</td>
                              <td className="px-1 py-0.5 font-mono text-slate-700" colSpan={3}>78456378</td>
                            </tr>
                            <tr className="border-b border-slate-100">
                              <td className="px-1.5 py-0.5 font-bold text-slate-600">Transport</td>
                              <td className="px-1 py-0.5 text-slate-700" colSpan={3}>Silver Roadlines</td>
                            </tr>
                            <tr>
                              <td className="px-1.5 py-0.5 font-bold text-slate-600">Transport ID</td>
                              <td className="px-1 py-0.5 font-mono text-slate-700" colSpan={3}>24ABSFS0321B2ZL</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* ── ITEMS TABLE ── */}
                    <table className="w-full text-left text-[5.5px] border-collapse border-b border-slate-200">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                          <th className="px-1 py-1 text-center border-r border-slate-200 w-4">Sr.</th>
                          <th className="px-1 py-1 border-r border-slate-200">Name of Product / Service</th>
                          <th className="px-1 py-1 text-center border-r border-slate-200">HSN/SAC</th>
                          {printTotalQty && <th className="px-1 py-1 text-center border-r border-slate-200">Qty</th>}
                          <th className="px-1 py-1 text-right border-r border-slate-200">Rate</th>
                          <th className="px-1 py-1 text-right">Taxable Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { sr: 1, name: 'Bosch All-in-One Metal Hand Tool Kit', hsn: '8302', qty: '1 NOS', rate: 2535, val: 2535 },
                          { sr: 2, name: 'Taparia Universal Tool Kit', hsn: '8302', qty: '1 NOS', rate: 1270, val: 1270 },
                        ].map((item) => (
                          <tr key={item.sr} className="border-b border-slate-100">
                            <td className="px-1 py-0.5 text-center border-r border-slate-100 font-bold">{item.sr}</td>
                            <td className="px-1 py-0.5 border-r border-slate-100 font-semibold">{item.name}</td>
                            <td className="px-1 py-0.5 text-center border-r border-slate-100 font-mono">{item.hsn}</td>
                            {printTotalQty && <td className="px-1 py-0.5 text-center border-r border-slate-100">{item.qty}</td>}
                            <td className="px-1 py-0.5 text-right border-r border-slate-100">{formatPreviewAmount(item.rate)}</td>
                            <td className="px-1 py-0.5 text-right">{formatPreviewAmount(item.val)}</td>
                          </tr>
                        ))}
                        {/* IGST row */}
                        {printTaxDetails && (
                          <tr className="border-b border-slate-100">
                            <td colSpan={printTotalQty ? 5 : 4} className="px-1 py-0.5 text-right font-bold text-slate-600 border-r border-slate-100">IGST (18.00 %)</td>
                            <td className="px-1 py-0.5 text-right text-slate-700">{formatPreviewAmount(684.90)}</td>
                          </tr>
                        )}
                        {/* Total row */}
                        <tr className="border-t border-slate-300 font-bold bg-slate-50">
                          <td className="px-1 py-0.5 border-r border-slate-200" colSpan={printTotalQty ? 3 : 2}>Total</td>
                          {printTotalQty && <td className="px-1 py-0.5 text-center border-r border-slate-200">2 NOS</td>}
                          <td className="px-1 py-0.5 text-right border-r border-slate-200"></td>
                          <td className="px-1 py-0.5 text-right">{currencySymbol} {formatPreviewAmount(4490)}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* ── TOTAL IN WORDS ── */}
                    <div className="px-2 py-1 border-b border-slate-200">
                      <div className="text-[5.5px] text-slate-500">Total in words</div>
                      <div className="text-[6px] font-extrabold text-slate-800 uppercase">
                        {amountInWordsFormat === 'Indian'
                          ? 'FOUR THOUSAND FOUR HUNDRED AND NINETY RUPEES ONLY'
                          : 'FOUR THOUSAND FOUR HUNDRED AND NINETY DOLLARS ONLY'}
                      </div>
                      <div className="text-[5px] text-slate-400 text-right">(E &amp; O.E.)</div>
                    </div>

                    {/* ── HSN/TAX SUMMARY TABLE ── */}
                    {printTaxDetails && (
                      <table className="w-full text-[5.5px] border-collapse border-b border-slate-200">
                        <thead>
                          <tr className="bg-slate-100 font-bold text-slate-700 border-b border-slate-300">
                            <th className="px-1 py-0.5 border-r border-slate-200 text-center">HSN / SAC</th>
                            <th className="px-1 py-0.5 border-r border-slate-200 text-right">Taxable Value</th>
                            <th className="px-1 py-0.5 border-r border-slate-200 text-center" colSpan={2}>IGST</th>
                            <th className="px-1 py-0.5 text-right">Total</th>
                          </tr>
                          <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <th className="px-1 py-0.5 border-r border-slate-200"></th>
                            <th className="px-1 py-0.5 border-r border-slate-200"></th>
                            <th className="px-1 py-0.5 border-r border-slate-200 text-center">%</th>
                            <th className="px-1 py-0.5 border-r border-slate-200 text-right">Amount</th>
                            <th className="px-1 py-0.5"></th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-100">
                            <td className="px-1 py-0.5 font-mono border-r border-slate-100 text-center">8302</td>
                            <td className="px-1 py-0.5 text-right border-r border-slate-100">{formatPreviewAmount(3805)}</td>
                            <td className="px-1 py-0.5 text-center border-r border-slate-100">18.00</td>
                            <td className="px-1 py-0.5 text-right border-r border-slate-100">{formatPreviewAmount(684.90)}</td>
                            <td className="px-1 py-0.5 text-right">{formatPreviewAmount(684.90)}</td>
                          </tr>
                          <tr className="font-bold bg-slate-50 border-t border-slate-200">
                            <td className="px-1 py-0.5 border-r border-slate-100 text-center">Total</td>
                            <td className="px-1 py-0.5 text-right border-r border-slate-100">{formatPreviewAmount(3805)}</td>
                            <td className="px-1 py-0.5 border-r border-slate-100"></td>
                            <td className="px-1 py-0.5 text-right border-r border-slate-100">{formatPreviewAmount(684.90)}</td>
                            <td className="px-1 py-0.5 text-right">{formatPreviewAmount(684.90)}</td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                    {printTaxDetails && (
                      <div className="px-2 py-0.5 border-b border-slate-200 bg-slate-50">
                        <span className="text-[5.5px] font-bold text-slate-700">Total Tax in words: </span>
                        <span className="text-[5.5px] font-extrabold uppercase text-slate-800">
                          {amountInWordsFormat === 'Indian'
                            ? 'SIX HUNDRED AND EIGHTY-FOUR RUPEES AND NINETY PAISA ONLY'
                            : 'SIX HUNDRED AND EIGHTY-FOUR DOLLARS AND NINETY CENTS ONLY'}
                        </span>
                      </div>
                    )}

                    {/* ── BANK DETAILS + SIGNATURE ── */}
                    <div className="grid grid-cols-2 border-b border-slate-200">
                      {/* Left: Bank Details */}
                      <div className="border-r border-slate-200">
                        <div className="px-2 py-0.5 bg-slate-100 border-b border-slate-200 text-center font-bold text-[6px] text-slate-700">Bank Details</div>
                        <table className="w-full text-[5.5px] px-1">
                          <tbody>
                            {(printBankDetails ? [
                              ['Name', bankName || 'ICICI'],
                              ['Branch', bankBranchName || 'Surate'],
                              ['Acc. Number', bankAccountNumber || '2715500356'],
                              ['IFSC', bankIfscCode || 'ICIC045F'],
                            ] : [
                              ['Name', 'ICICI'],
                              ['Branch', 'Surate'],
                              ['Acc. Number', '2715500356'],
                              ['IFSC', 'ICIC045F'],
                            ]).map(([label, val]) => (
                              <tr key={label} className="border-b border-slate-50">
                                <td className="px-1.5 py-0.5 font-bold text-slate-600 w-14">{label}</td>
                                <td className="px-1 py-0.5 font-mono text-slate-700">{val}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* Right: Certified + Company name */}
                      <div className="p-2 flex flex-col justify-between text-[5.5px] text-left">
                        <div className="text-slate-500 leading-tight">Certified that the particulars given above are true and correct.</div>
                        <div className="mt-2 font-bold text-slate-700 text-[6px]">For {customCompanyName || storeDefaults.shopName}</div>
                        <div className="mt-3 text-slate-400 text-[5px] italic">This is a computer generated<br />invoice no signature required.</div>
                      </div>
                    </div>

                    {/* ── TERMS & CONDITIONS ── */}
                    <div className="border-b border-slate-200">
                      <div className="px-2 py-0.5 bg-slate-100 border-b border-slate-200 text-center font-bold text-[6px] text-slate-700">Terms and Conditions</div>
                      <div className="px-2 py-1 text-[5.5px] text-slate-600 space-y-0.5">
                        <div>Subject to Maharashtra Junction.</div>
                        <div>Our Responsibility Ceases as soon as goods leaves our Premises.</div>
                        <div>Goods once sold will not be taken back.</div>
                        <div>Delivery Ex-Premises.</div>
                      </div>
                      <div className="px-2 py-0.5 border-t border-slate-100 font-bold text-[5.5px] text-slate-600">Customer Signature</div>
                    </div>

                    {/* ── AUTHORISED SIGNATORY + THANK YOU ── */}
                    <div className="grid grid-cols-2 border-b border-slate-100">
                      <div className="p-2"></div>
                      <div className="p-2 border-l border-slate-100 text-center text-[5.5px] text-slate-500 font-bold">Authorised Signatory</div>
                    </div>
                    <div className="px-2 pb-2 text-[5.5px] text-slate-500">Thank you for shopping with us!</div>
                  </div>
                );
              }

              // 6. STANDARD PREVIEW (Fallback)
              return (
                <div
                  className="bg-white rounded-xl shadow-xl mx-auto max-w-[340px] text-[7px] text-slate-700 select-none overflow-hidden transition-all duration-300"
                  style={{ fontFamily: 'Inter, sans-serif', border: `1px solid ${regularThemeColor}30` }}
                >
                  {/* ── HEADER ── */}
                  <div className="p-3 flex justify-between items-start border-b border-slate-100">
                    {/* Left: Logo + Company Info */}
                    <div className="flex items-start space-x-2">
                      {printCompanyLogo && (customLogoUrl || storeDefaults.logoUrl) && (
                        <img
                          src={customLogoUrl || storeDefaults.logoUrl}
                          alt="Logo"
                          className="h-9 w-9 object-contain rounded border border-slate-100 p-0.5 flex-shrink-0"
                        />
                      )}
                      <div className="space-y-0.5 text-left">
                        {printCompanyName && (
                          <div
                            className="font-extrabold leading-tight"
                            style={{
                              fontSize: companyNameTextSize === 'Large' ? '10px' : companyNameTextSize === 'Medium' ? '8.5px' : '7.5px',
                              color: regularThemeColor,
                            }}
                          >
                            {customCompanyName || storeDefaults.shopName}
                          </div>
                        )}
                        {printAddress && (
                          <div className="text-[6px] text-slate-500 leading-tight max-w-[120px]">
                            {customAddress || storeDefaults.address}
                          </div>
                        )}
                        {printPhone && (
                          <div className="text-[6px] text-slate-500">PHONE: {customPhone || storeDefaults.phoneNumber}</div>
                        )}
                        {printGSTIN && (
                          <div className="text-[6px] text-slate-500 font-mono">GSTIN: {customGSTIN || storeDefaults.gstin}</div>
                        )}
                        {printEmail && (
                          <div className="text-[6px] text-slate-500">EMAIL: {customEmail || storeDefaults.email}</div>
                        )}
                      </div>
                    </div>

                    {/* Right: TAX INVOICE + meta */}
                    <div className="text-right space-y-0.5 flex-shrink-0 ml-2">
                      <div className="text-[11px] font-extrabold text-slate-800 tracking-wide">TAX INVOICE</div>
                      <div className="text-[5.5px] font-bold text-slate-400 uppercase tracking-widest">Original for Recipient</div>
                      <div className="pt-1 space-y-0.5 text-[6px] text-slate-600">
                        <div>Invoice No: <span className="font-bold font-mono">S10</span></div>
                        <div>Invoice Date: <span className="font-bold">29 Mar 2026</span></div>
                        <div>Due Date: <span className="font-bold">13 Apr 2026</span></div>
                      </div>
                    </div>
                  </div>

                  {/* ── BILL TO / SHIP TO ── */}
                  <div className="grid grid-cols-2" style={{ backgroundColor: regularThemeColor }}>
                    <div className="px-2 py-1 text-white font-extrabold text-[6.5px] uppercase tracking-wide">Bill To</div>
                    <div className="px-2 py-1 text-white font-extrabold text-[6.5px] uppercase tracking-wide border-l border-white/20">Ship To</div>
                  </div>
                  <div className="grid grid-cols-2 border-b border-slate-100">
                    <div className="p-2 text-left space-y-0.5 text-[6px]">
                      <div className="font-bold text-slate-800 text-[6.5px]">Shyam Fruits</div>
                      <div className="text-slate-500 leading-tight">105, Janta Fruits Market, City Market, Jaipur</div>
                      <div className="text-slate-500">Pin: 302001</div>
                      <div className="text-slate-500">PAN Number: 12345XA12</div>
                      <div className="text-slate-500 font-mono">GSTIN: XYZ12345XA12</div>
                      <div className="text-slate-500">Place of Supply: Rajasthan</div>
                    </div>
                    <div className="p-2 text-left space-y-0.5 text-[6px] border-l border-slate-100">
                      <div className="font-bold text-slate-800 text-[6.5px]">Shyam Fruits</div>
                      <div className="text-slate-500 leading-tight">101, Janta Fruits Market, City Market, Jaipur, Rajasthan</div>
                      <div className="text-slate-500">Pin: 302002</div>
                    </div>
                  </div>

                  {/* ── ITEMS TABLE ── */}
                  <table className="w-full text-left text-[6px] border-collapse">
                    <thead>
                      <tr className="text-white font-bold" style={{ backgroundColor: regularThemeColor }}>
                        <th className="px-1.5 py-1">Items</th>
                        <th className="px-1 py-1 text-center">HSN</th>
                        {printTotalQty && <th className="px-1 py-1 text-center">Quantity</th>}
                        <th className="px-1 py-1 text-right">Rate</th>
                        <th className="px-1 py-1 text-right">Tax/Unit</th>
                        <th className="px-1 py-1 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'Almond', hsn: '8135010', qty: '1.0 KG', rate: 904.76, tax: 45.24, taxPct: 5, amt: 950 },
                        { name: 'Cashew', hsn: '8135010', qty: '1.0 Pc', rate: 857.14, tax: 42.86, taxPct: 5, amt: 900 },
                        { name: 'Raisin', hsn: '8135010', qty: '1.0 KG', rate: 428.57, tax: 21.43, taxPct: 5, amt: 450 },
                      ].map((item, i) => (
                        <tr key={i} className="border-b border-slate-100">
                          <td className="px-1.5 py-1 text-slate-700 font-medium">{item.name}</td>
                          <td className="px-1 py-1 text-center text-slate-500 font-mono">{item.hsn}</td>
                          {printTotalQty && <td className="px-1 py-1 text-center">{item.qty}</td>}
                          <td className="px-1 py-1 text-right">{formatPreviewAmount(item.rate)}</td>
                          <td className="px-1 py-1 text-right">
                            {formatPreviewAmount(item.tax)}
                            <span className="text-slate-400 text-[5px] ml-0.5">({item.taxPct}%)</span>
                          </td>
                          <td className="px-1 py-1 text-right font-bold">{formatPreviewAmount(item.amt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* ── SUB TOTAL ROW ── */}
                  <div className="flex justify-between items-center px-2 py-1 border-b border-slate-200 bg-slate-50 text-[6.5px]">
                    <span className="font-bold text-slate-700">Sub Total</span>
                    <div className="flex items-center space-x-6">
                      <span className="font-bold text-slate-600">{currencySymbol}{formatPreviewAmount(109.53)}</span>
                      <span className="font-bold text-slate-800">{currencySymbol}{formatPreviewAmount(2300)}</span>
                    </div>
                  </div>

                  {/* ── BOTTOM SECTION ── */}
                  <div className="grid grid-cols-2 gap-0 p-2 border-b border-slate-100">

                    {/* Left: Bank Details */}
                    <div className="text-[6px] text-slate-600 space-y-0.5 pr-2 text-left">
                      {printBankDetails ? (
                        <>
                          <div className="font-bold text-slate-700 text-[6.5px] mb-1">Bank Details</div>
                          {bankAccountHolderName && <div>Account holder: <span className="font-medium">{bankAccountHolderName}</span></div>}
                          {bankAccountNumber && <div>Account No: <span className="font-mono">{bankAccountNumber}</span></div>}
                          {bankName && <div>Bank: <span className="font-medium">{bankName}</span></div>}
                          {bankBranchName && <div>Branch: <span className="font-medium">{bankBranchName}</span></div>}
                          {bankIfscCode && <div>IFSC code: <span className="font-mono">{bankIfscCode}</span></div>}
                        </>
                      ) : (
                        <>
                          <div className="font-bold text-slate-700 text-[6.5px] mb-1">Bank Details</div>
                          <div>Account holder: <span className="font-medium">Balaji Fruits Wholesalers</span></div>
                          <div>Account No: <span className="font-mono">1234567890</span></div>
                          <div>Bank: <span className="font-medium">State Bank Of India</span></div>
                          <div>Branch: <span className="font-medium">Jaipur</span></div>
                          <div>IFSC code: <span className="font-mono">SBIN000123</span></div>
                        </>
                      )}
                    </div>

                    {/* Right: Tax breakdown */}
                    <div className="border-l border-slate-100 pl-2">
                      <table className="w-full text-[6px]">
                        <tbody>
                          <tr className="border-b border-slate-100">
                            <td className="py-0.5 text-slate-500">Taxable Amount</td>
                            <td className="py-0.5 text-right font-mono text-slate-700">{currencySymbol}{formatPreviewAmount(2190.47)}</td>
                          </tr>
                          {printTaxDetails && (
                            <>
                              <tr>
                                <td className="py-0.5 text-slate-500">CGST @ 2.50%</td>
                                <td className="py-0.5 text-right font-mono">{currencySymbol}{formatPreviewAmount(54.77)}</td>
                              </tr>
                              <tr className="border-b border-slate-100">
                                <td className="py-0.5 text-slate-500">SGST @ 2.50%</td>
                                <td className="py-0.5 text-right font-mono">{currencySymbol}{formatPreviewAmount(54.77)}</td>
                              </tr>
                            </>
                          )}
                          <tr className="border-b border-slate-200">
                            <td className="py-0.5 font-bold text-slate-800">Total Amount</td>
                            <td className="py-0.5 text-right font-bold font-mono text-slate-800">{currencySymbol}{formatPreviewAmount(2300)}</td>
                          </tr>
                          {printReceivedAmount && (
                            <tr>
                              <td className="py-0.5 text-slate-500">Received Amount</td>
                              <td className="py-0.5 text-right font-mono">{currencySymbol}{formatPreviewAmount(0)}</td>
                            </tr>
                          )}
                          {printBalanceAmount && (
                            <tr>
                              <td className="py-0.5 text-slate-500">Balance</td>
                              <td className="py-0.5 text-right font-mono">{currencySymbol}{formatPreviewAmount(2300)}</td>
                            </tr>
                          )}
                          {printCurrentBalance && (
                            <>
                              <tr>
                                <td className="py-0.5 text-slate-500">Previous Balance</td>
                                <td className="py-0.5 text-right font-mono">{currencySymbol}{formatPreviewAmount(2239)}</td>
                              </tr>
                              <tr>
                                <td className="py-0.5 text-slate-500">Current Balance</td>
                                <td className="py-0.5 text-right font-mono font-bold" style={{ color: regularThemeColor }}>{currencySymbol}{formatPreviewAmount(4539)}</td>
                              </tr>
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ── FOOTER ── */}
                  <div className="p-2 space-y-1.5">
                    <div className="text-[6px] text-slate-500 text-right">
                      <span className="font-bold text-slate-600">Total Amount in Words: </span>
                      {amountInWordsFormat === 'Indian'
                        ? 'INR Two Thousand Three Hundred Only'
                        : 'USD Two Thousand Three Hundred Only'}
                    </div>
                    <div className="flex justify-between items-end pt-1">
                      {printYouSaved && (
                        <div className="px-1.5 py-0.5 bg-emerald-50 text-[5.5px] text-emerald-700 rounded border border-emerald-100 font-semibold">
                          🎉 You Saved {currencySymbol}{formatPreviewAmount(75.50)}!
                        </div>
                      )}
                      <div className="ml-auto text-right text-[6px] text-slate-500 space-y-0.5">
                        <div className="border-t border-slate-300 pt-1 w-16 ml-auto text-center">
                          <span className="text-slate-400">Authorised Signature For</span>
                        </div>
                        <div className="font-bold text-slate-700">{customCompanyName || storeDefaults.shopName}</div>
                      </div>
                    </div>
                    <div className="text-center text-[6px] text-slate-400 font-medium pt-0.5 border-t border-dotted border-slate-100">
                      Thank You For Your Business !
                    </div>
                  </div>
                </div>
              );
            })()
            : (
              /* Thermal preview sheet */
              <div className="border border-dashed border-slate-300 bg-white rounded-xl shadow-xl p-4 mx-auto max-w-[260px] text-[8px] text-slate-600 space-y-3 relative select-none">
                
                {/* Thermal Header */}
                <div className="text-center space-y-1">
                  {thermalPrintCompanyName && (
                    <div className={`font-mono text-slate-900 ${thermalUseTextStylingBold ? 'font-extrabold text-[9.5px]' : ''}`}>
                      {thermalCompanyName || storeDefaults.shopName}
                    </div>
                  )}
                  <div className="text-[6.5px] text-slate-450">
                    {storeDefaults.address}
                  </div>
                </div>

                {/* POS Title */}
                <div className="border-t border-b border-dashed border-slate-400 py-1 text-center font-mono">
                  <div className={thermalUseTextStylingBold ? 'font-extrabold' : ''}>
                    POS RECEIPT
                  </div>
                </div>

                {/* Thermal Bill Details */}
                <div className="text-[7.5px] text-slate-700 leading-snug">
                  <div>No: #INV-2026-004</div>
                  <div>Date: {new Date().toLocaleDateString()}</div>
                  <div>Customer: Acme Corp</div>
                </div>

                {/* POS Table */}
                <table className="w-full text-left border-collapse text-[7.5px]">
                  <thead>
                    <tr className="border-b border-dashed border-slate-400">
                      <th className="pb-1 text-slate-800">Item</th>
                      {printTotalQty && <th className="pb-1 text-center">Qty</th>}
                      <th className="pb-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-dotted border-slate-200">
                      <td className="py-1">LED Panel 12W</td>
                      {printTotalQty && <td className="py-1 text-center">10</td>}
                      <td className="py-1 text-right">{formatPreviewAmount(1800)}</td>
                    </tr>
                    <tr className="border-b border-dotted border-slate-200">
                      <td className="py-1">Copper Cable</td>
                      {printTotalQty && <td className="py-1 text-center">2</td>}
                      <td className="py-1 text-right">{formatPreviewAmount(700)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* POS Totals */}
                <div className="border-t border-dashed border-slate-400 pt-2 flex justify-end">
                  <table className="w-36 text-[7.5px]">
                    <tbody>
                      <tr>
                        <td>Subtotal:</td>
                        <td className="text-right font-bold">{formatPreviewAmount(2236.44)}</td>
                      </tr>
                      {printTaxDetails && (
                        <tr>
                          <td>CGST+SGST:</td>
                          <td className="text-right">{formatPreviewAmount(263.56)}</td>
                        </tr>
                      )}
                      <tr className="font-extrabold text-[8px] border-t border-dashed border-slate-400 pt-1">
                        <td>TOTAL:</td>
                        <td className="text-right">{formatPreviewAmount(2500)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="text-center pt-2 text-[7px] text-slate-600 border-t border-dashed border-slate-400">
                  {amountInWordsFormat === 'Indian' 
                    ? 'Two Thousand Five Hundred Rupees Only' 
                    : 'Two Thousand Five Hundred Dollars Only'}
                </div>

                {/* Simulated Extra Spacing Feed */}
                {thermalExtraLines > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-center space-x-1.5 text-[6.5px] text-blue-500 font-bold bg-blue-500/5 rounded border border-blue-500/10 py-1">
                    <Sparkles className="h-3 w-3 animate-spin" />
                    <span>Simulating {thermalExtraLines} Line Feeds</span>
                  </div>
                )}

                {/* Copies badge */}
                {thermalCopies > 1 && (
                  <div className="absolute bottom-2 left-2 bg-slate-900 text-white border border-slate-800 text-[6.5px] px-1.5 py-0.5 rounded font-extrabold tracking-wide uppercase">
                    Printing {thermalCopies} Copies
                  </div>
                )}
                
              </div>
            )}

            {/* Informational Banner */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start space-x-2.5">
              <Info className="h-4.5 w-4.5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-800 block">Real-time Printing Engine</span>
                <p className="text-[9px] text-slate-500 leading-normal">
                  This live preview matches the layout logic generated by the backend PDF server. Press **Save** below to register these layout preferences.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
