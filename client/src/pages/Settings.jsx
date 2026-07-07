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
  { name: 'Classic Blue', hex: '#2563eb' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Indigo', hex: '#4f46e5' },
  { name: 'Rose', hex: '#e11d48' },
  { name: 'Amber', hex: '#d97706' },
  { name: 'Violet', hex: '#7c3aed' },
  { name: 'Teal', hex: '#0d9488' },
  { name: 'Slate', hex: '#475569' },
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
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-indigo-50/5 rounded-full blur-2xl"></div>
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
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
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

                {/* Company Info toggles & custom overrides */}
                <div className="card-module space-y-5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Header Configuration</h3>
                  
                  <div className="space-y-4">
                    
                    {/* Company Name toggle + input */}
                    <div className="space-y-2">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={printCompanyName}
                          onChange={(e) => setPrintCompanyName(e.target.checked)}
                          className="rounded bg-slate-50 border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                        />
                        <span className="text-xs font-semibold text-slate-700">Company Name</span>
                      </label>
                      {printCompanyName && (
                        <div className="pl-7">
                          <input
                            type="text"
                            placeholder="Override Company Name"
                            value={customCompanyName}
                            onChange={(e) => setCustomCompanyName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650"
                          />
                        </div>
                      )}
                    </div>

                    {/* Company Logo toggle + input */}
                    <div className="space-y-2">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={printCompanyLogo}
                          onChange={(e) => setPrintCompanyLogo(e.target.checked)}
                          className="rounded bg-slate-50 border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                        />
                        <span className="text-xs font-semibold text-slate-700">Company Logo</span>
                      </label>
                      {printCompanyLogo && (
                        <div className="pl-7">
                          <input
                            type="text"
                            placeholder="Logo URL e.g. https://domain.com/logo.png"
                            value={customLogoUrl}
                            onChange={(e) => setCustomLogoUrl(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650"
                          />
                        </div>
                      )}
                    </div>

                    {/* Address toggle + input */}
                    <div className="space-y-2">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={printAddress}
                          onChange={(e) => setPrintAddress(e.target.checked)}
                          className="rounded bg-slate-50 border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                        />
                        <span className="text-xs font-semibold text-slate-700">Address Details</span>
                      </label>
                      {printAddress && (
                        <div className="pl-7">
                          <input
                            type="text"
                            placeholder="Override Address Details"
                            value={customAddress}
                            onChange={(e) => setCustomAddress(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650"
                          />
                        </div>
                      )}
                    </div>

                    {/* Email toggle + input */}
                    <div className="space-y-2">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={printEmail}
                          onChange={(e) => setPrintEmail(e.target.checked)}
                          className="rounded bg-slate-50 border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                        />
                        <span className="text-xs font-semibold text-slate-700">Email Address</span>
                      </label>
                      {printEmail && (
                        <div className="pl-7">
                          <input
                            type="email"
                            placeholder="Override Email Address"
                            value={customEmail}
                            onChange={(e) => setCustomEmail(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650"
                          />
                        </div>
                      )}
                    </div>

                    {/* Phone toggle + input */}
                    <div className="space-y-2">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={printPhone}
                          onChange={(e) => setPrintPhone(e.target.checked)}
                          className="rounded bg-slate-50 border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                        />
                        <span className="text-xs font-semibold text-slate-700">Phone Number</span>
                      </label>
                      {printPhone && (
                        <div className="pl-7">
                          <input
                            type="text"
                            placeholder="Override Phone Number"
                            value={customPhone}
                            onChange={(e) => setCustomPhone(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650"
                          />
                        </div>
                      )}
                    </div>

                    {/* GSTIN on Sale toggle + input */}
                    <div className="space-y-2">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={printGSTIN}
                          onChange={(e) => setPrintGSTIN(e.target.checked)}
                          className="rounded bg-slate-50 border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                        />
                        <span className="text-xs font-semibold text-slate-700">GSTIN on Sale</span>
                      </label>
                      {printGSTIN && (
                        <div className="pl-7">
                          <input
                            type="text"
                            placeholder="Override Seller GSTIN"
                            value={customGSTIN}
                            onChange={(e) => setCustomGSTIN(e.target.value.toUpperCase())}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650"
                          />
                        </div>
                      )}
                    </div>

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
                    className="border-t-[8px] border-b-[8px] border-slate-200 bg-white rounded-xl shadow-xl p-5 mx-auto max-w-[340px] text-[8px] text-slate-600 space-y-3 relative overflow-hidden transition-all duration-300"
                    style={{ 
                      fontFamily: 'Inter, sans-serif',
                      borderTopColor: regularThemeColor,
                      borderBottomColor: regularThemeColor,
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5 text-left">
                        <div className="font-extrabold text-[9.5px] text-slate-900">{customCompanyName || storeDefaults.shopName}</div>
                        <div className="text-[6.5px] text-slate-400">{customAddress || storeDefaults.address}</div>
                      </div>
                      {printCompanyLogo && (customLogoUrl || storeDefaults.logoUrl) && (
                        <img src={customLogoUrl || storeDefaults.logoUrl} className="h-6 w-6 object-contain" alt="Logo" />
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-2 text-[6.5px] text-left">
                      <div>
                        <span className="font-extrabold text-slate-800 block">BILL TO</span>
                        <span>Acme Customer</span>
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-800 block">SHIP TO</span>
                        <span>Acme Customer</span>
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-800 block">DETAILS</span>
                        <span>#INV-2026-001</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-1.5 px-2 bg-slate-50 border-b-2 border-slate-900">
                      <span className="font-bold text-[9px] text-slate-800">Invoice Total</span>
                      <span className="font-bold text-[10px]" style={{ color: regularThemeColor }}>{currencySymbol}{formatPreviewAmount(1121)}</span>
                    </div>

                    <table className="w-full text-left text-[6.5px] border-collapse">
                      <thead>
                        <tr className="border-b-2 border-slate-900 font-bold text-slate-900">
                          <th className="pb-1 text-center">QTY</th>
                          <th className="pb-1">DESCRIPTION</th>
                          <th className="pb-1 text-right">RATE</th>
                          <th className="pb-1 text-right">AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-100">
                          <td className="py-1 text-center">5</td>
                          <td className="py-1">LED Bulb 9W</td>
                          <td className="py-1 text-right">{formatPreviewAmount(150)}</td>
                          <td className="py-1 text-right">{formatPreviewAmount(750)}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="flex justify-end pt-1">
                      <table className="w-24 text-[6.5px]">
                        <tbody>
                          <tr>
                            <td>Subtotal:</td>
                            <td className="text-right font-mono">{formatPreviewAmount(950)}</td>
                          </tr>
                          <tr className="font-bold border-t border-slate-200">
                            <td>Total:</td>
                            <td className="text-right font-mono">{formatPreviewAmount(1121)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="pt-2 text-[6.5px] text-left text-slate-450 border-t border-dotted border-slate-150">
                      <span className="font-bold text-slate-600 block mb-0.5">TERMS & CONDITIONS:</span> 
                      Citibank NY Route: #021000021
                    </div>
                  </div>
                );
              }

              // 2. COMMERCIAL PREVIEW
              if (regularLayoutTheme === 'Commercial') {
                return (
                  <div 
                    className="border border-slate-200 bg-white rounded-xl shadow-xl p-5 mx-auto max-w-[340px] text-[8px] text-slate-650 space-y-3 relative overflow-hidden transition-all duration-300"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                      <div className="text-left">
                        <div className="font-extrabold text-[9px] text-slate-900">{customCompanyName || storeDefaults.shopName}</div>
                        <div className="text-[6.5px] text-slate-400">PO Ref: #PO-99201</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-extrabold tracking-wider block" style={{ color: regularThemeColor }}>COMMERCIAL</span>
                        <span className="text-[7px]">Ref: #INV-26-27-010</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-[7px] bg-slate-50 p-2 rounded-lg border border-slate-100 text-left">
                      <div>
                        <span className="text-slate-400 block font-bold">PREPARED DATE</span>
                        <span className="text-slate-800 font-extrabold">{new Date().toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold">DUE DATE</span>
                        <span className="text-slate-800 font-extrabold">Net 30 Days</span>
                      </div>
                    </div>

                    <table className="w-full text-left text-[6.5px] border-collapse">
                      <thead>
                        <tr className="bg-slate-200 text-slate-800 uppercase font-bold">
                          <th className="p-1">Description</th>
                          <th className="p-1 text-center">Qty</th>
                          <th className="p-1 text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <td className="p-1 font-bold">LED Bulb 9W</td>
                          <td className="p-1 text-center">5</td>
                          <td className="p-1 text-right">{formatPreviewAmount(750)}</td>
                        </tr>
                        <tr className="bg-white border-b border-slate-100">
                          <td className="p-1 font-bold">Flexi-Pipe Conduit</td>
                          <td className="p-1 text-center">2</td>
                          <td className="p-1 text-right">{formatPreviewAmount(200)}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-left">
                      <div className="text-[6px] text-slate-400">
                        <span className="font-bold text-slate-500 block">Notes:</span>
                        Remit payments to business address.
                      </div>
                      <div className="flex justify-end">
                        <table className="w-full text-[7px]">
                          <tbody>
                            <tr className="bg-slate-50 font-bold border border-slate-200">
                              <td className="p-1">Grand Total:</td>
                              <td className="p-1 text-right font-mono" style={{ color: regularThemeColor }}>{formatPreviewAmount(1121)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="border-t border-dotted border-slate-250 pt-3 flex justify-between text-[6px]">
                      <div>Prepared By: ____________</div>
                      <div>Approved By: ____________</div>
                    </div>
                  </div>
                );
              }

              // 3. MODERN PREVIEW
              if (regularLayoutTheme === 'Modern') {
                return (
                  <div 
                    className="bg-white rounded-xl shadow-xl p-5 mx-auto max-w-[340px] text-[8px] text-slate-650 space-y-3 relative overflow-hidden transition-all duration-300"
                    style={{ 
                      fontFamily: 'Inter, sans-serif',
                      borderTop: `5px solid ${regularThemeColor}`
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="text-left">
                        <span className="text-[12px] font-extrabold text-slate-900 block tracking-tight">INVOICE</span>
                        <span className="text-[7px] text-slate-400">#INV-2026-001</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <div className="w-5 h-5 rounded-full border flex items-center justify-center bg-indigo-50" style={{ borderColor: regularThemeColor }}>
                          <div className="w-2.5 h-2.5 rotate-45 border-2" style={{ borderColor: regularThemeColor }}></div>
                        </div>
                        <span className="font-bold text-[9px] text-slate-800 tracking-tight">{customCompanyName || storeDefaults.shopName}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t border-b border-slate-100 py-2.5 text-[6.5px] text-left">
                      <div>
                        <span className="text-slate-400 font-bold block">FROM</span>
                        <span className="text-slate-700 font-extrabold block">{customCompanyName || storeDefaults.shopName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block">FOR</span>
                        <span className="text-slate-700 font-extrabold block">Acme Customer</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block">DETAILS</span>
                        <span className="text-slate-700 block">Date: {new Date().toLocaleDateString()}</span>
                      </div>
                    </div>

                    <table className="w-full text-left text-[6.5px] border-collapse">
                      <thead>
                        <tr className="text-white font-extrabold" style={{ backgroundColor: regularThemeColor }}>
                          <th className="p-1 rounded-l">Description</th>
                          <th className="p-1 text-center">Qty</th>
                          <th className="p-1 text-right rounded-r">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-100">
                          <td className="p-1.5 text-slate-700">LED Bulb 9W</td>
                          <td className="p-1.5 text-center">5</td>
                          <td className="p-1.5 text-right font-extrabold text-slate-900">{formatPreviewAmount(750)}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="flex justify-end pt-1">
                      <div className="w-24 border-t-2 border-double border-slate-450 pt-1 text-right">
                        <span className="text-[6px] text-slate-400 block uppercase">Total Amount</span>
                        <span className="text-[11px] font-extrabold font-mono" style={{ color: regularThemeColor }}>{currencySymbol}{formatPreviewAmount(1121)}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              // 4. PROFORMA PREVIEW
              if (regularLayoutTheme === 'Proforma') {
                return (
                  <div 
                    className="border border-slate-200/80 bg-white rounded-xl shadow-xl mx-auto max-w-[340px] text-[8px] text-slate-650 select-none relative overflow-hidden transition-all duration-300"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    <div className="p-4 text-center text-white relative" style={{ backgroundColor: regularThemeColor }}>
                      <span className="text-[11px] font-extrabold uppercase tracking-widest block">Proforma Invoice</span>
                      <span className="text-[6.5px] opacity-90 block mt-1">{customCompanyName || storeDefaults.shopName}</span>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-[6.5px] text-left">
                        <div>
                          <div className="px-1.5 py-0.5 text-white font-extrabold uppercase text-[6px] rounded-sm mb-1 text-center" style={{ backgroundColor: regularThemeColor }}>Bill To</div>
                          <div className="text-slate-800 font-extrabold">Acme Customer</div>
                          <div className="text-slate-400">customer@example.com</div>
                        </div>
                        <div>
                          <div className="px-1.5 py-0.5 text-white font-extrabold uppercase text-[6px] rounded-sm mb-1 text-center" style={{ backgroundColor: regularThemeColor }}>Invoice Details</div>
                          <div>Invoice #: <span className="font-mono text-slate-800 font-bold">#INV-2026-001</span></div>
                          <div>Date: <span className="font-mono text-slate-800 font-bold">{new Date().toLocaleDateString()}</span></div>
                        </div>
                      </div>

                      <table className="w-full text-left text-[6px] border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-800 font-bold">
                            <th className="p-1 text-center w-6" style={{ borderRight: '1px solid #cbd5e1' }}>#</th>
                            <th className="p-1">Description</th>
                            <th className="p-1 text-right">Price</th>
                            <th className="p-1 text-center">Qty</th>
                            <th className="p-1 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-100">
                            <td className="p-1 text-center font-bold" style={{ backgroundColor: regularThemeColor + '10', borderRight: '1px solid #cbd5e1', color: regularThemeColor }}>1</td>
                            <td className="p-1 text-slate-700 font-bold">LED Bulb 9W</td>
                            <td className="p-1 text-right font-mono">{formatPreviewAmount(150)}</td>
                            <td className="p-1 text-center">5</td>
                            <td className="p-1 text-right font-mono font-bold text-slate-800">{formatPreviewAmount(750)}</td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="p-1 text-center font-bold" style={{ backgroundColor: regularThemeColor + '10', borderRight: '1px solid #cbd5e1', color: regularThemeColor }}>2</td>
                            <td className="p-1 text-slate-700 font-bold">Flexi-Pipe Conduit</td>
                            <td className="p-1 text-right font-mono">{formatPreviewAmount(100)}</td>
                            <td className="p-1 text-center">2</td>
                            <td className="p-1 text-right font-mono font-bold text-slate-800">{formatPreviewAmount(200)}</td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="grid grid-cols-12 gap-3 pt-2 text-left">
                        <div className="col-span-7 text-[5.5px]">
                          <div className="flex items-center space-x-1 mb-1 text-slate-400">
                            <input type="checkbox" checked readOnly className="scale-75 accent-indigo-600" />
                            <span>Acknowledged & Accurate</span>
                          </div>
                          <div className="text-slate-400">Shipper: <span className="font-bold text-slate-650">Jamie Thomas</span></div>
                        </div>
                        <div className="col-span-5">
                          <table className="w-full text-[6.5px]">
                            <tbody>
                              <tr>
                                <td>Subtotal:</td>
                                <td className="text-right font-mono">{formatPreviewAmount(950)}</td>
                              </tr>
                              <tr className="font-bold border-t text-[7.5px]" style={{ color: regularThemeColor, backgroundColor: regularThemeColor + '10' }}>
                                <td className="p-0.5">Total:</td>
                                <td className="p-0.5 text-right font-mono">{formatPreviewAmount(1121)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // 5. STANDARD / TAX INVOICE PREVIEW (Fallback)
              return (
                <div 
                  className="border border-slate-200/80 bg-white rounded-xl shadow-xl p-5 mx-auto max-w-[340px] text-[9px] text-slate-600 space-y-4 select-none relative overflow-hidden transition-all duration-300"
                  style={{ 
                    fontFamily: 'Inter, sans-serif',
                    borderColor: regularThemeColor + '20',
                    boxShadow: `0 20px 25px -5px ${regularThemeColor}05`
                  }}
                >
                  {/* Header branding band */}
                  <div className="flex justify-between items-start border-b border-slate-150 pb-3">
                    <div className="space-y-1 text-left">
                      {printCompanyName && (
                        <div 
                          className="font-bold text-slate-800 tracking-tight"
                          style={{ 
                            fontSize: companyNameTextSize === 'Large' ? '12px' : companyNameTextSize === 'Medium' ? '10px' : '8px',
                            color: regularThemeColor 
                          }}
                        >
                          {customCompanyName || storeDefaults.shopName}
                        </div>
                      )}
                      {printAddress && <div className="text-[7.5px] text-slate-450">{customAddress || storeDefaults.address}</div>}
                      <div className="flex space-x-2 text-[7px] text-slate-450">
                        {printPhone && <span>Ph: {customPhone || storeDefaults.phoneNumber}</span>}
                        {printEmail && <span>Mail: {customEmail || storeDefaults.email}</span>}
                      </div>
                    </div>
                    {printCompanyLogo && (customLogoUrl || storeDefaults.logoUrl) && (
                      <img 
                        src={customLogoUrl || storeDefaults.logoUrl} 
                        alt="Logo" 
                        className="h-8 w-8 object-contain rounded border border-slate-100 p-0.5"
                      />
                    )}
                  </div>

                  {/* Theme indicators */}
                  <div className="flex justify-between text-[7px] text-slate-450 border-b border-dotted border-slate-150 pb-2 text-left">
                    <div>Invoice: <span className="font-mono font-bold text-slate-700">#INV-2026-001</span></div>
                    <div>Theme: <span className="font-bold uppercase" style={{ color: regularThemeColor }}>{regularLayoutTheme}</span></div>
                  </div>

                  {/* Table */}
                  <table className="w-full text-left text-[7px] border-collapse">
                    <thead>
                      <tr 
                        className="text-white uppercase font-bold"
                        style={{ backgroundColor: regularThemeColor }}
                      >
                        <th className="p-1 rounded-l">Item Description</th>
                        {printTotalQty && <th className="p-1 text-center">Qty</th>}
                        <th className="p-1 text-right rounded-r">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="p-1 text-slate-700">LED Bulb 9W (HSN 9983)</td>
                        {printTotalQty && <td className="p-1 text-center">5</td>}
                        <td className="p-1 text-right font-bold text-slate-800">{formatPreviewAmount(750)}</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="p-1 text-slate-700">Flexi-Pipe Conduit</td>
                        {printTotalQty && <td className="p-1 text-center">2</td>}
                        <td className="p-1 text-right font-bold text-slate-800">{formatPreviewAmount(200)}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div className="flex justify-end pt-1">
                    <table className="w-28 text-[7px]">
                      <tbody>
                        <tr className="text-slate-400">
                          <td>Subtotal:</td>
                          <td className="text-right font-mono text-slate-650">{formatPreviewAmount(950)}</td>
                        </tr>
                        {printTaxDetails && (
                          <tr className="text-slate-450 border-b border-slate-100 pb-1">
                            <td>CGST + SGST (18%):</td>
                            <td className="text-right font-mono">{formatPreviewAmount(171)}</td>
                          </tr>
                        )}
                        <tr className="font-bold text-[8.5px] border-t border-slate-200">
                          <td style={{ color: regularThemeColor }}>Total Due:</td>
                          <td className="text-right font-mono" style={{ color: regularThemeColor }}>
                            {formatPreviewAmount(1121)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Words */}
                  <div className="pt-2 text-[7px] text-left text-slate-400 border-t border-dotted border-slate-150">
                    <span className="font-bold text-slate-500">Amount in Words: </span>
                    {amountInWordsFormat === 'Indian' 
                      ? 'One Thousand One Hundred Twenty One Rupees Only' 
                      : 'One Thousand One Hundred Twenty One Dollars Only'}
                  </div>

                  {/* Savings */}
                  {printYouSaved && (
                    <div className="p-1 bg-emerald-50 text-[6.5px] text-emerald-800 rounded font-semibold text-center border border-emerald-100">
                      🎉 You Saved {formatPreviewAmount(75.50)} on this purchase!
                    </div>
                  )}
                  {/* Decimals & grouping label */}
                  <div className="absolute bottom-1 right-2 text-[5.5px] text-slate-350 select-none">
                    Format: {amountInWordsFormat} ({printAmountWithGrouping ? 'Grouped' : 'Plain'})
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
