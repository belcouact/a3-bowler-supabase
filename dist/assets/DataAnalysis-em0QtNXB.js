import{c as H,V as K,Y as M,r as t,O as e,a3 as g,S as E,X as q}from"./index--O4BBDcs.js";import{I as J}from"./ImageCanvas-CED8Bh_O.js";import{A as F}from"./alert-circle-DhRv79UT.js";/**
 * @license lucide-react v0.330.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $=H("BarChart3",[["path",{d:"M3 3v18h18",key:"1s2lah"}],["path",{d:"M18 17V9",key:"2bz60n"}],["path",{d:"M13 17V5",key:"1frdt8"}],["path",{d:"M8 17v-3",key:"17ska0"}]]);/**
 * @license lucide-react v0.330.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=H("Route",[["circle",{cx:"6",cy:"19",r:"3",key:"1kj8tv"}],["path",{d:"M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15",key:"1d8sl"}],["circle",{cx:"18",cy:"5",r:"3",key:"gq8acd"}]]),Q=()=>{var O;const{id:R}=K(),{a3Cases:T,updateA3Case:u}=M(),s=T.find(a=>a.id===R),n=t.useRef(null),[x,p]=t.useState([]),[b,f]=t.useState(500),[y,v]=t.useState(!1),[j,w]=t.useState(null),[N,A]=t.useState(null),[k,S]=t.useState(!1),[C,h]=t.useState(null),[P,I]=t.useState(null);t.useEffect(()=>{if(s){s.dataAnalysisImages&&JSON.stringify(s.dataAnalysisImages)!==JSON.stringify(x)&&p(s.dataAnalysisImages||[]),s.dataAnalysisCanvasHeight&&s.dataAnalysisCanvasHeight!==b&&f(s.dataAnalysisCanvasHeight);const a=s.dataAnalysisObservations||"";n.current&&n.current.value!==a&&(n.current.value=a)}},[s==null?void 0:s.id]);const z=a=>{p(a),s&&u({...s,dataAnalysisImages:a})},D=a=>{f(a),s&&u({...s,dataAnalysisCanvasHeight:a})},V=()=>{if(s&&n.current){const a=n.current.value;a!==s.dataAnalysisObservations&&u({...s,dataAnalysisObservations:a})}},Y=async()=>{var r,l,o,d;if(!(s!=null&&s.problemStatement))return;const a=((r=n.current)==null?void 0:r.value)||s.dataAnalysisObservations||"";if(a.trim()){v(!0),A(null),w(null);try{const c=[{role:"system",content:`You are an expert troubleshooting coach, skilled in many areas.

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
## Potential Implications of Cause`},{role:"user",content:`Problem Statement: "${s.problemStatement}"

Key Observations from Data:
${a}`}],m=await fetch("https://multi-model-worker.study-llm.me/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"deepseek",messages:c,stream:!1})});if(!m.ok)throw new Error("Failed to analyze data");let i=((d=(o=(l=(await m.json()).choices)==null?void 0:l[0])==null?void 0:o.message)==null?void 0:d.content)||"";i=i.replace(/^```[\s\S]*?```/g,"").trim(),w(i)}catch{A("Failed to analyze data. Please try again.")}finally{v(!1)}}},B=async()=>{var r,l,o,d;if(!(s!=null&&s.problemStatement))return;const a=((r=n.current)==null?void 0:r.value)||s.dataAnalysisObservations||"";S(!0),I(null),h(null);try{const c=[{role:"system",content:`You are an expert troubleshooting coach, skilled in many areas.
          
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
${s.problemStatement}

Key Observations from Data:
${a}`}],m=await fetch("https://multi-model-worker.study-llm.me/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"deepseek",messages:c,stream:!1})});if(!m.ok)throw new Error("Failed to generate troubleshooting plan");let i=((d=(o=(l=(await m.json()).choices)==null?void 0:l[0])==null?void 0:o.message)==null?void 0:d.content)||"";i=i.replace(/^```[\s\S]*?```/g,"").trim(),h(i)}catch{I("Failed to generate troubleshooting plan. Please try again.")}finally{S(!1)}};return s?e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-xl font-bold text-gray-900 mb-2",children:"Data Analysis"}),e.jsx("p",{className:"text-gray-500 mb-4",children:"Visualize the data to understand the magnitude and trend of the problem."}),e.jsxs("div",{className:"mb-4 flex items-center justify-between",children:[e.jsx("p",{className:"text-xs text-gray-500 mr-4",children:"Use AI to generate a troubleshooting plan based on the problem and evidence."}),e.jsx("button",{type:"button",onClick:B,disabled:k||!s.problemStatement,className:"inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed",children:k?e.jsxs(e.Fragment,{children:[e.jsx(g,{className:"animate-spin -ml-0.5 mr-2 h-3 w-3"}),e.jsx("span",{className:"hidden sm:inline",children:"Generating plan..."})]}):e.jsxs(e.Fragment,{children:[e.jsx(L,{className:"-ml-0.5 mr-0 sm:mr-2 h-3 w-3"}),e.jsx("span",{className:"hidden sm:inline",children:"AI Troubleshooting Plan"})]})})]}),P&&e.jsx("div",{className:"mb-4 rounded-md bg-red-50 p-3",children:e.jsxs("div",{className:"flex",children:[e.jsx("div",{className:"flex-shrink-0",children:e.jsx(F,{className:"h-4 w-4 text-red-400","aria-hidden":"true"})}),e.jsx("div",{className:"ml-2 text-xs text-red-700",children:P})]})}),e.jsx(J,{images:x,onImagesChange:z,height:b,onHeightChange:D}),e.jsxs("div",{className:"mt-6",children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsx("label",{htmlFor:"observations",className:"block text-sm font-medium text-gray-700",children:"Key Observations from Data"}),e.jsx("button",{type:"button",onClick:Y,disabled:y||!s.problemStatement||!((O=n.current)!=null&&O.value||s.dataAnalysisObservations),className:"inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed",children:y?e.jsxs(e.Fragment,{children:[e.jsx(g,{className:"animate-spin -ml-0.5 mr-2 h-3 w-3"}),e.jsx("span",{className:"hidden sm:inline",children:"Analyzing..."})]}):e.jsxs(e.Fragment,{children:[e.jsx($,{className:"-ml-0.5 mr-0 sm:mr-2 h-3 w-3"}),e.jsx("span",{className:"hidden sm:inline",children:"AI Evidence Review"})]})})]}),e.jsx("textarea",{ref:n,id:"observations",rows:8,className:"w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border",placeholder:"What patterns or insights do you see in the data?",defaultValue:s.dataAnalysisObservations||"",onBlur:V}),N&&e.jsx("div",{className:"mt-3 rounded-md bg-red-50 p-3",children:e.jsxs("div",{className:"flex",children:[e.jsx("div",{className:"flex-shrink-0",children:e.jsx(F,{className:"h-4 w-4 text-red-400","aria-hidden":"true"})}),e.jsx("div",{className:"ml-2 text-sm text-red-700",children:N})]})}),j&&e.jsxs("div",{className:"mt-4 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden",children:[e.jsx("div",{className:"bg-indigo-50 px-4 py-2 border-b border-gray-200",children:e.jsxs("h3",{className:"text-xs font-bold text-indigo-900 flex items-center",children:[e.jsx(E,{className:"h-4 w-4 mr-2 text-indigo-600"}),"AI Evidence Adequacy & Cause Insight"]})}),e.jsx("div",{className:"p-4",children:e.jsx("div",{className:"prose prose-sm max-w-none text-gray-700 bg-gray-50 p-3 rounded-md text-sm whitespace-pre-wrap",children:j})})]})]})]}),C&&e.jsx("div",{className:"fixed inset-0 z-[70] overflow-y-auto",children:e.jsxs("div",{className:"flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0",children:[e.jsx("div",{className:"fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity","aria-hidden":"true",onClick:()=>h(null)}),e.jsx("span",{className:"hidden sm:inline-block sm:align-middle sm:h-screen","aria-hidden":"true",children:"​"}),e.jsxs("div",{className:"inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6",children:[e.jsx("div",{className:"absolute top-0 right-0 pt-4 pr-4",children:e.jsxs("button",{type:"button",className:"bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",onClick:()=>h(null),children:[e.jsx("span",{className:"sr-only",children:"Close"}),e.jsx(q,{className:"h-6 w-6"})]})}),e.jsxs("div",{className:"mt-2",children:[e.jsxs("h3",{className:"text-sm leading-6 font-semibold text-gray-900 mb-3 flex items-center",children:[e.jsx(E,{className:"h-4 w-4 mr-2 text-blue-600"}),"AI Troubleshooting Plan"]}),e.jsx("div",{className:"prose prose-sm max-w-none text-gray-700 bg-gray-50 p-3 rounded-md text-sm whitespace-pre-wrap",children:C})]})]})]})})]}):e.jsx("div",{className:"flex items-center justify-center py-16",children:e.jsxs("div",{className:"flex flex-col items-center",children:[e.jsx(g,{className:"w-8 h-8 animate-spin text-blue-600"}),e.jsx("p",{className:"mt-3 text-base font-medium text-gray-700",children:"Loading application data..."})]})})};export{Q as default};
