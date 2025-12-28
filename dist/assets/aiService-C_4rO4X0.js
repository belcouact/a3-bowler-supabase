const x=a=>{if(a.length===0)return{mean:0,stdDev:0,min:0,max:0};const o=a.reduce((l,n)=>l+n,0)/a.length,i=a.reduce((l,n)=>l+Math.pow(n-o,2),0)/a.length,c=Math.sqrt(i);return{mean:o,stdDev:c,min:Math.min(...a),max:Math.max(...a)}},S=a=>{const d=a.match(/^(?:\{|\[)?\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:\}|\])?$/);if(d)return{min:parseFloat(d[1]),max:parseFloat(d[2])};const o=parseFloat(a);return isNaN(o)?{}:{val:o}},C=async(a,d,o)=>{var u,v,b;const i=Object.keys(a.monthlyData||{}).sort(),c=[],l=[];i.forEach(e=>{var y;const r=(y=a.monthlyData)==null?void 0:y[e];if(r&&r.actual){c.push({month:e,actual:r.actual,target:r.target||"N/A"});const h=parseFloat(r.actual);isNaN(h)||l.push(h)}});const n=x(l),g=(o||[]).filter(e=>(e.status||"").trim().toLowerCase()==="completed"),s=(o||[]).filter(e=>(e.status||"").trim().toLowerCase()!=="completed"),m=g.length===0&&s.length===0?"No A3 cases are currently linked to this metric.":JSON.stringify({completedA3s:g.map(e=>({id:e.id,title:e.title,owner:e.owner,group:e.group,tag:e.tag,startDate:e.startDate,endDate:e.endDate})),otherA3s:s.map(e=>({id:e.id,title:e.title,owner:e.owner,group:e.group,tag:e.tag,status:e.status,startDate:e.startDate,endDate:e.endDate}))},null,2);let p="Not calculated (insufficient data or complex targets).";if(l.length>=3&&c.length>0){const e=c[c.length-1].target,r=S(e),y=a.targetMeetingRule||"gte";if(y==="within_range"&&r.min!==void 0&&r.max!==void 0&&n.stdDev>0){const h=(n.mean-r.min)/(3*n.stdDev),t=(r.max-n.mean)/(3*n.stdDev);p=`Cpk: ${Math.min(h,t).toFixed(2)} (Target Range: ${r.min} - ${r.max})`}else y==="gte"&&r.val!==void 0&&n.stdDev>0?p=`Cpk (One-sided Lower): ${((n.mean-r.val)/(3*n.stdDev)).toFixed(2)} (Target >= ${r.val})`:y==="lte"&&r.val!==void 0&&n.stdDev>0&&(p=`Cpk (One-sided Upper): ${((r.val-n.mean)/(3*n.stdDev)).toFixed(2)} (Target <= ${r.val})`)}if(c.length===0)return{trend:"stable",achievementRate:0,suggestion:[],summary:"No data available for analysis."};const w=`
  You are an expert quality engineer and data analyst. Perform a deep statistical analysis of the following metric.

  Metric Context:
  - Name: "${a.name}"
  - Definition: "${a.definition||"N/A"}"
  - Attribute: "${a.attribute||"Individual Data"}" (Use this to interpret if data is accumulative or snapshot).
  - Target Meeting Rule: "${a.targetMeetingRule||"gte"}"
  
  Statistical Data (Calculated):
  - Mean: ${n.mean.toFixed(2)}
  - Std Dev: ${n.stdDev.toFixed(2)}
  - Min: ${n.min}
  - Max: ${n.max}
  - Process Capability: ${p}

  Linked A3 Problem-Solving Context (for this metric only):
  ${m}

  Raw Data (Month | Actual | Target):
  ${c.map(e=>`${e.month} | ${e.actual} | ${e.target}`).join(`
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
  `;try{const e=await fetch("https://multi-model-worker.study-llm.me/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:d,messages:[{role:"system",content:"You are a helpful data analysis assistant that outputs strictly JSON."},{role:"user",content:w}],stream:!1})});if(!e.ok)throw new Error(`API Error: ${e.statusText}`);const h=(((b=(v=(u=(await e.json()).choices)==null?void 0:u[0])==null?void 0:v.message)==null?void 0:b.content)||"{}").replace(/```json/g,"").replace(/```/g,"").trim(),t=JSON.parse(h);return{trend:t.trend||"stable",achievementRate:typeof t.achievementRate=="number"?t.achievementRate:0,suggestion:Array.isArray(t.suggestion)?t.suggestion:[],summary:t.summary||"Could not generate summary."}}catch(e){return console.error("AI Analysis Error:",e),{trend:"stable",achievementRate:0,suggestion:["Error connecting to AI service."],summary:"Failed to analyze data."}}},$=async(a,d,o)=>{var i,c,l,n,g,s;try{const m=await fetch("https://multi-model-worker.study-llm.me/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:o,messages:[{role:"system",content:`You are an AI assistant for the Metric Bowler & A3 Problem Solving application. 
            Here is the current data in the application: ${a}.
            Answer the user's questions based on this data. Be concise and helpful.`},{role:"user",content:d}],stream:!1})});if(!m.ok)throw new Error(`API Error: ${m.statusText}`);const p=await m.json();return((l=(c=(i=p.choices)==null?void 0:i[0])==null?void 0:c.message)==null?void 0:l.content)||((s=(g=(n=p.choices)==null?void 0:n[0])==null?void 0:g.delta)==null?void 0:s.content)||"Sorry, I couldn't generate a response."}catch(m){return console.error("AI Summary Error:",m),"Sorry, there was an error generating the summary. Please try again later."}},D=(a,d)=>JSON.stringify({bowlers:a.map(o=>({...o,group:o.group||"Ungrouped"})),a3Cases:d.map(o=>{const i={...o};return delete i.mindMapNodes,delete i.dataAnalysisImages,delete i.resultImages,delete i.dataAnalysisCanvasHeight,delete i.resultCanvasHeight,i})}),k=async(a,d)=>{var l,n,g;const o=Object.keys(a.monthlyData||{}).sort(),i=[];if(o.forEach(s=>{var p;const m=(p=a.monthlyData)==null?void 0:p[s];m&&m.actual&&i.push({month:s,actual:m.actual,target:m.target||"N/A"})}),i.length===0)return{problemStatement:"",whyTree:[],rootCauses:[],actions:[]};const c=`
You are an expert in A3 Problem Solving, Lean, and operational excellence.

You will receive the history of one performance metric.

Your tasks:
1) Write a clear, formal A3 Problem Statement in English only. It must describe the gap from target, where and when it occurs, and the impact. Do not include any solutions or suggestions in this field.
2) Build a concise 5-Whys style cause tree for this problem.
3) Identify the most likely root causes from that tree.
4) Propose a practical, multi-step action plan based on the root causes that reflects industrial best practice (for example: robust problem clarification, detailed root cause analysis, countermeasures, pilot/experiments, standardization, training, and follow-up monitoring).

