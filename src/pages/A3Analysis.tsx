import { Link, Outlet, useLocation, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AlertCircle, BarChart2, GitBranch, Calendar, CheckCircle, FileText } from 'lucide-react';

const A3Analysis = () => {
  const location = useLocation();
  const { id } = useParams();
  const { a3Cases } = useApp();

  const selectedCase = a3Cases.find(c => c.id === id);
  const title = selectedCase ? selectedCase.title : 'A3 Problem Solving';

  const portfolioStats = useMemo(() => {
    const total = a3Cases.length;

    const statusCounts: Record<string, number> = {};
    const priorityCounts: Record<string, number> = {};
    const groupCounts: Record<string, number> = {};

    let active = 0;
    let completed = 0;
    let overdue = 0;

    let groupedCount = 0;
    let ungroupedCount = 0;

    const today = new Date();

    a3Cases.forEach(c => {
      const statusKey = (c.status || 'Not Started').trim();
      statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1;

      const priorityKey = (c.priority || 'Medium').trim();
      priorityCounts[priorityKey] = (priorityCounts[priorityKey] || 0) + 1;

      const groupKey = (c.group || '').trim();
      if (groupKey) {
        groupCounts[groupKey] = (groupCounts[groupKey] || 0) + 1;
        groupedCount += 1;
      } else {
        ungroupedCount += 1;
      }

      if (statusKey === 'Completed') {
        completed += 1;
      } else {
        active += 1;
        if (c.endDate) {
          const end = new Date(c.endDate);
          if (!isNaN(end.getTime()) && end < today) {
            overdue += 1;
          }
        }
      }
    });

    const notStarted = statusCounts['Not Started'] || 0;
    const inProgress = statusCounts['In Progress'] || 0;

    const groupNames = Object.keys(groupCounts);
    const groupCount = groupNames.length;

    let largestGroupName: string | null = null;
    let largestGroupSize = 0;

    groupNames.forEach(name => {
      const size = groupCounts[name];
      if (size > largestGroupSize) {
        largestGroupSize = size;
        largestGroupName = name;
      }
    });

    return {
      total,
      active,
      completed,
      overdue,
      notStarted,
      inProgress,
      priorityCounts,
      groupCount,
      groupedCount,
      ungroupedCount,
      largestGroupName,
      largestGroupSize
    };
  }, [a3Cases]);

  const tabs = [
    { path: 'problem-statement', label: 'Problem Statement', icon: AlertCircle },
    { path: 'data-analysis', label: 'Data Analysis', icon: BarChart2 },
    { path: 'why-analysis', label: 'Root Cause', icon: GitBranch },
    { path: 'action-plan', label: 'Action Plan', icon: Calendar },
    { path: 'result', label: 'Result', icon: CheckCircle },
    { path: 'summary', label: 'Report', icon: FileText },
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

          {portfolioStats.total > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total A3 Cases</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{portfolioStats.total}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {portfolioStats.active} active, {portfolioStats.completed} completed
                </p>
              </div>
              <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-3">
                <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Status Mix</p>
                <p className="mt-1 text-sm text-blue-900">
                  {portfolioStats.inProgress} In Progress, {portfolioStats.notStarted} Not Started
                </p>
                <p className="mt-1 text-xs text-blue-700">
                  {portfolioStats.overdue > 0 ? `${portfolioStats.overdue} overdue` : 'No overdue cases'}
                </p>
              </div>
              <div className="rounded-lg border border-amber-100 bg-amber-50/70 px-3 py-3">
                <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">Priority</p>
                <p className="mt-1 text-sm text-amber-900">
                  {(portfolioStats.priorityCounts['High'] || 0)} High, {(portfolioStats.priorityCounts['Medium'] || 0)} Medium
                </p>
                <p className="mt-1 text-xs text-amber-700">
                  {(portfolioStats.priorityCounts['Low'] || 0)} Low
                </p>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-3">
                <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Groups</p>
                <p className="mt-1 text-sm text-emerald-900">
                  {portfolioStats.groupCount || 0} group{portfolioStats.groupCount === 1 ? '' : 's'} in portfolio
                </p>
                <p className="mt-1 text-xs text-emerald-700">
                  {portfolioStats.ungroupedCount > 0
                    ? `${portfolioStats.ungroupedCount} case${portfolioStats.ungroupedCount === 1 ? '' : 's'} ungrouped`
                    : 'All cases assigned to a group'}
                </p>
                {portfolioStats.largestGroupName && portfolioStats.largestGroupSize > 0 && (
                  <p className="mt-1 text-xs text-emerald-700">
                    Largest: {portfolioStats.largestGroupName} ({portfolioStats.largestGroupSize})
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-1 border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => {
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
                <tab.icon className={clsx("w-5 h-5 md:w-4 md:h-4 md:mr-2")} />
                <span className="hidden md:inline">{tab.label}</span>
              </Link>
            );
          })}
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
