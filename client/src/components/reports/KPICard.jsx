import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export default function KPICard({ 
  title, 
  value, 
  trendPercentage, 
  comparisonText, 
  icon: Icon,
  trendDirection = 'neutral' // 'up', 'down', 'neutral'
}) {
  const isPositive = trendDirection === 'up';
  const isNegative = trendDirection === 'down';
  
  const TrendIcon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : Minus;
  
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
      {/* Subtle background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{title}</span>
          {Icon && (
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
        
        <div>
          <h4 className="text-2xl font-extrabold font-mono text-slate-800 tracking-tight">
            {value}
          </h4>
        </div>
        
        {trendPercentage !== undefined && (
          <div className="flex items-center space-x-2 text-xs">
            <div className={`flex items-center font-bold px-1.5 py-0.5 rounded-md ${
              isPositive ? 'bg-emerald-50 text-emerald-600' : 
              isNegative ? 'bg-red-50 text-red-600' : 
              'bg-slate-100 text-slate-600'
            }`}>
              <TrendIcon className="h-3 w-3 mr-0.5" />
              {trendPercentage}%
            </div>
            {comparisonText && (
              <span className="text-slate-400 font-medium">{comparisonText}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
