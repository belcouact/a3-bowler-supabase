import{W as V,Z as q,r as h,O as t,a4 as O,al as K,S as T,X as B,am as U,ad as W}from"./index-BFD_hz2V.js";import{A as Z}from"./alert-circle-CwoEB0-7.js";const ie=()=>{const{id:P}=V(),{a3Cases:Y,updateA3Case:o}=q(),e=Y.find(s=>s.id===P),[g,y]=h.useState(""),[v,N]=h.useState(!1),[j,p]=h.useState(null);h.useEffect(()=>{e&&e.rootCause!==g&&y(e.rootCause||"")},[e]),h.useEffect(()=>{if(!(e!=null&&e.mindMapNodes))return;const s=e.mindMapNodes;if(s.length===0)return;const n=s.filter(a=>!a.parentId);let r="";const l=(a,d)=>{const x=s.filter(c=>c.parentId===a);x.sort((c,m)=>c.y-m.y);for(const c of x){const m="  ".repeat(d);r+=`${m}- ${c.text}
`,l(c.id,d+1)}};n.sort((a,d)=>a.y-d.y);for(const a of n)r+=`${a.text}
`,l(a.id,1);r!==e.mindMapText&&o({...e,mindMapText:r})},[e==null?void 0:e.mindMapNodes,o,e==null?void 0:e.id]);const J=h.useCallback(s=>{if(!e)return;const n=JSON.stringify(e.mindMapNodes),r=JSON.stringify(s);n!==r&&o({...e,mindMapNodes:s})},[e,o]),I=h.useCallback(s=>{if(!e)return;const n=s.scale,r=s.height,l=e.mindMapScale??1,a=e.mindMapCanvasHeight;l===n&&a===r||o({...e,mindMapScale:n,mindMapCanvasHeight:r})},[e,o]),R=s=>{const n=s.target.value;y(n),e&&o({...e,rootCause:n})},$=async()=>{var l,a,d;if(!e)return;const s=e.problemStatement||"",n=e.dataAnalysisObservations||"",r=e.problemContext||"";if(s.trim()){N(!0),p(null);try{const x=`
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
`,m=await fetch("https://multi-model-worker.study-llm.me/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"deepseek",messages:[{role:"system",content:"You are an A3 Problem Solving coach that outputs strictly JSON in the requested schema."},{role:"user",content:x}],stream:!1})});if(!m.ok)throw new Error("Failed to generate why analysis");const H=(((d=(a=(l=(await m.json()).choices)==null?void 0:l[0])==null?void 0:a.message)==null?void 0:d.content)||"{}").replace(/```json/gi,"").replace(/```/g,"").trim();let u;try{u=JSON.parse(H)}catch{u={}}const w=Array.isArray(u.whyTree)?u.whyTree:[];if(w.length===0){p("AI did not return a valid why tree. Please try again.");return}const f=[],S=W();f.push({id:S,text:s,x:50,y:200,width:260,height:100,parentId:null,type:"root"});const A=(F,C,L)=>{const b=f.find(i=>i.id===C);if(!b)return;const M=F.filter(i=>i&&typeof i.cause=="string"&&i.cause.trim()),k=M.length;M.forEach((i,X)=>{const E=W(),G=k>1?X-(k-1)/2:0,z=b.x+260,D=b.y+G*120;f.push({id:E,text:i.cause.trim(),x:z,y:D,parentId:C,type:"child"}),Array.isArray(i.children)&&i.children.length>0&&A(i.children,E,L+1)})};A(w,S,1),o({...e,mindMapNodes:f})}catch{p("Failed to generate why analysis. Please try again.")}finally{N(!1)}}};return e?t.jsxs("div",{className:"space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700",children:[t.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60",children:[t.jsxs("div",{className:"flex items-center gap-3",children:[t.jsx("div",{className:"p-2 bg-brand-50 rounded-lg text-brand-600",children:t.jsx(K,{className:"w-6 h-6"})}),t.jsxs("div",{children:[t.jsx("h2",{className:"text-2xl font-bold text-slate-900 font-display",children:"Root Cause Analysis"}),t.jsx("p",{className:"text-sm text-slate-500 mt-0.5",children:'Explore the "Why" behind the problem to find real solutions.'})]})]}),t.jsx("button",{onClick:$,disabled:v||!(e!=null&&e.problemStatement),className:"group relative inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none",children:v?t.jsxs(t.Fragment,{children:[t.jsx(O,{className:"w-4 h-4 animate-spin"}),t.jsx("span",{children:"Analyzing..."})]}):t.jsxs(t.Fragment,{children:[t.jsx(T,{className:"w-4 h-4 transition-transform group-hover:rotate-12"}),t.jsx("span",{children:"AI Cause Analysis"})]})})]}),j&&t.jsxs("div",{className:"flex items-center gap-3 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl animate-in fade-in slide-in-from-top-4",children:[t.jsx(Z,{className:"w-5 h-5 shrink-0"}),t.jsx("p",{className:"text-sm font-medium",children:j}),t.jsx("button",{onClick:()=>p(null),className:"ml-auto p-1 hover:bg-red-100 rounded-lg transition-colors",children:t.jsx(B,{className:"w-4 h-4"})})]}),t.jsxs("div",{className:"bg-slate-50 rounded-3xl border-2 border-slate-200/50 overflow-hidden shadow-inner relative min-h-[500px]",children:[t.jsx(U,{initialNodes:e==null?void 0:e.mindMapNodes,onChange:J,onViewChange:I,initialScale:e==null?void 0:e.mindMapScale,fixedHeight:(e==null?void 0:e.mindMapCanvasHeight)??500}),t.jsx("div",{className:"absolute bottom-4 left-4 right-4 sm:right-auto pointer-events-none",children:t.jsxs("div",{className:"bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-slate-200/60 shadow-sm flex items-center gap-3",children:[t.jsx("div",{className:"w-2 h-2 rounded-full bg-brand-500 animate-pulse"}),t.jsxs("p",{className:"text-xs font-medium text-slate-600",children:["Drag nodes to move • Double-click to edit • Use ",t.jsx("span",{className:"inline-flex items-center px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-900",children:"+"})," to expand"]})]})})]}),t.jsxs("div",{className:"bg-white p-8 rounded-3xl shadow-sm border border-slate-200/60 relative overflow-hidden group",children:[t.jsx("div",{className:"absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700 opacity-50"}),t.jsxs("div",{className:"relative",children:[t.jsxs("div",{className:"flex items-center gap-3 mb-6",children:[t.jsx("div",{className:"p-2 bg-brand-50 rounded-lg text-brand-600",children:t.jsx(T,{className:"w-5 h-5"})}),t.jsx("h3",{className:"text-lg font-bold text-slate-900",children:"Determined Root Cause"})]}),t.jsx("textarea",{value:g,onChange:R,placeholder:"Summarize the ultimate root cause identified through your 'Why' analysis...",className:"w-full min-h-[120px] p-5 bg-slate-50 border-2 border-slate-200/60 rounded-2xl text-slate-700 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all resize-none placeholder:text-slate-400"}),t.jsxs("div",{className:"mt-4 flex items-center justify-between text-xs text-slate-400 font-medium",children:[t.jsx("p",{children:"This summary will be used to generate your Action Plan."}),t.jsxs("p",{children:[g.length," characters"]})]})]})]})]}):t.jsx("div",{className:"flex items-center justify-center py-24",children:t.jsxs("div",{className:"flex flex-col items-center",children:[t.jsx(O,{className:"w-10 h-10 animate-spin text-brand-600"}),t.jsx("p",{className:"mt-4 text-slate-500 font-medium animate-pulse",children:"Loading analysis data..."})]})})};export{ie as default};
