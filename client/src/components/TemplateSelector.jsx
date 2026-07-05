// client/src/components/TemplateSelector.jsx

import React from 'react';
import { Layout, Check } from 'lucide-react';

const templates = [
  {
    id: 'Standard',
    name: 'Standard Layout',
    desc: 'Classic business layout with grids, ideal for B2B billing and audits.',
    preview: (
      <div className="border border-slate-700 rounded-lg p-3 bg-slate-950 space-y-2 text-[6px] text-slate-500 font-mono">
        <div className="border-b border-blue-500 pb-1.5 flex justify-between">
          <div className="font-bold text-slate-400">COMPANY LOGO</div>
          <div className="text-right">INVOICE</div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[5px]">
          <div className="bg-slate-900 p-1 rounded">FROM: Seller Details</div>
          <div className="bg-slate-900 p-1 rounded">TO: Buyer Details</div>
        </div>
        <div className="border border-slate-800 rounded">
          <div className="bg-blue-500 text-white p-0.5 text-[4px] flex justify-between">
            <span>Description</span>
            <span>Qty</span>
            <span>Total</span>
          </div>
          <div className="p-0.5 flex justify-between border-t border-slate-900">
            <span>Server License</span>
            <span>1</span>
            <span>$1000.00</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'Modern',
    name: 'Modern Gradient',
    desc: 'Premium sleek design with indigo headers, great for modern SaaS clients.',
    preview: (
      <div className="border border-slate-700 rounded-lg p-3 bg-slate-950 space-y-2 text-[6px] text-slate-500 font-mono">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-1.5 rounded-lg flex justify-between text-white text-[5px]">
          <span className="font-bold">LOGO</span>
          <span className="text-right">INVOICE</span>
        </div>
        <div className="flex justify-between gap-2 text-[5px] text-slate-450">
          <div className="bg-slate-900/60 p-1 rounded-lg flex-1">From Details</div>
          <div className="bg-slate-900/60 p-1 rounded-lg flex-1 text-right font-bold">To Details</div>
        </div>
        <div className="space-y-1">
          <div className="bg-slate-900/40 p-1 rounded flex justify-between text-[4px] border-b border-slate-850">
            <span>API Subscription</span>
            <span>$500.00</span>
          </div>
          <div className="bg-slate-900/40 p-1 rounded flex justify-between text-[4px] border-b border-slate-850">
            <span>Database Hosting</span>
            <span>$120.00</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'Thermal',
    name: 'Thermal Receipt',
    desc: 'Narrow 80mm condensed receipt format, optimized for POS thermal printers.',
    preview: (
      <div className="border border-slate-700 rounded-lg p-3 bg-slate-950 space-y-1.5 text-[6px] text-slate-500 font-mono flex flex-col items-center">
        <div className="w-40 border-dashed border-b border-slate-700 pb-1 text-center text-[5px]">
          <div className="font-bold text-slate-400">RECEIPT</div>
          <div>IntellectBill AI</div>
        </div>
        <div className="w-40 text-[4px] space-y-0.5 text-left border-dashed border-b border-slate-700 pb-1">
          <div>Ref: #INV-001</div>
          <div>Qty x Price: 1 x $120.00</div>
        </div>
        <div className="w-40 text-right text-[5px] font-bold text-slate-400">
          TOTAL: $120.00
        </div>
      </div>
    ),
  },
];

export default function TemplateSelector({ value, onChange }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-slate-350 font-semibold text-sm">
        <Layout className="h-4 w-4 text-brand-400" />
        <span>Default Invoice Format Template</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {templates.map((tpl) => {
          const isSelected = value === tpl.id;
          return (
            <div
              key={tpl.id}
              onClick={() => onChange(tpl.id)}
              className={`border rounded-2xl p-4 bg-slate-900 cursor-pointer hover:border-slate-700 transition-all shadow-xl space-y-3 flex flex-col justify-between relative overflow-hidden ${
                isSelected ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-slate-800'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 p-1 bg-brand-500 text-white rounded-full">
                  <Check className="h-3 w-3" />
                </div>
              )}

              <div className="space-y-1">
                <h4 className="font-bold text-slate-200 text-sm">{tpl.name}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{tpl.desc}</p>
              </div>

              <div className="pt-2">{tpl.preview}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
// 
