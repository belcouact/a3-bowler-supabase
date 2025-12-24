import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, ChevronLeft, ChevronRight, ChevronDown, LogOut, User as UserIcon, Save, Loader2, Sparkles, Info, Zap, FileText, ExternalLink, Upload, Download, MoreVertical, TrendingUp, Layers, NotepadText, Lightbulb, Filter, Bot, Inbox } from 'lucide-react';
import clsx from 'clsx';
import { useApp, A3Case } from '../context/AppContext';
import { Bowler, Metric, AIModelKey, GroupPerformanceRow } from '../types';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { dataService } from '../services/dataService';
import { useToast } from '../context/ToastContext';
import { getBowlerStatusColor, isViolation } from '../utils/metricUtils';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { diffDays, addDays, formatDate, getMonthName } from '../utils/dateUtils';

const A3CaseModal = lazy(() => import('./A3CaseModal'));
const BowlerModal = lazy(() => import('./BowlerModal'));
const LoginModal = lazy(() => import('./LoginModal'));
const AccountSettingsModal = lazy(() =>
  import('./AccountSettingsModal').then(module => ({ default: module.AccountSettingsModal })),
);
const AIChatModal = lazy(() =>
  import('./AIChatModal').then(module => ({ default: module.AIChatModal })),
);
const AppInfoModal = lazy(() =>
  import('./AppInfoModal').then(module => ({ default: module.AppInfoModal })),
);
const ConsolidateModal = lazy(() =>
  import('./ConsolidateModal').then(module => ({ default: module.ConsolidateModal })),
);
const ImportModal = lazy(() =>
  import('./ImportModal').then(module => ({ default: module.ImportModal })),
);
const SummaryModal = lazy(() =>
  import('./SummaryModal').then(module => ({ default: module.SummaryModal })),
);
const MindmapModal = lazy(() =>
  import('./MindmapModal').then(module => ({ default: module.MindmapModal })),
);

const modelOptions: { key: AIModelKey; label: string }[] = [
  { key: 'gemini', label: 'gemini-3-flash' },
  { key: 'deepseek', label: 'deepseek-chat' },
  { key: 'kimi', label: 'moonshot-v1' },
  { key: 'glm', label: 'glm-4.5' },
];

const modelShortLabels: Record<AIModelKey, string> = {
  gemini: 'GE',
  deepseek: 'DS',
  kimi: 'KI',
  glm: 'GL',
};

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    bowlers,
    a3Cases,
    addBowler,
    updateBowler,
    addA3Case,
    updateA3Case,
    deleteBowler,
    deleteA3Case,
    reorderBowlers,
    reorderA3Cases,
    isLoading: isDataLoading,
    dashboardMarkdown,
    dashboardTitle,
    dashboardMindmaps,
    activeMindmapId,
    setActiveMindmap,
    selectedModel,
    setSelectedModel
  } = useApp();
  const { user, logout, isLoading } = useAuth();
  const toast = useToast();
  
  // Identify active module based on path
  const isMetricBowler = location.pathname.includes('/metric-bowler');
  const isA3Analysis = location.pathname.includes('/a3-analysis') || location.pathname.includes('/portfolio');
  const isMindmapPage = location.pathname.includes('/mindmap');

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
  const [isSummaryHiddenWhileLoading, setIsSummaryHiddenWhileLoading] = useState(false);
  const [isConsolidateModalOpen, setIsConsolidateModalOpen] = useState(false);
  const [isAppInfoOpen, setIsAppInfoOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isMindmapModalOpen, setIsMindmapModalOpen] = useState(false);
  const [mindmapModalMode, setMindmapModalMode] = useState<'create' | 'edit'>('edit');
  const [isBowlerFilterOpen, setIsBowlerFilterOpen] = useState(false);
  const [bowlerFilterField, setBowlerFilterField] = useState<'commitment' | 'group' | 'tag' | ''>('');
  const [bowlerFilterValue, setBowlerFilterValue] = useState<string>('');
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isMobileModelMenuOpen, setIsMobileModelMenuOpen] = useState(false);
  const [portfolioTab, setPortfolioTab] = useState<'bowler' | 'a3'>('bowler');
  const [a3PortfolioGroupFilter, setA3PortfolioGroupFilter] = useState<string>('');
  const [groupFilter, setGroupFilter] = useState<string>('');
  const [metricFilter, setMetricFilter] = useState<string>('');
  const [latestFilter, setLatestFilter] = useState<'all' | 'ok' | 'fail' | 'no-data'>('all');
  const [fail2Filter, setFail2Filter] = useState<'all' | 'yes' | 'no'>('all');
  const [fail3Filter, setFail3Filter] = useState<'all' | 'yes' | 'no'>('all');
  const [a3LinkFilter, setA3LinkFilter] = useState<'all' | 'missing' | 'present' | 'not-needed'>('all');
  const [achievementFilter, setAchievementFilter] = useState<'all' | 'lt50' | '50to80' | 'gte80'>('all');
  const [a3LowPerfRule, setA3LowPerfRule] = useState({
    latestFail: false,
    fail2: true,
    fail3: true,
  });
  const [a3TimelineView, setA3TimelineView] = useState<'week' | 'month'>('month');
  const [a3TimelineExpandedGroups, setA3TimelineExpandedGroups] = useState<Record<string, boolean>>({});
  const [a3TimelineSidebarWidth, setA3TimelineSidebarWidth] = useState(260);
  const [isResizingA3TimelineSidebar, setIsResizingA3TimelineSidebar] = useState(false);
  const [a3TimelineSidebarDragStartX, setA3TimelineSidebarDragStartX] = useState(0);
  const [a3TimelineSidebarStartWidth, setA3TimelineSidebarStartWidth] = useState(260);

  const a3PortfolioStats = useMemo(() => {
    const filteredCases = a3PortfolioGroupFilter
      ? a3Cases.filter(c => {
          const groupKey = (c.group || 'Ungrouped').trim() || 'Ungrouped';
          return groupKey === a3PortfolioGroupFilter;
        })
      : a3Cases;

    const total = filteredCases.length;

    const statusCounts: Record<string, number> = {};
    const priorityCounts: Record<string, number> = {};
    const groupCounts: Record<string, number> = {};

    let active = 0;
    let completed = 0;
    let overdue = 0;

    let groupedCount = 0;
    let ungroupedCount = 0;

    const today = new Date();

    filteredCases.forEach(c => {
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
      largestGroupSize,
      statusCounts,
      groupCounts
    };
  }, [a3Cases, a3PortfolioGroupFilter]);

  const statusPieData = useMemo(
    () => {
      const counts = a3PortfolioStats.statusCounts || {};
      const data: { name: string; value: number; color: string }[] = [];

      const pushIf = (key: string, label: string, color: string) => {
        const value = counts[key] || 0;
        if (value > 0) {
          data.push({ name: label, value, color });
        }
      };

      pushIf('Not Started', 'Not Started', '#9ca3af');
      pushIf('In Progress', 'In Progress', '#3b82f6');
      pushIf('Completed', 'Completed', '#10b981');
      pushIf('On Hold', 'On Hold', '#f59e0b');
      pushIf('Cancelled', 'Cancelled', '#ef4444');

      return data;
    },
    [a3PortfolioStats],
  );

  const priorityPieData = useMemo(
    () => {
      const counts = a3PortfolioStats.priorityCounts || {};
      const data: { name: string; value: number; color: string }[] = [];

      const high = counts['High'] || 0;
      const medium = counts['Medium'] || 0;
      const low = counts['Low'] || 0;

      if (high > 0) data.push({ name: 'High', value: high, color: '#ef4444' });
      if (medium > 0) data.push({ name: 'Medium', value: medium, color: '#f97316' });
      if (low > 0) data.push({ name: 'Low', value: low, color: '#10b981' });

      return data;
    },
    [a3PortfolioStats],
  );

  const durationPieData = useMemo(
    () => {
      const data: { name: string; value: number; color: string }[] = [];

      let lt3 = 0;
      let m3to6 = 0;
      let m6to12 = 0;
      let gt12 = 0;

      const today = new Date();

      const filteredCases = a3PortfolioGroupFilter
        ? a3Cases.filter(c => {
            const groupKey = (c.group || 'Ungrouped').trim() || 'Ungrouped';
            return groupKey === a3PortfolioGroupFilter;
          })
        : a3Cases;

      filteredCases.forEach(c => {
        if (!c.startDate) {
          return;
        }

        const start = new Date(c.startDate);
        if (isNaN(start.getTime())) {
          return;
        }

        const end = c.endDate ? new Date(c.endDate) : today;
        if (isNaN(end.getTime())) {
          return;
        }

        const diffMs = end.getTime() - start.getTime();
        if (diffMs <= 0) {
          return;
        }

        const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30);

        if (diffMonths < 3) {
          lt3 += 1;
        } else if (diffMonths < 6) {
          m3to6 += 1;
        } else if (diffMonths < 12) {
          m6to12 += 1;
        } else {
          gt12 += 1;
        }
      });

      if (lt3 > 0) {
        data.push({ name: '< 3 months', value: lt3, color: '#bfdbfe' });
      }
      if (m3to6 > 0) {
        data.push({ name: '3–6 months', value: m3to6, color: '#60a5fa' });
      }
      if (m6to12 > 0) {
        data.push({ name: '6–12 months', value: m6to12, color: '#2563eb' });
      }
      if (gt12 > 0) {
        data.push({ name: '> 12 months', value: gt12, color: '#1d4ed8' });
      }

      return data;
    },
    [a3Cases, a3PortfolioGroupFilter],
  );

  const groupPerformanceTableData = useMemo<GroupPerformanceRow[]>(() => {
    const groupToMetrics: Record<string, Metric[]> = {};
    const metricOwnerById: Record<string, string> = {};

    bowlers.forEach(bowler => {
      const groupName = (bowler.group || 'Ungrouped').trim() || 'Ungrouped';
      const metrics = bowler.metrics || [];

      metrics.forEach(metric => {
        if (!metric || !metric.monthlyData || Object.keys(metric.monthlyData).length === 0) {
          return;
        }

        metricOwnerById[metric.id] = bowler.id;

        if (!groupToMetrics[groupName]) {
          groupToMetrics[groupName] = [];
        }
        groupToMetrics[groupName].push(metric);
      });
    });

    const groupNames = Object.keys(groupToMetrics).sort();

    if (groupNames.length === 0) return [];

    const rows: GroupPerformanceRow[] = [];

    const isValuePresent = (value: unknown) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim() !== '';
      return true;
    };

    const hasDataAndTarget = (data: { actual?: unknown; target?: unknown } | undefined) =>
      !!data && isValuePresent(data.actual) && isValuePresent(data.target);

    groupNames.forEach(groupName => {
      const metrics = groupToMetrics[groupName] || [];

      metrics.forEach(metric => {
        const monthly = metric.monthlyData || {};
        const months = Object.keys(monthly)
          .filter(month => {
            const data = monthly[month];
            return hasDataAndTarget(data);
          })
          .sort();

        let latestMet: boolean | null = null;
        let latestActual: string | null = null;
        let fail2 = false;
        let fail3 = false;
        let achievementRate: number | null = null;
        let linkedA3Count = 0;

        if (months.length > 0) {
          const latestMonth = months[months.length - 1];
          const latest2Months = months.slice(-2);
          const latest3Months = months.slice(-3);

          const latestData = monthly[latestMonth];
          if (hasDataAndTarget(latestData)) {
            latestMet = !isViolation(
              metric.targetMeetingRule,
              latestData.target,
              latestData.actual,
            );
            latestActual = `${latestData.actual}`;
          }

          if (latest2Months.length === 2) {
            let allFail2 = true;
            for (const month of latest2Months) {
              const data = monthly[month];
              if (
                !hasDataAndTarget(data) ||
                !isViolation(metric.targetMeetingRule, data.target, data.actual)
              ) {
                allFail2 = false;
                break;
              }
            }
            fail2 = allFail2;
          }

          if (latest3Months.length === 3) {
            let allFail3 = true;
            for (const month of latest3Months) {
              const data = monthly[month];
              if (
                !hasDataAndTarget(data) ||
                !isViolation(metric.targetMeetingRule, data.target, data.actual)
              ) {
                allFail3 = false;
                break;
              }
            }
            fail3 = allFail3;
          }

          let totalPoints = 0;
          let metPoints = 0;
          months.forEach(month => {
            const data = monthly[month];
            if (!hasDataAndTarget(data)) return;
            totalPoints += 1;
            const violation = isViolation(
              metric.targetMeetingRule,
              data.target,
              data.actual,
            );
            if (!violation) {
              metPoints += 1;
            }
          });

          achievementRate = totalPoints > 0 ? (metPoints / totalPoints) * 100 : null;

          const isAtRisk = fail2 || fail3;
          if (isAtRisk) {
            linkedA3Count = a3Cases.filter(c =>
              (c.linkedMetricIds || []).includes(metric.id),
            ).length;
          }
        }

        rows.push({
          groupName,
          metricId: metric.id,
          metricName: metric.name,
          bowlerId: metricOwnerById[metric.id],
          latestMet,
          latestActual,
          fail2,
          fail3,
          achievementRate,
          linkedA3Count,
        });
      });
    });

    return rows;
  }, [bowlers, a3Cases]);

  const metricA3Coverage = useMemo(
    () => {
      const atRiskRows = groupPerformanceTableData.filter(row => {
        let isAtRisk = false;

        if (a3LowPerfRule.latestFail && row.latestMet === false) {
          isAtRisk = true;
        }

        if (a3LowPerfRule.fail2 && row.fail2) {
          isAtRisk = true;
        }

        if (a3LowPerfRule.fail3 && row.fail3) {
          isAtRisk = true;
        }

        return isAtRisk;
      });

      if (atRiskRows.length === 0) {
        return {
          totalAtRisk: 0,
          withA3: 0,
          withoutA3: 0,
          pieData: [] as { name: string; value: number; color: string }[],
        };
      }

      const atRiskMetricIds = Array.from(new Set(atRiskRows.map(row => row.metricId)));

      const linkedMetricIdSet = new Set<string>();
      a3Cases.forEach(c => {
        if (a3PortfolioGroupFilter) {
          const groupKey = (c.group || 'Ungrouped').trim() || 'Ungrouped';
          if (groupKey !== a3PortfolioGroupFilter) {
            return;
          }
        }
        (c.linkedMetricIds || []).forEach(id => {
          if (id) {
            linkedMetricIdSet.add(id);
          }
        });
      });

      let withA3 = 0;
      let withoutA3 = 0;

      atRiskMetricIds.forEach(id => {
        if (linkedMetricIdSet.has(id)) {
          withA3 += 1;
        } else {
          withoutA3 += 1;
        }
      });

      const pieData: { name: string; value: number; color: string }[] = [];
      if (withA3 > 0) {
        pieData.push({ name: 'With A3 linked', value: withA3, color: '#10b981' });
      }
      if (withoutA3 > 0) {
        pieData.push({ name: 'No A3 linked', value: withoutA3, color: '#ef4444' });
      }

      return {
        totalAtRisk: atRiskMetricIds.length,
        withA3,
        withoutA3,
        pieData,
      };
    },
    [groupPerformanceTableData, a3Cases, a3LowPerfRule, a3PortfolioGroupFilter],
  );

