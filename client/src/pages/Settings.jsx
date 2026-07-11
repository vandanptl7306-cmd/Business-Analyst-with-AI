// client/src/pages/Settings.jsx
import React, { useEffect, useState } from 'react';
import { getStoreSettings, updateStoreSettings, updateStoreProfile } from '../services/settings';
import { useAuth } from '../context/AuthContext';
import {
  Search, CheckCircle, Loader2, X, HelpCircle, Edit2,
  User, Building2, Phone, Mail, Lock, Eye, EyeOff,
  AlertTriangle, Shield, KeyRound,
} from 'lucide-react';
import PrintSettings from '../components/PrintSettings';

const SIDEBAR_ITEMS = ['GENERAL', 'PRINT', 'PROFILE'];

const inputCls = (err) =>
  `w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:ring-2 focus:bg-white ${
    err
      ? 'border-red-300 focus:ring-red-200'
      : 'border-slate-200 focus:border-indigo-300 focus:ring-indigo-200'
  }`;

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
  const { user, updateUser, changePassword } = useAuth();

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [apiError, setApiError] = useState('');
  const [activeSection, setActiveSection] = useState('GENERAL');

  // ── Profile section state ────────────────────────────────────────────────
  const [profileName, setProfileName] = useState('');
  const [profileCompany, setProfileCompany] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // ── Password section state ───────────────────────────────────────────────
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  const flash = (setMsg, msg, delay = 4000) => {
    setMsg(msg);
    setTimeout(() => setMsg(''), delay);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileError('');
    if (!profileName.trim()) { setProfileError('Name cannot be empty.'); return; }
    setProfileSaving(true);
    try {
      await updateUser({ name: profileName.trim(), companyName: profileCompany.trim(), phoneNumber: profilePhone.trim() });
      flash(setProfileSuccess, 'Profile updated successfully.');
    } catch (err) {
      setProfileError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPwdError('');
    if (!currentPwd || !newPwd || !confirmPwd) { setPwdError('All password fields are required.'); return; }
    if (newPwd.length < 6) { setPwdError('New password must be at least 6 characters.'); return; }
    if (newPwd !== confirmPwd) { setPwdError('New passwords do not match.'); return; }
    setPwdSaving(true);
    try {
      await changePassword({ currentPassword: currentPwd, newPassword: newPwd });
      flash(setPwdSuccess, 'Password changed successfully.');
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err) {
      setPwdError(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setPwdSaving(false);
    }
  };

  // ── General settings state ──────────────────────────────────────────────
  const [enablePasscode, setEnablePasscode] = useState(false);
  const [businessCurrency, setBusinessCurrency] = useState('₹');
  const [decimalPlaces, setDecimalPlaces] = useState(2);
  const [gstinNumber, setGstinNumber] = useState(true);
  const [stopSaleOnNegativeStock, setStopSaleOnNegativeStock] = useState(false);
  const [blockNewItemsFromTxn, setBlockNewItemsFromTxn] = useState(false);
  const [blockNewPartiesFromTxn, setBlockNewPartiesFromTxn] = useState(false);

  // Multi Firm
  const [multiFirm, setMultiFirm] = useState(false);

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


  // Populate profile fields when user loads
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileCompany(user.companyName || '');
      setProfilePhone(user.phoneNumber || '');
    }
  }, [user]);

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

              </div>

              {/* ── Column 3: Customize View ── */}
              <div>

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
          <div style={{ padding: 0, margin: '-1px' }}>
            <PrintSettings />
          </div>
        )}

        {/* PROFILE section */}
        {activeSection === 'PROFILE' && (
          <div style={{ padding: '28px 32px' }}>

            {/* Profile header card */}
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '24px 28px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 20, flexShrink: 0, boxShadow: '0 4px 14px rgba(79,70,229,0.3)' }}>
                {user?.name?.substring(0, 2)?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#111827' }}>{user?.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: '#6B7280' }}>{user?.email}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE' }}>{user?.role}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

              {/* Profile Details */}
              <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, marginBottom: 16, borderBottom: '1px solid #F3F4F6' }}>
                  <div style={{ background: '#EEF2FF', borderRadius: 8, padding: 7, color: '#4F46E5', display: 'flex' }}>
                    <User style={{ width: 15, height: 15 }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Profile Details</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>Your name, company and contact info</div>
                  </div>
                </div>

                {profileSuccess && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, border: '1px solid #A7F3D0', background: '#ECFDF5', color: '#047857', fontSize: 12, fontWeight: 600, marginBottom: 14 }}>
                    <CheckCircle style={{ width: 14, height: 14, flexShrink: 0 }} />{profileSuccess}
                  </div>
                )}
                {profileError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: 12, fontWeight: 600, marginBottom: 14 }}>
                    <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} />{profileError}
                  </div>
                )}

                <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* Full Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                      Full Name <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#9CA3AF' }} />
                      <input
                        type="text" value={profileName} onChange={e => setProfileName(e.target.value)}
                        placeholder="Jane Doe"
                        className={`${inputCls(!profileName.trim())} pl-9`}
                      />
                    </div>
                  </div>

                  {/* Company Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                      Company / Shop Name
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Building2 style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#9CA3AF' }} />
                      <input
                        type="text" value={profileCompany} onChange={e => setProfileCompany(e.target.value)}
                        placeholder="e.g. IntellectBill Pvt. Ltd."
                        className={`${inputCls(false)} pl-9`}
                      />
                    </div>
                  </div>

                  {/* Mobile */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                      Mobile Number <span style={{ fontSize: 9, fontWeight: 400, color: '#9CA3AF', textTransform: 'none' }}>(for WhatsApp invoices)</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Phone style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#9CA3AF' }} />
                      <input
                        type="tel" value={profilePhone} onChange={e => setProfilePhone(e.target.value)}
                        placeholder="+919876543210"
                        className={`${inputCls(false)} pl-9`}
                        style={{ fontFamily: 'monospace' }}
                      />
                    </div>
                    {!profilePhone.trim() && (
                      <p style={{ fontSize: 10, color: '#D97706', fontWeight: 500, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertTriangle style={{ width: 11, height: 11 }} />Add mobile to enable WhatsApp sharing
                      </p>
                    )}
                  </div>

                  {/* Email (read-only) */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                      Email <span style={{ fontWeight: 400, color: '#9CA3AF', textTransform: 'none', fontSize: 9 }}>(cannot be changed)</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#C4B5FD' }} />
                      <input
                        type="email" value={user?.email || ''} readOnly
                        style={{ width: '100%', paddingLeft: 36, paddingRight: 16, paddingTop: 10, paddingBottom: 10, borderRadius: 12, background: '#F3F4F6', border: '1px solid #E5E7EB', fontSize: 13, color: '#9CA3AF', cursor: 'not-allowed', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit" disabled={profileSaving}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, background: '#4F46E5', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: profileSaving ? 'not-allowed' : 'pointer', opacity: profileSaving ? 0.7 : 1 }}
                  >
                    {profileSaving ? <><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /><span>Saving...</span></> : <span>Save Profile</span>}
                  </button>
                </form>
              </div>

              {/* Change Password */}
              <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, marginBottom: 16, borderBottom: '1px solid #F3F4F6' }}>
                  <div style={{ background: '#EEF2FF', borderRadius: 8, padding: 7, color: '#4F46E5', display: 'flex' }}>
                    <KeyRound style={{ width: 15, height: 15 }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Change Password</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>Update your login password</div>
                  </div>
                </div>

                {pwdSuccess && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, border: '1px solid #A7F3D0', background: '#ECFDF5', color: '#047857', fontSize: 12, fontWeight: 600, marginBottom: 14 }}>
                    <CheckCircle style={{ width: 14, height: 14, flexShrink: 0 }} />{pwdSuccess}
                  </div>
                )}
                {pwdError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: 12, fontWeight: 600, marginBottom: 14 }}>
                    <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} />{pwdError}
                  </div>
                )}

                {user?.googleId && !user?.password ? (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 16, borderRadius: 10, border: '1px solid #FDE68A', background: '#FFFBEB', color: '#92400E', fontSize: 12 }}>
                    <Shield style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
                    <p>This account uses <strong>Google Sign-In</strong> and has no local password. Password change is not available.</p>
                  </div>
                ) : (
                  <form onSubmit={handlePasswordSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                    {/* Current Password */}
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Current Password</label>
                      <div style={{ position: 'relative' }}>
                        <Lock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#9CA3AF' }} />
                        <input
                          type={showCurrent ? 'text' : 'password'} value={currentPwd} onChange={e => setCurrentPwd(e.target.value)}
                          placeholder="••••••••" className={`${inputCls(false)} pl-9 pr-11`}
                        />
                        <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}>
                          {showCurrent ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>New Password</label>
                      <div style={{ position: 'relative' }}>
                        <Lock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#9CA3AF' }} />
                        <input
                          type={showNew ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)}
                          placeholder="Min. 6 characters" className={`${inputCls(newPwd && newPwd.length < 6)} pl-9 pr-11`}
                        />
                        <button type="button" onClick={() => setShowNew(!showNew)}
                          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}>
                          {showNew ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                        </button>
                      </div>
                      {newPwd && newPwd.length < 6 && <p style={{ fontSize: 10, color: '#EF4444', marginTop: 4 }}>Must be at least 6 characters</p>}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Confirm New Password</label>
                      <div style={{ position: 'relative' }}>
                        <Lock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#9CA3AF' }} />
                        <input
                          type={showConfirm ? 'text' : 'password'} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                          placeholder="••••••••" className={`${inputCls(confirmPwd && confirmPwd !== newPwd)} pl-9 pr-11`}
                        />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}>
                          {showConfirm ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                        </button>
                      </div>
                      {confirmPwd && confirmPwd !== newPwd && <p style={{ fontSize: 10, color: '#EF4444', marginTop: 4 }}>Passwords do not match</p>}
                    </div>

                    <button
                      type="submit" disabled={pwdSaving}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, background: '#4F46E5', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: pwdSaving ? 'not-allowed' : 'pointer', opacity: pwdSaving ? 0.7 : 1 }}
                    >
                      {pwdSaving ? <><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /><span>Updating...</span></> : <span>Change Password</span>}
                    </button>
                  </form>
                )}
              </div>

            </div>
          </div>
        )}

      </div>{/* end main */}
    </div>
  );
}
