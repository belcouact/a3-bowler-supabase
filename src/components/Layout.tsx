import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Plus, BarChart3, Target, ChevronLeft, ChevronRight, LogOut, User as UserIcon, Save, Loader2, Sparkles, Info, Workflow } from 'lucide-react';
import clsx from 'clsx';
import { useApp, A3Case, Bowler } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import A3CaseModal from './A3CaseModal';
import BowlerModal from './BowlerModal';
import LoginModal from './LoginModal';
import { AIChatModal } from './AIChatModal';
import { AppInfoModal } from './AppInfoModal';
import { dataService } from '../services/dataService';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bowlers, a3Cases, addBowler, updateBowler, addA3Case, updateA3Case, deleteBowler, deleteA3Case } = useApp();
  const { user, logout, isLoading } = useAuth();
  
  // Identify active module based on path
  const isMetricBowler = location.pathname.includes('/metric-bowler');
  const isA3Analysis = location.pathname.includes('/a3-analysis');

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isA3ModalOpen, setIsA3ModalOpen] = useState(false);
  const [editingA3Case, setEditingA3Case] = useState<A3Case | null>(null);
  const [isBowlerModalOpen, setIsBowlerModalOpen] = useState(false);
  const [editingBowler, setEditingBowler] = useState<Bowler | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isAppInfoOpen, setIsAppInfoOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveData = async () => {
    if (!user) {
      alert('Please login to save data.');
      return;
    }
    setIsSaving(true);
    try {
      await dataService.saveData(bowlers, a3Cases, user.username);
      alert('Data saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save data. Please check if the backend is running.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlusClick = () => {
    if (isMetricBowler) {
        setEditingBowler(null);
        setIsBowlerModalOpen(true);
    } else {
        setEditingA3Case(null);
        setIsA3ModalOpen(true);
    }
  };

  const handleSaveA3Case = (data: Omit<A3Case, 'id'>) => {
      if (editingA3Case) {
        updateA3Case({
            ...editingA3Case,
            ...data
        });
      } else {
        addA3Case(data);
      }
      setEditingA3Case(null);
  };

  const handleSaveBowler = (data: Omit<Bowler, 'id'>) => {
      if (editingBowler) {
        updateBowler({
            ...editingBowler,
            ...data
        });
      } else {
        addBowler(data);
      }
      setEditingBowler(null);
  };

  const handleDeleteBowler = (id: string) => {
    if (window.confirm('Are you sure you want to delete this Bowler list?')) {
      deleteBowler(id);
      setIsBowlerModalOpen(false);
      setEditingBowler(null);
      if (location.pathname.includes(`/metric-bowler/${id}`)) {
        navigate('/metric-bowler');
      }
    }
  };

  const handleDeleteA3Case = (id: string) => {
    if (window.confirm('Are you sure you want to delete this A3 Case?')) {
      deleteA3Case(id);
      setIsA3ModalOpen(false);
      setEditingA3Case(null);
      if (location.pathname.includes(`/a3-analysis/${id}`)) {
        navigate('/a3-analysis');
      }
    }
  };

  const navItems = [
    { path: '/mindmap', label: 'Front Page', icon: Workflow },
    { path: '/metric-bowler', label: 'Metric Bowler', icon: LayoutDashboard },
    { path: '/a3-analysis', label: 'A3 Analysis', icon: FileText },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 z-10 shadow-sm h-16 flex items-center px-6 justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Performance Tracker</h1>
            <button 
                onClick={() => setIsAppInfoOpen(true)}
                className="text-gray-400 hover:text-blue-600 transition-colors ml-1"
                title="About this app"
            >
                <Info className="w-5 h-5" />
            </button>
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
                    'flex items-center px-3 md:px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                  title={item.label}
                >
                  <Icon className={clsx("w-5 h-5 md:w-4 md:h-4 md:mr-2", isActive ? "text-blue-600" : "text-gray-400")} />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsAIChatOpen(true)}
            className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
            title="Ask AI"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <button
            onClick={handleSaveData}
            disabled={isSaving}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            title={isSaving ? "Saving..." : "Save Data"}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
          </button>

          {user ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm" title={user.username || 'User'}>
                <div className="h-8 w-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
                  {user.username ? user.username.substring(0, 2).toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
              </div>
              <button 
                onClick={logout}
                disabled={isLoading}
                className="text-gray-500 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
                title="Logout"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              title="Login"
            >
              <UserIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1">
        {/* Dynamic Sidebar */}
        <aside className={clsx(
          "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out relative",
          isSidebarOpen ? "w-64 absolute z-20 h-full md:relative" : "w-0 md:w-16"
        )}>
          {/* Toggle Button */}
          <button
             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
             className="absolute -right-3 top-16 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50 z-20 text-gray-500"
          >
             {isSidebarOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>

          <div className="flex flex-col w-full h-full overflow-hidden">
            <div className={clsx(
              "p-4 border-b border-gray-100 flex items-center bg-gray-50/50 h-14 overflow-hidden flex-shrink-0",
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
            
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {isMetricBowler && bowlers.map((bowler) => (
                <Link
                  key={bowler.id}
                  to={`/metric-bowler/${bowler.id}`}
                  onDoubleClick={(e) => {
                      e.preventDefault();
                      setEditingBowler(bowler);
                      setIsBowlerModalOpen(true);
                  }}
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
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    setEditingA3Case(a3);
                    setIsA3ModalOpen(true);
                  }}
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

              {((isMetricBowler && bowlers.length === 0) || (isA3Analysis && a3Cases.length === 0)) && (
                <div className={clsx("text-center py-8 text-gray-400 text-sm italic", isSidebarOpen ? "px-4" : "px-1 text-xs")}>
                    {isSidebarOpen ? "No items yet. Click + to add one." : "Empty"}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-gray-50">
           <Outlet />
        </main>
      </div>

      <A3CaseModal 
        isOpen={isA3ModalOpen} 
        onClose={() => {
            setIsA3ModalOpen(false);
            setEditingA3Case(null);
        }}
        onSave={handleSaveA3Case} 
        onDelete={handleDeleteA3Case}
        initialData={editingA3Case || undefined}
      />

      <BowlerModal 
        isOpen={isBowlerModalOpen} 
        onClose={() => {
            setIsBowlerModalOpen(false);
            setEditingBowler(null);
        }}
        onSave={handleSaveBowler} 
        onDelete={handleDeleteBowler}
        initialData={editingBowler || undefined}
      />

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />

      <AIChatModal
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
      />

      <AppInfoModal
        isOpen={isAppInfoOpen}
        onClose={() => setIsAppInfoOpen(false)}
      />
    </div>
  );
};

export default Layout;
