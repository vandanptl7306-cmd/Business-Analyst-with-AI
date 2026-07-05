// client/src/components/InvoiceStatusBadge.jsx

import React from 'react';
import { AlertCircle, CheckCircle, HelpCircle, XCircle, Clock } from 'lucide-react';

const statusConfig = {
  Draft: {
    color: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
    icon: HelpCircle,
    label: 'Draft',
  },
  Unpaid: {
    color: 'bg-red-500/10 border-red-500/20 text-red-400',
    icon: AlertCircle,
    label: 'Unpaid',
  },
  'Partially Paid': {
    color: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    icon: Clock,
    label: 'Partially Paid',
  },
  Paid: {
    color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    icon: CheckCircle,
    label: 'Paid',
  },
  Cancelled: {
    color: 'bg-zinc-800 border-zinc-700 text-zinc-550 line-through',
    icon: XCircle,
    label: 'Cancelled',
  },
};

export default function InvoiceStatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.Draft;
  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config.color} transition-all duration-300`}
    >
      <IconComponent className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
      <span>{config.label}</span>
    </span>
  );
}
