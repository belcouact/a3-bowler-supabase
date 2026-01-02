import{c as F,W as M,Z as q,aj as J,r,O as e,a4 as f,S as R,X as W,ak as T}from"./index-CrxhOlNg.js";import{I as X}from"./ImageCanvas-DpBIy5q-.js";import{A as D}from"./alert-circle-BOhgm09X.js";/**
 * @license lucide-react v0.330.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Z=F("BarChart3",[["path",{d:"M3 3v18h18",key:"1s2lah"}],["path",{d:"M18 17V9",key:"2bz60n"}],["path",{d:"M13 17V5",key:"1frdt8"}],["path",{d:"M8 17v-3",key:"17ska0"}]]);/**
 * @license lucide-react v0.330.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Q=F("Route",[["circle",{cx:"6",cy:"19",r:"3",key:"1kj8tv"}],["path",{d:"M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15",key:"1d8sl"}],["circle",{cx:"18",cy:"5",r:"3",key:"gq8acd"}]]),ae=()=>{var H;const{id:z}=M(),{a3Cases:L,updateA3Case:h}=q(),{user:n}=J(),s=L.find(a=>a.id===z),l=r.useRef(null),[b,x]=r.useState([]),[v,y]=r.useState(500),[j,w]=r.useState(!1),[A,N]=r.useState(null),[k,S]=r.useState(null),[I,C]=r.useState(!1),[P,g]=r.useState(null),[O,E]=r.useState(null),U=async a=>!s||!(n!=null&&n.username)?URL.createObjectURL(a):(await T.uploadA3Image(n.username,s.id,a)).url;r.useEffect(()=>{if(s){s.dataAnalysisImages&&JSON.stringify(s.dataAnalysisImages)!==JSON.stringify(b)&&x(s.dataAnalysisImages||[]),s.dataAnalysisCanvasHeight&&s.dataAnalysisCanvasHeight!==v&&y(s.dataAnalysisCanvasHeight);const a=s.dataAnalysisObservations||"";l.current&&l.current.value!==a&&(l.current.value=a)}},[s==null?void 0:s.id]),r.useEffect(()=>{if(!s||!(n!=null&&n.username)||Array.isArray(s.dataAnalysisImages)&&s.dataAnalysisImages.length>0)return;let o=!1;return(async()=>{try{const t=await T.loadA3Detail(n.username,s.id);if(!t||!t.success||o)return;const d={...s};let i=!1;Array.isArray(t.dataAnalysisImages)&&(x(t.dataAnalysisImages),d.dataAnalysisImages=t.dataAnalysisImages,i=!0),typeof t.dataAnalysisCanvasHeight=="number"&&(y(t.dataAnalysisCanvasHeight),d.dataAnalysisCanvasHeight=t.dataAnalysisCanvasHeight,i=!0),i&&h(d)}catch{}})(),()=>{o=!0}},[s==null?void 0:s.id,n==null?void 0:n.username,h]);const V=a=>{x(a),s&&h({...s,dataAnalysisImages:a})},Y=a=>{y(a),s&&h({...s,dataAnalysisCanvasHeight:a})},$=()=>{if(s&&l.current){const a=l.current.value;a!==s.dataAnalysisObservations&&h({...s,dataAnalysisObservations:a})}},B=async()=>{var o,m,t,d;if(!(s!=null&&s.problemStatement))return;const a=((o=l.current)==null?void 0:o.value)||s.dataAnalysisObservations||"";if(a.trim()){w(!0),S(null),N(null);try{const i=(s.problemContext||"").trim(),p=[{role:"system",content:`You are an expert troubleshooting coach, skilled in many areas.

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
${s.problemStatement}`+(i?`

Additional Context:
${i}`:"")+`

Key Observations from Data:
${a}`}],u=await fetch("https://multi-model-worker.study-llm.me/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"deepseek",messages:p,stream:!1})});if(!u.ok)throw new Error("Failed to analyze data");let c=((d=(t=(m=(await u.json()).choices)==null?void 0:m[0])==null?void 0:t.message)==null?void 0:d.content)||"";c=c.replace(/^```[\s\S]*?```/g,"").trim(),N(c)}catch{S("Failed to analyze data. Please try again.")}finally{w(!1)}}},G=async()=>{var o,m,t,d;if(!(s!=null&&s.problemStatement))return;const a=((o=l.current)==null?void 0:o.value)||s.dataAnalysisObservations||"";C(!0),E(null),g(null);try{const i=(s.problemContext||"").trim(),p=[{role:"system",content:`You are an expert troubleshooting coach, skilled in many areas.
          
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
${s.problemStatement}`+(i?`

Additional Context:
${i}`:"")+`

Key Observations from Data:
${a}`}],u=await fetch("https://multi-model-worker.study-llm.me/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"deepseek",messages:p,stream:!1})});if(!u.ok)throw new Error("Failed to generate troubleshooting plan");let c=((d=(t=(m=(await u.json()).choices)==null?void 0:m[0])==null?void 0:t.message)==null?void 0:d.content)||"";c=c.replace(/^```[\s\S]*?```/g,"").trim(),g(c)}catch{E("Failed to generate troubleshooting plan. Please try again.")}finally{C(!1)}};return s?e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-xl font-bold text-gray-900 mb-2",children:"Data Analysis"}),e.jsx("p",{className:"text-gray-500 mb-4",children:"Visualize the data to understand the magnitude and trend of the problem."}),O&&e.jsx("div",{className:"mb-4 rounded-md bg-red-50 p-3",children:e.jsxs("div",{className:"flex",children:[e.jsx("div",{className:"flex-shrink-0",children:e.jsx(D,{className:"h-4 w-4 text-red-400","aria-hidden":"true"})}),e.jsx("div",{className:"ml-2 text-xs text-red-700",children:O})]})}),e.jsx(X,{images:b,onImagesChange:V,height:v,onHeightChange:Y,leftControls:e.jsx("button",{type:"button",onClick:G,disabled:I||!s.problemStatement,className:"inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed",children:I?e.jsxs(e.Fragment,{children:[e.jsx(f,{className:"animate-spin -ml-0.5 mr-2 h-3 w-3"}),e.jsx("span",{className:"hidden sm:inline",children:"Generating plan..."})]}):e.jsxs(e.Fragment,{children:[e.jsx(Q,{className:"-ml-0.5 mr-0 sm:mr-2 h-3 w-3"}),e.jsx("span",{className:"hidden sm:inline",children:"AI Troubleshooting Plan"})]})}),onUploadImage:U}),e.jsxs("div",{className:"mt-6",children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsx("label",{htmlFor:"observations",className:"block text-sm font-medium text-gray-700",children:"Key Observations from Data"}),e.jsx("button",{type:"button",onClick:B,disabled:j||!s.problemStatement||!((H=l.current)!=null&&H.value||s.dataAnalysisObservations),className:"inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed",children:j?e.jsxs(e.Fragment,{children:[e.jsx(f,{className:"animate-spin -ml-0.5 mr-2 h-3 w-3"}),e.jsx("span",{className:"hidden sm:inline",children:"Analyzing..."})]}):e.jsxs(e.Fragment,{children:[e.jsx(Z,{className:"-ml-0.5 mr-0 sm:mr-2 h-3 w-3"}),e.jsx("span",{className:"hidden sm:inline",children:"AI Evidence Review"})]})})]}),e.jsx("textarea",{ref:l,id:"observations",rows:8,className:"w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border",placeholder:"What patterns or insights do you see in the data?",defaultValue:s.dataAnalysisObservations||"",onBlur:$}),k&&e.jsx("div",{className:"mt-3 rounded-md bg-red-50 p-3",children:e.jsxs("div",{className:"flex",children:[e.jsx("div",{className:"flex-shrink-0",children:e.jsx(D,{className:"h-4 w-4 text-red-400","aria-hidden":"true"})}),e.jsx("div",{className:"ml-2 text-sm text-red-700",children:k})]})}),A&&e.jsxs("div",{className:"mt-4 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden",children:[e.jsx("div",{className:"bg-indigo-50 px-4 py-2 border-b border-gray-200",children:e.jsxs("h3",{className:"text-xs font-bold text-indigo-900 flex items-center",children:[e.jsx(R,{className:"h-4 w-4 mr-2 text-indigo-600"}),"AI Evidence Adequacy & Cause Insight"]})}),e.jsx("div",{className:"p-4",children:e.jsx("div",{className:"prose prose-sm max-w-none text-gray-700 bg-gray-50 p-3 rounded-md text-sm whitespace-pre-wrap",children:A})})]})]})]}),P&&e.jsx("div",{className:"fixed inset-0 z-[70] overflow-y-auto",children:e.jsxs("div",{className:"flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0",children:[e.jsx("div",{className:"fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity","aria-hidden":"true",onClick:()=>g(null)}),e.jsx("span",{className:"hidden sm:inline-block sm:align-middle sm:h-screen","aria-hidden":"true",children:"​"}),e.jsxs("div",{className:"inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6",children:[e.jsx("div",{className:"absolute top-0 right-0 pt-4 pr-4",children:e.jsxs("button",{type:"button",className:"bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",onClick:()=>g(null),children:[e.jsx("span",{className:"sr-only",children:"Close"}),e.jsx(W,{className:"h-6 w-6"})]})}),e.jsxs("div",{className:"mt-2",children:[e.jsxs("h3",{className:"text-sm leading-6 font-semibold text-gray-900 mb-3 flex items-center",children:[e.jsx(R,{className:"h-4 w-4 mr-2 text-blue-600"}),"AI Troubleshooting Plan"]}),e.jsx("div",{className:"prose prose-sm max-w-none text-gray-700 bg-gray-50 p-3 rounded-md text-sm whitespace-pre-wrap",children:P})]})]})]})})]}):e.jsx("div",{className:"flex items-center justify-center py-16",children:e.jsxs("div",{className:"flex flex-col items-center",children:[e.jsx(f,{className:"w-8 h-8 animate-spin text-blue-600"}),e.jsx("p",{className:"mt-3 text-base font-medium text-gray-700",children:"Loading application data..."})]})})};export{ae as default};
