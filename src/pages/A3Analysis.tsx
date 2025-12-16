import { Link, Outlet, useLocation, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { useApp } from '../context/AppContext';

const A3Analysis = () => {
  const location = useLocation();
  const { id } = useParams();
  const { a3Cases } = useApp();
  
  const selectedCase = a3Cases.find(c => c.id === id);
  const title = selectedCase ? selectedCase.title : 'A3 Problem Solving';

  const tabs = [
    { path: 'problem-statement', label: 'Problem Statement' },
    { path: 'data-analysis', label: 'Data Analysis' },
    { path: 'why-analysis', label: 'Why Analysis' },
    { path: 'action-plan', label: 'Action Plan' },
    { path: 'result', label: 'Result' },
    { path: 'summary', label: 'Summary' },
  ];

  if (!id && a3Cases.length > 0) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
           <p className="text-lg font-medium">Select an A3 Case from the sidebar to view details.</p>
        </div>
      )
  }

  return (
    <div className="">
      <div className="bg-white p-3 md:p-6 shadow-sm border border-gray-200 border-b-0">
        <div className="mb-4 md:mb-6">
           <div className="flex justify-between items-start">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                In Progress
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
                  'py-2 px-3 md:py-3 md:px-6 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap',
                  isActive
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
      
      {location.pathname.includes('action-plan') ? (
        <div className="h-[600px] border-t border-gray-200">
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
