// client/src/components/InvoiceComplianceForm.jsx

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { generateInvoiceCompliance } from '../services/invoice';
import { Truck, AlertTriangle, CheckCircle, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';

const complianceSchema = z.object({
  transporterId: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val), {
      message: 'Invalid GSTIN/TRANSIN format (15 characters)',
    }),
  transporterName: z.string().optional(),
  transportMode: z.enum(['Road', 'Rail', 'Air', 'Ship'], {
    errorMap: () => ({ message: 'Please select a valid mode of transport' }),
  }),
  vehicleNo: z
    .string()
    .optional()
    .refine((val) => !val || /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/.test(val.replace(/\s+/g, '').toUpperCase()), {
      message: 'Invalid Vehicle Number format (e.g. DL01CA1234)',
    }),
  vehicleType: z.enum(['Regular', 'OverDimensional']),
  distance: z.coerce
    .number()
    .min(1, 'Distance must be at least 1 km')
    .max(4000, 'Distance must be less than 4000 km'),
});

export default function InvoiceComplianceForm({ invoice, onComplianceGenerated }) {
  const [apiError, setApiError] = useState('');
  const [errorDetails, setErrorDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(complianceSchema),
    defaultValues: {
      transporterId: invoice?.transporterId || '',
      transporterName: invoice?.transporterName || '',
      transportMode: invoice?.transportMode || 'Road',
      vehicleNo: invoice?.vehicleNo || '',
      vehicleType: invoice?.vehicleType || 'Regular',
      distance: invoice?.distance || 10,
    },
  });

  const watchTransportMode = watch('transportMode');

  const onSubmit = async (data) => {
    setIsLoading(true);
    setApiError('');
    setErrorDetails([]);
    try {
      // Clean vehicle number casing and spacing
      if (data.vehicleNo) {
        data.vehicleNo = data.vehicleNo.replace(/\s+/g, '').toUpperCase();
      }
      
      const response = await generateInvoiceCompliance(invoice._id, data);
      if (response.success) {
        onComplianceGenerated(response.invoice);
      }
    } catch (err) {
      const responseData = err.response?.data;
      setApiError(responseData?.error || 'Failed to generate GST compliance documents.');
      if (responseData?.details) {
        setErrorDetails(responseData.details);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const hasCompliance = invoice?.eInvoiceStatus === 'Generated';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
        <Truck className="h-6 w-6 text-brand-400" />
        <div>
          <h2 className="text-xl font-bold text-slate-200">GST E-Invoice & E-way Bill</h2>
          <p className="text-xs text-slate-400 mt-0.5">Generate IRN registry listings and transit bills instantly</p>
        </div>
      </div>

      {hasCompliance ? (
        // COMPLIANCE GENERATED STATE
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <CheckCircle className="h-6 w-6 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">Compliance Documents Active</h4>
              <p className="text-xs text-emerald-500/80">Invoice is fully compliant and logged in the NIC registry.</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* IRN */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Invoice Reference Number (IRN)</span>
              <p className="font-mono text-xs text-slate-300 break-all select-all">{invoice.irn}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* E-way Bill */}
              {invoice.eWayBillNo && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">E-way Bill Number</span>
                  <p className="font-mono text-sm text-brand-400 font-semibold select-all">{invoice.eWayBillNo}</p>
                </div>
              )}

              {/* Generated Date */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Logged Date</span>
                <p className="text-sm text-slate-300">
                  {new Date(invoice.eInvoiceGeneratedAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* QR Code representation */}
            {invoice.qrCodeData && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Signed QR Code Payload</span>
                  <p className="text-xs text-slate-400 truncate max-w-xs">{invoice.qrCodeData}</p>
                </div>
                <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center p-1 font-bold text-black text-[8px] text-center">
                  MOCK QR
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // FORM INPUT STATE
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Main GSP Error Alert */}
          {apiError && (
            <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm space-y-2">
              <div className="flex items-center space-x-2 font-semibold">
                <ShieldAlert className="h-5 w-5" />
                <span>{apiError}</span>
              </div>
              {errorDetails.length > 0 && (
                <ul className="list-disc list-inside text-xs text-red-400/80 pl-2 space-y-1">
                  {errorDetails.map((detail, index) => (
                    <li key={index}>{detail}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="bg-slate-950/60 p-4 border border-slate-800 rounded-xl mb-4 flex items-start space-x-3 text-xs text-amber-500/90 bg-amber-500/5">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p className="leading-relaxed">
              Verify that the buyer GSTIN, HSN codes, and PIN codes are correctly specified on the invoice details before submission.
            </p>
          </div>

          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Transit Details (Optional for E-way bill)</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Transporter GSTIN / TRANSIN</label>
              <input
                type="text"
                placeholder="27AAAAA1111A1Z1"
                {...register('transporterId')}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border text-slate-200 placeholder-slate-500 text-sm transition-all outline-none focus:ring-2 focus:ring-brand-500 ${
                  errors.transporterId ? 'border-red-500 focus:ring-red-500' : 'border-slate-800'
                }`}
              />
              {errors.transporterId && (
                <p className="mt-1 text-xs text-red-500">{errors.transporterId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Transporter Name</label>
              <input
                type="text"
                placeholder="Express Logistics Ltd"
                {...register('transporterName')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-sm transition-all outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Mode of Transport</label>
              <select
                {...register('transportMode')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm transition-all outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Road">Road</option>
                <option value="Rail">Rail</option>
                <option value="Air">Air</option>
                <option value="Ship">Ship</option>
              </select>
            </div>

            {watchTransportMode === 'Road' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Vehicle Number</label>
                <input
                  type="text"
                  placeholder="DL01CA1234"
                  {...register('vehicleNo')}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border text-slate-200 placeholder-slate-500 text-sm transition-all outline-none focus:ring-2 focus:ring-brand-500 ${
                    errors.vehicleNo ? 'border-red-500 focus:ring-red-500' : 'border-slate-800'
                  }`}
                />
                {errors.vehicleNo && (
                  <p className="mt-1 text-xs text-red-500">{errors.vehicleNo.message}</p>
                )}
              </div>
            )}

            {watchTransportMode === 'Road' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Vehicle Type</label>
                <select
                  {...register('vehicleType')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm transition-all outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Regular">Regular</option>
                  <option value="OverDimensional">OverDimensional (ODC)</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Transit Distance (in km)</label>
              <input
                type="number"
                {...register('distance')}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border text-slate-200 text-sm transition-all outline-none focus:ring-2 focus:ring-brand-500 ${
                  errors.distance ? 'border-red-500 focus:ring-red-500' : 'border-slate-800'
                }`}
              />
              {errors.distance && (
                <p className="mt-1 text-xs text-red-500">{errors.distance.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin mr-2 h-5 w-5" />
                Querying NIC GST Suvidha Portal...
              </>
            ) : (
              <>
                <span>Generate E-Invoice & E-way Bill</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
