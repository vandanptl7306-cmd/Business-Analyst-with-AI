// client/src/components/EditProfile.jsx
import React, { useRef, useState, useEffect } from 'react';
import {
  Camera, CloudUpload, ChevronDown, HelpCircle,
  Calendar, AlertCircle, CheckCircle, Loader2,
} from 'lucide-react';

/* ── Indian states ─────────────────────────────────────────────────────────── */
const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Delhi','Lakshadweep','Puducherry',
];

const BUSINESS_TYPES = [
  'Retailer','Wholesaler','Manufacturer','Service Provider',
  'Trader','Distributor','Importer / Exporter','Others',
];

const BUSINESS_CATEGORIES = [
  'Agriculture','Automotive','Construction','Education',
  'Electronics','Fashion & Apparel','Food & Beverages','Healthcare',
  'Hospitality','IT & Technology','Jewellery','Logistics',
  'Media & Entertainment','Pharmaceuticals','Real Estate','Textiles','Others',
];

/* ── Reusable atoms ─────────────────────────────────────────────────────────── */
const Label = ({ children, required, info }) => (
  <label style={{ display: 'block', fontSize: 12, color: '#4B5563', fontWeight: 500, marginBottom: 5 }}>
    {children}
    {required && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
    {info && (
      <HelpCircle
        style={{ display: 'inline-block', width: 13, height: 13, color: '#9CA3AF', marginLeft: 5, verticalAlign: 'middle' }}
      />
    )}
  </label>
);

const Input = ({ error, style, ...props }) => (
  <input
    {...props}
    style={{
      width: '100%',
      padding: '9px 12px',
      border: `1px solid ${error ? '#FCA5A5' : '#D1D5DB'}`,
      borderRadius: 8,
      fontSize: 13,
      color: '#111827',
      background: '#fff',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 0.15s, box-shadow 0.15s',
      ...style,
    }}
    onFocus={e => {
      e.target.style.borderColor = '#3B82F6';
      e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)';
    }}
    onBlur={e => {
      e.target.style.borderColor = error ? '#FCA5A5' : '#D1D5DB';
      e.target.style.boxShadow = 'none';
    }}
  />
);

const Select = ({ value, onChange, options, placeholder, error }) => (
  <div style={{ position: 'relative' }}>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '9px 32px 9px 12px',
        border: `1px solid ${error ? '#FCA5A5' : '#D1D5DB'}`,
        borderRadius: 8,
        fontSize: 13,
        color: value ? '#111827' : '#9CA3AF',
        background: '#fff',
        outline: 'none',
        appearance: 'none',
        cursor: 'pointer',
        boxSizing: 'border-box',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onFocus={e => {
        e.target.style.borderColor = '#3B82F6';
        e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)';
      }}
      onBlur={e => {
        e.target.style.borderColor = error ? '#FCA5A5' : '#D1D5DB';
        e.target.style.boxShadow = 'none';
      }}
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <ChevronDown
      style={{
        position: 'absolute', right: 10, top: '50%',
        transform: 'translateY(-50%)', width: 14, height: 14,
        color: '#6B7280', pointerEvents: 'none',
      }}
    />
  </div>
);

const FieldWrap = ({ children }) => (
  <div style={{ marginBottom: 14 }}>{children}</div>
);

