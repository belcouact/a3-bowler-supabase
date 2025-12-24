import React from 'react';
import { X, Download, Copy, Sparkles, TrendingUp, AlertTriangle, Target, Activity, ArrowRight } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { MarkdownRenderer } from './MarkdownRenderer';
import { GroupPerformanceRow } from '../types';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  isLoading: boolean;
  onHideWhileLoading: () => void;
  groupPerformanceTableData: GroupPerformanceRow[];
}
interface AreaOfConcern {
  metricName: string;
  groupName: string;
  issue: string;
  suggestion: string;
}

interface SummaryData {
  executiveSummary: string;
  a3Summary?: string;
  areasOfConcern: AreaOfConcern[];
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  onClose,
  content,
  isLoading,
  onHideWhileLoading,
  groupPerformanceTableData,
}) => {
  const toast = useToast();

  if (!isOpen) return null;

  let parsedData: SummaryData | null = null;
  let isJson = false;

  try {
    if (content && !isLoading) {
      const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleanContent) as SummaryData;
      if (parsedData && parsedData.executiveSummary && Array.isArray(parsedData.areasOfConcern)) {
          isJson = true;
      }
    }
  } catch (e) {
    // Content might be plain text/markdown if old version or parsing failed
    isJson = false;
  }

  const hasStats = groupPerformanceTableData.length > 0;

  const handleCopy = () => {
    if (isJson && parsedData) {
        let textToCopy = `Executive Overview:\n${parsedData.executiveSummary}\n\n`;
        
        if (parsedData.a3Summary && parsedData.a3Summary.trim() !== '') {
          textToCopy += `A3 Problem Solving Summary:\n${parsedData.a3Summary}\n\n`;
        }

        textToCopy += `\nAreas of Concern & Recommendations:\n`;
        parsedData.areasOfConcern.forEach(area => {
            textToCopy += `- ${area.metricName} (${area.groupName}): ${area.issue}\n  Suggestion: ${area.suggestion}\n`;
        });

        navigator.clipboard.writeText(textToCopy);
    } else {
        navigator.clipboard.writeText(content);
    }
    toast.success('Summary copied to clipboard!');
  };

  const handleDownload = () => {
    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    let html = '';

    if (isJson && parsedData) {
      const executive = escapeHtml(parsedData.executiveSummary);
      const a3Summary =
        parsedData.a3Summary && parsedData.a3Summary.trim() !== ''
          ? `<section class="card card-a3">
  <h2 class="card-title">A3 Problem Solving Summary</h2>
  <p>${escapeHtml(parsedData.a3Summary)}</p>
</section>`
          : '';

      const statsTableHtml =
        groupPerformanceTableData.length > 0
          ? `<section class="card card-stats">
  <h2 class="card-title">Portfolio Statistical Table</h2>
  <div class="table-wrapper">
    <table class="stats-table">
      <thead>
        <tr>
          <th>Group</th>
          <th>Metric</th>
          <th>Latest month</th>
          <th>Last 2 months</th>
          <th>Last 3 months</th>
          <th>Linked A3s</th>
          <th>Overall target achieving %</th>
        </tr>
      </thead>
      <tbody>
        ${groupPerformanceTableData
          .map(
            row => `<tr>
          <td>${escapeHtml(row.groupName)}</td>
          <td>${escapeHtml(row.metricName)}</td>
          <td>${
            row.latestMet === null || !row.latestActual
              ? '—'
              : `<span class="circle-badge ${
                  row.latestMet === false ? 'circle-badge-fail' : 'circle-badge-ok'
                }">${escapeHtml(row.latestActual)}</span>`
          }</td>
          <td>${
            row.fail2
              ? '<span class="status-pill status-warn"><span class="status-dot"></span>Failing</span>'
              : '—'
          }</td>
          <td>${
            row.fail3
              ? '<span class="status-pill status-fail"><span class="status-dot"></span>Failing</span>'
              : '—'
          }</td>
          <td>${
            row.fail2 || row.fail3
              ? row.linkedA3Count === 0
                ? '<span class="circle-badge circle-badge-fail">0</span>'
                : `<span class="circle-badge circle-badge-ok">${row.linkedA3Count}</span>`
              : '—'
          }</td>
          <td>${
            row.achievementRate != null
              ? `<span class="circle-badge ${
                  row.achievementRate < (2 / 3) * 100
                    ? 'circle-badge-fail'
                    : 'circle-badge-ok'
                }">${row.achievementRate.toFixed(0)}%</span>`
              : '—'
          }</td>
        </tr>`,
          )
          .join('')}
      </tbody>
    </table>
  </div>
</section>`
          : '';

      const concernsHtml =
        parsedData.areasOfConcern.length > 0
          ? parsedData.areasOfConcern
              .map(
                (area) => `<div class="concern-card">
  <div class="concern-header">
    <span class="concern-metric">${escapeHtml(area.metricName)}</span>
    <span class="concern-group">${escapeHtml(area.groupName)}</span>
  </div>
  <p class="concern-issue">${escapeHtml(area.issue)}</p>
  <p class="concern-suggestion">${escapeHtml(area.suggestion)}</p>
</div>`
              )
              .join('')
          : '<p class="empty-text">No major areas of concern identified. Keep up the good work!</p>';

      html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Smart Summary & Insights</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root {
      --bg: #f3f4f6;
      --card-bg: #ffffff;
      --primary: #4f46e5;
      --primary-soft: #eef2ff;
      --border-subtle: #e5e7eb;
      --text-main: #111827;
      --text-muted: #6b7280;
      --danger: #b91c1c;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      background: var(--bg);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--text-main);
    }
    .summary-root {
      max-width: 1100px;
      margin: 0 auto;
    }
    .summary-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-radius: 16px;
      background: linear-gradient(90deg, #eef2ff, #ffffff);
      border: 1px solid #e0e7ff;
      margin-bottom: 20px;
    }
    .summary-title {
      font-size: 18px;
      font-weight: 700;
      margin: 0;
    }
    .summary-tag {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 999px;
      background: #ecfdf3;
      color: #166534;
      border: 1px solid #bbf7d0;
      font-size: 11px;
      font-weight: 500;
      margin-top: 4px;
    }
    .summary-tag span {
      margin-left: 4px;
    }
    .card {
      background: var(--card-bg);
      border-radius: 16px;
      border: 1px solid var(--border-subtle);
      padding: 20px 24px;
      margin-bottom: 20px;
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
    }
    .card-executive {
      background: linear-gradient(135deg, #eef2ff, #ffffff);
      border-color: #e0e7ff;
    }
    .card-a3 {
      background: linear-gradient(135deg, #eff6ff, #ffffff);
      border-color: #bfdbfe;
    }
    .card-title {
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 700;
      color: var(--primary);
    }
    .card p {
      margin: 0;
      font-size: 14px;
      line-height: 1.6;
      color: var(--text-muted);
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    .group-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #6b7280;
      padding-bottom: 4px;
      margin-bottom: 8px;
      border-bottom: 1px solid #f3f4f6;
    }
    .metrics-list,
    .metrics-trend-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .metric-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
    }
    .metric-name {
      color: #374151;
      font-weight: 500;
      margin-right: 8px;
    }
    .metric-value {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 999px;
      background: #f9fafb;
      color: #4b5563;
      white-space: nowrap;
    }
    .metric-trend {
      color: #7c3aed;
    }
    .card-concerns {
      background: #fef2f2;
      border-color: #fecaca;
    }
    .concern-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #fee2e2;
      padding: 12px 14px;
      margin-bottom: 10px;
    }
    .concern-header {
      display: flex;
      align-items: center;
      margin-bottom: 6px;
    }
    .concern-metric {
      font-size: 13px;
      font-weight: 700;
      margin-right: 6px;
      color: #111827;
    }
    .concern-group {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 999px;
      background: #f3f4f6;
      color: #4b5563;
    }
    .concern-issue {
      font-size: 13px;
      color: var(--danger);
      font-weight: 500;
      margin: 0 0 4px 0;
    }
    .concern-suggestion {
      font-size: 13px;
      color: #4b5563;
      margin: 0;
      font-style: italic;
    }
    .empty-text {
      font-size: 13px;
      color: #9ca3af;
      font-style: italic;
    }
    .table-wrapper {
      overflow-x: auto;
      margin-top: 8px;
    }
    .stats-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .stats-table th,
    .stats-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #e5e7eb;
      text-align: left;
    }
    .stats-table thead th {
      background: #f9fafb;
      font-weight: 600;
      color: #4b5563;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 500;
      border: 1px solid transparent;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 999px;
      margin-right: 4px;
      background: currentColor;
    }
    .status-ok {
      background: #ecfdf3;
      color: #166534;
      border-color: #bbf7d0;
    }
    .status-fail {
      background: #fef2f2;
      color: #b91c1c;
      border-color: #fecaca;
    }
    .status-warn {
      background: #fffbeb;
      color: #92400e;
      border-color: #fed7aa;
    }
    .circle-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      border: 1px solid transparent;
    }
    .circle-badge-ok {
      background: #ecfdf3;
      color: #166534;
      border-color: #bbf7d0;
    }
    .circle-badge-fail {
      background: #fef2f2;
      color: #b91c1c;
      border-color: #fecaca;
    }
    @media (max-width: 640px) {
      body { padding: 16px; }
      .summary-header { flex-direction: column; align-items: flex-start; }
    }
  </style>
