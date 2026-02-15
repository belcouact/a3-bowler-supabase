import{c as F,W as q,Z as W,aj as X,r,O as e,a4 as N,S as D,X as R,ak as T}from"./index-1Ff3JAN5.js";import{I as Z}from"./ImageCanvas-QxIq0eyc.js";import{A}from"./alert-circle-CEDONWkB.js";/**
 * @license lucide-react v0.330.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Q=F("BarChart3",[["path",{d:"M3 3v18h18",key:"1s2lah"}],["path",{d:"M18 17V9",key:"2bz60n"}],["path",{d:"M13 17V5",key:"1frdt8"}],["path",{d:"M8 17v-3",key:"17ska0"}]]);/**
 * @license lucide-react v0.330.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=F("Route",[["circle",{cx:"6",cy:"19",r:"3",key:"1kj8tv"}],["path",{d:"M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15",key:"1d8sl"}],["circle",{cx:"18",cy:"5",r:"3",key:"gq8acd"}]]),se=()=>{const{id:L}=q(),{a3Cases:V,updateA3Case:h,isLoading:B}=W(),{user:n}=X(),a=V.find(s=>s.id===L),d=r.useRef(null),[k,g]=r.useState([]),[S,b]=r.useState(500),[C,I]=r.useState(!1),[f,y]=r.useState(null),[u,P]=r.useState(null),[O,H]=r.useState(!1),[v,w]=r.useState(null),[p,E]=r.useState(null),U=async s=>!a||!(n!=null&&n.username)?URL.createObjectURL(s):(await T.uploadA3Image(n.username,a.id,s)).url;r.useEffect(()=>{if(a){a.dataAnalysisImages&&JSON.stringify(a.dataAnalysisImages)!==JSON.stringify(k)&&g(a.dataAnalysisImages||[]),a.dataAnalysisCanvasHeight&&a.dataAnalysisCanvasHeight!==S&&b(a.dataAnalysisCanvasHeight);const s=a.dataAnalysisObservations||"";d.current&&d.current.value!==s&&(d.current.value=s)}},[a==null?void 0:a.id]),r.useEffect(()=>{if(!a||!(n!=null&&n.username)||Array.isArray(a.dataAnalysisImages)&&a.dataAnalysisImages.length>0)return;let i=!1;return(async()=>{try{const t=await T.loadA3Detail(n.username,a.id);if(!t||!t.success||i)return;const o={...a};let l=!1;Array.isArray(t.dataAnalysisImages)&&(g(t.dataAnalysisImages),o.dataAnalysisImages=t.dataAnalysisImages,l=!0),typeof t.dataAnalysisCanvasHeight=="number"&&(b(t.dataAnalysisCanvasHeight),o.dataAnalysisCanvasHeight=t.dataAnalysisCanvasHeight,l=!0),l&&h(o)}catch{}})(),()=>{i=!0}},[a==null?void 0:a.id,n==null?void 0:n.username,h]);const Y=s=>{g(s),a&&h({...a,dataAnalysisImages:s})},$=s=>{b(s),a&&h({...a,dataAnalysisCanvasHeight:s})},G=()=>{if(a&&d.current){const s=d.current.value;s!==a.dataAnalysisObservations&&h({...a,dataAnalysisObservations:s})}},K=async()=>{var i,m,t,o;if(!(a!=null&&a.problemStatement))return;const s=((i=d.current)==null?void 0:i.value)||a.dataAnalysisObservations||"";if(s.trim()){I(!0),P(null),y(null);try{const l=(a.problemContext||"").trim(),j=[{role:"system",content:`You are an expert troubleshooting coach, skilled in many areas.

The user is working on an A3 Problem Solving form.

You will be given:
- A Problem Statement
- Key observations from data analysis

Your tasks:
1) Evaluate whether the current data seems adequate to understand the problem.
2) Suggest what additional data or evidence should be collected if needed.
3) Briefly discuss potential implications or likely causes suggested by the data.

Respond in English, even if the user's inputs are in another language.

Structure the answer with clear markdown headings:
## Data Adequacy
## Additional Evidence Needed
## Potential Implications of Cause`},{role:"user",content:`Problem Statement:
${a.problemStatement}`+(l?`

Additional Context:
${l}`:"")+`

Key Observations from Data:
${s}`}],x=await fetch("https://multi-model-worker.study-llm.me/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"deepseek",messages:j,stream:!1})});if(!x.ok)throw new Error("Failed to analyze data");let c=((o=(t=(m=(await x.json()).choices)==null?void 0:m[0])==null?void 0:t.message)==null?void 0:o.content)||"";c=c.replace(/^```[\s\S]*?```/g,"").trim(),y(c)}catch{P("Failed to analyze data. Please try again.")}finally{I(!1)}}},M=async()=>{var i,m,t,o;if(!(a!=null&&a.problemStatement))return;const s=((i=d.current)==null?void 0:i.value)||a.dataAnalysisObservations||"";H(!0),E(null),w(null);try{const l=(a.problemContext||"").trim(),j=[{role:"system",content:`You are an expert troubleshooting coach, skilled in many areas.
          
The user is working on an A3 Problem Solving form.

You will receive:
- A single Problem Statement
- Key observations from the data analysis section

Your task:
- Generate a practical troubleshooting plan to address this problem.
- Use the evidence to suggest where to focus first.
- Respond in English by default, even if the inputs are in another language.

Structure the response as clear sections with markdown headings:
1. Immediate Checks
2. Data Collection
3. Hypotheses to Test

For each bullet, be specific and actionable, but concise.`},{role:"user",content:`Problem Statement:
${a.problemStatement}`+(l?`

Additional Context:
${l}`:"")+`

Key Observations from Data:
${s}`}],x=await fetch("https://multi-model-worker.study-llm.me/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"deepseek",messages:j,stream:!1})});if(!x.ok)throw new Error("Failed to generate troubleshooting plan");let c=((o=(t=(m=(await x.json()).choices)==null?void 0:m[0])==null?void 0:t.message)==null?void 0:o.content)||"";c=c.replace(/^```[\s\S]*?```/g,"").trim(),w(c)}catch{E("Failed to generate troubleshooting plan. Please try again.")}finally{H(!1)}};return B?e.jsx("div",{className:"flex items-center justify-center py-24",children:e.jsxs("div",{className:"flex flex-col items-center",children:[e.jsx(N,{className:"w-10 h-10 animate-spin text-brand-600"}),e.jsx("p",{className:"mt-4 text-slate-500 font-medium animate-pulse",children:"Loading analysis data..."})]})}):a?e.jsxs("div",{className:"max-w-6xl mx-auto space-y-12",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"p-2 bg-brand-50 rounded-lg text-brand-600",children:e.jsx(Q,{className:"w-6 h-6"})}),e.jsx("h2",{className:"text-2xl font-bold text-slate-900 font-display",children:"Data Analysis"})]}),e.jsx("p",{className:"text-slate-500 text-lg leading-relaxed max-w-2xl",children:"Visualize facts and evidence. Break down the problem using charts, photos, and objective observations."})]}),e.jsxs("div",{className:"space-y-8",children:[e.jsxs("div",{className:"bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden",children:[e.jsxs("div",{className:"px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center",children:[e.jsx("h3",{className:"text-sm font-bold text-slate-700 uppercase tracking-wider",children:"Visual Evidence & Charts"}),e.jsx("span",{className:"text-xs text-slate-400 font-medium",children:"Drag and drop images to annotate"})]}),e.jsx("div",{className:"p-1",children:e.jsx(Z,{images:k,onImagesChange:Y,height:S,onHeightChange:$,onUploadImage:U})})]}),e.jsxs("div",{className:"bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 focus-within:ring-4 focus-within:ring-brand-50 focus-within:border-brand-300",children:[e.jsx("div",{className:"px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center",children:e.jsx("label",{htmlFor:"observations",className:"text-sm font-bold text-slate-700 uppercase tracking-wider",children:"Key Observations"})}),e.jsx("textarea",{ref:d,id:"observations",rows:6,className:"w-full px-6 py-4 text-slate-700 placeholder-slate-400 border-none focus:ring-0 resize-none text-lg leading-relaxed",placeholder:"What does the data tell us? List facts, trends, and anomalies observed...",defaultValue:a.dataAnalysisObservations||"",onBlur:G}),e.jsxs("div",{className:"px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-wrap gap-3 justify-end",children:[e.jsx("button",{onClick:K,disabled:C||!a.problemStatement,className:"inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none",children:C?e.jsxs(e.Fragment,{children:[e.jsx(N,{className:"w-4 h-4 animate-spin"}),e.jsx("span",{children:"Analyzing..."})]}):e.jsxs(e.Fragment,{children:[e.jsx(D,{className:"w-4 h-4"}),e.jsx("span",{children:"Analyze Data"})]})}),e.jsx("button",{onClick:M,disabled:O||!a.problemStatement,className:"inline-flex items-center gap-2 px-6 py-2.5 bg-white text-brand-600 hover:bg-brand-50 border-2 border-brand-100 text-sm font-bold rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0",children:O?e.jsxs(e.Fragment,{children:[e.jsx(N,{className:"w-4 h-4 animate-spin"}),e.jsx("span",{children:"Generating..."})]}):e.jsxs(e.Fragment,{children:[e.jsx(z,{className:"w-4 h-4"}),e.jsx("span",{children:"Troubleshooting Plan"})]})})]})]}),(f||u||v||p)&&e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-500",children:[(f||u)&&e.jsxs("div",{className:"bg-white rounded-2xl border-2 border-brand-100 shadow-xl overflow-hidden flex flex-col",children:[e.jsxs("div",{className:"bg-brand-600 px-6 py-4 flex justify-between items-center shrink-0",children:[e.jsxs("div",{className:"flex items-center gap-2 text-white",children:[e.jsx(D,{className:"w-4 h-4"}),e.jsx("h3",{className:"text-sm font-bold uppercase tracking-wider",children:"AI Data Insights"})]}),e.jsx("button",{onClick:()=>y(null),className:"text-white/70 hover:text-white",children:e.jsx(R,{className:"w-4 h-4"})})]}),e.jsx("div",{className:"p-6 flex-grow",children:u?e.jsxs("div",{className:"flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl",children:[e.jsx(A,{className:"w-5 h-5"}),e.jsx("p",{className:"text-sm font-medium",children:u})]}):e.jsx("div",{className:"prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap",children:f})})]}),(v||p)&&e.jsxs("div",{className:"bg-white rounded-2xl border-2 border-accent-100 shadow-xl overflow-hidden flex flex-col",children:[e.jsxs("div",{className:"bg-accent-600 px-6 py-4 flex justify-between items-center shrink-0",children:[e.jsxs("div",{className:"flex items-center gap-2 text-white",children:[e.jsx(z,{className:"w-4 h-4"}),e.jsx("h3",{className:"text-sm font-bold uppercase tracking-wider",children:"Troubleshooting Plan"})]}),e.jsx("button",{onClick:()=>w(null),className:"text-white/70 hover:text-white",children:e.jsx(R,{className:"w-4 h-4"})})]}),e.jsx("div",{className:"p-6 flex-grow",children:p?e.jsxs("div",{className:"flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl",children:[e.jsx(A,{className:"w-5 h-5"}),e.jsx("p",{className:"text-sm font-medium",children:p})]}):e.jsx("div",{className:"prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap",children:v})})]})]})]})]}):e.jsx("div",{className:"flex items-center justify-center py-24",children:e.jsxs("div",{className:"flex flex-col items-center text-center",children:[e.jsx("div",{className:"w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4",children:e.jsx(A,{className:"w-8 h-8"})}),e.jsx("p",{className:"text-xl font-bold text-slate-900",children:"Case not found"}),e.jsx("p",{className:"mt-2 text-slate-500 max-w-xs",children:"The A3 case you are looking for may have been deleted or moved."})]})})};export{se as default};
