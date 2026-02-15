import { Suspense, useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { useApp } from '../context/AppContext';
import { AlertCircle, BarChart2, GitBranch, Calendar, CheckCircle, FileText, Bot, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const A3Analysis = () => {
  const location = useLocation();
  const { id } = useParams();
  const { a3Cases } = useApp();

  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

  const updateScrollButtons = () => {
    const el = tabsContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  const handleScrollTabs = (direction: 'left' | 'right') => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.6;
    el.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const handleScroll = () => updateScrollButtons();
    handleScroll();
    el.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [location.pathname]);

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
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
        <div className="p-6 md:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-200">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-black text-slate-900 font-display tracking-tight leading-none">
                  {title}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 font-medium">
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
        <div className="bg-slate-50/50 border-t border-slate-100 px-6 py-12 md:px-12">
          <div className="relative">
            {/* Connector Line */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 rounded-full" />
            
            <div className="relative flex justify-between items-center gap-2 max-w-4xl mx-auto">
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
                      "w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ring-8 ring-white shadow-md",
                      isActive 
                        ? "bg-brand-600 text-white scale-110 shadow-xl shadow-brand-200 -translate-y-1" 
                        : isPast 
                          ? "bg-accent-500 text-white" 
                          : "bg-white text-slate-400 border-2 border-slate-100 group-hover:border-brand-200 group-hover:text-brand-500 group-hover:-translate-y-0.5"
                    )}>
                      {isPast ? (
                        <CheckCircle className="w-6 h-6 md:w-7 md:h-7" />
                      ) : (
                        <tab.icon className="w-6 h-6 md:w-7 md:h-7" />
                      )}
                    </div>
                    <div className="absolute -bottom-10 flex flex-col items-center">
                      <span className={clsx(
                        "whitespace-nowrap text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                        isActive ? "text-brand-700 translate-y-0 opacity-100" : "text-slate-400 group-hover:text-slate-600 translate-y-1 opacity-0 group-hover:opacity-100 md:opacity-100 md:translate-y-0"
                      )}>
                        {tab.label}
                      </span>
                      {isActive && (
                        <div className="w-1 h-1 rounded-full bg-brand-600 mt-1 animate-ping" />
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
      <div className="bg-white rounded-[2.5rem] shadow-medium border border-slate-100 overflow-hidden min-h-[600px] relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-600 to-accent-500 opacity-10" />
        <Suspense fallback={
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl border-4 border-brand-100 border-t-brand-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
                </div>
              </div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest animate-pulse">Initializing Workspace</p>
            </div>
          </div>
        }>
          <div className="p-6 md:p-12 lg:p-16">
            <Outlet />
          </div>
        </Suspense>
      </div>
    </div>
  );
};

export default A3Analysis;
