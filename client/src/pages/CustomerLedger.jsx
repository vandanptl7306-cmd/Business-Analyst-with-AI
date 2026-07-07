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
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-indigo-50/5 rounded-full blur-2xl"></div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Customer Ledger & Reminders</h1>
        <p className="text-xs text-slate-500 mt-1">Manage client records, outstanding balances, and trigger automated alerts via WhatsApp</p>
      </div>

      {/* Global Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl border border-emerald-250 bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle className="h-4.5 w-4.5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {apiError && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs font-semibold flex items-center space-x-2">
          <ShieldAlert className="h-4.5 w-4.5 text-red-600 flex-shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Add Customer Form */}
        <div className="card-module h-fit space-y-5">
          <div className="flex items-center space-x-2 text-slate-800 font-bold pb-2 border-b border-slate-100">
            <UserPlus className="h-5 w-5 text-indigo-650" />
            <span>Add New Customer</span>
          </div>

          <form onSubmit={handleSubmit(onAddCustomer)} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">Customer Name</label>
              <input
                type="text"
                placeholder="Jane Doe"
                {...register('name')}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border text-slate-800 placeholder-slate-400 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650 ${
                  errors.name ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">Phone (E.164 format)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  placeholder="+919876543210"
                  {...register('phoneNumber')}
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border text-slate-800 placeholder-slate-400 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650 ${
                    errors.phoneNumber ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
              </div>
              {errors.phoneNumber && (
                <p className="mt-1 text-xs text-red-500">{errors.phoneNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">Outstanding Balance ($)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <DollarSign className="h-4 w-4" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('outstandingBalance')}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2.5 pt-2">
              <input
                type="checkbox"
                id="whatsappEnabled"
                {...register('whatsappEnabled')}
                className="w-4 h-4 text-indigo-650 border-slate-300 rounded bg-slate-50 focus:ring-indigo-500/20 cursor-pointer"
              />
              <label htmlFor="whatsappEnabled" className="text-xs text-slate-500 select-none cursor-pointer">
                Enable WhatsApp notifications
              </label>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white font-bold transition-all shadow-sm cursor-pointer"
            >
              Create Customer
            </button>
          </form>
        </div>

        {/* Customer Records Table */}
        <div className="lg:col-span-2 card-module space-y-4">
          <h2 className="text-xl font-bold text-slate-800">Customer Records</h2>

          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-8 w-8 text-indigo-655 animate-spin" />
            </div>
          ) : parties.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs font-semibold">
              No customer ledger records stored. Register one on the left to start.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <table className="min-w-full divide-y divide-slate-100 text-xs">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Contact Info</th>
                    <th className="px-4 py-3 text-right">Outstanding</th>
                    <th className="px-4 py-3 text-center">Alert Options</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {parties.map((pt) => (
                    <tr key={pt._id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-800">{pt.name}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-450">{pt.phoneNumber}</td>
                      <td className="px-4 py-3.5 text-right font-bold text-red-650 font-mono">
                        ${pt.outstandingBalance.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {pt.outstandingBalance > 0 ? (
                          <button
                            onClick={() => handleSendReminder(pt._id, pt.name)}
                            disabled={actionLoading === pt._id}
                            className="inline-flex items-center space-x-1 text-[11px] text-indigo-600 hover:text-indigo-550 font-bold bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                          >
                            {actionLoading === pt._id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Send className="h-3 w-3" />
                            )}
                            <span>Send Reminder</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic font-semibold">Paid</span>
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
  );
}
