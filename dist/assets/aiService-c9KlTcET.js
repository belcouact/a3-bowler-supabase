const P=a=>{if(a.length===0)return{mean:0,stdDev:0,min:0,max:0};const o=a.reduce((u,s)=>u+s,0)/a.length,i=a.reduce((u,s)=>u+Math.pow(s-o,2),0)/a.length,c=Math.sqrt(i);return{mean:o,stdDev:c,min:Math.min(...a),max:Math.max(...a)}},I=a=>{const m=a.match(/^(?:\{|\[)?\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:\}|\])?$/);if(m)return{min:parseFloat(m[1]),max:parseFloat(m[2])};const o=parseFloat(a);return isNaN(o)?{}:{val:o}},O=async(a,m,o)=>{var b,l,A;const i=Object.keys(a.monthlyData||{}).sort(),c=[],u=[];i.forEach(e=>{var h;const n=(h=a.monthlyData)==null?void 0:h[e];if(n&&n.actual){c.push({month:e,actual:n.actual,target:n.target||"N/A"});const g=parseFloat(n.actual);isNaN(g)||u.push(g)}});const s=P(u),y=(o||[]).filter(e=>(e.status||"").trim().toLowerCase()==="completed"),f=(o||[]).filter(e=>(e.status||"").trim().toLowerCase()!=="completed"),r=y.length===0&&f.length===0?"No A3 cases are currently linked to this metric.":JSON.stringify({completedA3s:y.map(e=>({id:e.id,title:e.title,owner:e.owner,group:e.group,tag:e.tag,startDate:e.startDate,endDate:e.endDate})),otherA3s:f.map(e=>({id:e.id,title:e.title,owner:e.owner,group:e.group,tag:e.tag,status:e.status,startDate:e.startDate,endDate:e.endDate}))},null,2);let d="Not calculated (insufficient data or complex targets).";if(u.length>=3&&c.length>0){const e=c[c.length-1].target,n=I(e),h=a.targetMeetingRule||"gte";if(h==="within_range"&&n.min!==void 0&&n.max!==void 0&&s.stdDev>0){const g=(s.mean-n.min)/(3*s.stdDev),p=(n.max-s.mean)/(3*s.stdDev);d=`Cpk: ${Math.min(g,p).toFixed(2)} (Target Range: ${n.min} - ${n.max})`}else h==="gte"&&n.val!==void 0&&s.stdDev>0?d=`Cpk (One-sided Lower): ${((s.mean-n.val)/(3*s.stdDev)).toFixed(2)} (Target >= ${n.val})`:h==="lte"&&n.val!==void 0&&s.stdDev>0&&(d=`Cpk (One-sided Upper): ${((n.val-s.mean)/(3*s.stdDev)).toFixed(2)} (Target <= ${n.val})`)}if(c.length===0)return{trend:"stable",achievementRate:0,suggestion:[],summary:"No data available for analysis."};const w=`
  You are an expert quality engineer and data analyst. Perform a deep statistical analysis of the following metric.

  Metric Context:
  - Name: "${a.name}"
  - Definition: "${a.definition||"N/A"}"
  - Attribute: "${a.attribute||"Individual Data"}" (Use this to interpret if data is accumulative or snapshot).
  - Target Meeting Rule: "${a.targetMeetingRule||"gte"}"
  
  Statistical Data (Calculated):
  - Mean: ${s.mean.toFixed(2)}
  - Std Dev: ${s.stdDev.toFixed(2)}
  - Min: ${s.min}
  - Max: ${s.max}
  - Process Capability: ${d}

  Linked A3 Problem-Solving Context (for this metric only):
  ${r}

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
  `;try{const e=await fetch("https://multi-model-worker.study-llm.me/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:m,messages:[{role:"system",content:"You are a helpful data analysis assistant that outputs strictly JSON."},{role:"user",content:w}],stream:!1})});if(!e.ok)throw new Error(`API Error: ${e.statusText}`);const g=(((A=(l=(b=(await e.json()).choices)==null?void 0:b[0])==null?void 0:l.message)==null?void 0:A.content)||"{}").replace(/```json/g,"").replace(/```/g,"").trim(),p=JSON.parse(g);return{trend:p.trend||"stable",achievementRate:typeof p.achievementRate=="number"?p.achievementRate:0,suggestion:Array.isArray(p.suggestion)?p.suggestion:[],summary:p.summary||"Could not generate summary."}}catch(e){return console.error("AI Analysis Error:",e),{trend:"stable",achievementRate:0,suggestion:["Error connecting to AI service."],summary:"Failed to analyze data."}}},R=async(a,m,o)=>{var i,c,u,s,y,f;try{const r=await fetch("https://multi-model-worker.study-llm.me/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:o,messages:[{role:"system",content:`You are an AI assistant for the Metric Bowler & A3 Problem Solving application. 
            Here is the current data in the application: ${a}.
            Answer the user's questions based on this data. Be concise and helpful.`},{role:"user",content:m}],stream:!1})});if(!r.ok)throw new Error(`API Error: ${r.statusText}`);const d=await r.json();return((u=(c=(i=d.choices)==null?void 0:i[0])==null?void 0:c.message)==null?void 0:u.content)||((f=(y=(s=d.choices)==null?void 0:s[0])==null?void 0:y.delta)==null?void 0:f.content)||"Sorry, I couldn't generate a response."}catch(r){return console.error("AI Summary Error:",r),"Sorry, there was an error generating the summary. Please try again later."}},E=(a,m)=>JSON.stringify({bowlers:a.map(o=>({...o,group:o.group||"Ungrouped"})),a3Cases:m.map(o=>{const i={...o};return delete i.mindMapNodes,delete i.dataAnalysisImages,delete i.resultImages,delete i.dataAnalysisCanvasHeight,delete i.resultCanvasHeight,i})}),Y=async(a,m)=>{var s,y,f;const o=new Date().toISOString().slice(0,10),i=Object.keys(a.monthlyData||{}).sort(),c=[];if(i.forEach(r=>{var w;const d=(w=a.monthlyData)==null?void 0:w[r];d&&d.actual&&c.push({month:r,actual:d.actual,target:d.target||"N/A"})}),c.length===0)return{problemStatement:"",whyTree:[],rootCauses:[],actions:[]};const u=`
You are an expert in A3 Problem Solving, Lean, and operational excellence.

You will receive the history of one performance metric.

Your tasks:
1) Write a clear, formal A3 Problem Statement in English only. It must describe the gap from target, where and when it occurs, and the impact. Do not include any solutions or suggestions in this field.
2) Build a concise 5-Whys style cause tree for this problem.
3) Identify the most likely root causes from that tree.
4) Propose a practical, time-phased action plan based on the root causes that reflects industrial best practice (for example: robust problem clarification, detailed root cause analysis, countermeasures, pilot/experiments, standardization, training, and follow-up monitoring). The plan should be realistic for an operational team to execute.

