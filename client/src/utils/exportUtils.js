import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const exportToCSV = (data, filename = 'report.csv') => {
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

export const exportToExcel = (data, filename = 'report.xlsx') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  XLSX.writeFile(workbook, filename);
};

export const exportReportToPDF = (reportTitle, summaryData, tableColumns, tableData, filename = 'report.pdf') => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text(reportTitle, 14, 20);
  
  // Summary Data
  doc.setFontSize(11);
  let startY = 30;
  if (summaryData && summaryData.length > 0) {
    summaryData.forEach((item, index) => {
      if (index > 0 && index % 2 === 0) startY += 10;
      const x = (index % 2 === 0) ? 14 : 100;
      doc.text(`${item.label}: ${item.value}`, x, startY);
    });
    startY += 15;
  }
  
  // Table
  if (tableData && tableData.length > 0 && tableColumns && tableColumns.length > 0) {
    const tableColumnNames = tableColumns.map(col => col.header);
    const tableRows = tableData.map(row => 
      tableColumns.map(col => row[col.key] !== undefined ? row[col.key] : '')
    );
    
    doc.autoTable({
      head: [tableColumnNames],
      body: tableRows,
      startY: startY,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] } // Indigo-600
    });
  }
  
  doc.save(filename);
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
