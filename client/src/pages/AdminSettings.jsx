// client/src/pages/AdminSettings.jsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStoreSettings, updateStoreSettings } from '../services/settings';
import TemplateSelector from '../components/TemplateSelector';
import { ArrowLeft, ShieldCheck, DollarSign, Store, Activity, Sliders, CheckCircle, ShieldAlert, Loader2, UploadCloud } from 'lucide-react';

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [apiError, setApiError] = useState('');

  // Form states
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [defaultTemplate, setDefaultTemplate] = useState('Standard');
  const [themeColor, setThemeColor] = useState('#2563eb');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await getStoreSettings();
        if (response.success) {
          setSettings(response.settings);
          setShopName(response.settings.shopName);
          setAddress(response.settings.address);
          setPhoneNumber(response.settings.phoneNumber || '');
          setEmail(response.settings.email || '');
          setGstin(response.settings.gstin || '');
          setLogoUrl(response.settings.logoUrl || '');
          setDefaultTemplate(response.settings.defaultInvoiceTemplate || 'Standard');
          setThemeColor(response.settings.invoiceThemeColor || '#2563eb');
        }
      } catch (err) {
        setApiError('Failed to load store settings configuration.');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setApiError('');
    setSuccessMsg('');
    try {
      const response = await updateStoreSettings({
        shopName,
        address,
        phoneNumber,
        email,
        gstin,
        logoUrl,
        defaultInvoiceTemplate: defaultTemplate,
        invoiceThemeColor: themeColor,
      });
      if (response.success) {
        setSettings(response.settings);
        setSuccessMsg('Store settings profile successfully updated.');
      }
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to update store settings profile.');
    } finally {
      setUpdating(false);
    }
  };

  const handleMockLogoUpload = () => {
    // Generate a premium abstract logo url from Unsplash as placeholder simulation
    const mockLogos = [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=150',
      'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=150'
    ];
    const randomIndex = Math.floor(Math.random() * mockLogos.length);
    setLogoUrl(mockLogos[randomIndex]);
    setSuccessMsg('Branding logo mock uploaded successfully.');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-brand-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
        {/* Back Link */}
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-slate-200 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Header */}
        <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-slate-800">
          <div className="p-3 bg-brand-500/10 text-brand-400 rounded-2xl border border-brand-500/20">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Store Settings & Branding</h1>
            <p className="text-sm text-slate-400 mt-1">Configure shop name, billing addresses, GST details, logo uploads, and layout formats.</p>
          </div>
        </div>

        {/* Status Messages */}
        {successMsg && (
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-450 text-sm flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {apiError && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 flex-shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-8">
          {/* Company Details */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-850">
              <Store className="h-5 w-5 text-brand-400" />
              <h3 className="text-lg font-bold text-slate-200">Company Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Shop / Business Name</label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Business GSTIN</label>
                <input
                  type="text"
                  required
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Shop Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Contact Phone</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Contact Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Logo URL</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs outline-none focus:ring-2 focus:ring-brand-500 text-slate-300"
                  />
                  <button
                    type="button"
                    onClick={handleMockLogoUpload}
                    className="px-3 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl border border-slate-750 flex items-center justify-center transition-all"
                    title="Mock Upload Logo"
                  >
                    <UploadCloud className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {logoUrl && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl w-fit">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Logo Preview</span>
                <img src={logoUrl} alt="Store logo" className="max-h-16 rounded border border-slate-800" />
              </div>
            )}
          </div>

          {/* Invoice Theme Color Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-slate-350 font-semibold text-sm">
              <Sliders className="h-4 w-4 text-brand-400" />
              <span>Invoice Primary Brand Color</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {[
                { hex: '#2563eb', label: 'Tech Blue' },
                { hex: '#10b981', label: 'Emerald Green' },
                { hex: '#ef4444', label: 'Crimson Red' },
                { hex: '#6366f1', label: 'Sleek Indigo' },
                { hex: '#f97316', label: 'Amber Orange' },
                { hex: '#8b5cf6', label: 'Royal Purple' },
                { hex: '#475569', label: 'Steel Slate' },
                { hex: '#1e293b', label: 'Dark Slate' },
              ].map((color) => {
                const isSelected = themeColor.toLowerCase() === color.hex.toLowerCase();
                return (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => setThemeColor(color.hex)}
                    style={{ backgroundColor: color.hex }}
                    className={`w-10 h-10 rounded-full border-2 transition-all relative group flex items-center justify-center hover:scale-105 active:scale-95 ${
                      isSelected ? 'border-white ring-4 ring-blue-500/30' : 'border-slate-800'
                    }`}
                    title={color.label}
                  >
                    {isSelected && (
                      <span className="text-white text-xs font-bold font-sans">✓</span>
                    )}
                  </button>
                );
              })}
              
              <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl ml-auto">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Custom:</span>
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 p-0 outline-none"
                />
                <input
                  type="text"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  placeholder="#ffffff"
                  className="w-16 bg-transparent border-0 text-slate-350 text-[10px] font-mono outline-none uppercase"
                />
              </div>
            </div>
          </div>

          {/* Template Selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <TemplateSelector value={defaultTemplate} onChange={setDefaultTemplate} />
          </div>

          {/* Action Trigger */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updating}
              className="flex items-center justify-center py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50"
            >
              {updating ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  Saving Settings Profile...
                </>
              ) : (
                'Save Settings & Preferences'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