</head>
<body>
  <div class="summary-root">
    <header class="summary-header">
      <div>
        <h1 class="summary-title">Smart Summary & Insights</h1>
        <div class="summary-tag">
          <span>Consecutive Failing Metrics Focus</span>
        </div>
      </div>
    </header>

    <section class="card card-executive">
      <h2 class="card-title">Executive Overview</h2>
      <p>${executive}</p>
    </section>

    ${statsTableHtml}

    ${a3Summary}

    <section class="card card-concerns">
      <h2 class="card-title">Areas of Concern & Recommendations</h2>
      ${concernsHtml}
    </section>
  </div>
</body>
</html>`;
    } else {
      const safeContent = escapeHtml(content);
      html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Smart Summary</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body {
      margin: 0;
      padding: 24px;
      background: #f3f4f6;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #111827;
    }
    .card {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #e5e7eb;
      padding: 20px 24px;
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
      white-space: pre-wrap;
      font-size: 14px;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="card">${safeContent}</div>
</body>
</html>`;
    }

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `metric_bowler_summary_${new Date()
      .toISOString()
      .split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('HTML downloaded!');
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-stretch min-h-screen text-center">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div
          className="inline-block align-bottom bg-white text-left overflow-hidden shadow-xl transform transition-all w-full h-screen sm:align-middle sm:max-w-full sm:w-full flex flex-col"
        >
          
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-50 via-white to-white px-4 py-4 sm:px-6 border-b border-indigo-100 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 shadow-sm mr-4">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                    <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                    Smart Summary & Insights
                    </h3>
                    <div className="flex items-center mt-1 space-x-3 text-xs font-medium text-gray-500">
                        <span className="flex items-center bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">
                            <TrendingUp className="w-3 h-3 mr-1" /> Consecutive Failing Metrics
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex items-center space-x-2">
              {isLoading && (
                <button
                  onClick={onHideWhileLoading}
                  className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border border-indigo-100 text-indigo-600 bg-white hover:bg-indigo-50 transition-colors"
                >
                  Continue working
                </button>
              )}
              <button
                  onClick={onClose}
                  className="bg-white rounded-md p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none transition-all"
              >
                  <span className="sr-only">Close</span>
                  <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-5 sm:p-6 bg-white overflow-y-auto custom-scrollbar flex-1">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full py-16 space-y-8">
                    <div className="relative w-32 h-32">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 opacity-30 blur-sm"></div>
                        <div className="absolute inset-3 rounded-full border-2 border-indigo-200 border-dashed animate-spin"></div>
                        <div className="absolute inset-6 rounded-full bg-white flex items-center justify-center shadow-md">
                            <Sparkles className="w-7 h-7 text-indigo-600 animate-pulse" />
                        </div>
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                        <h4 className="text-lg font-medium text-gray-900">Crafting your AI summary</h4>
                        <p className="text-gray-500 text-sm max-w-xs mx-auto">
                            Analyzing metrics, trends, and A3 cases to surface the most important insights.
                        </p>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-50 border border-gray-100 animate-pulse">
                            <Activity className="w-3 h-3 text-indigo-500" />
                            <span>Scanning metrics</span>
                        </div>
                        <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-50 border border-gray-100 animate-pulse" style={{ animationDelay: '0.15s' }}>
                            <TrendingUp className="w-3 h-3 text-purple-500" />
                            <span>Finding trends</span>
                        </div>
                        <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-50 border border-gray-100 animate-pulse" style={{ animationDelay: '0.3s' }}>
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                            <span>Highlighting risks</span>
                        </div>
                    </div>
                </div>
            ) : isJson && parsedData ? (
                <div className="space-y-8">
                    <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl border border-indigo-100 shadow-sm">
                        <h4 className="text-lg font-semibold text-indigo-900 mb-3 flex items-center">
                            <Target className="w-5 h-5 mr-2 text-indigo-600" />
                            Executive Overview
                        </h4>
                        <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                            {parsedData.executiveSummary}
                        </p>
                    </div>

                    {hasStats && (
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                          <h4 className="text-base font-semibold text-gray-800 flex items-center">
                            <Activity className="w-4 h-4 mr-2 text-blue-600" />
                            Portfolio Statistical Table
                          </h4>
                          <span className="text-[11px] text-gray-500">
                            Latest month, consecutive fails, and achievement %
                          </span>
                        </div>
                        <div className="p-4">
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-xs md:text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">
                                    Group
                                  </th>
                                  <th className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">
                                    Metric
                                  </th>
                                  <th className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">
                                    Latest month
                                  </th>
                                  <th className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">
                                    Last 2 months
                                  </th>
                                  <th className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">
                                    Last 3 months
                                  </th>
                                  <th className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">
                                    Linked A3s
                                  </th>
                                  <th className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">
                                    Overall target achieving %
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {groupPerformanceTableData.map(row => {
                                  const isAtRisk = row.fail2 || row.fail3;

                                  return (
                                    <tr key={row.metricId} className="border-b border-gray-100 last:border-0">
                                      <td className="px-3 py-2 text-gray-700">
                                        {row.groupName}
                                      </td>
                                      <td className="px-3 py-2 text-gray-700">
                                        {row.metricName}
                                      </td>
                                      <td className="px-3 py-2 text-gray-700">
                                        {row.latestMet === null || !row.latestActual ? (
                                          <span>—</span>
                                        ) : (
                                          <span
                                            className={
                                              'inline-flex items-center justify-center w-8 h-8 rounded-full text-[10px] font-semibold border ' +
                                              (row.latestMet === false
                                                ? 'bg-red-50 text-red-700 border-red-200'
                                                : 'bg-green-50 text-green-700 border-green-200')
                                            }
                                          >
                                            {row.latestActual}
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-gray-700">
                                        {row.fail2 ? (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
                                            <span className="mr-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                                            Failing
                                          </span>
                                        ) : (
                                          <span>—</span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-gray-700">
                                        {row.fail3 ? (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700 border border-red-100">
                                            <span className="mr-1 h-1.5 w-1.5 rounded-full bg-red-500" />
                                            Failing
                                          </span>
                                        ) : (
                                          <span>—</span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-gray-700">
                                        {isAtRisk ? (
                                          row.linkedA3Count === 0 ? (
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                                              0
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
                                              {row.linkedA3Count}
                                            </span>
                                          )
                                        ) : (
                                          <span>—</span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-gray-700">
                                        {row.achievementRate != null ? (
                                          <span
                                            className={
                                              'inline-flex items-center justify-center w-8 h-8 rounded-full text-[10px] font-semibold border ' +
                                              (row.achievementRate < (2 / 3) * 100
                                                ? 'bg-red-50 text-red-700 border-red-200'
                                                : 'bg-green-50 text-green-700 border-green-200')
                                            }
                                          >
                                            {row.achievementRate.toFixed(0)}%
                                          </span>
                                        ) : (
                                          '—'
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {parsedData.a3Summary && parsedData.a3Summary.trim() !== '' && (
                      <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100 shadow-sm">
                        <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                          <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
                          A3 Problem Solving Summary
                        </h4>
                        <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                          {parsedData.a3Summary}
                        </p>
                      </div>
                    )}

                    {/* Areas of Concern & Suggestions */}
                    <div className="bg-red-50/30 p-6 rounded-xl border border-red-100">
                        <h4 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                            Areas of Concern & Recommendations
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                            {parsedData.areasOfConcern.map((area, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-lg border border-red-100 shadow-sm">
                                    <div className="flex items-center mb-2">
                                        <span className="text-sm font-bold text-gray-900 mr-2">{area.metricName}</span>
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{area.groupName}</span>
                                    </div>
                                    <p className="text-sm text-red-700 mb-2 font-medium">
                                        <span className="mr-1">⚠️</span> {area.issue}
                                    </p>
                                    <div className="flex items-start text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                                        <ArrowRight className="w-4 h-4 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                                        <p className="italic">{area.suggestion}</p>
                                    </div>
                                </div>
                            ))}
                            {parsedData.areasOfConcern.length === 0 && (
                                <p className="text-sm text-gray-500 italic">No major areas of concern identified. Keep up the good work!</p>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                // Fallback for non-JSON content or errors
                <div className="prose prose-sm max-w-none prose-indigo prose-headings:text-indigo-900 prose-a:text-indigo-600">
                    <MarkdownRenderer content={content} />
                </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200 w-full">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors export-ignore"
              onClick={handleDownload}
              disabled={isLoading || !content}
            >
              <Download className="w-4 h-4 mr-2" />
              Download HTML
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors export-ignore"
              onClick={handleCopy}
              disabled={isLoading || !content}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