const groupFilterOptions = useMemo(
    () => {
      const names = Array.from(new Set(groupPerformanceTableData.map(row => row.groupName)));
      names.sort();
      return names;
    },
    [groupPerformanceTableData],
  );

  const metricFilterOptions = useMemo(
    () => {
      const names = Array.from(new Set(groupPerformanceTableData.map(row => row.metricName)));
      names.sort();
      return names;
    },
    [groupPerformanceTableData],
  );

  const a3PortfolioGroupOptions = useMemo(
    () => {
      const groupCounts = a3PortfolioStats.groupCounts || {};
      const names = Object.keys(groupCounts);
      names.sort();
      return names;
    },
    [a3PortfolioStats],
  );

  const filteredGroupPerformanceTableData = useMemo(
    () => {
      return groupPerformanceTableData.filter(row => {
        if (groupFilter && row.groupName !== groupFilter) {
          return false;
        }

        if (metricFilter && row.metricName !== metricFilter) {
          return false;
        }

        if (latestFilter !== 'all') {
          if (latestFilter === 'no-data' && row.latestMet !== null) {
            return false;
          }
          if (latestFilter === 'ok' && row.latestMet !== true) {
            return false;
          }
          if (latestFilter === 'fail' && row.latestMet !== false) {
            return false;
          }
        }

        if (fail2Filter !== 'all') {
          if (fail2Filter === 'yes' && !row.fail2) {
            return false;
          }
          if (fail2Filter === 'no' && row.fail2) {
            return false;
          }
        }

        if (fail3Filter !== 'all') {
          if (fail3Filter === 'yes' && !row.fail3) {
            return false;
          }
          if (fail3Filter === 'no' && row.fail3) {
            return false;
          }
        }

        const isAtRisk = row.fail2 || row.fail3;
        const linkedA3Count = row.linkedA3Count || 0;

        if (a3LinkFilter !== 'all') {
          if (a3LinkFilter === 'missing' && !(isAtRisk && linkedA3Count === 0)) {
            return false;
          }
          if (a3LinkFilter === 'present' && !(isAtRisk && linkedA3Count > 0)) {
            return false;
          }
          if (a3LinkFilter === 'not-needed' && isAtRisk) {
            return false;
          }
        }

        if (achievementFilter !== 'all') {
          const rate = row.achievementRate;
          if (rate == null) {
            return false;
          }

          if (achievementFilter === 'lt50' && !(rate < 50)) {
            return false;
          }

          if (achievementFilter === '50to80' && !(rate >= 50 && rate < 80)) {
            return false;
          }

          if (achievementFilter === 'gte80' && !(rate >= 80)) {
            return false;
          }
        }

        return true;
      });
    },
    [
      groupPerformanceTableData,
      groupFilter,
      metricFilter,
      latestFilter,
      fail2Filter,
      fail3Filter,
      a3LinkFilter,
      achievementFilter,
    ],
  );

  const pieLabelRadian = Math.PI / 180;

  const renderPieLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, name, value } = props;
    const radius = outerRadius + 18;
    const x = cx + radius * Math.cos(-midAngle * pieLabelRadian);
    const y = cy + radius * Math.sin(-midAngle * pieLabelRadian);

    return (
      <text
        x={x}
        y={y}
        fill="#374151"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={10}
      >
        {`${name} (${value})`}
      </text>
    );
  };

  const renderPieTooltip = (props: any) => {
    const { active, payload } = props;
    if (!active || !payload || payload.length === 0) return null;

    const entry = payload[0];
    const name = entry.name ?? entry.payload?.name;
    const value = entry.value;

    return (
      <div className="rounded border border-gray-200 bg-white px-2 py-1 text-[10px] text-gray-700 shadow-sm">
        {`${name} (${value})`}
      </div>
    );
  };

  const a3KanbanColumns = useMemo(() => {
    if (a3Cases.length === 0) {
      return [];
    }

    const statusConfig = [
      {
        key: 'Not Started',
        label: 'Not Started',
        headerClass: 'border-gray-200 bg-gray-50',
        badgeClass: 'bg-gray-100 text-gray-700',
        dotClass: 'bg-gray-400',
      },
      {
        key: 'In Progress',
        label: 'In Progress',
        headerClass: 'border-blue-200 bg-blue-50',
        badgeClass: 'bg-blue-100 text-blue-700',
        dotClass: 'bg-blue-500',
      },
      {
        key: 'Completed',
        label: 'Completed',
        headerClass: 'border-emerald-200 bg-emerald-50',
        badgeClass: 'bg-emerald-100 text-emerald-700',
        dotClass: 'bg-emerald-500',
      },
      {
        key: 'On Hold',
        label: 'On Hold',
        headerClass: 'border-amber-200 bg-amber-50',
        badgeClass: 'bg-amber-100 text-amber-700',
        dotClass: 'bg-amber-500',
      },
      {
        key: 'Cancelled',
        label: 'Cancelled',
        headerClass: 'border-red-200 bg-red-50',
        badgeClass: 'bg-red-100 text-red-700',
        dotClass: 'bg-red-500',
      },
    ];

    const metricLabelById = new Map<string, string>();
    bowlers.forEach(bowler => {
      (bowler.metrics || []).forEach(metric => {
        metricLabelById.set(metric.id, `${bowler.name} – ${metric.name}`);
      });
    });

    const labelColorPalette = [
      'bg-blue-50 border-blue-100',
      'bg-emerald-50 border-emerald-100',
      'bg-amber-50 border-amber-100',
      'bg-purple-50 border-purple-100',
      'bg-pink-50 border-pink-100',
      'bg-sky-50 border-sky-100',
      'bg-lime-50 border-lime-100',
      'bg-rose-50 border-rose-100',
    ];

    const labelColorMap = new Map<string, string>();

    const getLabelColorClass = (label: string) => {
      if (labelColorMap.has(label)) {
        return labelColorMap.get(label)!;
      }
      const index = labelColorMap.size % labelColorPalette.length;
      const colorClass = labelColorPalette[index];
      labelColorMap.set(label, colorClass);
      return colorClass;
    };

    const getPriorityClass = (priority: string) => {
      if (priority === 'High') {
        return 'bg-red-50 text-red-700 border-red-200';
      }
      if (priority === 'Low') {
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      }
      return 'bg-amber-50 text-amber-700 border-amber-200';
    };

    const columns = statusConfig.map(config => ({
      ...config,
      items: [] as {
        a3: A3Case;
        displayLabel: string;
        priority: string;
        priorityClass: string;
        labelColorClass: string;
      }[],
    }));

    const otherColumn = {
      key: 'Other',
      label: 'Other',
      headerClass: 'border-gray-200 bg-white',
      badgeClass: 'bg-gray-100 text-gray-600',
      dotClass: 'bg-gray-400',
      items: [] as {
        a3: A3Case;
        displayLabel: string;
        priority: string;
        priorityClass: string;
        labelColorClass: string;
      }[],
    };

    const columnByStatus: Record<string, typeof columns[number]> = {};
    columns.forEach(col => {
      columnByStatus[col.key] = col;
    });

    a3Cases.forEach(a3 => {
      if (a3PortfolioGroupFilter) {
        const groupKey = (a3.group || 'Ungrouped').trim() || 'Ungrouped';
        if (groupKey !== a3PortfolioGroupFilter) {
          return;
        }
      }
      const statusKey = (a3.status || 'Not Started').trim();
      const priorityKey = (a3.priority || 'Medium').trim();

      const groupLabel = (a3.group || 'Ungrouped').trim() || 'Ungrouped';

      const displayLabel = groupLabel;

      const labelColorClass = getLabelColorClass(displayLabel);

      const targetColumn = columnByStatus[statusKey] || otherColumn;
      targetColumn.items.push({
        a3,
        displayLabel,
        priority: priorityKey,
        priorityClass: getPriorityClass(priorityKey),
        labelColorClass,
      });
    });

    const filledColumns = columns.filter(col => col.items.length > 0);
    if (otherColumn.items.length > 0) {
      filledColumns.push(otherColumn);
    }

    return filledColumns;
  }, [a3Cases, bowlers, a3PortfolioGroupFilter]);

  const a3Timeline = useMemo(() => {
    const parseDate = (value?: string) => {
      if (!value) {
        return null;
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return null;
      }
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    };

    const filtered = a3Cases.filter(a3 => {
      if (a3PortfolioGroupFilter) {
        const groupKey = (a3.group || 'Ungrouped').trim() || 'Ungrouped';
        if (groupKey !== a3PortfolioGroupFilter) {
          return false;
        }
      }
      const start = parseDate(a3.startDate);
      const end = parseDate(a3.endDate);
      return !!start && !!end;
    });

    if (filtered.length === 0) {
      return null;
    }

    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    filtered.forEach(a3 => {
      const start = parseDate(a3.startDate);
      const end = parseDate(a3.endDate);
      if (!start || !end) {
        return;
      }
      if (!minDate || start < minDate) {
        minDate = start;
      }
      if (!maxDate || end > maxDate) {
        maxDate = end;
      }
    });

    if (!minDate || !maxDate) {
      return null;
    }

    const timelineStart = minDate as Date;
    const timelineEnd = maxDate as Date;

    const totalDaysRaw = diffDays(timelineEnd, timelineStart);
    const totalDays = totalDaysRaw <= 0 ? 1 : totalDaysRaw;

    const groups: Record<
      string,
      {
        groupName: string;
        items: {
          id: string;
          title: string;
          status: string;
          priority: string;
          startDate: string;
          endDate: string;
          left: number;
          width: number;
        }[];
      }
    > = {};

    filtered.forEach(a3 => {
      const start = parseDate(a3.startDate);
      const end = parseDate(a3.endDate);
      if (!start || !end) {
        return;
      }

      const groupKey = (a3.group || 'Ungrouped').trim() || 'Ungrouped';

      if (!groups[groupKey]) {
        groups[groupKey] = {
          groupName: groupKey,
          items: [],
        };
      }

      const startOffset = diffDays(start, timelineStart);
      const endOffset = diffDays(end, timelineStart);

      const clampedStart = Math.max(0, Math.min(startOffset, totalDays));
      const clampedEnd = Math.max(clampedStart + 1, Math.min(endOffset, totalDays));

      const left = (clampedStart / totalDays) * 100;
      const width = ((clampedEnd - clampedStart) / totalDays) * 100;

      groups[groupKey].items.push({
        id: a3.id,
        title: a3.title,
        status: (a3.status || 'Not Started').trim(),
        priority: (a3.priority || 'Medium').trim(),
        startDate: a3.startDate || '',
        endDate: a3.endDate || '',
        left,
        width,
      });
    });

    const periods: { key: string; label: string }[] = [];

    if (a3TimelineView === 'month') {
      const startMonth = new Date(
        timelineStart.getFullYear(),
        timelineStart.getMonth(),
        1,
      );
      const endMonth = new Date(
        timelineEnd.getFullYear(),
        timelineEnd.getMonth(),
        1,
      );

      let current = startMonth;
      while (current <= endMonth) {
        periods.push({
          key: `${current.getFullYear()}-${current.getMonth()}`,
          label: `${getMonthName(current.getMonth())} ${current.getFullYear()}`,
        });
        current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      }
    } else {
      let current = timelineStart;
      while (current <= timelineEnd) {
        periods.push({
          key: formatDate(current),
          label: `${current.getDate()} ${getMonthName(current.getMonth())}`,
        });
        current = addDays(current, 7);
      }
    }

    const rows = Object.values(groups).sort((a, b) =>
      a.groupName.localeCompare(b.groupName),
    );

    return {
      minDate,
      maxDate,
      totalDays,
      periods,
      rows,
    };
  }, [a3Cases, a3PortfolioGroupFilter, a3TimelineView]);

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
      const ungrouped = bowlers.filter(b => !b.group);
      buckets['ungrouped'] = [...ungrouped];
      
      const grouped = bowlers.filter(b => !!b.group).reduce((acc, bowler) => {
          const group = bowler.group!;
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
              movedItem.group = undefined;
          } else {
              movedItem.group = destKey;
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

    const header = `"Bowler Name","Metric Name","Definition","Owner","Scope","Attribute","Target Meeting Rule","Type",${monthLabels
      .map(l => `"${l}"`)
      .join(',')}\n`;

    const rows = bowlers
      .flatMap(bowler =>
        (bowler.metrics || []).flatMap(metric => {
          const basicInfo = `"${bowler.name}","${metric.name}","${metric.definition || ''}","${metric.owner || ''}","${metric.scope || ''}","${metric.attribute || ''}","${
            metric.targetMeetingRule || ''
          }"`;

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
      )
      .join('\n');

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
    setIsSummaryHiddenWhileLoading(false);
    setIsSummaryModalOpen(true);
    
    try {
      const { generateAIContext, generateComprehensiveSummary } = await import('../services/aiService');
      const context = generateAIContext(bowlers, a3Cases);

      const failingMetricsForAI = groupPerformanceTableData.filter(row => row.fail2 || row.fail3);

      const statsForPrompt = JSON.stringify(
        failingMetricsForAI.map(row => ({
          groupName: row.groupName,
          metricName: row.metricName,
          latestMet: row.latestMet,
          fail2: row.fail2,
          fail3: row.fail3,
          achievementRate: row.achievementRate != null ? Number(row.achievementRate.toFixed(1)) : null,
        })),
        null,
        2,
      );

      const prompt = `You are generating a one-click portfolio summary focused on improvement opportunities.

Use the pre-computed statistical snapshot below. Do not redo statistical calculations from raw data. Rely on this snapshot instead.

Consecutive failing metrics (derived from the integrated portfolio table):
${statsForPrompt}

Definitions:
- latestMet: null = no data, true = met latest target, false = missed latest target.
- fail2: true if the metric missed its target for the latest 2 consecutive months.
- fail3: true if the metric missed its target for the latest 3 consecutive months.
- achievementRate: percentage of historical data points that met target.

Tasks:
1) Write "executiveSummary": a concise high-level snapshot of overall portfolio performance across metrics and A3 activity.
2) Write "a3Summary": an overview of the A3 problem-solving portfolio (key themes, progress, and coverage).
3) Build "areasOfConcern": each entry must correspond to one metric from the snapshot where fail2 or fail3 is true.
   - For each metric, write a rich, multi-sentence issue description that references consecutive failures and achievementRate.
   - For each metric, provide a detailed, action-oriented suggestion that can guide real improvement work (diagnosis, countermeasures, and follow-up).

Guidance for areasOfConcern:
- Prioritize metrics with fail3 = true, then fail2 = true.
- Use latestMet and achievementRate to describe severity and risk.
- Focus on actionable, metric-specific improvement suggestions (avoid generic advice).
- Suggestions should reflect typical quality, process-improvement, and problem-solving practices.
- Each suggestion should describe concrete next actions, such as specific analyses to run, experiments or pilots to try, process changes to test, and how to monitor impact over the next 2–3 months.
- Do not output your own statistical tables or detailed numerical calculations in text; focus on narrative and actions.

Return the response in STRICT JSON format with the following structure:
{
  "executiveSummary": "A concise high-level performance snapshot.",
  "a3Summary": "Narrative summary of A3 cases and portfolio status.",
  "areasOfConcern": [
    {
      "metricName": "Metric Name",
      "groupName": "Group Name",
      "issue": "Why this metric is a concern (e.g., 'Missed target for 3 consecutive months with low overall achievement rate').",
      "suggestion": "Detailed, actionable, metric-specific improvement suggestion based on the pattern and context."
    }
  ]
}

Do not include any markdown formatting (like \`\`\`json). Just the raw JSON object.`;

      const summary = await generateComprehensiveSummary(context, prompt, selectedModel);
      setSummaryContent(summary);
    } catch (error) {
      console.error('Summary generation error:', error);
      setSummaryContent("Failed to generate summary. Please try again.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleHideSummaryWhileLoading = () => {
    setIsSummaryModalOpen(false);
    setIsSummaryHiddenWhileLoading(true);
  };

  useEffect(() => {
    if (!isGeneratingSummary && summaryContent && isSummaryHiddenWhileLoading) {
      setIsSummaryModalOpen(true);
      setIsSummaryHiddenWhileLoading(false);
      toast.success('AI summary is ready.');
    }
  }, [isGeneratingSummary, summaryContent, isSummaryHiddenWhileLoading, toast]);

  useEffect(() => {
    if (!isResizingA3TimelineSidebar) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const delta = event.clientX - a3TimelineSidebarDragStartX;
      let nextWidth = a3TimelineSidebarStartWidth + delta;
      if (nextWidth < 200) {
        nextWidth = 200;
      }
      if (nextWidth > 480) {
        nextWidth = 480;
      }
      setA3TimelineSidebarWidth(nextWidth);
    };

    const handleMouseUp = () => {
      setIsResizingA3TimelineSidebar(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isResizingA3TimelineSidebar,
    a3TimelineSidebarDragStartX,
    a3TimelineSidebarStartWidth,
  ]);

  const handleSaveData = async () => {
    if (!user) {
      toast.error('Please login to save data.');
      return;
    }
    setIsSaving(true);
      try {
        await dataService.saveData(
          bowlers,
          a3Cases,
          user.username,
          dashboardMarkdown,
          dashboardTitle,
          dashboardMindmaps,
          activeMindmapId,
          { aiModel: selectedModel }
        );
        toast.success('Data saved successfully!');
      } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save data. Please check if the backend is running.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenConsolidateModal = () => {
    if (user?.role !== 'admin') {
      toast.error('Only administrators can perform this action.');
      return;
    }
    setIsConsolidateModalOpen(true);
  };

  const handlePlusClick = () => {
    if (isMetricBowler) {
      setEditingBowler(null);
      setIsBowlerModalOpen(true);
    } else if (isA3Analysis) {
      setEditingA3Case(null);
      setIsA3ModalOpen(true);
    } else {
      setMindmapModalMode('create');
      setIsMindmapModalOpen(true);
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

  const currentModelLabel = modelOptions.find(option => option.key === selectedModel)?.label || 'Gemini';

  const navItems = [
    { path: '/metric-bowler', label: 'Metric Bowler', icon: TrendingUp },
    { path: '/a3-analysis', label: 'A3 Analysis', icon: Zap },
    { path: '/portfolio', label: 'Integrated View', icon: Layers },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 z-[60] shadow-sm h-16 flex items-center px-6 justify-between relative">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 h-9 w-9 rounded-md flex items-center justify-center">
              <span className="text-xs font-bold tracking-tight text-white">B&A</span>
            </div>
            <div className="flex items-center space-x-1">
              <h1 className="text-lg font-semibold text-gray-900 tracking-tight hidden md:block">Bowler &amp; A3</h1>
              <button 
                  onClick={() => setIsAppInfoOpen(true)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="About this app"
              >
                  <Info className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <nav className="flex space-x-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              const isMetric = item.path === '/metric-bowler';
              const isA3 = item.path === '/a3-analysis';
              const isPortfolio = item.path === '/portfolio';

              const activeIconClasses = isMetric
                ? 'bg-blue-600 text-white'
                : isA3
                ? 'bg-purple-600 text-white'
                : isPortfolio
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 text-white';

              const inactiveIconClasses = isMetric
                ? 'bg-blue-50 text-blue-700'
                : isA3
                ? 'bg-purple-50 text-purple-700'
                : isPortfolio
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-gray-100 text-gray-600';

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    'flex items-center px-1.5 md:px-2 py-1.5 rounded text-xs md:text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-blue-50 text-blue-800'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )}
                  title={item.label}
                >
                  <span
                    className={clsx(
                      'flex items-center justify-center w-6 h-6 rounded-md mr-0 md:mr-1 transition-colors',
                      isActive ? activeIconClasses : inactiveIconClasses
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={handleExit}
              className="p-2 rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-red-600 transition-colors"
              title="Exit to Main App"
            >
              <ExternalLink className="w-4 h-4" />
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
              onClick={() => navigate('/mindmap')}
              className="p-2 rounded-md bg-amber-500 text-white shadow-sm hover:bg-amber-600 transition-colors"
              title="Map Ideas"
            >
              <Lightbulb className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsAIChatOpen(true)}
              className="p-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 transition-colors"
              title="Chat with AI"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              onClick={handleOpenConsolidateModal}
              className="p-2 bg-purple-600 text-white rounded-md shadow-sm hover:bg-purple-700 transition-colors"
              title="Consolidate Bowlers & A3"
            >
              <Inbox className="w-4 h-4" />
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
                      handleOpenConsolidateModal();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-purple-600"
                  >
                    <Inbox className="w-4 h-4 mr-3" />
                    Consolidate
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

                  <button
                    onClick={() => {
                      navigate('/mindmap');
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-amber-600"
                  >
                    <Lightbulb className="w-4 h-4 mr-3" />
                    Map Ideas
                  </button>

                  <button
                    onClick={() => {
                      handleSaveData();
                      setIsMobileMenuOpen(false);
                    }}
                    disabled={isSaving}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-green-700 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-3" />
                    )}
                    Save Data
                  </button>

                  <button
                    onClick={() => setIsMobileModelMenuOpen(!isMobileModelMenuOpen)}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-indigo-600"
                  >
                    <Bot className="w-4 h-4 mr-3" />
                    AI Model: {currentModelLabel}
                  </button>
                  {isMobileModelMenuOpen && (
                    <div className="border-t border-gray-100">
                      {modelOptions.map(option => (
                        <button
                          key={option.key}
                          onClick={() => {
                            setSelectedModel(option.key);
                            setIsMobileModelMenuOpen(false);
                          }}
                          className={clsx(
                            'flex w-full items-center px-4 py-2 text-sm hover:bg-gray-100',
                            option.key === selectedModel ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-700'
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleSaveData}
            disabled={isSaving}
            className="hidden md:inline-flex p-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 transition-colors disabled:opacity-50"
            title={isSaving ? "Saving..." : "Save Data"}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
          </button>

          {user ? (
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="hidden md:block relative">
                <button
                  onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                  className="h-8 w-8 rounded-full bg-pink-500 text-white shadow-sm hover:bg-pink-600 transition-colors flex items-center justify-center text-[10px] font-semibold"
                  title={`AI Model: ${modelOptions.find(option => option.key === selectedModel)?.label || ''}`}
                >
                  {modelShortLabels[selectedModel]}
                </button>
                {isModelMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-[80]">
                    {modelOptions.map(option => (
                      <button
                        key={option.key}
                        onClick={() => {
                          setSelectedModel(option.key);
                          setIsModelMenuOpen(false);
                        }}
                        className={clsx(
                          'w-full text-left px-3 py-2 text-sm hover:bg-gray-100',
                          option.key === selectedModel ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-700'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 text-sm cursor-pointer hover:opacity-80 transition-opacity" 
                title={user.username || 'User'}
                onClick={() => setIsAccountSettingsOpen(true)}
              >
                <div className="h-8 w-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
                  {user.username ? user.username.substring(0, 2).toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
              </div>
              <div 
                className="flex items-center"
              >
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

      {(isLoading || isDataLoading) && (
        <div className="bg-blue-50 border-b border-blue-100">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <p className="text-xs md:text-sm font-medium text-blue-700">
              Loading application data...
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-1">
        {/* Dynamic Sidebar */}
        <aside className={clsx(
          "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out relative",
          isSidebarOpen ? "w-64 absolute z-50 h-full md:relative" : "w-0 md:w-16",
          location.pathname.startsWith('/portfolio') ? "hidden md:hidden" : ""
        )}>
          <button
             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
             className={clsx(
               "absolute -right-3 top-16 rounded-full p-1.5 shadow-sm border z-20 transition-colors",
               "bg-blue-600 border-blue-700 text-white hover:bg-blue-700"
             )}
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
                    {isMetricBowler ? 'Bowler Lists' : isMindmapPage ? 'Mindmap ideas' : 'A3 Cases'}
                  </h2>
                  <div className="flex items-center gap-1">
                    {isMetricBowler && (
                      <button
                        onClick={() => setIsBowlerFilterOpen(!isBowlerFilterOpen)}
                        className={clsx(
                          "p-1 rounded-md border transition-colors",
                          isBowlerFilterOpen
                            ? "bg-gray-200 border-gray-300 text-gray-800"
                            : "bg-white border-gray-200 text-gray-500 hover:bg-gray-100"
                        )}
                        title="Filter Bowler lists by Team, Group, or Tag"
                      >
                        <Filter className="w-4 h-4" />
                      </button>
                    )}
                    {/* Portfolio button removed; portfolio is now a main function view */}
                    <button 
                      onClick={handlePlusClick}
                      className="p-1 rounded-md hover:bg-blue-100 text-blue-600 transition-colors"
                      title="Add New"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-1">
                  {isMetricBowler && (
                    <button
                      onClick={() => setIsBowlerFilterOpen(!isBowlerFilterOpen)}
                      className={clsx(
                        "p-1 rounded-md border transition-colors",
                        isBowlerFilterOpen
                          ? "bg-gray-200 border-gray-300 text-gray-800"
                          : "bg-white border-gray-200 text-gray-500 hover:bg-gray-100"
                      )}
                      title="Filter Bowler lists"
                    >
                      <Filter className="w-4 h-4" />
                    </button>
                  )}
                  {/* Compact portfolio button removed; portfolio is now a main function view */}
                  <button 
                    onClick={handlePlusClick}
                    className="p-1 rounded-md hover:bg-blue-100 text-blue-600 transition-colors"
                    title="Add New"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {isMetricBowler && isSidebarOpen && isBowlerFilterOpen && (
              <div className="px-3 pt-2 pb-3 border-b border-gray-100 bg-gray-50 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-600">Filter by</span>
                  <select
                    className="flex-1 rounded border border-gray-300 bg-white py-1 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    value={bowlerFilterField}
                    onChange={(e) => {
                      const value = e.target.value as 'commitment' | 'group' | 'tag' | '';
                      setBowlerFilterField(value);
                      setBowlerFilterValue('');
                    }}
                  >
                    <option value="">None</option>
                    <option value="commitment">Commitment</option>
                    <option value="group">Group</option>
                    <option value="tag">Tag</option>
                  </select>
                </div>
                {bowlerFilterField && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Value</span>
                    <select
                      className="flex-1 rounded border border-gray-300 bg-white py-1 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      value={bowlerFilterValue}
                      onChange={(e) => setBowlerFilterValue(e.target.value)}
                    >
                      <option value="">All</option>
                      {Array.from(
                        new Set(
                          bowlers
                            .map((b) => {
                              if (bowlerFilterField === 'commitment') return b.commitment;
                              if (bowlerFilterField === 'group') return b.group;
                              if (bowlerFilterField === 'tag') return b.tag;
                              return undefined;
                            })
                            .filter((v): v is string => !!v)
                        )
                      )
                        .sort()
                        .map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {isMetricBowler && (() => {
                  const matchesFilter = (bowler: Bowler) => {
                      if (!bowlerFilterField || !bowlerFilterValue) {
                          return true;
                      }
                      if (bowlerFilterField === 'commitment') {
                          return (bowler.commitment || '') === bowlerFilterValue;
                      }
                      if (bowlerFilterField === 'group') {
                          return (bowler.group || '') === bowlerFilterValue;
                      }
                      if (bowlerFilterField === 'tag') {
                          return (bowler.tag || '') === bowlerFilterValue;
                      }
                      return true;
                  };

                  const filteredBowlers = bowlers.filter(matchesFilter);

                  const ungrouped = filteredBowlers.filter(b => !b.group);
                  const grouped = filteredBowlers.filter(b => !!b.group).reduce((acc, bowler) => {
                      const group = bowler.group!;
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
                                        "flex items-center w-full text-xs font-semibold uppercase tracking-wider mb-1 transition-colors",
                                        isSidebarOpen ? "px-3 justify-between" : "justify-center",
                                        isGroupExpanded(group)
                                          ? "text-blue-700"
                                          : "text-gray-600 hover:text-gray-800"
                                    )}
                                    title={group}
                                >
                                    {isSidebarOpen ? (
                                        <>
                                            <div className="flex items-center gap-2">
                                                {isGroupExpanded(group) ? (
                                                    <ChevronDown
                                                        className={clsx(
                                                          "w-3 h-3 rounded-full p-0.5",
                                                          "bg-blue-100 text-blue-700"
                                                        )}
                                                    />
                                                ) : (
                                                    <ChevronRight
                                                        className={clsx(
                                                          "w-3 h-3 rounded-full p-0.5",
                                                          "bg-blue-100 text-blue-700"
                                                        )}
                                                    />
                                                )}
                                                <span className="truncate">{group}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex justify-center w-full">
                                            {isGroupExpanded(group) ? (
                                                <ChevronDown
                                                    className={clsx(
                                                      "w-3 h-3 rounded-full p-0.5",
                                                      "bg-blue-100 text-blue-700"
                                                    )}
                                                />
                                            ) : (
                                                <ChevronRight
                                                    className={clsx(
                                                      "w-3 h-3 rounded-full p-0.5",
                                                      "bg-blue-100 text-blue-700"
                                                    )}
                                                />
                                            )}
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

              {isMindmapPage && !isMetricBowler && !isA3Analysis && (
                <div className="space-y-1">
                  {dashboardMindmaps.length === 0 ? (
                    <div className={clsx("text-center py-8 text-gray-400 text-sm italic", isSidebarOpen ? "px-4" : "px-1 text-xs")}>
                      {isSidebarOpen ? "No mindmaps yet. Click + to add one." : "Empty"}
                    </div>
                  ) : (
                    dashboardMindmaps.map((mindmap) => (
                      <button
                        key={mindmap.id}
                        onClick={() => setActiveMindmap(mindmap.id)}
                        onDoubleClick={(e) => {
                          e.preventDefault();
                          setActiveMindmap(mindmap.id);
                          setMindmapModalMode('edit');
                          setIsMindmapModalOpen(true);
                        }}
                        className={clsx(
                          "group flex items-center py-2 text-sm font-medium rounded-lg transition-all w-full",
                          isSidebarOpen ? "px-3 justify-between" : "px-0 justify-center",
                          activeMindmapId === mindmap.id
                            ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        )}
                        title={!isSidebarOpen ? mindmap.title : undefined}
                      >
                        <div className={clsx("flex items-center", isSidebarOpen ? "truncate" : "justify-center w-full")}>
                          <div
                            className={clsx(
                              "w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold uppercase text-indigo-700",
                              isSidebarOpen ? "mr-3" : "mr-0"
                            )}
                          >
                            {mindmap.title?.charAt(0) || <Lightbulb className="w-3 h-3" />}
                          </div>
                          {isSidebarOpen && <span className="truncate">{mindmap.title}</span>}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

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
                                        "flex items-center w-full text-xs font-semibold uppercase tracking-wider mb-1 transition-colors",
                                        isSidebarOpen ? "px-3 justify-between" : "justify-center",
                                        isGroupExpanded(group)
                                          ? "text-blue-700"
                                          : "text-gray-600 hover:text-gray-800"
                                    )}
                                    title={group}
                                >
                                    {isSidebarOpen ? (
                                        <>
                                            <div className="flex items-center gap-2">
                                                {isGroupExpanded(group) ? (
                                                    <ChevronDown
                                                        className={clsx(
                                                          "w-3 h-3 rounded-full p-0.5",
                                                          "bg-blue-100 text-blue-700"
                                                        )}
                                                    />
                                                ) : (
                                                    <ChevronRight
                                                        className={clsx(
                                                          "w-3 h-3 rounded-full p-0.5",
                                                          "bg-blue-100 text-blue-700"
                                                        )}
                                                    />
                                                )}
                                                <span className="truncate">{group}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex justify-center w-full">
                                            {isGroupExpanded(group) ? (
                                                <ChevronDown
                                                    className={clsx(
                                                      "w-3 h-3 rounded-full p-0.5",
                                                      "bg-blue-100 text-blue-700"
                                                    )}
                                                />
                                            ) : (
                                                <ChevronRight
                                                    className={clsx(
                                                      "w-3 h-3 rounded-full p-0.5",
                                                      "bg-blue-100 text-blue-700"
                                                    )}
                                                />
                                            )}
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

        {/* Main Content */}
        <main className="flex-1 bg-gray-50 min-w-0">
          {location.pathname.startsWith('/portfolio') ? (
            <div className="p-4 md:p-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-base md:text-lg font-semibold text-gray-900">
                      Integrated View
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Switch between Bowler metrics and A3 portfolio dashboard.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className={clsx(
                        'one-click-summary-glow',
                        isGeneratingSummary && 'one-click-summary-glow-active',
                      )}
                    >
                      <button
                        onClick={handleOneClickSummary}
                        className="one-click-summary-glow-inner inline-flex items-center gap-2 px-2.5 py-2 bg-teal-600 text-white rounded-md shadow-sm hover:bg-teal-700 transition-colors"
                        title="One Click Summary"
                      >
                        {isGeneratingSummary ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <NotepadText className="w-4 h-4" />
                        )}
                        <span className="hidden md:inline text-xs font-medium">
                          One Click Summary
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-4 md:p-6 space-y-4">
                  <div className="border-b border-gray-200 mb-3">
                    <nav className="-mb-px flex space-x-4">
                      <button
                        type="button"
                        onClick={() => setPortfolioTab('bowler')}
                        className={clsx(
                          'whitespace-nowrap py-2 px-1 border-b-2 text-xs md:text-sm font-medium',
                          portfolioTab === 'bowler'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                        )}
                      >
                        Bowler Overview
                      </button>
                      <button
                        type="button"
                        onClick={() => setPortfolioTab('a3')}
                        className={clsx(
                          'whitespace-nowrap py-2 px-1 border-b-2 text-xs md:text-sm font-medium',
                          portfolioTab === 'a3'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                        )}
                      >
                        A3 Portfolio
                      </button>
                    </nav>
                  </div>
                  {a3PortfolioStats.total === 0 && portfolioTab === 'a3' ? (
                    <div className="py-8 text-center text-sm text-gray-500">
                      No A3 cases in the portfolio yet. Use the + button to create your first case.
                    </div>
                  ) : (
                    <>
                      {portfolioTab === 'bowler' && groupPerformanceTableData.length > 0 && (
                        <div className="mb-2">
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-xs md:text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-normal md:whitespace-nowrap">
                                    Group
                                  </th>
                                  <th className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-normal md:whitespace-nowrap">
                                    Metric
                                  </th>
                                  <th className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-normal md:whitespace-nowrap">
                                    Latest month
                                  </th>
                                  <th className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-normal md:whitespace-nowrap">
                                    Last 2 months
                                  </th>
                                  <th className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-normal md:whitespace-nowrap">
                                    Last 3 months
                                  </th>
                                  <th className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-normal md:whitespace-nowrap">
                                    Linked A3s
                                  </th>
                                  <th className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-normal md:whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1">
                                      <span>Overall target achieving %</span>
                                      <button
                                        type="button"
                                        className="text-gray-400 hover:text-gray-600"
                                        title="Cells are highlighted when achievement is 66% or lower."
                                      >
                                        <Info className="w-3 h-3" />
                                      </button>
                                    </span>
                                  </th>
                                </tr>
                                <tr>
                                  <th className="px-3 pb-2">
                                    <select
                                      className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-[11px] md:text-xs text-gray-700"
                                      value={groupFilter}
                                      onChange={e => setGroupFilter(e.target.value)}
                                    >
                                      <option value="">All</option>
                                      {groupFilterOptions.map(name => (
                                        <option key={name} value={name}>
                                          {name}
                                        </option>
                                      ))}
                                    </select>
                                  </th>
                                  <th className="px-3 pb-2">
                                    <select
                                      className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-[11px] md:text-xs text-gray-700"
                                      value={metricFilter}
                                      onChange={e => setMetricFilter(e.target.value)}
                                    >
                                      <option value="">All</option>
                                      {metricFilterOptions.map(name => (
                                        <option key={name} value={name}>
                                          {name}
                                        </option>
                                      ))}
                                    </select>
                                  </th>
                                  <th className="px-3 pb-2">
                                    <select
                                      className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-[11px] md:text-xs text-gray-700"
                                      value={latestFilter}
                                      onChange={e => setLatestFilter(e.target.value as 'all' | 'ok' | 'fail' | 'no-data')}
                                    >
                                      <option value="all">All</option>
                                      <option value="ok">Ok</option>
                                      <option value="fail">Fail</option>
                                      <option value="no-data">No data</option>
                                    </select>
                                  </th>
                                  <th className="px-3 pb-2">
                                    <select
                                      className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-[11px] md:text-xs text-gray-700"
                                      value={fail2Filter}
                                      onChange={e => setFail2Filter(e.target.value as 'all' | 'yes' | 'no')}
                                    >
                                      <option value="all">All</option>
                                      <option value="yes">Failing</option>
                                      <option value="no">Not failing</option>
                                    </select>
                                  </th>
                                  <th className="px-3 pb-2">
                                    <select
                                      className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-[11px] md:text-xs text-gray-700"
                                      value={fail3Filter}
                                      onChange={e => setFail3Filter(e.target.value as 'all' | 'yes' | 'no')}
                                    >
                                      <option value="all">All</option>
                                      <option value="yes">Failing</option>
                                      <option value="no">Not failing</option>
                                    </select>
                                  </th>
                                  <th className="px-3 pb-2">
                                    <select
                                      className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-[11px] md:text-xs text-gray-700"
                                      value={a3LinkFilter}
                                      onChange={e =>
                                        setA3LinkFilter(
                                          e.target.value as 'all' | 'missing' | 'present' | 'not-needed',
                                        )
                                      }
                                    >
                                      <option value="all">All</option>
                                      <option value="missing">A3 needed, none</option>
                                      <option value="present">A3 needed, with A3</option>
                                      <option value="not-needed">A3 not needed</option>
                                    </select>
                                  </th>
                                  <th className="px-3 pb-2">
                                    <select
                                      className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-[11px] md:text-xs text-gray-700"
                                      value={achievementFilter}
                                      onChange={e =>
                                        setAchievementFilter(
                                          e.target.value as 'all' | 'lt50' | '50to80' | 'gte80',
                                        )
                                      }
                                    >
                                      <option value="all">All</option>
                                      <option value="lt50">&lt; 50%</option>
                                      <option value="50to80">50–79%</option>
                                      <option value="gte80">≥ 80%</option>
                                    </select>
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {filteredGroupPerformanceTableData.map(row => {
                                  const isAtRisk = row.fail2 || row.fail3;
                                  const linkedA3Count = isAtRisk
                                    ? a3Cases.filter(c => (c.linkedMetricIds || []).includes(row.metricId)).length
                                    : 0;

                                  return (
                                    <tr key={`${row.groupName}-${row.metricId}`}>
                                      <td className="px-3 py-2 font-medium text-gray-900">
                                        {row.groupName}
                                      </td>
                                      <td className="px-3 py-2 text-gray-700">
                                        <button
                                          type="button"
                                          className="text-[11px] md:text-xs font-medium text-blue-700 hover:text-blue-900 hover:underline"
                                          onClick={() => {
                                            if (row.bowlerId) {
                                              navigate(`/metric-bowler/${row.bowlerId}`);
                                            }
                                          }}
                                        >
                                          {row.metricName}
                                        </button>
                                      </td>
                                      <td className="px-3 py-2 text-gray-700">
                                        {row.latestMet === null || !row.latestActual ? (
                                          <span>—</span>
                                        ) : (
                                          <span
                                            className={clsx(
                                              'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                                              row.latestMet === false
                                                ? 'bg-red-50 text-red-700 border-red-200'
                                                : 'bg-green-50 text-green-700 border-green-200',
                                            )}
                                          >
                                            {row.latestActual}
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-gray-700">
                                        {row.fail2 ? (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
                                            <span className="mr-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                                            Failing
                                          </span>
                                        ) : (
                                          <span>—</span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-gray-700">
                                        {row.fail3 ? (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700 border border-red-100">
                                            <span className="mr-1 h-1.5 w-1.5 rounded-full bg-red-500" />
                                            Failing
                                          </span>
                                        ) : (
                                          <span>—</span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-gray-700">
                                        {isAtRisk ? (
                                          linkedA3Count === 0 ? (
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                                              0
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
                                              {linkedA3Count}
                                            </span>
                                          )
                                        ) : (
                                          <span>—</span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-gray-700">
                                        {row.achievementRate != null ? (
                                          <span
                                            className={clsx(
                                              'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                                              row.achievementRate < (2 / 3) * 100
                                                ? 'bg-red-50 text-red-700 border-red-200'
                                                : 'bg-green-50 text-green-700 border-green-200',
                                            )}
                                          >
                                            {row.achievementRate.toFixed(0)}%
                                          </span>
                                        ) : (
                                          '—'
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {portfolioTab === 'a3' && (
                        <>
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div className="text-xs text-gray-500">
                              Filter the A3 dashboard by portfolio group.
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-gray-500">Group</span>
                              <select
                                className="rounded border border-gray-200 bg-white px-2 py-1 text-[11px] md:text-xs text-gray-700"
                                value={a3PortfolioGroupFilter}
                                onChange={e => setA3PortfolioGroupFilter(e.target.value)}
                              >
                                <option value="">All groups</option>
                                {a3PortfolioGroupOptions.map(name => (
                                  <option key={name} value={name}>
                                    {name}
                                  </option>
                                ))}
                              </select>
                            </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        <div className="rounded-lg border border-gray-100 bg-white px-3 py-3">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Metric A3 Coverage
                              </p>
                              <div className="mt-2 h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={metricA3Coverage.pieData}
                                      dataKey="value"
                                      nameKey="name"
                                      innerRadius={30}
                                      outerRadius={55}
                                      paddingAngle={2}
                                      label={renderPieLabel}
                                      labelLine
                                    >
                                      {metricA3Coverage.pieData.map((entry, index) => (
                                        <Cell
                                          key={`metric-coverage-cell-${index}`}
                                          fill={entry.color}
                                        />
                                      ))}
                                    </Pie>
                                    <Tooltip content={renderPieTooltip} />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-gray-500">
                                <label className="inline-flex items-center gap-1">
                                  <input
                                    type="checkbox"
                                    className="h-3 w-3 text-blue-600 border-gray-300 rounded"
                                    checked={a3LowPerfRule.latestFail}
                                    onChange={e =>
                                      setA3LowPerfRule({
                                        ...a3LowPerfRule,
                                        latestFail: e.target.checked,
                                      })
                                    }
                                  />
                                  <span>Latest fail</span>
                                </label>
                                <label className="inline-flex items-center gap-1">
                                  <input
                                    type="checkbox"
                                    className="h-3 w-3 text-blue-600 border-gray-300 rounded"
                                    checked={a3LowPerfRule.fail2}
                                    onChange={e =>
                                      setA3LowPerfRule({
                                        ...a3LowPerfRule,
                                        fail2: e.target.checked,
                                      })
                                    }
                                  />
                                  <span>Failing 2 months</span>
                                </label>
                                <label className="inline-flex items-center gap-1">
                                  <input
                                    type="checkbox"
                                    className="h-3 w-3 text-blue-600 border-gray-300 rounded"
                                    checked={a3LowPerfRule.fail3}
                                    onChange={e =>
                                      setA3LowPerfRule({
                                        ...a3LowPerfRule,
                                        fail3: e.target.checked,
                                      })
                                    }
                                  />
                                  <span>Failing 3 months</span>
                                </label>
                              </div>
                              <p className="mt-2 text-[11px] text-gray-500">
                                At-risk metrics: {metricA3Coverage.totalAtRisk} · With A3:{' '}
                                {metricA3Coverage.withA3}, Without A3: {metricA3Coverage.withoutA3}
                              </p>
                            </div>
                            <div className="rounded-lg border border-gray-100 bg-white px-3 py-3">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                A3 Duration
                              </p>
                              <div className="mt-2 h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={durationPieData}
                                      dataKey="value"
                                      nameKey="name"
                                      innerRadius={30}
                                      outerRadius={55}
                                      paddingAngle={2}
                                      label={renderPieLabel}
                                      labelLine
                                    >
                                      {durationPieData.map((entry, index) => (
                                        <Cell
                                          key={`duration-cell-${index}`}
                                          fill={entry.color}
                                        />
                                      ))}
                                    </Pie>
                                    <Tooltip content={renderPieTooltip} />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                            <div className="rounded-lg border border-gray-100 bg-white px-3 py-3">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Status
                              </p>
                              <div className="mt-2 h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={statusPieData}
                                      dataKey="value"
                                      nameKey="name"
                                      innerRadius={30}
                                      outerRadius={55}
                                      paddingAngle={2}
                                      label={renderPieLabel}
                                      labelLine
                                    >
                                      {statusPieData.map((entry, index) => (
                                        <Cell
                                          key={`status-cell-${index}`}
                                          fill={entry.color}
                                        />
                                      ))}
                                    </Pie>
                                    <Tooltip content={renderPieTooltip} />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                              <p className="mt-2 text-[11px] text-gray-500">
                                Total:{' '}
                                <span className="font-semibold text-gray-900">
                                  {a3PortfolioStats.total}
                                </span>{' '}
                                · Active {a3PortfolioStats.active}, Completed{' '}
                                {a3PortfolioStats.completed}
                              </p>
                            </div>
                            <div className="rounded-lg border border-gray-100 bg-white px-3 py-3">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Priority
                              </p>
                              <div className="mt-2 h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={priorityPieData}
                                      dataKey="value"
                                      nameKey="name"
                                      innerRadius={30}
                                      outerRadius={55}
                                      paddingAngle={2}
                                      label={renderPieLabel}
                                      labelLine
                                    >
                                      {priorityPieData.map((entry, index) => (
                                        <Cell
                                          key={`priority-cell-${index}`}
                                          fill={entry.color}
                                        />
                                      ))}
                                    </Pie>
                                    <Tooltip content={renderPieTooltip} />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                              <p className="mt-2 text-[11px] text-gray-500">
                                High {a3PortfolioStats.priorityCounts['High'] || 0}, Medium{' '}
                                {a3PortfolioStats.priorityCounts['Medium'] || 0}, Low{' '}
                                {a3PortfolioStats.priorityCounts['Low'] || 0}
                              </p>
                            </div>
                          </div>
                          {a3Timeline && (
                            <div className="mt-6 pt-4 border-t border-gray-200">
                              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <div>
                                  <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                                    A3 Timeline
                                  </p>
                                  <p className="mt-0.5 text-xs text-gray-500">
                                    View cases on a time axis, grouped by portfolio group.
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-gray-500">View by</span>
                                  <div className="inline-flex rounded-md border border-gray-200 bg-white p-0.5">
                                    <button
                                      type="button"
                                      className={clsx(
                                        'px-2 py-0.5 text-[11px] rounded-sm',
                                        a3TimelineView === 'week'
                                          ? 'bg-blue-600 text-white shadow-sm'
                                          : 'text-gray-600 hover:bg-gray-50',
                                      )}
                                      onClick={() => setA3TimelineView('week')}
                                    >
                                      Week
                                    </button>
                                    <button
                                      type="button"
                                      className={clsx(
                                        'px-2 py-0.5 text-[11px] rounded-sm',
                                        a3TimelineView === 'month'
                                          ? 'bg-blue-600 text-white shadow-sm'
                                          : 'text-gray-600 hover:bg-gray-50',
                                      )}
                                      onClick={() => setA3TimelineView('month')}
                                    >
                                      Month
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3 border border-gray-100 rounded-lg bg-white overflow-hidden">
                                <div className="flex flex-col lg:flex-row">
                                  <div
                                    className="relative w-full lg:flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 bg-gray-50/80"
                                    style={{ width: a3TimelineSidebarWidth }}
                                  >
                                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                                      <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                                        A3 List
                                      </p>
                                      <span className="text-[10px] text-gray-500">
                                        {a3Timeline.rows.reduce(
                                          (acc, row) => acc + row.items.length,
                                          0,
                                        )}{' '}
                                        items
                                      </span>
                                    </div>
                                    <div className="max-h-64 lg:max-h-[280px] overflow-y-auto">
                                      {a3Timeline.rows.length === 0 && (
                                        <p className="px-3 py-3 text-[11px] text-gray-400 italic">
                                          No dated cases available.
                                        </p>
                                      )}
                                      {a3Timeline.rows.map(row => {
                                        const isExpanded =
                                          a3TimelineExpandedGroups[row.groupName] !== false;

                                        return (
                                          <div key={row.groupName} className="border-b border-gray-100">
                                            <button
                                              type="button"
                                              className="w-full flex items-center justify-between px-3 py-2 text-[11px] text-gray-700 hover:bg-gray-100"
                                              onClick={() => {
                                                setA3TimelineExpandedGroups(prev => ({
                                                  ...prev,
                                                  [row.groupName]: !(prev[row.groupName] !== false),
                                                }));
                                              }}
                                            >
                                              <div className="flex items-center gap-1 min-w-0">
                                                {isExpanded ? (
                                                  <ChevronDown className="w-3 h-3 text-gray-500" />
                                                ) : (
                                                  <ChevronRight className="w-3 h-3 text-gray-500" />
                                                )}
                                                <span className="truncate">{row.groupName}</span>
                                              </div>
                                              <span className="ml-2 text-[10px] text-gray-400">
                                                {row.items.length}
                                              </span>
                                            </button>
                                            {isExpanded &&
                                              row.items.map(item => (
                                                <button
                                                  key={item.id}
                                                  type="button"
                                                  className="w-full flex items-center justify-between px-4 py-1.5 text-[11px] hover:bg-white"
                                                  onClick={() => {
                                                    navigate(
                                                      `/a3-analysis/${item.id}/problem-statement`,
                                                    );
                                                  }}
                                                >
                                                  <div className="flex flex-col items-start min-w-0">
                                                    <span className="text-gray-800 text-[11px] leading-snug break-words">
                                                      {item.title}
                                                    </span>
                                                    <span className="mt-0.5 text-[10px] text-gray-400">
                                                      {item.startDate && item.endDate
                                                        ? `${item.startDate} → ${item.endDate}`
                                                        : item.startDate || item.endDate || ''}
                                                    </span>
                                                  </div>
                                                  <div
                                                    className={clsx(
                                                      'ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full border text-[10px] font-medium',
                                                      item.status === 'Completed'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : item.status === 'In Progress'
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                        : 'bg-gray-50 text-gray-600 border-gray-200',
                                                    )}
                                                  >
                                                    {item.status || 'Not Started'}
                                                  </div>
                                                </button>
                                              ))}
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div
                                      className="hidden lg:block absolute top-0 right-0 h-full w-1.5 cursor-col-resize bg-transparent hover:bg-gray-200"
                                      onMouseDown={event => {
                                        event.preventDefault();
                                        setIsResizingA3TimelineSidebar(true);
                                        setA3TimelineSidebarDragStartX(event.clientX);
                                        setA3TimelineSidebarStartWidth(a3TimelineSidebarWidth);
                                      }}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex h-[60px] border-b border-gray-200 bg-gray-50">
                                      {a3Timeline.periods.map(period => (
                                        <div
                                          key={period.key}
                                          className="flex-1 flex-shrink-0 border-r border-gray-200 flex flex-col items-center justify-center overflow-hidden px-0.5"
                                          title={period.label}
                                        >
                                          <span className="font-semibold text-gray-700 whitespace-nowrap text-[10px]">
                                            {period.label}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                      {a3Timeline.rows.map(row => {
                                        const isExpanded =
                                          a3TimelineExpandedGroups[row.groupName] !== false;

                                        return (
                                          <div key={row.groupName}>
                                            <div className="px-3 py-2 bg-gray-50" />
                                            {isExpanded && row.items.length === 0 && (
                                              <div className="px-3 py-2 text-[10px] text-gray-400 italic">
                                                No dated cases in this group.
                                              </div>
                                            )}
                                            {isExpanded &&
                                              row.items.map(item => (
                                                <div
                                                  key={item.id}
                                                  className="relative px-3 py-2 text-[11px]"
                                                >
                                                  <div className="absolute inset-y-2 left-0 right-0 pointer-events-none">
                                                    <div className="flex h-full gap-px">
                                                      {a3Timeline.periods.map(period => (
                                                        <div
                                                          key={period.key}
                                                          className="flex-1 border-l border-dashed border-gray-200 last:border-r"
                                                        />
                                                      ))}
                                                    </div>
                                                  </div>
                                                  <div className="relative">
                                                    <button
                                                      type="button"
                                                      className={clsx(
                                                        'relative inline-flex items-center justify-start rounded-sm px-2 py-1 text-[10px] font-medium shadow-sm border border-opacity-20 text-white overflow-hidden text-left',
                                                        item.status === 'Completed'
                                                          ? 'bg-green-500 border-green-700'
                                                          : item.status === 'In Progress'
                                                          ? 'bg-blue-500 border-blue-700'
                                                          : 'bg-gray-400 border-gray-600',
                                                      )}
                                                      style={{
                                                        left: `${item.left}%`,
                                                        width: `${Math.max(item.width, 2)}%`,
                                                        maxWidth: '100%',
                                                      }}
                                                      onClick={() => {
                                                        navigate(
                                                          `/a3-analysis/${item.id}/problem-statement`,
                                                        );
                                                      }}
                                                    >
                                                      <div className="flex flex-col items-start max-w-full">
                                                        <span className="truncate max-w-full">
                                                          {item.title}
                                                        </span>
                                                        <span className="mt-0.5 text-[9px] opacity-80 truncate max-w-full">
                                                          {item.status || 'Not Started'}
                                                        </span>
                                                      </div>
                                                    </button>
                                                  </div>
                                                </div>
                                              ))}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="mt-6 pt-4 border-t border-gray-200">
                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                              A3 Kanban
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500">
                              Track cases by status and quickly scan portfolio groups.
                            </p>
                          </div>
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                            {a3KanbanColumns.map(column => (
                              <div
                                key={column.key}
                                className={clsx(
                                  'flex flex-col rounded-lg border text-xs',
                                  column.headerClass,
                                )}
                              >
                                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={clsx(
                                        'h-2 w-2 rounded-full',
                                        column.dotClass,
                                      )}
                                    />
                                    <span className="font-semibold text-gray-800">
                                      {column.label}
                                    </span>
                                  </div>
                                  <span
                                    className={clsx(
                                      'px-2 py-0.5 rounded-full text-[10px] font-medium border',
                                      column.badgeClass,
                                    )}
                                  >
                                    {column.items.length}
                                  </span>
                                </div>
                                <div className="flex-1 px-3 py-2 space-y-2 max-h-80 overflow-y-auto">
                                  {column.items.length === 0 ? (
                                    <p className="text-[11px] text-gray-400 italic">
                                      No cases in this column.
                                    </p>
                                  ) : (
                                    column.items.map(item => (
                                      <button
                                        key={item.a3.id}
                                        type="button"
                                        onClick={() => {
                                          navigate(
                                            `/a3-analysis/${item.a3.id}/problem-statement`,
                                          );
                                        }}
                                        className={clsx(
                                          'w-full text-left rounded-md border px-2.5 py-2 shadow-sm hover:border-blue-200 hover:bg-blue-50/60 transition-colors',
                                          item.labelColorClass,
                                        )}
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="min-w-0">
                                            <p className="text-[11px] font-semibold text-gray-900 leading-snug">
                                              {item.a3.title}
                                            </p>
                                            <p className="mt-0.5 text-[10px] text-gray-500 truncate">
                                              Group:{' '}
                                              <span className="font-medium text-gray-700">
                                                {item.displayLabel}
                                              </span>
                                            </p>
                                          </div>
                                          <span
                                            className={clsx(
                                              'ml-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
                                              item.priorityClass,
                                            )}
                                          >
                                            {item.priority}
                                          </span>
                                        </div>
                                        {item.a3.startDate && (
                                          <p className="mt-1 text-[10px] text-gray-400">
                                            {item.a3.endDate
                                              ? `${item.a3.startDate} → ${item.a3.endDate}`
                                              : `Start: ${item.a3.startDate}`}
                                          </p>
                                        )}
                                      </button>
                                    ))
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      <Suspense fallback={null}>
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
      </Suspense>

      <Suspense fallback={null}>
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
      </Suspense>

      <Suspense fallback={null}>
        <LoginModal 
          isOpen={isLoginModalOpen} 
          onClose={() => setIsLoginModalOpen(false)} 
        />
      </Suspense>

      <Suspense fallback={null}>
        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImport}
        />
      </Suspense>

      <Suspense fallback={null}>
        <AccountSettingsModal 
          isOpen={isAccountSettingsOpen} 
          onClose={() => setIsAccountSettingsOpen(false)} 
        />
      </Suspense>

      <Suspense fallback={null}>
        <AIChatModal
          isOpen={isAIChatOpen}
          onClose={() => {
              setIsAIChatOpen(false);
              setInitialAIPrompt(undefined);
          }}
          initialPrompt={initialAIPrompt}
        />
      </Suspense>

      <Suspense fallback={null}>
        <SummaryModal
          isOpen={isSummaryModalOpen}
          onClose={() => setIsSummaryModalOpen(false)}
          content={summaryContent}
          isLoading={isGeneratingSummary}
          onHideWhileLoading={handleHideSummaryWhileLoading}
          groupPerformanceTableData={groupPerformanceTableData}
        />
      </Suspense>

      <Suspense fallback={null}>
        <AppInfoModal
          isOpen={isAppInfoOpen}
          onClose={() => setIsAppInfoOpen(false)}
        />
      </Suspense>

      <Suspense fallback={null}>
        <ConsolidateModal
          isOpen={isConsolidateModalOpen}
          onClose={() => setIsConsolidateModalOpen(false)}
        />
      </Suspense>

      <Suspense fallback={null}>
        <MindmapModal
          isOpen={isMindmapModalOpen}
          onClose={() => setIsMindmapModalOpen(false)}
          mode={mindmapModalMode}
        />
      </Suspense>
    </div>
  );
};

export default Layout;
