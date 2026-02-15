import{c as I,_ as O,O as e,S as m,U as v,X as T,Q as j,d as p,aX as M}from"./index-CQJl7MZx.js";import{M as L}from"./MarkdownRenderer-Cpny88eu.js";import{A as w}from"./alert-triangle-BG12O7zH.js";import{T as N}from"./target-CHHDsqNv.js";import{C as k}from"./check-circle-2-BPyXZY0Z.js";/**
 * @license lucide-react v0.330.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const F=I("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]]),G=({isOpen:C,onClose:u,content:i,isLoading:n,onHideWhileLoading:A,groupPerformanceTableData:d})=>{const b=O();if(!C)return null;let a=null,o=!1;try{if(i&&!n){const t=i.replace(/```json/g,"").replace(/```/g,"").trim();a=JSON.parse(t),a&&a.executiveSummary&&Array.isArray(a.areasOfConcern)&&(o=!0)}}catch{o=!1}const y=d.length>0,S=()=>{if(o&&a){let t=`Executive Overview:
${a.executiveSummary}

`;a.a3Summary&&a.a3Summary.trim()!==""&&(t+=`A3 Problem Solving Summary:
${a.a3Summary}

`),y&&(t+=`Portfolio Statistical Table:
`,t+=`Group | Metric | Latest month | Last 2 months | Last 3 months | Linked A3s | Overall target achieving %
`,t+=`----- | ------ | ------------ | ------------- | ------------- | ---------- | --------------------------
`,d.forEach(s=>{const g=s.latestMet===null||!s.latestActual?"—":s.latestActual,x=s.fail2?"Failing":"—",l=s.fail3?"Failing":"—",h=s.fail2||s.fail3?s.linkedA3Count===0?"0":String(s.linkedA3Count):"—",f=s.achievementRate!=null?`${s.achievementRate.toFixed(0)}%`:"—";t+=`${s.groupName} | ${s.metricName} | ${g} | ${x} | ${l} | ${h} | ${f}
`}),t+=`
`),t+=`Areas of Concern & Recommendations:
`,a.areasOfConcern.forEach(s=>{t+=`- ${s.metricName} (${s.groupName}): ${s.issue}
  Suggestion: ${s.suggestion}
`}),navigator.clipboard.writeText(t)}else navigator.clipboard.writeText(i);b.success("Summary copied to clipboard!")},$=()=>{const t=c=>c.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");let s="";if(o&&a){const c=t(a.executiveSummary),h=a.a3Summary&&a.a3Summary.trim()!==""?`<section class="card card-a3">
  <h2 class="card-title">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="title-icon"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
    A3 Problem Solving Summary
  </h2>
  <p class="content-text">${t(a.a3Summary)}</p>
</section>`:"",f=d.length>0?`<section class="card card-stats">
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
        ${d.map(r=>{const z=r.fail2||r.fail3;return`<tr>
          <td class="font-medium">${t(r.groupName)}</td>
          <td class="text-muted">${t(r.metricName)}</td>
          <td class="text-center">${r.latestMet===null||!r.latestActual?'<span class="empty-val">—</span>':`<span class="status-pill ${r.latestMet===!1?"status-fail":"status-ok"}">${t(r.latestActual)}</span>`}</td>
          <td class="text-center">${r.fail2?'<span class="status-badge status-warn">FAIL</span>':'<span class="empty-val">—</span>'}</td>
          <td class="text-center">${r.fail3?'<span class="status-badge status-fail">CRITICAL</span>':'<span class="empty-val">—</span>'}</td>
          <td class="text-center">${z?`<span class="circle-badge ${r.linkedA3Count===0?"circle-badge-fail":"circle-badge-ok"}">${r.linkedA3Count}</span>`:'<span class="empty-val">—</span>'}</td>
          <td class="text-right">${r.achievementRate!=null?`<span class="status-pill ${r.achievementRate<2/3*100?"status-fail":"status-ok"}">${r.achievementRate.toFixed(0)}%</span>`:'<span class="empty-val">—</span>'}</td>
        </tr>`}).join("")}
      </tbody>
    </table>
  </div>
</section>`:"",R=a.areasOfConcern.length>0?a.areasOfConcern.map(r=>`<div class="concern-card">
  <div class="concern-header">
    <span class="concern-metric">${t(r.metricName)}</span>
    <span class="concern-group">${t(r.groupName)}</span>
  </div>
  <div class="concern-body">
    <p class="concern-issue">
      <span class="concern-icon">⚠️</span>
      ${t(r.issue)}
    </p>
    <div class="concern-suggestion">
      <div class="suggestion-header">RECOMMENDATION</div>
      <p>${t(r.suggestion)}</p>
    </div>
  </div>
</div>`).join(""):'<div class="empty-state">No major areas of concern identified. Keep up the good work!</div>';s=`<!doctype html>
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
      <p class="executive-text">${c}</p>
    </section>

    ${f}

    ${h}

    <section class="card">
      <h2 class="card-title">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="title-icon"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        Areas of Concern & Recommendations
      </h2>
      ${R}
    </section>
    
    <footer class="footer">
      Generated on ${new Date().toLocaleDateString()} by A3 Bowler AI • Workspace Insights Report
    </footer>
  </div>
</body>
</html>`}else s=`<!doctype html>
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
  <div class="card">${t(i)}</div>
</body>
</html>`;const g=new Blob([s],{type:"text/html;charset=utf-8"}),x=URL.createObjectURL(g),l=document.createElement("a");l.href=x,l.download=`a3_bowler_summary_${new Date().toISOString().split("T")[0]}.html`,document.body.appendChild(l),l.click(),document.body.removeChild(l),URL.revokeObjectURL(x),b.success("Professional report downloaded successfully!")};return e.jsx("div",{className:"fixed inset-0 z-[70] overflow-y-auto","aria-labelledby":"modal-title",role:"dialog","aria-modal":"true",children:e.jsxs("div",{className:"flex items-stretch min-h-screen text-center",children:[e.jsx("div",{className:"fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity","aria-hidden":"true",onClick:u}),e.jsx("span",{className:"hidden sm:inline-block sm:align-middle sm:h-screen","aria-hidden":"true",children:"​"}),e.jsxs("div",{className:"inline-block align-bottom bg-white text-left overflow-hidden shadow-xl transform transition-all w-full h-screen sm:align-middle sm:max-w-full sm:w-full flex flex-col",children:[e.jsxs("div",{className:"bg-gradient-to-r from-indigo-50 via-white to-white px-4 py-4 sm:px-6 border-b border-indigo-100 flex justify-between items-center flex-shrink-0",children:[e.jsxs("div",{className:"flex items-center",children:[e.jsx("div",{className:"flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 shadow-sm mr-4",children:e.jsx(m,{className:"h-5 w-5 text-indigo-600"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg leading-6 font-bold text-gray-900",id:"modal-title",children:"Smart Summary & Insights"}),e.jsx("div",{className:"flex items-center mt-1 space-x-3 text-xs font-medium text-gray-500",children:e.jsxs("span",{className:"flex items-center bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100",children:[e.jsx(v,{className:"w-3 h-3 mr-1"})," Consecutive Failing Metrics"]})})]})]}),e.jsxs("div",{className:"flex items-center space-x-2",children:[n&&e.jsx("button",{onClick:A,className:"inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border border-indigo-100 text-indigo-600 bg-white hover:bg-indigo-50 transition-colors",children:"Continue working"}),e.jsxs("button",{onClick:u,className:"bg-white rounded-md p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none transition-all",children:[e.jsx("span",{className:"sr-only",children:"Close"}),e.jsx(T,{className:"h-5 w-5"})]})]})]}),e.jsx("div",{className:"px-4 py-5 sm:p-8 bg-white overflow-y-auto custom-scrollbar flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500",children:n?e.jsxs("div",{className:"flex flex-col items-center justify-center h-full py-16 space-y-8",children:[e.jsxs("div",{className:"relative w-32 h-32",children:[e.jsx("div",{className:"absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 opacity-30 blur-sm"}),e.jsx("div",{className:"absolute inset-3 rounded-full border-2 border-indigo-200 border-dashed animate-spin"}),e.jsx("div",{className:"absolute inset-6 rounded-full bg-white flex items-center justify-center shadow-md",children:e.jsx(m,{className:"w-7 h-7 text-indigo-600 animate-pulse"})}),e.jsxs("div",{className:"absolute -bottom-3 left-1/2 -translate-x-1/2 flex space-x-1",children:[e.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"}),e.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce",style:{animationDelay:"0.15s"}}),e.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce",style:{animationDelay:"0.3s"}})]})]}),e.jsxs("div",{className:"text-center space-y-2",children:[e.jsx("h4",{className:"text-lg font-medium text-gray-900",children:"Crafting your AI summary"}),e.jsx("p",{className:"text-gray-500 text-sm max-w-xs mx-auto",children:"Analyzing metrics, trends, and A3 cases to surface the most important insights."})]}),e.jsxs("div",{className:"flex items-center space-x-4 text-xs text-gray-400",children:[e.jsxs("div",{className:"flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-50 border border-gray-100 animate-pulse",children:[e.jsx(j,{className:"w-3 h-3 text-indigo-500"}),e.jsx("span",{children:"Scanning metrics"})]}),e.jsxs("div",{className:"flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-50 border border-gray-100 animate-pulse",style:{animationDelay:"0.15s"},children:[e.jsx(v,{className:"w-3 h-3 text-purple-500"}),e.jsx("span",{children:"Finding trends"})]}),e.jsxs("div",{className:"flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-50 border border-gray-100 animate-pulse",style:{animationDelay:"0.3s"},children:[e.jsx(w,{className:"w-3 h-3 text-red-500"}),e.jsx("span",{children:"Highlighting risks"})]})]})]}):o&&a?e.jsxs("div",{className:"space-y-10 max-w-5xl mx-auto",children:[e.jsxs("div",{className:"relative group overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-white p-6 sm:p-8 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300",children:[e.jsx("div",{className:"absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity",children:e.jsx(N,{className:"w-24 h-24 text-indigo-600 -mr-8 -mt-8 rotate-12"})}),e.jsxs("h4",{className:"text-xl font-bold text-indigo-900 mb-4 flex items-center",children:[e.jsx(N,{className:"w-6 h-6 mr-3 text-indigo-600"}),"Executive Overview"]}),e.jsx("div",{className:"prose prose-indigo max-w-none",children:e.jsx("p",{className:"text-gray-700 leading-relaxed text-base md:text-lg font-medium italic border-l-4 border-indigo-200 pl-4 py-1",children:a.executiveSummary})})]}),y&&e.jsxs("div",{className:"bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md",children:[e.jsxs("div",{className:"bg-gray-50/50 px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2",children:[e.jsxs("h4",{className:"text-lg font-bold text-gray-800 flex items-center",children:[e.jsx(j,{className:"w-5 h-5 mr-2 text-blue-600"}),"Portfolio Statistical Table"]}),e.jsx("span",{className:"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100",children:"Performance Insights"})]}),e.jsx("div",{className:"p-0 sm:p-4",children:e.jsx("div",{className:"overflow-x-auto custom-scrollbar",children:e.jsxs("table",{className:"min-w-full text-sm",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"bg-gray-50/80",children:[e.jsx("th",{className:"px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider",children:"Group"}),e.jsx("th",{className:"px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider",children:"Metric"}),e.jsx("th",{className:"px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider text-center",children:"Latest"}),e.jsx("th",{className:"px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider text-center",children:"Fail 2m"}),e.jsx("th",{className:"px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider text-center",children:"Fail 3m"}),e.jsx("th",{className:"px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider text-center",children:"A3s"}),e.jsx("th",{className:"px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider text-right",children:"Achieve %"})]})}),e.jsx("tbody",{className:"divide-y divide-gray-100 bg-white",children:d.map(t=>{const s=t.fail2||t.fail3;return e.jsxs("tr",{className:"hover:bg-gray-50/50 transition-colors",children:[e.jsx("td",{className:"px-4 py-3 font-medium text-gray-900 whitespace-nowrap",children:t.groupName}),e.jsx("td",{className:"px-4 py-3 text-gray-600 whitespace-nowrap",children:t.metricName}),e.jsx("td",{className:"px-4 py-3 text-center",children:t.latestMet===null||!t.latestActual?e.jsx("span",{className:"text-gray-300",children:"—"}):e.jsx("span",{className:p("inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border shadow-sm",t.latestMet===!1?"bg-red-50 text-red-700 border-red-200":"bg-green-50 text-green-700 border-green-200"),children:t.latestActual})}),e.jsx("td",{className:"px-4 py-3 text-center",children:t.fail2?e.jsx("div",{className:"flex justify-center",children:e.jsx("span",{className:"flex items-center px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse",children:"FAIL"})}):e.jsx("span",{className:"text-gray-300",children:"—"})}),e.jsx("td",{className:"px-4 py-3 text-center",children:t.fail3?e.jsx("div",{className:"flex justify-center",children:e.jsx("span",{className:"flex items-center px-2 py-1 rounded-lg text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 animate-pulse",children:"CRITICAL"})}):e.jsx("span",{className:"text-gray-300",children:"—"})}),e.jsx("td",{className:"px-4 py-3 text-center",children:s?e.jsx("div",{className:"flex justify-center",children:t.linkedA3Count===0?e.jsx("span",{className:"inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 ring-2 ring-red-50 ring-offset-1",children:"0"}):e.jsx("span",{className:"inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200 ring-2 ring-green-50 ring-offset-1",children:t.linkedA3Count})}):e.jsx("span",{className:"text-gray-300",children:"—"})}),e.jsx("td",{className:"px-4 py-3 text-right",children:t.achievementRate!=null?e.jsxs("span",{className:p("inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border",t.achievementRate<2/3*100?"bg-red-50 text-red-700 border-red-200":"bg-green-50 text-green-700 border-green-200"),children:[t.achievementRate.toFixed(0),"%"]}):e.jsx("span",{className:"text-gray-300",children:"—"})})]},t.metricId)})})]})})})]}),a.a3Summary&&a.a3Summary.trim()!==""&&e.jsxs("div",{className:"bg-gradient-to-br from-blue-50 via-white to-white p-6 sm:p-8 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-all",children:[e.jsxs("h4",{className:"text-lg font-bold text-blue-900 mb-4 flex items-center",children:[e.jsx(m,{className:"w-6 h-6 mr-3 text-blue-600"}),"A3 Problem Solving Summary"]}),e.jsx("p",{className:"text-gray-700 leading-relaxed text-base",children:a.a3Summary})]}),e.jsxs("div",{className:"bg-white p-6 sm:p-8 rounded-2xl border border-red-100 shadow-sm relative overflow-hidden",children:[e.jsx("div",{className:"absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16 opacity-50"}),e.jsxs("h4",{className:"text-xl font-bold text-red-900 mb-6 flex items-center relative z-10",children:[e.jsx(w,{className:"w-6 h-6 mr-3 text-red-600"}),"Areas of Concern & Recommendations"]}),e.jsxs("div",{className:"grid grid-cols-1 gap-6 relative z-10",children:[a.areasOfConcern.map((t,s)=>e.jsxs("div",{className:"group bg-white p-5 rounded-xl border border-red-100 shadow-sm hover:border-red-200 hover:shadow-md transition-all duration-200",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2 mb-3",children:[e.jsxs("div",{className:"flex items-center",children:[e.jsx("div",{className:"w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"}),e.jsx("span",{className:"text-base font-bold text-gray-900",children:t.metricName})]}),e.jsx("span",{className:"text-[10px] font-bold tracking-wider uppercase text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100",children:t.groupName})]}),e.jsx("div",{className:"bg-red-50/50 p-3 rounded-lg border border-red-50 mb-4",children:e.jsx("p",{className:"text-sm text-red-700 font-semibold leading-relaxed",children:t.issue})}),e.jsxs("div",{className:"flex items-start text-sm text-gray-600 bg-emerald-50/30 p-4 rounded-xl border border-emerald-100/50",children:[e.jsx("div",{className:"bg-emerald-100 rounded-full p-1 mr-3 flex-shrink-0 mt-0.5",children:e.jsx(k,{className:"w-3.5 h-3.5 text-emerald-600"})}),e.jsxs("div",{children:[e.jsx("span",{className:"text-xs font-bold text-emerald-800 uppercase tracking-tight block mb-1",children:"Recommendation"}),e.jsx("p",{className:"italic leading-relaxed text-gray-700",children:t.suggestion})]})]})]},s)),a.areasOfConcern.length===0&&e.jsxs("div",{className:"text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200",children:[e.jsx(k,{className:"w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-50"}),e.jsx("p",{className:"text-gray-500 font-medium",children:"No major areas of concern identified. Keep up the good work!"})]})]})]})]}):i?e.jsx("div",{className:"max-w-4xl mx-auto py-8",children:e.jsx("div",{className:"bg-white p-8 rounded-2xl border border-gray-200 shadow-sm prose prose-indigo max-w-none prose-headings:text-indigo-900 prose-a:text-indigo-600",children:e.jsx(L,{content:i})})}):null}),e.jsxs("div",{className:"bg-gray-50/80 backdrop-blur-sm px-4 py-4 sm:px-8 flex flex-col sm:flex-row-reverse gap-3 border-t border-gray-200 w-full flex-shrink-0",children:[e.jsxs("button",{type:"button",className:p("inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm active:scale-95",n||!i?"bg-gray-200 text-gray-400 cursor-not-allowed":"bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md ring-1 ring-indigo-600 ring-offset-2 hover:ring-indigo-700"),onClick:$,disabled:n||!i,children:[e.jsx(M,{className:"w-4 h-4 mr-2"}),"Download Report"]}),e.jsxs("button",{type:"button",className:p("inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95",n||!i?"bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200":"bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm"),onClick:S,disabled:n||!i,children:[e.jsx(F,{className:"w-4 h-4 mr-2"}),"Copy to Clipboard"]}),e.jsxs("div",{className:"hidden sm:flex flex-1 items-center text-[11px] text-gray-400 italic",children:[e.jsx(m,{className:"w-3 h-3 mr-1 text-indigo-400"}),"AI-generated summary based on workspace data"]})]})]})]})})};export{G as SummaryModal};