Metric Context:
- Name: "${a.name}"
- Definition: "${a.definition||"N/A"}"
- Attribute: "${a.attribute||"Individual Data"}"
- Target Meeting Rule: "${a.targetMeetingRule||"gte"}"

Raw Data (Month | Actual | Target):
${c.map(r=>`${r.month} | ${r.actual} | ${r.target}`).join(`
`)}

Response requirements:
- Always respond in English.
- Make the cause tree logically streamlined: do NOT repeat the same cause text at the same level, and avoid creating multiple nodes that say essentially the same thing.
- When several detailed sub-causes share the same higher-level idea, represent that idea once as a single parent "cause" node and place the detailed variations under "children" instead of duplicating the parent text.
- Remove or merge any redundant nodes so that each "cause" string is distinct and adds new information.
- The action plan must include multiple tasks that cover diagnosis, countermeasures, piloting, standardization, and follow-up (including how to monitor the metric over the next 2–3 months).
- Use ${o} as today's date when planning the timeline for the action plan.
- Each task should describe what to do, how to do it, and who should own it so that a real team can execute it in a manufacturing or service environment (avoid generic phrases such as "optimize process" without concrete steps).
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
  "tasks": [
    {
      "name": "short action title",
      "description": "detailed what/how so a team can execute",
      "owner": "role or function (e.g. Production Supervisor)",
      "group": "theme or workstream name",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "status": "Not Started" | "In Progress" | "Completed",
      "progress": number
    }
  ]
}
`;try{const r=await fetch("https://multi-model-worker.study-llm.me/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:m,messages:[{role:"system",content:"You are an A3 Problem Solving coach that outputs strictly JSON in the requested schema."},{role:"user",content:u}],stream:!1})});if(!r.ok)throw new Error(`API Error: ${r.statusText}`);const b=(((f=(y=(s=(await r.json()).choices)==null?void 0:s[0])==null?void 0:y.message)==null?void 0:f.content)||"{}").replace(/```json/gi,"").replace(/```/g,"").trim();let l;try{l=JSON.parse(b)}catch{l={}}const A=typeof l.problemStatement=="string"?l.problemStatement.trim():"",n=(Array.isArray(l.whyTree)?l.whyTree:[]).map(t=>({cause:typeof t.cause=="string"?t.cause.trim():"",children:Array.isArray(t.children)?t.children.map(v=>({cause:typeof v.cause=="string"?v.cause.trim():"",children:Array.isArray(v.children)?v.children.map(D=>({cause:typeof D.cause=="string"?D.cause.trim():""})):void 0})):void 0})).filter(t=>t.cause),h=Array.isArray(l.rootCauses)?l.rootCauses.map(t=>typeof t=="string"?t.trim():"").filter(t=>t):[],p=(Array.isArray(l.tasks)?l.tasks:Array.isArray(l.actions)?l.actions:[]).map(t=>{const v=typeof t.name=="string"?t.name.trim():"";if(!v)return null;const D=typeof t.description=="string"?t.description.trim():"",C=typeof t.owner=="string"?t.owner.trim():"",$=typeof t.group=="string"?t.group.trim():"",k=typeof t.startDate=="string"?t.startDate.trim():void 0,N=typeof t.endDate=="string"?t.endDate.trim():void 0,x=typeof t.status=="string"?t.status.trim():void 0,T=x==="Not Started"||x==="In Progress"||x==="Completed"?x:void 0,S=typeof t.progress=="number"?t.progress:void 0,M=typeof S=="number"&&isFinite(S)?S:void 0;return{name:v,description:D,owner:C,group:$,startDate:k,endDate:N,status:T,progress:M}}).filter(t=>t&&t.name);return{problemStatement:A,whyTree:n,rootCauses:h,actions:p}}catch(r){return console.error("AI A3 Plan Error:",r),{problemStatement:"",whyTree:[],rootCauses:[],actions:[]}}};export{O as analyzeMetric,Y as generateA3PlanFromMetric,E as generateAIContext,R as generateComprehensiveSummary};
