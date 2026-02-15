import { Suspense } from 'react';
import { Link, Outlet, useLocation, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { useApp } from '../context/AppContext';
import { AlertCircle, BarChart2, GitBranch, Calendar, CheckCircle, FileText, Bot } from 'lucide-react';

const A3Analysis = () => {
  const location = useLocation();
  const { id } = useParams();
  const { a3Cases } = useApp();

  const selectedCase = a3Cases.find(c => c.id === id);
  const title = selectedCase ? selectedCase.title : 'A3 Problem Solving';

  const tabs = [
    { path: 'problem-statement', label: 'Problem Statement', icon: AlertCircle },
    { path: 'data-analysis', label: 'Data Analysis', icon: BarChart2 },
    { path: 'why-analysis', label: 'Root Cause', icon: GitBranch },
    { path: 'action-plan', label: 'Action Plan', icon: Calendar },
    { path: 'result', label: 'Result Validation', icon: CheckCircle },
    { path: 'summary', label: 'A3 Report', icon: FileText },
    { path: 'ai-coach', label: 'AI Coach', icon: Bot },
  ];

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500">
        <p className="text-lg font-medium">Select an A3 Case from the sidebar to view details.</p>
      </div>
    );
  }

  if (!selectedCase) {
    return (
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
           <p className="text-lg font-medium">Case not found.</p>
        </div>
      )
  }

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-100 overflow-hidden">
        <div className="p-4 md:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-200">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 font-display tracking-tight leading-none">
                  {title}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    Owner: <span className="font-bold text-slate-700">{selectedCase.owner || 'Unassigned'}</span>
                  </span>
                  <span className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    Group: <span className="font-bold text-slate-700">{selectedCase.group || 'Ungrouped'}</span>
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={clsx(
                "px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all shadow-sm",
                selectedCase.status === 'Completed' 
                  ? "bg-accent-50 text-accent-700 border-accent-100 shadow-accent-100" 
                  : "bg-brand-50 text-brand-700 border-brand-100 shadow-brand-100"
              )}>
                {selectedCase.status || 'In Progress'}
              </div>
            </div>
          </div>
        </div>

        {/* Stepper Navigation */}
        <div className="bg-slate-50/50 border-t border-slate-100 px-6 pt-4 pb-10 md:px-12 mb-2">
          <div className="relative">
            {/* Connector Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 rounded-full" />
            
            <div className="relative flex justify-between items-center gap-2 max-w-6xl mx-auto">
              {tabs.map((tab, index) => {
                const activeIndex = tabs.findIndex(t => location.pathname.includes(t.path));
                const isActive = activeIndex === index;
                const isPast = activeIndex > index;
                
                return (
                  <Link
                    key={tab.path}
                    to={tab.path}
                    className="group relative flex flex-col items-center z-10"
                  >
                    <div className={clsx(
                      "w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center transition-all duration-500 ring-4 ring-white shadow-sm",
                      isActive 
                        ? "bg-brand-600 text-white scale-110 shadow-lg shadow-brand-200 -translate-y-0.5" 
                        : isPast 
                          ? "bg-accent-500 text-white" 
                          : "bg-white text-slate-400 border border-slate-100 group-hover:border-brand-200 group-hover:text-brand-500 group-hover:-translate-y-0.5"
                    )}>
                      {isPast ? (
                        <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                      ) : (
                        <tab.icon className="w-4 h-4 md:w-5 md:h-5" />
                      )}
                    </div>
                    <div className="absolute -bottom-7 flex flex-col items-center">
                      <span className={clsx(
                        "whitespace-nowrap text-[8px] md:text-[9px] font-black uppercase tracking-wider transition-all duration-300",
                        isActive ? "text-brand-700 translate-y-0 opacity-100" : "text-slate-400 group-hover:text-slate-600 translate-y-1 opacity-0 group-hover:opacity-100 md:opacity-100 md:translate-y-0"
                      )}>
                        {tab.label}
                      </span>
                      {isActive && (
                        <div className="w-1 h-1 rounded-full bg-brand-600 mt-0.5 animate-ping" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white min-h-[600px] relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-600 to-accent-500 opacity-10" />
        <Suspense fallback={
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl border-2 border-brand-100 border-t-brand-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-600 animate-pulse" />
                </div>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">Initializing Workspace</p>
            </div>
          </div>
        }>
          <div className="p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </Suspense>
      </div>
    </div>
  );
};

export default A3Analysis;