Metric Context:
- Name: "${a.name}"
- Definition: "${a.definition||"N/A"}"
- Attribute: "${a.attribute||"Individual Data"}"
- Target Meeting Rule: "${a.targetMeetingRule||"gte"}"

Raw Data (Month | Actual | Target):
${i.map(s=>`${s.month} | ${s.actual} | ${s.target}`).join(`
`)}

Response requirements:
- Always respond in English.
- Make the cause tree logically streamlined: do NOT repeat the same cause text at the same level, and avoid creating multiple nodes that say essentially the same thing.
- When several detailed sub-causes share the same higher-level idea, represent that idea once as a single parent "cause" node and place the detailed variations under "children" instead of duplicating the parent text.
- Remove or merge any redundant nodes so that each "cause" string is distinct and adds new information.
- The action plan must include multiple tasks that cover diagnosis, countermeasures, piloting, standardization, and follow-up (including how to monitor the metric over the next 2–3 months).
- Actions should be specific enough that a real team could execute them in a manufacturing or service environment (avoid generic phrases such as "optimize process" without concrete steps).
- Return JSON ONLY with this exact structure:
{
  "problemStatement": "single formal problem statement string",
  "whyTree": [
    {
      "cause": "first-level cause text",
      "children": [
        {
          "cause": "second-level cause text",
          "children": [
            {
              "cause": "third-level cause text"
            }
          ]
        }
      ]
    }
  ],
  "rootCauses": [
    "root cause sentence 1",
    "root cause sentence 2"
  ],
  "actions": [
    {
      "name": "short action title",
      "description": "detailed what/how that a team can execute, including references to industrial best practice where appropriate",
      "owner": "role or function (for example: Production Supervisor, Process Engineer, Quality Manager, Service Team Lead)",
      "group": "theme or workstream name (for example: Standard Work, Training, Equipment Reliability, Scheduling, Visual Management)"
    }
  ]
}
`;try{const s=await fetch("https://multi-model-worker.study-llm.me/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:d,messages:[{role:"system",content:"You are an A3 Problem Solving coach that outputs strictly JSON in the requested schema."},{role:"user",content:c}],stream:!1})});if(!s.ok)throw new Error(`API Error: ${s.statusText}`);const w=(((g=(n=(l=(await s.json()).choices)==null?void 0:l[0])==null?void 0:n.message)==null?void 0:g.content)||"{}").replace(/```json/gi,"").replace(/```/g,"").trim();let u;try{u=JSON.parse(w)}catch{u={}}const v=typeof u.problemStatement=="string"?u.problemStatement.trim():"",e=(Array.isArray(u.whyTree)?u.whyTree:[]).map(t=>({cause:typeof t.cause=="string"?t.cause.trim():"",children:Array.isArray(t.children)?t.children.map(f=>({cause:typeof f.cause=="string"?f.cause.trim():"",children:Array.isArray(f.children)?f.children.map(A=>({cause:typeof A.cause=="string"?A.cause.trim():""})):void 0})):void 0})).filter(t=>t.cause),r=Array.isArray(u.rootCauses)?u.rootCauses.map(t=>typeof t=="string"?t.trim():"").filter(t=>t):[],h=(Array.isArray(u.actions)?u.actions:[]).map(t=>({name:typeof t.name=="string"?t.name.trim():"",description:typeof t.description=="string"?t.description.trim():"",owner:typeof t.owner=="string"?t.owner.trim():"",group:typeof t.group=="string"?t.group.trim():""})).filter(t=>t.name);return{problemStatement:v,whyTree:e,rootCauses:r,actions:h}}catch(s){return console.error("AI A3 Plan Error:",s),{problemStatement:"",whyTree:[],rootCauses:[],actions:[]}}};export{C as analyzeMetric,k as generateA3PlanFromMetric,D as generateAIContext,$ as generateComprehensiveSummary};
