// client/src/pages/Unauthorized.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <ShieldAlert className="h-8 w-8 animate-bounce" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-100">Access Denied</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            You do not have the required administrative clearance to access this settings route.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-500 text-left">
          <strong>Required Role:</strong> Admin <br />
          If you believe this is an error, please contact your workspace owner or organization administrator.
        </div>

        <Link
          to="/dashboard"
          className="flex items-center justify-center w-full px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-350 font-semibold border border-slate-750 hover:border-slate-700 transition-all active:scale-[0.98]"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
// 
