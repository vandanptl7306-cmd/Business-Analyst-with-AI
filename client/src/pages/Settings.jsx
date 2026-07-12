// client/src/pages/Settings.jsx
import React, { useEffect, useState } from 'react';
import { getStoreSettings, updateStoreSettings, updateStoreProfile } from '../services/settings';
import { useAuth } from '../context/AuthContext';
import {
  Search, CheckCircle, Loader2, X, HelpCircle, Edit2,
  User, Building2, Phone, Mail, Lock, Eye, EyeOff,
  AlertTriangle, Shield, KeyRound, ChevronLeft, ChevronRight,
  Settings as SettingsIcon, Printer, UserCircle, Sliders,
} from 'lucide-react';
import PrintSettings from '../components/PrintSettings';
import EditProfile from '../components/EditProfile';

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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // â”€â”€ Profile section state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [profileName, setProfileName] = useState('');
  const [profileCompany, setProfileCompany] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // â”€â”€ Password section state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ General settings state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [enablePasscode, setEnablePasscode] = useState(false);
  const [businessCurrency, setBusinessCurrency] = useState('â‚¹');
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

  // ── render ──────────────────────────────────────────────────────────────────────────
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

      {/* ── LEFT SIDEBAR (matches DashboardLayout style) ─────────────────── */}
      <aside style={{
        width: sidebarOpen ? 260 : 56,
        minWidth: sidebarOpen ? 260 : 56,
        background: '#0b0f24',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        transition: 'width 0.25s cubic-bezier(.4,0,.2,1), min-width 0.25s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
        flexShrink: 0,
      }}>

        {/* Brand header — identical to DashboardLayout */}
        <div style={{ padding: '0 24px', height: 65, display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0, overflow: 'hidden' }}>
          <div style={{ height: 36, width: 36, background: '#4F46E5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 13, flexShrink: 0, boxShadow: '0 4px 14px rgba(79,70,229,0.35)' }}>
            <SettingsIcon style={{ width: 16, height: 16 }} />
          </div>
          {sidebarOpen && (
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>Settings</span>
          )}
          {/* Collapse toggle — floats to the far right */}
          {sidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              title="Close sidebar"
              style={{
                marginLeft: 'auto',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.55)',
                flexShrink: 0,
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
            >
              <ChevronLeft style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>

        {/* When collapsed: show open button centered in header area */}
        {!sidebarOpen && (
          <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              title="Open sidebar"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.6)',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
            >
              <ChevronRight style={{ width: 14, height: 14 }} />
            </button>
          </div>
        )}

        {/* Nav items — same rounded-xl style as DashboardLayout */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {!sidebarOpen ? null : (
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.8)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px', marginBottom: 6 }}>Settings</div>
          )}
          {[
            { id: 'GENERAL', label: 'General', icon: <Sliders style={{ width: 16, height: 16, flexShrink: 0 }} /> },
            { id: 'PRINT',   label: 'Print',   icon: <Printer  style={{ width: 16, height: 16, flexShrink: 0 }} /> },
            { id: 'PROFILE', label: 'Profile', icon: <UserCircle style={{ width: 16, height: 16, flexShrink: 0 }} /> },
          ].map(({ id, label, icon }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                title={!sidebarOpen ? label : ''}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: sidebarOpen ? '10px 12px' : '10px 0',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  borderRadius: 12,
                  background: isActive ? '#1a1f35' : 'transparent',
                  border: isActive ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
                  color: isActive ? '#fff' : 'rgba(148,163,184,0.85)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(15,23,46,0.6)'; e.currentTarget.style.color = '#e2e8f0'; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(148,163,184,0.85)'; } }}
              >
                <span style={{ color: isActive ? '#818CF8' : 'rgba(100,116,139,0.9)', display: 'flex', flexShrink: 0 }}>{icon}</span>
                {sidebarOpen && <span>{label}</span>}
              </button>
            );
          })}
        </nav>
      </aside>
      {/* â”€â”€ MAIN CONTENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

              {/* â”€â”€ Column 1: Application â”€â”€ */}
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 16 }}>Application</div>
                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px 18px' }}>
                  <SettingRow checked={enablePasscode} onChange={setEnablePasscode} label="Enable Passcode" info />

                  {/* Business Currency */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid #F3F4F6', marginTop: 4 }}>
                    <span style={{ fontSize: 13, color: '#374151' }}>Business Currency</span>
                    <HelpCircle style={{ width: 13, height: 13, color: '#9CA3AF' }} />
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, color: '#111827', fontWeight: 600 }}>â‚¹</span>
                      <select value={businessCurrency} onChange={e => setBusinessCurrency(e.target.value)}
                        style={{ border: 'none', background: 'transparent', fontSize: 13, color: '#6B7280', cursor: 'pointer', outline: 'none' }}>
                        <option value="â‚¹">INR (â‚¹)</option>
                        <option value="$">USD ($)</option>
                        <option value="â‚¬">EUR (â‚¬)</option>
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

              {/* ── Column 2: Multi Firm + Bank Details ── */}
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
          <EditProfile
            onCancel={() => setActiveSection('GENERAL')}
            onSaved={() => {}}
          />
        )}

      </div>{/* end main */}
    </div>
  );
}

