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
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-indigo-50/5 rounded-full blur-2xl pointer-events-none"></div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Tally Integration & Sync</h1>
        <p className="text-xs text-slate-500 mt-1">Seamless import and export of master ledgers, inventory, and sales vouchers</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Import Panel */}
        <div className="card-module space-y-6">
          <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
            <Upload className="h-5 w-5 text-indigo-650" />
            <h3 className="text-base font-bold text-slate-800">Import from Tally</h3>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Upload Tally's standard XML ledger exports to auto-sync Ledgers, Stock Items, and Sales Vouchers directly.
          </p>

          <div className="relative border-2 border-dashed border-slate-200 hover:border-slate-350 rounded-xl p-8 text-center bg-slate-50/50 transition-colors">
            <input
              type="file"
              accept=".xml"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            <FileText className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <span className="text-xs font-bold text-slate-700 block mb-1">
              {uploading ? 'Processing File...' : 'Choose or drop Tally XML File'}
            </span>
            <span className="text-[10px] text-slate-450 font-medium">Only standard .xml file exports supported</span>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>Uploading Tally payload</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  style={{ width: `${progress}%` }}
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                />
              </div>
            </div>
          )}

          {summary && (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
              <div className="bg-slate-50 p-2.5 font-bold text-slate-500 border-b border-slate-200 uppercase tracking-wide text-[10px]">
                Import Summary Results
              </div>
              <table className="w-full text-left">
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  <tr>
                    <td className="px-3 py-2">Master Ledgers Sync</td>
                    <td className="px-3 py-2 text-right text-emerald-650 font-bold font-mono">+{summary.parties}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">Stock Items (Products)</td>
                    <td className="px-3 py-2 text-right text-emerald-650 font-bold font-mono">+{summary.products}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">Voucher (Sales) Invoices</td>
                    <td className="px-3 py-2 text-right text-emerald-650 font-bold font-mono">+{summary.invoices}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">Validation Warnings</td>
                    <td className="px-3 py-2 text-right text-amber-600 font-bold font-mono">{summary.errors}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Export Panel */}
        <div className="card-module space-y-6">
          <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
            <Download className="h-5 w-5 text-indigo-655" />
            <h3 className="text-base font-bold text-slate-800">Export to Tally XML</h3>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Export IntellectBill AI billing records into a Tally-compatible XML format to import sales ledgers back to your accountant.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium"
              />
            </div>
          </div>

          <button
            onClick={handleTriggerExport}
            className="w-full flex items-center justify-center py-3 px-4 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="h-4.5 w-4.5 mr-2" />
            <span>Export Sales Vouchers XML</span>
          </button>
        </div>
      </div>

      {/* Sync Audits Table */}
      <div className="card-module space-y-4">
        <div className="flex items-center space-x-2 text-slate-800 font-bold pb-2 border-b border-slate-100">
          <Table className="h-5 w-5 text-indigo-650" />
          <span>Migration Audit Sync Logs</span>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-450 font-bold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Operation Type</th>
                <th className="px-4 py-3">Records Synced</th>
                <th className="px-4 py-3">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
              <tr>
                <td className="px-4 py-3.5 font-mono text-slate-450">Today, 20:04</td>
                <td className="px-4 py-3.5 font-bold text-slate-800">XML Sales Vouchers Export</td>
                <td className="px-4 py-3.5 text-emerald-650 font-bold font-mono">24 Invoices</td>
                <td className="px-4 py-3.5">
                  <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                    SUCCESS
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3.5 font-mono text-slate-450">Yesterday, 14:22</td>
                <td className="px-4 py-3.5 font-bold text-slate-800">Tally XML Masters Import</td>
                <td className="px-4 py-3.5 text-emerald-650 font-bold font-mono">148 Products, 42 Customers</td>
                <td className="px-4 py-3.5">
                  <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                    SUCCESS
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
