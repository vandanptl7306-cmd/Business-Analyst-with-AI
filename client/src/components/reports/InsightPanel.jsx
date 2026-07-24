import React, { useMemo } from 'react';
import { Sparkles, TrendingUp, TrendingDown, AlertCircle, Info, ArrowRight } from 'lucide-react';

// Pre-defined heuristic insights logic
function generateSalesInsights(salesTrend, topProducts) {
  const insights = [];
  
  if (salesTrend && salesTrend.length >= 2) {
    const recent = salesTrend[salesTrend.length - 1].revenue;
    const previous = salesTrend[salesTrend.length - 2].revenue;
    const growth = previous > 0 ? ((recent - previous) / previous) * 100 : 0;
    
    if (growth > 5) {
      insights.push({
        id: 1,
        severity: 'success',
        title: `Sales increased by ${growth.toFixed(1)}%`,
        explanation: 'Recent period revenue showed positive growth compared to the previous period.',
        recommendation: 'Maintain current marketing strategies.'
      });
    } else if (growth < -5) {
      insights.push({
        id: 2,
        severity: 'warning',
        title: `Sales dropped by ${Math.abs(growth).toFixed(1)}%`,
        explanation: 'Recent period revenue showed a decline.',
        recommendation: 'Investigate potential seasonal factors or marketing drop-offs.'
      });
    }
  }

  if (topProducts && topProducts.length > 0) {
    const bestSeller = topProducts[0];
    const totalRev = topProducts.reduce((acc, p) => acc + p.totalSalesVal, 0);
    if (totalRev > 0) {
      const contribution = (bestSeller.totalSalesVal / totalRev) * 100;
      insights.push({
        id: 3,
        severity: 'info',
        title: `${bestSeller._id} is a top performer`,
        explanation: `Contributes to ${contribution.toFixed(1)}% of top product revenue.`,
        severityIcon: TrendingUp,
        recommendation: 'Ensure high inventory levels to prevent stockouts.'
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      id: 4,
      severity: 'neutral',
      title: 'Stable sales performance',
      explanation: 'No significant anomalies detected in recent sales.',
      recommendation: 'Continue monitoring.'
    });
  }

  return insights;
}

function generateProfitInsights(plSummary, expenses) {
  const insights = [];
  if (plSummary) {
    if (plSummary.margin > 20) {
      insights.push({
        id: 1,
        severity: 'success',
        title: 'Healthy Profit Margin',
        explanation: `Net profit margin is ${plSummary.margin.toFixed(1)}%.`,
        recommendation: 'Consider reinvesting excess capital.'
      });
    } else if (plSummary.margin < 5) {
      insights.push({
        id: 2,
        severity: 'error',
        title: 'Low Profit Margin',
        explanation: 'Margins are tight. Operating expenses might be eating into gross profit.',
        recommendation: 'Audit highest expense categories to reduce costs.'
      });
    }

    if (expenses && expenses.length > 0) {
      const topExpense = [...expenses].sort((a, b) => b.totalAmount - a.totalAmount)[0];
      if (topExpense && topExpense.totalAmount > plSummary.totalRevenue * 0.3) {
        insights.push({
          id: 3,
          severity: 'warning',
          title: `High ${topExpense._id} expenses`,
          explanation: `This category accounts for a significant portion of revenue.`,
          recommendation: 'Review vendor contracts or usage rates.'
        });
      }
    }
  }
  return insights;
}

function generateGSTInsights(gstLiability) {
  const insights = [];
  if (gstLiability) {
    insights.push({
      id: 1,
      severity: 'info',
      title: 'GST Filing Summary',
      explanation: `Total GST Collected: ₹${gstLiability.totalCollected.toFixed(2)}, ITC: ₹${gstLiability.inputTaxCredit.toFixed(2)}.`,
      recommendation: 'Ensure timely filing of GSTR-3B and GSTR-1.'
    });
    
    if (gstLiability.igst > gstLiability.cgst * 2) {
      insights.push({
        id: 2,
        severity: 'info',
        title: 'High Inter-State Sales',
        explanation: 'IGST collection is significantly higher than CGST/SGST.',
        recommendation: 'Optimize inter-state logistics costs.'
      });
    }
  }
  return insights;
}

export default function InsightPanel({ type, data }) {
  const insights = useMemo(() => {
    switch (type) {
      case 'sales': return generateSalesInsights(data?.salesTrend, data?.topProducts);
      case 'profit': return generateProfitInsights(data?.plSummary, data?.expenses);
      case 'gst': return generateGSTInsights(data?.gstLiability);
      default: return [];
    }
  }, [type, data]);

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'success': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'warning': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'error': return 'bg-red-50 text-red-800 border-red-200';
      case 'info': return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      default: return 'bg-slate-50 text-slate-800 border-slate-200';
    }
  };
  
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'success': return <TrendingUp className="h-4 w-4 text-emerald-600" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-amber-600" />;
      case 'error': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'info': return <Info className="h-4 w-4 text-indigo-600" />;
      default: return <Sparkles className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
        <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">AI Generated Insights</h3>
      </div>
      
      <div className="space-y-3">
        {insights.length === 0 ? (
          <p className="text-xs text-slate-400">Not enough data to generate insights.</p>
        ) : (
          insights.map((insight) => (
            <div key={insight.id} className={`p-4 rounded-xl border text-sm space-y-2 ${getSeverityStyles(insight.severity)}`}>
              <div className="flex items-start space-x-2">
                <div className="mt-0.5">{getSeverityIcon(insight.severity)}</div>
                <div>
                  <h4 className="font-bold">{insight.title}</h4>
                  <p className="text-xs opacity-90 mt-0.5">{insight.explanation}</p>
                </div>
              </div>
              
              {insight.recommendation && (
                <div className="flex items-center space-x-1 text-xs font-semibold pt-2 border-t border-black/5 mt-2">
                  <ArrowRight className="h-3 w-3" />
                  <span>{insight.recommendation}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
