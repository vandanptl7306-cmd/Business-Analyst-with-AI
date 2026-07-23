import React from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area
} from 'recharts';

export default function ForecastChart({ data, chartType = 'line' }) {
  if (!data || data.length === 0) return null;

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded shadow-md text-xs">
          <p className="font-bold text-slate-800 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="font-semibold flex justify-between gap-4">
              <span>{entry.name}:</span>
              <span>{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (chartType === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(tick) => tick.split('-')[2]} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#64748b' }} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#64748b' }} 
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '10px' }} />
          <Bar dataKey="predicted_quantity" name="Predicted Demand" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Default: Line chart with confidence interval (Area)
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis 
          dataKey="date" 
          tickFormatter={(tick) => tick.split('-')[2]} 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fill: '#64748b' }} 
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fill: '#64748b' }} 
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '10px' }} />
        
        {/* Confidence Interval Area */}
        <Area 
          type="monotone" 
          dataKey="upper_confidence" 
          fill="#818cf8" 
          stroke="none" 
          fillOpacity={0.2} 
          name="Upper Confidence" 
          activeDot={false}
        />
        <Area 
          type="monotone" 
          dataKey="lower_confidence" 
          fill="#ffffff" 
          stroke="none" 
          fillOpacity={1} 
          name="Lower Confidence" 
          activeDot={false}
          className="hidden" // Hiding from legend nicely but cutting out the bottom
        />
        
        <Line 
          type="monotone" 
          dataKey="predicted_quantity" 
          name="Predicted Demand" 
          stroke="#4f46e5" 
          strokeWidth={3} 
          dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} 
          activeDot={{ r: 6 }} 
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