const ErrMsg = ({ msg }) => msg
  ? <p style={{ fontSize: 11, color: '#EF4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
      <AlertCircle style={{ width: 11, height: 11 }} />{msg}
    </p>
  : null;

/* ── Main component ──────────────────────────────────────────────────────────── */
export default function EditProfile({ onCancel, onSaved }) {
  const LS_KEY = 'edit_profile_data';
  const loadSaved = () => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
  };

  const saved = loadSaved();

  // Logo
  const [logoUrl, setLogoUrl] = useState(saved.logoUrl || '');
  const logoRef = useRef(null);

  // Business Details
  const [businessName, setBusinessName] = useState(saved.businessName || '');
  const [phone, setPhone]               = useState(saved.phone        || '');
  const [gstin, setGstin]               = useState(saved.gstin        || '');
  const [email, setEmail]               = useState(saved.email        || '');
  const [beginDate, setBeginDate]       = useState(saved.beginDate    || '');

  // More Details
  const [businessType, setBusinessType]         = useState(saved.businessType     || '');
  const [businessCategory, setBusinessCategory] = useState(saved.businessCategory || '');
  const [state, setState]                       = useState(saved.state            || '');
  const [pincode, setPincode]                   = useState(saved.pincode          || '');

  // Right column
  const [address, setAddress]     = useState(saved.address   || '');
  const [signatureUrl, setSignatureUrl] = useState(saved.signatureUrl || '');
  const sigRef = useRef(null);

  // UI state
  const [errors, setErrors]     = useState({});
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState('');

  /* ── helpers ─── */
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setLogoUrl(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSigUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setSignatureUrl(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const validate = () => {
    const errs = {};
    if (!businessName.trim()) errs.businessName = 'Business Name is required.';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email.';
    if (gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin.toUpperCase())) {
      errs.gstin = 'Enter a valid 15-char GSTIN.';
    }
    if (pincode && !/^[1-9][0-9]{5}$/.test(pincode)) errs.pincode = 'Enter a valid 6-digit pincode.';
    return errs;
  };

  const handleSave = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    const data = {
      logoUrl, businessName, phone, gstin, email, beginDate,
      businessType, businessCategory, state, pincode,
      address, signatureUrl,
    };
    setTimeout(() => {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
      setSaving(false);
      setSuccess('Profile saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
      if (onSaved) onSaved(data);
    }, 600);
  };

  /* ── field style ─── */
  const sectionHead = {
    fontSize: 15, fontWeight: 700, color: '#1E3A5F', marginBottom: 16,
  };

  return (
    <div style={{
      background: '#F3F4F6', minHeight: '100vh',
      fontFamily: "'Inter', 'Poppins', sans-serif",
      padding: '0 0 40px',
    }}>
      {/* Page title */}
      <div style={{ background: '#fff', padding: '16px 28px 0', borderBottom: '1px solid #E5E7EB' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0, paddingBottom: 14 }}>
          Edit Profile
        </h1>
      </div>

      {/* White form card */}
      <div style={{
        background: '#fff', margin: '0 auto',
        padding: '28px 32px 24px',
        maxWidth: 1100,
        boxSizing: 'border-box',
      }}>
        <form onSubmit={handleSave} noValidate>

          {/* ── Success banner ── */}
          {success && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 8,
              background: '#ECFDF5', border: '1px solid #6EE7B7',
              color: '#047857', fontSize: 13, fontWeight: 600,
              marginBottom: 20,
            }}>
              <CheckCircle style={{ width: 15, height: 15 }} />
              {success}
            </div>
          )}

          {/* ── Three-column grid ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 36 }}>

            {/* ════ LEFT COLUMN ════ */}
            <div>
              {/* Logo upload */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  {/* Circle */}
                  <div
                    onClick={() => logoRef.current?.click()}
                    style={{
                      width: 96, height: 96, borderRadius: '50%',
                      background: logoUrl ? 'transparent' : '#EFF6FF',
                      border: `3px solid ${logoUrl ? '#3B82F6' : '#BFDBFE'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
                      transition: 'border-color 0.2s',
                    }}
                    title="Upload logo"
                  >
                    {logoUrl
                      ? <img src={logoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 12, color: '#93C5FD', fontWeight: 500, lineHeight: 1.3 }}>
                            Add<br />Logo
                          </div>
                        </div>
                    }
                  </div>
                  {/* Pencil overlay */}
                  <button
                    type="button"
                    onClick={() => logoRef.current?.click()}
                    style={{
                      position: 'absolute', bottom: 2, right: 2,
                      width: 24, height: 24, borderRadius: '50%',
                      background: '#fff', border: '1.5px solid #D1D5DB',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                    }}
                    title="Change logo"
                  >
                    <Camera style={{ width: 12, height: 12, color: '#6B7280' }} />
                  </button>
                  <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
                </div>
              </div>

              {/* Business Details */}
              <div style={sectionHead}>Business Details</div>

              <FieldWrap>
                <Label required>Business Name</Label>
                <Input
                  value={businessName} onChange={e => setBusinessName(e.target.value)}
                  placeholder="My Company" error={!!errors.businessName}
                />
                <ErrMsg msg={errors.businessName} />
              </FieldWrap>

              <FieldWrap>
                <Label>Phone Number</Label>
                <Input
                  type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="Enter Phone Number"
                />
              </FieldWrap>

              <FieldWrap>
                <Label info>GSTIN</Label>
                <Input
                  value={gstin} onChange={e => setGstin(e.target.value.toUpperCase())}
                  placeholder="Enter GSTIN" error={!!errors.gstin}
                  style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
                />
                <ErrMsg msg={errors.gstin} />
              </FieldWrap>

              <FieldWrap>
                <Label>Email ID</Label>
                <Input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Enter Email ID" error={!!errors.email}
                />
                <ErrMsg msg={errors.email} />
              </FieldWrap>

              <FieldWrap>
                <Label>Account Books Beginning Date</Label>
                <div style={{ position: 'relative' }}>
                  <Input
                    type="date" value={beginDate} onChange={e => setBeginDate(e.target.value)}
                    style={{ paddingRight: 36 }}
                  />
                  <Calendar
                    style={{
                      position: 'absolute', right: 10, top: '50%',
                      transform: 'translateY(-50%)', width: 15, height: 15,
                      color: '#3B82F6', pointerEvents: 'none',
                    }}
                  />
                </div>
              </FieldWrap>
            </div>

            {/* ════ MIDDLE COLUMN ════ */}
            <div>
              <div style={sectionHead}>More Details</div>

              <FieldWrap>
                <Label>Business Type</Label>
                <Select
                  value={businessType} onChange={setBusinessType}
                  options={BUSINESS_TYPES} placeholder="Select Business Type"
                />
              </FieldWrap>

              <FieldWrap>
                <Label>Business Category</Label>
                <Select
                  value={businessCategory} onChange={setBusinessCategory}
                  options={BUSINESS_CATEGORIES} placeholder="Select Business Category"
                  error={!!errors.businessCategory}
                />
              </FieldWrap>

              <FieldWrap>
                <Label>State</Label>
                <Select
                  value={state} onChange={setState}
                  options={STATES} placeholder="Select State"
                />
              </FieldWrap>

              <FieldWrap>
                <Label>Pincode</Label>
                <Input
                  type="text" inputMode="numeric" maxLength={6}
                  value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter Pincode" error={!!errors.pincode}
                />
                <ErrMsg msg={errors.pincode} />
              </FieldWrap>
            </div>

            {/* ════ RIGHT COLUMN ════ */}
            <div>
              <div style={sectionHead}>Business Address</div>

              <FieldWrap>
                <textarea
                  value={address} onChange={e => setAddress(e.target.value)}
                  placeholder="Enter Business Address"
                  rows={5}
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: '1px solid #D1D5DB', borderRadius: 8,
                    fontSize: 13, color: '#111827',
                    background: '#fff', resize: 'vertical',
                    outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'inherit', lineHeight: 1.5,
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#3B82F6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#D1D5DB';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </FieldWrap>

              {/* Signature upload */}
              <div style={{ marginTop: 8 }}>
                <div style={{ ...sectionHead, marginBottom: 10 }}>Add Signature</div>
                <div
                  onClick={() => sigRef.current?.click()}
                  style={{
                    border: '1.5px dashed #D1D5DB', borderRadius: 8,
                    padding: '20px 12px', textAlign: 'center',
                    cursor: 'pointer', background: '#FAFAFA',
                    minHeight: 100,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 6, transition: 'border-color 0.15s',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#3B82F6'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#D1D5DB'}
                >
                  {signatureUrl
                    ? <img src={signatureUrl} alt="signature" style={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain' }} />
                    : <>
                        <CloudUpload style={{ width: 28, height: 28, color: '#9CA3AF' }} />
                        <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Upload Signature</span>
                      </>
                  }
                </div>
                <input ref={sigRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleSigUpload} />
                {signatureUrl && (
                  <button
                    type="button"
                    onClick={() => setSignatureUrl('')}
                    style={{
                      marginTop: 6, fontSize: 11, color: '#EF4444',
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    }}
                  >
                    Remove signature
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Divider ── */}
          <div style={{ borderTop: '1px solid #E5E7EB', margin: '28px 0 20px' }} />

          {/* ── Action buttons (bottom-right) ── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '9px 24px', borderRadius: 999,
                border: '1px solid #D1D5DB', background: '#F9FAFB',
                color: '#374151', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
              onMouseLeave={e => e.currentTarget.style.background = '#F9FAFB'}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '9px 24px', borderRadius: 999,
                border: 'none', background: saving ? '#F87171' : '#EF4444',
                color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'background 0.15s',
                opacity: saving ? 0.85 : 1,
              }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#DC2626'; }}
              onMouseLeave={e => { if (!saving) e.currentTarget.style.background = '#EF4444'; }}
            >
              {saving && <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
