// client/src/pages/CustomerLedger.jsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getPartiesList, createParty, sendWhatsAppReminder } from '../services/party';
import { ArrowLeft, Users, UserPlus, Phone, CheckCircle, ShieldAlert, Loader2, Send, DollarSign } from 'lucide-react';

const partySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .refine((val) => /^\+[1-9]\d{1,14}$/.test(val), {
      message: 'Invalid E.164 format (e.g. +919876543210)',
    }),
  outstandingBalance: z.coerce.number().min(0, 'Balance cannot be negative'),
  whatsappEnabled: z.boolean().default(true),
});

export default function CustomerLedger() {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // stores active customer ID being reminded
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(partySchema),
    defaultValues: { name: '', phoneNumber: '+91', outstandingBalance: 0, whatsappEnabled: true },
  });

  const loadParties = async () => {
    try {
      const data = await getPartiesList();
      if (data.success) {
        setParties(data.parties);
      }
    } catch (err) {
      setApiError('Failed to retrieve customer ledger records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParties();
  }, []);

  const onAddCustomer = async (data) => {
    setApiError('');
    setSuccessMsg('');
    try {
      const response = await createParty(data);
      if (response.success) {
        setParties([...parties, response.party]);
        setSuccessMsg(`Customer ${data.name} successfully registered.`);
        reset();
      }
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to create customer.');
    }
  };

  const handleSendReminder = async (id, name) => {
    setActionLoading(id);
    setApiError('');
    setSuccessMsg('');
    try {
      const response = await sendWhatsAppReminder(id);
      if (response.success) {
        setSuccessMsg(`WhatsApp reminder successfully sent to ${name}.`);
      }
    } catch (err) {
      setApiError(err.response?.data?.error || `Failed to send payment reminder to ${name}.`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
        
        {/* Navigation */}
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
            <Users className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Customer ledger & Reminders</h1>
            <p className="text-xs text-slate-400 mt-1">Manage client records, balances, and send outstanding payment alerts via WhatsApp</p>
          </div>
        </div>

        {/* Global Notifications */}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Customer Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl h-fit space-y-5">
            <div className="flex items-center space-x-2 text-slate-200 font-bold pb-2 border-b border-slate-855">
              <UserPlus className="h-5 w-5 text-brand-400" />
              <span>Add New Customer</span>
            </div>

            <form onSubmit={handleSubmit(onAddCustomer)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Customer Name</label>
                <input
                  type="text"
                  placeholder="Jane Doe"
                  {...register('name')}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border text-slate-200 placeholder-slate-500 text-sm transition-all outline-none focus:ring-2 focus:ring-brand-500 ${
                    errors.name ? 'border-red-500 focus:ring-red-500' : 'border-slate-800'
                  }`}
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Phone (E.164 format)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="+919876543210"
                    {...register('phoneNumber')}
                    className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border text-slate-200 placeholder-slate-500 text-sm transition-all outline-none focus:ring-2 focus:ring-brand-500 ${
                      errors.phoneNumber ? 'border-red-500 focus:ring-red-500' : 'border-slate-800'
                    }`}
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="mt-1 text-xs text-red-500">{errors.phoneNumber.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Outstanding Balance ($)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('outstandingBalance')}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm transition-all outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2.5 pt-2">
                <input
                  type="checkbox"
                  id="whatsappEnabled"
                  {...register('whatsappEnabled')}
                  className="w-4 h-4 text-brand-600 border-slate-855 rounded bg-slate-955 focus:ring-brand-500 cursor-pointer"
                />
                <label htmlFor="whatsappEnabled" className="text-xs text-slate-350 select-none cursor-pointer">
                  Enable WhatsApp notifications
                </label>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-semibold transition-all shadow-lg active:scale-[0.98]"
              >
                Create Customer
              </button>
            </form>
          </div>

          {/* Customer Records Table */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-slate-200">Customer Records</h2>

            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
              </div>
            ) : parties.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                No customer ledger records stored. Register one on the left to start.
              </div>
            ) : (
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <table className="min-w-full divide-y divide-slate-800 text-sm">
                  <thead className="bg-slate-900/50 text-slate-400 text-xs">
                    <tr>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Contact Info</th>
                      <th className="px-4 py-3 text-right">Outstanding</th>
                      <th className="px-4 py-3 text-center">Alert Options</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {parties.map((pt) => (
                      <tr key={pt._id}>
                        <td className="px-4 py-4 font-semibold text-slate-200">{pt.name}</td>
                        <td className="px-4 py-4 font-mono text-xs text-slate-400">{pt.phoneNumber}</td>
                        <td className="px-4 py-4 text-right font-bold text-red-400">
                          ${pt.outstandingBalance.toFixed(2)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {pt.outstandingBalance > 0 ? (
                            <button
                              onClick={() => handleSendReminder(pt._id, pt.name)}
                              disabled={actionLoading === pt._id}
                              className="inline-flex items-center space-x-1 text-xs text-brand-400 bg-brand-500/10 border border-brand-500/20 px-3 py-1.5 rounded-lg hover:bg-brand-500/20 transition-all font-semibold disabled:opacity-50"
                            >
                              {actionLoading === pt._id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Send className="h-3 w-3" />
                              )}
                              <span>Send Reminder</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-500 italic">No balance</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
