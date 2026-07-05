// client/src/pages/TallySync.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { importTallyXML, getTallyExportUrl } from '../services/tally';
import { ArrowLeft, RefreshCw, Upload, Download, FileText, CheckCircle, ShieldAlert, Loader2, Table } from 'lucide-react';

export default function TallySync() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [summary, setSummary] = useState(null);

  // Export settings
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Handle Drag & Drop / File Select import
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setApiError('');
    setSuccessMsg('');
    setSummary(null);
    setUploading(true);
    setProgress(15);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const xmlText = event.target.result;
      
      // Simulate visual parse progress bar
      let currentProgress = 15;
      const interval = setInterval(() => {
        currentProgress += 20;
        setProgress(Math.min(currentProgress, 90));
      }, 300);

      try {
        const response = await importTallyXML(xmlText);
        clearInterval(interval);
        setProgress(100);

        if (response.success) {
          setSummary(response.summary);
          setSuccessMsg(`Tally XML successfully processed and synced to MongoDB.`);
        }
      } catch (err) {
        clearInterval(interval);
        setApiError(err.response?.data?.error || 'Failed to parse Tally XML file structure.');
      } finally {
        setTimeout(() => {
          setUploading(false);
          setProgress(0);
        }, 800);
      }
    };

    reader.readAsText(file);
  };

  const handleTriggerExport = () => {
    setApiError('');
    setSuccessMsg('');
    try {
      const downloadUrl = getTallyExportUrl(startDate, endDate);
      
      // Open download in a new tab/iframe helper
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', 'tally_export.xml');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccessMsg('Tally-compatible XML generated and download triggered.');
    } catch (err) {
      setApiError('Failed to trigger voucher database export.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
        
        {/* Navigation */}
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-slate-200 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Title Header */}
        <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-slate-800">
          <div className="p-3 bg-brand-500/10 text-brand-400 rounded-2xl border border-brand-500/20">
            <RefreshCw className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Tally Integration & Sync</h1>
            <p className="text-xs text-slate-400 mt-1">Seamless import and export of master ledgers, inventory, and sales vouchers</p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Import Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-850">
              <Upload className="h-5 w-5 text-brand-400" />
              <h3 className="text-lg font-bold text-slate-200">Import from Tally</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Upload Tally's standard XML ledger exports to auto-sync Ledgers, Stock Items, and Sales Vouchers directly.
            </p>

            <div className="relative border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-8 text-center bg-slate-950 transition-colors">
              <input
                type="file"
                accept=".xml"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />
              <FileText className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <span className="text-sm font-semibold text-slate-350 block mb-1">
                {uploading ? 'Processing File...' : 'Choose or drop Tally XML File'}
              </span>
              <span className="text-[10px] text-slate-500">Only standard .xml file exports supported</span>
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-450">
                  <span>Uploading Tally payload</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    style={{ width: `${progress}%` }}
                    className="bg-brand-500 h-full rounded-full transition-all duration-300"
                  />
                </div>
              </div>
            )}

            {summary && (
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 text-xs">
                <div className="bg-slate-900/50 p-2.5 font-bold text-slate-450 border-b border-slate-800">
                  Import Summary Results
                </div>
                <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-800 text-slate-400">
                    <tr>
                      <td className="px-3 py-2">Master Ledgers Sync</td>
                      <td className="px-3 py-2 text-right text-emerald-400 font-bold">+{summary.parties}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2">Stock Items (Products)</td>
                      <td className="px-3 py-2 text-right text-emerald-400 font-bold">+{summary.products}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2">Voucher (Sales) Invoices</td>
                      <td className="px-3 py-2 text-right text-emerald-400 font-bold">+{summary.invoices}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2">Validation Warnings</td>
                      <td className="px-3 py-2 text-right text-amber-500 font-bold">{summary.errors}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Export Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-850">
              <Download className="h-5 w-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-slate-200">Export to Tally XML</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Export IntellectBill AI billing records into a Tally-compatible XML format to import sales ledgers back to your accountant.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-500 text-slate-300"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-500 text-slate-300"
                />
              </div>
            </div>

            <button
              onClick={handleTriggerExport}
              className="w-full flex items-center justify-center py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold transition-all shadow-lg active:scale-[0.98]"
            >
              <Download className="h-5 w-5 mr-2" />
              <span>Export Sales Vouchers XML</span>
            </button>
          </div>
        </div>

        {/* Sync Audits Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center space-x-2 text-slate-200 font-bold pb-2 border-b border-slate-850">
            <Table className="h-5 w-5 text-brand-400" />
            <span>Migration Audit Sync Logs</span>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-900/50 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Operation Type</th>
                  <th className="px-4 py-3">Records Synced</th>
                  <th className="px-4 py-3">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-400">
                <tr>
                  <td className="px-4 py-3.5 font-mono">Today, 20:04</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-300">XML Sales Vouchers Export</td>
                  <td className="px-4 py-3.5 text-emerald-450 font-bold">24 Invoices</td>
                  <td className="px-4 py-3.5">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                      SUCCESS
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3.5 font-mono">Yesterday, 14:22</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-300">Tally XML Masters Import</td>
                  <td className="px-4 py-3.5 text-emerald-450 font-bold">148 Products, 42 Customers</td>
                  <td className="px-4 py-3.5">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                      SUCCESS
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
