// client/src/pages/Settings.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStoreSettings, updateStoreSettings, updateStoreProfile } from '../services/settings';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import {
  Search, CheckCircle, Loader2, X, HelpCircle, Edit2,
  User, Building2, Phone, Mail, Lock, Eye, EyeOff,
  AlertTriangle, Shield, KeyRound, ChevronLeft, ChevronRight,
  Settings as SettingsIcon, Printer, UserCircle, Sliders,
} from 'lucide-react';
import PrintSettings from '../components/PrintSettings';
import EditProfile from '../components/EditProfile';
import MultiFirmManager from '../components/MultiFirmManager';

const SIDEBAR_ITEMS = ['GENERAL', 'PRINT', 'PROFILE'];

const inputCls = (err) =>
  `w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:ring-2 focus:bg-white ${
    err
      ? 'border-red-300 focus:ring-red-200'
      : 'border-slate-200 focus:border-indigo-300 focus:ring-indigo-200'
  }`;

function HelpTooltip({ text }) {
  const [visible, setVisible] = useState(false);
  return (
    <span 
      className="relative flex items-center justify-center" 
      onClick={(e) => { e.preventDefault(); setVisible(!visible); }}
      onMouseLeave={() => setVisible(false)}
    >
      <HelpCircle className="h-3.5 w-3.5 text-gray-400 cursor-help flex-shrink-0 hover:text-gray-600 transition-colors" />
      {visible && text && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-48 rounded bg-gray-800 px-2 py-1.5 text-[11px] text-white shadow-lg whitespace-normal text-center leading-tight pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-gray-800">
          {text}
        </span>
      )}
    </span>
  );
}

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
      {info && <HelpTooltip text={typeof info === 'string' ? info : "More details"} />}
    </label>
  );
}

