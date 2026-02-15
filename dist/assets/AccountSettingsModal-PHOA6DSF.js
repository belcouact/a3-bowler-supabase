import{c as he,ap as pt,a2 as gt,a1 as yt,r as l,O as e,X as Ye,U as vt,aW as wt,ar as v,aX as jt,aY as St,aZ as kt,a_ as Ve}from"./index-BmmYfibn.js";import{L as fe}from"./lock-D026E6nW.js";/**
 * @license lucide-react v0.330.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Nt=he("CreditCard",[["rect",{width:"20",height:"14",x:"2",y:"5",rx:"2",key:"ynyp8z"}],["line",{x1:"2",x2:"22",y1:"10",y2:"10",key:"1b3vmo"}]]);/**
 * @license lucide-react v0.330.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ct=he("RefreshCw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]);/**
 * @license lucide-react v0.330.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xe=he("Repeat",[["path",{d:"m17 2 4 4-4 4",key:"nntrym"}],["path",{d:"M3 11v-1a4 4 0 0 1 4-4h14",key:"84bu3i"}],["path",{d:"m7 22-4-4 4-4",key:"1wqhfi"}],["path",{d:"M21 13v1a4 4 0 0 1-4 4H3",key:"1rx37r"}]]),Mt=({isOpen:u,onClose:te,mode:f="account"})=>{const{user:n,refreshUser:be}=pt(),i=gt(),{bowlers:xe,a3Cases:pe,selectedModel:_e,dashboardSettings:b,setDashboardSettings:E,dashboardMarkdown:Ke,dashboardTitle:Qe,dashboardMindmaps:et,activeMindmapId:tt}=yt(),[w,Z]=l.useState("password"),[B,$]=l.useState(!1),[L,ge]=l.useState(!1),[H,ye]=l.useState(!1),[J,ve]=l.useState(!1),[se,we]=l.useState(""),[ae,je]=l.useState(""),[Se,ke]=l.useState(""),[Ne,Ce]=l.useState(""),[Ae,Ee]=l.useState("China"),[Me,Pe]=l.useState("SZFTZ"),[Fe,$e]=l.useState("GBS"),[U,De]=l.useState(!0),[j,re]=l.useState(""),[x,ne]=l.useState(""),[g,Y]=l.useState(""),[le,st]=l.useState(""),[D,W]=l.useState(null),[y,Te]=l.useState("weekly"),[T,Re]=l.useState(1),[R,Ie]=l.useState(1),[G,ze]=l.useState("08:00"),[V,oe]=l.useState(""),[X,Oe]=l.useState(!1),[_,Be]=l.useState(!1),[m,ie]=l.useState("autoSummary"),[K,Le]=l.useState(!1),[M,He]=l.useState(""),[S,Ue]=l.useState(!1),[P,ce]=l.useState("schedule"),[I,Q]=l.useState([]),[de,We]=l.useState(!1),[at,Ge]=l.useState(null),[p,z]=l.useState([]),[ee,qe]=l.useState(!1);l.useEffect(()=>{n&&(Ce(n.role||""),Ee(n.country||"China"),Pe(n.plant||"SZFTZ"),$e(n.team||"GBS"),De(n.isPublicProfile!==void 0?n.isPublicProfile:!0))},[n,u]),l.useEffect(()=>{if(!u){Oe(!1),Be(!1),Le(!1),ce("schedule"),Q([]),z([]),oe("");return}if(X)return;const t=b.emailSchedule;t&&((t.frequency==="weekly"||t.frequency==="monthly")&&Te(t.frequency),typeof t.dayOfWeek=="number"&&Re(t.dayOfWeek),typeof t.dayOfMonth=="number"&&Ie(t.dayOfMonth),t.timeOfDay&&ze(t.timeOfDay),typeof t.stopDate=="string"&&oe(t.stopDate)),Oe(!0)},[u,b.emailSchedule,X]),l.useEffect(()=>{if(!u||_)return;const t=b.emailDefaults||{};j||(typeof t.recipients=="string"&&t.recipients.trim()!==""?re(t.recipients):n&&n.email&&re(n.email)),!x&&typeof t.subject=="string"&&t.subject.trim()!==""&&ne(t.subject),Be(!0)},[u,b,_,j,x,n]),l.useEffect(()=>{u&&(f==="email"?Z("email"):f==="account"&&w==="email"&&Z("password"))},[u,f,w]),l.useEffect(()=>{if(!u||K)return;const t=b.emailConsolidate||{};typeof t.tags=="string"&&He(t.tags),typeof t.enabled=="boolean"&&Ue(t.enabled),Le(!0)},[u,b,K]),l.useEffect(()=>{u&&X&&E(t=>{const r=t.emailSchedule||{},s=typeof r.timezoneOffsetMinutes=="number"?r.timezoneOffsetMinutes:new Date().getTimezoneOffset();return{...t,emailSchedule:{...r,frequency:y,dayOfWeek:y==="weekly"?T:void 0,dayOfMonth:y==="monthly"?R:void 0,timeOfDay:G,stopDate:V||void 0,timezoneOffsetMinutes:s}}})},[y,T,R,G,V,u,X]),l.useEffect(()=>{u&&_&&E(t=>({...t,emailDefaults:{...t.emailDefaults||{},recipients:j,subject:x}}))},[j,x,u,_,E]),l.useEffect(()=>{u&&K&&E(t=>({...t,emailConsolidate:{...t.emailConsolidate||{},enabled:S,tags:M}}))},[S,M,u,K,E]),l.useEffect(()=>{u&&(g||b.latestSummaryForEmail&&(Y(b.latestSummaryForEmail),b.latestSummaryHtmlForEmail?W(b.latestSummaryHtmlForEmail):W(null)))},[u,b.latestSummaryForEmail,g]),l.useEffect(()=>{u&&(x||ne("Monthly A3 / Bowler Summary"))},[u,x]),l.useEffect(()=>{if(!u||f!=="email"||P!=="active"||!n||!n.username)return;let t=!1;return(async()=>{We(!0);try{const r=await v.listScheduledEmails(n.username);if(t)return;const s=Array.isArray(r.jobs)?r.jobs:[];s.sort((o,d)=>o.sendAt===d.sendAt?o.id.localeCompare(d.id):o.sendAt-d.sendAt),Q(s)}catch(r){t||i.error(r.message||"Failed to load active schedules")}finally{t||We(!1)}})(),()=>{t=!0}},[u,f,P,n,i]);const rt=async()=>{if(ae!==Se){i.error("New passwords don't match");return}if(!se){i.error("Please enter current password");return}$(!0);try{await Ve.changePassword({username:n==null?void 0:n.username,oldPassword:se,newPassword:ae}),i.success("Password updated successfully"),we(""),je(""),ke("")}catch(t){i.error(t.message||"Failed to update password")}finally{$(!1)}},nt=async()=>{$(!0);try{await Ve.updateProfile({username:n==null?void 0:n.username,role:Ne,profile:{country:Ae,plant:Me,team:Fe,isPublic:U}}),i.success("Profile updated successfully");try{await be()}catch(t){console.warn("Background refresh failed:",t)}}catch(t){i.error(t.message||"Failed to update profile")}finally{$(!1)}},lt=async()=>{$(!0);try{await be(!0),i.success("Profile reloaded")}catch{i.error("Failed to reload profile")}finally{$(!1)}},ot=async t=>{if(!n||!n.username){i.error("You must be logged in to cancel scheduled emails");return}Ge(t.id);try{if(await v.cancelScheduledEmail(n.username,t.id),t.mode==="autoSummary"){const s={...b};"emailSchedule"in s&&delete s.emailSchedule,E(s);const o={...s,emailDefaults:{...s.emailDefaults||{},recipients:j,subject:x},emailConsolidate:{...s.emailConsolidate||{},enabled:S,tags:M}};await ue(o),i.success("Auto summary schedule cancelled")}else i.success("Scheduled email cancelled");const a=await v.listScheduledEmails(n.username),r=Array.isArray(a.jobs)?a.jobs:[];r.sort((s,o)=>s.sendAt===o.sendAt?s.id.localeCompare(o.id):s.sendAt-o.sendAt),Q(r),z(s=>s.filter(o=>o!==t.id))}catch(a){i.error(a.message||"Failed to cancel scheduled email")}finally{Ge(null)}},it=t=>{z(a=>a.includes(t)?a.filter(r=>r!==t):[...a,t])},ct=()=>{if(p.length===I.length){z([]);return}z(I.map(t=>t.id))},dt=async()=>{if(!n||!n.username){i.error("You must be logged in to cancel scheduled emails");return}if(p.length===0){i.error("Please select at least one scheduled email to cancel");return}qe(!0);try{for(const r of p)try{await v.cancelScheduledEmail(n.username,r)}catch(s){i.error(s.message||`Failed to cancel scheduled email (${r})`)}const t=await v.listScheduledEmails(n.username),a=Array.isArray(t.jobs)?t.jobs:[];a.sort((r,s)=>r.sendAt===s.sendAt?r.id.localeCompare(s.id):r.sendAt-s.sendAt),Q(a),z([]),i.success("Selected scheduled emails cancelled")}finally{qe(!1)}},Ze=()=>{const t=b,a=t.emailSchedule||{},r=typeof a.timezoneOffsetMinutes=="number"?a.timezoneOffsetMinutes:new Date().getTimezoneOffset();return{...t,emailDefaults:{...t.emailDefaults||{},recipients:j,subject:x},emailConsolidate:{...t.emailConsolidate||{},enabled:S,tags:M},emailSchedule:{...a,frequency:y,dayOfWeek:y==="weekly"?T:void 0,dayOfMonth:y==="monthly"?R:void 0,timeOfDay:G,stopDate:V||void 0,timezoneOffsetMinutes:r}}},ue=async t=>{if(!(!n||!n.username))try{await v.saveData(xe,pe,n.username,Ke,Qe,et,tt,t)}catch(a){console.error("Failed to persist email settings to backend",a)}},ut=(t,a)=>{try{const r=t.replace(/```json/g,"").replace(/```/g,"").trim(),s=JSON.parse(r);if(!s||!s.executiveSummary)return t;let o=`Executive Overview:
${s.executiveSummary}

`;return s.a3Summary&&s.a3Summary.trim()!==""&&(o+=`A3 Problem Solving Summary:
${s.a3Summary}

`),a.length>0&&(o+=`Portfolio Statistical Table:
`,o+=`Group | Metric | Latest month | Last 2 months | Last 3 months | Linked A3s | Overall target achieving %
`,o+=`----- | ------ | ------------ | ------------- | ------------- | ---------- | --------------------------
`,a.forEach(d=>{const k=d.latestMet===null||!d.latestActual?"—":d.latestActual,A=d.fail2?"Failing":"—",N=d.fail3?"Failing":"—",c=d.fail2||d.fail3?d.linkedA3Count===0?"0":String(d.linkedA3Count):"—",h=d.achievementRate!=null?`${d.achievementRate.toFixed(0)}%`:"—";o+=`${d.groupName} | ${d.metricName} | ${k} | ${A} | ${N} | ${c} | ${h}
`}),o+=`
`),Array.isArray(s.areasOfConcern)&&s.areasOfConcern.length>0&&(o+=`Areas of Concern & Recommendations:
`,s.areasOfConcern.forEach(d=>{o+=`- ${d.metricName} (${d.groupName}): ${d.issue}
  Suggestion: ${d.suggestion}
`})),o}catch{return t}},me=t=>`<!doctype html>
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
</html>`,mt=(t,a)=>{try{const r=t.replace(/```json/g,"").replace(/```/g,"").trim(),s=JSON.parse(r);if(!s||!s.executiveSummary||!Array.isArray(s.areasOfConcern))return"";const o=c=>c.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"),d=o(s.executiveSummary),k=s.a3Summary&&s.a3Summary.trim()!==""?`<section class="card card-a3">
  <h2 class="card-title">A3 Problem Solving Summary</h2>
  <p>${o(s.a3Summary)}</p>
</section>`:"",A=a.length>0?`<section class="card card-stats">
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
        ${a.map(c=>`<tr>
          <td>${o(c.groupName)}</td>
          <td>${o(c.metricName)}</td>
          <td>${c.latestMet===null||!c.latestActual?"—":`<span class="status-pill ${c.latestMet===!1?"status-fail":"status-ok"}">${o(c.latestActual)}</span>`}</td>
          <td>${c.fail2?'<span class="status-pill status-warn"><span class="status-dot"></span>Failing</span>':"—"}</td>
          <td>${c.fail3?'<span class="status-pill status-fail"><span class="status-dot"></span>Failing</span>':"—"}</td>
          <td>${c.fail2||c.fail3?c.linkedA3Count===0?'<span class="circle-badge circle-badge-fail">0</span>':`<span class="circle-badge circle-badge-ok">${c.linkedA3Count}</span>`:"—"}</td>
          <td>${c.achievementRate!=null?`<span class="status-pill ${c.achievementRate<2/3*100?"status-fail":"status-ok"}">${c.achievementRate.toFixed(0)}%</span>`:"—"}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>
</section>`:"",N=s.areasOfConcern.length>0?s.areasOfConcern.map(c=>`<div class="concern-card">
  <div class="concern-header">
    <span class="concern-metric">${o(c.metricName)}</span>
    <span class="concern-group">${o(c.groupName)}</span>
  </div>
  <p class="concern-issue">${o(c.issue)}</p>
  <p class="concern-suggestion">${o(c.suggestion)}</p>
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

    ${A}

    ${k}

    <section class="card card-concerns">
      <h2 class="card-title">Areas of Concern & Recommendations</h2>
      ${N}
    </section>
  </div>
</body>
</html>`}catch{return""}},Je=async()=>{if(!n||!n.username){i.error("Please login to generate one-click summary");return}let t=xe,a=pe;if(S){if(!M.trim()){i.error("Please enter tags for consolidation");return}i.info("Consolidating data for summary...");try{const s=M.split(",").map(d=>d.trim()).filter(Boolean),o=await v.consolidateBowlers(s);o.success&&(t=o.bowlers,a=o.a3Cases,i.success(`Consolidated: ${t.length} metrics, ${a.length} A3s`))}catch(s){console.error("Consolidation error:",s),i.error("Failed to consolidate data for summary");return}}const r=jt(t,a);if(!r||r.length===0){i.info("No metric data available for AI summary. Please add metric data first.");return}ve(!0);try{const s=St(t,a),o=r.filter(h=>h.fail2||h.fail3),k=`You are generating a one-click portfolio summary focused on improvement opportunities.

Use the pre-computed statistical snapshot below. Do not redo statistical calculations from raw data. Rely on this snapshot instead.

Consecutive failing metrics (derived from the integrated portfolio table):
${JSON.stringify(o.map(h=>{const F=a.filter(q=>(q.linkedMetricIds||[]).includes(h.metricId)),O=F.filter(q=>(q.status||"").trim().toLowerCase()==="completed").length,xt=F.filter(q=>(q.status||"").trim().toLowerCase()!=="completed").length;return{groupName:h.groupName,metricName:h.metricName,metricId:h.metricId,latestMet:h.latestMet,fail2:h.fail2,fail3:h.fail3,achievementRate:h.achievementRate!=null?Number(h.achievementRate.toFixed(1)):null,linkedA3Total:F.length,linkedA3Completed:O,linkedA3Active:xt}}),null,2)}

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

Do not include any markdown formatting (like \`\`\`json). Just the raw JSON object.`,A=await kt(s,k,_e),N=ut(A,r),C=mt(A,r),c=C&&C.trim()!==""?C:me(N);Y(N),W(c),E({...b,latestSummaryForEmail:N,latestSummaryHtmlForEmail:c}),i.success("AI summary generated")}catch(s){console.error("Generate summary error:",s),i.error(s.message||"Failed to generate summary")}finally{ve(!1)}},ft=()=>{const t=new Date,[a,r]=G.split(":"),s=Number(a)||8,o=Number(r)||0;if(y==="weekly"){const c=new Date(t.getTime()),h=c.getDay(),F=T===7?0:T;c.setHours(s,o,0,0);let O=F-h;return(O<0||O===0&&c<=t)&&(O+=7),c.setDate(c.getDate()+O),c}const d=t.getFullYear(),k=t.getMonth(),A=new Date(d,k+1,0).getDate(),N=Math.min(R,A);let C=new Date(d,k,N,s,o,0,0);if(C<=t){const c=new Date(d,k+1,1),h=new Date(c.getFullYear(),c.getMonth()+1,0).getDate(),F=Math.min(R,h);C=new Date(c.getFullYear(),c.getMonth(),F,s,o,0,0)}return C},ht=async()=>{const t=j.split(/[,\n]/).map(r=>r.trim()).filter(r=>r.length>0);if(t.length===0){i.error("Please enter at least one recipient email");return}if(!x.trim()){i.error("Please enter an email subject");return}let a=null;if(m==="autoSummary"||m==="manualRepeat")a=ft();else{if(!le){i.error("Please choose a send date and time");return}const r=new Date(le);if(Number.isNaN(r.getTime())){i.error("Please enter a valid date and time");return}a=r}if((m==="oneTime"||m==="manualRepeat")&&!g.trim()){i.error("Please enter an email body or generate a summary");return}if((m==="autoSummary"||m==="manualRepeat")&&!(n!=null&&n.username)){i.error("You must be logged in to schedule recurring emails");return}ge(!0);try{const r=(n==null?void 0:n.username)||void 0;if(m==="autoSummary")await v.scheduleEmail({userId:r,recipients:t,subject:x.trim(),body:"",sendAt:a.toISOString(),mode:"autoSummary",aiModel:b.aiModel,fromName:"A3 Bowler",recurring:!0});else{const o=D&&D.trim()!==""?D:me(g.trim());await v.scheduleEmail({userId:r,recipients:t,subject:x.trim(),body:g.trim(),bodyHtml:o,sendAt:a.toISOString(),mode:"manual",fromName:"A3 Bowler",recurring:m==="manualRepeat"})}const s=Ze();await ue(s),i.success("Email scheduled successfully")}catch(r){i.error(r.message||"Failed to schedule email")}finally{ge(!1)}},bt=async()=>{const t=j.split(/[,\n]/).map(a=>a.trim()).filter(a=>a.length>0);if(t.length===0){i.error("Please enter at least one recipient email");return}if(!x.trim()){i.error("Please enter an email subject");return}if(!g.trim()){i.error("Please enter an email body");return}ye(!0);try{const a=(n==null?void 0:n.username)||void 0,r=D&&D.trim()!==""?D:me(g.trim());await v.sendEmailNow({userId:a,recipients:t,subject:x.trim(),body:g.trim(),bodyHtml:r,fromName:"A3 Bowler"});const s=Ze();await ue(s),i.success("Email sent successfully")}catch(a){i.error(a.message||"Failed to send email")}finally{ye(!1)}};return u?e.jsx("div",{className:"fixed inset-0 z-[70] overflow-y-auto","aria-labelledby":"modal-title",role:"dialog","aria-modal":"true",children:e.jsxs("div",{className:f==="email"?"flex min-h-screen items-stretch justify-center pt-4 px-4 pb-4 text-center sm:block sm:p-0":"flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0",children:[e.jsx("div",{className:"fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity","aria-hidden":"true",onClick:te}),e.jsx("span",{className:"hidden sm:inline-block sm:align-middle sm:h-screen","aria-hidden":"true",children:"​"}),e.jsxs("div",{className:f==="email"?"inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all w-full max-h-[calc(100vh-2rem)] max-w-5xl sm:align-middle overflow-y-auto animate-in fade-in zoom-in-95 duration-200":"inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full animate-in fade-in zoom-in-95 duration-200",children:[e.jsxs("div",{className:`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b flex justify-between items-center ${f==="email"?"bg-gradient-to-r from-brand-600 to-brand-700 border-brand-500/20":"bg-white border-slate-200"}`,children:[e.jsx("h3",{className:`text-lg leading-6 font-bold ${f==="email"?"text-white":"text-slate-900"}`,id:"modal-title",children:f==="email"?"Email Scheduling":"Account Settings"}),e.jsx("button",{onClick:te,className:`${f==="email"?"text-white/70 hover:text-white":"text-slate-400 hover:text-slate-600"} transition-colors`,children:e.jsx(Ye,{className:"h-5 w-5"})})]}),f!=="email"&&e.jsxs("div",{className:"flex border-b border-slate-200",children:[e.jsxs("button",{className:`flex-1 py-3 text-sm font-bold text-center flex items-center justify-center space-x-2 border-b-2 transition-colors ${w==="password"?"border-brand-500 text-brand-600":"border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`,onClick:()=>Z("password"),children:[e.jsx(fe,{className:"w-4 h-4"}),e.jsx("span",{children:"Password"})]}),e.jsxs("button",{className:`flex-1 py-3 text-sm font-bold text-center flex items-center justify-center space-x-2 border-b-2 transition-colors ${w==="profile"?"border-brand-500 text-brand-600":"border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`,onClick:()=>Z("profile"),children:[e.jsx(Nt,{className:"w-4 h-4"}),e.jsx("span",{children:"Profile"})]})]}),e.jsxs("div",{className:"px-6 py-6",children:[f!=="email"&&n&&e.jsxs("div",{className:"mb-6 flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-gray-500",children:"User: "}),e.jsx("span",{className:"font-semibold text-blue-600",children:n==null?void 0:n.username})]}),e.jsx("button",{onClick:lt,className:"p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors",title:"Reload Profile from Server",children:e.jsx(Ct,{className:`w-4 h-4 ${B?"animate-spin":""}`})})]}),f==="account"&&w==="password"&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-medium text-gray-500 uppercase mb-1",children:"Current Password"}),e.jsxs("div",{className:"relative",children:[e.jsx(fe,{className:"absolute left-3 top-2.5 h-4 w-4 text-gray-400"}),e.jsx("input",{type:"password",value:se,onChange:t=>we(t.target.value),placeholder:"Enter current password",className:"pl-9 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5",children:"New Password"}),e.jsxs("div",{className:"relative",children:[e.jsx(fe,{className:"absolute left-3 top-3 h-4 w-4 text-slate-400"}),e.jsx("input",{type:"password",value:ae,onChange:t=>je(t.target.value),placeholder:"Enter new password",className:"pl-9 block w-full rounded-xl border-slate-200 bg-slate-50 focus:border-brand-500 focus:ring-brand-500 sm:text-sm transition-shadow shadow-sm p-3"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5",children:"Confirm New Password"}),e.jsxs("div",{className:"relative",children:[e.jsx(vt,{className:"absolute left-3 top-3 h-4 w-4 text-slate-400"}),e.jsx("input",{type:"password",value:Se,onChange:t=>ke(t.target.value),placeholder:"Confirm new password",className:"pl-9 block w-full rounded-xl border-slate-200 bg-slate-50 focus:border-brand-500 focus:ring-brand-500 sm:text-sm transition-shadow shadow-sm p-3"})]})]})]}),f==="account"&&w==="profile"&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5",children:"Role"}),e.jsx("input",{type:"text",value:Ne,onChange:t=>Ce(t.target.value),className:"block w-full rounded-xl border-slate-200 bg-slate-50 focus:border-brand-500 focus:ring-brand-500 sm:text-sm transition-shadow shadow-sm p-3"})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5",children:"Region"}),e.jsxs("select",{value:Ae,onChange:t=>Ee(t.target.value),className:"block w-full rounded-xl border-slate-200 bg-slate-50 focus:border-brand-500 focus:ring-brand-500 sm:text-sm transition-shadow shadow-sm p-3",children:[e.jsx("option",{value:"China",children:"China"}),e.jsx("option",{value:"US",children:"US"}),e.jsx("option",{value:"EMEA",children:"EMEA"}),e.jsx("option",{value:"APAC",children:"APAC"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5",children:"Plant/Office"}),e.jsxs("select",{value:Me,onChange:t=>Pe(t.target.value),className:"block w-full rounded-xl border-slate-200 bg-slate-50 focus:border-brand-500 focus:ring-brand-500 sm:text-sm transition-shadow shadow-sm p-3",children:[e.jsx("option",{value:"BJ",children:"BJ"}),e.jsx("option",{value:"SH",children:"SH"}),e.jsx("option",{value:"TW",children:"TW"}),e.jsx("option",{value:"SZFTZ",children:"SZFTZ"}),e.jsx("option",{value:"SZBAN",children:"SZBAN"}),e.jsx("option",{value:"EM1",children:"EM1"}),e.jsx("option",{value:"EM5",children:"EM5"}),e.jsx("option",{value:"LOV",children:"LOV"}),e.jsx("option",{value:"PU3",children:"PU3"})]})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5",children:"Functional Team"}),e.jsxs("select",{value:Fe,onChange:t=>$e(t.target.value),className:"block w-full rounded-xl border-slate-200 bg-slate-50 focus:border-brand-500 focus:ring-brand-500 sm:text-sm transition-shadow shadow-sm p-3",children:[e.jsx("option",{value:"Commercial",children:"Commercial"}),e.jsx("option",{value:"SC",children:"SC"}),e.jsx("option",{value:"Technical",children:"Technical"})]})]}),e.jsx("div",{className:"pt-2",children:e.jsxs("div",{className:"border border-slate-200 rounded-xl bg-slate-50/50 p-4 flex items-center justify-between shadow-sm",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-bold text-slate-900",children:"Public Profile"}),e.jsx("p",{className:"text-xs text-slate-500 font-medium",children:"Allow others to consolidate your bowlers"})]}),e.jsx("button",{type:"button",className:`${U?"bg-brand-600":"bg-slate-200"} relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500`,role:"switch","aria-checked":U,onClick:()=>De(!U),children:e.jsx("span",{className:`${U?"translate-x-5":"translate-x-0"} pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`})})]})})]}),f==="email"&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex bg-slate-100/80 p-1.5 gap-1.5 rounded-xl mb-6 ring-1 ring-slate-200/50",children:[e.jsx("button",{type:"button",className:`flex-1 py-2.5 text-sm font-medium text-center rounded-lg transition-all duration-200 ${P==="schedule"?"bg-white text-brand-600 shadow-sm ring-1 ring-black/5 font-bold":"text-slate-500 hover:text-slate-700 hover:bg-white/50"}`,onClick:()=>ce("schedule"),children:"Schedule New"}),e.jsx("button",{type:"button",className:`flex-1 py-2.5 text-sm font-medium text-center rounded-lg transition-all duration-200 ${P==="active"?"bg-white text-brand-600 shadow-sm ring-1 ring-black/5 font-bold":"text-slate-500 hover:text-slate-700 hover:bg-white/50"}`,onClick:()=>ce("active"),children:"Active Schedules"})]}),P==="schedule"&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5",children:"Recipients"}),e.jsx("textarea",{value:j,onChange:t=>re(t.target.value),rows:2,placeholder:"user1@example.com, user2@example.com",className:"block w-full rounded-xl border-slate-200 bg-slate-50 focus:border-brand-500 focus:ring-brand-500 sm:text-sm transition-shadow shadow-sm p-3"}),e.jsx("p",{className:"mt-1.5 text-xs text-slate-400 font-medium",children:"Separate multiple emails with commas or new lines."})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5",children:"Subject"}),e.jsx("input",{type:"text",value:x,onChange:t=>ne(t.target.value),placeholder:"Monthly A3 / metric summary",className:"block w-full rounded-xl border-slate-200 bg-slate-50 focus:border-brand-500 focus:ring-brand-500 sm:text-sm transition-shadow shadow-sm p-3"})]}),e.jsxs("div",{className:"mt-6",children:[e.jsx("label",{className:"block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3",children:"Scheduling Mode"}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4",children:[e.jsxs("button",{type:"button",className:`px-3 py-3 text-center flex flex-col items-center justify-center gap-2 rounded-xl border transition-all duration-200 ${m==="autoSummary"?"bg-brand-50/50 border-brand-200 text-brand-700 ring-1 ring-brand-200 shadow-sm":"bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"}`,onClick:()=>ie("autoSummary"),children:[e.jsx("div",{className:`p-2 rounded-lg ${m==="autoSummary"?"bg-brand-100 text-brand-600":"bg-slate-100 text-slate-400"}`,children:e.jsx(Xe,{className:"w-5 h-5"})}),e.jsx("span",{className:"text-xs font-bold",children:"Auto Summary"})]}),e.jsxs("button",{type:"button",className:`px-3 py-3 text-center flex flex-col items-center justify-center gap-2 rounded-xl border transition-all duration-200 ${m==="manualRepeat"?"bg-emerald-50/50 border-emerald-200 text-emerald-700 ring-1 ring-emerald-200 shadow-sm":"bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"}`,onClick:()=>ie("manualRepeat"),children:[e.jsx("div",{className:`p-2 rounded-lg ${m==="manualRepeat"?"bg-emerald-100 text-emerald-600":"bg-slate-100 text-slate-400"}`,children:e.jsx(Xe,{className:"w-5 h-5"})}),e.jsx("span",{className:"text-xs font-bold",children:"Manual Content"})]}),e.jsxs("button",{type:"button",className:`px-3 py-3 text-center flex flex-col items-center justify-center gap-2 rounded-xl border transition-all duration-200 ${m==="oneTime"?"bg-purple-50/50 border-purple-200 text-purple-700 ring-1 ring-purple-200 shadow-sm":"bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"}`,onClick:()=>ie("oneTime"),children:[e.jsx("div",{className:`p-2 rounded-lg ${m==="oneTime"?"bg-purple-100 text-purple-600":"bg-slate-100 text-slate-400"}`,children:e.jsx(wt,{className:"w-5 h-5"})}),e.jsx("span",{className:"text-xs font-bold",children:"One-time Send"})]})]}),e.jsxs("div",{className:"p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4 shadow-sm",children:[(m==="autoSummary"||m==="manualRepeat")&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5",children:"Repeat"}),e.jsxs("select",{value:y,onChange:t=>Te(t.target.value),className:"block w-full rounded-xl border-slate-200 bg-white focus:border-brand-500 focus:ring-brand-500 sm:text-sm transition-shadow shadow-sm p-2.5",children:[e.jsx("option",{value:"weekly",children:"Every week"}),e.jsx("option",{value:"monthly",children:"Every month"})]})]}),e.jsx("div",{children:y==="weekly"?e.jsxs(e.Fragment,{children:[e.jsx("label",{className:"block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5",children:"Day of Week"}),e.jsxs("select",{value:T,onChange:t=>Re(Number(t.target.value)),className:"block w-full rounded-xl border-slate-200 bg-white focus:border-brand-500 focus:ring-brand-500 sm:text-sm transition-shadow shadow-sm p-2.5",children:[e.jsx("option",{value:1,children:"Monday"}),e.jsx("option",{value:2,children:"Tuesday"}),e.jsx("option",{value:3,children:"Wednesday"}),e.jsx("option",{value:4,children:"Thursday"}),e.jsx("option",{value:5,children:"Friday"}),e.jsx("option",{value:6,children:"Saturday"}),e.jsx("option",{value:7,children:"Sunday"})]})]}):e.jsxs(e.Fragment,{children:[e.jsx("label",{className:"block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5",children:"Date of Month"}),e.jsx("select",{value:R,onChange:t=>Ie(Number(t.target.value)),className:"block w-full rounded-xl border-slate-200 bg-white focus:border-brand-500 focus:ring-brand-500 sm:text-sm transition-shadow shadow-sm p-2.5",children:Array.from({length:31},(t,a)=>a+1).map(t=>e.jsx("option",{value:t,children:t},t))})]})}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5",children:"Time"}),e.jsx("input",{type:"time",value:G,onChange:t=>ze(t.target.value),className:"block w-full rounded-xl border-slate-200 bg-white focus:border-brand-500 focus:ring-brand-500 sm:text-sm transition-shadow shadow-sm p-2.5"})]})]}),e.jsxs("div",{className:"mt-3",children:[e.jsx("label",{className:"block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5",children:"Repeat Until (optional)"}),e.jsx("input",{type:"date",value:V,onChange:t=>oe(t.target.value),className:"block w-full rounded-xl border-slate-200 bg-white focus:border-brand-500 focus:ring-brand-500 sm:text-sm transition-shadow shadow-sm p-2.5"}),e.jsx("p",{className:"mt-1.5 text-xs text-slate-400 font-medium",children:"After this date, recurring emails will stop automatically."})]}),m==="autoSummary"&&e.jsxs("div",{className:"mt-4 border-t border-slate-200 pt-4 space-y-3",children:[e.jsxs("div",{className:"flex items-start justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-bold text-slate-700 mb-0.5",children:"Consolidate before summary"}),e.jsx("p",{className:"text-xs text-slate-500 font-medium",children:"When enabled, consolidate tagged bowlers and A3 cases before generating the summary email."})]}),e.jsx("button",{type:"button",className:`${S?"bg-brand-600":"bg-slate-200"} relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500`,role:"switch","aria-checked":S,onClick:()=>Ue(!S),children:e.jsx("span",{className:`${S?"translate-x-5":"translate-x-0"} pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5",children:"Consolidate tags"}),e.jsx("input",{type:"text",value:M,onChange:t=>He(t.target.value),placeholder:"e.g. Technical, Q1, Portfolio",className:"block w-full rounded-xl border-slate-200 bg-white focus:border-brand-500 focus:ring-brand-500 sm:text-sm transition-shadow shadow-sm p-2.5"}),e.jsx("p",{className:"mt-1.5 text-xs text-slate-400 font-medium",children:"Tags are matched during consolidation before each scheduled summary email."})]})]}),m==="manualRepeat"&&e.jsxs("div",{className:"mt-4 space-y-3 border-t border-slate-200 pt-4",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("label",{className:"block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5",children:"Message"}),e.jsx("button",{type:"button",className:"text-xs px-3 py-1.5 rounded-lg border border-brand-200 text-brand-600 bg-brand-50 hover:bg-brand-100 font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed",onClick:Je,disabled:J||L||H,children:J?"Generating…":"Generate summary"})]}),e.jsx("textarea",{value:g,onChange:t=>{Y(t.target.value),W(null)},rows:4,placeholder:"Add the summary or message you want to email.",className:"block w-full rounded-xl border-slate-200 bg-white focus:border-brand-500 focus:ring-brand-500 sm:text-sm transition-shadow shadow-sm p-3"})]})]}),m==="oneTime"&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5",children:"Send At"}),e.jsx("input",{type:"datetime-local",value:le,onChange:t=>st(t.target.value),className:"block w-full rounded-xl border-slate-200 bg-white focus:border-brand-500 focus:ring-brand-500 sm:text-sm transition-shadow shadow-sm p-2.5"})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between mb-1.5",children:[e.jsx("label",{className:"block text-xs font-bold text-slate-500 uppercase tracking-wider",children:"Message"}),e.jsx("button",{type:"button",className:"text-xs px-3 py-1.5 rounded-lg border border-brand-200 text-brand-600 bg-brand-50 hover:bg-brand-100 font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed",onClick:Je,disabled:J||L||H,children:J?"Generating…":"Generate summary"})]}),e.jsx("textarea",{value:g,onChange:t=>{Y(t.target.value),W(null)},rows:4,placeholder:"Add the summary or message you want to email.",className:"block w-full rounded-xl border-slate-200 bg-white focus:border-brand-500 focus:ring-brand-500 sm:text-sm transition-shadow shadow-sm p-3"})]})]})]})]})]}),P==="active"&&e.jsxs("div",{className:"space-y-3",children:[de&&e.jsx("p",{className:"text-sm text-gray-500",children:"Loading active schedules..."}),!de&&I.length===0&&e.jsx("p",{className:"text-sm text-gray-500",children:"No active scheduled emails."}),!de&&I.length>0&&e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsxs("label",{className:"flex items-center gap-2 text-xs font-bold text-slate-600",children:[e.jsx("input",{type:"checkbox",className:"rounded border-slate-300 text-brand-600 focus:ring-brand-500",checked:p.length>0&&p.length===I.length,onChange:ct}),e.jsx("span",{children:"Select all"})]}),e.jsxs("button",{type:"button",onClick:dt,disabled:p.length===0||ee,className:"inline-flex items-center px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm",children:[ee?"Cancelling...":"Cancel selected",p.length>0&&!ee&&e.jsx("span",{className:"ml-1 bg-rose-200 px-1.5 rounded-full text-[10px]",children:p.length})]})]}),I.map(t=>e.jsxs("div",{className:`flex items-center justify-between gap-3 p-4 border rounded-xl transition-all duration-200 group ${p.includes(t.id)?"bg-brand-50/30 border-brand-200 shadow-sm":"bg-white border-slate-200 hover:shadow-md hover:border-brand-200"}`,children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("input",{type:"checkbox",className:"w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 transition-colors cursor-pointer",checked:p.includes(t.id),onChange:()=>it(t.id)}),e.jsxs("div",{children:[e.jsx("p",{className:`text-sm font-bold transition-colors ${p.includes(t.id)?"text-brand-700":"text-slate-800 group-hover:text-brand-700"}`,children:t.subject}),e.jsxs("p",{className:"text-xs text-slate-500 font-medium mt-0.5",children:[t.mode==="autoSummary"?"Auto summary (recurring)":t.mode==="manual"&&t.recurring?"Manual (recurring)":"One-time"," ","· ",e.jsx("span",{className:"text-slate-400",children:"Next:"})," ",new Date(t.sendAt).toLocaleString()]})]})]}),e.jsx("button",{type:"button",className:"inline-flex items-center justify-center rounded-lg p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all",onClick:()=>ot(t),disabled:at===t.id||ee,children:e.jsx(Ye,{className:"w-4 h-4"})})]},t.id))]})]})]})]}),e.jsxs("div",{className:"bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse",children:[f==="account"&&w==="password"&&e.jsx("button",{type:"button",className:"w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2.5 bg-brand-600 text-base font-bold text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 sm:ml-3 sm:w-auto sm:text-sm transition-all",onClick:rt,disabled:B,children:B?"Updating...":"Update Password"}),f==="account"&&w==="profile"&&e.jsx("button",{type:"button",className:"w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2.5 bg-brand-600 text-base font-bold text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 sm:ml-3 sm:w-auto sm:text-sm transition-all",onClick:nt,disabled:B,children:B?"Saving...":"Save Profile"}),f==="email"&&P==="schedule"&&e.jsxs(e.Fragment,{children:[e.jsx("button",{type:"button",className:"w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2.5 bg-brand-600 text-base font-bold text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 sm:ml-3 sm:w-auto sm:text-sm transition-all",onClick:ht,disabled:L||H,children:L?"Scheduling...":m==="autoSummary"?"Schedule auto summary":m==="manualRepeat"?"Schedule recurring manual email":"Schedule one-time email"}),m==="oneTime"&&e.jsx("button",{type:"button",className:"mt-3 w-full inline-flex justify-center rounded-xl border border-brand-200 shadow-sm px-4 py-2.5 bg-white text-base font-bold text-brand-600 hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all",onClick:bt,disabled:H||L,children:H?"Sending...":"Send Now"})]}),e.jsx("button",{type:"button",className:"mt-3 w-full inline-flex justify-center rounded-xl border border-slate-200 shadow-sm px-4 py-2.5 bg-white text-base font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all",onClick:te,children:w==="password"?"Cancel":"Close"})]})]})]})}):null};export{Mt as AccountSettingsModal};
