import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { useApp } from '../context/AppContext';
import { AlertCircle, BarChart2, GitBranch, Calendar, CheckCircle, FileText, Bot, ChevronLeft, ChevronRight } from 'lucide-react';

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
    <div className="">
      <div className="bg-white p-3 md:p-6 shadow-sm border border-gray-200 border-b-0">
        <div className="mb-4 md:mb-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
              <div className="mt-1 text-xs text-gray-500 space-x-3">
                <span>Owner: <span className="font-medium text-gray-700">{selectedCase.owner || 'Unassigned'}</span></span>
                <span>Group: <span className="font-medium text-gray-700">{selectedCase.group || 'Ungrouped'}</span></span>
              </div>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {selectedCase.status || 'In Progress'}
            </span>
          </div>
        </div>

        <div className="relative border-b border-gray-200">
          <button
            type="button"
            onClick={() => handleScrollTabs('left')}
            disabled={!canScrollLeft}
            className={clsx(
              'absolute left-0 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 shadow ring-1 ring-blue-100 text-blue-600 hover:text-blue-700 hover:bg-blue-100',
              !canScrollLeft && 'opacity-40 cursor-default'
            )}
            aria-label="Scroll tabs left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div
            ref={tabsContainerRef}
            className="no-scrollbar flex space-x-1 overflow-x-auto px-8"
          >
            {tabs.map(tab => {
              const isActive = location.pathname.includes(tab.path);
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={clsx(
                    'py-2 px-3 md:py-3 md:px-6 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap flex items-center',
                    isActive
                      ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  )}
                  title={tab.label}
                >
                  <tab.icon className={clsx('w-5 h-5 md:w-4 md:h-4 md:mr-2')} />
                  <span className="hidden md:inline">{tab.label}</span>
                </Link>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => handleScrollTabs('right')}
            disabled={!canScrollRight}
            className={clsx(
              'absolute right-0 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 shadow ring-1 ring-blue-100 text-blue-600 hover:text-blue-700 hover:bg-blue-100',
              !canScrollRight && 'opacity-40 cursor-default'
            )}
            aria-label="Scroll tabs right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {location.pathname.includes('action-plan') ? (
        <div className="h-[calc(100vh-14rem)] border-t border-gray-200">
          <Outlet />
        </div>
      ) : (
        <div className="bg-white p-3 md:p-8 shadow-sm border border-gray-200 min-h-[500px]">
          <Outlet />
        </div>
      )}
    </div>
  );
};

export default A3Analysis;
