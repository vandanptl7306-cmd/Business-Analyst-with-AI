// client/src/pages/Settings.jsx
import React, { useEffect, useState } from 'react';
import { getStoreSettings, updateStoreSettings, updateStoreProfile } from '../services/settings';
import { Search, CheckCircle, Loader2, X, HelpCircle, Edit2 } from 'lucide-react';

const SIDEBAR_ITEMS = [
  'GENERAL', 'TRANSACTION', 'PRINT', 'TAXES & GST',
  'TRANSACTION MESSAGE', 'PARTY', 'ITEM',
  'SERVICE REMINDERS', 'ACCOUNTING', 'MULTI CURRENCY',
];

// Reusable checkbox row matching the reference image
function SettingRow({ checked, onChange, label, info }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group py-1.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-400 cursor-pointer flex-shrink-0"
      />
      <span className="text-[13px] text-gray-700 select-none">{label}</span>
      {info && <HelpCircle className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />}
    </label>
  );
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [apiError, setApiError] = useState('');
  const [activeSection, setActiveSection] = useState('GENERAL');

  // ── General settings state ──────────────────────────────────────────────
  const [enablePasscode, setEnablePasscode] = useState(false);
  const [businessCurrency, setBusinessCurrency] = useState('₹');
  const [decimalPlaces, setDecimalPlaces] = useState(2);
  const [gstinNumber, setGstinNumber] = useState(true);
  const [stopSaleOnNegativeStock, setStopSaleOnNegativeStock] = useState(false);
  const [blockNewItemsFromTxn, setBlockNewItemsFromTxn] = useState(false);
  const [blockNewPartiesFromTxn, setBlockNewPartiesFromTxn] = useState(false);

  // More Transactions
  const [estimateQuotation, setEstimateQuotation] = useState(true);
  const [proformaInvoice, setProformaInvoice] = useState(true);
  const [salePurchaseOrder, setSalePurchaseOrder] = useState(true);
  const [otherIncome, setOtherIncome] = useState(false);
  const [fixedAssets, setFixedAssets] = useState(false);
  const [deliveryChallan, setDeliveryChallan] = useState(true);

  // Multi Firm
  const [multiFirm, setMultiFirm] = useState(false);

  // Backup
  const [autoBackup, setAutoBackup] = useState(false);
  const [auditTrail, setAuditTrail] = useState(true);
  const lastBackup = '11/07/2026 | 09:07 PM';

  // Stock Transfer
  const [godownManagement, setGodownManagement] = useState(false);

  // Zoom
  const [zoomLevel, setZoomLevel] = useState(100);

  // Print settings (preserved from old implementation)
  const [regularLayoutTheme, setRegularLayoutTheme] = useState('Standard');
  const [regularThemeColor, setRegularThemeColor] = useState('#2563eb');
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
  const [printTaxDetails, setPrintTaxDetails] = useState(true);
  const [printTotalQty, setPrintTotalQty] = useState(true);
  const [amountWithDecimal, setAmountWithDecimal] = useState(true);
  const [printReceivedAmount, setPrintReceivedAmount] = useState(true);
  const [printBalanceAmount, setPrintBalanceAmount] = useState(false);
  const [amountInWordsFormat, setAmountInWordsFormat] = useState('Indian');
  const [businessType, setBusinessType] = useState('Retail');
  const [companyTagline, setCompanyTagline] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [poReference, setPoReference] = useState('');
  const [printBankDetails, setPrintBankDetails] = useState(false);
  const [bankAccountHolderName, setBankAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfscCode, setBankIfscCode] = useState('');
  const [bankBranchName, setBankBranchName] = useState('');
  const [printYouSaved, setPrintYouSaved] = useState(false);
  const [printAmountWithGrouping, setPrintAmountWithGrouping] = useState(true);
  const [printCurrentBalance, setPrintCurrentBalance] = useState(false);
  const [printDescription, setPrintDescription] = useState(true);
  const [printRepeatHeader, setPrintRepeatHeader] = useState(false);
  const [companyNameTextSize, setCompanyNameTextSize] = useState('Large');
  const [invoiceTextSize, setInvoiceTextSize] = useState('Large');
  const [thermalPrintingType, setThermalPrintingType] = useState('Text Printing');
  const [thermalUseTextStylingBold, setThermalUseTextStylingBold] = useState(true);
  const [thermalAutoCut, setThermalAutoCut] = useState(true);
  const [thermalOpenCashDrawer, setThermalOpenCashDrawer] = useState(true);
  const [thermalExtraLines, setThermalExtraLines] = useState(0);
  const [thermalCopies, setThermalCopies] = useState(1);
  const [thermalPrintCompanyName, setThermalPrintCompanyName] = useState(true);
  const [thermalCompanyName, setThermalCompanyName] = useState('');


  useEffect(() => {
    const load = async () => {
      try {
        const res = await getStoreSettings();
        if (res.success && res.settings) {
          const s = res.settings;
          setBusinessType(s.businessType || 'Retail');
          setRegularLayoutTheme(s.regularLayoutTheme || 'Standard');
          setRegularThemeColor(s.regularThemeColor || '#2563eb');
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
          setCompanyTagline(s.companyTagline || '');
          setPoReference(s.poReference || '');
          setInvoiceNotes(s.invoiceNotes || '');
          setPrintBankDetails(s.printBankDetails ?? false);
          setBankAccountHolderName(s.bankAccountHolderName || '');
          setBankName(s.bankName || '');
          setBankAccountNumber(s.bankAccountNumber || '');
          setBankIfscCode(s.bankIfscCode || '');
          setBankBranchName(s.bankBranchName || '');
          setThermalPrintingType(s.thermalPrintingType || 'Text Printing');
          setThermalUseTextStylingBold(s.thermalUseTextStylingBold ?? true);
          setThermalAutoCut(s.thermalAutoCut ?? true);
          setThermalOpenCashDrawer(s.thermalOpenCashDrawer ?? true);
          setThermalExtraLines(s.thermalExtraLines ?? 0);
          setThermalCopies(s.thermalCopies ?? 1);
          setThermalPrintCompanyName(s.thermalPrintCompanyName ?? true);
          setThermalCompanyName(s.thermalCompanyName || s.shopName || '');
        }
      } catch (e) {
        setApiError('Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setUpdating(true);
    setApiError('');
    setSuccessMsg('');
    try {
      const payload = {
        regularLayoutTheme, regularThemeColor, printRepeatHeader,
        printCompanyName, customCompanyName, printCompanyLogo, customLogoUrl,
        printAddress, customAddress, printEmail, customEmail,
        printPhone, customPhone, printGSTIN, customGSTIN,
        paperSize, orientation, companyNameTextSize, invoiceTextSize,
        printTotalQty, amountWithDecimal, printReceivedAmount, printBalanceAmount,
        printCurrentBalance, printTaxDetails, printYouSaved, printAmountWithGrouping,
        amountInWordsFormat, printDescription, companyTagline, poReference, invoiceNotes,
        printBankDetails, bankAccountHolderName, bankName, bankAccountNumber, bankIfscCode, bankBranchName,
        thermalPrintingType, thermalUseTextStylingBold, thermalAutoCut, thermalOpenCashDrawer,
        thermalExtraLines, thermalCopies, thermalPrintCompanyName, thermalCompanyName,
      };
      const [pRes, sRes] = await Promise.all([
        updateStoreProfile(businessType),
        updateStoreSettings(payload),
      ]);
      if (pRes.success && sRes.success) {
        setSuccessMsg('Settings saved successfully.');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (e) {
      setApiError(e.response?.data?.error || 'Failed to save settings.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex overflow-hidden"
      style={{
        fontFamily: "'Inter', 'Poppins', sans-serif",
        background: '#F7F8FA',
        margin: '-2.5rem',          /* cancel dashboard-workspace padding */
        minHeight: 'calc(100vh)',
      }}
    >

      {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────── */}
      <aside style={{ width: 220, minWidth: 220, background: '#1F2333', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>
        {/* Sidebar header */}
        <div style={{ padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: 0.2 }}>Settings</span>
          <Search style={{ color: 'rgba(255,255,255,0.5)', width: 16, height: 16, cursor: 'pointer' }} />
        </div>
        {/* Nav items */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {SIDEBAR_ITEMS.map(item => {
            const isActive = activeSection === item;
            return (
              <button
                key={item}
                onClick={() => setActiveSection(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '11px 20px',
                  background: isActive ? '#fff' : 'transparent',
                  color: isActive ? '#1F2333' : '#fff',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 12,
                  letterSpacing: 0.4,
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                  borderLeft: isActive ? '3px solid #3B82F6' : '3px solid transparent',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                {item}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 0 }}>

        {/* Top bar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 32px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>
            {activeSection.charAt(0) + activeSection.slice(1).toLowerCase().replace('&', '&')}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {successMsg && (
              <span style={{ fontSize: 12, color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle style={{ width: 14, height: 14 }} /> {successMsg}
              </span>
            )}
            {apiError && (
              <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>{apiError}</span>
            )}
            <button
              onClick={handleSave}
              disabled={updating}
              style={{ background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 20px', fontWeight: 600, fontSize: 13, cursor: updating ? 'not-allowed' : 'pointer', opacity: updating ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {updating && <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />}
              Save
            </button>
          </div>
        </div>

        {/* GENERAL section content */}
        {activeSection === 'GENERAL' && (
          <div style={{ padding: '28px 32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 28 }}>

              {/* ── Column 1: Application ── */}
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 16 }}>Application</div>
                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px 18px' }}>
                  <SettingRow checked={enablePasscode} onChange={setEnablePasscode} label="Enable Passcode" info />

                  {/* Business Currency */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid #F3F4F6', marginTop: 4 }}>
                    <span style={{ fontSize: 13, color: '#374151' }}>Business Currency</span>
                    <HelpCircle style={{ width: 13, height: 13, color: '#9CA3AF' }} />
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, color: '#111827', fontWeight: 600 }}>₹</span>
                      <select value={businessCurrency} onChange={e => setBusinessCurrency(e.target.value)}
                        style={{ border: 'none', background: 'transparent', fontSize: 13, color: '#6B7280', cursor: 'pointer', outline: 'none' }}>
                        <option value="₹">INR (₹)</option>
                        <option value="$">USD ($)</option>
                        <option value="€">EUR (€)</option>
                      </select>
                    </div>
                  </div>

                  {/* Amount decimal */}
                  <div style={{ padding: '8px 0', borderTop: '1px solid #F3F4F6' }}>
                    <div style={{ fontSize: 12, color: '#374151', marginBottom: 6 }}>Amount</div>
                    <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 6 }}>(upto Decimal Places)</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="number" min={0} max={4} value={decimalPlaces}
                        onChange={e => setDecimalPlaces(Number(e.target.value))}
                        style={{ width: 56, padding: '4px 8px', border: '1px solid #D1D5DB', borderRadius: 4, fontSize: 13, textAlign: 'center' }}
                      />
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>e.g. {(0).toFixed(decimalPlaces)}</span>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #F3F4F6', marginTop: 4 }}>
                    <SettingRow checked={gstinNumber} onChange={setGstinNumber} label="GSTIN Number" info />
                    <SettingRow checked={stopSaleOnNegativeStock} onChange={setStopSaleOnNegativeStock} label="Stop Sale on Negative Stock" info />
                    <SettingRow checked={blockNewItemsFromTxn} onChange={setBlockNewItemsFromTxn} label="Block New Items from Txn Form" info />
                    <SettingRow checked={blockNewPartiesFromTxn} onChange={setBlockNewPartiesFromTxn} label="Block New Parties from Txn Form" info />
                  </div>
                </div>

                {/* More Transactions */}
                <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: '24px 0 14px' }}>More Transactions</div>
                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px 18px' }}>
                  <SettingRow checked={estimateQuotation} onChange={setEstimateQuotation} label="Estimate/Quotation" info />
                  <SettingRow checked={proformaInvoice} onChange={setProformaInvoice} label="Proforma Invoice" info />
                  <SettingRow checked={salePurchaseOrder} onChange={setSalePurchaseOrder} label="Sale/Purchase Order" info />
                  <SettingRow checked={otherIncome} onChange={setOtherIncome} label="Other Income" info />
                  <SettingRow checked={fixedAssets} onChange={setFixedAssets} label="Fixed Assets (FA)" info />
                  <SettingRow checked={deliveryChallan} onChange={setDeliveryChallan} label="Delivery Challan" info />
                </div>
              </div>

              {/* ── Column 2: Multi Firm + Stock Transfer ── */}
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 16 }}>Multi Firm</div>
                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px 18px', minHeight: 120 }}>
                  <SettingRow checked={multiFirm} onChange={setMultiFirm} label="Multi Firm" />
                  {multiFirm && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#F9FAFB', borderRadius: 6, border: '1px solid #E5E7EB' }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3B82F6' }} />
                        </div>
                        <span style={{ fontSize: 13, color: '#374151', flex: 1 }}>My Company</span>
                        <span style={{ fontSize: 10, color: '#6B7280', background: '#E5E7EB', borderRadius: 4, padding: '2px 6px' }}>DEFAULT</span>
                        <Edit2 style={{ width: 13, height: 13, color: '#3B82F6', cursor: 'pointer' }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Stock Transfer Between Godowns */}
                <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: '24px 0 14px' }}>Stock Transfer Between Godowns</div>
                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px 18px' }}>
                  <p style={{ fontSize: 12, color: '#3B82F6', lineHeight: 1.6, marginBottom: 12 }}>
                    Manage all your stores/godowns and transfer stock seamlessly between them. Using this feature, you can transfer stock between stores/godowns and manage your inventory more efficiently.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox" checked={godownManagement} onChange={e => setGodownManagement(e.target.checked)}
                      style={{ width: 14, height: 14, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 13, color: '#374151' }}>Godown management &amp; Stock transfer</span>
                    <div style={{ display: 'flex', gap: 4, marginLeft: 4 }}>
                      <span style={{ fontSize: 10, background: '#EF4444', color: '#fff', borderRadius: 3, padding: '1px 5px', fontWeight: 600 }}>🔥</span>
                      <span style={{ fontSize: 10, background: '#F59E0B', color: '#fff', borderRadius: 3, padding: '1px 5px', fontWeight: 600 }}>▶</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Column 3: Backup & History + Customize View ── */}
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 16 }}>Backup &amp; History</div>
                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px 18px' }}>
                  <SettingRow checked={autoBackup} onChange={setAutoBackup} label="Auto Backup" info />
                  <div style={{ fontSize: 12, color: '#374151', padding: '8px 0', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Last Backup</span>
                    <span style={{ fontWeight: 600, color: '#111827' }}>{lastBackup}</span>
                    <HelpCircle style={{ width: 12, height: 12, color: '#9CA3AF' }} />
                  </div>
                  <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 4 }}>
                    <SettingRow checked={auditTrail} onChange={setAuditTrail} label="Audit Trail" info />
                  </div>
                </div>

                {/* Customize Your View */}
                <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: '24px 0 14px' }}>Customize Your View</div>
                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px 18px' }}>
                  <div style={{ fontSize: 13, color: '#374151', fontWeight: 600, marginBottom: 4 }}>Choose Your Screen Zoom/Scale</div>
                  <p style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.5, marginBottom: 14 }}>
                    You can use this setting to resize the screen, making it larger or smaller to fit your preferences.
                  </p>
                  {/* Zoom slider */}
                  <input
                    type="range" min={70} max={150} step={5} value={zoomLevel}
                    onChange={e => setZoomLevel(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#3B82F6', cursor: 'pointer', marginBottom: 8 }}
                  />
                  {/* Tick labels */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9CA3AF', marginBottom: 10 }}>
                    {[70, 80, 90, 100, 110, 115, 120, 130].map(v => (
                      <span key={v} style={{ fontWeight: v === zoomLevel ? 700 : 400, color: v === zoomLevel ? '#3B82F6' : '#9CA3AF' }}>{v}%</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => document.documentElement.style.zoom = `${zoomLevel}%`}
                      style={{ background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 5, padding: '6px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

            </div>{/* end 3-col grid */}
          </div>
        )}

        {/* PRINT section */}
        {activeSection === 'PRINT' && (
          <div style={{ padding: '28px 32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* Layout */}
              <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '18px 20px' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 14 }}>Layout Template</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {['Standard','TaxInvoice','Minimalist','Commercial','Modern','Proforma'].map(l => (
                    <button key={l} onClick={() => setRegularLayoutTheme(l)}
                      style={{ padding: '10px 8px', borderRadius: 6, border: `1px solid ${regularLayoutTheme === l ? '#3B82F6' : '#E5E7EB'}`, background: regularLayoutTheme === l ? '#EFF6FF' : '#fff', color: regularLayoutTheme === l ? '#1D4ED8' : '#374151', fontSize: 12, fontWeight: regularLayoutTheme === l ? 700 : 500, cursor: 'pointer' }}>
                      {l === 'TaxInvoice' ? 'GST Tax Invoice' : l}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 18 }}>
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8, fontWeight: 600 }}>Accent Color</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['#2563eb','#059669','#4f46e5','#e11d48','#d97706','#7c3aed','#0d9488','#475569','#1b3a4b'].map(c => (
                      <button key={c} onClick={() => setRegularThemeColor(c)}
                        style={{ width: 26, height: 26, borderRadius: 6, background: c, border: regularThemeColor === c ? '2.5px solid #111' : '2px solid transparent', cursor: 'pointer' }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Print options */}
              <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '18px 20px' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 14 }}>Print Options</div>
                <SettingRow checked={printCompanyName} onChange={setPrintCompanyName} label="Print Company Name" />
                <SettingRow checked={printCompanyLogo} onChange={setPrintCompanyLogo} label="Print Company Logo" />
                <SettingRow checked={printAddress} onChange={setPrintAddress} label="Print Address" />
                <SettingRow checked={printPhone} onChange={setPrintPhone} label="Print Phone" />
                <SettingRow checked={printEmail} onChange={setPrintEmail} label="Print Email" />
                <SettingRow checked={printGSTIN} onChange={setPrintGSTIN} label="Print GSTIN" />
                <SettingRow checked={printTaxDetails} onChange={setPrintTaxDetails} label="Print Tax Details" />
                <SettingRow checked={printTotalQty} onChange={setPrintTotalQty} label="Print Total Quantity" />
                <SettingRow checked={printBankDetails} onChange={setPrintBankDetails} label="Print Bank Details" />
                <div style={{ marginTop: 12, borderTop: '1px solid #F3F4F6', paddingTop: 12 }}>
                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6 }}>Paper Size</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['A4','A5','Letter'].map(s => (
                      <button key={s} onClick={() => setPaperSize(s)}
                        style={{ padding: '4px 12px', borderRadius: 5, border: `1px solid ${paperSize === s ? '#3B82F6' : '#E5E7EB'}`, background: paperSize === s ? '#EFF6FF' : '#fff', color: paperSize === s ? '#1D4ED8' : '#6B7280', fontSize: 12, fontWeight: paperSize === s ? 700 : 400, cursor: 'pointer' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fallback for other sections */}
        {activeSection !== 'GENERAL' && activeSection !== 'PRINT' && (
          <div style={{ padding: '60px 32px', textAlign: 'center', color: '#9CA3AF' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚙️</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{activeSection}</div>
            <div style={{ fontSize: 13 }}>Settings for this section coming soon.</div>
          </div>
        )}

      </div>{/* end main */}
    </div>
  );
}
