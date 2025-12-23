import{c as v,Y as T,O as e,S as p,Q as g,X as M,aj as O}from"./index-C-gOILTS.js";import{M as P}from"./MarkdownRenderer-DwvINKqK.js";import{a as b,A as y,T as R}from"./target-DQ_8Z0Vi.js";/**
 * @license lucide-react v0.330.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const D=v("ArrowRight",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]]);/**
 * @license lucide-react v0.330.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const E=v("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]]),U=({isOpen:j,onClose:f,content:o,isLoading:c,onHideWhileLoading:w})=>{const u=T();if(!j)return null;let r=null,m=!1;try{if(o&&!c){const s=o.replace(/```json/g,"").replace(/```/g,"").trim();r=JSON.parse(s),r&&r.executiveSummary&&Array.isArray(r.performanceGroups)&&(m=!0)}}catch{m=!1}const N=()=>{if(m&&r){let s=`Executive Summary:
${r.executiveSummary}

`;r.a3Summary&&r.a3Summary.trim()!==""&&(s+=`A3 Problem Solving Summary:
${r.a3Summary}

`),s+=`Performance Analysis:
`,r.performanceGroups.forEach(a=>{s+=`
Group: ${a.groupName}
`,a.metrics.forEach(t=>{const i=t.trendAnalysis&&t.trendAnalysis.trim()!==""?` | Trend: ${t.trendAnalysis}`:"";s+=`- ${t.name}: ${t.latestPerformance}${i}
`})}),s+=`
Areas of Concern & Recommendations:
`,r.areasOfConcern.forEach(a=>{s+=`- ${a.metricName} (${a.groupName}): ${a.issue}
  Suggestion: ${a.suggestion}
`}),navigator.clipboard.writeText(s)}else navigator.clipboard.writeText(o);u.success("Summary copied to clipboard!")},k=()=>{const s=x=>x.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");let a="";if(m&&r){const x=s(r.executiveSummary),S=r.a3Summary&&r.a3Summary.trim()!==""?`<section class="card card-a3">
  <h2 class="card-title">A3 Problem Solving Summary</h2>
  <p>${s(r.a3Summary)}</p>
</section>`:"",A=r.performanceGroups.map(n=>{const C=n.metrics.map(l=>`<div class="metric-row">
  <span class="metric-name">${s(l.name)}</span>
  <span class="metric-value">${s(l.latestPerformance)}</span>
</div>`).join(""),h=n.metrics.filter(l=>l.trendAnalysis&&l.trendAnalysis.trim()!==""),z=h.length>0?h.map(l=>`<div class="metric-row">
  <span class="metric-name">${s(l.name)}</span>
  <span class="metric-value">${s(l.trendAnalysis||"")}</span>
</div>`).join(""):"";return`<div class="group-column">
  <h4 class="group-title">${s(n.groupName)}</h4>
  <div class="metrics-list">
    ${C}
  </div>
  <div class="metrics-trend-list">
    ${z||'<p class="empty-text">No consecutive failing metrics identified.</p>'}
  </div>
</div>`}).join(""),$=r.areasOfConcern.length>0?r.areasOfConcern.map(n=>`<div class="concern-card">
  <div class="concern-header">
    <span class="concern-metric">${s(n.metricName)}</span>
    <span class="concern-group">${s(n.groupName)}</span>
  </div>
  <p class="concern-issue">${s(n.issue)}</p>
  <p class="concern-suggestion">${s(n.suggestion)}</p>
</div>`).join(""):'<p class="empty-text">No major areas of concern identified. Keep up the good work!</p>';a=`<!doctype html>
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
          <span>Performance Analysis</span>
        </div>
      </div>
    </header>

    <section class="card card-executive">
      <h2 class="card-title">Executive Overview</h2>
      <p>${x}</p>
    </section>

    ${S}

    <section class="card">
      <h2 class="card-title">Performance Analysis</h2>
      <div class="grid-2">
        ${A}
      </div>
    </section>

    <section class="card card-concerns">
      <h2 class="card-title">Areas of Concern & Recommendations</h2>
      ${$}
    </section>
  </div>
</body>
</html>`}else a=`<!doctype html>
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
  <div class="card">${s(o)}</div>
</body>
</html>`;const t=new Blob([a],{type:"text/html;charset=utf-8"}),i=URL.createObjectURL(t),d=document.createElement("a");d.href=i,d.download=`metric_bowler_summary_${new Date().toISOString().split("T")[0]}.html`,document.body.appendChild(d),d.click(),document.body.removeChild(d),URL.revokeObjectURL(i),u.success("HTML downloaded!")};return e.jsx("div",{className:"fixed inset-0 z-[70] overflow-y-auto","aria-labelledby":"modal-title",role:"dialog","aria-modal":"true",children:e.jsxs("div",{className:"flex items-center justify-center min-h-screen px-4 py-6 text-center sm:block sm:p-0",children:[e.jsx("div",{className:"fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity","aria-hidden":"true",onClick:f}),e.jsx("span",{className:"hidden sm:inline-block sm:align-middle sm:h-screen","aria-hidden":"true",children:"​"}),e.jsxs("div",{className:"inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-[75vw] sm:w-full",children:[e.jsxs("div",{className:"bg-gradient-to-r from-indigo-50 via-white to-white px-4 py-4 sm:px-6 border-b border-indigo-100 flex justify-between items-center flex-shrink-0",children:[e.jsxs("div",{className:"flex items-center",children:[e.jsx("div",{className:"flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 shadow-sm mr-4",children:e.jsx(p,{className:"h-5 w-5 text-indigo-600"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg leading-6 font-bold text-gray-900",id:"modal-title",children:"Smart Summary & Insights"}),e.jsx("div",{className:"flex items-center mt-1 space-x-3 text-xs font-medium text-gray-500",children:e.jsxs("span",{className:"flex items-center bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100",children:[e.jsx(g,{className:"w-3 h-3 mr-1"})," Performance Analysis"]})})]})]}),e.jsxs("div",{className:"flex items-center space-x-2",children:[c&&e.jsx("button",{onClick:w,className:"inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border border-indigo-100 text-indigo-600 bg-white hover:bg-indigo-50 transition-colors",children:"Continue working"}),e.jsxs("button",{onClick:f,className:"bg-white rounded-md p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none transition-all",children:[e.jsx("span",{className:"sr-only",children:"Close"}),e.jsx(M,{className:"h-5 w-5"})]})]})]}),e.jsx("div",{className:"px-4 py-5 sm:p-6 bg-white overflow-y-auto custom-scrollbar max-h-[75vh]",children:c?e.jsxs("div",{className:"flex flex-col items-center justify-center h-full py-16 space-y-8",children:[e.jsxs("div",{className:"relative w-32 h-32",children:[e.jsx("div",{className:"absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 opacity-30 blur-sm"}),e.jsx("div",{className:"absolute inset-3 rounded-full border-2 border-indigo-200 border-dashed animate-spin"}),e.jsx("div",{className:"absolute inset-6 rounded-full bg-white flex items-center justify-center shadow-md",children:e.jsx(p,{className:"w-7 h-7 text-indigo-600 animate-pulse"})}),e.jsxs("div",{className:"absolute -bottom-3 left-1/2 -translate-x-1/2 flex space-x-1",children:[e.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"}),e.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce",style:{animationDelay:"0.15s"}}),e.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce",style:{animationDelay:"0.3s"}})]})]}),e.jsxs("div",{className:"text-center space-y-2",children:[e.jsx("h4",{className:"text-lg font-medium text-gray-900",children:"Crafting your AI summary"}),e.jsx("p",{className:"text-gray-500 text-sm max-w-xs mx-auto",children:"Analyzing metrics, trends, and A3 cases to surface the most important insights."})]}),e.jsxs("div",{className:"flex items-center space-x-4 text-xs text-gray-400",children:[e.jsxs("div",{className:"flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-50 border border-gray-100 animate-pulse",children:[e.jsx(b,{className:"w-3 h-3 text-indigo-500"}),e.jsx("span",{children:"Scanning metrics"})]}),e.jsxs("div",{className:"flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-50 border border-gray-100 animate-pulse",style:{animationDelay:"0.15s"},children:[e.jsx(g,{className:"w-3 h-3 text-purple-500"}),e.jsx("span",{children:"Finding trends"})]}),e.jsxs("div",{className:"flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-50 border border-gray-100 animate-pulse",style:{animationDelay:"0.3s"},children:[e.jsx(y,{className:"w-3 h-3 text-red-500"}),e.jsx("span",{children:"Highlighting risks"})]})]})]}):m&&r?e.jsxs("div",{className:"space-y-8",children:[e.jsxs("div",{className:"bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl border border-indigo-100 shadow-sm",children:[e.jsxs("h4",{className:"text-lg font-semibold text-indigo-900 mb-3 flex items-center",children:[e.jsx(R,{className:"w-5 h-5 mr-2 text-indigo-600"}),"Executive Overview"]}),e.jsx("p",{className:"text-gray-700 leading-relaxed text-sm md:text-base",children:r.executiveSummary})]}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-6",children:[e.jsxs("div",{className:"bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden",children:[e.jsx("div",{className:"bg-gray-50 px-4 py-3 border-b border-gray-200",children:e.jsxs("h4",{className:"text-base font-semibold text-gray-800 flex items-center",children:[e.jsx(b,{className:"w-4 h-4 mr-2 text-blue-600"}),"Latest Month Performance"]})}),e.jsx("div",{className:"p-4 space-y-6",children:r.performanceGroups.map((s,a)=>e.jsxs("div",{className:"space-y-2",children:[e.jsx("h5",{className:"text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-1",children:s.groupName}),e.jsx("div",{className:"space-y-2",children:s.metrics.map((t,i)=>e.jsxs("div",{className:"flex justify-between items-center text-sm",children:[e.jsx("span",{className:"font-medium text-gray-700",children:t.name}),e.jsx("span",{className:"text-gray-600 bg-gray-50 px-2 py-1 rounded-md text-xs",children:t.latestPerformance})]},i))})]},a))})]}),e.jsxs("div",{className:"bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden",children:[e.jsx("div",{className:"bg-gray-50 px-4 py-3 border-b border-gray-200",children:e.jsxs("h4",{className:"text-base font-semibold text-gray-800 flex items-center",children:[e.jsx(g,{className:"w-4 h-4 mr-2 text-purple-600"}),"Consecutive Failing Trends"]})}),e.jsxs("div",{className:"p-4 space-y-6",children:[r.performanceGroups.map((s,a)=>{const t=s.metrics.filter(i=>i.trendAnalysis&&i.trendAnalysis.trim()!=="");return t.length===0?null:e.jsxs("div",{className:"space-y-2",children:[e.jsx("h5",{className:"text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-1",children:s.groupName}),e.jsx("div",{className:"space-y-2",children:t.map((i,d)=>e.jsxs("div",{className:"flex justify-between items-center text-sm",children:[e.jsx("span",{className:"font-medium text-gray-700",children:i.name}),e.jsx("span",{className:"text-gray-600 bg-gray-50 px-2 py-1 rounded-md text-xs",children:i.trendAnalysis})]},d))})]},a)}),r.performanceGroups.every(s=>s.metrics.every(a=>!a.trendAnalysis||a.trendAnalysis.trim()===""))&&e.jsx("p",{className:"text-sm text-gray-500 italic text-center py-4",children:"No consecutive failing metrics identified."})]})]})]}),r.a3Summary&&r.a3Summary.trim()!==""&&e.jsxs("div",{className:"bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100 shadow-sm",children:[e.jsxs("h4",{className:"text-lg font-semibold text-blue-900 mb-3 flex items-center",children:[e.jsx(p,{className:"w-5 h-5 mr-2 text-blue-600"}),"A3 Problem Solving Summary"]}),e.jsx("p",{className:"text-gray-700 leading-relaxed text-sm md:text-base",children:r.a3Summary})]}),e.jsxs("div",{className:"bg-red-50/30 p-6 rounded-xl border border-red-100",children:[e.jsxs("h4",{className:"text-lg font-semibold text-red-900 mb-4 flex items-center",children:[e.jsx(y,{className:"w-5 h-5 mr-2 text-red-600"}),"Areas of Concern & Recommendations"]}),e.jsxs("div",{className:"grid grid-cols-1 gap-4",children:[r.areasOfConcern.map((s,a)=>e.jsxs("div",{className:"bg-white p-4 rounded-lg border border-red-100 shadow-sm",children:[e.jsxs("div",{className:"flex items-center mb-2",children:[e.jsx("span",{className:"text-sm font-bold text-gray-900 mr-2",children:s.metricName}),e.jsx("span",{className:"text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full",children:s.groupName})]}),e.jsxs("p",{className:"text-sm text-red-700 mb-2 font-medium",children:[e.jsx("span",{className:"mr-1",children:"⚠️"})," ",s.issue]}),e.jsxs("div",{className:"flex items-start text-sm text-gray-600 bg-gray-50 p-3 rounded-md",children:[e.jsx(D,{className:"w-4 h-4 mr-2 text-green-600 flex-shrink-0 mt-0.5"}),e.jsx("p",{className:"italic",children:s.suggestion})]})]},a)),r.areasOfConcern.length===0&&e.jsx("p",{className:"text-sm text-gray-500 italic",children:"No major areas of concern identified. Keep up the good work!"})]})]})]}):e.jsx("div",{className:"prose prose-sm max-w-none prose-indigo prose-headings:text-indigo-900 prose-a:text-indigo-600",children:e.jsx(P,{content:o})})}),e.jsxs("div",{className:"bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200 w-full",children:[e.jsxs("button",{type:"button",className:"w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors",onClick:k,disabled:c||!o,children:[e.jsx(O,{className:"w-4 h-4 mr-2"}),"Download HTML"]}),e.jsxs("button",{type:"button",className:"mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors",onClick:N,disabled:c||!o,children:[e.jsx(E,{className:"w-4 h-4 mr-2"}),"Copy to Clipboard"]})]})]})]})})};export{U as SummaryModal};