export default function SettingsPage() {
  const { user, updateUser, changePassword } = useAuth();
  const { setCurrency: setGlobalCurrency } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [apiError, setApiError] = useState('');
  const { tab } = useParams();
  const activeSection = (tab || 'general').toUpperCase();

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

  // ── General settings state ──────────────────────────────────
  const [enablePasscode, setEnablePasscode] = useState(false);
  const [passcodePin, setPasscodePin] = useState('');
  const [businessCurrency, setBusinessCurrency] = useState('₹');
  const [decimalPlaces, setDecimalPlaces] = useState(2);
  const [gstinNumber, setGstinNumber] = useState(true);
  const [stopSaleOnNegativeStock, setStopSaleOnNegativeStock] = useState(false);
  const [blockNewItemsFromTxn, setBlockNewItemsFromTxn] = useState(false);
  const [blockNewPartiesFromTxn, setBlockNewPartiesFromTxn] = useState(false);
  const [autoSendEmail, setAutoSendEmail] = useState(false);

  // Multi Firm
  const [multiFirm, setMultiFirm] = useState(false);

  // Zoom
  const [zoomLevel, setZoomLevel] = useState(100);

  // Print settings (preserved from old implementation)
  const [regularLayoutTheme, setRegularLayoutTheme] = useState('GST Theme 1');
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
          setRegularLayoutTheme(s.regularLayoutTheme || 'GST Theme 1');
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
          setAutoSendEmail(s.autoSendEmail ?? false);
          setBusinessCurrency(s.businessCurrency || '₹');
          setEnablePasscode(s.enablePasscode ?? false);
          setPasscodePin(s.passcodePin || '');
          setDecimalPlaces(s.decimalPlaces ?? 2);
          setGstinNumber(s.gstinNumber ?? true);
          setStopSaleOnNegativeStock(s.stopSaleOnNegativeStock ?? false);
          setBlockNewItemsFromTxn(s.blockNewItemsFromTxn ?? false);
          setBlockNewPartiesFromTxn(s.blockNewPartiesFromTxn ?? false);
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
      let printSettingsPayload = {};
      try {
        const lsReg = localStorage.getItem('print_settings_regular');
        if (lsReg) {
          const p = JSON.parse(lsReg);
          if (p.selectedLayout) printSettingsPayload.regularLayoutTheme = p.selectedLayout;
          if (p.themeColor) printSettingsPayload.regularThemeColor = p.themeColor;
          if (p.printRepeatHeader !== undefined) printSettingsPayload.printRepeatHeader = p.printRepeatHeader;
          if (p.printCompanyName !== undefined) printSettingsPayload.printCompanyName = p.printCompanyName;
          if (p.companyName !== undefined) printSettingsPayload.customCompanyName = p.companyName;
          if (p.printLogo !== undefined) printSettingsPayload.printCompanyLogo = p.printLogo;
          if (p.logoUrl !== undefined) printSettingsPayload.customLogoUrl = p.logoUrl;
          if (p.printAddress !== undefined) printSettingsPayload.printAddress = p.printAddress;
          if (p.address !== undefined) printSettingsPayload.customAddress = p.address;
          if (p.printEmail !== undefined) printSettingsPayload.printEmail = p.printEmail;
          if (p.email !== undefined) printSettingsPayload.customEmail = p.email;
          if (p.printPhone !== undefined) printSettingsPayload.printPhone = p.printPhone;
          if (p.phone !== undefined) printSettingsPayload.customPhone = p.phone;
          if (p.printGSTIN !== undefined) printSettingsPayload.printGSTIN = p.printGSTIN;
          if (p.gstin !== undefined) printSettingsPayload.customGSTIN = p.gstin;
          if (p.paperSize !== undefined) printSettingsPayload.paperSize = p.paperSize;
          if (p.orientation !== undefined) printSettingsPayload.orientation = p.orientation;
          if (p.companyNameTextSize !== undefined) printSettingsPayload.companyNameTextSize = p.companyNameTextSize;
          if (p.invoiceTextSize !== undefined) printSettingsPayload.invoiceTextSize = p.invoiceTextSize;
          if (p.totalItemQuantity !== undefined) printSettingsPayload.printTotalQty = p.totalItemQuantity;
          if (p.amountWithDecimal !== undefined) printSettingsPayload.amountWithDecimal = p.amountWithDecimal;
          if (p.receivedAmount !== undefined) printSettingsPayload.printReceivedAmount = p.receivedAmount;
          if (p.balanceAmount !== undefined) printSettingsPayload.printBalanceAmount = p.balanceAmount;
          if (p.currentBalanceParty !== undefined) printSettingsPayload.printCurrentBalance = p.currentBalanceParty;
          if (p.taxDetails !== undefined) printSettingsPayload.printTaxDetails = p.taxDetails;
          if (p.youSaved !== undefined) printSettingsPayload.printYouSaved = p.youSaved;
          if (p.printAmountWithGrouping !== undefined) printSettingsPayload.printAmountWithGrouping = p.printAmountWithGrouping;
          if (p.amountInWords !== undefined) printSettingsPayload.amountInWordsFormat = p.amountInWords;
          if (p.printDescription !== undefined) printSettingsPayload.printDescription = p.printDescription;
          if (p.invoiceNotes !== undefined) printSettingsPayload.invoiceNotes = p.invoiceNotes;
          if (p.printBankDetails !== undefined) printSettingsPayload.printBankDetails = p.printBankDetails;
          if (p.bankAccountHolderName !== undefined) printSettingsPayload.bankAccountHolderName = p.bankAccountHolderName;
          if (p.bankName !== undefined) printSettingsPayload.bankName = p.bankName;
          if (p.bankAccountNumber !== undefined) printSettingsPayload.bankAccountNumber = p.bankAccountNumber;
          if (p.bankIfscCode !== undefined) printSettingsPayload.bankIfscCode = p.bankIfscCode;
          if (p.bankQrCodeUrl !== undefined) printSettingsPayload.bankQrCodeUrl = p.bankQrCodeUrl;
        }
      } catch (e) {
        console.error("Error parsing print_settings_regular", e);
      }

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
        autoSendEmail, businessCurrency,
        enablePasscode, passcodePin, decimalPlaces, gstinNumber, stopSaleOnNegativeStock, blockNewItemsFromTxn, blockNewPartiesFromTxn,
        ...printSettingsPayload
      };
      const [pRes, sRes] = await Promise.all([
        updateStoreProfile(businessType),
        updateStoreSettings(payload),
      ]);
      if (pRes.success && sRes.success) {
        setSuccessMsg('Settings saved successfully.');
        setGlobalCurrency(businessCurrency); // propagate globally
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
                  <SettingRow checked={enablePasscode} onChange={setEnablePasscode} label="Enable Passcode" info="Require a passcode to open the application." />
                  {enablePasscode && (
                    <div style={{ padding: '4px 0 8px 32px' }}>
                      <input 
                        type="password" 
                        maxLength={4}
                        placeholder="Enter 4-digit PIN"
                        value={passcodePin}
                        onChange={e => setPasscodePin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        style={{ border: '1px solid #D1D5DB', borderRadius: 6, padding: '6px 12px', fontSize: 13, width: '140px' }}
                      />
                    </div>
                  )}

                  {/* Business Currency */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid #F3F4F6', marginTop: 4 }}>
                    <span style={{ fontSize: 13, color: '#374151' }}>Business Currency</span>
                    <HelpTooltip text="Select the primary currency for your business." />
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, color: '#111827', fontWeight: 600 }}>{businessCurrency}</span>
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
                    <SettingRow checked={gstinNumber} onChange={setGstinNumber} label="GSTIN Number" info="Enable GSTIN number for transactions." />
                    <SettingRow checked={stopSaleOnNegativeStock} onChange={setStopSaleOnNegativeStock} label="Stop Sale on Negative Stock" info="Prevent sales if the stock goes below zero." />
                    <SettingRow checked={blockNewItemsFromTxn} onChange={setBlockNewItemsFromTxn} label="Block New Items from Txn Form" info="Do not allow creating new items directly from the transaction form." />
                    <SettingRow checked={blockNewPartiesFromTxn} onChange={setBlockNewPartiesFromTxn} label="Block New Parties from Txn Form" info="Do not allow creating new parties directly from the transaction form." />
                    <SettingRow checked={autoSendEmail} onChange={setAutoSendEmail} label="Auto-send Email" info="Automatically send invoices via Email when created." />
                  </div>
                </div>

              </div>

              {/* â”€â”€ Column 2: Multi Firm (Disabled) â”€â”€ */}
              <div>
                {/* Feature removed: Each user is now an independent tenant/business */}
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

