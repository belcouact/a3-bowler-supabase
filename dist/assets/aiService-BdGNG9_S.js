const w=t=>{if(t.length===0)return{mean:0,stdDev:0,min:0,max:0};const n=t.reduce((l,a)=>l+a,0)/t.length,r=t.reduce((l,a)=>l+Math.pow(a-n,2),0)/t.length,o=Math.sqrt(r);return{mean:n,stdDev:o,min:Math.min(...t),max:Math.max(...t)}},A=t=>{const i=t.match(/^(?:\{|\[)?\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:\}|\])?$/);if(i)return{min:parseFloat(i[1]),max:parseFloat(i[2])};const n=parseFloat(t);return isNaN(n)?{}:{val:n}},C=async(t,i,n)=>{var f,y,v;const r=Object.keys(t.monthlyData||{}).sort(),o=[],l=[];r.forEach(e=>{var u;const s=(u=t.monthlyData)==null?void 0:u[e];if(s&&s.actual){o.push({month:e,actual:s.actual,target:s.target||"N/A"});const c=parseFloat(s.actual);isNaN(c)||l.push(c)}});const a=w(l),p=(n||[]).filter(e=>(e.status||"").trim().toLowerCase()==="completed"),h=(n||[]).filter(e=>(e.status||"").trim().toLowerCase()!=="completed"),m=p.length===0&&h.length===0?"No A3 cases are currently linked to this metric.":JSON.stringify({completedA3s:p.map(e=>({id:e.id,title:e.title,owner:e.owner,group:e.group,tag:e.tag,startDate:e.startDate,endDate:e.endDate})),otherA3s:h.map(e=>({id:e.id,title:e.title,owner:e.owner,group:e.group,tag:e.tag,status:e.status,startDate:e.startDate,endDate:e.endDate}))},null,2);let g="Not calculated (insufficient data or complex targets).";if(l.length>=3&&o.length>0){const e=o[o.length-1].target,s=A(e),u=t.targetMeetingRule||"gte";if(u==="within_range"&&s.min!==void 0&&s.max!==void 0&&a.stdDev>0){const c=(a.mean-s.min)/(3*a.stdDev),d=(s.max-a.mean)/(3*a.stdDev);g=`Cpk: ${Math.min(c,d).toFixed(2)} (Target Range: ${s.min} - ${s.max})`}else u==="gte"&&s.val!==void 0&&a.stdDev>0?g=`Cpk (One-sided Lower): ${((a.mean-s.val)/(3*a.stdDev)).toFixed(2)} (Target >= ${s.val})`:u==="lte"&&s.val!==void 0&&a.stdDev>0&&(g=`Cpk (One-sided Upper): ${((s.val-a.mean)/(3*a.stdDev)).toFixed(2)} (Target <= ${s.val})`)}if(o.length===0)return{trend:"stable",achievementRate:0,suggestion:[],summary:"No data available for analysis."};const b=`
  You are an expert quality engineer and data analyst. Perform a deep statistical analysis of the following metric.

  Metric Context:
  - Name: "${t.name}"
  - Definition: "${t.definition||"N/A"}"
  - Attribute: "${t.attribute||"Individual Data"}" (Use this to interpret if data is accumulative or snapshot).
  - Target Meeting Rule: "${t.targetMeetingRule||"gte"}"
  
  Statistical Data (Calculated):
  - Mean: ${a.mean.toFixed(2)}
  - Std Dev: ${a.stdDev.toFixed(2)}
  - Min: ${a.min}
  - Max: ${a.max}
  - Process Capability: ${g}

  Linked A3 Problem-Solving Context (for this metric only):
  ${m}

  Raw Data (Month | Actual | Target):
  ${o.map(e=>`${e.month} | ${e.actual} | ${e.target}`).join(`
`)}

  Instructions:
  1. **Classify the Process State (Trend):** Choose ONE of the following based on stability and capability:
     - "capable": Process is stable AND consistently meets targets (high Cpk or 100% achievement with low variance).
     - "stable": Process is predictable (low variance) but might not meet all targets.
     - "improving": Clear trend in the positive direction (closer to target).
     - "degrading": Clear trend in the negative direction (away from target).
     - "unstable": High variance, unpredictable, erratic swings.
     - "incapable": Stable but consistently fails to meet targets.
  
  2. **Calculate Achievement Rate:** % of points meeting the target.

  3. **Suggestions:** Provide 3-5 specific, actionable suggestions. 
     - If "unstable", suggest looking for special causes of variation.
     - If "incapable", suggest process redesign or resource adjustment.
     - If "improving", suggest standardizing the new methods.
     - Relate suggestions to the Metric Definition and Attribute.

  4. **Completed A3 Effectiveness and Next Step:**
     - If there are linked A3 cases, especially any with status "Completed", briefly assess whether performance appears to have improved after the A3 end date based on the data.
     - Comment explicitly on whether the completed A3 work appears effective or not.
     - Recommend the most appropriate next step (for example: sustain and standardize gains, run follow-up verification, extend or revise the A3, or initiate a new A3 with a different problem focus).
     - If there are no linked A3 cases and the process is unstable, degrading, or incapable, explicitly recommend starting an A3 and outline the likely problem focus.

  5. **Summary:** Provide a professional statistical summary. Mention stability (variation), capability (meeting targets), any significant shifts, and how current or future A3 work should focus on this metric. Avoid generic phrases.

  Response Format (JSON ONLY):
  {
    "trend": "capable" | "stable" | "improving" | "degrading" | "unstable" | "incapable",
    "achievementRate": number,
    "suggestion": string[],
    "summary": "string"
  }
  `;try{const e=await fetch("https://multi-model-worker.study-llm.me/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:i,messages:[{role:"system",content:"You are a helpful data analysis assistant that outputs strictly JSON."},{role:"user",content:b}],stream:!1})});if(!e.ok)throw new Error(`API Error: ${e.statusText}`);const c=(((v=(y=(f=(await e.json()).choices)==null?void 0:f[0])==null?void 0:y.message)==null?void 0:v.content)||"{}").replace(/```json/g,"").replace(/```/g,"").trim(),d=JSON.parse(c);return{trend:d.trend||"stable",achievementRate:typeof d.achievementRate=="number"?d.achievementRate:0,suggestion:Array.isArray(d.suggestion)?d.suggestion:[],summary:d.summary||"Could not generate summary."}}catch(e){return console.error("AI Analysis Error:",e),{trend:"stable",achievementRate:0,suggestion:["Error connecting to AI service."],summary:"Failed to analyze data."}}},D=async(t,i,n)=>{var r,o,l,a,p,h;try{const m=await fetch("https://multi-model-worker.study-llm.me/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:n,messages:[{role:"system",content:`You are an AI assistant for the Metric Bowler & A3 Problem Solving application. 
            Here is the current data in the application: ${t}.
            Answer the user's questions based on this data. Be concise and helpful.`},{role:"user",content:i}],stream:!1})});if(!m.ok)throw new Error(`API Error: ${m.statusText}`);const g=await m.json();return((l=(o=(r=g.choices)==null?void 0:r[0])==null?void 0:o.message)==null?void 0:l.content)||((h=(p=(a=g.choices)==null?void 0:a[0])==null?void 0:p.delta)==null?void 0:h.content)||"Sorry, I couldn't generate a response."}catch(m){return console.error("AI Summary Error:",m),"Sorry, there was an error generating the summary. Please try again later."}},$=(t,i)=>JSON.stringify({bowlers:t.map(n=>({...n,group:n.group||"Ungrouped"})),a3Cases:i.map(n=>{const r={...n};return delete r.mindMapNodes,delete r.dataAnalysisImages,delete r.resultImages,delete r.dataAnalysisCanvasHeight,delete r.resultCanvasHeight,r})});export{C as analyzeMetric,$ as generateAIContext,D as generateComprehensiveSummary};
