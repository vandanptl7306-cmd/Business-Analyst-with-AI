// client/src/pages/BusinessOnboarding.jsx

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getStoreSettings, updateStoreProfile } from '../services/settings';
import { ArrowLeft, ShoppingBag, Truck, Factory, CheckCircle, ShieldAlert, Loader2, Sparkles } from 'lucide-react';

const profiles = [
  {
    id: 'Retail',
    title: 'Retail & Kirana Stores',
    desc: 'Optimized for rapid checkout counter workflows, barcodes scanning, and fast receipt prints.',
    icon: ShoppingBag,
    color: 'from-blue-600 to-cyan-500',
    accent: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
  },
  {
    id: 'Wholesale',
    title: 'Wholesalers & Distributors',
    desc: 'Optimized for bulk pricing lists, minimum order limits, batch logs, and customer credit limits.',
    icon: Truck,
    color: 'from-purple-600 to-pink-500',
    accent: 'text-purple-400 border-purple-500/20 bg-purple-500/5',
  },
  {
    id: 'Manufacturing',
    title: 'Manufacturers & Producers',
    desc: 'Optimized for raw material consumption logs, finished product assembly, and BOM cost tracks.',
    icon: Factory,
    color: 'from-orange-600 to-amber-500',
    accent: 'text-orange-400 border-orange-500/20 bg-orange-500/5',
  },
];

export default function BusinessOnboarding() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState('Retail');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await getStoreSettings();
        if (response.success && response.settings) {
          setSelectedType(response.settings.businessType || 'Retail');
        }
      } catch (err) {
        setApiError('Failed to fetch current business settings.');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setApiError('');
    setSuccessMsg('');
    try {
      const response = await updateStoreProfile(selectedType);
      if (response.success) {
        setSuccessMsg(`Business profile successfully changed to ${selectedType}. Adapting invoicing templates...`);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to update store business profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
        
        {/* Navigation */}
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-slate-200 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Header Block */}
        <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-slate-800">
          <div className="p-3 bg-brand-500/10 text-brand-400 rounded-2xl border border-brand-500/20">
            <Sparkles className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Business Profile Configurator</h1>
            <p className="text-xs text-slate-400 mt-1">Select your operating profile to adapt billing interfaces, inventory metrics, and POS workflows dynamically</p>
          </div>
        </div>

        {/* Status Notifications */}
        {successMsg && (
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-450 text-sm flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 flex-shrink-0 animate-bounce" />
            <span>{successMsg}</span>
          </div>
        )}

        {apiError && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 flex-shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-8">
          {/* Profiles Cards Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {profiles.map((prof) => {
              const Icon = prof.icon;
              const isSelected = selectedType === prof.id;
              return (
                <div
                  key={prof.id}
                  onClick={() => setSelectedType(prof.id)}
                  className={`border rounded-2xl p-6 bg-slate-900 cursor-pointer hover:border-slate-700 transition-all shadow-xl space-y-4 flex flex-col justify-between relative overflow-hidden ${
                    isSelected ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-slate-800'
                  }`}
                >
                  <div className="space-y-4">
                    <div className={`p-3 w-fit rounded-xl border ${prof.accent}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-slate-200 text-base">{prof.title}</h4>
                      <p className="text-xs text-slate-450 leading-relaxed">{prof.desc}</p>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Select Theme</span>
                    <input
                      type="radio"
                      checked={isSelected}
                      onChange={() => setSelectedType(prof.id)}
                      className="w-4 h-4 text-brand-600 focus:ring-brand-500 bg-slate-950 border-slate-800"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center py-3 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  Adapting Workflow Settings...
                </>
              ) : (
                'Confirm operating profile'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
