import{W as ne,Z as ae,r as d,O as e,a4 as N,S as R,al as re,am as ie,X as oe,ad as G}from"./index-Cd_e0c_8.js";import{A as H}from"./alert-circle-CPh-GDhC.js";const pe=()=>{var E;const{id:L}=ne(),{a3Cases:X,updateA3Case:h}=ae(),t=X.find(s=>s.id===L),[p,w]=d.useState(""),[j,S]=d.useState(!1),[A,y]=d.useState(null),[C,k]=d.useState(null),[M,I]=d.useState(!1),[O,b]=d.useState(null);d.useEffect(()=>{t&&t.rootCause!==p&&w(t.rootCause||"")},[t]),d.useEffect(()=>{if(!(t!=null&&t.mindMapNodes))return;const s=t.mindMapNodes;if(s.length===0)return;const a=s.filter(n=>!n.parentId);let r="";const i=(n,o)=>{const u=s.filter(l=>l.parentId===n);u.sort((l,m)=>l.y-m.y);for(const l of u){const m="  ".repeat(o);r+=`${m}- ${l.text}
`,i(l.id,o+1)}};a.sort((n,o)=>n.y-o.y);for(const n of a)r+=`${n.text}
`,i(n.id,1);r!==t.mindMapText&&h({...t,mindMapText:r})},[t==null?void 0:t.mindMapNodes,h,t==null?void 0:t.id]);const K=d.useCallback(s=>{if(!t)return;const a=JSON.stringify(t.mindMapNodes),r=JSON.stringify(s);a!==r&&h({...t,mindMapNodes:s})},[t,h]),V=d.useCallback(s=>{if(!t)return;const a=s.scale,r=s.height,i=t.mindMapScale??1,n=t.mindMapCanvasHeight;i===a&&n===r||h({...t,mindMapScale:a,mindMapCanvasHeight:r})},[t,h]),q=s=>{const a=s.target.value;w(a),t&&h({...t,rootCause:a})},z=async()=>{var i,n,o;if(!t)return;const s=t.problemStatement||"",a=t.dataAnalysisObservations||"",r=t.problemContext||"";if(s.trim()){I(!0),b(null);try{const u=`
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
${a||"(none provided)"}
`,m=await fetch("https://multi-model-worker.study-llm.me/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"deepseek",messages:[{role:"system",content:"You are an A3 Problem Solving coach that outputs strictly JSON in the requested schema."},{role:"user",content:u}],stream:!1})});if(!m.ok)throw new Error("Failed to generate why analysis");const U=(((o=(n=(i=(await m.json()).choices)==null?void 0:i[0])==null?void 0:n.message)==null?void 0:o.content)||"{}").replace(/```json/gi,"").replace(/```/g,"").trim();let f;try{f=JSON.parse(U)}catch{f={}}const P=Array.isArray(f.whyTree)?f.whyTree:[];if(P.length===0){b("AI did not return a valid why tree. Please try again.");return}const g=[],T=G();g.push({id:T,text:s,x:50,y:200,width:260,height:100,parentId:null,type:"root"});const Y=(Z,F,Q)=>{const v=g.find(c=>c.id===F);if(!v)return;const W=Z.filter(c=>c&&typeof c.cause=="string"&&c.cause.trim()),$=W.length;W.forEach((c,_)=>{const J=G(),ee=$>1?_-($-1)/2:0,te=v.x+260,se=v.y+ee*120;g.push({id:J,text:c.cause.trim(),x:te,y:se,parentId:F,type:"child"}),Array.isArray(c.children)&&c.children.length>0&&Y(c.children,J,Q+1)})};Y(P,T,1),h({...t,mindMapNodes:g})}catch{b("Failed to generate why analysis. Please try again.")}finally{I(!1)}}},B=async()=>{var n,o,u;if(!t)return;const s=t.problemStatement||"",a=t.problemContext||"",r=t.dataAnalysisObservations||"",i=p||t.rootCause||"";if(!(!s.trim()||!i.trim())){S(!0),k(null),y(null);try{const l=[{role:"system",content:`You are an expert continuous improvement and operations coach.

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
${s}`+(a?`

Additional Context:
${a}`:"")+`

Key Observations from Data:
${r}

Identified Root Cause:
${i}`}],m=await fetch("https://multi-model-worker.study-llm.me/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"deepseek",messages:l,stream:!1})});if(!m.ok)throw new Error("Failed to generate improvement actions");let x=((u=(o=(n=(await m.json()).choices)==null?void 0:n[0])==null?void 0:o.message)==null?void 0:u.content)||"";x=x.replace(/^```[\s\S]*?```/g,"").trim(),y(x)}catch{k("Failed to generate improvement actions. Please try again.")}finally{S(!1)}}};return t?e.jsxs("div",{className:"space-y-6 w-full flex flex-col",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-xl font-bold text-gray-900 mb-2",children:"5 Whys Analysis"}),e.jsxs("div",{className:"flex items-center justify-between mb-4",children:[e.jsx("p",{className:"text-gray-500 mr-4",children:'Interactive Root Cause Analysis. Start with the problem and drill down by adding "Why" nodes.'}),e.jsx("button",{type:"button",onClick:z,disabled:M||!t.problemStatement||!(t.dataAnalysisObservations||(E=t.mindMapNodes)!=null&&E.length),className:"inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed",children:M?e.jsxs(e.Fragment,{children:[e.jsx(N,{className:"animate-spin -ml-0.5 mr-2 h-3 w-3"}),e.jsx("span",{className:"hidden sm:inline",children:"Analyzing whys..."})]}):e.jsxs(e.Fragment,{children:[e.jsx(R,{className:"-ml-0.5 mr-0 sm:mr-2 h-3 w-3"}),e.jsx("span",{className:"hidden sm:inline",children:"AI Why Analysis"})]})})]}),O&&e.jsx("div",{className:"mb-3 rounded-md bg-red-50 p-3",children:e.jsxs("div",{className:"flex",children:[e.jsx("div",{className:"flex-shrink-0",children:e.jsx(H,{className:"h-4 w-4 text-red-400"})}),e.jsx("div",{className:"ml-2 text-xs text-red-700",children:O})]})}),e.jsx("div",{className:"mt-2 flex flex-col",children:e.jsx(re,{initialNodes:t.mindMapNodes,onChange:K,initialScale:t.mindMapScale,fixedHeight:t.mindMapCanvasHeight??750,onViewChange:V})})]}),e.jsxs("div",{className:"mt-6",children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsx("label",{htmlFor:"rootCause",className:"block text-sm font-medium text-gray-700",children:"Identified Root Cause"}),e.jsx("button",{type:"button",onClick:B,disabled:j||!t.problemStatement||!(p||t.rootCause),className:"inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed",children:j?e.jsxs(e.Fragment,{children:[e.jsx(N,{className:"animate-spin -ml-0.5 mr-2 h-3 w-3"}),e.jsx("span",{className:"hidden sm:inline",children:"Generating actions..."})]}):e.jsxs(e.Fragment,{children:[e.jsx(ie,{className:"-ml-0.5 mr-0 sm:mr-2 h-3 w-3"}),e.jsx("span",{className:"hidden sm:inline",children:"AI Improvement Actions"})]})})]}),e.jsx("textarea",{id:"rootCause",rows:8,className:"shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border",placeholder:"Summarize the root cause identified from the analysis...",value:p,onChange:q}),C&&e.jsx("div",{className:"mt-3 rounded-md bg-red-50 p-3",children:e.jsxs("div",{className:"flex",children:[e.jsx("div",{className:"flex-shrink-0",children:e.jsx(H,{className:"h-4 w-4 text-red-400","aria-hidden":"true"})}),e.jsx("div",{className:"ml-2 text-sm text-red-700",children:C})]})}),A&&e.jsxs("div",{className:"mt-4 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden",children:[e.jsxs("div",{className:"bg-blue-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between",children:[e.jsxs("h3",{className:"text-xs font-bold text-blue-900 flex items-center",children:[e.jsx(R,{className:"h-4 w-4 mr-2 text-blue-600"}),"AI Improvement Actions"]}),e.jsx("button",{type:"button",className:"text-gray-400 hover:text-gray-500",onClick:()=>y(null),children:e.jsx(oe,{className:"h-4 w-4"})})]}),e.jsx("div",{className:"p-4",children:e.jsx("div",{className:"prose prose-sm max-w-none text-gray-700 bg-gray-50 p-3 rounded-md text-sm whitespace-pre-wrap",children:A})})]})]})]}):e.jsx("div",{className:"flex items-center justify-center py-16",children:e.jsxs("div",{className:"flex flex-col items-center",children:[e.jsx(N,{className:"w-8 h-8 animate-spin text-blue-600"}),e.jsx("p",{className:"mt-3 text-base font-medium text-gray-700",children:"Loading application data..."})]})})};export{pe as default};
