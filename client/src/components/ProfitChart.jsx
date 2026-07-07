// client/src/components/ProfitChart.jsx

import React, { useState } from 'react';
import { BarChart3, TrendingUp, DollarSign } from 'lucide-react';

export default function ProfitChart({ invoices }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Group and sort last 7 days of invoices
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toLocaleDateString();
  }).reverse();

  // Aggregate profit by day
  const dailyData = last7Days.map((day) => {
    const matching = invoices.filter((inv) => new Date(inv.createdAt).toLocaleDateString() === day);
    const profit = matching.reduce((acc, curr) => acc + (curr.netProfit || 0), 0);
    const revenue = matching.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0);
    return {
      date: day.split('/')[0] + '/' + day.split('/')[1], // standard short DD/MM
      profit: Number(profit.toFixed(2)),
      revenue: Number(revenue.toFixed(2)),
    };
  });

  const maxVal = Math.max(...dailyData.map((d) => Math.max(d.profit, 100)));

  return (
    <div className="card-module space-y-6">
      
      {/* Chart Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-slate-800">Daily Profit Performance</h3>
        </div>
        <div className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-lg font-mono">
          Last 7 Days
        </div>
      </div>

      {/* SVG/HTML Bar Chart */}
      <div className="h-64 flex items-end justify-between gap-4 pt-8 pb-4 px-2 relative">
        
        {/* Y Axis Guides */}
        <div className="absolute left-0 right-0 top-8 border-b border-slate-100 text-[9px] text-slate-400 font-mono text-right pr-1">
          ${(maxVal * 0.75).toFixed(0)}
        </div>
        <div className="absolute left-0 right-0 top-24 border-b border-slate-100 text-[9px] text-slate-400 font-mono text-right pr-1">
          ${(maxVal * 0.5).toFixed(0)}
        </div>
        <div className="absolute left-0 right-0 top-40 border-b border-slate-100 text-[9px] text-slate-400 font-mono text-right pr-1">
          ${(maxVal * 0.25).toFixed(0)}
        </div>

        {dailyData.map((data, index) => {
          const profitPct = (data.profit / maxVal) * 80; // limit height to 80% max
          const revenuePct = (data.revenue / maxVal) * 80;
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center group relative z-10 cursor-pointer"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Tooltip on hover */}
              {isHovered && (
                <div className="absolute bottom-full mb-2 bg-slate-900 border border-slate-800 p-2.5 rounded-xl shadow-2xl text-[10px] space-y-1 w-28 z-50 text-slate-100">
                  <div className="font-bold text-white">{data.date}</div>
                  <div className="flex justify-between">
                    <span>Revenue:</span>
                    <span className="font-bold font-mono">${data.revenue}</span>
                  </div>
                  <div className="flex justify-between text-indigo-300">
                    <span>Profit:</span>
                    <span className="font-bold font-mono">${data.profit}</span>
                  </div>
                </div>
              )}

              {/* Stacked Bars */}
              <div className="w-full flex items-end justify-center space-x-1.5 h-44 relative">
                {/* Revenue Column */}
                <div
                  style={{ height: `${Math.max(revenuePct, 3)}%` }}
                  className="w-3 sm:w-4 bg-slate-200 group-hover:bg-slate-300 rounded-t transition-all duration-300 relative animate-graph-bar border border-slate-200"
                />
                
                {/* Profit Column */}
                <div
                  style={{ height: `${Math.max(profitPct, 3)}%` }}
                  className="w-3.5 sm:w-4.5 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t transition-all duration-300 shadow-lg shadow-indigo-500/10 group-hover:from-indigo-500 group-hover:to-indigo-300 animate-graph-bar"
                />
              </div>

              {/* X Axis Label */}
              <span className="text-[10px] font-mono text-slate-400 mt-2">{data.date}</span>
            </div>
          );
        })}
      </div>

      {/* Legend & Stats */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <div className="w-2.5 h-2.5 rounded bg-gradient-to-tr from-indigo-600 to-indigo-400" />
            <span className="text-slate-500">Net Profit</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-2.5 h-2.5 rounded bg-slate-200" />
            <span className="text-slate-500">Revenue</span>
          </div>
        </div>

        <div className="flex items-center space-x-1 text-indigo-600 font-bold">
          <TrendingUp className="h-4 w-4" />
          <span>Margins Analyzed</span>
        </div>
      </div>

    </div>
  );
}
