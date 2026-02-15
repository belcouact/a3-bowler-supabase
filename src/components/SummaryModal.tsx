import React from 'react';
import { X, Download, Copy, Sparkles, TrendingUp, AlertTriangle, Target, Activity, CheckCircle2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { MarkdownRenderer } from './MarkdownRenderer';
import { GroupPerformanceRow } from '../types';
import { clsx } from 'clsx';

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

      if (hasStats) {
        textToCopy += 'Portfolio Statistical Table:\n';
        textToCopy +=
          'Group | Metric | Latest month | Last 2 months | Last 3 months | Linked A3s | Overall target achieving %\n';
        textToCopy +=
          '----- | ------ | ------------ | ------------- | ------------- | ---------- | --------------------------\n';

        groupPerformanceTableData.forEach(row => {
          const latestText =
            row.latestMet === null || !row.latestActual
              ? '—'
              : row.latestActual;

          const last2Text = row.fail2 ? 'Failing' : '—';
          const last3Text = row.fail3 ? 'Failing' : '—';

          const atRisk = row.fail2 || row.fail3;
          const linkedText = atRisk ? (row.linkedA3Count === 0 ? '0' : String(row.linkedA3Count)) : '—';

          const achievementText =
            row.achievementRate != null ? `${row.achievementRate.toFixed(0)}%` : '—';

          textToCopy += `${row.groupName} | ${row.metricName} | ${latestText} | ${last2Text} | ${last3Text} | ${linkedText} | ${achievementText}\n`;
        });

        textToCopy += '\n';
      }

      textToCopy += `Areas of Concern & Recommendations:\n`;
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
  <h2 class="card-title">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="title-icon"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
    A3 Problem Solving Summary
  </h2>
  <p class="content-text">${escapeHtml(parsedData.a3Summary)}</p>
</section>`
          : '';

      const statsTableHtml =
        groupPerformanceTableData.length > 0
          ? `<section class="card card-stats">
  <h2 class="card-title">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="title-icon"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
    Portfolio Statistical Table
  </h2>
  <div class="table-wrapper">
    <table class="stats-table">
      <thead>
        <tr>
          <th>Group</th>
          <th>Metric</th>
          <th class="text-center">Latest</th>
          <th class="text-center">Fail 2m</th>
          <th class="text-center">Fail 3m</th>
          <th class="text-center">A3s</th>
          <th class="text-right">Achieve %</th>
        </tr>
      </thead>
      <tbody>
        ${groupPerformanceTableData
          .map(
            row => {
              const isAtRisk = row.fail2 || row.fail3;
              return `<tr>
          <td class="font-medium">${escapeHtml(row.groupName)}</td>
          <td class="text-muted">${escapeHtml(row.metricName)}</td>
          <td class="text-center">${
            row.latestMet === null || !row.latestActual
              ? '<span class="empty-val">—</span>'
              : `<span class="status-pill ${
                  row.latestMet === false ? 'status-fail' : 'status-ok'
                }">${escapeHtml(row.latestActual)}</span>`
          }</td>
          <td class="text-center">${
            row.fail2
              ? '<span class="status-badge status-warn">FAIL</span>'
              : '<span class="empty-val">—</span>'
          }</td>
          <td class="text-center">${
            row.fail3
              ? '<span class="status-badge status-fail">CRITICAL</span>'
              : '<span class="empty-val">—</span>'
          }</td>
          <td class="text-center">${
            isAtRisk
              ? `<span class="circle-badge ${row.linkedA3Count === 0 ? 'circle-badge-fail' : 'circle-badge-ok'}">${row.linkedA3Count}</span>`
              : '<span class="empty-val">—</span>'
          }</td>
          <td class="text-right">${
            row.achievementRate != null
              ? `<span class="status-pill ${
                  row.achievementRate < (2 / 3) * 100
                    ? 'status-fail'
                    : 'status-ok'
                }">${row.achievementRate.toFixed(0)}%</span>`
              : '<span class="empty-val">—</span>'
          }</td>
        </tr>`;
            }
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
  <div class="concern-body">
    <p class="concern-issue">
      <span class="concern-icon">⚠️</span>
      ${escapeHtml(area.issue)}
    </p>
    <div class="concern-suggestion">
      <div class="suggestion-header">RECOMMENDATION</div>
      <p>${escapeHtml(area.suggestion)}</p>
    </div>
  </div>
</div>`
              )
              .join('')
          : '<div class="empty-state">No major areas of concern identified. Keep up the good work!</div>';

      html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>A3 Bowler - Smart Summary & Insights</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root {
      --primary: #4f46e5;
      --primary-dark: #4338ca;
      --primary-light: #eef2ff;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --text-light: #94a3b8;
      --border: #e2e8f0;
      --success: #10b981;
      --success-bg: #ecfdf5;
      --warning: #f59e0b;
      --warning-bg: #fffbeb;
      --danger: #ef4444;
      --danger-bg: #fef2f2;
    }
    
    * { box-sizing: border-box; }
    
    body {
      margin: 0;
      padding: 40px 20px;
      background: var(--bg);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: var(--text-main);
      line-height: 1.5;
    }
    
    .container {
      max-width: 1000px;
      margin: 0 auto;
    }
    
    .header {
      margin-bottom: 40px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 32px;
      font-weight: 800;
      margin: 0 0 8px 0;
      letter-spacing: -0.025em;
      color: var(--text-main);
    }
    
    .header p {
      color: var(--text-muted);
      font-size: 16px;
      margin: 0;
    }
    
    .card {
      background: var(--card-bg);
      border-radius: 24px;
      border: 1px solid var(--border);
      padding: 32px;
      margin-bottom: 32px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    }
    
    .card-executive {
      background: linear-gradient(135deg, var(--primary-light), #ffffff);
      border-color: #c7d2fe;
    }
    
    .card-title {
      display: flex;
      align-items: center;
      margin: 0 0 20px 0;
      font-size: 20px;
      font-weight: 700;
      color: var(--text-main);
    }
    
    .title-icon {
      margin-right: 12px;
      color: var(--primary);
    }
    
    .executive-text {
      font-size: 18px;
      color: var(--text-main);
      font-style: italic;
      border-left: 4px solid var(--primary);
      padding-left: 20px;
      margin: 0;
    }
    
    .content-text {
      color: var(--text-muted);
      font-size: 16px;
      margin: 0;
    }
    
    .table-wrapper {
      overflow-x: auto;
      margin-top: 8px;
      border-radius: 12px;
      border: 1px solid var(--border);
    }
    
    .stats-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    
    .stats-table th {
      background: #f1f5f9;
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.05em;
    }
    
    .stats-table td {
      padding: 16px;
      border-bottom: 1px solid var(--border);
    }
    
    .stats-table tr:last-child td {
      border-bottom: none;
    }
    
    .text-center { text-align: center !important; }
    .text-right { text-align: right !important; }
    .font-medium { font-weight: 600; }
    .text-muted { color: var(--text-muted); }
    .empty-val { color: var(--text-light); }
    
    .status-pill {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
    }
    
    .status-ok {
      background: var(--success-bg);
      color: var(--success);
    }
    
    .status-fail {
      background: var(--danger-bg);
      color: var(--danger);
    }
    
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 800;
    }
    
    .status-warn {
      background: var(--warning-bg);
      color: var(--warning);
    }
    
    .circle-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      font-size: 12px;
      font-weight: 700;
    }
    
    .circle-badge-ok {
      background: var(--success-bg);
      color: var(--success);
      border: 1px solid #bbf7d0;
    }
    
    .circle-badge-fail {
      background: var(--danger-bg);
      color: var(--danger);
      border: 1px solid #fecaca;
    }
    
    .concern-card {
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid var(--border);
      padding: 20px;
      margin-bottom: 16px;
      transition: transform 0.2s;
    }
    
    .concern-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .concern-metric {
      font-weight: 700;
      font-size: 16px;
    }
    
    .concern-group {
      font-size: 11px;
      font-weight: 700;
      background: #f1f5f9;
      color: var(--text-muted);
      padding: 4px 10px;
      border-radius: 6px;
      text-transform: uppercase;
    }
    
    .concern-issue {
      font-size: 15px;
      font-weight: 600;
      color: var(--danger);
      margin: 0 0 16px 0;
      display: flex;
      align-items: flex-start;
    }
    
    .concern-icon {
      margin-right: 8px;
    }
    
    .concern-suggestion {
      background: var(--success-bg);
      padding: 16px;
      border-radius: 12px;
      border: 1px solid #d1fae5;
    }
    
    .suggestion-header {
      font-size: 10px;
      font-weight: 800;
      color: #065f46;
      margin-bottom: 4px;
      letter-spacing: 0.05em;
    }
    
    .concern-suggestion p {
      margin: 0;
      font-size: 14px;
      color: #065f46;
      font-style: italic;
    }
    
    .empty-state {
      text-align: center;
      padding: 40px;
      color: var(--text-light);
      font-style: italic;
      border: 2px dashed var(--border);
      border-radius: 16px;
    }
    
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
      color: var(--text-light);
      font-size: 12px;
    }

    @media print {
      body { background: white; padding: 0; }
      .card { box-shadow: none; border: 1px solid #eee; break-inside: avoid; }
      .container { max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>A3 Bowler Summary</h1>
      <p>Intelligent insights and performance report</p>
    </header>

    <section class="card card-executive">
      <h2 class="card-title">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="title-icon"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
        Executive Overview
      </h2>
      <p class="executive-text">${executive}</p>
    </section>

    ${statsTableHtml}

    ${a3Summary}

    <section class="card">
      <h2 class="card-title">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="title-icon"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        Areas of Concern & Recommendations
      </h2>
      ${concernsHtml}
    </section>
    
    <footer class="footer">
      Generated on ${new Date().toLocaleDateString()} by A3 Bowler AI • Workspace Insights Report
    </footer>
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
      padding: 40px 20px;
      background: #f8fafc;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: #0f172a;
    }
    .card {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 24px;
      border: 1px solid #e2e8f0;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      white-space: pre-wrap;
      font-size: 16px;
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
    link.download = `a3_bowler_summary_${new Date()
      .toISOString()
      .split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Professional report downloaded successfully!');
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
          <div className="px-4 py-5 sm:p-8 bg-white overflow-y-auto custom-scrollbar flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                <div className="space-y-10 max-w-5xl mx-auto">
                    {/* Executive Summary Card */}
                    <div className="relative group overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-white p-6 sm:p-8 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Target className="w-24 h-24 text-indigo-600 -mr-8 -mt-8 rotate-12" />
                        </div>
                        <h4 className="text-xl font-bold text-indigo-900 mb-4 flex items-center">
                            <Target className="w-6 h-6 mr-3 text-indigo-600" />
                            Executive Overview
                        </h4>
                        <div className="prose prose-indigo max-w-none">
                            <p className="text-gray-700 leading-relaxed text-base md:text-lg font-medium italic border-l-4 border-indigo-200 pl-4 py-1">
                                {parsedData.executiveSummary}
                            </p>
                        </div>
                    </div>

                    {/* Stats Table Section */}
                    {hasStats && (
                      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                        <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h4 className="text-lg font-bold text-gray-800 flex items-center">
                            <Activity className="w-5 h-5 mr-2 text-blue-600" />
                            Portfolio Statistical Table
                          </h4>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                            Performance Insights
                          </span>
                        </div>
                        <div className="p-0 sm:p-4">
                          <div className="overflow-x-auto custom-scrollbar">
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="bg-gray-50/80">
                                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Group</th>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Metric</th>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Latest</th>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Fail 2m</th>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Fail 3m</th>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider text-center">A3s</th>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Achieve %</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 bg-white">
                                {groupPerformanceTableData.map(row => {
                                  const isAtRisk = row.fail2 || row.fail3;

                                  return (
                                    <tr key={row.metricId} className="hover:bg-gray-50/50 transition-colors">
                                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{row.groupName}</td>
                                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.metricName}</td>
                                      <td className="px-4 py-3 text-center">
                                        {row.latestMet === null || !row.latestActual ? (
                                          <span className="text-gray-300">—</span>
                                        ) : (
                                          <span className={clsx(
                                            "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border shadow-sm",
                                            row.latestMet === false
                                              ? "bg-red-50 text-red-700 border-red-200"
                                              : "bg-green-50 text-green-700 border-green-200"
                                          )}>
                                            {row.latestActual}
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        {row.fail2 ? (
                                          <div className="flex justify-center">
                                            <span className="flex items-center px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                              FAIL
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="text-gray-300">—</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        {row.fail3 ? (
                                          <div className="flex justify-center">
                                            <span className="flex items-center px-2 py-1 rounded-lg text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 animate-pulse">
                                              CRITICAL
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="text-gray-300">—</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        {isAtRisk ? (
                                          <div className="flex justify-center">
                                            {row.linkedA3Count === 0 ? (
                                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 ring-2 ring-red-50 ring-offset-1">
                                                0
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200 ring-2 ring-green-50 ring-offset-1">
                                                {row.linkedA3Count}
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-gray-300">—</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        {row.achievementRate != null ? (
                                          <span className={clsx(
                                            "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border",
                                            row.achievementRate < (2 / 3) * 100
                                              ? "bg-red-50 text-red-700 border-red-200"
                                              : "bg-green-50 text-green-700 border-green-200"
                                          )}>
                                            {row.achievementRate.toFixed(0)}%
                                          </span>
                                        ) : (
                                          <span className="text-gray-300">—</span>
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

                    {/* A3 Summary Card */}
                    {parsedData.a3Summary && parsedData.a3Summary.trim() !== '' && (
                      <div className="bg-gradient-to-br from-blue-50 via-white to-white p-6 sm:p-8 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-all">
                        <h4 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                          <Sparkles className="w-6 h-6 mr-3 text-blue-600" />
                          A3 Problem Solving Summary
                        </h4>
                        <p className="text-gray-700 leading-relaxed text-base">
                          {parsedData.a3Summary}
                        </p>
                      </div>
                    )}

                    {/* Areas of Concern & Suggestions */}
                    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-red-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16 opacity-50" />
                        
                        <h4 className="text-xl font-bold text-red-900 mb-6 flex items-center relative z-10">
                            <AlertTriangle className="w-6 h-6 mr-3 text-red-600" />
                            Areas of Concern & Recommendations
                        </h4>
                        
                        <div className="grid grid-cols-1 gap-6 relative z-10">
                            {parsedData.areasOfConcern.map((area, idx) => (
                                <div key={idx} className="group bg-white p-5 rounded-xl border border-red-100 shadow-sm hover:border-red-200 hover:shadow-md transition-all duration-200">
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                        <div className="flex items-center">
                                            <div className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse" />
                                            <span className="text-base font-bold text-gray-900">{area.metricName}</span>
                                        </div>
                                        <span className="text-[10px] font-bold tracking-wider uppercase text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                            {area.groupName}
                                        </span>
                                    </div>
                                    <div className="bg-red-50/50 p-3 rounded-lg border border-red-50 mb-4">
                                        <p className="text-sm text-red-700 font-semibold leading-relaxed">
                                            {area.issue}
                                        </p>
                                    </div>
                                    <div className="flex items-start text-sm text-gray-600 bg-emerald-50/30 p-4 rounded-xl border border-emerald-100/50">
                                        <div className="bg-emerald-100 rounded-full p-1 mr-3 flex-shrink-0 mt-0.5">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-emerald-800 uppercase tracking-tight block mb-1">Recommendation</span>
                                            <p className="italic leading-relaxed text-gray-700">{area.suggestion}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {parsedData.areasOfConcern.length === 0 && (
                                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-50" />
                                    <p className="text-gray-500 font-medium">No major areas of concern identified. Keep up the good work!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : content ? (
                // Fallback for non-JSON content or errors
                <div className="max-w-4xl mx-auto py-8">
                  <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm prose prose-indigo max-w-none prose-headings:text-indigo-900 prose-a:text-indigo-600">
                      <MarkdownRenderer content={content} />
                  </div>
                </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="bg-gray-50/80 backdrop-blur-sm px-4 py-4 sm:px-8 flex flex-col sm:flex-row-reverse gap-3 border-t border-gray-200 w-full flex-shrink-0">
            <button
              type="button"
              className={clsx(
                "inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm active:scale-95",
                isLoading || !content
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md ring-1 ring-indigo-600 ring-offset-2 hover:ring-indigo-700"
              )}
              onClick={handleDownload}
              disabled={isLoading || !content}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </button>
            <button
              type="button"
              className={clsx(
                "inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95",
                isLoading || !content
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm"
              )}
              onClick={handleCopy}
              disabled={isLoading || !content}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </button>
            <div className="hidden sm:flex flex-1 items-center text-[11px] text-gray-400 italic">
              <Sparkles className="w-3 h-3 mr-1 text-indigo-400" />
              AI-generated summary based on workspace data
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
