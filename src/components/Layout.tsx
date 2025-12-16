import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { LayoutDashboard, FileText, Plus, ChevronRight, BarChart3, Target } from 'lucide-react';
import clsx from 'clsx';
import { useApp } from '../context/AppContext';
import { useState } from 'react';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bowlers, a3Cases, addBowler, addA3Case } = useApp();
  
  // Identify active module based on path
  const isMetricBowler = location.pathname.includes('/metric-bowler');
  const isA3Analysis = location.pathname.includes('/a3-analysis');

  const [newItemName, setNewItemName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    if (isMetricBowler) {
      addBowler(newItemName);
    } else {
      addA3Case(newItemName);
    }
    setNewItemName('');
    setIsAdding(false);
  };

  const navItems = [
    { path: '/metric-bowler', label: 'Metric Bowler', icon: LayoutDashboard },
    { path: '/a3-analysis', label: 'A3 Analysis', icon: FileText },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 z-10 shadow-sm h-16 flex items-center px-6 justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Performance Tracker</h1>
          </div>
          
          <nav className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    'flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon className={clsx("w-4 h-4 mr-2", isActive ? "text-blue-600" : "text-gray-400")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-600 font-bold text-xs">
            JD
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Dynamic Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">
              {isMetricBowler ? 'Bowler Lists' : 'A3 Cases'}
            </h2>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="p-1 rounded-md hover:bg-blue-100 text-blue-600 transition-colors"
              title="Add New"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Add Item Form */}
          {isAdding && (
            <div className="p-3 border-b border-gray-100 bg-blue-50">
              <form onSubmit={handleAddItem}>
                <input
                  type="text"
                  autoFocus
                  placeholder={isMetricBowler ? "New Bowler Name..." : "New A3 Title..."}
                  className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onBlur={() => !newItemName && setIsAdding(false)}
                />
              </form>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {isMetricBowler && bowlers.map((bowler) => (
              <Link
                key={bowler.id}
                to={`/metric-bowler/${bowler.id}`}
                className={clsx(
                  "group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all",
                  location.pathname === `/metric-bowler/${bowler.id}`
                    ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <div className="flex items-center truncate">
                   <Target className={clsx("w-4 h-4 mr-3 flex-shrink-0", location.pathname === `/metric-bowler/${bowler.id}` ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500")} />
                   <span className="truncate">{bowler.name}</span>
                </div>
              </Link>
            ))}

            {isA3Analysis && a3Cases.map((a3) => (
              <Link
                key={a3.id}
                to={`/a3-analysis/${a3.id}/problem-statement`}
                className={clsx(
                  "group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all",
                  location.pathname.includes(`/a3-analysis/${a3.id}`)
                    ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                 <div className="flex items-center truncate">
                   <FileText className={clsx("w-4 h-4 mr-3 flex-shrink-0", location.pathname.includes(`/a3-analysis/${a3.id}`) ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500")} />
                   <span className="truncate">{a3.title}</span>
                </div>
              </Link>
            ))}

            {((isMetricBowler && bowlers.length === 0) || (isA3Analysis && a3Cases.length === 0)) && !isAdding && (
               <div className="text-center py-8 px-4 text-gray-400 text-sm italic">
                  No items yet. Click + to add one.
               </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <div className="max-w-6xl mx-auto">
             <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
