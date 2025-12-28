import{c as te,aK as pt,Z as bt,Y as xt,r as l,O as e,X as Je,aL as k,aM as gt,aN as Ye}from"./index-DrdjLC35.js";import{generateAIContext as yt,generateComprehensiveSummary as vt}from"./aiService-c9KlTcET.js";import{L as pe}from"./lock-D3pXhHQz.js";import{C as jt}from"./check-uTp68AwC.js";/**
 * @license lucide-react v0.330.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wt=te("Clock3",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16.5 12",key:"1aq6pp"}]]);/**
 * @license lucide-react v0.330.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const St=te("CreditCard",[["rect",{width:"20",height:"14",x:"2",y:"5",rx:"2",key:"ynyp8z"}],["line",{x1:"2",x2:"22",y1:"10",y2:"10",key:"1b3vmo"}]]);/**
 * @license lucide-react v0.330.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Nt=te("RefreshCw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]);/**
 * @license lucide-react v0.330.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ke=te("Repeat",[["path",{d:"m17 2 4 4-4 4",key:"nntrym"}],["path",{d:"M3 11v-1a4 4 0 0 1 4-4h14",key:"84bu3i"}],["path",{d:"m7 22-4-4 4-4",key:"1wqhfi"}],["path",{d:"M21 13v1a4 4 0 0 1-4 4H3",key:"1rx37r"}]]),Mt=({isOpen:u,onClose:se,mode:h="account"})=>{const{user:r,refreshUser:be}=pt(),c=bt(),{bowlers:ae,a3Cases:q,selectedModel:Ve,dashboardSettings:p,setDashboardSettings:E,dashboardMarkdown:Qe,dashboardTitle:Xe,dashboardMindmaps:_e,activeMindmapId:et}=xt(),[j,Z]=l.useState("password"),[z,P]=l.useState(!1),[O,xe]=l.useState(!1),[L,ge]=l.useState(!1),[J,ye]=l.useState(!1),[re,ve]=l.useState(""),[le,je]=l.useState(""),[we,Se]=l.useState(""),[Ne,ke]=l.useState(""),[Ce,Ae]=l.useState("China"),[Ee,Me]=l.useState("SZFTZ"),[Fe,Pe]=l.useState("GBS"),[B,De]=l.useState(!0),[w,ne]=l.useState(""),[b,oe]=l.useState(""),[g,Y]=l.useState(""),[ie,tt]=l.useState(""),[D,H]=l.useState(null),[y,Te]=l.useState("weekly"),[T,$e]=l.useState(1),[$,Re]=l.useState(1),[U,Ie]=l.useState("08:00"),[K,ce]=l.useState(""),[V,ze]=l.useState(!1),[Q,Oe]=l.useState(!1),[m,de]=l.useState("autoSummary"),[X,Le]=l.useState(!1),[W,Be]=l.useState(""),[C,He]=l.useState(!1),[M,ue]=l.useState("schedule"),[R,_]=l.useState([]),[me,Ue]=l.useState(!1),[st,We]=l.useState(null),[S,I]=l.useState([]),[ee,Ge]=l.useState(!1);l.useEffect(()=>{r&&(ke(r.role||""),Ae(r.country||"China"),Me(r.plant||"SZFTZ"),Pe(r.team||"GBS"),De(r.isPublicProfile!==void 0?r.isPublicProfile:!0))},[r,u]),l.useEffect(()=>{if(!u){ze(!1),Oe(!1),Le(!1),ue("schedule"),_([]),I([]),ce("");return}if(V)return;const t=p.emailSchedule;t&&((t.frequency==="weekly"||t.frequency==="monthly")&&Te(t.frequency),typeof t.dayOfWeek=="number"&&$e(t.dayOfWeek),typeof t.dayOfMonth=="number"&&Re(t.dayOfMonth),t.timeOfDay&&Ie(t.timeOfDay),typeof t.stopDate=="string"&&ce(t.stopDate)),ze(!0)},[u,p.emailSchedule,V]),l.useEffect(()=>{if(!u||Q)return;const t=p.emailDefaults||{};w||(typeof t.recipients=="string"&&t.recipients.trim()!==""?ne(t.recipients):r&&r.email&&ne(r.email)),!b&&typeof t.subject=="string"&&t.subject.trim()!==""&&oe(t.subject),Oe(!0)},[u,p,Q,w,b,r]),l.useEffect(()=>{u&&(h==="email"?Z("email"):h==="account"&&j==="email"&&Z("password"))},[u,h,j]),l.useEffect(()=>{if(!u||X)return;const t=p.emailConsolidate||{};typeof t.tags=="string"&&Be(t.tags),typeof t.enabled=="boolean"&&He(t.enabled),Le(!0)},[u,p,X]),l.useEffect(()=>{u&&V&&E(t=>{const n=t.emailSchedule||{},s=typeof n.timezoneOffsetMinutes=="number"?n.timezoneOffsetMinutes:new Date().getTimezoneOffset();return{...t,emailSchedule:{...n,frequency:y,dayOfWeek:y==="weekly"?T:void 0,dayOfMonth:y==="monthly"?$:void 0,timeOfDay:U,stopDate:K||void 0,timezoneOffsetMinutes:s}}})},[y,T,$,U,K,u,V]),l.useEffect(()=>{u&&Q&&E(t=>({...t,emailDefaults:{...t.emailDefaults||{},recipients:w,subject:b}}))},[w,b,u,Q,E]),l.useEffect(()=>{u&&X&&E(t=>({...t,emailConsolidate:{...t.emailConsolidate||{},enabled:C,tags:W}}))},[C,W,u,X,E]),l.useEffect(()=>{u&&(g||p.latestSummaryForEmail&&(Y(p.latestSummaryForEmail),p.latestSummaryHtmlForEmail?H(p.latestSummaryHtmlForEmail):H(null)))},[u,p.latestSummaryForEmail,g]),l.useEffect(()=>{u&&(b||oe("Monthly A3 / Bowler Summary"))},[u,b]),l.useEffect(()=>{if(!u||h!=="email"||M!=="active"||!r||!r.username)return;let t=!1;return(async()=>{Ue(!0);try{const n=await k.listScheduledEmails(r.username);if(t)return;const s=Array.isArray(n.jobs)?n.jobs:[];s.sort((i,d)=>i.sendAt===d.sendAt?i.id.localeCompare(d.id):i.sendAt-d.sendAt),_(s)}catch(n){t||c.error(n.message||"Failed to load active schedules")}finally{t||Ue(!1)}})(),()=>{t=!0}},[u,h,M,r,c]);const at=async()=>{if(le!==we){c.error("New passwords don't match");return}if(!re){c.error("Please enter current password");return}P(!0);try{await Ye.changePassword({username:r==null?void 0:r.username,oldPassword:re,newPassword:le}),c.success("Password updated successfully"),ve(""),je(""),Se("")}catch(t){c.error(t.message||"Failed to update password")}finally{P(!1)}},rt=async()=>{P(!0);try{await Ye.updateProfile({username:r==null?void 0:r.username,role:Ne,profile:{country:Ce,plant:Ee,team:Fe,isPublic:B}}),c.success("Profile updated successfully");try{await be()}catch(t){console.warn("Background refresh failed:",t)}}catch(t){c.error(t.message||"Failed to update profile")}finally{P(!1)}},lt=async()=>{P(!0);try{await be(!0),c.success("Profile reloaded")}catch{c.error("Failed to reload profile")}finally{P(!1)}},nt=async t=>{if(!r||!r.username){c.error("You must be logged in to cancel scheduled emails");return}We(t.id);try{if(await k.cancelScheduledEmail(r.username,t.id),t.mode==="autoSummary"){const s={...p};"emailSchedule"in s&&delete s.emailSchedule,E(s);const i={...s,emailDefaults:{...s.emailDefaults||{},recipients:w,subject:b},emailConsolidate:{...s.emailConsolidate||{},enabled:C,tags:W}};await fe(i),c.success("Auto summary schedule cancelled")}else c.success("Scheduled email cancelled");const a=await k.listScheduledEmails(r.username),n=Array.isArray(a.jobs)?a.jobs:[];n.sort((s,i)=>s.sendAt===i.sendAt?s.id.localeCompare(i.id):s.sendAt-i.sendAt),_(n),I(s=>s.filter(i=>i!==t.id))}catch(a){c.error(a.message||"Failed to cancel scheduled email")}finally{We(null)}},ot=t=>{I(a=>a.includes(t)?a.filter(n=>n!==t):[...a,t])},it=()=>{if(S.length===R.length){I([]);return}I(R.map(t=>t.id))},ct=async()=>{if(!r||!r.username){c.error("You must be logged in to cancel scheduled emails");return}if(S.length===0){c.error("Please select at least one scheduled email to cancel");return}Ge(!0);try{for(const n of S)try{await k.cancelScheduledEmail(r.username,n)}catch(s){c.error(s.message||`Failed to cancel scheduled email (${n})`)}const t=await k.listScheduledEmails(r.username),a=Array.isArray(t.jobs)?t.jobs:[];a.sort((n,s)=>n.sendAt===s.sendAt?n.id.localeCompare(s.id):n.sendAt-s.sendAt),_(a),I([]),c.success("Selected scheduled emails cancelled")}finally{Ge(!1)}},qe=()=>{const t=p,a=t.emailSchedule||{},n=typeof a.timezoneOffsetMinutes=="number"?a.timezoneOffsetMinutes:new Date().getTimezoneOffset();return{...t,emailDefaults:{...t.emailDefaults||{},recipients:w,subject:b},emailConsolidate:{...t.emailConsolidate||{},enabled:C,tags:W},emailSchedule:{...a,frequency:y,dayOfWeek:y==="weekly"?T:void 0,dayOfMonth:y==="monthly"?$:void 0,timeOfDay:U,stopDate:K||void 0,timezoneOffsetMinutes:n}}},fe=async t=>{if(!(!r||!r.username))try{await k.saveData(ae,q,r.username,Qe,Xe,_e,et,t)}catch(a){console.error("Failed to persist email settings to backend",a)}},dt=(t,a)=>{try{const n=t.replace(/```json/g,"").replace(/```/g,"").trim(),s=JSON.parse(n);if(!s||!s.executiveSummary)return t;let i=`Executive Overview:
${s.executiveSummary}

`;return s.a3Summary&&s.a3Summary.trim()!==""&&(i+=`A3 Problem Solving Summary:
${s.a3Summary}

`),a.length>0&&(i+=`Portfolio Statistical Table:
`,i+=`Group | Metric | Latest month | Last 2 months | Last 3 months | Linked A3s | Overall target achieving %
`,i+=`----- | ------ | ------------ | ------------- | ------------- | ---------- | --------------------------
`,a.forEach(d=>{const x=d.latestMet===null||!d.latestActual?"—":d.latestActual,N=d.fail2?"Failing":"—",A=d.fail3?"Failing":"—",o=d.fail2||d.fail3?d.linkedA3Count===0?"0":String(d.linkedA3Count):"—",F=d.achievementRate!=null?`${d.achievementRate.toFixed(0)}%`:"—";i+=`${d.groupName} | ${d.metricName} | ${x} | ${N} | ${A} | ${o} | ${F}
`}),i+=`
`),Array.isArray(s.areasOfConcern)&&s.areasOfConcern.length>0&&(i+=`Areas of Concern & Recommendations:
`,s.areasOfConcern.forEach(d=>{i+=`- ${d.metricName} (${d.groupName}): ${d.issue}
  Suggestion: ${d.suggestion}
`})),i}catch{return t}},he=t=>`<!doctype html>
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
</html>`,ut=(t,a)=>{try{const n=t.replace(/```json/g,"").replace(/```/g,"").trim(),s=JSON.parse(n);if(!s||!s.executiveSummary||!Array.isArray(s.areasOfConcern))return"";const i=o=>o.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"),d=i(s.executiveSummary),x=s.a3Summary&&s.a3Summary.trim()!==""?`<section class="card card-a3">
  <h2 class="card-title">A3 Problem Solving Summary</h2>
  <p>${i(s.a3Summary)}</p>
</section>`:"",N=a.length>0?`<section class="card card-stats">
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
        ${a.map(o=>`<tr>
          <td>${i(o.groupName)}</td>
          <td>${i(o.metricName)}</td>
          <td>${o.latestMet===null||!o.latestActual?"—":`<span class="status-pill ${o.latestMet===!1?"status-fail":"status-ok"}">${i(o.latestActual)}</span>`}</td>
          <td>${o.fail2?'<span class="status-pill status-warn"><span class="status-dot"></span>Failing</span>':"—"}</td>
          <td>${o.fail3?'<span class="status-pill status-fail"><span class="status-dot"></span>Failing</span>':"—"}</td>
          <td>${o.fail2||o.fail3?o.linkedA3Count===0?'<span class="circle-badge circle-badge-fail">0</span>':`<span class="circle-badge circle-badge-ok">${o.linkedA3Count}</span>`:"—"}</td>
          <td>${o.achievementRate!=null?`<span class="status-pill ${o.achievementRate<2/3*100?"status-fail":"status-ok"}">${o.achievementRate.toFixed(0)}%</span>`:"—"}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>
</section>`:"",A=s.areasOfConcern.length>0?s.areasOfConcern.map(o=>`<div class="concern-card">
  <div class="concern-header">
    <span class="concern-metric">${i(o.metricName)}</span>
    <span class="concern-group">${i(o.groupName)}</span>
  </div>
  <p class="concern-issue">${i(o.issue)}</p>
  <p class="concern-suggestion">${i(o.suggestion)}</p>
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
      <p>${d}</p>
    </section>

    ${N}

    ${x}

    <section class="card card-concerns">
      <h2 class="card-title">Areas of Concern & Recommendations</h2>
      ${A}
    </section>
  </div>
</body>
</html>`}catch{return""}},Ze=async()=>{ye(!0);try{const t=yt(ae,q),a=gt(ae,q),n=a.filter(f=>f.fail2||f.fail3),i=`You are generating a one-click portfolio summary focused on improvement opportunities.

Use the pre-computed statistical snapshot below. Do not redo statistical calculations from raw data. Rely on this snapshot instead.

Consecutive failing metrics (derived from the integrated portfolio table):
${JSON.stringify(n.map(f=>{const o=q.filter(v=>(v.linkedMetricIds||[]).includes(f.metricId)),F=o.filter(v=>(v.status||"").trim().toLowerCase()==="completed").length,G=o.filter(v=>(v.status||"").trim().toLowerCase()!=="completed").length;return{groupName:f.groupName,metricName:f.metricName,metricId:f.metricId,latestMet:f.latestMet,fail2:f.fail2,fail3:f.fail3,achievementRate:f.achievementRate!=null?Number(f.achievementRate.toFixed(1)):null,linkedA3Total:o.length,linkedA3Completed:F,linkedA3Active:G}}),null,2)}

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

Do not include any markdown formatting (like \`\`\`json). Just the raw JSON object.`,d=await vt(t,i,Ve),x=dt(d,a),N=ut(d,a),A=N&&N.trim()!==""?N:he(x);Y(x),H(A),E({...p,latestSummaryForEmail:x,latestSummaryHtmlForEmail:A}),c.success("AI summary generated")}catch(t){console.error("Generate summary error:",t),c.error(t.message||"Failed to generate summary")}finally{ye(!1)}},mt=()=>{const t=new Date,[a,n]=U.split(":"),s=Number(a)||8,i=Number(n)||0;if(y==="weekly"){const o=new Date(t.getTime()),F=o.getDay(),G=T===7?0:T;o.setHours(s,i,0,0);let v=G-F;return(v<0||v===0&&o<=t)&&(v+=7),o.setDate(o.getDate()+v),o}const d=t.getFullYear(),x=t.getMonth(),N=new Date(d,x+1,0).getDate(),A=Math.min($,N);let f=new Date(d,x,A,s,i,0,0);if(f<=t){const o=new Date(d,x+1,1),F=new Date(o.getFullYear(),o.getMonth()+1,0).getDate(),G=Math.min($,F);f=new Date(o.getFullYear(),o.getMonth(),G,s,i,0,0)}return f},ft=async()=>{const t=w.split(/[,\n]/).map(n=>n.trim()).filter(n=>n.length>0);if(t.length===0){c.error("Please enter at least one recipient email");return}if(!b.trim()){c.error("Please enter an email subject");return}let a=null;if(m==="autoSummary"||m==="manualRepeat")a=mt();else{if(!ie){c.error("Please choose a send date and time");return}const n=new Date(ie);if(Number.isNaN(n.getTime())){c.error("Please enter a valid date and time");return}a=n}if((m==="oneTime"||m==="manualRepeat")&&!g.trim()){c.error("Please enter an email body or generate a summary");return}if((m==="autoSummary"||m==="manualRepeat")&&!(r!=null&&r.username)){c.error("You must be logged in to schedule recurring emails");return}xe(!0);try{const n=(r==null?void 0:r.username)||void 0;if(m==="autoSummary")await k.scheduleEmail({userId:n,recipients:t,subject:b.trim(),body:"",sendAt:a.toISOString(),mode:"autoSummary",aiModel:p.aiModel,fromName:"A3 Bowler",recurring:!0});else{const i=D&&D.trim()!==""?D:he(g.trim());await k.scheduleEmail({userId:n,recipients:t,subject:b.trim(),body:g.trim(),bodyHtml:i,sendAt:a.toISOString(),mode:"manual",fromName:"A3 Bowler",recurring:m==="manualRepeat"})}const s=qe();await fe(s),c.success("Email scheduled successfully")}catch(n){c.error(n.message||"Failed to schedule email")}finally{xe(!1)}},ht=async()=>{const t=w.split(/[,\n]/).map(a=>a.trim()).filter(a=>a.length>0);if(t.length===0){c.error("Please enter at least one recipient email");return}if(!b.trim()){c.error("Please enter an email subject");return}if(!g.trim()){c.error("Please enter an email body");return}ge(!0);try{const a=(r==null?void 0:r.username)||void 0,n=D&&D.trim()!==""?D:he(g.trim());await k.sendEmailNow({userId:a,recipients:t,subject:b.trim(),body:g.trim(),bodyHtml:n,fromName:"A3 Bowler"});const s=qe();await fe(s),c.success("Email sent successfully")}catch(a){c.error(a.message||"Failed to send email")}finally{ge(!1)}};return u?e.jsx("div",{className:"fixed inset-0 z-[70] overflow-y-auto","aria-labelledby":"modal-title",role:"dialog","aria-modal":"true",children:e.jsxs("div",{className:h==="email"?"flex min-h-screen items-stretch justify-center pt-4 px-4 pb-4 text-center sm:block sm:p-0":"flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0",children:[e.jsx("div",{className:"fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity","aria-hidden":"true",onClick:se}),e.jsx("span",{className:"hidden sm:inline-block sm:align-middle sm:h-screen","aria-hidden":"true",children:"​"}),e.jsxs("div",{className:h==="email"?"inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-full max-h-[calc(100vh-2rem)] max-w-5xl sm:align-middle overflow-y-auto":"inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full",children:[e.jsxs("div",{className:"bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200 flex justify-between items-center",children:[e.jsx("h3",{className:"text-lg leading-6 font-medium text-gray-900",id:"modal-title",children:h==="email"?"Email Settings":"Account Settings"}),e.jsx("button",{onClick:se,className:"text-gray-400 hover:text-gray-500",children:e.jsx(Je,{className:"h-5 w-5"})})]}),h!=="email"&&e.jsxs("div",{className:"flex border-b border-gray-200",children:[e.jsxs("button",{className:`flex-1 py-3 text-sm font-medium text-center flex items-center justify-center space-x-2 ${j==="password"?"border-b-2 border-blue-500 text-blue-600":"text-gray-500 hover:text-gray-700"}`,onClick:()=>Z("password"),children:[e.jsx(pe,{className:"w-4 h-4"}),e.jsx("span",{children:"Password"})]}),e.jsxs("button",{className:`flex-1 py-3 text-sm font-medium text-center flex items-center justify-center space-x-2 ${j==="profile"?"border-b-2 border-blue-500 text-blue-600":"text-gray-500 hover:text-gray-700"}`,onClick:()=>Z("profile"),children:[e.jsx(St,{className:"w-4 h-4"}),e.jsx("span",{children:"Profile"})]})]}),e.jsxs("div",{className:"px-6 py-6",children:[h!=="email"&&r&&e.jsxs("div",{className:"mb-6 flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-gray-500",children:"User: "}),e.jsx("span",{className:"font-semibold text-blue-600",children:r==null?void 0:r.username})]}),e.jsx("button",{onClick:lt,className:"p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors",title:"Reload Profile from Server",children:e.jsx(Nt,{className:`w-4 h-4 ${z?"animate-spin":""}`})})]}),h==="account"&&j==="password"&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Current Password"}),e.jsxs("div",{className:"relative",children:[e.jsx(pe,{className:"absolute left-3 top-2.5 h-4 w-4 text-gray-400"}),e.jsx("input",{type:"password",value:re,onChange:t=>ve(t.target.value),placeholder:"Enter current password",className:"pl-9 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"New Password"}),e.jsxs("div",{className:"relative",children:[e.jsx(pe,{className:"absolute left-3 top-2.5 h-4 w-4 text-gray-400"}),e.jsx("input",{type:"password",value:le,onChange:t=>je(t.target.value),placeholder:"Enter new password",className:"pl-9 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Confirm New Password"}),e.jsxs("div",{className:"relative",children:[e.jsx(jt,{className:"absolute left-3 top-2.5 h-4 w-4 text-gray-400"}),e.jsx("input",{type:"password",value:we,onChange:t=>Se(t.target.value),placeholder:"Confirm new password",className:"pl-9 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]})]})]}),h==="account"&&j==="profile"&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Role"}),e.jsx("input",{type:"text",value:Ne,onChange:t=>ke(t.target.value),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Region"}),e.jsxs("select",{value:Ce,onChange:t=>Ae(t.target.value),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border",children:[e.jsx("option",{value:"China",children:"China"}),e.jsx("option",{value:"US",children:"US"}),e.jsx("option",{value:"EMEA",children:"EMEA"}),e.jsx("option",{value:"APAC",children:"APAC"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Plant/Office"}),e.jsxs("select",{value:Ee,onChange:t=>Me(t.target.value),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border",children:[e.jsx("option",{value:"BJ",children:"BJ"}),e.jsx("option",{value:"SH",children:"SH"}),e.jsx("option",{value:"TW",children:"TW"}),e.jsx("option",{value:"SZFTZ",children:"SZFTZ"}),e.jsx("option",{value:"SZBAN",children:"SZBAN"}),e.jsx("option",{value:"EM1",children:"EM1"}),e.jsx("option",{value:"EM5",children:"EM5"}),e.jsx("option",{value:"LOV",children:"LOV"}),e.jsx("option",{value:"PU3",children:"PU3"})]})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Functional Team"}),e.jsxs("select",{value:Fe,onChange:t=>Pe(t.target.value),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border",children:[e.jsx("option",{value:"Commercial",children:"Commercial"}),e.jsx("option",{value:"SC",children:"SC"}),e.jsx("option",{value:"Technical",children:"Technical"})]})]}),e.jsx("div",{className:"pt-2",children:e.jsxs("div",{className:"border border-gray-200 rounded-md p-4 flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-medium text-gray-900",children:"Public Profile"}),e.jsx("p",{className:"text-xs text-gray-500",children:"Allow others to consolidate your bowlers"})]}),e.jsx("button",{type:"button",className:`${B?"bg-blue-600":"bg-gray-200"} relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`,role:"switch","aria-checked":B,onClick:()=>De(!B),children:e.jsx("span",{className:`${B?"translate-x-5":"translate-x-0"} pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`})})]})})]}),h==="email"&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex border-b border-gray-200",children:[e.jsx("button",{type:"button",className:`flex-1 py-2 text-sm font-medium text-center ${M==="schedule"?"border-b-2 border-blue-500 text-blue-600 bg-blue-50":"text-gray-500 hover:text-gray-700"}`,onClick:()=>ue("schedule"),children:"Schedule"}),e.jsx("button",{type:"button",className:`flex-1 py-2 text-sm font-medium text-center ${M==="active"?"border-b-2 border-amber-500 text-amber-600 bg-amber-50":"text-gray-500 hover:text-gray-700"}`,onClick:()=>ue("active"),children:"Active schedules"})]}),M==="schedule"&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Recipients"}),e.jsx("textarea",{value:w,onChange:t=>ne(t.target.value),rows:2,placeholder:"user1@example.com, user2@example.com",className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"}),e.jsx("p",{className:"mt-1 text-xs text-gray-400",children:"Separate multiple emails with commas or new lines."})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Subject"}),e.jsx("input",{type:"text",value:b,onChange:t=>oe(t.target.value),placeholder:"Monthly A3 / metric summary",className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]}),e.jsxs("div",{className:"mt-4 border rounded-md",children:[e.jsxs("div",{className:"flex flex-wrap text-xs font-medium border-b",children:[e.jsxs("button",{type:"button",className:`flex-1 px-3 py-2 text-center flex items-center justify-center space-x-2 ${m==="autoSummary"?"bg-blue-50 text-blue-700 border-b-2 border-blue-500":"text-gray-500 hover:text-gray-700"}`,onClick:()=>de("autoSummary"),children:[e.jsx(Ke,{className:"w-4 h-4"}),e.jsx("span",{children:"Schedule Auto Summary"})]}),e.jsxs("button",{type:"button",className:`flex-1 px-3 py-2 text-center flex items-center justify-center space-x-2 ${m==="manualRepeat"?"bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500":"text-gray-500 hover:text-gray-700"}`,onClick:()=>de("manualRepeat"),children:[e.jsx(Ke,{className:"w-4 h-4"}),e.jsx("span",{children:"Schedule Manual Content"})]}),e.jsxs("button",{type:"button",className:`flex-1 px-3 py-2 text-center flex items-center justify-center space-x-2 ${m==="oneTime"?"bg-purple-50 text-purple-700 border-b-2 border-purple-500":"text-gray-500 hover:text-gray-700"}`,onClick:()=>de("oneTime"),children:[e.jsx(wt,{className:"w-4 h-4"}),e.jsx("span",{children:"One-time"})]})]}),e.jsxs("div",{className:"p-3 space-y-3",children:[(m==="autoSummary"||m==="manualRepeat")&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Repeat"}),e.jsxs("select",{value:y,onChange:t=>Te(t.target.value),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border",children:[e.jsx("option",{value:"weekly",children:"Every week"}),e.jsx("option",{value:"monthly",children:"Every month"})]})]}),e.jsx("div",{children:y==="weekly"?e.jsxs(e.Fragment,{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Day of Week"}),e.jsxs("select",{value:T,onChange:t=>$e(Number(t.target.value)),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border",children:[e.jsx("option",{value:1,children:"Monday"}),e.jsx("option",{value:2,children:"Tuesday"}),e.jsx("option",{value:3,children:"Wednesday"}),e.jsx("option",{value:4,children:"Thursday"}),e.jsx("option",{value:5,children:"Friday"}),e.jsx("option",{value:6,children:"Saturday"}),e.jsx("option",{value:7,children:"Sunday"})]})]}):e.jsxs(e.Fragment,{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Date of Month"}),e.jsx("select",{value:$,onChange:t=>Re(Number(t.target.value)),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border",children:Array.from({length:31},(t,a)=>a+1).map(t=>e.jsx("option",{value:t,children:t},t))})]})}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Time"}),e.jsx("input",{type:"time",value:U,onChange:t=>Ie(t.target.value),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]})]}),e.jsxs("div",{className:"mt-3",children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Repeat Until (optional)"}),e.jsx("input",{type:"date",value:K,onChange:t=>ce(t.target.value),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"}),e.jsx("p",{className:"mt-1 text-xs text-gray-400",children:"After this date, recurring emails will stop automatically."})]}),m==="autoSummary"&&e.jsxs("div",{className:"mt-4 border-t border-gray-100 pt-3 space-y-2",children:[e.jsxs("div",{className:"flex items-start justify-between",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"text-xs font-medium text-gray-700 uppercase mb-1",children:"Consolidate before summary"}),e.jsx("p",{className:"text-xs text-gray-500",children:"When enabled, consolidate tagged bowlers and A3 cases before generating the summary email."})]}),e.jsx("button",{type:"button",className:`${C?"bg-blue-600":"bg-gray-200"} relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`,role:"switch","aria-checked":C,onClick:()=>He(!C),children:e.jsx("span",{className:`${C?"translate-x-5":"translate-x-0"} pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Consolidate tags"}),e.jsx("input",{type:"text",value:W,onChange:t=>Be(t.target.value),placeholder:"e.g. Technical, Q1, Portfolio",className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"}),e.jsx("p",{className:"mt-1 text-xs text-gray-400",children:"Tags are matched during consolidation before each scheduled summary email."})]})]}),m==="manualRepeat"&&e.jsxs("div",{className:"mt-4 space-y-2 border-t border-gray-100 pt-3",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Message"}),e.jsx("button",{type:"button",className:"text-xs px-2 py-1 rounded border border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed",onClick:Ze,disabled:J||O||L,children:J?"Generating…":"Generate summary"})]}),e.jsx("textarea",{value:g,onChange:t=>{Y(t.target.value),H(null)},rows:4,placeholder:"Add the summary or message you want to email.",className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]})]}),m==="oneTime"&&e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Send At"}),e.jsx("input",{type:"datetime-local",value:ie,onChange:t=>tt(t.target.value),className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Message"}),e.jsx("button",{type:"button",className:"text-xs px-2 py-1 rounded border border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed",onClick:Ze,disabled:J||O||L,children:J?"Generating…":"Generate summary"})]}),e.jsx("textarea",{value:g,onChange:t=>{Y(t.target.value),H(null)},rows:4,placeholder:"Add the summary or message you want to email.",className:"block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]})]})]})]})]}),M==="active"&&e.jsxs("div",{className:"space-y-3",children:[me&&e.jsx("p",{className:"text-sm text-gray-500",children:"Loading active schedules..."}),!me&&R.length===0&&e.jsx("p",{className:"text-sm text-gray-500",children:"No active scheduled emails."}),!me&&R.length>0&&e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between mb-1",children:[e.jsxs("label",{className:"flex items-center gap-2 text-xs text-gray-600",children:[e.jsx("input",{type:"checkbox",className:"rounded border-gray-300 text-blue-600 focus:ring-blue-500",checked:S.length>0&&S.length===R.length,onChange:it}),e.jsx("span",{children:"Select all"})]}),e.jsxs("button",{type:"button",onClick:ct,disabled:S.length===0||ee,className:"inline-flex items-center px-3 py-1.5 rounded-md border border-red-600 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed",children:[ee?"Cancelling...":"Cancel selected",S.length>0&&!ee&&e.jsxs("span",{className:"ml-1",children:["(",S.length,")"]})]})]}),R.map(t=>e.jsxs("div",{className:"flex items-center justify-between gap-3 p-3 border border-gray-200 rounded-md",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("input",{type:"checkbox",className:"rounded border-gray-300 text-blue-600 focus:ring-blue-500",checked:S.includes(t.id),onChange:()=>ot(t.id)}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium text-gray-900",children:t.subject}),e.jsxs("p",{className:"text-xs text-gray-500",children:[t.mode==="autoSummary"?"Auto summary (recurring)":t.mode==="manual"&&t.recurring?"Manual (recurring)":"One-time"," ","· Next run: ",new Date(t.sendAt).toLocaleString()]})]})]}),e.jsx("button",{type:"button",className:"inline-flex items-center justify-center rounded-full p-2 text-red-600 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed",onClick:()=>nt(t),disabled:st===t.id||ee,children:e.jsx(Je,{className:"w-4 h-4"})})]},t.id))]})]})]})]}),e.jsxs("div",{className:"bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse",children:[h==="account"&&j==="password"&&e.jsx("button",{type:"button",className:"w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm",onClick:at,disabled:z,children:z?"Updating...":"Update Password"}),h==="account"&&j==="profile"&&e.jsx("button",{type:"button",className:"w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm",onClick:rt,disabled:z,children:z?"Saving...":"Save Profile"}),h==="email"&&M==="schedule"&&e.jsxs(e.Fragment,{children:[e.jsx("button",{type:"button",className:"w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm",onClick:ft,disabled:O||L,children:O?"Scheduling...":m==="autoSummary"?"Schedule auto summary":m==="manualRepeat"?"Schedule recurring manual email":"Schedule one-time email"}),m==="oneTime"&&e.jsx("button",{type:"button",className:"mt-3 w-full inline-flex justify-center rounded-md border border-blue-600 shadow-sm px-4 py-2 bg-white text-base font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm",onClick:ht,disabled:L||O,children:L?"Sending...":"Send Now"})]}),e.jsx("button",{type:"button",className:"mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm",onClick:se,children:j==="password"?"Cancel":"Close"})]})]})]})}):null};export{Mt as AccountSettingsModal};
