import{c as Z,aF as Ye,Z as Ve,Y as Ke,r as a,O as e,X as Qe,aH as Xe,aI as Fe,aJ as G}from"./index-CBHpqXov.js";import{generateAIContext as _e,generateComprehensiveSummary as et}from"./aiService-BdGNG9_S.js";import{L as ae}from"./lock-CnprWust.js";import{C as tt}from"./check-QhOOhlop.js";/**
 * @license lucide-react v0.330.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const st=Z("Clock3",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16.5 12",key:"1aq6pp"}]]);/**
 * @license lucide-react v0.330.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const at=Z("CreditCard",[["rect",{width:"20",height:"14",x:"2",y:"5",rx:"2",key:"ynyp8z"}],["line",{x1:"2",x2:"22",y1:"10",y2:"10",key:"1b3vmo"}]]);/**
 * @license lucide-react v0.330.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const rt=Z("RefreshCw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]);/**
 * @license lucide-react v0.330.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const lt=Z("Repeat",[["path",{d:"m17 2 4 4-4 4",key:"nntrym"}],["path",{d:"M3 11v-1a4 4 0 0 1 4-4h14",key:"84bu3i"}],["path",{d:"m7 22-4-4 4-4",key:"1wqhfi"}],["path",{d:"M21 13v1a4 4 0 0 1-4 4H3",key:"1rx37r"}]]),dt=({isOpen:m,onClose:J,mode:f="account"})=>{const{user:r,refreshUser:re}=Ye(),o=Ve(),{bowlers:Y,a3Cases:I,selectedModel:$e,dashboardSettings:h,setDashboardSettings:k,dashboardMarkdown:Te,dashboardTitle:De,dashboardMindmaps:Re,activeMindmapId:Ie}=Ke(),[y,z]=a.useState("password"),[P,A]=a.useState(!1),[F,H]=a.useState(!1),[B,le]=a.useState(!1),[ne,oe]=a.useState(!1),[V,ie]=a.useState(""),[K,ce]=a.useState(""),[de,me]=a.useState(""),[ue,fe]=a.useState(""),[he,pe]=a.useState("China"),[be,xe]=a.useState("SZFTZ"),[ge,ye]=a.useState("GBS"),[$,ve]=a.useState(!0),[S,Q]=a.useState(""),[p,X]=a.useState(""),[v,_]=a.useState(""),[ee,ze]=a.useState(""),[E,L]=a.useState(null),[N,we]=a.useState("weekly"),[T,je]=a.useState(1),[D,ke]=a.useState(1),[O,Se]=a.useState("08:00"),[U,Ne]=a.useState(!1),[W,Ce]=a.useState(!1),[b,Ae]=a.useState("scheduled"),[q,Ee]=a.useState(!1),[te,Me]=a.useState(""),[M,Pe]=a.useState(!1);if(a.useEffect(()=>{r&&(fe(r.role||""),pe(r.country||"China"),xe(r.plant||"SZFTZ"),ye(r.team||"GBS"),ve(r.isPublicProfile!==void 0?r.isPublicProfile:!0))},[r,m]),a.useEffect(()=>{if(!m){Ne(!1),Ce(!1),Ee(!1);return}if(U)return;const t=h.emailSchedule;t&&((t.frequency==="weekly"||t.frequency==="monthly")&&we(t.frequency),typeof t.dayOfWeek=="number"&&je(t.dayOfWeek),typeof t.dayOfMonth=="number"&&ke(t.dayOfMonth),t.timeOfDay&&Se(t.timeOfDay)),Ne(!0)},[m,h.emailSchedule,U]),a.useEffect(()=>{if(!m||W)return;const t=h.emailDefaults||{};S||(typeof t.recipients=="string"&&t.recipients.trim()!==""?Q(t.recipients):r&&r.email&&Q(r.email)),!p&&typeof t.subject=="string"&&t.subject.trim()!==""&&X(t.subject),Ce(!0)},[m,h,W,S,p,r]),a.useEffect(()=>{m&&(f==="email"?z("email"):f==="account"&&y==="email"&&z("password"))},[m,f,y]),a.useEffect(()=>{if(!m||q)return;const t=h.emailConsolidate||{};typeof t.tags=="string"&&Me(t.tags),typeof t.enabled=="boolean"&&Pe(t.enabled),Ee(!0)},[m,h,q]),a.useEffect(()=>{m&&U&&k(t=>({...t,emailSchedule:{frequency:N,dayOfWeek:N==="weekly"?T:void 0,dayOfMonth:N==="monthly"?D:void 0,timeOfDay:O}}))},[N,T,D,O,m,U]),a.useEffect(()=>{m&&W&&k(t=>({...t,emailDefaults:{...t.emailDefaults||{},recipients:S,subject:p}}))},[S,p,m,W,k]),a.useEffect(()=>{m&&q&&k(t=>({...t,emailConsolidate:{...t.emailConsolidate||{},enabled:M,tags:te}}))},[M,te,m,q,k]),a.useEffect(()=>{m&&(v||h.latestSummaryForEmail&&(_(h.latestSummaryForEmail),h.latestSummaryHtmlForEmail?L(h.latestSummaryHtmlForEmail):L(null)))},[m,h.latestSummaryForEmail,v]),a.useEffect(()=>{m&&(p||X("Monthly A3 / Bowler Summary"))},[m,p]),!m)return null;const He=async()=>{if(K!==de){o.error("New passwords don't match");return}if(!V){o.error("Please enter current password");return}A(!0);try{await Fe.changePassword({username:r==null?void 0:r.username,oldPassword:V,newPassword:K}),o.success("Password updated successfully"),ie(""),ce(""),me("")}catch(t){o.error(t.message||"Failed to update password")}finally{A(!1)}},Be=async()=>{A(!0);try{await Fe.updateProfile({username:r==null?void 0:r.username,role:ue,profile:{country:he,plant:be,team:ge,isPublic:$}}),o.success("Profile updated successfully");try{await re()}catch(t){console.warn("Background refresh failed:",t)}}catch(t){o.error(t.message||"Failed to update profile")}finally{A(!1)}},Le=async()=>{A(!0);try{await re(!0),o.success("Profile reloaded")}catch{o.error("Failed to reload profile")}finally{A(!1)}},Oe=async()=>{if(!r||!r.username){o.error("You must be logged in to cancel recurring emails");return}H(!0);try{const t={...h};"emailSchedule"in t&&delete t.emailSchedule,k(t),await G.saveData(Y,I,r.username,Te,De,Re,Ie,t),o.success("Recurring email schedule cancelled")}catch(t){o.error(t.message||"Failed to cancel recurring schedule")}finally{H(!1)}},Ue=(t,l)=>{try{const d=t.replace(/```json/g,"").replace(/```/g,"").trim(),i=JSON.parse(d);if(!i||!i.executiveSummary)return t;let c=`Executive Overview:
${i.executiveSummary}

`;return i.a3Summary&&i.a3Summary.trim()!==""&&(c+=`A3 Problem Solving Summary:
${i.a3Summary}

`),l.length>0&&(c+=`Portfolio Statistical Table:
`,c+=`Group | Metric | Latest month | Last 2 months | Last 3 months | Linked A3s | Overall target achieving %
`,c+=`----- | ------ | ------------ | ------------- | ------------- | ---------- | --------------------------
`,l.forEach(n=>{const x=n.latestMet===null||!n.latestActual?"—":n.latestActual,w=n.fail2?"Failing":"—",j=n.fail3?"Failing":"—",s=n.fail2||n.fail3?n.linkedA3Count===0?"0":String(n.linkedA3Count):"—",C=n.achievementRate!=null?`${n.achievementRate.toFixed(0)}%`:"—";c+=`${n.groupName} | ${n.metricName} | ${x} | ${w} | ${j} | ${s} | ${C}
`}),c+=`
`),Array.isArray(i.areasOfConcern)&&i.areasOfConcern.length>0&&(c+=`Areas of Concern & Recommendations:
`,i.areasOfConcern.forEach(n=>{c+=`- ${n.metricName} (${n.groupName}): ${n.issue}
  Suggestion: ${n.suggestion}
`})),c}catch{return t}},se=t=>`<!doctype html>
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
</html>`,We=(t,l)=>{try{const d=t.replace(/```json/g,"").replace(/```/g,"").trim(),i=JSON.parse(d);if(!i||!i.executiveSummary||!Array.isArray(i.areasOfConcern))return"";const c=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"),n=c(i.executiveSummary),x=i.a3Summary&&i.a3Summary.trim()!==""?`<section class="card card-a3">
  <h2 class="card-title">A3 Problem Solving Summary</h2>
  <p>${c(i.a3Summary)}</p>
</section>`:"",w=l.length>0?`<section class="card card-stats">
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
</section>`:"",j=i.areasOfConcern.length>0?i.areasOfConcern.map(s=>`<div class="concern-card">
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

    ${w}

    ${x}

    <section class="card card-concerns">
      <h2 class="card-title">Areas of Concern & Recommendations</h2>
      ${j}
    </section>
  </div>
</body>
</html>`}catch{return""}},qe=async()=>{oe(!0);try{const t=_e(Y,I),l=Xe(Y,I),d=l.filter(u=>u.fail2||u.fail3),c=`You are generating a one-click portfolio summary focused on improvement opportunities.

Use the pre-computed statistical snapshot below. Do not redo statistical calculations from raw data. Rely on this snapshot instead.

Consecutive failing metrics (derived from the integrated portfolio table):
${JSON.stringify(d.map(u=>{const s=I.filter(g=>(g.linkedMetricIds||[]).includes(u.metricId)),C=s.filter(g=>(g.status||"").trim().toLowerCase()==="completed").length,R=s.filter(g=>(g.status||"").trim().toLowerCase()!=="completed").length;return{groupName:u.groupName,metricName:u.metricName,metricId:u.metricId,latestMet:u.latestMet,fail2:u.fail2,fail3:u.fail3,achievementRate:u.achievementRate!=null?Number(u.achievementRate.toFixed(1)):null,linkedA3Total:s.length,linkedA3Completed:C,linkedA3Active:R}}),null,2)}

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

Do not include any markdown formatting (like \`\`\`json). Just the raw JSON object.`,n=await et(t,c,$e),x=Ue(n,l),w=We(n,l),j=w&&w.trim()!==""?w:se(x);_(x),L(j),k({...h,latestSummaryForEmail:x,latestSummaryHtmlForEmail:j}),o.success("AI summary generated")}catch(t){console.error("Generate summary error:",t),o.error(t.message||"Failed to generate summary")}finally{oe(!1)}},Ge=()=>{const t=new Date,[l,d]=O.split(":"),i=Number(l)||8,c=Number(d)||0;if(N==="weekly"){const s=new Date(t.getTime()),C=s.getDay(),R=T===7?0:T;s.setHours(i,c,0,0);let g=R-C;return(g<0||g===0&&s<=t)&&(g+=7),s.setDate(s.getDate()+g),s}const n=t.getFullYear(),x=t.getMonth(),w=new Date(n,x+1,0).getDate(),j=Math.min(D,w);let u=new Date(n,x,j,i,c,0,0);if(u<=t){const s=new Date(n,x+1,1),C=new Date(s.getFullYear(),s.getMonth()+1,0).getDate(),R=Math.min(D,C);u=new Date(s.getFullYear(),s.getMonth(),R,i,c,0,0)}return u},Ze=async()=>{const t=S.split(/[,\n]/).map(d=>d.trim()).filter(d=>d.length>0);if(t.length===0){o.error("Please enter at least one recipient email");return}if(!p.trim()){o.error("Please enter an email subject");return}let l=null;if(b==="scheduled")l=Ge();else{if(!ee){o.error("Please choose a send date and time");return}const d=new Date(ee);if(Number.isNaN(d.getTime())){o.error("Please enter a valid date and time");return}l=d}if(b==="oneTime"&&!v.trim()){o.error("Please enter an email body or generate a summary");return}if(b==="scheduled"&&!(r!=null&&r.username)){o.error("You must be logged in to schedule recurring summary emails");return}H(!0);try{const d=(r==null?void 0:r.username)||void 0;if(b==="scheduled")await G.scheduleEmail({userId:d,recipients:t,subject:p.trim(),body:"",sendAt:l.toISOString(),mode:"autoSummary",aiModel:h.aiModel,fromName:"A3 Bowler"});else{const i=E&&E.trim()!==""?E:se(v.trim());await G.scheduleEmail({userId:d,recipients:t,subject:p.trim(),body:v.trim(),bodyHtml:i,sendAt:l.toISOString(),fromName:"A3 Bowler"})}o.success("Email scheduled successfully")}catch(d){o.error(d.message||"Failed to schedule email")}finally{H(!1)}},Je=async()=>{const t=S.split(/[,\n]/).map(l=>l.trim()).filter(l=>l.length>0);if(t.length===0){o.error("Please enter at least one recipient email");return}if(!p.trim()){o.error("Please enter an email subject");return}if(!v.trim()){o.error("Please enter an email body");return}le(!0);try{const l=(r==null?void 0:r.username)||void 0,d=E&&E.trim()!==""?E:se(v.trim());await G.sendEmailNow({userId:l,recipients:t,subject:p.trim(),body:v.trim(),bodyHtml:d,fromName:"A3 Bowler"}),o.success("Email sent successfully")}catch(l){o.error(l.message||"Failed to send email")}finally{le(!1)}};return m?e.jsx("div",{className:"fixed inset-0 z-[70] overflow-y-auto","aria-labelledby":"modal-title",role:"dialog","aria-modal":"true",children:e.jsxs("div",{className:f==="email"?"flex min-h-screen items-stretch justify-center pt-4 px-4 pb-4 text-center sm:block sm:p-0":"flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0",children:[e.jsx("div",{className:"fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity","aria-hidden":"true",onClick:J}),e.jsx("span",{className:"hidden sm:inline-block sm:align-middle sm:h-screen","aria-hidden":"true",children:"​"}),e.jsxs("div",{className:f==="email"?"inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-full max-h-[calc(100vh-2rem)] max-w-5xl sm:align-middle overflow-y-auto":"inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full",children:[e.jsxs("div",{className:"bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200 flex justify-between items-center",children:[e.jsx("h3",{className:"text-lg leading-6 font-medium text-gray-900",id:"modal-title",children:f==="email"?"Email Settings":"Account Settings"}),e.jsx("button",{onClick:J,className:"text-gray-400 hover:text-gray-500",children:e.jsx(Qe,{className:"h-5 w-5"})})]}),f!=="email"&&e.jsxs("div",{className:"flex border-b border-gray-200",children:[e.jsxs("button",{className:`flex-1 py-3 text-sm font-medium text-center flex items-center justify-center space-x-2 ${y==="password"?"border-b-2 border-blue-500 text-blue-600":"text-gray-500 hover:text-gray-700"}`,onClick:()=>z("password"),children:[e.jsx(ae,{className:"w-4 h-4"}),e.jsx("span",{children:"Password"})]}),e.jsxs("button",{className:`flex-1 py-3 text-sm font-medium text-center flex items-center justify-center space-x-2 ${y==="profile"?"border-b-2 border-blue-500 text-blue-600":"text-gray-500 hover:text-gray-700"}`,onClick:()=>z("profile"),children:[e.jsx(at,{className:"w-4 h-4"}),e.jsx("span",{children:"Profile"})]})]}),e.jsxs("div",{className:"px-6 py-6",children:[f!=="email"&&r&&e.jsxs("div",{className:"mb-6 flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-gray-500",children:"User: "}),e.jsx("span",{className:"font-semibold text-blue-600",children:r==null?void 0:r.username})]}),e.jsx("button",{onClick:Le,className:"p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors",title:"Reload Profile from Server",children:e.jsx(rt,{className:`w-4 h-4 ${P?"animate-spin":""}`})})]}),f==="account"&&y==="password"&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Current Password"}),e.jsxs("div",{className:"relative",children:[e.jsx(ae,{className:"absolute left-3 top-2.5 h-4 w-4 text-gray-400"}),e.jsx("input",{type:"password",value:V,onChange:t=>ie(t.target.value),placeholder:"Enter current password",className:"pl-9 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"New Password"}),e.jsxs("div",{className:"relative",children:[e.jsx(ae,{className:"absolute left-3 top-2.5 h-4 w-4 text-gray-400"}),e.jsx("input",{type:"password",value:K,onChange:t=>ce(t.target.value),placeholder:"Enter new password",className:"pl-9 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Confirm New Password"}),e.jsxs("div",{className:"relative",children:[e.jsx(tt,{className:"absolute left-3 top-2.5 h-4 w-4 text-gray-400"}),e.jsx("input",{type:"password",value:de,onChange:t=>me(t.target.value),placeholder:"Confirm new password",className:"pl-9 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]})]})]}),f==="account"&&y==="profile"&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Role"}),e.jsx("input",{type:"text",value:ue,onChange:t=>fe(t.target.value),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Region"}),e.jsxs("select",{value:he,onChange:t=>pe(t.target.value),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border",children:[e.jsx("option",{value:"China",children:"China"}),e.jsx("option",{value:"US",children:"US"}),e.jsx("option",{value:"EMEA",children:"EMEA"}),e.jsx("option",{value:"APAC",children:"APAC"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Plant/Office"}),e.jsxs("select",{value:be,onChange:t=>xe(t.target.value),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border",children:[e.jsx("option",{value:"BJ",children:"BJ"}),e.jsx("option",{value:"SH",children:"SH"}),e.jsx("option",{value:"TW",children:"TW"}),e.jsx("option",{value:"SZFTZ",children:"SZFTZ"}),e.jsx("option",{value:"SZBAN",children:"SZBAN"}),e.jsx("option",{value:"EM1",children:"EM1"}),e.jsx("option",{value:"EM5",children:"EM5"}),e.jsx("option",{value:"LOV",children:"LOV"}),e.jsx("option",{value:"PU3",children:"PU3"})]})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Functional Team"}),e.jsxs("select",{value:ge,onChange:t=>ye(t.target.value),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border",children:[e.jsx("option",{value:"Commercial",children:"Commercial"}),e.jsx("option",{value:"SC",children:"SC"}),e.jsx("option",{value:"Technical",children:"Technical"})]})]}),e.jsx("div",{className:"pt-2",children:e.jsxs("div",{className:"border border-gray-200 rounded-md p-4 flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-900",children:"Public Profile"}),e.jsx("p",{className:"text-xs text-gray-500",children:"Allow others to consolidate your bowlers"})]}),e.jsx("button",{type:"button",className:`${$?"bg-blue-600":"bg-gray-200"} relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`,role:"switch","aria-checked":$,onClick:()=>ve(!$),children:e.jsx("span",{className:`${$?"translate-x-5":"translate-x-0"} pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`})})]})})]}),f==="email"&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Recipients"}),e.jsx("textarea",{value:S,onChange:t=>Q(t.target.value),rows:2,placeholder:"user1@example.com, user2@example.com",className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"}),e.jsx("p",{className:"mt-1 text-xs text-gray-400",children:"Separate multiple emails with commas or new lines."})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Subject"}),e.jsx("input",{type:"text",value:p,onChange:t=>X(t.target.value),placeholder:"Monthly A3 / metric summary",className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]}),e.jsxs("div",{className:"mt-4 border rounded-md",children:[e.jsxs("div",{className:"flex flex-wrap text-xs font-medium border-b",children:[e.jsxs("button",{type:"button",className:`flex-1 px-3 py-2 text-center flex items-center justify-center space-x-2 ${b==="scheduled"?"bg-blue-50 text-blue-700 border-b-2 border-blue-500":"text-gray-500 hover:text-gray-700"}`,onClick:()=>Ae("scheduled"),children:[e.jsx(lt,{className:"w-4 h-4"}),e.jsx("span",{children:"Scheduled (repeat)"})]}),e.jsxs("button",{type:"button",className:`flex-1 px-3 py-2 text-center flex items-center justify-center space-x-2 ${b==="oneTime"?"bg-blue-50 text-blue-700 border-b-2 border-blue-500":"text-gray-500 hover:text-gray-700"}`,onClick:()=>Ae("oneTime"),children:[e.jsx(st,{className:"w-4 h-4"}),e.jsx("span",{children:"One-time"})]})]}),e.jsxs("div",{className:"p-3 space-y-3",children:[b==="scheduled"&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Repeat"}),e.jsxs("select",{value:N,onChange:t=>we(t.target.value),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border",children:[e.jsx("option",{value:"weekly",children:"Every week"}),e.jsx("option",{value:"monthly",children:"Every month"})]})]}),e.jsx("div",{children:N==="weekly"?e.jsxs(e.Fragment,{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Day of Week"}),e.jsxs("select",{value:T,onChange:t=>je(Number(t.target.value)),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border",children:[e.jsx("option",{value:1,children:"Monday"}),e.jsx("option",{value:2,children:"Tuesday"}),e.jsx("option",{value:3,children:"Wednesday"}),e.jsx("option",{value:4,children:"Thursday"}),e.jsx("option",{value:5,children:"Friday"}),e.jsx("option",{value:6,children:"Saturday"}),e.jsx("option",{value:7,children:"Sunday"})]})]}):e.jsxs(e.Fragment,{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Date of Month"}),e.jsx("select",{value:D,onChange:t=>ke(Number(t.target.value)),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border",children:Array.from({length:31},(t,l)=>l+1).map(t=>e.jsx("option",{value:t,children:t},t))})]})}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Time"}),e.jsx("input",{type:"time",value:O,onChange:t=>Se(t.target.value),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]})]}),e.jsxs("div",{className:"mt-4 border-t border-gray-100 pt-3 space-y-2",children:[e.jsxs("div",{className:"flex items-start justify-between",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"text-xs font-medium text-gray-700 uppercase mb-1",children:"Consolidate before summary"}),e.jsx("p",{className:"text-xs text-gray-500",children:"When enabled, consolidate tagged bowlers and A3 cases before generating the summary email."})]}),e.jsx("button",{type:"button",className:`${M?"bg-blue-600":"bg-gray-200"} relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`,role:"switch","aria-checked":M,onClick:()=>Pe(!M),children:e.jsx("span",{className:`${M?"translate-x-5":"translate-x-0"} pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Consolidate tags"}),e.jsx("input",{type:"text",value:te,onChange:t=>Me(t.target.value),placeholder:"e.g. Technical, Q1, Portfolio",className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"}),e.jsx("p",{className:"mt-1 text-xs text-gray-400",children:"Tags are matched during consolidation before each scheduled summary email."})]})]})]}),b==="oneTime"&&e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Send At"}),e.jsx("input",{type:"datetime-local",value:ee,onChange:t=>ze(t.target.value),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Message"}),e.jsx("button",{type:"button",className:"text-xs px-2 py-1 rounded border border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed",onClick:qe,disabled:ne||F||B,children:ne?"Generating…":"Generate summary"})]}),e.jsx("textarea",{value:v,onChange:t=>{_(t.target.value),L(null)},rows:4,placeholder:"Add the summary or message you want to email.",className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]})]})]})]})]})]}),e.jsxs("div",{className:"bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse",children:[f==="account"&&y==="password"&&e.jsx("button",{type:"button",className:"w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm",onClick:He,disabled:P,children:P?"Updating...":"Update Password"}),f==="account"&&y==="profile"&&e.jsx("button",{type:"button",className:"w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm",onClick:Be,disabled:P,children:P?"Saving...":"Save Profile"}),f==="email"&&e.jsxs(e.Fragment,{children:[e.jsx("button",{type:"button",className:"w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm",onClick:Ze,disabled:F||B,children:F?"Scheduling...":b==="scheduled"?"Schedule recurring email":"Schedule one-time email"}),b==="oneTime"&&e.jsx("button",{type:"button",className:"mt-3 w-full inline-flex justify-center rounded-md border border-blue-600 shadow-sm px-4 py-2 bg-white text-base font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm",onClick:Je,disabled:B||F,children:B?"Sending...":"Send Now"}),b==="scheduled"&&e.jsx("button",{type:"button",className:"mt-3 w-full inline-flex justify-center rounded-md border border-red-600 shadow-sm px-4 py-2 bg-white text-base font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm",onClick:Oe,disabled:F,children:"Cancel recurring emails"})]}),e.jsx("button",{type:"button",className:"mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm",onClick:J,children:y==="password"?"Cancel":"Close"})]})]})]})}):null};export{dt as AccountSettingsModal};
