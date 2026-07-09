// client/src/pages/Profile.jsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User, Building2, Phone, Mail, Lock, Eye, EyeOff,
  CheckCircle, AlertTriangle, Loader2, Shield, KeyRound,
} from 'lucide-react';

const inputCls = (err) =>
  `w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:ring-2 focus:bg-white ${
    err
      ? 'border-red-300 focus:ring-red-200'
      : 'border-slate-200 focus:border-indigo-300 focus:ring-indigo-200'
  }`;

export default function Profile() {
  const { user, updateUser, changePassword } = useAuth();

  // ── Profile form state ────────────────────────────────────────────────────
  const [name, setName]               = useState(user?.name || '');
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError]   = useState('');

  // ── Password form state ───────────────────────────────────────────────────
  const [currentPwd, setCurrentPwd]   = useState('');
  const [newPwd, setNewPwd]           = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdSaving, setPwdSaving]     = useState(false);
  const [pwdSuccess, setPwdSuccess]   = useState('');
  const [pwdError, setPwdError]       = useState('');

  // ── Helpers ───────────────────────────────────────────────────────────────
  const flash = (setMsg, msg, delay = 4000) => {
    setMsg(msg);
    setTimeout(() => setMsg(''), delay);
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileError('');
    if (!name.trim()) { setProfileError('Name cannot be empty.'); return; }
    setProfileSaving(true);
    try {
      await updateUser({ name: name.trim(), companyName: companyName.trim(), phoneNumber: phoneNumber.trim() });
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* Page header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-indigo-50/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-indigo-600/20 flex-shrink-0">
            {user?.name?.substring(0, 2)?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">{user?.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-slate-500 font-medium">{user?.email}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* ── Profile Details ─────────────────────────────────────────────── */}
        <div className="card-module space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Profile Details</h2>
              <p className="text-xs text-slate-500 mt-0.5">Your name, company and contact info</p>
            </div>
          </div>

          {profileSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 text-xs font-semibold">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              {profileSuccess}
            </div>
          )}
          {profileError && (
            <div className="flex items-center gap-2 p-3 rounded-xl border border-red-100 bg-red-50 text-red-600 text-xs font-semibold">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {profileError}
            </div>
          )}

          <form onSubmit={handleProfileSave} className="space-y-4">

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className={`${inputCls(!name.trim())} pl-10`}
                />
              </div>
            </div>

            {/* Company / Shop Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Company / Shop Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. IntellectBill Pvt. Ltd."
                  className={`${inputCls(false)} pl-10`}
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Mobile Number
                <span className="ml-1.5 text-[9px] font-normal text-slate-400 normal-case">
                  (required to send invoices via WhatsApp)
                </span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+919876543210"
                  className={`${inputCls(false)} pl-10 font-mono`}
                />
              </div>
              {!phoneNumber.trim() && (
                <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Add your mobile number to enable WhatsApp invoice sharing
                </p>
              )}
            </div>

            {/* Email — read-only */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Email Address <span className="text-slate-400 font-normal normal-case">(cannot be changed)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm text-slate-400 cursor-not-allowed select-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-sm font-bold transition-all shadow-sm disabled:opacity-50 mt-2"
            >
              {profileSaving
                ? <><Loader2 className="h-4 w-4 animate-spin" /><span>Saving...</span></>
                : <span>Save Profile</span>
              }
            </button>
          </form>
        </div>

        {/* ── Change Password ─────────────────────────────────────────────── */}
        <div className="card-module space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Change Password</h2>
              <p className="text-xs text-slate-500 mt-0.5">Update your login password</p>
            </div>
          </div>

          {pwdSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 text-xs font-semibold">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              {pwdSuccess}
            </div>
          )}
          {pwdError && (
            <div className="flex items-center gap-2 p-3 rounded-xl border border-red-100 bg-red-50 text-red-600 text-xs font-semibold">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {pwdError}
            </div>
          )}

          {user?.googleId && !user?.password ? (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-100 bg-amber-50 text-amber-700 text-xs">
              <Shield className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>This account uses <strong>Google Sign-In</strong> and has no local password. Password change is not available.</p>
            </div>
          ) : (
            <form onSubmit={handlePasswordSave} className="space-y-4">

              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputCls(false)} pl-10 pr-11`}
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors">
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="Min. 6 characters"
                    className={`${inputCls(newPwd && newPwd.length < 6)} pl-10 pr-11`}
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {newPwd && newPwd.length < 6 && (
                  <p className="text-[10px] text-red-500 font-medium">Must be at least 6 characters</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputCls(confirmPwd && confirmPwd !== newPwd)} pl-10 pr-11`}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPwd && confirmPwd !== newPwd && (
                  <p className="text-[10px] text-red-500 font-medium">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={pwdSaving}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-sm font-bold transition-all shadow-sm disabled:opacity-50 mt-2"
              >
                {pwdSaving
                  ? <><Loader2 className="h-4 w-4 animate-spin" /><span>Updating...</span></>
                  : <span>Change Password</span>
                }
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
