import Papa from 'papaparse';
import { jsPDF } from 'jspdf';

export const exportToCSV = (data, filename = 'forecast.csv') => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (forecastList, summary, inventory, insights, filename = 'forecast_report.pdf') => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('Demand Forecasting Report', 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Total Forecast Demand: ${summary.totalDemand} Units`, 20, 35);
  doc.text(`Average Daily Demand: ${summary.avgDailyDemand} Units`, 20, 45);
  doc.text(`Current Inventory: ${inventory.currentStock} Units`, 20, 55);
  doc.text(`Safety Stock: ${inventory.safetyStock} Units`, 20, 65);
  
  doc.setFontSize(14);
  doc.text('Inventory Status', 20, 85);
  doc.setFontSize(12);
  doc.text(`Status: ${inventory.status}`, 20, 95);
  doc.text(`Recommendation: ${inventory.recommendation}`, 20, 105);
  
  doc.setFontSize(14);
  doc.text('AI Insights', 20, 125);
  doc.setFontSize(12);
  let y = 135;
  insights.forEach(insight => {
    doc.text(`- ${insight.text}`, 20, y);
    doc.text(`  Action: ${insight.recommendation}`, 20, y + 5);
    y += 15;
  });
  
  doc.save(filename);
};
