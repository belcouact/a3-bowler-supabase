const y=e=>{if(e.length===0)return{mean:0,stdDev:0,min:0,max:0};const n=e.reduce((t,o)=>t+o,0)/e.length,s=e.reduce((t,o)=>t+Math.pow(o-n,2),0)/e.length,c=Math.sqrt(s);return{mean:n,stdDev:c,min:Math.min(...e),max:Math.max(...e)}},f=e=>{const i=e.match(/^(?:\{|\[)?\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:\}|\])?$/);if(i)return{min:parseFloat(i[1]),max:parseFloat(i[2])};const n=parseFloat(e);return isNaN(n)?{}:{val:n}},b=async(e,i)=>{var u,l,p;const n=Object.keys(e.monthlyData||{}).sort(),s=[],c=[];n.forEach(r=>{var d;const a=(d=e.monthlyData)==null?void 0:d[r];if(a&&a.actual){s.push({month:r,actual:a.actual,target:a.target||"N/A"});const g=parseFloat(a.actual);isNaN(g)||c.push(g)}});const t=y(c);let o="Not calculated (insufficient data or complex targets).";if(c.length>=3&&s.length>0){const r=s[s.length-1].target,a=f(r),d=e.targetMeetingRule||"gte";if(d==="within_range"&&a.min!==void 0&&a.max!==void 0&&t.stdDev>0){const g=(t.mean-a.min)/(3*t.stdDev),m=(a.max-t.mean)/(3*t.stdDev);o=`Cpk: ${Math.min(g,m).toFixed(2)} (Target Range: ${a.min} - ${a.max})`}else d==="gte"&&a.val!==void 0&&t.stdDev>0?o=`Cpk (One-sided Lower): ${((t.mean-a.val)/(3*t.stdDev)).toFixed(2)} (Target >= ${a.val})`:d==="lte"&&a.val!==void 0&&t.stdDev>0&&(o=`Cpk (One-sided Upper): ${((a.val-t.mean)/(3*t.stdDev)).toFixed(2)} (Target <= ${a.val})`)}if(s.length===0)return{trend:"stable",achievementRate:0,suggestion:[],summary:"No data available for analysis."};const h=`
  You are an expert quality engineer and data analyst. Perform a deep statistical analysis of the following metric.

  Metric Context:
  - Name: "${e.name}"
  - Definition: "${e.definition||"N/A"}"
  - Attribute: "${e.attribute||"Individual Data"}" (Use this to interpret if data is accumulative or snapshot).
  - Target Meeting Rule: "${e.targetMeetingRule||"gte"}"
  
  Statistical Data (Calculated):
  - Mean: ${t.mean.toFixed(2)}
  - Std Dev: ${t.stdDev.toFixed(2)}
  - Min: ${t.min}
  - Max: ${t.max}
  - Process Capability: ${o}

  Raw Data (Month | Actual | Target):
  ${s.map(r=>`${r.month} | ${r.actual} | ${r.target}`).join(`
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

  4. **Summary:** Provide a professional statistical summary. Mention stability (variation), capability (meeting targets), and any significant shifts. Avoid generic phrases.

  Response Format (JSON ONLY):
  {
    "trend": "capable" | "stable" | "improving" | "degrading" | "unstable" | "incapable",
    "achievementRate": number,
    "suggestion": string[],
    "summary": "string"
  }
  `;try{const r=await fetch("https://multi-model-worker.study-llm.me/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:i,messages:[{role:"system",content:"You are a helpful data analysis assistant that outputs strictly JSON."},{role:"user",content:h}],stream:!1})});if(!r.ok)throw new Error(`API Error: ${r.statusText}`);const g=(((p=(l=(u=(await r.json()).choices)==null?void 0:u[0])==null?void 0:l.message)==null?void 0:p.content)||"{}").replace(/```json/g,"").replace(/```/g,"").trim(),m=JSON.parse(g);return{trend:m.trend||"stable",achievementRate:typeof m.achievementRate=="number"?m.achievementRate:0,suggestion:Array.isArray(m.suggestion)?m.suggestion:[],summary:m.summary||"Could not generate summary."}}catch(r){return console.error("AI Analysis Error:",r),{trend:"stable",achievementRate:0,suggestion:["Error connecting to AI service."],summary:"Failed to analyze data."}}},w=async(e,i,n)=>{var s,c,t,o,h,u;try{const l=await fetch("https://multi-model-worker.study-llm.me/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:n,messages:[{role:"system",content:`You are an AI assistant for the Metric Bowler & A3 Problem Solving application. 
            Here is the current data in the application: ${e}.
            Answer the user's questions based on this data. Be concise and helpful.`},{role:"user",content:i}],stream:!1})});if(!l.ok)throw new Error(`API Error: ${l.statusText}`);const p=await l.json();return((t=(c=(s=p.choices)==null?void 0:s[0])==null?void 0:c.message)==null?void 0:t.content)||((u=(h=(o=p.choices)==null?void 0:o[0])==null?void 0:h.delta)==null?void 0:u.content)||"Sorry, I couldn't generate a response."}catch(l){return console.error("AI Summary Error:",l),"Sorry, there was an error generating the summary. Please try again later."}},$=(e,i)=>JSON.stringify({bowlers:e.map(n=>({...n,group:n.group||"Ungrouped"})),a3Cases:i.map(n=>{const s={...n};return delete s.mindMapNodes,delete s.dataAnalysisImages,delete s.resultImages,delete s.dataAnalysisCanvasHeight,delete s.resultCanvasHeight,s})});export{b as analyzeMetric,$ as generateAIContext,w as generateComprehensiveSummary};
