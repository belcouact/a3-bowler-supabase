import{c as ke,aE as Be,Y as Ue,W as We,r,O as e,X as Ge,aF as B,aG as qe,aH as Se}from"./index-ugvB8PSe.js";import{generateAIContext as Ze,generateComprehensiveSummary as Je}from"./aiService-BdGNG9_S.js";import{L as _,M as Ye}from"./mail-Bh1_yud7.js";import{C as Ve}from"./check-C2WmswQf.js";/**
 * @license lucide-react v0.330.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ke=ke("CreditCard",[["rect",{width:"20",height:"14",x:"2",y:"5",rx:"2",key:"ynyp8z"}],["line",{x1:"2",x2:"22",y1:"10",y2:"10",key:"1b3vmo"}]]);/**
 * @license lucide-react v0.330.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xe=ke("RefreshCw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]),st=({isOpen:u,onClose:U})=>{const{user:a,refreshUser:Q}=Be(),o=Ue(),{bowlers:W,a3Cases:D,selectedModel:Ne,dashboardSettings:f,setDashboardSettings:A,dashboardMarkdown:Ce,dashboardTitle:Ae,dashboardMindmaps:Me,activeMindmapId:Ee}=We(),[p,G]=r.useState("password"),[M,N]=r.useState(!1),[E,R]=r.useState(!1),[I,ee]=r.useState(!1),[te,se]=r.useState(!1),[q,ae]=r.useState(""),[Z,re]=r.useState(""),[le,ne]=r.useState(""),[oe,ie]=r.useState(""),[ce,de]=r.useState("China"),[me,ue]=r.useState("SZFTZ"),[fe,he]=r.useState("GBS"),[P,pe]=r.useState(!0),[j,J]=r.useState(""),[h,Y]=r.useState(""),[y,V]=r.useState(""),[K,Pe]=r.useState(""),[C,O]=r.useState(null),[S,be]=r.useState("weekly"),[F,xe]=r.useState(1),[$,ge]=r.useState(1),[z,ye]=r.useState("08:00"),[H,ve]=r.useState(!1),[L,we]=r.useState(!1),[x,je]=r.useState("scheduled");if(r.useEffect(()=>{a&&(ie(a.role||""),de(a.country||"China"),ue(a.plant||"SZFTZ"),he(a.team||"GBS"),pe(a.isPublicProfile!==void 0?a.isPublicProfile:!0))},[a,u]),r.useEffect(()=>{if(!u){ve(!1),we(!1);return}if(H)return;const t=f.emailSchedule;t&&((t.frequency==="weekly"||t.frequency==="monthly")&&be(t.frequency),typeof t.dayOfWeek=="number"&&xe(t.dayOfWeek),typeof t.dayOfMonth=="number"&&ge(t.dayOfMonth),t.timeOfDay&&ye(t.timeOfDay)),ve(!0)},[u,f.emailSchedule,H]),r.useEffect(()=>{if(!u||L)return;const t=f.emailDefaults||{};j||(typeof t.recipients=="string"&&t.recipients.trim()!==""?J(t.recipients):a&&a.email&&J(a.email)),!h&&typeof t.subject=="string"&&t.subject.trim()!==""&&Y(t.subject),we(!0)},[u,f,L,j,h,a]),r.useEffect(()=>{u&&H&&A(t=>({...t,emailSchedule:{frequency:S,dayOfWeek:S==="weekly"?F:void 0,dayOfMonth:S==="monthly"?$:void 0,timeOfDay:z}}))},[S,F,$,z,u,H]),r.useEffect(()=>{u&&L&&A(t=>({...t,emailDefaults:{...t.emailDefaults||{},recipients:j,subject:h}}))},[j,h,u,L,A]),r.useEffect(()=>{u&&(y||f.latestSummaryForEmail&&(V(f.latestSummaryForEmail),f.latestSummaryHtmlForEmail?O(f.latestSummaryHtmlForEmail):O(null)))},[u,f.latestSummaryForEmail,y]),r.useEffect(()=>{u&&(h||Y("Monthly A3 / Bowler Summary"))},[u,h]),!u)return null;const Fe=async()=>{if(Z!==le){o.error("New passwords don't match");return}if(!q){o.error("Please enter current password");return}N(!0);try{await Se.changePassword({username:a==null?void 0:a.username,oldPassword:q,newPassword:Z}),o.success("Password updated successfully"),ae(""),re(""),ne("")}catch(t){o.error(t.message||"Failed to update password")}finally{N(!1)}},$e=async()=>{N(!0);try{await Se.updateProfile({username:a==null?void 0:a.username,role:oe,profile:{country:ce,plant:me,team:fe,isPublic:P}}),o.success("Profile updated successfully");try{await Q()}catch(t){console.warn("Background refresh failed:",t)}}catch(t){o.error(t.message||"Failed to update profile")}finally{N(!1)}},Te=async()=>{N(!0);try{await Q(!0),o.success("Profile reloaded")}catch{o.error("Failed to reload profile")}finally{N(!1)}},De=async()=>{if(!a||!a.username){o.error("You must be logged in to cancel recurring emails");return}R(!0);try{const t={...f};"emailSchedule"in t&&delete t.emailSchedule,A(t),await B.saveData(W,D,a.username,Ce,Ae,Me,Ee,t),o.success("Recurring email schedule cancelled")}catch(t){o.error(t.message||"Failed to cancel recurring schedule")}finally{R(!1)}},Re=(t,l)=>{try{const d=t.replace(/```json/g,"").replace(/```/g,"").trim(),i=JSON.parse(d);if(!i||!i.executiveSummary)return t;let c=`Executive Overview:
${i.executiveSummary}

`;return i.a3Summary&&i.a3Summary.trim()!==""&&(c+=`A3 Problem Solving Summary:
${i.a3Summary}

`),l.length>0&&(c+=`Portfolio Statistical Table:
`,c+=`Group | Metric | Latest month | Last 2 months | Last 3 months | Linked A3s | Overall target achieving %
`,c+=`----- | ------ | ------------ | ------------- | ------------- | ---------- | --------------------------
`,l.forEach(n=>{const b=n.latestMet===null||!n.latestActual?"—":n.latestActual,v=n.fail2?"Failing":"—",w=n.fail3?"Failing":"—",s=n.fail2||n.fail3?n.linkedA3Count===0?"0":String(n.linkedA3Count):"—",k=n.achievementRate!=null?`${n.achievementRate.toFixed(0)}%`:"—";c+=`${n.groupName} | ${n.metricName} | ${b} | ${v} | ${w} | ${s} | ${k}
`}),c+=`
`),Array.isArray(i.areasOfConcern)&&i.areasOfConcern.length>0&&(c+=`Areas of Concern & Recommendations:
`,i.areasOfConcern.forEach(n=>{c+=`- ${n.metricName} (${n.groupName}): ${n.issue}
  Suggestion: ${n.suggestion}
`})),c}catch{return t}},X=t=>`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>A3 Summary Email</title>
</head>
<body>
  <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.6;">
    ${t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;").replace(/\r\n/g,`
`).replace(/\r/g,`
`).replace(/\n/g,"<br />")}
  </div>
</body>
</html>`,Ie=(t,l)=>{try{const d=t.replace(/```json/g,"").replace(/```/g,"").trim(),i=JSON.parse(d);if(!i||!i.executiveSummary||!Array.isArray(i.areasOfConcern))return"";const c=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"),n=c(i.executiveSummary),b=i.a3Summary&&i.a3Summary.trim()!==""?`<section class="card card-a3">
  <h2 class="card-title">A3 Problem Solving Summary</h2>
  <p>${c(i.a3Summary)}</p>
</section>`:"",v=l.length>0?`<section class="card card-stats">
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
        ${l.map(s=>`<tr>
          <td>${c(s.groupName)}</td>
          <td>${c(s.metricName)}</td>
          <td>${s.latestMet===null||!s.latestActual?"—":`<span class="status-pill ${s.latestMet===!1?"status-fail":"status-ok"}">${c(s.latestActual)}</span>`}</td>
          <td>${s.fail2?'<span class="status-pill status-warn"><span class="status-dot"></span>Failing</span>':"—"}</td>
          <td>${s.fail3?'<span class="status-pill status-fail"><span class="status-dot"></span>Failing</span>':"—"}</td>
          <td>${s.fail2||s.fail3?s.linkedA3Count===0?'<span class="circle-badge circle-badge-fail">0</span>':`<span class="circle-badge circle-badge-ok">${s.linkedA3Count}</span>`:"—"}</td>
          <td>${s.achievementRate!=null?`<span class="status-pill ${s.achievementRate<2/3*100?"status-fail":"status-ok"}">${s.achievementRate.toFixed(0)}%</span>`:"—"}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>
</section>`:"",w=i.areasOfConcern.length>0?i.areasOfConcern.map(s=>`<div class="concern-card">
  <div class="concern-header">
    <span class="concern-metric">${c(s.metricName)}</span>
    <span class="concern-group">${c(s.groupName)}</span>
  </div>
  <p class="concern-issue">${c(s.issue)}</p>
  <p class="concern-suggestion">${c(s.suggestion)}</p>
</div>`).join(""):'<p class="empty-text">No major areas of concern identified. Keep up the good work!</p>';return`<!doctype html>
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
      <p>${n}</p>
    </section>

    ${v}

    ${b}

    <section class="card card-concerns">
      <h2 class="card-title">Areas of Concern & Recommendations</h2>
      ${w}
    </section>
  </div>
</body>
</html>`}catch{return""}},Oe=async()=>{se(!0);try{const t=Ze(W,D),l=qe(W,D),d=l.filter(m=>m.fail2||m.fail3),c=`You are generating a one-click portfolio summary focused on improvement opportunities.

Use the pre-computed statistical snapshot below. Do not redo statistical calculations from raw data. Rely on this snapshot instead.

Consecutive failing metrics (derived from the integrated portfolio table):
${JSON.stringify(d.map(m=>{const s=D.filter(g=>(g.linkedMetricIds||[]).includes(m.metricId)),k=s.filter(g=>(g.status||"").trim().toLowerCase()==="completed").length,T=s.filter(g=>(g.status||"").trim().toLowerCase()!=="completed").length;return{groupName:m.groupName,metricName:m.metricName,metricId:m.metricId,latestMet:m.latestMet,fail2:m.fail2,fail3:m.fail3,achievementRate:m.achievementRate!=null?Number(m.achievementRate.toFixed(1)):null,linkedA3Total:s.length,linkedA3Completed:k,linkedA3Active:T}}),null,2)}

Definitions:
- latestMet: null = no data, true = met latest target, false = missed latest target.
- fail2: true if the metric missed its target for the latest 2 consecutive months.
- fail3: true if the metric missed its target for the latest 3 consecutive months.
- achievementRate: percentage of historical data points that met target.
- metricId: unique id of the metric (matches linkedMetricIds in A3 cases from context).
- linkedA3Total: total number of A3 cases linked to this metric.
- linkedA3Completed: number of linked A3s with status "Completed".
- linkedA3Active: number of linked A3s that are not completed.

Tasks:
1) Write "executiveSummary": a concise high-level snapshot of overall portfolio performance across metrics and A3 activity.
2) Write "a3Summary": an overview of the A3 problem-solving portfolio (key themes, progress, coverage, and where A3 work is effective or insufficient).
3) Build "areasOfConcern": each entry must correspond to one metric from the snapshot where fail2 or fail3 is true.
   - For each metric, write a rich, multi-sentence issue description that references consecutive failures, achievementRate, and any linked A3 activity.
   - For each metric, provide a detailed, action-oriented suggestion that can guide real improvement work (diagnosis, countermeasures, and follow-up).

Guidance for areasOfConcern:
- Prioritize metrics with fail3 = true, then fail2 = true.
- Use latestMet and achievementRate to describe severity and risk.
- Use metricId together with the A3 cases in the provided context to identify any A3s linked to each metric.
- When linkedA3Completed > 0, briefly assess whether performance appears to have improved since those A3s were completed and state whether the A3 work seems effective or not.
- When linkedA3Total = 0 or performance is still weak despite completed A3s, explicitly recommend the next A3 step (for example: start a new A3, extend or revise an existing A3, or move to follow-up/standardization).
- Focus on actionable, metric-specific improvement suggestions (avoid generic advice).
- Suggestions should reflect typical quality, process-improvement, and problem-solving practices.
- Each suggestion should describe concrete next actions, such as specific analyses to run, experiments or pilots to try, process changes to test, and how to monitor impact over the next 2–3 months.
- Do not output your own statistical tables or detailed numerical calculations in text; focus on narrative and actions.

Return the response in STRICT JSON format with the following structure:
{
  "executiveSummary": "A concise high-level performance snapshot.",
  "a3Summary": "Narrative summary of A3 cases and portfolio status.",
  "areasOfConcern": [
    {
      "metricName": "Metric Name",
      "groupName": "Group Name",
      "issue": "Why this metric is a concern (e.g., 'Missed target for 3 consecutive months with low overall achievement rate').",
      "suggestion": "Detailed, actionable, metric-specific improvement suggestion based on the pattern and context."
    }
  ]
}

Do not include any markdown formatting (like \`\`\`json). Just the raw JSON object.`,n=await Je(t,c,Ne),b=Re(n,l),v=Ie(n,l),w=v&&v.trim()!==""?v:X(b);V(b),O(w),A({...f,latestSummaryForEmail:b,latestSummaryHtmlForEmail:w}),o.success("AI summary generated")}catch(t){console.error("Generate summary error:",t),o.error(t.message||"Failed to generate summary")}finally{se(!1)}},ze=()=>{const t=new Date,[l,d]=z.split(":"),i=Number(l)||8,c=Number(d)||0;if(S==="weekly"){const s=new Date(t.getTime()),k=s.getDay(),T=F===7?0:F;s.setHours(i,c,0,0);let g=T-k;return(g<0||g===0&&s<=t)&&(g+=7),s.setDate(s.getDate()+g),s}const n=t.getFullYear(),b=t.getMonth(),v=new Date(n,b+1,0).getDate(),w=Math.min($,v);let m=new Date(n,b,w,i,c,0,0);if(m<=t){const s=new Date(n,b+1,1),k=new Date(s.getFullYear(),s.getMonth()+1,0).getDate(),T=Math.min($,k);m=new Date(s.getFullYear(),s.getMonth(),T,i,c,0,0)}return m},He=async()=>{const t=j.split(/[,\n]/).map(d=>d.trim()).filter(d=>d.length>0);if(t.length===0){o.error("Please enter at least one recipient email");return}if(!h.trim()){o.error("Please enter an email subject");return}let l=null;if(x==="scheduled")l=ze();else{if(!K){o.error("Please choose a send date and time");return}const d=new Date(K);if(Number.isNaN(d.getTime())){o.error("Please enter a valid date and time");return}l=d}if(x==="oneTime"&&!y.trim()){o.error("Please enter an email body or generate a summary");return}if(x==="scheduled"&&!(a!=null&&a.username)){o.error("You must be logged in to schedule recurring summary emails");return}R(!0);try{const d=(a==null?void 0:a.username)||void 0;if(x==="scheduled")await B.scheduleEmail({userId:d,recipients:t,subject:h.trim(),body:"",sendAt:l.toISOString(),mode:"autoSummary",aiModel:f.aiModel});else{const i=C&&C.trim()!==""?C:X(y.trim());await B.scheduleEmail({userId:d,recipients:t,subject:h.trim(),body:y.trim(),bodyHtml:i,sendAt:l.toISOString()})}o.success("Email scheduled successfully")}catch(d){o.error(d.message||"Failed to schedule email")}finally{R(!1)}},Le=async()=>{const t=j.split(/[,\n]/).map(l=>l.trim()).filter(l=>l.length>0);if(t.length===0){o.error("Please enter at least one recipient email");return}if(!h.trim()){o.error("Please enter an email subject");return}if(!y.trim()){o.error("Please enter an email body");return}ee(!0);try{const l=(a==null?void 0:a.username)||void 0,d=C&&C.trim()!==""?C:X(y.trim());await B.sendEmailNow({userId:l,recipients:t,subject:h.trim(),body:y.trim(),bodyHtml:d}),o.success("Email sent successfully")}catch(l){o.error(l.message||"Failed to send email")}finally{ee(!1)}};return e.jsx("div",{className:"fixed inset-0 z-[70] overflow-y-auto","aria-labelledby":"modal-title",role:"dialog","aria-modal":"true",children:e.jsxs("div",{className:"flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0",children:[e.jsx("div",{className:"fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity","aria-hidden":"true",onClick:U}),e.jsx("span",{className:"hidden sm:inline-block sm:align-middle sm:h-screen","aria-hidden":"true",children:"​"}),e.jsxs("div",{className:"inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full",children:[e.jsxs("div",{className:"bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200 flex justify-between items-center",children:[e.jsx("h3",{className:"text-lg leading-6 font-medium text-gray-900",id:"modal-title",children:"Account Settings"}),e.jsx("button",{onClick:U,className:"text-gray-400 hover:text-gray-500",children:e.jsx(Ge,{className:"h-5 w-5"})})]}),e.jsxs("div",{className:"flex border-b border-gray-200",children:[e.jsxs("button",{className:`flex-1 py-3 text-sm font-medium text-center flex items-center justify-center space-x-2 ${p==="password"?"border-b-2 border-blue-500 text-blue-600":"text-gray-500 hover:text-gray-700"}`,onClick:()=>G("password"),children:[e.jsx(_,{className:"w-4 h-4"}),e.jsx("span",{children:"Password"})]}),e.jsxs("button",{className:`flex-1 py-3 text-sm font-medium text-center flex items-center justify-center space-x-2 ${p==="profile"?"border-b-2 border-blue-500 text-blue-600":"text-gray-500 hover:text-gray-700"}`,onClick:()=>G("profile"),children:[e.jsx(Ke,{className:"w-4 h-4"}),e.jsx("span",{children:"Profile"})]}),e.jsxs("button",{className:`flex-1 py-3 text-sm font-medium text-center flex items-center justify-center space-x-2 ${p==="email"?"border-b-2 border-blue-500 text-blue-600":"text-gray-500 hover:text-gray-700"}`,onClick:()=>G("email"),children:[e.jsx(Ye,{className:"w-4 h-4"}),e.jsx("span",{children:"Email"})]})]}),e.jsxs("div",{className:"px-6 py-6",children:[p!=="email"&&e.jsxs("div",{className:"mb-6 flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-gray-500",children:"User: "}),e.jsx("span",{className:"font-semibold text-blue-600",children:a==null?void 0:a.username})]}),e.jsx("button",{onClick:Te,className:"p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors",title:"Reload Profile from Server",children:e.jsx(Xe,{className:`w-4 h-4 ${M?"animate-spin":""}`})})]}),p==="password"&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Current Password"}),e.jsxs("div",{className:"relative",children:[e.jsx(_,{className:"absolute left-3 top-2.5 h-4 w-4 text-gray-400"}),e.jsx("input",{type:"password",value:q,onChange:t=>ae(t.target.value),placeholder:"Enter current password",className:"pl-9 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"New Password"}),e.jsxs("div",{className:"relative",children:[e.jsx(_,{className:"absolute left-3 top-2.5 h-4 w-4 text-gray-400"}),e.jsx("input",{type:"password",value:Z,onChange:t=>re(t.target.value),placeholder:"Enter new password",className:"pl-9 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Confirm New Password"}),e.jsxs("div",{className:"relative",children:[e.jsx(Ve,{className:"absolute left-3 top-2.5 h-4 w-4 text-gray-400"}),e.jsx("input",{type:"password",value:le,onChange:t=>ne(t.target.value),placeholder:"Confirm new password",className:"pl-9 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]})]})]}),p==="profile"&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Role"}),e.jsx("input",{type:"text",value:oe,onChange:t=>ie(t.target.value),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Region"}),e.jsxs("select",{value:ce,onChange:t=>de(t.target.value),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border",children:[e.jsx("option",{value:"China",children:"China"}),e.jsx("option",{value:"US",children:"US"}),e.jsx("option",{value:"EMEA",children:"EMEA"}),e.jsx("option",{value:"APAC",children:"APAC"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Plant/Office"}),e.jsxs("select",{value:me,onChange:t=>ue(t.target.value),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border",children:[e.jsx("option",{value:"BJ",children:"BJ"}),e.jsx("option",{value:"SH",children:"SH"}),e.jsx("option",{value:"TW",children:"TW"}),e.jsx("option",{value:"SZFTZ",children:"SZFTZ"}),e.jsx("option",{value:"SZBAN",children:"SZBAN"}),e.jsx("option",{value:"EM1",children:"EM1"}),e.jsx("option",{value:"EM5",children:"EM5"}),e.jsx("option",{value:"LOV",children:"LOV"}),e.jsx("option",{value:"PU3",children:"PU3"})]})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Functional Team"}),e.jsxs("select",{value:fe,onChange:t=>he(t.target.value),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border",children:[e.jsx("option",{value:"Commercial",children:"Commercial"}),e.jsx("option",{value:"SC",children:"SC"}),e.jsx("option",{value:"Technical",children:"Technical"})]})]}),e.jsx("div",{className:"pt-2",children:e.jsxs("div",{className:"border border-gray-200 rounded-md p-4 flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-900",children:"Public Profile"}),e.jsx("p",{className:"text-xs text-gray-500",children:"Allow others to consolidate your bowlers"})]}),e.jsx("button",{type:"button",className:`${P?"bg-blue-600":"bg-gray-200"} relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`,role:"switch","aria-checked":P,onClick:()=>pe(!P),children:e.jsx("span",{className:`${P?"translate-x-5":"translate-x-0"} pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`})})]})})]}),p==="email"&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Recipients"}),e.jsx("textarea",{value:j,onChange:t=>J(t.target.value),rows:2,placeholder:"user1@example.com, user2@example.com",className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"}),e.jsx("p",{className:"mt-1 text-xs text-gray-400",children:"Separate multiple emails with commas or new lines."})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Subject"}),e.jsx("input",{type:"text",value:h,onChange:t=>Y(t.target.value),placeholder:"Monthly A3 / metric summary",className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]}),e.jsxs("div",{className:"mt-4 border rounded-md",children:[e.jsxs("div",{className:"flex text-xs font-medium border-b",children:[e.jsx("button",{type:"button",className:`flex-1 px-3 py-2 text-center ${x==="scheduled"?"bg-blue-50 text-blue-700 border-b-2 border-blue-500":"text-gray-500 hover:text-gray-700"}`,onClick:()=>je("scheduled"),children:"Scheduled (repeat)"}),e.jsx("button",{type:"button",className:`flex-1 px-3 py-2 text-center ${x==="oneTime"?"bg-blue-50 text-blue-700 border-b-2 border-blue-500":"text-gray-500 hover:text-gray-700"}`,onClick:()=>je("oneTime"),children:"One-time"})]}),e.jsxs("div",{className:"p-3 space-y-3",children:[x==="scheduled"&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Repeat"}),e.jsxs("select",{value:S,onChange:t=>be(t.target.value),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border",children:[e.jsx("option",{value:"weekly",children:"Every week"}),e.jsx("option",{value:"monthly",children:"Every month"})]})]}),e.jsx("div",{children:S==="weekly"?e.jsxs(e.Fragment,{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Day of Week"}),e.jsxs("select",{value:F,onChange:t=>xe(Number(t.target.value)),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border",children:[e.jsx("option",{value:1,children:"Monday"}),e.jsx("option",{value:2,children:"Tuesday"}),e.jsx("option",{value:3,children:"Wednesday"}),e.jsx("option",{value:4,children:"Thursday"}),e.jsx("option",{value:5,children:"Friday"}),e.jsx("option",{value:6,children:"Saturday"}),e.jsx("option",{value:7,children:"Sunday"})]})]}):e.jsxs(e.Fragment,{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Date of Month"}),e.jsx("select",{value:$,onChange:t=>ge(Number(t.target.value)),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border",children:Array.from({length:31},(t,l)=>l+1).map(t=>e.jsx("option",{value:t,children:t},t))})]})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Time"}),e.jsx("input",{type:"time",value:z,onChange:t=>ye(t.target.value),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"}),e.jsx("p",{className:"mt-1 text-xs text-gray-400",children:"Saved to dashboard settings for recurring email schedule. Next send time is calculated automatically."})]}),e.jsx("div",{className:"pt-2",children:e.jsx("button",{type:"button",className:"inline-flex items-center rounded-md border border-red-600 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed",onClick:De,disabled:E,children:"Cancel recurring emails"})})]}),x==="oneTime"&&e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Send At"}),e.jsx("input",{type:"datetime-local",value:K,onChange:t=>Pe(t.target.value),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Message"}),e.jsx("button",{type:"button",className:"text-xs px-2 py-1 rounded border border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed",onClick:Oe,disabled:te||E||I,children:te?"Generating…":"Generate summary"})]}),e.jsx("textarea",{value:y,onChange:t=>{V(t.target.value),O(null)},rows:4,placeholder:"Add the summary or message you want to email.",className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]})]})]})]})]})]}),e.jsxs("div",{className:"bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse",children:[p==="password"&&e.jsx("button",{type:"button",className:"w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm",onClick:Fe,disabled:M,children:M?"Updating...":"Update Password"}),p==="profile"&&e.jsx("button",{type:"button",className:"w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm",onClick:$e,disabled:M,children:M?"Saving...":"Save Profile"}),p==="email"&&e.jsxs(e.Fragment,{children:[e.jsx("button",{type:"button",className:"w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm",onClick:He,disabled:E||I,children:E?"Scheduling...":x==="scheduled"?"Schedule recurring email":"Schedule one-time email"}),x==="oneTime"&&e.jsx("button",{type:"button",className:"mt-3 w-full inline-flex justify-center rounded-md border border-blue-600 shadow-sm px-4 py-2 bg-white text-base font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm",onClick:Le,disabled:I||E,children:I?"Sending...":"Send Now"})]}),e.jsx("button",{type:"button",className:"mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm",onClick:U,children:p==="password"?"Cancel":"Close"})]})]})]})})};export{st as AccountSettingsModal};
