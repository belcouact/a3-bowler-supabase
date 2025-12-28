import{V as _,Y as ee,r as c,O as e,a3 as N,S as R,ah as te,X as se,aa as G}from"./index--O4BBDcs.js";import{M as ae}from"./MindMap-DhV7yYYT.js";import{A as $}from"./alert-circle-DhRv79UT.js";import"./zoom-out-VZgSLub0.js";import"./trash-2-abbdZrRh.js";const ce=()=>{var E;const{id:H}=_(),{a3Cases:L,updateA3Case:d}=ee(),t=L.find(s=>s.id===H),[x,j]=c.useState(""),[w,S]=c.useState(!1),[A,y]=c.useState(null),[C,k]=c.useState(null),[M,I]=c.useState(!1),[O,b]=c.useState(null);c.useEffect(()=>{t&&t.rootCause!==x&&j(t.rootCause||"")},[t]),c.useEffect(()=>{if(!(t!=null&&t.mindMapNodes))return;const s=t.mindMapNodes;if(s.length===0)return;const r=s.filter(a=>!a.parentId);let n="";const o=(a,l)=>{const h=s.filter(i=>i.parentId===a);h.sort((i,u)=>i.y-u.y);for(const i of h){const u="  ".repeat(l);n+=`${u}- ${i.text}
`,o(i.id,l+1)}};r.sort((a,l)=>a.y-l.y);for(const a of r)n+=`${a.text}
`,o(a.id,1);n!==t.mindMapText&&d({...t,mindMapText:n})},[t==null?void 0:t.mindMapNodes,d,t==null?void 0:t.id]);const K=c.useCallback(s=>{if(!t)return;const r=JSON.stringify(t.mindMapNodes),n=JSON.stringify(s);r!==n&&d({...t,mindMapNodes:s})},[t,d]),V=c.useCallback(s=>{if(!t)return;const r=s.scale,n=s.height,o=t.mindMapScale??1,a=t.mindMapCanvasHeight;o===r&&a===n||d({...t,mindMapScale:r,mindMapCanvasHeight:n})},[t,d]),q=s=>{const r=s.target.value;j(r),t&&d({...t,rootCause:r})},z=async()=>{var n,o,a;if(!t)return;const s=t.problemStatement||"",r=t.dataAnalysisObservations||"";if(s.trim()){I(!0),b(null);try{const l=`
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

Key Observations and Evidence:
${r||"(none provided)"}
`,i=await fetch("https://multi-model-worker.study-llm.me/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"deepseek",messages:[{role:"system",content:"You are an A3 Problem Solving coach that outputs strictly JSON in the requested schema."},{role:"user",content:l}],stream:!1})});if(!i.ok)throw new Error("Failed to generate why analysis");const X=(((a=(o=(n=(await i.json()).choices)==null?void 0:n[0])==null?void 0:o.message)==null?void 0:a.content)||"{}").replace(/```json/gi,"").replace(/```/g,"").trim();let g;try{g=JSON.parse(X)}catch{g={}}const P=Array.isArray(g.whyTree)?g.whyTree:[];if(P.length===0){b("AI did not return a valid why tree. Please try again.");return}const v=[],F=G();v.push({id:F,text:s,x:50,y:200,width:260,height:100,parentId:null,type:"root"});const W=(B,D,Y,Q)=>{let p=Q;const T=120,Z=220;return B.forEach(m=>{if(!m||typeof m.cause!="string"||!m.cause.trim())return;const J=G();v.push({id:J,text:m.cause.trim(),x:50+Z*Y,y:p,parentId:D,type:"child"}),Array.isArray(m.children)&&m.children.length>0?p=W(m.children,J,Y+1,p+T):p+=T}),p};W(P,F,1,260),d({...t,mindMapNodes:v})}catch{b("Failed to generate why analysis. Please try again.")}finally{I(!1)}}},U=async()=>{var o,a,l;if(!t)return;const s=t.problemStatement||"",r=t.dataAnalysisObservations||"",n=x||t.rootCause||"";if(!(!s.trim()||!n.trim())){S(!0),k(null),y(null);try{const h=[{role:"system",content:`You are an expert continuous improvement and operations coach.

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
${s}

Key Observations from Data:
${r}

Identified Root Cause:
${n}`}],i=await fetch("https://multi-model-worker.study-llm.me/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"deepseek",messages:h,stream:!1})});if(!i.ok)throw new Error("Failed to generate improvement actions");let f=((l=(a=(o=(await i.json()).choices)==null?void 0:o[0])==null?void 0:a.message)==null?void 0:l.content)||"";f=f.replace(/^```[\s\S]*?```/g,"").trim(),y(f)}catch{k("Failed to generate improvement actions. Please try again.")}finally{S(!1)}}};return t?e.jsxs("div",{className:"space-y-6 w-full flex flex-col",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-xl font-bold text-gray-900 mb-2",children:"5 Whys Analysis"}),e.jsx("p",{className:"text-gray-500 mb-4",children:'Interactive Root Cause Analysis. Start with the problem and drill down by adding "Why" nodes.'})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsx("p",{className:"text-xs text-gray-500 mr-4",children:"Use AI to create an initial 5 Whys cause chain directly in the canvas."}),e.jsx("button",{type:"button",onClick:z,disabled:M||!t.problemStatement||!(t.dataAnalysisObservations||(E=t.mindMapNodes)!=null&&E.length),className:"inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed",children:M?e.jsxs(e.Fragment,{children:[e.jsx(N,{className:"animate-spin -ml-0.5 mr-2 h-3 w-3"}),e.jsx("span",{className:"hidden sm:inline",children:"Analyzing whys..."})]}):e.jsxs(e.Fragment,{children:[e.jsx(R,{className:"-ml-0.5 mr-0 sm:mr-2 h-3 w-3"}),e.jsx("span",{className:"hidden sm:inline",children:"AI Why Analysis"})]})})]}),O&&e.jsx("div",{className:"mb-3 rounded-md bg-red-50 p-3",children:e.jsxs("div",{className:"flex",children:[e.jsx("div",{className:"flex-shrink-0",children:e.jsx($,{className:"h-4 w-4 text-red-400"})}),e.jsx("div",{className:"ml-2 text-xs text-red-700",children:O})]})})]}),e.jsx("div",{className:"flex flex-col",children:e.jsx(ae,{initialNodes:t.mindMapNodes,onChange:K,initialScale:t.mindMapScale,fixedHeight:t.mindMapCanvasHeight,onViewChange:V})}),e.jsxs("div",{className:"mt-6",children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsx("label",{htmlFor:"rootCause",className:"block text-sm font-medium text-gray-700",children:"Identified Root Cause"}),e.jsx("button",{type:"button",onClick:U,disabled:w||!t.problemStatement||!(x||t.rootCause),className:"inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed",children:w?e.jsxs(e.Fragment,{children:[e.jsx(N,{className:"animate-spin -ml-0.5 mr-2 h-3 w-3"}),e.jsx("span",{className:"hidden sm:inline",children:"Generating actions..."})]}):e.jsxs(e.Fragment,{children:[e.jsx(te,{className:"-ml-0.5 mr-0 sm:mr-2 h-3 w-3"}),e.jsx("span",{className:"hidden sm:inline",children:"AI Improvement Actions"})]})})]}),e.jsx("textarea",{id:"rootCause",rows:8,className:"shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border",placeholder:"Summarize the root cause identified from the analysis...",value:x,onChange:q}),C&&e.jsx("div",{className:"mt-3 rounded-md bg-red-50 p-3",children:e.jsxs("div",{className:"flex",children:[e.jsx("div",{className:"flex-shrink-0",children:e.jsx($,{className:"h-4 w-4 text-red-400","aria-hidden":"true"})}),e.jsx("div",{className:"ml-2 text-sm text-red-700",children:C})]})}),A&&e.jsxs("div",{className:"mt-4 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden",children:[e.jsxs("div",{className:"bg-blue-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between",children:[e.jsxs("h3",{className:"text-xs font-bold text-blue-900 flex items-center",children:[e.jsx(R,{className:"h-4 w-4 mr-2 text-blue-600"}),"AI Improvement Actions"]}),e.jsx("button",{type:"button",className:"text-gray-400 hover:text-gray-500",onClick:()=>y(null),children:e.jsx(se,{className:"h-4 w-4"})})]}),e.jsx("div",{className:"p-4",children:e.jsx("div",{className:"prose prose-sm max-w-none text-gray-700 bg-gray-50 p-3 rounded-md text-sm whitespace-pre-wrap",children:A})})]})]})]}):e.jsx("div",{className:"flex items-center justify-center py-16",children:e.jsxs("div",{className:"flex flex-col items-center",children:[e.jsx(N,{className:"w-8 h-8 animate-spin text-blue-600"}),e.jsx("p",{className:"mt-3 text-base font-medium text-gray-700",children:"Loading application data..."})]})})};export{ce as default};
