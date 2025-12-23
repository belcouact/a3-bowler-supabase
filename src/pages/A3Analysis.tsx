import { Link, Outlet, useLocation, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import clsx from 'clsx';
import { useApp } from '../context/AppContext';
import { AlertCircle, BarChart2, GitBranch, Calendar, CheckCircle, FileText } from 'lucide-react';
import { isViolation } from '../utils/metricUtils';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatMonthLabel = (key: string): string => {
  const [year, monthStr] = key.split('-');
  const monthIndex = parseInt(monthStr, 10) - 1;
  const monthName = monthNames[monthIndex] || monthStr;
  return `${year}/${monthName}`;
};

const A3Analysis = () => {
  const location = useLocation();
  const { id } = useParams();
  const { a3Cases, bowlers } = useApp();

  const selectedCase = a3Cases.find(c => c.id === id);
  const title = selectedCase ? selectedCase.title : 'A3 Problem Solving';

  const linkedMetrics = useMemo(() => {
    if (!selectedCase || !selectedCase.linkedMetricIds || selectedCase.linkedMetricIds.length === 0) {
      return [];
    }

    const idSet = new Set(selectedCase.linkedMetricIds);
    const result: {
      id: string;
      name: string;
      bowlerName: string;
      latestLabel: string;
      latestActual?: string;
      latestTarget?: string;
      latestStatus: 'met' | 'missed' | 'no-data';
    }[] = [];

    bowlers.forEach(bowler => {
      (bowler.metrics || []).forEach(metric => {
        if (!idSet.has(metric.id)) {
          return;
        }

        const monthly = metric.monthlyData || {};
        const keys = Object.keys(monthly)
          .filter(key => {
            const data = monthly[key];
            return data && (data.actual || data.target);
          })
          .sort();

        if (keys.length === 0) {
          result.push({
            id: metric.id,
            name: metric.name,
            bowlerName: bowler.name,
            latestLabel: 'No data',
            latestStatus: 'no-data',
          });
          return;
        }

        const latestKey = keys[keys.length - 1];
        const latestData = monthly[latestKey];
        const latestLabel = formatMonthLabel(latestKey);

        let latestStatus: 'met' | 'missed' | 'no-data' = 'no-data';
        if (latestData && latestData.actual && latestData.target) {
          const violation = isViolation(metric.targetMeetingRule, latestData.target, latestData.actual);
          latestStatus = violation ? 'missed' : 'met';
        }

        result.push({
          id: metric.id,
          name: metric.name,
          bowlerName: bowler.name,
          latestLabel,
          latestActual: latestData?.actual,
          latestTarget: latestData?.target,
          latestStatus,
        });

        idSet.delete(metric.id);
      });
    });

    return result;
  }, [selectedCase, bowlers]);

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
              {linkedMetrics.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                    Linked metrics
                  </p>
                  <div className="flex flex-col md:flex-row md:flex-wrap gap-2">
                    {linkedMetrics.map(metric => (
                      <div
                        key={metric.id}
                        className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-[11px] md:text-xs"
                      >
                        <div>
                          <p className="font-medium text-gray-800">
                            {metric.name}
                            <span className="ml-1 text-[10px] text-gray-500">
                              ({metric.bowlerName})
                            </span>
                          </p>
                          {metric.latestStatus === 'no-data' ? (
                            <p className="mt-0.5 text-[11px] text-gray-500">
                              No data recorded yet.
                            </p>
                          ) : (
                            <p className="mt-0.5 text-[11px] text-gray-500">
                              Latest {metric.latestLabel}:{' '}
                              <span className="font-semibold text-gray-800">
                                {metric.latestActual}
                              </span>
                              {metric.latestTarget && (
                                <>
                                  {' '}
                                  vs target{' '}
                                  <span className="font-semibold text-gray-800">
                                    {metric.latestTarget}
                                  </span>
                                </>
                              )}
                            </p>
                          )}
                        </div>
                        <span
                          className={clsx(
                            'ml-3 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                            metric.latestStatus === 'met'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : metric.latestStatus === 'missed'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-gray-50 text-gray-500 border border-gray-200',
                          )}
                        >
                          {metric.latestStatus === 'met'
                            ? 'On target'
                            : metric.latestStatus === 'missed'
                            ? 'Off target'
                            : 'No data'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {selectedCase.status || 'In Progress'}
            </span>
          </div>
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
