import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, ChevronLeft, ChevronRight, ChevronDown, LogOut, User as UserIcon, Save, Loader2, Sparkles, Info, Zap, FileText, ExternalLink, Upload, Download, MoreVertical, TrendingUp, Layers, NotepadText, Lightbulb, Filter, Bot, Inbox } from 'lucide-react';
import clsx from 'clsx';
import { useApp, A3Case } from '../context/AppContext';
import { Bowler, Metric, AIModelKey } from '../types';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { dataService } from '../services/dataService';
import { useToast } from '../context/ToastContext';
import { getBowlerStatusColor, isViolation } from '../utils/metricUtils';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

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
  const [a3PortfolioViewMode, setA3PortfolioViewMode] = useState<'group' | 'metric'>('group');
  const [portfolioTab, setPortfolioTab] = useState<'bowler' | 'a3'>('bowler');
  const [a3PortfolioGroupFilter, setA3PortfolioGroupFilter] = useState<string>('');
  const [groupFilter, setGroupFilter] = useState<string>('');
  const [metricFilter, setMetricFilter] = useState<string>('');
  const [latestFilter, setLatestFilter] = useState<'all' | 'ok' | 'fail' | 'no-data'>('all');
  const [fail2Filter, setFail2Filter] = useState<'all' | 'yes' | 'no'>('all');
  const [fail3Filter, setFail3Filter] = useState<'all' | 'yes' | 'no'>('all');
  const [achievementFilter, setAchievementFilter] = useState<'all' | 'lt50' | '50to80' | 'gte80'>('all');
  const [a3LowPerfRule, setA3LowPerfRule] = useState({
    latestFail: true,
    fail2: true,
    fail3: true,
  });

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

  const groupPerformanceTableData = useMemo(() => {
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

    const rows: {
      groupName: string;
      metricId: string;
      metricName: string;
      bowlerId?: string;
      latestMet: boolean | null;
      fail2: boolean;
      fail3: boolean;
      achievementRate: number | null;
    }[] = [];

    groupNames.forEach(groupName => {
      const metrics = groupToMetrics[groupName] || [];

      metrics.forEach(metric => {
        const monthly = metric.monthlyData || {};
        const months = Object.keys(monthly).filter(month => {
          const data = monthly[month];
          return data?.actual && data?.target;
        }).sort();

        if (months.length === 0) {
          rows.push({
            groupName,
            metricId: metric.id,
            metricName: metric.name,
            bowlerId: metricOwnerById[metric.id],
            latestMet: null,
            fail2: false,
            fail3: false,
            achievementRate: null,
          });
          return;
        }

        const latestMonth = months[months.length - 1];
        const latest2Months = months.slice(-2);
        const latest3Months = months.slice(-3);

        let latestMet: boolean | null = null;
        const latestData = monthly[latestMonth];
        if (latestData?.actual && latestData?.target) {
          latestMet = !isViolation(metric.targetMeetingRule, latestData.target, latestData.actual);
        }

        let fail2 = false;
        if (latest2Months.length === 2) {
          let allFail2 = true;
          for (const month of latest2Months) {
            const data = monthly[month];
            if (!data?.actual || !data?.target || !isViolation(metric.targetMeetingRule, data.target, data.actual)) {
              allFail2 = false;
              break;
            }
          }
          fail2 = allFail2;
        }

        let fail3 = false;
        if (latest3Months.length === 3) {
          let allFail3 = true;
          for (const month of latest3Months) {
            const data = monthly[month];
            if (!data?.actual || !data?.target || !isViolation(metric.targetMeetingRule, data.target, data.actual)) {
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
          if (data?.actual && data?.target) {
            totalPoints += 1;
            const violation = isViolation(metric.targetMeetingRule, data.target, data.actual);
            if (!violation) {
              metPoints += 1;
            }
          }
        });

        const achievementRate = totalPoints > 0 ? (metPoints / totalPoints) * 100 : null;

        rows.push({
          groupName,
          metricId: metric.id,
          metricName: metric.name,
          bowlerId: metricOwnerById[metric.id],
          latestMet,
          fail2,
          fail3,
          achievementRate,
        });
      });
    });

    return rows;
  }, [bowlers]);

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
    [groupPerformanceTableData, groupFilter, metricFilter, latestFilter, fail2Filter, fail3Filter, achievementFilter],
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

      let metricLabel: string | null = null;
      if (a3.linkedMetricIds && a3.linkedMetricIds.length > 0) {
        for (const id of a3.linkedMetricIds) {
          const label = metricLabelById.get(id);
          if (label) {
            metricLabel = label;
            break;
          }
        }
      }

      const displayLabel =
        a3PortfolioViewMode === 'group'
          ? groupLabel
          : metricLabel || 'No linked metric';

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
  }, [a3Cases, bowlers, a3PortfolioViewMode, a3PortfolioGroupFilter]);

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
      
      const prompt = `Provide a comprehensive performance summary.
      
      Analyze the data based on each metric's 'targetMeetingRule' (e.g., gte, lte, within_range) and 'attribute'.
      Identify all metrics that have missed their target for 2 or more consecutive months (current month + previous 1 or 2). Every such metric must appear in the 'areasOfConcern' array.
      Group the metrics by their 'group' field.
      Also analyze the A3 problem-solving data and produce an overall A3 summary that highlights the main problems, root causes, current status, and overall progress across A3 cases.
      
      For each metric included in 'areasOfConcern', provide a specific, tailored improvement suggestion based on the type of metric and its trend (avoid generic or repeated suggestions).
      
      Return the response in STRICT JSON format with the following structure:
      {
        "executiveSummary": "A concise high-level performance snapshot.",
        "performanceGroups": [
          {
            "groupName": "Group Name",
            "metrics": [
              {
                "name": "Metric Name",
                "latestPerformance": "Value vs Target (e.g., '0.5 vs <1.0') and status emoji (✅/❌)",
                "trendAnalysis": "If the metric has missed its target for 3 consecutive months, provide a brief trend description (e.g., '3-mo Fail ↘️'). Otherwise, return null."
              }
            ]
          }
        ],
        "a3Summary": "Narrative summary of A3 cases, grouped logically where relevant. Cover open vs closed status, key problem themes, dominant root causes, and overall progress in the A3 portfolio.",
        "areasOfConcern": [
        {
          "metricName": "Metric Name",
          "groupName": "Group Name",
          "issue": "Brief description of why the metric is a concern (e.g., 'Failed to meet target for 3 consecutive months, worsening trend')",
          "suggestion": "Detailed, actionable, metric-specific improvement suggestion based on industry best practices and the observed pattern"
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
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center space-x-1">
              <h1 className="text-lg font-semibold text-gray-900 tracking-tight hidden md:block">Performance Tracker</h1>
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
                      handleOneClickSummary();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-teal-600"
                  >
                    {isGeneratingSummary ? (
                      <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                    ) : (
                      <NotepadText className="w-4 h-4 mr-3" />
                    )}
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
                        className="one-click-summary-glow-inner p-2 bg-teal-600 text-white rounded-md shadow-sm hover:bg-teal-700 transition-colors"
                        title="One Click Summary"
                      >
                        {isGeneratingSummary ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <NotepadText className="w-4 h-4" />
                        )}
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
                  {a3PortfolioStats.total === 0 ? (
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
                                    Latest month performance
                                  </th>
                                  <th className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-normal md:whitespace-nowrap">
                                    Failing last 2 months
                                  </th>
                                  <th className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-normal md:whitespace-nowrap">
                                    Failing last 3 months
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
                                {filteredGroupPerformanceTableData.map(row => (
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
                                      {row.latestMet === null ? (
                                        <span>—</span>
                                      ) : row.latestMet ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700 border border-green-100">
                                          <span className="mr-1 h-1.5 w-1.5 rounded-full bg-green-500" />
                                          ok
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700 border border-red-100">
                                          <span className="mr-1 h-1.5 w-1.5 rounded-full bg-red-500" />
                                          fail
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
                                      {row.achievementRate != null ? (
                                        <span
                                          className={clsx(
                                            row.achievementRate <= (2 / 3) * 100 &&
                                              'px-1 rounded bg-amber-50 text-amber-800 font-semibold',
                                          )}
                                        >
                                          {row.achievementRate.toFixed(0)}%
                                        </span>
                                      ) : (
                                        '—'
                                      )}
                                    </td>
                                  </tr>
                                ))}
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

                          <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                                A3 Kanban
                              </p>
                              <p className="mt-0.5 text-xs text-gray-500">
                                Track cases by status and quickly scan groups or metric links.
                              </p>
                            </div>
                            <div className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 p-0.5 text-xs">
                              <button
                                type="button"
                                onClick={() => setA3PortfolioViewMode('group')}
                                className={clsx(
                                  'px-3 py-1.5 rounded-full font-medium transition-colors',
                                  a3PortfolioViewMode === 'group'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800',
                                )}
                              >
                                View by Group
                              </button>
                              <button
                                type="button"
                                onClick={() => setA3PortfolioViewMode('metric')}
                                className={clsx(
                                  'px-3 py-1.5 rounded-full font-medium transition-colors',
                                  a3PortfolioViewMode === 'metric'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800',
                                )}
                              >
                                View by Linked Metric
                              </button>
                            </div>
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
                                              {a3PortfolioViewMode === 'group'
                                                ? 'Group'
                                                : 'Metric'}
                                              :{' '}
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
