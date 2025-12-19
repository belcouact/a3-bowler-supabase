import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, BarChart3, ChevronLeft, ChevronRight, ChevronDown, LogOut, User as UserIcon, Save, Loader2, Sparkles, Info, Zap, FileText, ExternalLink, Upload, Download, MoreVertical, TrendingUp, Layers, NotepadText, BrainCircuit } from 'lucide-react';
import clsx from 'clsx';
import { useApp, A3Case } from '../context/AppContext';
import { Bowler, Metric } from '../types';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import A3CaseModal from './A3CaseModal';
import BowlerModal from './BowlerModal';
import LoginModal from './LoginModal';
import { AccountSettingsModal } from './AccountSettingsModal';
import { AIChatModal } from './AIChatModal';
import { AppInfoModal } from './AppInfoModal';
import { dataService } from '../services/dataService';
import { useToast } from '../context/ToastContext';
import { ConsolidateModal } from './ConsolidateModal';
import { ImportModal } from './ImportModal';
import { SummaryModal } from './SummaryModal';
import { generateComprehensiveSummary } from '../services/aiService';
import { getBowlerStatusColor } from '../utils/metricUtils';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bowlers, a3Cases, addBowler, updateBowler, addA3Case, updateA3Case, deleteBowler, deleteA3Case, reorderBowlers, reorderA3Cases, isLoading: isDataLoading, dashboardMarkdown } = useApp();
  const { user, logout, isLoading } = useAuth();
  const toast = useToast();
  
  // Identify active module based on path
  const isMetricBowler = location.pathname.includes('/metric-bowler');
  const isA3Analysis = location.pathname.includes('/a3-analysis');
  const isMindMap = location.pathname.includes('/mindmap');

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isA3ModalOpen, setIsA3ModalOpen] = useState(false);
  const [editingA3Case, setEditingA3Case] = useState<A3Case | null>(null);
  const [isBowlerModalOpen, setIsBowlerModalOpen] = useState(false);
  const [editingBowler, setEditingBowler] = useState<Bowler | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [initialAIPrompt, setInitialAIPrompt] = useState<string | undefined>(undefined);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryContent, setSummaryContent] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isConsolidateModalOpen, setIsConsolidateModalOpen] = useState(false);
  const [isAppInfoOpen, setIsAppInfoOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const isGroupExpanded = (group: string) => {
    return expandedGroups[group] !== false; // Default to expanded
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (isMetricBowler) {
      const buckets: Record<string, Bowler[]> = { ungrouped: [] };
      const ungrouped = bowlers.filter(b => !b.objective);
      buckets['ungrouped'] = [...ungrouped];
      
      const grouped = bowlers.filter(b => !!b.objective).reduce((acc, bowler) => {
          const group = bowler.objective!;
          if (!acc[group]) acc[group] = [];
          acc[group].push(bowler);
          return acc;
      }, {} as Record<string, Bowler[]>);
      Object.assign(buckets, grouped);
      
      const sourceKey = source.droppableId === 'ungrouped' ? 'ungrouped' : source.droppableId.replace('group-', '');
      const destKey = destination.droppableId === 'ungrouped' ? 'ungrouped' : destination.droppableId.replace('group-', '');
      
      const sourceList = buckets[sourceKey];
      const destList = buckets[destKey];
      if (!sourceList || !destList) return;
      
      const [movedItem] = sourceList.splice(source.index, 1);
      
      if (sourceKey !== destKey) {
          if (destKey === 'ungrouped') {
              movedItem.objective = undefined;
          } else {
              movedItem.objective = destKey;
          }
      }
      
      destList.splice(destination.index, 0, movedItem);
      
      const sortedGroupKeys = Object.keys(buckets).filter(k => k !== 'ungrouped').sort();
      let newBowlers = [...buckets['ungrouped']];
      sortedGroupKeys.forEach(key => {
          newBowlers = [...newBowlers, ...buckets[key]];
      });
      reorderBowlers(newBowlers);

    } else if (isA3Analysis) {
      const buckets: Record<string, A3Case[]> = { ungrouped: [] };
      const ungrouped = a3Cases.filter(a => !a.group);
      buckets['ungrouped'] = [...ungrouped];
      
      const grouped = a3Cases.filter(a => !!a.group).reduce((acc, a3) => {
          const group = a3.group!;
          if (!acc[group]) acc[group] = [];
          acc[group].push(a3);
          return acc;
      }, {} as Record<string, A3Case[]>);
      Object.assign(buckets, grouped);
      
      const sourceKey = source.droppableId === 'ungrouped' ? 'ungrouped' : source.droppableId.replace('group-', '');
      const destKey = destination.droppableId === 'ungrouped' ? 'ungrouped' : destination.droppableId.replace('group-', '');
      
      const sourceList = buckets[sourceKey];
      const destList = buckets[destKey];
      if (!sourceList || !destList) return;
      
      const [movedItem] = sourceList.splice(source.index, 1);
      
      if (sourceKey !== destKey) {
          if (destKey === 'ungrouped') {
              movedItem.group = undefined;
          } else {
              movedItem.group = destKey;
          }
      }
      
      destList.splice(destination.index, 0, movedItem);
      
      const sortedGroupKeys = Object.keys(buckets).filter(k => k !== 'ungrouped').sort();
      let newA3Cases = [...buckets['ungrouped']];
      sortedGroupKeys.forEach(key => {
          newA3Cases = [...newA3Cases, ...buckets[key]];
      });
      reorderA3Cases(newA3Cases);
    }
  };

  const handleImport = (importedData: Record<string, { bowler: Partial<Bowler>, metrics: Metric[] }>) => {
    let createdCount = 0;
    let updatedCount = 0;

    Object.entries(importedData).forEach(([bowlerName, { bowler, metrics }]) => {
      const existingBowler = bowlers.find(b => b.name === bowlerName);

      if (existingBowler) {
        const mergedMetrics = [...(existingBowler.metrics || [])];

        metrics.forEach(impMetric => {
          const existingMetricIndex = mergedMetrics.findIndex(m => m.name === impMetric.name);

          if (existingMetricIndex >= 0) {
            const existingMetric = mergedMetrics[existingMetricIndex];
            mergedMetrics[existingMetricIndex] = {
              ...existingMetric,
              ...impMetric,
              id: existingMetric.id,
              monthlyData: {
                ...existingMetric.monthlyData,
                ...impMetric.monthlyData
              }
            };
          } else {
            mergedMetrics.push(impMetric);
          }
        });

        updateBowler({
          ...existingBowler,
          ...bowler,
          metrics: mergedMetrics
        });
        updatedCount++;
      } else {
        addBowler({
          name: bowlerName,
          ...bowler,
          metrics,
          description: bowler.description || 'Imported from CSV'
        });
        createdCount++;
      }
    });

    if (createdCount === 0 && updatedCount === 0) {
      toast.info('No data imported.');
    } else {
      toast.success(`Import completed: ${createdCount} created, ${updatedCount} updated.`);
    }
  };

  const handleDownloadAllCSV = () => {
    if (bowlers.length === 0) {
      toast.info('No data to download.');
      return;
    }

    const monthKeySet = new Set<string>();

    bowlers.forEach(bowler => {
      (bowler.metrics || []).forEach(metric => {
        const monthly = metric.monthlyData || {};
        Object.keys(monthly).forEach(key => monthKeySet.add(key));
      });
    });

    const monthKeys = Array.from(monthKeySet).sort();

    if (monthKeys.length === 0) {
      toast.info('No metric data to download.');
      return;
    }

    const monthLabels = monthKeys.map(key => {
      const [year, monthStr] = key.split('-');
      const monthIndex = parseInt(monthStr, 10) - 1;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = monthNames[monthIndex] || monthStr;
      return `${year}/${monthName}`;
    });

    const header = `"Bowler Name","Metric Name","Scope","Type",${monthLabels.map(l => `"${l}"`).join(',')}\n`;

    const rows = bowlers.flatMap(bowler =>
      (bowler.metrics || []).flatMap(metric => {
        const basicInfo = `"${bowler.name}","${metric.name}","${metric.scope || ''}"`;

        const targetRowData = monthKeys
          .map(key => `"${metric.monthlyData?.[key]?.target || ''}"`)
          .join(',');

        const actualRowData = monthKeys
          .map(key => `"${metric.monthlyData?.[key]?.actual || ''}"`)
          .join(',');

        return [
          `${basicInfo},"Target",${targetRowData}`,
          `${basicInfo},"Actual",${actualRowData}`
        ];
      })
    ).join('\n');

    if (!rows) {
      toast.info('No metric rows to download.');
      return;
    }

    const csvContent = '\uFEFF' + header + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'all_bowlers_metrics.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOneClickSummary = async () => {
    setIsGeneratingSummary(true);
    setSummaryContent('');
    setIsSummaryModalOpen(true);
    
    try {
      const context = JSON.stringify({
        bowlers: bowlers.map(b => ({
          name: b.name,
          description: b.description,
          metrics: (b.metrics || []).map(m => ({
            name: m.name,
            scope: m.scope,
            monthlyData: m.monthlyData
          }))
        })),
        a3Cases: a3Cases.map(c => ({
          title: c.title,
          problemStatement: c.problemStatement,
          status: c.status,
          rootCause: c.rootCause
        }))
      });
      
      const prompt = "Provide a comprehensive and visually engaging executive summary of the metrics. Use emojis (e.g., 🟢, 🔴, ⚠️, 📈, 📉) liberally to visually represent status and trends. \n\nStructure the report with:\n1. **Executive Overview**: High-level performance snapshot.\n2. **Detailed Analysis**: By Group/Bowler. **CRITICAL**: For each metric/bowler, include specific **Industry Insights** or **Benchmarks** to provide context (e.g., 'Industry avg is X%').\n3. **Strategic Recommendations**: Actionable improvement suggestions based on the data and industry best practices.\n4. **A3 Problem Solving Status**: Summary of active cases.\n\nMake the output look like a professional business intelligence report.";
      
      const summary = await generateComprehensiveSummary(context, prompt);
      setSummaryContent(summary);
    } catch (error) {
      console.error('Summary generation error:', error);
      setSummaryContent("Failed to generate summary. Please try again.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleSaveData = async () => {
    if (!user) {
      toast.error('Please login to save data.');
      return;
    }
    setIsSaving(true);
      try {
        await dataService.saveData(bowlers, a3Cases, user.username, dashboardMarkdown);
        toast.success('Data saved successfully!');
      } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save data. Please check if the backend is running.');
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

  const handleExit = () => {
    if (window.confirm("Are you sure you want to exit to the main app (study-llm.me)? Unsaved changes may be lost.")) {
      window.location.href = "https://study-llm.me";
    }
  };

  const navItems = [
    { path: '/metric-bowler', label: 'Metric Bowler', icon: TrendingUp },
    { path: '/a3-analysis', label: 'A3 Analysis', icon: Zap },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {(isLoading || isDataLoading) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <p className="mt-4 text-base font-medium text-gray-700">Loading application data...</p>
          </div>
        </div>
      )}
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 z-[60] shadow-sm h-16 flex items-center px-6 justify-between relative">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight hidden md:block">Performance Tracker</h1>
            <button 
                onClick={() => setIsAppInfoOpen(true)}
                className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors ml-2 shadow-sm"
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
        
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Desktop Toolbar */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={handleExit}
              className="p-2 rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-red-600 transition-colors"
              title="Exit to Main App"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
                onClick={() => navigate('/mindmap')}
                className="p-2 rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                title="Mindmap your ideas"
              >
                <BrainCircuit className="w-4 h-4" />
              </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="p-2 rounded-md bg-green-500 text-white shadow-sm hover:bg-green-600 transition-colors"
              title="Import CSV"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownloadAllCSV}
              className="p-2 rounded-md bg-blue-500 text-white shadow-sm hover:bg-blue-600 transition-colors"
              title="Download all bowlers"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={handleOneClickSummary}
              className="p-2 bg-teal-600 text-white rounded-md shadow-sm hover:bg-teal-700 transition-colors"
              title="One Click Summary by AI"
            >
              <NotepadText className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsAIChatOpen(true)}
              className="p-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 transition-colors"
              title="Ask AI"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsConsolidateModalOpen(true)}
              className="p-2 bg-purple-600 text-white rounded-md shadow-sm hover:bg-purple-700 transition-colors"
              title="Consolidate Bowlers"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          <div className="md:hidden relative">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {isMobileMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-[100] border border-gray-200">
                  <button
                    onClick={() => {
                      handleExit();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-red-600"
                  >
                    <ExternalLink className="w-4 h-4 mr-3" />
                    Exit App
                  </button>
                  
                  <button
                    onClick={() => {
                      navigate('/mindmap');
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                  >
                    <BrainCircuit className="w-4 h-4 mr-3" />
                    Mindmap your ideas
                  </button>
                  <button
                    onClick={() => {
                      setIsImportModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-green-600"
                  >
                    <Upload className="w-4 h-4 mr-3" />
                    Import CSV
                  </button>
                  <button
                    onClick={() => {
                      handleDownloadAllCSV();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                  >
                    <Download className="w-4 h-4 mr-3" />
                    Download
                  </button>
                  <button
                    onClick={() => {
                      setIsConsolidateModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-purple-600"
                  >
                    <Layers className="w-4 h-4 mr-3" />
                    Consolidate
                  </button>

                  <button
                    onClick={() => {
                      handleOneClickSummary();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-teal-600"
                  >
                    <NotepadText className="w-4 h-4 mr-3" />
                    One Click Summary
                  </button>

                  <button
                    onClick={() => {
                      setIsAIChatOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-indigo-600"
                  >
                    <Sparkles className="w-4 h-4 mr-3" />
                    Ask AI
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleSaveData}
            disabled={isSaving}
            className="p-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 transition-colors disabled:opacity-50"
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
              <div 
                className="flex items-center space-x-2 text-sm cursor-pointer hover:opacity-80 transition-opacity" 
                title={user.username || 'User'}
                onClick={() => setIsAccountSettingsOpen(true)}
              >
                <div className="h-8 w-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
                  {user.username ? user.username.substring(0, 2).toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
              </div>
              <button 
                onClick={() => {
                  if (window.confirm("Are you sure you want to logout? Unsaved changes may be lost.")) {
                    logout();
                  }
                }}
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
        {!isMindMap && (
        <aside className={clsx(
          "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out relative",
          isSidebarOpen ? "w-64 absolute z-50 h-full md:relative" : "w-0 md:w-16"
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
              {isMetricBowler && (() => {
                  const ungrouped = bowlers.filter(b => !b.objective);
                  const grouped = bowlers.filter(b => !!b.objective).reduce((acc, bowler) => {
                      const group = bowler.objective!;
                      if (!acc[group]) acc[group] = [];
                      acc[group].push(bowler);
                      return acc;
                  }, {} as Record<string, Bowler[]>);
                  
                  const sortedGroups = Object.keys(grouped).sort();

                  return (
                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="ungrouped">
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1">
                            {/* Ungrouped Items */}
                            {ungrouped.map((bowler, index) => (
                                <Draggable key={bowler.id} draggableId={bowler.id} index={index}>
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                    >
                                      <Link
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
                                              <div className={clsx(
                                                  "w-5 h-5 flex-shrink-0 flex items-center justify-center rounded text-[10px] font-bold uppercase transition-colors",
                                                  isSidebarOpen ? "mr-3" : "mr-0",
                                                  bowler.statusColor || getBowlerStatusColor(bowler)
                                              )}>
                                                  {bowler.name?.charAt(0) || '?'}
                                              </div>
                                              {isSidebarOpen && <span className="truncate">{bowler.name}</span>}
                                          </div>
                                      </Link>
                                    </div>
                                  )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>

                        {/* Grouped Items */}
                        {sortedGroups.map(group => (
                            <div key={group} className="mt-2">
                                <button
                                    onClick={() => toggleGroup(group)}
                                    className={clsx(
                                        "flex items-center w-full text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 hover:text-gray-700 transition-colors",
                                        isSidebarOpen ? "px-3" : "justify-center"
                                    )}
                                    title={group}
                                >
                                    {isSidebarOpen ? (
                                        <>
                                            {isGroupExpanded(group) ? <ChevronDown className="w-3 h-3 mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}
                                            <span className="truncate">{group}</span>
                                        </>
                                    ) : (
                                        <div className="flex justify-center w-full">
                                            {isGroupExpanded(group) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                        </div>
                                    )}
                                </button>
                                
                                {isGroupExpanded(group) && (
                                    <Droppable droppableId={`group-${group}`}>
                                      {(provided) => (
                                        <div 
                                          ref={provided.innerRef}
                                          {...provided.droppableProps}
                                          className={clsx("space-y-1", isSidebarOpen && "pl-3 border-l-2 border-gray-100 ml-2")}
                                        >
                                            {grouped[group].map((bowler, index) => (
                                                <Draggable key={bowler.id} draggableId={bowler.id} index={index}>
                                                  {(provided) => (
                                                    <div
                                                      ref={provided.innerRef}
                                                      {...provided.draggableProps}
                                                      {...provided.dragHandleProps}
                                                    >
                                                      <Link
                                                          to={`/metric-bowler/${bowler.id}`}
                                                          onDoubleClick={(e) => {
                                                              e.preventDefault();
                                                              setEditingBowler(bowler);
                                                              setIsBowlerModalOpen(true);
                                                          }}
                                                          className={clsx(
                                                              "group flex items-center py-2 text-sm font-medium rounded-lg transition-all",
                                                              isSidebarOpen ? "px-3 justify-between" : "px-0 justify-center",
                                                              location.pathname === `/metric-bowler/${bowler.id}`
                                                              ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                                                              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                                          )}
                                                          title={!isSidebarOpen ? bowler.name : undefined}
                                                      >
                                                          <div className={clsx("flex items-center", isSidebarOpen ? "truncate" : "justify-center w-full")}>
                                                              <div className={clsx(
                                                                  "w-5 h-5 flex-shrink-0 flex items-center justify-center rounded text-[10px] font-bold uppercase transition-colors",
                                                                  isSidebarOpen ? "mr-3" : "mr-0",
                                                                  bowler.statusColor || getBowlerStatusColor(bowler)
                                                              )}>
                                                                  {bowler.name?.charAt(0) || '?'}
                                                              </div>
                                                              {isSidebarOpen && <span className="truncate">{bowler.name}</span>}
                                                          </div>
                                                      </Link>
                                                    </div>
                                                  )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                      )}
                                    </Droppable>
                                )}
                            </div>
                        ))}
                    </DragDropContext>
                  );
              })()}

              {isA3Analysis && (() => {
                  const ungrouped = a3Cases.filter(a => !a.group);
                  const grouped = a3Cases.filter(a => !!a.group).reduce((acc, a3) => {
                      const group = a3.group!;
                      if (!acc[group]) acc[group] = [];
                      acc[group].push(a3);
                      return acc;
                  }, {} as Record<string, A3Case[]>);
                  
                  const sortedGroups = Object.keys(grouped).sort();

                  return (
                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="ungrouped">
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1">
                            {/* Ungrouped Items */}
                            {ungrouped.map((a3, index) => (
                                <Draggable key={a3.id} draggableId={a3.id} index={index}>
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                    >
                                        <Link
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
                                            title={a3.description || (!isSidebarOpen ? a3.title : undefined)}
                                        >
                                            <div className={clsx("flex items-center", isSidebarOpen ? "truncate" : "justify-center w-full")}>
                                                <FileText className={clsx("w-4 h-4 flex-shrink-0", isSidebarOpen ? "mr-3" : "mr-0", location.pathname.includes(`/a3-analysis/${a3.id}`) ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500")} />
                                                {isSidebarOpen && <span className="truncate">{a3.title}</span>}
                                            </div>
                                        </Link>
                                    </div>
                                  )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>

                        {/* Grouped Items */}
                        {sortedGroups.map(group => (
                            <div key={group} className="mt-2">
                                <button
                                    onClick={() => toggleGroup(group)}
                                    className={clsx(
                                        "flex items-center w-full text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 hover:text-gray-700 transition-colors",
                                        isSidebarOpen ? "px-3" : "justify-center"
                                    )}
                                    title={group}
                                >
                                    {isSidebarOpen ? (
                                        <>
                                            {isGroupExpanded(group) ? <ChevronDown className="w-3 h-3 mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}
                                            <span className="truncate">{group}</span>
                                        </>
                                    ) : (
                                        <div className="flex justify-center w-full">
                                            {isGroupExpanded(group) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                        </div>
                                    )}
                                </button>
                                
                                {isGroupExpanded(group) && (
                                    <Droppable droppableId={`group-${group}`}>
                                      {(provided) => (
                                        <div 
                                          ref={provided.innerRef}
                                          {...provided.droppableProps}
                                          className={clsx("space-y-1", isSidebarOpen && "pl-3 border-l-2 border-gray-100 ml-2")}
                                        >
                                            {grouped[group].map((a3, index) => (
                                                <Draggable key={a3.id} draggableId={a3.id} index={index}>
                                                  {(provided) => (
                                                    <div
                                                      ref={provided.innerRef}
                                                      {...provided.draggableProps}
                                                      {...provided.dragHandleProps}
                                                    >
                                                        <Link
                                                            to={`/a3-analysis/${a3.id}/problem-statement`}
                                                            onDoubleClick={(e) => {
                                                                e.preventDefault();
                                                                setEditingA3Case(a3);
                                                                setIsA3ModalOpen(true);
                                                            }}
                                                            className={clsx(
                                                                "group flex items-center py-2 text-sm font-medium rounded-lg transition-all",
                                                                isSidebarOpen ? "px-3 justify-between" : "px-0 justify-center",
                                                                location.pathname.includes(`/a3-analysis/${a3.id}`)
                                                                ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                                                                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                                            )}
                                                            title={a3.description || (!isSidebarOpen ? a3.title : undefined)}
                                                        >
                                                            <div className={clsx("flex items-center", isSidebarOpen ? "truncate" : "justify-center w-full")}>
                                                                <FileText className={clsx("w-4 h-4 flex-shrink-0", isSidebarOpen ? "mr-3" : "mr-0", location.pathname.includes(`/a3-analysis/${a3.id}`) ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500")} />
                                                                {isSidebarOpen && <span className="truncate">{a3.title}</span>}
                                                            </div>
                                                        </Link>
                                                    </div>
                                                  )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                      )}
                                    </Droppable>
                                )}
                            </div>
                        ))}
                      </DragDropContext>
                  );
              })()}

              {((isMetricBowler && bowlers.length === 0) || (isA3Analysis && a3Cases.length === 0)) && (
                <div className={clsx("text-center py-8 text-gray-400 text-sm italic", isSidebarOpen ? "px-4" : "px-1 text-xs")}>
                    {isSidebarOpen ? "No items yet. Click + to add one." : "Empty"}
                </div>
              )}
            </div>
          </div>
        </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 bg-gray-50 min-w-0">
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

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
      />

      <AccountSettingsModal 
        isOpen={isAccountSettingsOpen} 
        onClose={() => setIsAccountSettingsOpen(false)} 
      />

      <AIChatModal
        isOpen={isAIChatOpen}
        onClose={() => {
            setIsAIChatOpen(false);
            setInitialAIPrompt(undefined);
        }}
        initialPrompt={initialAIPrompt}
      />

      <SummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        content={summaryContent}
        isLoading={isGeneratingSummary}
      />

      <AppInfoModal
        isOpen={isAppInfoOpen}
        onClose={() => setIsAppInfoOpen(false)}
      />

      <ConsolidateModal
        isOpen={isConsolidateModalOpen}
        onClose={() => setIsConsolidateModalOpen(false)}
      />
    </div>
  );
};

export default Layout;
