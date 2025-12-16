import { Link, Outlet, useLocation } from 'react-router-dom';
import clsx from 'clsx';

const A3Analysis = () => {
  const location = useLocation();

  const tabs = [
    { path: 'problem-statement', label: 'Problem Statement' },
    { path: 'data-analysis', label: 'Data Analysis' },
    { path: 'why-analysis', label: 'Why Analysis' },
    { path: 'action-plan', label: 'Action Plan' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">A3 Problem Solving Process</h2>
        <div className="flex space-x-4 border-b border-gray-200">
          {tabs.map((tab) => {
            const isActive = location.pathname.includes(tab.path);
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={clsx(
                  'py-2 px-4 border-b-2 font-medium text-sm transition-colors',
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow min-h-[500px]">
        <Outlet />
      </div>
    </div>
  );
};

export default A3Analysis;
