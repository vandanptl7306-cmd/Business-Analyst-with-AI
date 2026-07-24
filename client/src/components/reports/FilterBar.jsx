import React, { useState } from 'react';
import { Calendar, Filter, ChevronDown, X } from 'lucide-react';

const PRESETS = [
  'Today', 'Yesterday', 'This Week', 'Last Week', 'This Month', 
  'Last Month', 'Current Quarter', 'Previous Quarter', 'This Year', 'Custom Range'
];

export default function FilterBar({ 
  startDate, setStartDate, endDate, setEndDate, onApply 
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activePreset, setActivePreset] = useState('This Month');
  const [filters, setFilters] = useState({
    product: '',
    category: '',
    customer: '',
    paymentMode: '',
    invoiceStatus: '',
    gstType: ''
  });

  const handleSelectPreset = (preset) => {
    setActivePreset(preset);
    const today = new Date();
    let start = new Date();
    let end = new Date();

    // Reset times
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);

    switch(preset) {
      case 'Today':
        break;
      case 'Yesterday':
        start.setDate(today.getDate() - 1);
        end.setDate(today.getDate() - 1);
        break;
      case 'This Week':
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
        start.setDate(diff);
        break;
      case 'Last Week':
        start.setDate(today.getDate() - today.getDay() - 6);
        end.setDate(start.getDate() + 6);
        break;
      case 'This Month':
        start.setDate(1);
        break;
      case 'Last Month':
        start.setMonth(today.getMonth() - 1);
        start.setDate(1);
        end.setMonth(today.getMonth());
        end.setDate(0);
        break;
      case 'Current Quarter':
        start.setMonth(Math.floor(today.getMonth() / 3) * 3);
        start.setDate(1);
        break;
      case 'Previous Quarter':
        start.setMonth((Math.floor(today.getMonth() / 3) - 1) * 3);
        start.setDate(1);
        end.setMonth(start.getMonth() + 3);
        end.setDate(0);
        break;
      case 'This Year':
        start.setMonth(0);
        start.setDate(1);
        break;
      default: // Custom Range
        return; 
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    onApply();
  };

  const handleFilterChange = (key, val) => {
    setFilters(prev => ({ ...prev, [key]: val }));
    // Depending on backend support, onApply() could be called here.
    // For now, we mock UI as required.
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4">
      {/* Top Row: Date Presets & Custom Dates */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        
        {/* Presets */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pr-2 whitespace-nowrap">Time:</span>
          {PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => handleSelectPreset(preset)}
              className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                activePreset === preset 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Custom Date Range & Advanced Toggle */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg px-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActivePreset('Custom Range');
              }}
              className="py-1.5 bg-transparent text-slate-700 outline-none focus:ring-0 font-mono text-xs w-28"
            />
            <span className="text-slate-400 font-semibold text-xs">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActivePreset('Custom Range');
              }}
              className="py-1.5 bg-transparent text-slate-700 outline-none focus:ring-0 font-mono text-xs w-28"
            />
          </div>
          <button
            onClick={() => onApply()}
            className="px-4 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Apply
          </button>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="p-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Advanced Filters Drawer */}
      {showAdvanced && (
        <div className="pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 animate-in fade-in slide-in-from-top-2">
          {Object.keys(filters).map((key) => (
            <div key={key} className="space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </label>
              <select 
                value={filters[key]}
                onChange={(e) => handleFilterChange(key, e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-600 outline-none focus:border-indigo-500"
              >
                <option value="">All</option>
                <option value="opt1">Option 1 (Mock)</option>
                <option value="opt2">Option 2 (Mock)</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
