import{c as je,aE as De,Y as Re,W as Ie,r as a,O as e,X as Oe,aF as ze,aG as we,aH as Z}from"./index-CZVK4Mmm.js";import{generateAIContext as He,generateComprehensiveSummary as Le}from"./aiService-BdGNG9_S.js";import{L as J,M as Be}from"./mail-BqIdkYt8.js";import{C as Ue}from"./check-z7lxSzzX.js";/**
 * @license lucide-react v0.330.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const We=je("CreditCard",[["rect",{width:"20",height:"14",x:"2",y:"5",rx:"2",key:"ynyp8z"}],["line",{x1:"2",x2:"22",y1:"10",y2:"10",key:"1b3vmo"}]]);/**
 * @license lucide-react v0.330.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ge=je("RefreshCw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]),Ve=({isOpen:f,onClose:I})=>{const{user:r,refreshUser:Y}=De(),c=Re(),{bowlers:V,a3Cases:O,selectedModel:Se,dashboardSettings:h,setDashboardSettings:z}=Ie(),[p,H]=a.useState("password"),[C,k]=a.useState(!1),[E,K]=a.useState(!1),[$,X]=a.useState(!1),[_,Q]=a.useState(!1),[L,ee]=a.useState(""),[B,te]=a.useState(""),[se,ae]=a.useState(""),[re,le]=a.useState(""),[oe,ne]=a.useState("China"),[ie,ce]=a.useState("SZFTZ"),[de,me]=a.useState("GBS"),[A,ue]=a.useState(!0),[U,fe]=a.useState(""),[v,he]=a.useState(""),[g,W]=a.useState(""),[G,ke]=a.useState(""),[N,T]=a.useState(null),[j,pe]=a.useState("weekly"),[M,be]=a.useState(1),[P,xe]=a.useState(1),[D,ge]=a.useState("08:00"),[R,ye]=a.useState(!1),[b,ve]=a.useState("scheduled");if(a.useEffect(()=>{r&&(le(r.role||""),ne(r.country||"China"),ce(r.plant||"SZFTZ"),me(r.team||"GBS"),ue(r.isPublicProfile!==void 0?r.isPublicProfile:!0),r.email&&fe(r.email))},[r,f]),a.useEffect(()=>{if(!f){ye(!1);return}if(R)return;const t=h.emailSchedule;t&&((t.frequency==="weekly"||t.frequency==="monthly")&&pe(t.frequency),typeof t.dayOfWeek=="number"&&be(t.dayOfWeek),typeof t.dayOfMonth=="number"&&xe(t.dayOfMonth),t.timeOfDay&&ge(t.timeOfDay)),ye(!0)},[f,h.emailSchedule,R]),a.useEffect(()=>{f&&R&&z({...h,emailSchedule:{frequency:j,dayOfWeek:j==="weekly"?M:void 0,dayOfMonth:j==="monthly"?P:void 0,timeOfDay:D}})},[j,M,P,D,f,z,R]),a.useEffect(()=>{f&&(g||h.latestSummaryForEmail&&(W(h.latestSummaryForEmail),h.latestSummaryHtmlForEmail?T(h.latestSummaryHtmlForEmail):T(null)))},[f,h.latestSummaryForEmail,g]),a.useEffect(()=>{f&&(v||he("Monthly A3 / Bowler Summary"))},[f,v]),!f)return null;const Ne=async()=>{if(B!==se){c.error("New passwords don't match");return}if(!L){c.error("Please enter current password");return}k(!0);try{await we.changePassword({username:r==null?void 0:r.username,oldPassword:L,newPassword:B}),c.success("Password updated successfully"),ee(""),te(""),ae("")}catch(t){c.error(t.message||"Failed to update password")}finally{k(!1)}},Ce=async()=>{k(!0);try{await we.updateProfile({username:r==null?void 0:r.username,role:re,profile:{country:oe,plant:ie,team:de,isPublic:A}}),c.success("Profile updated successfully");try{await Y()}catch(t){console.warn("Background refresh failed:",t)}}catch(t){c.error(t.message||"Failed to update profile")}finally{k(!1)}},Ae=async()=>{k(!0);try{await Y(!0),c.success("Profile reloaded")}catch{c.error("Failed to reload profile")}finally{k(!1)}},Me=(t,l)=>{try{const d=t.replace(/```json/g,"").replace(/```/g,"").trim(),n=JSON.parse(d);if(!n||!n.executiveSummary)return t;let i=`Executive Overview:
${n.executiveSummary}

`;return n.a3Summary&&n.a3Summary.trim()!==""&&(i+=`A3 Problem Solving Summary:
${n.a3Summary}

`),l.length>0&&(i+=`Portfolio Statistical Table:
`,i+=`Group | Metric | Latest month | Last 2 months | Last 3 months | Linked A3s | Overall target achieving %
`,i+=`----- | ------ | ------------ | ------------- | ------------- | ---------- | --------------------------
`,l.forEach(o=>{const u=o.latestMet===null||!o.latestActual?"—":o.latestActual,y=o.fail2?"Failing":"—",w=o.fail3?"Failing":"—",s=o.fail2||o.fail3?o.linkedA3Count===0?"0":String(o.linkedA3Count):"—",S=o.achievementRate!=null?`${o.achievementRate.toFixed(0)}%`:"—";i+=`${o.groupName} | ${o.metricName} | ${u} | ${y} | ${w} | ${s} | ${S}
`}),i+=`
`),Array.isArray(n.areasOfConcern)&&n.areasOfConcern.length>0&&(i+=`Areas of Concern & Recommendations:
`,n.areasOfConcern.forEach(o=>{i+=`- ${o.metricName} (${o.groupName}): ${o.issue}
  Suggestion: ${o.suggestion}
`})),i}catch{return t}},q=t=>`<!doctype html>
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
</html>`,Pe=(t,l)=>{try{const d=t.replace(/```json/g,"").replace(/```/g,"").trim(),n=JSON.parse(d);if(!n||!n.executiveSummary||!Array.isArray(n.areasOfConcern))return"";const i=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"),o=i(n.executiveSummary),u=n.a3Summary&&n.a3Summary.trim()!==""?`<section class="card card-a3">
  <h2 class="card-title">A3 Problem Solving Summary</h2>
  <p>${i(n.a3Summary)}</p>
</section>`:"",y=l.length>0?`<section class="card card-stats">
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
          <td>${i(s.groupName)}</td>
          <td>${i(s.metricName)}</td>
          <td>${s.latestMet===null||!s.latestActual?"—":`<span class="status-pill ${s.latestMet===!1?"status-fail":"status-ok"}">${i(s.latestActual)}</span>`}</td>
          <td>${s.fail2?'<span class="status-pill status-warn"><span class="status-dot"></span>Failing</span>':"—"}</td>
          <td>${s.fail3?'<span class="status-pill status-fail"><span class="status-dot"></span>Failing</span>':"—"}</td>
          <td>${s.fail2||s.fail3?s.linkedA3Count===0?'<span class="circle-badge circle-badge-fail">0</span>':`<span class="circle-badge circle-badge-ok">${s.linkedA3Count}</span>`:"—"}</td>
          <td>${s.achievementRate!=null?`<span class="status-pill ${s.achievementRate<2/3*100?"status-fail":"status-ok"}">${s.achievementRate.toFixed(0)}%</span>`:"—"}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>
</section>`:"",w=n.areasOfConcern.length>0?n.areasOfConcern.map(s=>`<div class="concern-card">
  <div class="concern-header">
    <span class="concern-metric">${i(s.metricName)}</span>
    <span class="concern-group">${i(s.groupName)}</span>
  </div>
  <p class="concern-issue">${i(s.issue)}</p>
  <p class="concern-suggestion">${i(s.suggestion)}</p>
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
      <p>${o}</p>
    </section>

    ${y}

    ${u}

    <section class="card card-concerns">
      <h2 class="card-title">Areas of Concern & Recommendations</h2>
      ${w}
    </section>
  </div>
</body>
</html>`}catch{return""}},Fe=async()=>{Q(!0);try{const t=He(V,O),l=ze(V,O),d=l.filter(m=>m.fail2||m.fail3),i=`You are generating a one-click portfolio summary focused on improvement opportunities.

Use the pre-computed statistical snapshot below. Do not redo statistical calculations from raw data. Rely on this snapshot instead.

Consecutive failing metrics (derived from the integrated portfolio table):
${JSON.stringify(d.map(m=>{const s=O.filter(x=>(x.linkedMetricIds||[]).includes(m.metricId)),S=s.filter(x=>(x.status||"").trim().toLowerCase()==="completed").length,F=s.filter(x=>(x.status||"").trim().toLowerCase()!=="completed").length;return{groupName:m.groupName,metricName:m.metricName,metricId:m.metricId,latestMet:m.latestMet,fail2:m.fail2,fail3:m.fail3,achievementRate:m.achievementRate!=null?Number(m.achievementRate.toFixed(1)):null,linkedA3Total:s.length,linkedA3Completed:S,linkedA3Active:F}}),null,2)}

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

Do not include any markdown formatting (like \`\`\`json). Just the raw JSON object.`,o=await Le(t,i,Se),u=Me(o,l),y=Pe(o,l),w=y&&y.trim()!==""?y:q(u);W(u),T(w),z({...h,latestSummaryForEmail:u,latestSummaryHtmlForEmail:w}),c.success("AI summary generated")}catch(t){console.error("Generate summary error:",t),c.error(t.message||"Failed to generate summary")}finally{Q(!1)}},Ee=()=>{const t=new Date,[l,d]=D.split(":"),n=Number(l)||8,i=Number(d)||0;if(j==="weekly"){const s=new Date(t.getTime()),S=s.getDay(),F=M===7?0:M;s.setHours(n,i,0,0);let x=F-S;return(x<0||x===0&&s<=t)&&(x+=7),s.setDate(s.getDate()+x),s}const o=t.getFullYear(),u=t.getMonth(),y=new Date(o,u+1,0).getDate(),w=Math.min(P,y);let m=new Date(o,u,w,n,i,0,0);if(m<=t){const s=new Date(o,u+1,1),S=new Date(s.getFullYear(),s.getMonth()+1,0).getDate(),F=Math.min(P,S);m=new Date(s.getFullYear(),s.getMonth(),F,n,i,0,0)}return m},$e=async()=>{const t=U.split(/[,\n]/).map(d=>d.trim()).filter(d=>d.length>0);if(t.length===0){c.error("Please enter at least one recipient email");return}if(!v.trim()){c.error("Please enter an email subject");return}let l=null;if(b==="scheduled")l=Ee();else{if(!G){c.error("Please choose a send date and time");return}const d=new Date(G);if(Number.isNaN(d.getTime())){c.error("Please enter a valid date and time");return}l=d}if(b==="oneTime"&&!g.trim()){c.error("Please enter an email body or generate a summary");return}if(b==="scheduled"&&!(r!=null&&r.username)){c.error("You must be logged in to schedule recurring summary emails");return}K(!0);try{const d=(r==null?void 0:r.username)||void 0;if(b==="scheduled")await Z.scheduleEmail({userId:d,recipients:t,subject:v.trim(),body:"",sendAt:l.toISOString(),mode:"autoSummary",aiModel:h.aiModel});else{const n=N&&N.trim()!==""?N:q(g.trim());await Z.scheduleEmail({userId:d,recipients:t,subject:v.trim(),body:g.trim(),bodyHtml:n,sendAt:l.toISOString()})}c.success("Email scheduled successfully")}catch(d){c.error(d.message||"Failed to schedule email")}finally{K(!1)}},Te=async()=>{const t=U.split(/[,\n]/).map(l=>l.trim()).filter(l=>l.length>0);if(t.length===0){c.error("Please enter at least one recipient email");return}if(!v.trim()){c.error("Please enter an email subject");return}if(!g.trim()){c.error("Please enter an email body");return}X(!0);try{const l=(r==null?void 0:r.username)||void 0,d=N&&N.trim()!==""?N:q(g.trim());await Z.sendEmailNow({userId:l,recipients:t,subject:v.trim(),body:g.trim(),bodyHtml:d}),c.success("Email sent successfully")}catch(l){c.error(l.message||"Failed to send email")}finally{X(!1)}};return e.jsx("div",{className:"fixed inset-0 z-[70] overflow-y-auto","aria-labelledby":"modal-title",role:"dialog","aria-modal":"true",children:e.jsxs("div",{className:"flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0",children:[e.jsx("div",{className:"fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity","aria-hidden":"true",onClick:I}),e.jsx("span",{className:"hidden sm:inline-block sm:align-middle sm:h-screen","aria-hidden":"true",children:"​"}),e.jsxs("div",{className:"inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full",children:[e.jsxs("div",{className:"bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200 flex justify-between items-center",children:[e.jsx("h3",{className:"text-lg leading-6 font-medium text-gray-900",id:"modal-title",children:"Account Settings"}),e.jsx("button",{onClick:I,className:"text-gray-400 hover:text-gray-500",children:e.jsx(Oe,{className:"h-5 w-5"})})]}),e.jsxs("div",{className:"flex border-b border-gray-200",children:[e.jsxs("button",{className:`flex-1 py-3 text-sm font-medium text-center flex items-center justify-center space-x-2 ${p==="password"?"border-b-2 border-blue-500 text-blue-600":"text-gray-500 hover:text-gray-700"}`,onClick:()=>H("password"),children:[e.jsx(J,{className:"w-4 h-4"}),e.jsx("span",{children:"Password"})]}),e.jsxs("button",{className:`flex-1 py-3 text-sm font-medium text-center flex items-center justify-center space-x-2 ${p==="profile"?"border-b-2 border-blue-500 text-blue-600":"text-gray-500 hover:text-gray-700"}`,onClick:()=>H("profile"),children:[e.jsx(We,{className:"w-4 h-4"}),e.jsx("span",{children:"Profile"})]}),e.jsxs("button",{className:`flex-1 py-3 text-sm font-medium text-center flex items-center justify-center space-x-2 ${p==="email"?"border-b-2 border-blue-500 text-blue-600":"text-gray-500 hover:text-gray-700"}`,onClick:()=>H("email"),children:[e.jsx(Be,{className:"w-4 h-4"}),e.jsx("span",{children:"Email"})]})]}),e.jsxs("div",{className:"px-6 py-6",children:[e.jsxs("div",{className:"mb-6 flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-gray-500",children:"User: "}),e.jsx("span",{className:"font-semibold text-blue-600",children:r==null?void 0:r.username})]}),e.jsx("button",{onClick:Ae,className:"p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors",title:"Reload Profile from Server",children:e.jsx(Ge,{className:`w-4 h-4 ${C?"animate-spin":""}`})})]}),p==="password"&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Current Password"}),e.jsxs("div",{className:"relative",children:[e.jsx(J,{className:"absolute left-3 top-2.5 h-4 w-4 text-gray-400"}),e.jsx("input",{type:"password",value:L,onChange:t=>ee(t.target.value),placeholder:"Enter current password",className:"pl-9 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"New Password"}),e.jsxs("div",{className:"relative",children:[e.jsx(J,{className:"absolute left-3 top-2.5 h-4 w-4 text-gray-400"}),e.jsx("input",{type:"password",value:B,onChange:t=>te(t.target.value),placeholder:"Enter new password",className:"pl-9 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Confirm New Password"}),e.jsxs("div",{className:"relative",children:[e.jsx(Ue,{className:"absolute left-3 top-2.5 h-4 w-4 text-gray-400"}),e.jsx("input",{type:"password",value:se,onChange:t=>ae(t.target.value),placeholder:"Confirm new password",className:"pl-9 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]})]})]}),p==="profile"&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Role"}),e.jsx("input",{type:"text",value:re,onChange:t=>le(t.target.value),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Region"}),e.jsxs("select",{value:oe,onChange:t=>ne(t.target.value),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border",children:[e.jsx("option",{value:"China",children:"China"}),e.jsx("option",{value:"US",children:"US"}),e.jsx("option",{value:"EMEA",children:"EMEA"}),e.jsx("option",{value:"APAC",children:"APAC"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Plant/Office"}),e.jsxs("select",{value:ie,onChange:t=>ce(t.target.value),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border",children:[e.jsx("option",{value:"BJ",children:"BJ"}),e.jsx("option",{value:"SH",children:"SH"}),e.jsx("option",{value:"TW",children:"TW"}),e.jsx("option",{value:"SZFTZ",children:"SZFTZ"}),e.jsx("option",{value:"SZBAN",children:"SZBAN"}),e.jsx("option",{value:"EM1",children:"EM1"}),e.jsx("option",{value:"EM5",children:"EM5"}),e.jsx("option",{value:"LOV",children:"LOV"}),e.jsx("option",{value:"PU3",children:"PU3"})]})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Functional Team"}),e.jsxs("select",{value:de,onChange:t=>me(t.target.value),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border",children:[e.jsx("option",{value:"Commercial",children:"Commercial"}),e.jsx("option",{value:"SC",children:"SC"}),e.jsx("option",{value:"Technical",children:"Technical"})]})]}),e.jsx("div",{className:"pt-2",children:e.jsxs("div",{className:"border border-gray-200 rounded-md p-4 flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-900",children:"Public Profile"}),e.jsx("p",{className:"text-xs text-gray-500",children:"Allow others to consolidate your bowlers"})]}),e.jsx("button",{type:"button",className:`${A?"bg-blue-600":"bg-gray-200"} relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`,role:"switch","aria-checked":A,onClick:()=>ue(!A),children:e.jsx("span",{className:`${A?"translate-x-5":"translate-x-0"} pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`})})]})})]}),p==="email"&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Recipients"}),e.jsx("textarea",{value:U,onChange:t=>fe(t.target.value),rows:2,placeholder:"user1@example.com, user2@example.com",className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"}),e.jsx("p",{className:"mt-1 text-xs text-gray-400",children:"Separate multiple emails with commas or new lines."})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Subject"}),e.jsx("input",{type:"text",value:v,onChange:t=>he(t.target.value),placeholder:"Monthly A3 / metric summary",className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]}),e.jsxs("div",{className:"mt-4 border rounded-md",children:[e.jsxs("div",{className:"flex text-xs font-medium border-b",children:[e.jsx("button",{type:"button",className:`flex-1 px-3 py-2 text-center ${b==="scheduled"?"bg-blue-50 text-blue-700 border-b-2 border-blue-500":"text-gray-500 hover:text-gray-700"}`,onClick:()=>ve("scheduled"),children:"Scheduled (repeat)"}),e.jsx("button",{type:"button",className:`flex-1 px-3 py-2 text-center ${b==="oneTime"?"bg-blue-50 text-blue-700 border-b-2 border-blue-500":"text-gray-500 hover:text-gray-700"}`,onClick:()=>ve("oneTime"),children:"One-time"})]}),e.jsxs("div",{className:"p-3 space-y-3",children:[b==="scheduled"&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Repeat"}),e.jsxs("select",{value:j,onChange:t=>pe(t.target.value),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border",children:[e.jsx("option",{value:"weekly",children:"Every week"}),e.jsx("option",{value:"monthly",children:"Every month"})]})]}),e.jsx("div",{children:j==="weekly"?e.jsxs(e.Fragment,{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Day of Week"}),e.jsxs("select",{value:M,onChange:t=>be(Number(t.target.value)),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border",children:[e.jsx("option",{value:1,children:"Monday"}),e.jsx("option",{value:2,children:"Tuesday"}),e.jsx("option",{value:3,children:"Wednesday"}),e.jsx("option",{value:4,children:"Thursday"}),e.jsx("option",{value:5,children:"Friday"}),e.jsx("option",{value:6,children:"Saturday"}),e.jsx("option",{value:7,children:"Sunday"})]})]}):e.jsxs(e.Fragment,{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Date of Month"}),e.jsx("select",{value:P,onChange:t=>xe(Number(t.target.value)),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border",children:Array.from({length:31},(t,l)=>l+1).map(t=>e.jsx("option",{value:t,children:t},t))})]})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Time"}),e.jsx("input",{type:"time",value:D,onChange:t=>ge(t.target.value),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"}),e.jsx("p",{className:"mt-1 text-xs text-gray-400",children:"Saved to dashboard settings for recurring email schedule. Next send time is calculated automatically."})]})]}),b==="oneTime"&&e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Send At"}),e.jsx("input",{type:"datetime-local",value:G,onChange:t=>ke(t.target.value),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Message"}),e.jsx("button",{type:"button",className:"text-xs px-2 py-1 rounded border border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed",onClick:Fe,disabled:_||E||$,children:_?"Generating…":"Generate summary"})]}),e.jsx("textarea",{value:g,onChange:t=>{W(t.target.value),T(null)},rows:4,placeholder:"Add the summary or message you want to email.",className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]})]})]})]})]})]}),e.jsxs("div",{className:"bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse",children:[p==="password"&&e.jsx("button",{type:"button",className:"w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm",onClick:Ne,disabled:C,children:C?"Updating...":"Update Password"}),p==="profile"&&e.jsx("button",{type:"button",className:"w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm",onClick:Ce,disabled:C,children:C?"Saving...":"Save Profile"}),p==="email"&&e.jsxs(e.Fragment,{children:[e.jsx("button",{type:"button",className:"w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm",onClick:$e,disabled:E||$,children:E?"Scheduling...":b==="scheduled"?"Schedule recurring email":"Schedule one-time email"}),b==="oneTime"&&e.jsx("button",{type:"button",className:"mt-3 w-full inline-flex justify-center rounded-md border border-blue-600 shadow-sm px-4 py-2 bg-white text-base font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm",onClick:Te,disabled:$||E,children:$?"Sending...":"Send Now"})]}),e.jsx("button",{type:"button",className:"mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm",onClick:I,children:p==="password"?"Cancel":"Close"})]})]})]})})};export{Ve as AccountSettingsModal};
