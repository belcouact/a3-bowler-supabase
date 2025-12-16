import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Plus, BarChart3, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { useApp, A3Case } from '../context/AppContext';
import { useState } from 'react';
import A3CaseModal from './A3CaseModal';

const Layout = () => {
  const location = useLocation();
  const { bowlers, a3Cases, addBowler, addA3Case } = useApp();
  
  // Identify active module based on path
  const isMetricBowler = location.pathname.includes('/metric-bowler');
  const isA3Analysis = location.pathname.includes('/a3-analysis');

  const [newItemName, setNewItemName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isA3ModalOpen, setIsA3ModalOpen] = useState(false);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    if (isMetricBowler) {
      addBowler(newItemName);
      setNewItemName('');
      setIsAdding(false);
    }
  };

  const handlePlusClick = () => {
    if (isMetricBowler) {
        if (!isSidebarOpen) setIsSidebarOpen(true);
        setIsAdding(!isAdding);
    } else {
        setIsA3ModalOpen(true);
    }
  };

  const handleSaveA3Case = (data: Omit<A3Case, 'id'>) => {
      addA3Case(data);
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
        <aside className={clsx(
          "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out relative",
          isSidebarOpen ? "w-64" : "w-16"
        )}>
          {/* Toggle Button */}
          <button
             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
             className="absolute -right-3 top-16 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50 z-20 text-gray-500"
          >
             {isSidebarOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>

          <div className={clsx(
             "p-4 border-b border-gray-100 flex items-center bg-gray-50/50 h-14 overflow-hidden",
             isSidebarOpen ? "justify-between" : "justify-center"
          )}>
            {isSidebarOpen ? (
              <>
                <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider truncate">
                  {isMetricBowler ? 'Bowler Lists' : 'A3 Cases'}
                </h2>
                <button 
                  onClick={handlePlusClick}
                  className="p-1 rounded-md hover:bg-blue-100 text-blue-600 transition-colors"
                  title="Add New"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </>
            ) : (
               <button 
                  onClick={handlePlusClick}
                  className="p-1 rounded-md hover:bg-blue-100 text-blue-600 transition-colors"
                  title="Add New"
                >
                  <Plus className="w-5 h-5" />
                </button>
            )}
          </div>

          {/* Add Item Form */}
          {isAdding && isSidebarOpen && (
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
                  "group flex items-center py-2.5 text-sm font-medium rounded-lg transition-all",
                  isSidebarOpen ? "px-3 justify-between" : "px-0 justify-center",
                  location.pathname === `/metric-bowler/${bowler.id}`
                    ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
                title={!isSidebarOpen ? bowler.name : undefined}
              >
                <div className={clsx("flex items-center", isSidebarOpen ? "truncate" : "justify-center w-full")}>
                   <Target className={clsx("w-4 h-4 flex-shrink-0", isSidebarOpen ? "mr-3" : "mr-0", location.pathname === `/metric-bowler/${bowler.id}` ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500")} />
                   {isSidebarOpen && <span className="truncate">{bowler.name}</span>}
                </div>
              </Link>
            ))}

            {isA3Analysis && a3Cases.map((a3) => (
              <Link
                key={a3.id}
                to={`/a3-analysis/${a3.id}/problem-statement`}
                className={clsx(
                  "group flex items-center py-2.5 text-sm font-medium rounded-lg transition-all",
                  isSidebarOpen ? "px-3 justify-between" : "px-0 justify-center",
                  location.pathname.includes(`/a3-analysis/${a3.id}`)
                    ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
                title={!isSidebarOpen ? a3.title : undefined}
              >
                 <div className={clsx("flex items-center", isSidebarOpen ? "truncate" : "justify-center w-full")}>
                   <FileText className={clsx("w-4 h-4 flex-shrink-0", isSidebarOpen ? "mr-3" : "mr-0", location.pathname.includes(`/a3-analysis/${a3.id}`) ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500")} />
                   {isSidebarOpen && <span className="truncate">{a3.title}</span>}
                </div>
              </Link>
            ))}

            {((isMetricBowler && bowlers.length === 0) || (isA3Analysis && a3Cases.length === 0)) && !isAdding && (
               <div className={clsx("text-center py-8 text-gray-400 text-sm italic", isSidebarOpen ? "px-4" : "px-1 text-xs")}>
                  {isSidebarOpen ? "No items yet. Click + to add one." : "Empty"}
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

      <A3CaseModal 
        isOpen={isA3ModalOpen} 
        onClose={() => setIsA3ModalOpen(false)} 
        onSave={handleSaveA3Case} 
      />
    </div>
  );
};

export default Layout;
