import{V as te,Y as se,r as c,O as e,a3 as N,S as G,ah as ae,X as ne,aa as H}from"./index-CVcs9xOb.js";import{M as re}from"./MindMap-AxngShnn.js";import{A as L}from"./alert-circle-B-wklAVK.js";import"./zoom-out-CBUzNjLb.js";import"./trash-2-DnawZ3YB.js";const me=()=>{var E;const{id:K}=te(),{a3Cases:V,updateA3Case:m}=se(),t=V.find(s=>s.id===K),[x,w]=c.useState(""),[j,S]=c.useState(!1),[A,y]=c.useState(null),[C,k]=c.useState(null),[M,I]=c.useState(!1),[O,b]=c.useState(null);c.useEffect(()=>{t&&t.rootCause!==x&&w(t.rootCause||"")},[t]),c.useEffect(()=>{if(!(t!=null&&t.mindMapNodes))return;const s=t.mindMapNodes;if(s.length===0)return;const n=s.filter(a=>!a.parentId);let r="";const i=(a,o)=>{const h=s.filter(l=>l.parentId===a);h.sort((l,d)=>l.y-d.y);for(const l of h){const d="  ".repeat(o);r+=`${d}- ${l.text}
`,i(l.id,o+1)}};n.sort((a,o)=>a.y-o.y);for(const a of n)r+=`${a.text}
`,i(a.id,1);r!==t.mindMapText&&m({...t,mindMapText:r})},[t==null?void 0:t.mindMapNodes,m,t==null?void 0:t.id]);const q=c.useCallback(s=>{if(!t)return;const n=JSON.stringify(t.mindMapNodes),r=JSON.stringify(s);n!==r&&m({...t,mindMapNodes:s})},[t,m]),z=c.useCallback(s=>{if(!t)return;const n=s.scale,r=s.height,i=t.mindMapScale??1,a=t.mindMapCanvasHeight;i===n&&a===r||m({...t,mindMapScale:n,mindMapCanvasHeight:r})},[t,m]),B=s=>{const n=s.target.value;w(n),t&&m({...t,rootCause:n})},D=async()=>{var i,a,o;if(!t)return;const s=t.problemStatement||"",n=t.dataAnalysisObservations||"",r=t.problemContext||"";if(s.trim()){I(!0),b(null);try{const h=`
You are an expert in A3 Problem Solving, Lean, and operational excellence.

You will receive:
- A3 Problem Statement
- Key observations and evidence from data analysis

Your task:
- Build a concise 5-Whys style cause tree for this problem that reflects typical industrial best practice.

Guidance:
- Focus on clear cause-and-effect logic.
- Avoid repeating the same cause text at the same level.
- When several detailed sub-causes share the same higher-level idea, represent that idea once as a parent "cause" node and place the detailed variations under "children".

Response requirements:
- Always respond in English.
- Return JSON ONLY with this exact structure:
{
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
  ]
}

Problem Statement:
${s}

${r?`Additional Context:
${r}

`:""}

Key Observations and Evidence:
${n||"(none provided)"}
`,d=await fetch("https://multi-model-worker.study-llm.me/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"deepseek",messages:[{role:"system",content:"You are an A3 Problem Solving coach that outputs strictly JSON in the requested schema."},{role:"user",content:h}],stream:!1})});if(!d.ok)throw new Error("Failed to generate why analysis");const Q=(((o=(a=(i=(await d.json()).choices)==null?void 0:i[0])==null?void 0:a.message)==null?void 0:o.content)||"{}").replace(/```json/gi,"").replace(/```/g,"").trim();let g;try{g=JSON.parse(Q)}catch{g={}}const P=Array.isArray(g.whyTree)?g.whyTree:[];if(P.length===0){b("AI did not return a valid why tree. Please try again.");return}const v=[],T=H(),Y=50,F=200;v.push({id:T,text:s,x:Y,y:F,width:260,height:100,parentId:null,type:"root"});const $=(Z,_,W,ee)=>{let p=ee;const J=120;return Z.forEach(u=>{if(!u||typeof u.cause!="string"||!u.cause.trim())return;const R=H();v.push({id:R,text:u.cause.trim(),x:W,y:p,parentId:_,type:"child"}),Array.isArray(u.children)&&u.children.length>0?p=$(u.children,R,W,p+J):p+=J}),p};$(P,T,Y,F+120),m({...t,mindMapNodes:v})}catch{b("Failed to generate why analysis. Please try again.")}finally{I(!1)}}},U=async()=>{var a,o,h;if(!t)return;const s=t.problemStatement||"",n=t.problemContext||"",r=t.dataAnalysisObservations||"",i=x||t.rootCause||"";if(!(!s.trim()||!i.trim())){S(!0),k(null),y(null);try{const l=[{role:"system",content:`You are an expert continuous improvement and operations coach.

You will receive:
- A3 Problem Statement
- Key observations from data analysis
- Identified root cause

Your task is to propose practical improvement actions that address the root cause.

Respond in English, even if the user's inputs are in another language.

Structure the answer with markdown headings:
## Short-term Actions
## Long-term Actions

Under each heading, list concise, actionable bullet points. Focus on actions that are realistic in a manufacturing or service environment.`},{role:"user",content:`Problem Statement:
${s}`+(n?`

Additional Context:
${n}`:"")+`

Key Observations from Data:
${r}

Identified Root Cause:
${i}`}],d=await fetch("https://multi-model-worker.study-llm.me/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"deepseek",messages:l,stream:!1})});if(!d.ok)throw new Error("Failed to generate improvement actions");let f=((h=(o=(a=(await d.json()).choices)==null?void 0:a[0])==null?void 0:o.message)==null?void 0:h.content)||"";f=f.replace(/^```[\s\S]*?```/g,"").trim(),y(f)}catch{k("Failed to generate improvement actions. Please try again.")}finally{S(!1)}}};return t?e.jsxs("div",{className:"space-y-6 w-full flex flex-col",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-xl font-bold text-gray-900 mb-2",children:"5 Whys Analysis"}),e.jsxs("div",{className:"flex items-center justify-between mb-4",children:[e.jsx("p",{className:"text-gray-500 mr-4",children:'Interactive Root Cause Analysis. Start with the problem and drill down by adding "Why" nodes.'}),e.jsx("button",{type:"button",onClick:D,disabled:M||!t.problemStatement||!(t.dataAnalysisObservations||(E=t.mindMapNodes)!=null&&E.length),className:"inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed",children:M?e.jsxs(e.Fragment,{children:[e.jsx(N,{className:"animate-spin -ml-0.5 mr-2 h-3 w-3"}),e.jsx("span",{className:"hidden sm:inline",children:"Analyzing whys..."})]}):e.jsxs(e.Fragment,{children:[e.jsx(G,{className:"-ml-0.5 mr-0 sm:mr-2 h-3 w-3"}),e.jsx("span",{className:"hidden sm:inline",children:"AI Why Analysis"})]})})]}),O&&e.jsx("div",{className:"mb-3 rounded-md bg-red-50 p-3",children:e.jsxs("div",{className:"flex",children:[e.jsx("div",{className:"flex-shrink-0",children:e.jsx(L,{className:"h-4 w-4 text-red-400"})}),e.jsx("div",{className:"ml-2 text-xs text-red-700",children:O})]})}),e.jsx("div",{className:"mt-2 flex flex-col",children:e.jsx(re,{initialNodes:t.mindMapNodes,onChange:q,initialScale:t.mindMapScale,fixedHeight:t.mindMapCanvasHeight??750,onViewChange:z})})]}),e.jsxs("div",{className:"mt-6",children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsx("label",{htmlFor:"rootCause",className:"block text-sm font-medium text-gray-700",children:"Identified Root Cause"}),e.jsx("button",{type:"button",onClick:U,disabled:j||!t.problemStatement||!(x||t.rootCause),className:"inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed",children:j?e.jsxs(e.Fragment,{children:[e.jsx(N,{className:"animate-spin -ml-0.5 mr-2 h-3 w-3"}),e.jsx("span",{className:"hidden sm:inline",children:"Generating actions..."})]}):e.jsxs(e.Fragment,{children:[e.jsx(ae,{className:"-ml-0.5 mr-0 sm:mr-2 h-3 w-3"}),e.jsx("span",{className:"hidden sm:inline",children:"AI Improvement Actions"})]})})]}),e.jsx("textarea",{id:"rootCause",rows:8,className:"shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border",placeholder:"Summarize the root cause identified from the analysis...",value:x,onChange:B}),C&&e.jsx("div",{className:"mt-3 rounded-md bg-red-50 p-3",children:e.jsxs("div",{className:"flex",children:[e.jsx("div",{className:"flex-shrink-0",children:e.jsx(L,{className:"h-4 w-4 text-red-400","aria-hidden":"true"})}),e.jsx("div",{className:"ml-2 text-sm text-red-700",children:C})]})}),A&&e.jsxs("div",{className:"mt-4 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden",children:[e.jsxs("div",{className:"bg-blue-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between",children:[e.jsxs("h3",{className:"text-xs font-bold text-blue-900 flex items-center",children:[e.jsx(G,{className:"h-4 w-4 mr-2 text-blue-600"}),"AI Improvement Actions"]}),e.jsx("button",{type:"button",className:"text-gray-400 hover:text-gray-500",onClick:()=>y(null),children:e.jsx(ne,{className:"h-4 w-4"})})]}),e.jsx("div",{className:"p-4",children:e.jsx("div",{className:"prose prose-sm max-w-none text-gray-700 bg-gray-50 p-3 rounded-md text-sm whitespace-pre-wrap",children:A})})]})]})]}):e.jsx("div",{className:"flex items-center justify-center py-16",children:e.jsxs("div",{className:"flex flex-col items-center",children:[e.jsx(N,{className:"w-8 h-8 animate-spin text-blue-600"}),e.jsx("p",{className:"mt-3 text-base font-medium text-gray-700",children:"Loading application data..."})]})})};export{me as default};
