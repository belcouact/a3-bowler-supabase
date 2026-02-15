import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, ChevronLeft, ChevronRight, ChevronDown, LogOut, User as UserIcon, Save, Loader2, Sparkles, Info, Zap, FileText, ExternalLink, Upload, Download, MoreVertical, TrendingUp, Layers, Lightbulb, Filter, Users, X, Calendar, FlaskConical, Activity, Clock3, PieChart as PieChartIcon, AlertCircle, Combine, Pencil, Mail, Check, Search, Building2, LayoutGrid, Kanban, List, Target } from 'lucide-react';
import clsx from 'clsx';
import { useApp, A3Case } from '../context/AppContext';
import {
  Bowler,
  Metric,
  MetricData,
  AIModelKey,
  GroupPerformanceRow,
} from '../types';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { dataService } from '../services/dataService';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';
import { getBowlerStatusColor, computeGroupPerformanceTableData } from '../utils/metricUtils';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { diffDays, addDays, formatDate, getMonthName } from '../utils/dateUtils';
import { MindMap } from './MindMap';
import { generateShortId } from '../utils/idUtils';
import { generateSampleSeriesFromAI } from '../services/aiService';

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
const DataChartingModal = lazy(() =>
  import('./DataChartingModal').then(module => ({ default: module.DataChartingModal })),
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

const modelLogos: Record<AIModelKey, string> = {
  gemini: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/google-gemini.svg',
  deepseek: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/deepseek.svg',
  kimi: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/kimi-ai.svg',
  glm: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/z-ai.svg',
};

type AdminSortKey =
  | 'username'
  | 'email'
  | 'role'
  | 'country'
  | 'plant'
  | 'team'
  | 'visibility'
  | 'createdAt'
  | 'lastLoginAt';

interface AdminAccount {
  username: string;
  email?: string;
  role?: string;
  country?: string;
  plant?: string;
  team?: string;
  isPublicProfile?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

interface GlobalA3Case extends A3Case {
  plant?: string;
  userId?: string;
  userAccountId?: string;
}

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
    setSelectedModel,
    dashboardSettings,
    setDashboardSettings,
  } = useApp();
  const { user, logout, isLoading } = useAuth();
  const toast = useToast();

  const normalizedRole = (user?.role || '').trim().toLowerCase();
  const isAdmin = normalizedRole === 'admin';
  const isSuperAdmin = normalizedRole === 'super admin';
  const isAdminOrSuperAdmin = isAdmin || isSuperAdmin;
  const userPlant = (user?.plant || '').trim();

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
  const [isEmailSettingsOpen, setIsEmailSettingsOpen] = useState(false);
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
  const [isA3PortfolioSidebarOpen, setIsA3PortfolioSidebarOpen] = useState(true);
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
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [isLoadingAdminUsers, setIsLoadingAdminUsers] = useState(false);
  const [adminUsersError, setAdminUsersError] = useState<string | null>(null);
  const [adminSortKey, setAdminSortKey] = useState<AdminSortKey>('username');
  const [adminSortDirection, setAdminSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editingAdminAccount, setEditingAdminAccount] = useState<AdminAccount | null>(null);
  const [isSavingAdminAccount, setIsSavingAdminAccount] = useState(false);
  const [editAdminForm, setEditAdminForm] = useState<{
    role: string;
    country: string;
    plant: string;
    team: string;
    isPublicProfile: boolean;
  }>({
    role: '',
    country: '',
    plant: '',
    team: '',
    isPublicProfile: true,
  });
  const [isAllA3ModalOpen, setIsAllA3ModalOpen] = useState(false);
  const [isAllA3KanbanView, setIsAllA3KanbanView] = useState(false);
  const [isAllA3Loading, setIsAllA3Loading] = useState(false);
  const [allA3Error, setAllA3Error] = useState<string | null>(null);
  const [allA3Cases, setAllA3Cases] = useState<GlobalA3Case[]>([]);
  const [selectedGlobalA3, setSelectedGlobalA3] = useState<GlobalA3Case | null>(null);
  const [globalRootCauseView, setGlobalRootCauseView] = useState<'text' | 'mindmap'>('text');
  const [lastAllA3LoadedAt, setLastAllA3LoadedAt] = useState<number | null>(null);
  const [isQuickDemoOpen, setIsQuickDemoOpen] = useState(false);
  const [isLogoPreviewOpen, setIsLogoPreviewOpen] = useState(false);
  const [quickDemoMetricName, setQuickDemoMetricName] = useState('');
  const [isGeneratingQuickDemo, setIsGeneratingQuickDemo] = useState(false);
  const [a3BestPracticeOnly, setA3BestPracticeOnly] = useState(false);
  const [a3SearchTerm, setA3SearchTerm] = useState('');
  const [isUpdatingBestPractice, setIsUpdatingBestPractice] = useState(false);
  const [isDataChartingOpen, setIsDataChartingOpen] = useState(false);

  const isGlobalLoading = isLoading || isDataLoading;
  let globalLoadingMessage = '';

  if (isLoading && isDataLoading) {
    if (isMetricBowler) {
      globalLoadingMessage = 'Loading your account, metrics, and dashboard...';
    } else if (isA3Analysis) {
      globalLoadingMessage = 'Loading your account, A3 cases, and dashboard...';
    } else if (isMindmapPage) {
      globalLoadingMessage = 'Loading your account and dashboard mindmaps...';
    } else {
      globalLoadingMessage = 'Loading your account and workspace data...';
    }
  } else if (isLoading) {
    globalLoadingMessage = 'Loading your account...';
  } else if (isDataLoading) {
    if (isMetricBowler) {
      globalLoadingMessage = 'Loading your metrics and dashboard...';
    } else if (isA3Analysis) {
      globalLoadingMessage = 'Loading your A3 cases and dashboard...';
    } else if (isMindmapPage) {
      globalLoadingMessage = 'Loading your dashboard mindmaps...';
    } else {
      globalLoadingMessage = 'Loading your workspace data...';
    }
  }

  useEffect(() => {
    if (!selectedGlobalA3) {
      return;
    }
  }, [selectedGlobalA3]);

  const visibleAllA3Cases = useMemo(
    () => {
      let cases = allA3Cases;

      if (!isAdminOrSuperAdmin && userPlant) {
        cases = cases.filter(a3 => {
          const plantValue = (a3.plant || '').toString().trim();
          if (!plantValue) {
            return true;
          }
          return plantValue === userPlant;
        });
      }

      if (a3BestPracticeOnly) {
        cases = cases.filter(a3 => !!a3.isBestPractice);
      }

      if (a3SearchTerm.trim()) {
        const lower = a3SearchTerm.toLowerCase().trim();
        cases = cases.filter(
          a3 =>
            (a3.title || '').toLowerCase().includes(lower) ||
            (a3.problemStatement || '').toLowerCase().includes(lower) ||
            (a3.owner || '').toLowerCase().includes(lower) ||
            (a3.plant || '').toLowerCase().includes(lower) ||
            (a3.group || '').toLowerCase().includes(lower),
        );
      }

      return cases;
    },
    [allA3Cases, isAdminOrSuperAdmin, userPlant, a3BestPracticeOnly, a3SearchTerm],
  );

  const allA3KanbanColumns = useMemo(() => {
    if (visibleAllA3Cases.length === 0) {
      return [];
    }

    const statusConfig = [
      {
        key: 'Not Started',
        label: 'Not Started',
        headerClass: 'border-slate-200 bg-slate-50/80',
        badgeClass: 'bg-white text-slate-600 border-slate-200 shadow-sm',
        dotClass: 'bg-slate-400',
      },
      {
        key: 'In Progress',
        label: 'In Progress',
        headerClass: 'border-brand-200 bg-brand-50/60',
        badgeClass: 'bg-white text-brand-700 border-brand-200 shadow-sm',
        dotClass: 'bg-brand-500',
      },
      {
        key: 'Completed',
        label: 'Completed',
        headerClass: 'border-emerald-200 bg-emerald-50/60',
        badgeClass: 'bg-white text-emerald-700 border-emerald-200 shadow-sm',
        dotClass: 'bg-emerald-500',
      },
      {
        key: 'On Hold',
        label: 'On Hold',
        headerClass: 'border-amber-200 bg-amber-50/60',
        badgeClass: 'bg-white text-amber-700 border-amber-200 shadow-sm',
        dotClass: 'bg-amber-500',
      },
      {
        key: 'Cancelled',
        label: 'Cancelled',
        headerClass: 'border-rose-200 bg-rose-50/60',
        badgeClass: 'bg-white text-rose-700 border-rose-200 shadow-sm',
        dotClass: 'bg-rose-500',
      },
    ];

    const labelColorPalette = [
      'bg-blue-50 border-blue-100 text-blue-700',
      'bg-emerald-50 border-emerald-100 text-emerald-700',
      'bg-amber-50 border-amber-100 text-amber-700',
      'bg-purple-50 border-purple-100 text-purple-700',
      'bg-pink-50 border-pink-100 text-pink-700',
      'bg-sky-50 border-sky-100 text-sky-700',
      'bg-lime-50 border-lime-100 text-lime-700',
      'bg-rose-50 border-rose-100 text-rose-700',
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
        return 'bg-rose-50 text-rose-700 border-rose-200';
      }
      if (priority === 'Low') {
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      }
      return 'bg-amber-50 text-amber-700 border-amber-200';
    };

    const columns = statusConfig.map(config => ({
      ...config,
      items: [] as {
        a3: any;
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
      items: [] as typeof columns[0]['items'],
    };

    const columnByStatus: Record<string, typeof columns[number]> = {};
    columns.forEach(col => {
      columnByStatus[col.key] = col;
    });

    visibleAllA3Cases.forEach(a3 => {
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
  }, [visibleAllA3Cases]);

  const loadAdminUsers = async () => {
    setIsLoadingAdminUsers(true);
    setAdminUsersError(null);
    try {
      const localRaw = localStorage.getItem('user_accounts');
      const localAccounts: AdminAccount[] = localRaw ? JSON.parse(localRaw) : [];
      const localMap = new Map(localAccounts.map(account => [account.username, account]));

      const response = await authService.getUsers();
      const apiUsers = (response as any).users || response || [];

      const mergedAccounts: AdminAccount[] = (apiUsers as any[]).map(user => {
        const profile = user.profile || {};
        const local = localMap.get(user.username);
        const profileIsPublic =
          typeof profile.isPublic === 'boolean'
            ? profile.isPublic
            : local && typeof local.isPublicProfile === 'boolean'
              ? local.isPublicProfile
              : undefined;
        return {
          username: user.username,
          email: profile.email || (local && local.email),
          role: user.role || (local && local.role),
          country: profile.country || (local && local.country),
          plant: profile.plant || (local && local.plant),
          team: profile.team || (local && local.team),
          isPublicProfile: profileIsPublic,
          createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : undefined,
          lastLoginAt:
            (local && local.lastLoginAt) ||
            (user.createdAt ? new Date(user.createdAt).toISOString() : undefined),
        };
      });

      setAdminAccounts(mergedAccounts);
    } catch (error: any) {
      console.error('Failed to load users from server', error);
      setAdminUsersError(error?.message || 'Failed to load users from server');
      try {
        const rawAccounts = localStorage.getItem('user_accounts');
        const parsedAccounts: AdminAccount[] = rawAccounts ? JSON.parse(rawAccounts) : [];
        setAdminAccounts(parsedAccounts);
      } catch (fallbackError) {
        console.error('Failed to load user accounts from local storage', fallbackError);
        setAdminAccounts([]);
      }
    } finally {
      setIsLoadingAdminUsers(false);
    }
  };

  const sortedAdminAccounts = useMemo(() => {
    const list = [...adminAccounts];
    const direction = adminSortDirection === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      const compareString = (aValue?: string, bValue?: string) => {
        const av = aValue || '';
        const bv = bValue || '';
        return av.localeCompare(bv);
      };
      const compareDate = (aValue?: string, bValue?: string) => {
        const aTime = aValue ? new Date(aValue).getTime() : 0;
        const bTime = bValue ? new Date(bValue).getTime() : 0;
        if (aTime === bTime) return 0;
        return aTime < bTime ? -1 : 1;
      };
      let result = 0;
      if (adminSortKey === 'username') {
        result = compareString(a.username, b.username);
      } else if (adminSortKey === 'email') {
        result = compareString(a.email, b.email);
      } else if (adminSortKey === 'role') {
        result = compareString(a.role, b.role);
      } else if (adminSortKey === 'country') {
        result = compareString(a.country, b.country);
      } else if (adminSortKey === 'plant') {
        result = compareString(a.plant, b.plant);
      } else if (adminSortKey === 'team') {
        result = compareString(a.team, b.team);
      } else if (adminSortKey === 'visibility') {
        const aVisibility = a.isPublicProfile === false ? 'Private' : 'Public';
        const bVisibility = b.isPublicProfile === false ? 'Private' : 'Public';
        result = compareString(aVisibility, bVisibility);
      } else if (adminSortKey === 'createdAt') {
        result = compareDate(a.createdAt, b.createdAt);
      } else if (adminSortKey === 'lastLoginAt') {
        result = compareDate(a.lastLoginAt, b.lastLoginAt);
      }
      return result * direction;
    });
    return list;
  }, [adminAccounts, adminSortKey, adminSortDirection]);

  const adminUserStats = useMemo(() => {
    const total = adminAccounts.length;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    let active7 = 0;
    let active30 = 0;
    let active90 = 0;

    adminAccounts.forEach(account => {
      if (!account.lastLoginAt) {
        return;
      }
      const time = new Date(account.lastLoginAt).getTime();
      if (!Number.isFinite(time)) {
        return;
      }
      const diffDays = (now - time) / dayMs;
      if (diffDays <= 7) {
        active7 += 1;
      }
      if (diffDays <= 30) {
        active30 += 1;
      }
      if (diffDays <= 90) {
        active90 += 1;
      }
    });

    return {
      total,
      active7,
      active30,
      active90,
    };
  }, [adminAccounts]);

  const handleAdminSort = (key: AdminSortKey) => {
    if (adminSortKey === key) {
      setAdminSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setAdminSortKey(key);
      setAdminSortDirection('asc');
    }
  };

  const handleOpenEditAdminAccount = (account: AdminAccount) => {
    setEditingAdminAccount(account);
    setEditAdminForm({
      role: account.role || '',
      country: account.country || '',
      plant: account.plant || '',
      team: account.team || '',
      isPublicProfile: account.isPublicProfile === false ? false : true,
    });
  };

  const handleChangeEditAdminField = (
    field: 'role' | 'country' | 'plant' | 'team' | 'isPublicProfile',
    value: string | boolean,
  ) => {
    setEditAdminForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveAdminAccount = async () => {
    if (!editingAdminAccount) return;
    if (!isSuperAdmin) {
      toast.error('Only Super admin can update user accounts.');
      return;
    }

    const isEditingSelf = user?.username && editingAdminAccount.username === user.username;
    const desiredRole = (editAdminForm.role || '').trim();
    const desiredRoleNormalized = desiredRole.toLowerCase();

    if (isEditingSelf && isSuperAdmin && desiredRoleNormalized !== 'super admin') {
      toast.error('Super admin cannot change their own role.');
      return;
    }

    setIsSavingAdminAccount(true);
    try {
      await authService.updateProfile({
        username: editingAdminAccount.username,
        role: desiredRole || undefined,
        profile: {
          country: editAdminForm.country || undefined,
          plant: editAdminForm.plant || undefined,
          team: editAdminForm.team || undefined,
          isPublic: editAdminForm.isPublicProfile,
        },
      });
      toast.success('User account updated');
      await loadAdminUsers();
      setEditingAdminAccount(null);
    } catch (error: any) {
      console.error('Failed to update user account', error);
      toast.error(error?.message || 'Failed to update user account');
    } finally {
      setIsSavingAdminAccount(false);
    }
  };

  useEffect(() => {
    if (!isAdminPanelOpen) {
      return;
    }
    loadAdminUsers();
  }, [isAdminPanelOpen]);

  useEffect(() => {
    if (!selectedGlobalA3) {
      setGlobalRootCauseView('text');
      return;
    }
    if (selectedGlobalA3.mindMapNodes && selectedGlobalA3.mindMapNodes.length > 0) {
      setGlobalRootCauseView('mindmap');
    } else {
      setGlobalRootCauseView('text');
    }
  }, [selectedGlobalA3]);

  useEffect(() => {
    if (!isAllA3Loading && visibleAllA3Cases.length === 0 && selectedGlobalA3) {
      setSelectedGlobalA3(null);
    }
  }, [isAllA3Loading, visibleAllA3Cases.length, selectedGlobalA3]);

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
    return computeGroupPerformanceTableData(bowlers, a3Cases);
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

  const metricLabelById = useMemo(() => {
    const map = new Map<string, string>();
    bowlers.forEach(bowler => {
      (bowler.metrics || []).forEach(metric => {
        map.set(metric.id, `${bowler.name} – ${metric.name}`);
      });
    });
    return map;
  }, [bowlers]);

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

  const bowlerDashboardStats = useMemo(() => {
    let rows = groupPerformanceTableData;

    if (groupFilter) {
      rows = rows.filter(row => row.groupName === groupFilter);
    }

    const totalMetrics = rows.length;
    if (totalMetrics === 0) {
      return null;
    }

    let metricsWithLatestData = 0;
    let greenCount = 0;
    let failing2or3Count = 0;
    let metricsWithActiveA3 = 0;
    const today = new Date();
    let totalActiveA3AgeDays = 0;
    let activeA3Count = 0;

    rows.forEach(row => {
      const hasLatestData = row.latestMet !== null;
      if (hasLatestData) {
        metricsWithLatestData += 1;
        if (row.latestMet === true) {
          greenCount += 1;
        }
        if (row.fail2 || row.fail3) {
          failing2or3Count += 1;
        }
      }

      const linked = a3Cases.filter(c => (c.linkedMetricIds || []).includes(row.metricId));
      const activeCases = linked.filter(
        c => (c.status || '').trim().toLowerCase() !== 'completed',
      );

      if (activeCases.length > 0) {
        metricsWithActiveA3 += 1;
      }

      activeCases.forEach(c => {
        if (!c.startDate) {
          return;
        }
        const start = new Date(c.startDate);
        if (isNaN(start.getTime())) {
          return;
        }
        const diffDays = (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays >= 0) {
          totalActiveA3AgeDays += diffDays;
          activeA3Count += 1;
        }
      });
    });

    const pctGreen =
      metricsWithLatestData > 0 ? (greenCount / metricsWithLatestData) * 100 : null;
    const pctFailing2or3 =
      metricsWithLatestData > 0 ? (failing2or3Count / metricsWithLatestData) * 100 : null;
    const pctWithActiveA3 = (metricsWithActiveA3 / totalMetrics) * 100;
    const avgActiveA3AgeDays =
      activeA3Count > 0 ? totalActiveA3AgeDays / activeA3Count : null;

    return {
      totalMetrics,
      metricsWithLatestData,
      pctGreen,
      pctFailing2or3,
      pctWithActiveA3,
      avgActiveA3AgeDays,
    };
  }, [groupPerformanceTableData, groupFilter, a3Cases]);

  const pieLabelRadian = Math.PI / 180;

  const renderPieLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, name, value, percent } = props;
    const radius = outerRadius + 22;
    const x = cx + radius * Math.cos(-midAngle * pieLabelRadian);
    const y = cy + radius * Math.sin(-midAngle * pieLabelRadian);

    return (
      <g>
        <text
          x={x}
          y={y}
          fill="#475569"
          textAnchor={x > cx ? 'start' : 'end'}
          dominantBaseline="central"
          className="text-[10px] font-bold tracking-tight"
        >
          {`${name}`}
        </text>
        <text
          x={x}
          y={y + 12}
          fill="#94a3b8"
          textAnchor={x > cx ? 'start' : 'end'}
          dominantBaseline="central"
          className="text-[9px] font-medium"
        >
          {`${value} (${(percent * 100).toFixed(0)}%)`}
        </text>
      </g>
    );
  };

  const renderPieTooltip = (props: any) => {
    const { active, payload } = props;
    if (!active || !payload || payload.length === 0) return null;

    const entry = payload[0];
    const name = entry.name ?? entry.payload?.name;
    const value = entry.value;
    const color = entry.payload?.color || entry.color;

    return (
      <div className="rounded-xl border border-slate-200 bg-white/95 backdrop-blur-md px-3 py-2 text-[11px] shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: color }} />
          <span className="font-bold text-slate-800">{name}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-500 font-medium">
          <span>Count:</span>
          <span className="text-slate-900">{value}</span>
        </div>
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
        headerClass: 'border-slate-200 bg-slate-50/80',
        badgeClass: 'bg-white text-slate-600 border-slate-200 shadow-sm',
        dotClass: 'bg-slate-400',
      },
      {
        key: 'In Progress',
        label: 'In Progress',
        headerClass: 'border-brand-200 bg-brand-50/60',
        badgeClass: 'bg-white text-brand-700 border-brand-200 shadow-sm',
        dotClass: 'bg-brand-500',
      },
      {
        key: 'Completed',
        label: 'Completed',
        headerClass: 'border-emerald-200 bg-emerald-50/60',
        badgeClass: 'bg-white text-emerald-700 border-emerald-200 shadow-sm',
        dotClass: 'bg-emerald-500',
      },
      {
        key: 'On Hold',
        label: 'On Hold',
        headerClass: 'border-amber-200 bg-amber-50/60',
        badgeClass: 'bg-white text-amber-700 border-amber-200 shadow-sm',
        dotClass: 'bg-amber-500',
      },
      {
        key: 'Cancelled',
        label: 'Cancelled',
        headerClass: 'border-rose-200 bg-rose-50/60',
        badgeClass: 'bg-white text-rose-700 border-rose-200 shadow-sm',
        dotClass: 'bg-rose-500',
      },
    ];

    const labelColorPalette = [
      'bg-blue-50 border-blue-100 text-blue-700',
      'bg-emerald-50 border-emerald-100 text-emerald-700',
      'bg-amber-50 border-amber-100 text-amber-700',
      'bg-purple-50 border-purple-100 text-purple-700',
      'bg-pink-50 border-pink-100 text-pink-700',
      'bg-sky-50 border-sky-100 text-sky-700',
      'bg-lime-50 border-lime-100 text-lime-700',
      'bg-rose-50 border-rose-100 text-rose-700',
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
        return 'bg-rose-50 text-rose-700 border-rose-200';
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
      // 1. Filter by Group
      if (a3PortfolioGroupFilter) {
        const groupKey = (a3.group || 'Ungrouped').trim() || 'Ungrouped';
        if (groupKey !== a3PortfolioGroupFilter) {
          return;
        }
      }

      // 2. Filter by Best Practice
      if (a3BestPracticeOnly && !a3.isBestPractice) {
        return;
      }

      // 3. Filter by Search Term
      if (a3SearchTerm) {
        const term = a3SearchTerm.toLowerCase();
        const matches =
          (a3.title || '').toLowerCase().includes(term) ||
          (a3.owner || '').toLowerCase().includes(term) ||
          (a3.group || '').toLowerCase().includes(term) ||
          (a3.status || '').toLowerCase().includes(term) ||
          (a3.priority || '').toLowerCase().includes(term);

        if (!matches) {
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
  }, [a3Cases, bowlers, a3PortfolioGroupFilter, a3SearchTerm, a3BestPracticeOnly]);

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
      return !!start || !!end;
    });

    if (filtered.length === 0) {
      return null;
    }

    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    filtered.forEach(a3 => {
      const startRaw = parseDate(a3.startDate);
      const endRaw = parseDate(a3.endDate);
      if (!startRaw && !endRaw) {
        return;
      }
      const start = startRaw || endRaw as Date;
      const end = endRaw || startRaw as Date;
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
      const startRaw = parseDate(a3.startDate);
      const endRaw = parseDate(a3.endDate);
      if (!startRaw && !endRaw) {
        return;
      }

      const start = startRaw || endRaw as Date;
      const end = endRaw || startRaw as Date;

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

    const header = `"Bowler Name","Bowler Description","Group","Tag","Metric Name","Definition","Owner","Scope","Attribute","Target Meeting Rule","Type",${monthLabels
      .map(l => `"${l}"`)
      .join(',')}\n`;

    const rows = bowlers
      .flatMap(bowler =>
        (bowler.metrics || []).flatMap(metric => {
          const basicInfo = `"${bowler.name}","${bowler.description || ''}","${bowler.group || ''}","${bowler.tag || ''}","${metric.name}","${metric.definition || ''}","${metric.owner || ''}","${metric.scope || ''}","${metric.attribute || ''}","${
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
    
    // Improved filename with date
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `a3_bowler_export_${dateStr}.csv`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Add success toast for better feedback
    toast.success('Workspace data exported successfully');
  };

  const handleOneClickSummary = async () => {
    if (!user || !user.username) {
      toast.error('Please login to generate one-click summary');
      return;
    }

    if (!groupPerformanceTableData || groupPerformanceTableData.length === 0) {
      toast.info('No metric data available for AI summary. Please add metric data first.');
      return;
    }

    setIsGeneratingSummary(true);
    setSummaryContent('');
    setIsSummaryHiddenWhileLoading(false);
    setIsSummaryModalOpen(true);
    
    try {
      const { generateAIContext, generateComprehensiveSummary } = await import('../services/aiService');
      const context = generateAIContext(bowlers, a3Cases);

      const failingMetricsForAI = groupPerformanceTableData.filter(row => row.fail2 || row.fail3);

      const statsForPrompt = JSON.stringify(
        failingMetricsForAI.map(row => {
          const linked = a3Cases.filter(c => (c.linkedMetricIds || []).includes(row.metricId));
          const completedCount = linked.filter(
            c => (c.status || '').trim().toLowerCase() === 'completed',
          ).length;
          const activeCount = linked.filter(
            c => (c.status || '').trim().toLowerCase() !== 'completed',
          ).length;

          return {
            groupName: row.groupName,
            metricName: row.metricName,
            metricId: row.metricId,
            latestMet: row.latestMet,
            fail2: row.fail2,
            fail3: row.fail3,
            achievementRate:
              row.achievementRate != null ? Number(row.achievementRate.toFixed(1)) : null,
            linkedA3Total: linked.length,
            linkedA3Completed: completedCount,
            linkedA3Active: activeCount,
          };
        }),
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
- metricId: unique id of the metric (matches linkedMetricIds in A3 cases from context).
- linkedA3Total: total number of A3 cases linked to this metric.
- linkedA3Completed: number of linked A3s with status "Completed".
- linkedA3Active: number of linked A3s that are not completed.

Tasks:
1) Write "executiveSummary": a concise high-level snapshot of overall portfolio performance across metrics and A3 activity.
2) Write "a3Summary": an overview of the A3 problem-solving portfolio (key themes, progress, coverage, and where A3 work is effective or insufficient).
3) Build "areasOfConcern": each entry must correspond to one metric from the snapshot where fail2 or fail3 is true.
   - For each metric, write a rich, multi-sentence issue description that references consecutive failures, achievementRate, and any linked A3 activity.
   - For each metric, provide a detailed, action-oriented suggestion that can guide real improvement work (diagnosis, countermeasures, and follow-up).

Guidance for areasOfConcern:
- Prioritize metrics with fail3 = true, then fail2 = true.
- Use latestMet and achievementRate to describe severity and risk.
- Use metricId together with the A3 cases in the provided context to identify any A3s linked to each metric.
- When linkedA3Completed > 0, briefly assess whether performance appears to have improved since those A3s were completed and state whether the A3 work seems effective or not.
- When linkedA3Total = 0 or performance is still weak despite completed A3s, explicitly recommend the next A3 step (for example: start a new A3, extend or revise an existing A3, or move to follow-up/standardization).
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

      const buildEmailSummary = (raw: string) => {
        try {
          const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(clean) as {
            executiveSummary?: string;
            a3Summary?: string;
            areasOfConcern?: {
              metricName: string;
              groupName: string;
              issue: string;
              suggestion: string;
            }[];
          };

          if (!parsed || !parsed.executiveSummary) {
            return raw;
          }

          let text = `Executive Overview:\n${parsed.executiveSummary}\n\n`;

          if (parsed.a3Summary && parsed.a3Summary.trim() !== '') {
            text += `A3 Problem Solving Summary:\n${parsed.a3Summary}\n\n`;
          }

          if (groupPerformanceTableData.length > 0) {
            text += 'Portfolio Statistical Table:\n';
            text +=
              'Group | Metric | Latest month | Last 2 months | Last 3 months | Linked A3s | Overall target achieving %\n';
            text +=
              '----- | ------ | ------------ | ------------- | ------------- | ---------- | --------------------------\n';

            groupPerformanceTableData.forEach(row => {
              const latestText =
                row.latestMet === null || !row.latestActual
                  ? '—'
                  : row.latestActual;

              const last2Text = row.fail2 ? 'Failing' : '—';
              const last3Text = row.fail3 ? 'Failing' : '—';

              const atRisk = row.fail2 || row.fail3;
              const linkedText = atRisk ? (row.linkedA3Count === 0 ? '0' : String(row.linkedA3Count)) : '—';

              const achievementText =
                row.achievementRate != null ? `${row.achievementRate.toFixed(0)}%` : '—';

              text += `${row.groupName} | ${row.metricName} | ${latestText} | ${last2Text} | ${last3Text} | ${linkedText} | ${achievementText}\n`;
            });

            text += '\n';
          }

          if (Array.isArray(parsed.areasOfConcern) && parsed.areasOfConcern.length > 0) {
            text += 'Areas of Concern & Recommendations:\n';
            parsed.areasOfConcern.forEach(area => {
              text += `- ${area.metricName} (${area.groupName}): ${area.issue}\n  Suggestion: ${area.suggestion}\n`;
            });
          }

          return text;
        } catch {
          return raw;
        }
      };

      const buildEmailHtml = (raw: string) => {
        try {
          const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(clean) as {
            executiveSummary?: string;
            a3Summary?: string;
            areasOfConcern?: {
              metricName: string;
              groupName: string;
              issue: string;
              suggestion: string;
            }[];
          };

          if (!parsed || !parsed.executiveSummary || !Array.isArray(parsed.areasOfConcern)) {
            return '';
          }

          const escapeHtml = (value: string) =>
            value
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');

          const executive = escapeHtml(parsed.executiveSummary);
          const a3Summary =
            parsed.a3Summary && parsed.a3Summary.trim() !== ''
              ? `<section class="card card-a3">
  <h2 class="card-title">A3 Problem Solving Summary</h2>
  <p>${escapeHtml(parsed.a3Summary)}</p>
</section>`
              : '';

          const statsTableHtml =
            groupPerformanceTableData.length > 0
              ? `<section class="card card-stats">
  <h2 class="card-title">Portfolio Statistical Table</h2>
  <div class="table-wrapper">
    <table class="stats-table">
      <thead>
        <tr>
          <th>Group</th>
          <th>Metric</th>
          <th>Latest month</th>
          <th>Last 2 months</th>
          <th>Last 3 months</th>
          <th>Linked A3s</th>
          <th>Overall target achieving %</th>
        </tr>
      </thead>
      <tbody>
        ${groupPerformanceTableData
          .map(
            row => `<tr>
          <td>${escapeHtml(row.groupName)}</td>
          <td>${escapeHtml(row.metricName)}</td>
          <td>${
            row.latestMet === null || !row.latestActual
              ? '—'
              : `<span class="status-pill ${
                  row.latestMet === false ? 'status-fail' : 'status-ok'
                }">${escapeHtml(row.latestActual)}</span>`
          }</td>
          <td>${
            row.fail2
              ? '<span class="status-pill status-warn"><span class="status-dot"></span>Failing</span>'
              : '—'
          }</td>
          <td>${
            row.fail3
              ? '<span class="status-pill status-fail"><span class="status-dot"></span>Failing</span>'
              : '—'
          }</td>
          <td>${
            row.fail2 || row.fail3
              ? row.linkedA3Count === 0
                ? '<span class="circle-badge circle-badge-fail">0</span>'
                : `<span class="circle-badge circle-badge-ok">${row.linkedA3Count}</span>`
              : '—'
          }</td>
          <td>${
            row.achievementRate != null
              ? `<span class="status-pill ${
                  row.achievementRate < (2 / 3) * 100
                    ? 'status-fail'
                    : 'status-ok'
                }">${row.achievementRate.toFixed(0)}%</span>`
              : '—'
          }</td>
        </tr>`,
          )
          .join('')}
      </tbody>
    </table>
  </div>
</section>`
              : '';

          const concernsHtml =
            parsed.areasOfConcern.length > 0
              ? parsed.areasOfConcern
                  .map(
                    area => `<div class="concern-card">
  <div class="concern-header">
    <span class="concern-metric">${escapeHtml(area.metricName)}</span>
    <span class="concern-group">${escapeHtml(area.groupName)}</span>
  </div>
  <p class="concern-issue">${escapeHtml(area.issue)}</p>
  <p class="concern-suggestion">${escapeHtml(area.suggestion)}</p>
</div>`,
                  )
                  .join('')
              : '<p class="empty-text">No major areas of concern identified. Keep up the good work!</p>';

          const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Smart Summary & Insights</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root {
      --bg: #f3f4f6;
      --card-bg: #ffffff;
      --primary: #4f46e5;
      --primary-soft: #eef2ff;
      --border-subtle: #e5e7eb;
      --text-main: #111827;
      --text-muted: #6b7280;
      --danger: #b91c1c;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      background: var(--bg);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--text-main);
    }
    .summary-root {
      max-width: 1100px;
      margin: 0 auto;
    }
    .summary-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-radius: 16px;
      background: linear-gradient(90deg, #eef2ff, #ffffff);
      border: 1px solid #e0e7ff;
      margin-bottom: 20px;
    }
    .summary-title {
      font-size: 18px;
      font-weight: 700;
      margin: 0;
    }
    .summary-tag {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 999px;
      background: #ecfdf3;
      color: #166534;
      border: 1px solid #bbf7d0;
      font-size: 11px;
      font-weight: 500;
      margin-top: 4px;
    }
    .summary-tag span {
      margin-left: 4px;
    }
    .card {
      background: var(--card-bg);
      border-radius: 16px;
      border: 1px solid var(--border-subtle);
      padding: 20px 24px;
      margin-bottom: 20px;
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
    }
    .card-executive {
      background: linear-gradient(135deg, #eef2ff, #ffffff);
      border-color: #e0e7ff;
    }
    .card-a3 {
      background: linear-gradient(135deg, #eff6ff, #ffffff);
      border-color: #bfdbfe;
    }
    .card-title {
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 700;
      color: var(--primary);
    }
    .card p {
      margin: 0;
      font-size: 14px;
      line-height: 1.6;
      color: var(--text-muted);
    }
    .card-concerns {
      background: #fef2f2;
      border-color: #fecaca;
    }
    .concern-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #fee2e2;
      padding: 12px 14px;
      margin-bottom: 10px;
    }
    .concern-header {
      display: flex;
      align-items: center;
      margin-bottom: 6px;
    }
    .concern-metric {
      font-size: 13px;
      font-weight: 700;
      margin-right: 6px;
      color: #111827;
    }
    .concern-group {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 999px;
      background: #f3f4f6;
      color: #4b5563;
    }
    .concern-issue {
      font-size: 13px;
      color: var(--danger);
      font-weight: 500;
      margin: 0 0 4px 0;
    }
    .concern-suggestion {
      font-size: 13px;
      color: #4b5563;
      margin: 0;
      font-style: italic;
    }
    .empty-text {
      font-size: 13px;
      color: #9ca3af;
      font-style: italic;
    }
    .table-wrapper {
      overflow-x: auto;
      margin-top: 8px;
    }
    .stats-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .stats-table th,
    .stats-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #e5e7eb;
      text-align: left;
    }
    .stats-table thead th {
      background: #f9fafb;
      font-weight: 600;
      color: #4b5563;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 500;
      border: 1px solid transparent;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 999px;
      margin-right: 4px;
      background: currentColor;
    }
    .status-ok {
      background: #ecfdf3;
      color: #166534;
      border-color: #bbf7d0;
    }
    .status-fail {
      background: #fef2f2;
      color: #b91c1c;
      border-color: #fecaca;
    }
    .status-warn {
      background: #fffbeb;
      color: #92400e;
      border-color: #fed7aa;
    }
    .circle-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      border: 1px solid transparent;
    }
    .circle-badge-ok {
      background: #ecfdf3;
      color: #166534;
      border-color: #bbf7d0;
    }
    .circle-badge-fail {
      background: #fef2f2;
      color: #b91c1c;
      border-color: #fecaca;
    }
    @media (max-width: 640px) {
      body { padding: 16px; }
      .summary-header { flex-direction: column; align-items: flex-start; }
    }
  </style>
</head>
<body>
  <div class="summary-root">
    <header class="summary-header">
      <div>
        <h1 class="summary-title">Smart Summary & Insights</h1>
        <div class="summary-tag">
          <span>Consecutive Failing Metrics Focus</span>
        </div>
      </div>
    </header>

    <section class="card card-executive">
      <h2 class="card-title">Executive Overview</h2>
      <p>${executive}</p>
    </section>

    ${statsTableHtml}

    ${a3Summary}

    <section class="card card-concerns">
      <h2 class="card-title">Areas of Concern & Recommendations</h2>
      ${concernsHtml}
    </section>
  </div>
</body>
</html>`;

          return html;
        } catch {
          return '';
        }
      };

      const emailSummary = buildEmailSummary(summary);
      const emailHtml = buildEmailHtml(summary);

      setDashboardSettings({
        ...dashboardSettings,
        latestSummaryForEmail: emailSummary,
        latestSummaryHtmlForEmail: emailHtml || undefined,
      });
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
          dashboardSettings
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
    if (!isAdminOrSuperAdmin) {
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
    if (!window.confirm('Are you sure you want to delete this A3 Case?')) {
      return;
    }

    const caseToDelete = a3Cases.find(c => c.id === id);
    if (caseToDelete) {
      void dataService.deleteA3ImagesForCase(caseToDelete);
    }

    deleteA3Case(id);
    setIsA3ModalOpen(false);
    setEditingA3Case(null);

    if (location.pathname.includes(`/a3-analysis/${id}`)) {
      navigate('/a3-analysis');
    }
  };

  const handleExit = () => {
    if (window.confirm("Are you sure you want to exit to the main app (study-llm.me)? Unsaved changes may be lost.")) {
      window.location.href = "https://study-llm.me";
    }
  };

  const handleGenerateQuickDemo = async () => {
    if (!quickDemoMetricName.trim()) {
      toast.error('Please enter a metric you would like to create.');
      return;
    }
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    if (isGeneratingQuickDemo) return;
    setIsGeneratingQuickDemo(true);
    try {
      const metricName = quickDemoMetricName.trim();
      const normalizedName = metricName.toLowerCase();
      const isPercentMetric =
        normalizedName.includes('%') ||
        normalizedName.includes('percent') ||
        normalizedName.includes('on-time') ||
        normalizedName.includes('on time') ||
        normalizedName.includes('on-time delivery') ||
        normalizedName.includes('on time delivery');

      const aiSeries = await generateSampleSeriesFromAI(metricName, isPercentMetric, selectedModel);

      const startYear = new Date().getFullYear() - 1;
      const startMonthIndex = 0;
      const monthlyData: Record<string, MetricData> = {};

      const defaultTarget = isPercentMetric ? 95 : 80;
      const targetValue =
        aiSeries.targetValue !== undefined && isFinite(aiSeries.targetValue)
          ? aiSeries.targetValue
          : defaultTarget;

      const fallbackActuals = isPercentMetric
        ? [86, 82, 84, 80, 83, 85, 87, 89, 90, 92, 93, 95]
        : [120.3, 113.9, 108.5, 102.9, 103.5, 96.9, 92.1, 89.3, 83.6, 79.3, 75.4, 71.9];

      const rawActuals =
        aiSeries.actualValues && aiSeries.actualValues.length === 12
          ? aiSeries.actualValues
          : fallbackActuals;

      const adjustedActuals = rawActuals.map((value, index) => {
        let v = value;
        const range = Math.abs(rawActuals[0] - rawActuals[rawActuals.length - 1]) || 1;
        const baseJitter = isPercentMetric ? 1.2 : Math.max(0.5, range * 0.03);
        const jitter = (Math.random() - 0.5) * 2 * baseJitter;
        v += jitter;
        if (!isPercentMetric && (index === 3 || index === 7)) {
          v += baseJitter;
        }
        if (isPercentMetric) {
          if (v > 100) v = 100;
          if (v < 0) v = 0;
        } else if (v < 0) {
          v = Math.abs(v) + 5;
        }
        return v;
      });

      for (let i = 0; i < 12; i++) {
        const date = new Date(startYear, startMonthIndex + i, 1);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const key = `${year}-${month}`;
        const actualValue = adjustedActuals[i];
        monthlyData[key] = {
          target: String(targetValue),
          actual: actualValue.toFixed(1),
        };
      }

      const scenarioName = metricName;
      const definitionText = isPercentMetric
        ? `Monthly performance for "${scenarioName}" expressed as a percentage. The sample data shows chronic underperformance versus the target, with unstable month-to-month results that often miss the goal.`
        : `Monthly performance for "${scenarioName}". The sample data shows performance consistently worse than the target, with unstable month-to-month movement and no sustained improvement. Lower values represent better performance.`;

      const demoBowler: Bowler = {
        id: generateShortId(),
        name: `Sample – ${scenarioName}`,
        description:
          `Sample bowler used for onboarding. It represents a real-world team struggling with performance on "${scenarioName}" over 12 months, frequently missing the target and needing A3 problem solving.`,
        group: user.plant || 'Operations – Demo',
        champion: user.username || '',
        commitment: 'Close the gap between actual performance and target using A3 problem solving.',
        tag: 'SAMPLE',
        metricStartDate: `${startYear}-${String(startMonthIndex + 1).padStart(2, '0')}`,
        metrics: [
          {
            id: generateShortId(),
            name: scenarioName,
            definition: definitionText,
            owner: user.username || '',
            scope: 'Single site / value stream',
            attribute: 'Individual data',
            targetMeetingRule:
              aiSeries.targetMeetingRule === 'gte' || aiSeries.targetMeetingRule === 'lte'
                ? aiSeries.targetMeetingRule
                : 'gte',
            monthlyData,
          },
        ],
      };

      addBowler(demoBowler);
      navigate(`/metric-bowler/${demoBowler.id}`);
      setIsQuickDemoOpen(false);
      setQuickDemoMetricName('');
      toast.success(
        'Created demo metric with AI. You can now review it in Metric Bowler and create an A3 from the chart when you are ready.',
      );
    } catch (error) {
      console.error('Failed to generate AI demo metric and A3', error);
      toast.error('Failed to generate AI demo metric and A3. Please try again.');
    } finally {
      setIsGeneratingQuickDemo(false);
    }
  };

  const navItems = [
    { path: '/metric-bowler', label: 'Metric Bowler', icon: TrendingUp },
    { path: '/a3-analysis', label: 'A3 Analysis', icon: Zap },
    { path: '/portfolio', label: 'Integrated View', icon: Layers },
  ];

  const handleOpenAllA3Modal = async () => {
    setIsAllA3ModalOpen(true);

    const now = Date.now();
    if (
      allA3Cases.length > 0 &&
      !allA3Error &&
      lastAllA3LoadedAt &&
      now - lastAllA3LoadedAt < 5 * 60 * 1000
    ) {
      setIsAllA3Loading(false);
      return;
    }

    setIsAllA3Loading(true);
    setAllA3Error(null);
    try {
      const response = await dataService.loadAllA3Cases();
      if (!response || response.success === false) {
        throw new Error('Failed to load A3 cases');
      }
      const cases = (response.a3Cases || []) as GlobalA3Case[];
      setAllA3Cases(cases);
      setLastAllA3LoadedAt(Date.now());
      if (cases.length > 0) {
        setSelectedGlobalA3(cases[0]);
      } else {
        setSelectedGlobalA3(null);
      }
    } catch (error: any) {
      console.error('Failed to load global A3 cases', error);
      setAllA3Error(error?.message || 'Failed to load A3 cases from server.');
      setAllA3Cases([]);
      setSelectedGlobalA3(null);
    } finally {
      setIsAllA3Loading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 z-[60] h-16 flex items-center px-6 justify-between sticky top-0 w-full transition-all duration-300">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary-500 rounded-lg blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div
                className="relative w-8 h-8 rounded-lg bg-white flex items-center justify-center cursor-pointer shadow-sm border border-slate-100 text-primary-600"
                onClick={() => setIsLogoPreviewOpen(true)}
              >
                <Target className="w-5 h-5" />
              </div>
            </div>
            <div className="relative flex items-center">
              <h1 
                className="text-lg font-bold text-slate-900 tracking-tight hidden md:block pr-5 font-display cursor-pointer hover:text-primary-600 transition-colors"
                onClick={() => setIsAppInfoOpen(true)}
              >
                A3 Bowler
              </h1>
            </div>
          </div>
          
          <nav className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              const isMetric = item.path === '/metric-bowler';
              const isA3 = item.path === '/a3-analysis';
              const isPortfolio = item.path === '/portfolio';

              const activeIconClasses = isMetric
                ? 'text-primary-600'
                : isA3
                ? 'text-purple-600'
                : isPortfolio
                ? 'text-emerald-600'
                : 'text-primary-600';

              const activeContainerClasses = isMetric
                ? 'bg-primary-50 text-primary-900 border-primary-200 shadow-sm ring-1 ring-primary-100'
                : isA3
                ? 'bg-purple-50 text-purple-900 border-purple-200 shadow-sm ring-1 ring-purple-100'
                : isPortfolio
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200 shadow-sm ring-1 ring-emerald-100'
                : 'bg-white text-slate-900 border-slate-200 shadow-sm ring-1 ring-slate-100';

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    'flex items-center px-3 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all duration-200 border border-transparent',
                    isActive
                      ? activeContainerClasses
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  )}
                  title={item.label}
                >
                  <span
                    className={clsx(
                      'flex items-center justify-center mr-1.5 transition-colors',
                      isActive ? activeIconClasses : 'text-slate-400'
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
          <div className="relative">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {isMobileMenuOpen && (
              <>
                <div className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-xl py-1.5 z-[100] border border-slate-100 p-1 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                    Workspace Actions
                  </div>
                  <button
                    onClick={() => {
                      handleExit();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center px-2 py-1.5 text-sm text-slate-600 rounded-lg hover:bg-slate-50 hover:text-red-600 transition-all group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center mr-2 group-hover:bg-red-50 transition-all ring-1 ring-slate-200/50 group-hover:ring-red-200/50">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Exit App</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsImportModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center px-2 py-1.5 text-sm text-slate-600 rounded-lg hover:bg-slate-50 hover:text-emerald-600 transition-all group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mr-2 group-hover:bg-emerald-100 transition-all shadow-sm ring-1 ring-emerald-200/50">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-bold">Import CSV</span>
                      <span className="text-[10px] text-slate-400 leading-none mt-0.5">Bulk metric upload</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      handleDownloadAllCSV();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center px-2 py-1.5 text-sm text-slate-600 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-all group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mr-2 group-hover:bg-blue-100 transition-all shadow-sm ring-1 ring-blue-200/50">
                      <Download className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-bold">Download</span>
                      <span className="text-[10px] text-slate-400 leading-none mt-0.5">Export workspace data</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setIsDataChartingOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center px-2 py-1.5 text-sm text-slate-600 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-all group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mr-2 group-hover:bg-indigo-100 transition-all shadow-sm ring-1 ring-indigo-200/50">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-bold">Data Analysis</span>
                      <span className="text-[10px] text-slate-400 leading-none mt-0.5">AI data insights</span>
                    </div>
                  </button>
                  {isSuperAdmin && (
                    <button
                      onClick={() => {
                        setIsAdminPanelOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex w-full items-center px-2 py-1.5 text-sm text-slate-600 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-all group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center mr-2 group-hover:bg-slate-100 transition-all ring-1 ring-slate-200/50">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="font-medium">User Mgmt</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleOpenConsolidateModal();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center px-2 py-1.5 text-sm text-slate-600 rounded-lg hover:bg-slate-50 hover:text-purple-600 transition-all group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mr-2 group-hover:bg-purple-100 transition-all shadow-sm ring-1 ring-purple-200/50">
                      <Combine className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-bold">Consolidate</span>
                      <span className="text-[10px] text-slate-400 leading-none mt-0.5">Merge tagged data</span>
                    </div>
                  </button>

                  <button
                    onClick={async () => {
                      setIsMobileMenuOpen(false);
                      await handleOpenAllA3Modal();
                    }}
                    className="flex w-full items-center px-2 py-1.5 text-sm text-slate-600 rounded-lg hover:bg-slate-50 hover:text-brand-600 transition-all group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mr-2 group-hover:bg-brand-100 transition-all shadow-sm ring-1 ring-brand-200/50">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-bold">A3 Cases</span>
                      <span className="text-[10px] text-slate-400 leading-none mt-0.5">Show all cases</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsEmailSettingsOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center px-2 py-1.5 text-sm text-slate-600 rounded-lg hover:bg-slate-50 hover:text-rose-600 transition-all group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mr-2 group-hover:bg-rose-100 transition-all shadow-sm ring-1 ring-rose-200/50">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-bold">Scheduling</span>
                      <span className="text-[10px] text-slate-400 leading-none mt-0.5">Auto email reports</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setIsAIChatOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center px-2 py-1.5 text-sm text-slate-600 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-all group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mr-2 group-hover:bg-indigo-100 transition-all shadow-sm ring-1 ring-indigo-200/50">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-bold">Ask AI</span>
                      <span className="text-[10px] text-slate-400 leading-none mt-0.5">Intelligent coach</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/mindmap');
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center px-2 py-1.5 text-sm text-slate-600 rounded-lg hover:bg-slate-50 hover:text-amber-600 transition-all group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mr-2 group-hover:bg-amber-100 transition-all shadow-sm ring-1 ring-amber-200/50">
                      <Lightbulb className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-bold">Map Ideas</span>
                      <span className="text-[10px] text-slate-400 leading-none mt-0.5">Visual brainstorming</span>
                    </div>
                  </button>


                </div>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              </>
            )}
          </div>

          <button
            onClick={handleSaveData}
            disabled={isSaving}
            className={clsx(
                  "inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-50",
                  isSaving 
                    ? "bg-slate-100 text-slate-400" 
                    : "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-100 active:scale-95"
                )}
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
              <div className="relative">
                <button
                  onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                  className="h-9 w-9 rounded-xl border-2 border-slate-100 text-slate-600 bg-white shadow-sm hover:border-pink-200 hover:bg-pink-50 transition-all flex items-center justify-center overflow-hidden group"
                  title={`AI Model: ${modelOptions.find(option => option.key === selectedModel)?.label || ''}`}
                >
                  {modelLogos[selectedModel] ? (
                    <img
                      src={modelLogos[selectedModel]}
                      alt="AI model logo"
                      className="w-5 h-5 transition-transform group-hover:scale-110"
                    />
                  ) : (
                    <span className="text-[10px] font-bold text-pink-600">{modelShortLabels[selectedModel]}</span>
                  )}
                </button>
                {isModelMenuOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-[80] p-1.5 animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                      Select Model
                    </div>
                    {modelOptions.map(option => (
                      <button
                        key={option.key}
                        onClick={() => {
                          setSelectedModel(option.key);
                          setIsModelMenuOpen(false);
                        }}
                        className={clsx(
                          'w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between group',
                          option.key === selectedModel 
                            ? 'bg-pink-50 text-pink-700 font-bold' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <img src={modelLogos[option.key]} alt="" className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                          {option.label}
                        </div>
                        {option.key === selectedModel && <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsAccountSettingsOpen(true)}
                  className="group flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all"
                  title={user.username || 'User Settings'}
                >
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-[10px] shadow-sm group-hover:shadow-md transition-all">
                    {user.username ? user.username.substring(0, 2).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-xs font-bold text-slate-700 hidden sm:inline">{user.username}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </button>
                
                <button 
                  onClick={() => {
                    if (window.confirm("Are you sure you want to logout? Unsaved changes may be lost.")) {
                      logout();
                    }
                  }}
                  disabled={isLoading}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
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

      {isGlobalLoading && globalLoadingMessage && (
        <div className="bg-blue-50 border-b border-blue-100">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <p className="text-xs md:text-sm font-medium text-blue-700">
              {globalLoadingMessage}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-1">
        {/* Dynamic Sidebar */}
        <aside className={clsx(
          "bg-white border-r border-slate-200/60 flex flex-col transition-all duration-300 ease-in-out relative shadow-[4px_0_24px_rgba(0,0,0,0.02)]",
          isSidebarOpen ? "w-64 absolute z-50 h-full md:relative" : "w-0 md:w-16",
          location.pathname.startsWith('/portfolio') ? "hidden md:hidden" : ""
        )}>
          <button
             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
             className={clsx(
               "absolute -right-3 top-16 rounded-full p-1.5 shadow-md border z-20 transition-all",
               "bg-white border-slate-200 text-slate-500 hover:text-primary-600 hover:border-primary-200"
             )}
          >
             {isSidebarOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>

          <div className="flex flex-col w-full h-full overflow-hidden">
            <div className={clsx(
              "p-4 border-b border-slate-100 flex items-center bg-slate-50/50 backdrop-blur-sm h-14 overflow-hidden flex-shrink-0",
              isSidebarOpen ? "justify-between" : "justify-center"
            )}>
              {isSidebarOpen ? (
                <>
                  <h2 className="font-bold text-slate-500 text-xs uppercase tracking-wider truncate font-display">
                    {isMetricBowler ? 'Bowler Lists' : isMindmapPage ? 'Mindmap ideas' : 'A3 Cases'}
                  </h2>
                  <div className="flex items-center gap-1">
                    {isMetricBowler && (
                      <>
                        <button
                          onClick={() => setIsBowlerFilterOpen(!isBowlerFilterOpen)}
                          className={clsx(
                            "p-1 rounded-md border transition-colors",
                            isBowlerFilterOpen
                              ? "bg-slate-200 border-slate-300 text-slate-800"
                              : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
                          )}
                          title="Filter Bowler lists by Team, Group, or Tag"
                        >
                          <Filter className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setIsQuickDemoOpen(true)}
                          className="p-1 rounded-md hover:bg-indigo-50 text-indigo-600 transition-colors"
                          title="Sample metric"
                        >
                          <FlaskConical className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    <button 
                      onClick={handlePlusClick}
                      className="p-1 rounded-md hover:bg-primary-50 text-primary-600 transition-colors"
                      title="Add New"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePlusClick}
                    className="p-1 rounded-md hover:bg-primary-50 text-primary-600 transition-colors"
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
                                              ? "bg-primary-50 text-primary-700 ring-1 ring-primary-100 shadow-sm"
                                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
                                          {isSidebarOpen && (
                                            <button
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setEditingBowler(bowler);
                                                setIsBowlerModalOpen(true);
                                              }}
                                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded-md transition-all text-slate-400 hover:text-primary-600"
                                              title="Edit Bowler"
                                            >
                                              <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                          )}
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
                                        "flex items-center w-full text-xs font-bold uppercase tracking-wider mb-1 transition-colors font-display",
                                        isSidebarOpen ? "px-3 justify-between" : "justify-center",
                                        isGroupExpanded(group)
                                          ? "text-primary-700"
                                          : "text-slate-500 hover:text-slate-700"
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
                                                          "bg-primary-50 text-primary-600"
                                                        )}
                                                    />
                                                ) : (
                                                    <ChevronRight
                                                        className={clsx(
                                                          "w-3 h-3 rounded-full p-0.5",
                                                          "bg-primary-50 text-primary-600"
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
                                                      "bg-primary-50 text-primary-600"
                                                    )}
                                                />
                                            ) : (
                                                <ChevronRight
                                                    className={clsx(
                                                      "w-3 h-3 rounded-full p-0.5",
                                                      "bg-primary-50 text-primary-600"
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
                                          className={clsx("space-y-1", isSidebarOpen && "pl-3 border-l-2 border-slate-100 ml-2")}
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
                                                              ? "bg-primary-50 text-primary-700 ring-1 ring-primary-100 shadow-sm"
                                                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
                                                          {isSidebarOpen && (
                                                              <button
                                                                  onClick={(e) => {
                                                                      e.preventDefault();
                                                                      e.stopPropagation();
                                                                      setEditingBowler(bowler);
                                                                      setIsBowlerModalOpen(true);
                                                                  }}
                                                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded-md transition-all text-slate-400 hover:text-primary-600"
                                                                  title="Edit Bowler"
                                                              >
                                                                  <Pencil className="w-3.5 h-3.5" />
                                                              </button>
                                                          )}
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
                                            {isSidebarOpen && (
                                              <button
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  setEditingA3Case(a3);
                                                  setIsA3ModalOpen(true);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded-md transition-all text-slate-400 hover:text-blue-600"
                                                title="Edit A3 Case"
                                              >
                                                <Pencil className="w-3.5 h-3.5" />
                                              </button>
                                            )}
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
                                                            {isSidebarOpen && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        setEditingA3Case(a3);
                                                                        setIsA3ModalOpen(true);
                                                                    }}
                                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded-md transition-all text-slate-400 hover:text-blue-600"
                                                                    title="Edit A3 Case"
                                                                >
                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
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
              <div className="bg-white rounded-xl shadow-md border border-slate-200/60 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-lg shadow-sm group-hover:scale-105 transition-transform">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg md:text-xl font-bold text-slate-900 font-display tracking-tight group-hover:text-emerald-700 transition-colors">
                          Integrated View
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500 font-medium">
                          Connect underperforming Bowler metrics to A3 problem solving.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:flex items-center px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
                        <div className="flex -space-x-2">
                          {[...new Set(bowlers.map(b => b.group).filter(Boolean))].slice(0, 3).map((g, i) => (
                            <div key={i} className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400 shadow-sm" title={g}>
                              {g?.charAt(0)}
                            </div>
                          ))}
                        </div>
                        <span className="ml-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {new Set(bowlers.map(b => b.group).filter(Boolean)).size} Groups
                        </span>
                      </div>
                      <div
                        className={clsx(
                          'one-click-summary-glow',
                          isGeneratingSummary && 'one-click-summary-glow-active',
                        )}
                      >
                        <button
                          onClick={handleOneClickSummary}
                          className="one-click-summary-glow-inner inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg shadow-md hover:bg-emerald-700 hover:shadow-lg transition-all duration-200 active:scale-95 border border-emerald-500/50"
                          title="One Click Summary"
                        >
                          {isGeneratingSummary ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                          <span className="hidden md:inline text-xs font-bold uppercase tracking-wide">
                            AI Summary
                          </span>
                        </button>
                      </div>
                    </div>
                </div>
                <div className="p-4 md:p-6 space-y-6">
                  <div className="flex p-1 bg-slate-100/80 rounded-xl w-fit mb-2">
                    <button
                      type="button"
                      onClick={() => setPortfolioTab('bowler')}
                      className={clsx(
                        'whitespace-nowrap py-2 px-4 text-xs md:text-sm font-semibold inline-flex items-center gap-2 rounded-lg transition-all duration-200',
                        portfolioTab === 'bowler'
                          ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-white/50',
                      )}
                    >
                      <TrendingUp className={clsx("w-4 h-4", portfolioTab === 'bowler' ? "text-emerald-500" : "text-slate-400")} />
                      <span>Bowler Overview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPortfolioTab('a3')}
                      className={clsx(
                        'whitespace-nowrap py-2 px-4 text-xs md:text-sm font-semibold inline-flex items-center gap-2 rounded-lg transition-all duration-200',
                        portfolioTab === 'a3'
                          ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-white/50',
                      )}
                    >
                      <Layers className={clsx("w-4 h-4", portfolioTab === 'a3' ? "text-indigo-500" : "text-slate-400")} />
                      <span>A3 Portfolio</span>
                    </button>
                  </div>
                  {a3PortfolioStats.total === 0 && portfolioTab === 'a3' ? (
                    <div className="py-8 text-center text-sm text-gray-500">
                      No A3 cases in the portfolio yet. Use the + button to create your first case.
                    </div>
                  ) : (
                    <>
                      {portfolioTab === 'bowler' && groupPerformanceTableData.length === 0 && (
                        <div className="py-8 text-center text-sm text-gray-500">
                          No metrics added yet. Use the + button to add metrics.
                        </div>
                      )}
                      {portfolioTab === 'bowler' && groupPerformanceTableData.length > 0 && (
                        <div className="mb-4">
                          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase">
                                Bowler Dashboard
                              </p>
                              <p className="mt-0.5 text-xs text-gray-500">
                                Latest month performance and A3 coverage snapshot
                                {groupFilter ? ` for ${groupFilter}` : ''}.
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-gray-500">Group</span>
                              <select
                                className="rounded border border-gray-200 bg-white px-2 py-1 text-[11px] md:text-xs text-gray-700"
                                value={groupFilter}
                                onChange={e => setGroupFilter(e.target.value)}
                              >
                                <option value="">All groups</option>
                                {groupFilterOptions.map(name => (
                                  <option key={name} value={name}>
                                    {name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          {bowlerDashboardStats && (
                            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                              <div
                                className="group rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 transition-all duration-200 hover:shadow-sm hover:bg-emerald-50"
                                title="Share of metrics with latest month meeting target, among metrics that have latest data."
                              >
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                                    <TrendingUp className="w-4 h-4" />
                                  </div>
                                  <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                                    Metrics Green
                                  </p>
                                </div>
                                <p className="text-2xl font-bold text-slate-900">
                                  {bowlerDashboardStats.pctGreen != null
                                    ? `${bowlerDashboardStats.pctGreen.toFixed(0)}%`
                                    : '—'}
                                </p>
                                <p className="mt-1 text-[11px] text-emerald-700/70 font-medium">
                                  {bowlerDashboardStats.metricsWithLatestData} metrics on target
                                </p>
                              </div>

                              <div
                                className="group rounded-xl border border-rose-100 bg-rose-50/50 p-4 transition-all duration-200 hover:shadow-sm hover:bg-rose-50"
                                title="Share of metrics failing in the last 2 or 3 months, among metrics that have latest data."
                              >
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg group-hover:scale-110 transition-transform">
                                    <Activity className="w-4 h-4" />
                                  </div>
                                  <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                                    At Risk
                                  </p>
                                </div>
                                <p className="text-2xl font-bold text-slate-900">
                                  {bowlerDashboardStats.pctFailing2or3 != null
                                    ? `${bowlerDashboardStats.pctFailing2or3.toFixed(0)}%`
                                    : '—'}
                                </p>
                                <p className="mt-1 text-[11px] text-rose-700/70 font-medium">
                                  Recent performance gaps
                                </p>
                              </div>

                              <div
                                className="group rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 transition-all duration-200 hover:shadow-sm hover:bg-indigo-50"
                                title="Share of metrics linked to at least one active A3."
                              >
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
                                    <Zap className="w-4 h-4" />
                                  </div>
                                  <p className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">
                                    A3 Coverage
                                  </p>
                                </div>
                                <p className="text-2xl font-bold text-slate-900">
                                  {bowlerDashboardStats.pctWithActiveA3.toFixed(0)}%
                                </p>
                                <p className="mt-1 text-[11px] text-indigo-700/70 font-medium">
                                  {bowlerDashboardStats.totalMetrics} metrics tracked
                                </p>
                              </div>

                              <div
                                className="group rounded-xl border border-amber-100 bg-amber-50/50 p-4 transition-all duration-200 hover:shadow-sm hover:bg-amber-50"
                                title="Average age in days of active A3s linked to these metrics."
                              >
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg group-hover:scale-110 transition-transform">
                                    <Clock3 className="w-4 h-4" />
                                  </div>
                                  <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                                    Avg A3 Age
                                  </p>
                                </div>
                                <p className="text-2xl font-bold text-slate-900">
                                  {bowlerDashboardStats.avgActiveA3AgeDays != null
                                    ? `${Math.round(bowlerDashboardStats.avgActiveA3AgeDays)}d`
                                    : '—'}
                                </p>
                                <p className="mt-1 text-[11px] text-amber-700/70 font-medium">
                                  Since case initiation
                                </p>
                              </div>
                            </div>
                          )}
                          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-md">
                            <table className="min-w-full divide-y divide-slate-200 text-xs md:text-sm">
                              <thead className="bg-slate-50/90 backdrop-blur-md sticky top-0 z-10">
                                <tr>
                                  <th className="px-4 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Group
                                  </th>
                                  <th className="px-4 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Metric
                                  </th>
                                  <th className="px-4 py-4 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Latest
                                  </th>
                                  <th className="px-4 py-4 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Trend (2m)
                                  </th>
                                  <th className="px-4 py-4 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Trend (3m)
                                  </th>
                                  <th className="px-4 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Linked A3s
                                  </th>
                                  <th className="px-4 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    <span className="inline-flex items-center gap-1.5 justify-end w-full">
                                      <span>Achievement</span>
                                      <button
                                        type="button"
                                        className="text-slate-400 hover:text-emerald-500 transition-colors"
                                        title="Achievement percentage against target. Red if ≤66%."
                                      >
                                        <Info className="w-3.5 h-3.5" />
                                      </button>
                                    </span>
                                  </th>
                                </tr>
                                <tr className="bg-white border-b border-slate-100 shadow-sm">
                                  <th className="px-4 pb-3">
                                    <div className="relative group">
                                      <select
                                        className="w-full appearance-none rounded-lg border-slate-200 bg-slate-50/50 px-3 py-2 text-[11px] md:text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none pr-8"
                                        value={groupFilter}
                                        onChange={e => setGroupFilter(e.target.value)}
                                      >
                                        <option value="">All Groups</option>
                                        {groupFilterOptions.map(name => (
                                          <option key={name} value={name}>
                                            {name}
                                          </option>
                                        ))}
                                      </select>
                                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none group-hover:text-emerald-500 transition-colors" />
                                    </div>
                                  </th>
                                  <th className="px-4 pb-3">
                                    <div className="relative group">
                                      <select
                                        className="w-full appearance-none rounded-lg border-slate-200 bg-slate-50/50 px-3 py-2 text-[11px] md:text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none pr-8"
                                        value={metricFilter}
                                        onChange={e => setMetricFilter(e.target.value)}
                                      >
                                        <option value="">All Metrics</option>
                                        {metricFilterOptions.map(name => (
                                          <option key={name} value={name}>
                                            {name}
                                          </option>
                                        ))}
                                      </select>
                                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none group-hover:text-emerald-500 transition-colors" />
                                    </div>
                                  </th>
                                  <th className="px-4 pb-3">
                                    <div className="relative group">
                                      <select
                                        className="w-full appearance-none rounded-lg border-slate-200 bg-slate-50/50 px-3 py-2 text-[11px] md:text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none pr-8"
                                        value={latestFilter}
                                        onChange={e => setLatestFilter(e.target.value as 'all' | 'ok' | 'fail' | 'no-data')}
                                      >
                                        <option value="all">Status</option>
                                        <option value="ok">Ok</option>
                                        <option value="fail">Fail</option>
                                        <option value="no-data">None</option>
                                      </select>
                                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none group-hover:text-emerald-500 transition-colors" />
                                    </div>
                                  </th>
                                  <th className="px-4 pb-3">
                                    <div className="relative group">
                                      <select
                                        className="w-full appearance-none rounded-lg border-slate-200 bg-slate-50/50 px-3 py-2 text-[11px] md:text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none pr-8"
                                        value={fail2Filter}
                                        onChange={e => setFail2Filter(e.target.value as 'all' | 'yes' | 'no')}
                                      >
                                        <option value="all">Trend</option>
                                        <option value="yes">Failing</option>
                                        <option value="no">Stable</option>
                                      </select>
                                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none group-hover:text-emerald-500 transition-colors" />
                                    </div>
                                  </th>
                                  <th className="px-4 pb-3">
                                    <div className="relative group">
                                      <select
                                        className="w-full appearance-none rounded-lg border-slate-200 bg-slate-50/50 px-3 py-2 text-[11px] md:text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none pr-8"
                                        value={fail3Filter}
                                        onChange={e => setFail3Filter(e.target.value as 'all' | 'yes' | 'no')}
                                      >
                                        <option value="all">Trend</option>
                                        <option value="yes">Failing</option>
                                        <option value="no">Stable</option>
                                      </select>
                                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none group-hover:text-emerald-500 transition-colors" />
                                    </div>
                                  </th>
                                  <th className="px-4 pb-3">
                                    <div className="relative group">
                                      <select
                                        className="w-full appearance-none rounded-lg border-slate-200 bg-slate-50/50 px-3 py-2 text-[11px] md:text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none pr-8"
                                        value={a3LinkFilter}
                                        onChange={e =>
                                          setA3LinkFilter(
                                            e.target.value as 'all' | 'missing' | 'present' | 'not-needed',
                                          )
                                        }
                                      >
                                        <option value="all">A3 Status</option>
                                        <option value="missing">Needed</option>
                                        <option value="present">Linked</option>
                                        <option value="not-needed">N/A</option>
                                      </select>
                                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none group-hover:text-emerald-500 transition-colors" />
                                    </div>
                                  </th>
                                  <th className="px-4 pb-3">
                                    <div className="relative group">
                                      <select
                                        className="w-full appearance-none rounded-lg border-slate-200 bg-slate-50/50 px-3 py-2 text-[11px] md:text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none pr-8"
                                        value={achievementFilter}
                                        onChange={e =>
                                          setAchievementFilter(
                                            e.target.value as 'all' | 'lt50' | '50to80' | 'gte80',
                                          )
                                        }
                                      >
                                        <option value="all">Goal %</option>
                                        <option value="lt50">&lt; 50%</option>
                                        <option value="50to80">50–79%</option>
                                        <option value="gte80">≥ 80%</option>
                                      </select>
                                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none group-hover:text-emerald-500 transition-colors" />
                                    </div>
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {filteredGroupPerformanceTableData.map(row => {
                                  const isAtRisk = row.fail2 || row.fail3;
                                  const linkedA3Count = isAtRisk
                                    ? a3Cases.filter(c => (c.linkedMetricIds || []).includes(row.metricId)).length
                                    : 0;

                                  return (
                                    <tr 
                                      key={`${row.groupName}-${row.metricId}`}
                                      className="hover:bg-slate-50/80 transition-colors group/row border-b border-slate-50 last:border-0"
                                    >
                                      <td className="px-4 py-3 text-[11px] md:text-xs font-semibold text-slate-700">
                                        {row.groupName}
                                      </td>
                                      <td className="px-4 py-3">
                                        <button
                                          type="button"
                                          className="text-[11px] md:text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline text-left transition-colors"
                                          onClick={() => {
                                            if (row.bowlerId) {
                                              navigate(`/metric-bowler/${row.bowlerId}`);
                                            }
                                          }}
                                        >
                                          {row.metricName}
                                        </button>
                                      </td>
                                      <td className="px-4 py-3">
                                        {row.latestMet === null || !row.latestActual ? (
                                          <span className="text-slate-300">—</span>
                                        ) : (
                                          <span
                                            className={clsx(
                                              'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-sm',
                                              row.latestMet === false
                                                ? 'bg-red-50 text-red-700 border-red-100'
                                                : 'bg-emerald-50 text-emerald-700 border-emerald-100',
                                            )}
                                          >
                                            {row.latestActual}
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3">
                                        {row.fail2 ? (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 shadow-sm">
                                            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                            Failing
                                          </span>
                                        ) : (
                                          <span className="text-slate-300">—</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3">
                                        {row.fail3 ? (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-100 shadow-sm">
                                            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                                            Failing
                                          </span>
                                        ) : (
                                          <span className="text-slate-300">—</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        {isAtRisk ? (
                                          linkedA3Count === 0 ? (
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 shadow-sm ring-2 ring-red-500/10">
                                              0
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm">
                                              {linkedA3Count}
                                            </span>
                                          )
                                        ) : (
                                          <span className="text-slate-300">—</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3">
                                        {row.achievementRate != null ? (
                                          <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 w-12 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                                              <div 
                                                className={clsx(
                                                  "h-full rounded-full transition-all duration-500",
                                                  row.achievementRate < (2 / 3) * 100 ? "bg-red-500" : "bg-emerald-500"
                                                )}
                                                style={{ width: `${Math.min(100, row.achievementRate)}%` }}
                                              />
                                            </div>
                                            <span
                                              className={clsx(
                                                'text-[10px] font-bold min-w-[32px] text-right',
                                                row.achievementRate < (2 / 3) * 100
                                                  ? 'text-red-600'
                                                  : 'text-emerald-600',
                                              )}
                                            >
                                              {row.achievementRate.toFixed(0)}%
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="text-slate-300">—</span>
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
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Filter by Group</span>
                              <div className="relative group min-w-[160px]">
                                <select
                                  className="w-full appearance-none rounded-lg border-slate-200 bg-white px-3 py-1.5 text-[11px] md:text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none pr-8 shadow-sm"
                                  value={a3PortfolioGroupFilter}
                                  onChange={e => setA3PortfolioGroupFilter(e.target.value)}
                                >
                                  <option value="">All Groups</option>
                                  {a3PortfolioGroupOptions.map(name => (
                                    <option key={name} value={name}>
                                      {name}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none group-hover:text-emerald-500 transition-colors" />
                              </div>
                            </div>
                          </div>
                          <div className="mt-4">
                            <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase">
                              A3 Dashboard
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500">
                              Snapshot of portfolio A3s addressing at-risk metrics by coverage, timing, status, and priority.
                            </p>
                          </div>
                          <div className="mt-2 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                            <div className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-emerald-200">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  Metric A3 Coverage
                                </p>
                                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors shadow-sm ring-1 ring-emerald-100/50">
                                  <PieChartIcon className="w-4 h-4" />
                                </div>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="h-40 w-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={metricA3Coverage.pieData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={38}
                                        outerRadius={58}
                                        paddingAngle={5}
                                        label={renderPieLabel}
                                        labelLine={false}
                                        stroke="none"
                                      >
                                        {metricA3Coverage.pieData.map((entry, index) => (
                                          <Cell
                                            key={`metric-coverage-cell-${index}`}
                                            fill={entry.color}
                                            className="outline-none transition-opacity hover:opacity-80"
                                          />
                                        ))}
                                      </Pie>
                                      <Tooltip content={renderPieTooltip} />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-gray-500">
                                <label className="inline-flex items-center gap-1.5 cursor-pointer group/label">
                                  <input
                                    type="checkbox"
                                    className="h-3.5 w-3.5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500/20 transition-all cursor-pointer"
                                    checked={a3LowPerfRule.latestFail}
                                    onChange={e =>
                                      setA3LowPerfRule({
                                        ...a3LowPerfRule,
                                        latestFail: e.target.checked,
                                      })
                                    }
                                  />
                                  <span className="group-hover/label:text-slate-900 transition-colors font-medium">Latest fail</span>
                                </label>
                                <label className="inline-flex items-center gap-1.5 cursor-pointer group/label">
                                  <input
                                    type="checkbox"
                                    className="h-3.5 w-3.5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500/20 transition-all cursor-pointer"
                                    checked={a3LowPerfRule.fail2}
                                    onChange={e =>
                                      setA3LowPerfRule({
                                        ...a3LowPerfRule,
                                        fail2: e.target.checked,
                                      })
                                    }
                                  />
                                  <span className="group-hover/label:text-slate-900 transition-colors font-medium">Fail 2m</span>
                                </label>
                                <label className="inline-flex items-center gap-1.5 cursor-pointer group/label">
                                  <input
                                    type="checkbox"
                                    className="h-3.5 w-3.5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500/20 transition-all cursor-pointer"
                                    checked={a3LowPerfRule.fail3}
                                    onChange={e =>
                                      setA3LowPerfRule({
                                        ...a3LowPerfRule,
                                        fail3: e.target.checked,
                                      })
                                    }
                                  />
                                  <span className="group-hover/label:text-slate-900 transition-colors font-medium">Fail 3m</span>
                                </label>
                              </div>
                              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1.5 text-[11px]">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500 font-medium">At-risk:</span>
                                  <b className="text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded shadow-sm">{metricA3Coverage.totalAtRisk}</b>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500 font-medium">With A3:</span>
                                  <b className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded shadow-sm ring-1 ring-emerald-100/50">{metricA3Coverage.withA3}</b>
                                </div>
                              </div>
                            </div>

                            <div className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-blue-200">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  A3 Duration
                                </p>
                                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors shadow-sm ring-1 ring-blue-100/50">
                                  <Clock3 className="w-4 h-4" />
                                </div>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="h-40 w-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={durationPieData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={38}
                                        outerRadius={58}
                                        paddingAngle={5}
                                        label={renderPieLabel}
                                        labelLine={false}
                                        stroke="none"
                                      >
                                        {durationPieData.map((entry, index) => (
                                          <Cell
                                            key={`duration-cell-${index}`}
                                            fill={entry.color}
                                            className="outline-none transition-opacity hover:opacity-80"
                                          />
                                        ))}
                                      </Pie>
                                      <Tooltip content={renderPieTooltip} />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                              <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                                <span className="text-[10px] font-medium text-slate-400 italic px-2 py-0.5 bg-slate-50 rounded-full border border-slate-100">Distribution by lifecycle stage</span>
                              </div>
                            </div>

                            <div className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-indigo-200">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  A3 Status
                                </p>
                                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors shadow-sm ring-1 ring-indigo-100/50">
                                  <Activity className="w-4 h-4" />
                                </div>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="h-40 w-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={statusPieData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={38}
                                        outerRadius={58}
                                        paddingAngle={5}
                                        label={renderPieLabel}
                                        labelLine={false}
                                        stroke="none"
                                      >
                                        {statusPieData.map((entry, index) => (
                                          <Cell
                                            key={`status-cell-${index}`}
                                            fill={entry.color}
                                            className="outline-none transition-opacity hover:opacity-80"
                                          />
                                        ))}
                                      </Pie>
                                      <Tooltip content={renderPieTooltip} />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                <span className="text-slate-500 font-medium">Active: <b className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded shadow-sm">{a3PortfolioStats.active}</b></span>
                                <span className="text-slate-500 font-medium">Done: <b className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded shadow-sm ring-1 ring-indigo-100/50">{a3PortfolioStats.completed}</b></span>
                              </div>
                            </div>

                            <div className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-amber-200">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  A3 Priority
                                </p>
                                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors shadow-sm ring-1 ring-amber-100/50">
                                  <AlertCircle className="w-4 h-4" />
                                </div>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="h-40 w-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={priorityPieData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={38}
                                        outerRadius={58}
                                        paddingAngle={5}
                                        label={renderPieLabel}
                                        labelLine={false}
                                        stroke="none"
                                      >
                                        {priorityPieData.map((entry, index) => (
                                          <Cell
                                            key={`priority-cell-${index}`}
                                            fill={entry.color}
                                            className="outline-none transition-opacity hover:opacity-80"
                                          />
                                        ))}
                                      </Pie>
                                      <Tooltip content={renderPieTooltip} />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-3 text-[10px]">
                                <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 font-bold shadow-sm ring-1 ring-red-100/50">H: {a3PortfolioStats.priorityCounts['High'] || 0}</span>
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold shadow-sm ring-1 ring-amber-100/50">M: {a3PortfolioStats.priorityCounts['Medium'] || 0}</span>
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold shadow-sm ring-1 ring-blue-100/50">L: {a3PortfolioStats.priorityCounts['Low'] || 0}</span>
                              </div>
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
                                <div className="flex items-center gap-3">
                                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">View by</span>
                                  <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/50 p-1 shadow-inner">
                                    <button
                                      type="button"
                                      className={clsx(
                                        'px-3 py-1 text-[11px] font-bold rounded-md transition-all duration-200',
                                        a3TimelineView === 'week'
                                          ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200'
                                          : 'text-slate-500 hover:text-slate-700 hover:bg-white/50',
                                      )}
                                      onClick={() => setA3TimelineView('week')}
                                    >
                                      Week
                                    </button>
                                    <button
                                      type="button"
                                      className={clsx(
                                        'px-3 py-1 text-[11px] font-bold rounded-md transition-all duration-200',
                                        a3TimelineView === 'month'
                                          ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200'
                                          : 'text-slate-500 hover:text-slate-700 hover:bg-white/50',
                                      )}
                                      onClick={() => setA3TimelineView('month')}
                                    >
                                      Month
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3 border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
                            <div className="flex flex-col lg:flex-row">
                              <div
                                className="relative w-full lg:flex-shrink-0 border-b lg:border-b-0 lg:border-r border-slate-100 bg-slate-50/50 backdrop-blur-sm"
                                style={{ width: a3TimelineSidebarWidth }}
                              >
                                <div className="h-[60px] border-b border-slate-200 bg-slate-100/50 flex items-center justify-between px-4 font-bold text-[11px] text-slate-500 uppercase tracking-wider">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1 rounded bg-white shadow-sm border border-slate-200">
                                      <FileText className="w-3 h-3 text-slate-400" />
                                    </div>
                                    <p className="truncate">A3 Case List</p>
                                  </div>
                                  <span className="text-[10px] bg-slate-200/50 px-2 py-0.5 rounded-full text-slate-600 font-medium">
                                    {a3Timeline.rows.reduce(
                                      (acc, row) => acc + row.items.length,
                                      0,
                                    )}{' '}
                                    cases
                                  </span>
                                </div>
                                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                                  {a3Timeline.rows.length === 0 && (
                                    <p className="px-3 py-8 text-center text-[11px] text-slate-400 italic">
                                      No dated cases available.
                                    </p>
                                  )}
                                  {a3Timeline.rows.map(row => {
                                    const isExpanded =
                                      a3TimelineExpandedGroups[row.groupName] !== false;

                                    return (
                                      <div key={row.groupName} className="border-b border-slate-100 last:border-b-0">
                                        <button
                                          type="button"
                                          className="h-[36px] w-full flex items-center justify-between px-4 bg-slate-50 hover:bg-slate-100 transition-colors text-[11px] text-slate-700 group/row"
                                          onClick={() => {
                                            setA3TimelineExpandedGroups(prev => ({
                                              ...prev,
                                              [row.groupName]: !(prev[row.groupName] !== false),
                                            }));
                                          }}
                                        >
                                          <div className="flex items-center gap-2 min-w-0">
                                            <div className={clsx(
                                              "transition-transform duration-200",
                                              isExpanded ? "rotate-0" : "-rotate-90"
                                            )}>
                                              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover/row:text-slate-600" />
                                            </div>
                                            <span className="truncate font-bold text-slate-600 uppercase tracking-wide">
                                              {row.groupName}
                                            </span>
                                          </div>
                                          <span className="ml-2 text-[10px] text-slate-400 font-medium">
                                            {row.items.length}
                                          </span>
                                        </button>
                                        {isExpanded &&
                                          row.items.map(item => (
                                            <button
                                              key={item.id}
                                              type="button"
                                              className="h-[52px] w-full flex items-center justify-between px-4 text-[11px] bg-white hover:bg-blue-50/50 transition-all border-b border-slate-50 last:border-b-0 group/item"
                                              onClick={() => {
                                                navigate(
                                                  `/a3-analysis/${item.id}/problem-statement`,
                                                );
                                              }}
                                            >
                                              <div className="flex flex-col items-start min-w-0 pr-2">
                                                <span className="text-slate-900 font-medium text-[11px] leading-snug truncate w-full text-left group-hover/item:text-blue-700">
                                                  {item.title}
                                                </span>
                                                <span className="mt-0.5 text-[10px] text-slate-400 truncate w-full text-left flex items-center gap-1">
                                                  <Calendar className="w-2.5 h-2.5" />
                                                  {item.startDate && item.endDate
                                                    ? `${item.startDate} → ${item.endDate}`
                                                    : item.startDate || item.endDate || 'No dates'}
                                                </span>
                                              </div>
                                              <div
                                                className={clsx(
                                                  'ml-2 flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-tight transition-colors',
                                                  item.status === 'Completed'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 group-hover/item:bg-emerald-100'
                                                    : item.status === 'In Progress'
                                                    ? 'bg-blue-50 text-blue-700 border-blue-100 group-hover/item:bg-blue-100'
                                                    : 'bg-slate-50 text-slate-500 border-slate-100 group-hover/item:bg-slate-100',
                                                )}
                                              >
                                                {item.status || 'Draft'}
                                              </div>
                                            </button>
                                          ))}
                                      </div>
                                    );
                                  })}
                                </div>
                                <div
                                  className="hidden lg:block absolute top-0 right-0 h-full w-1.5 cursor-col-resize bg-transparent hover:bg-slate-200 transition-colors"
                                  onMouseDown={event => {
                                    event.preventDefault();
                                    setIsResizingA3TimelineSidebar(true);
                                    setA3TimelineSidebarDragStartX(event.clientX);
                                    setA3TimelineSidebarStartWidth(a3TimelineSidebarWidth);
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0 bg-white">
                                <div className="flex h-[60px] border-b border-slate-200 bg-slate-50/50">
                                  {a3Timeline.periods.map(period => (
                                    <div
                                      key={period.key}
                                      className="flex-1 flex-shrink-0 border-r border-slate-100 last:border-r-0 flex flex-col items-center justify-center overflow-hidden px-1"
                                      title={period.label}
                                    >
                                      <span className="font-bold text-slate-500 whitespace-nowrap text-[9px] uppercase tracking-tighter">
                                        {period.label}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto custom-scrollbar">
                                  {a3Timeline.rows.map(row => {
                                    const isExpanded =
                                      a3TimelineExpandedGroups[row.groupName] !== false;

                                    return (
                                      <div key={row.groupName}>
                                        <div className="h-[36px] border-b border-slate-100 bg-slate-50/30" />
                                        {isExpanded && row.items.length === 0 && (
                                          <div className="h-[52px] border-b border-slate-100 flex items-center px-3 text-[10px] text-slate-300 italic">
                                            -
                                          </div>
                                        )}
                                        {isExpanded &&
                                          row.items.map(item => (
                                            <div
                                              key={item.id}
                                              className="h-[52px] border-b border-slate-100 relative group/track"
                                            >
                                              <div className="absolute inset-y-2 left-0 right-0 pointer-events-none">
                                                <div className="flex h-full gap-px opacity-[0.03]">
                                                  {a3Timeline.periods.map(period => (
                                                    <div
                                                      key={period.key}
                                                      className="flex-1 border-l border-slate-900 last:border-r"
                                                    />
                                                  ))}
                                                </div>
                                              </div>
                                              <div className="relative h-full">
                                                <button
                                                  type="button"
                                                  className={clsx(
                                                    'absolute top-3 h-6 rounded-lg shadow-sm border flex items-center justify-start px-2.5 text-[10px] font-bold text-white overflow-hidden cursor-pointer z-10 transition-all hover:scale-[1.02] active:scale-[0.98] text-left uppercase tracking-tight',
                                                    item.status === 'Completed'
                                                      ? 'bg-emerald-500 border-emerald-600 shadow-emerald-200/50 hover:bg-emerald-600'
                                                      : item.status === 'In Progress'
                                                      ? 'bg-blue-500 border-blue-600 shadow-blue-200/50 hover:bg-blue-600'
                                                      : 'bg-slate-400 border-slate-500 shadow-slate-200/50 hover:bg-slate-500',
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
                                                      <span className="truncate max-w-full">
                                                        {item.title}
                                                      </span>
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
                                  'flex flex-col rounded-xl border text-xs shadow-sm overflow-hidden h-full max-h-[600px] transition-all duration-300 hover:shadow-md',
                                  column.headerClass,
                                )}
                              >
                                <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200/50 backdrop-blur-sm bg-white/40">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={clsx(
                                        'h-2.5 w-2.5 rounded-full shadow-sm ring-2 ring-white',
                                        column.dotClass,
                                      )}
                                    />
                                    <span className="font-bold text-slate-800 tracking-tight">
                                      {column.label}
                                    </span>
                                  </div>
                                  <span
                                    className={clsx(
                                      'px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-sm',
                                      column.badgeClass,
                                    )}
                                  >
                                    {column.items.length}
                                  </span>
                                </div>
                                <div className="flex-1 px-3 py-3 space-y-2.5 overflow-y-auto custom-scrollbar">
                                  {column.items.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-center opacity-50">
                                      <div className="w-10 h-10 rounded-xl bg-white/50 border border-white flex items-center justify-center mb-2 shadow-sm">
                                        <LayoutGrid className="w-5 h-5 text-slate-400" />
                                      </div>
                                      <p className="text-[11px] font-medium text-slate-500">
                                        No cases
                                      </p>
                                    </div>
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
                                          'w-full text-left rounded-xl border px-3.5 py-3 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group bg-white border-slate-200/60 hover:border-brand-300',
                                        )}
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-bold text-slate-800 leading-snug line-clamp-2 mb-2 group-hover:text-brand-700 transition-colors">
                                              {item.a3.title}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-2">
                                              <span className={clsx(
                                                "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1 ring-inset ring-gray-500/10",
                                                item.labelColorClass
                                              )}>
                                                {item.displayLabel}
                                              </span>
                                              {item.a3.startDate && (
                                                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                  <Calendar className="w-3 h-3" />
                                                  {new Date(item.a3.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <span
                                            className={clsx(
                                              'shrink-0 inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                                              item.priorityClass,
                                            )}
                                          >
                                            {item.priority}
                                          </span>
                                        </div>
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

      {isAdminPanelOpen && (
        <div className="fixed inset-0 z-[120] bg-gray-900/80 flex flex-col">
          <div className="flex-1 bg-white flex flex-col w-full h-full rounded-none shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-700 text-white text-sm font-semibold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Admin Center
                  </h2>
                  <p className="text-xs text-gray-500">
                    Manage all registered users.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAdminPanelOpen(false)}
                className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 pt-3 border-b border-gray-200 bg-white">
              <div className="flex space-x-2 text-sm">
                <div className="inline-flex items-center gap-1 border-b-2 px-2 py-1 rounded-t-md border-slate-700 text-slate-900 bg-slate-50">
                  <UserIcon className="w-4 h-4" />
                  <span>User Mgmt</span>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-white">
              <div className="h-full flex flex-col">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">All registered accounts</h3>
                    <p className="text-xs text-gray-500">
                      Loaded from the login service, with local last-login where available.
                    </p>
                  </div>
                  <button
                    onClick={loadAdminUsers}
                    className="text-xs px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Refresh
                  </button>
                </div>
                <div className="flex-1 overflow-auto px-6 py-4">
                  {adminUsersError && (
                    <p className="mb-2 text-xs text-red-500">
                      {adminUsersError}
                    </p>
                  )}
                  {!isLoadingAdminUsers && adminAccounts.length > 0 && (
                    <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <div>
                          <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                            Total users
                          </div>
                          <div className="mt-1 text-lg font-semibold text-gray-900">
                            {adminUserStats.total}
                          </div>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                          <Users className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                        <div>
                          <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                            Active last 7 days
                          </div>
                          <div className="mt-1 text-lg font-semibold text-gray-900">
                            {adminUserStats.active7}
                          </div>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                          <Activity className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2">
                        <div>
                          <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                            Active last 30 days
                          </div>
                          <div className="mt-1 text-lg font-semibold text-gray-900">
                            {adminUserStats.active30}
                          </div>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
                          <Clock3 className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
                        <div>
                          <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                            Active last 90 days
                          </div>
                          <div className="mt-1 text-lg font-semibold text-gray-900">
                            {adminUserStats.active90}
                          </div>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  )}
                  {isLoadingAdminUsers ? (
                    <p className="text-sm text-gray-500">Loading users...</p>
                  ) : adminAccounts.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No accounts have been recorded yet.
                    </p>
                  ) : (
                    <table className="min-w-full border border-gray-200 text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600 border-b border-gray-200">
                            <button
                              type="button"
                              onClick={() => handleAdminSort('username')}
                              className="inline-flex items-center gap-1"
                            >
                              <span>Username</span>
                              {adminSortKey === 'username' && (
                                <span>{adminSortDirection === 'asc' ? '▲' : '▼'}</span>
                              )}
                            </button>
                          </th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600 border-b border-gray-200">
                            <button
                              type="button"
                              onClick={() => handleAdminSort('email')}
                              className="inline-flex items-center gap-1"
                            >
                              <span>Email</span>
                              {adminSortKey === 'email' && (
                                <span>{adminSortDirection === 'asc' ? '▲' : '▼'}</span>
                              )}
                            </button>
                          </th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600 border-b border-gray-200">
                            <button
                              type="button"
                              onClick={() => handleAdminSort('role')}
                              className="inline-flex items-center gap-1"
                            >
                              <span>Role</span>
                              {adminSortKey === 'role' && (
                                <span>{adminSortDirection === 'asc' ? '▲' : '▼'}</span>
                              )}
                            </button>
                          </th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600 border-b border-gray-200">
                            <button
                              type="button"
                              onClick={() => handleAdminSort('country')}
                              className="inline-flex items-center gap-1"
                            >
                              <span>Country</span>
                              {adminSortKey === 'country' && (
                                <span>{adminSortDirection === 'asc' ? '▲' : '▼'}</span>
                              )}
                            </button>
                          </th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600 border-b border-gray-200">
                            <button
                              type="button"
                              onClick={() => handleAdminSort('plant')}
                              className="inline-flex items-center gap-1"
                            >
                              <span>Plant/Office</span>
                              {adminSortKey === 'plant' && (
                                <span>{adminSortDirection === 'asc' ? '▲' : '▼'}</span>
                              )}
                            </button>
                          </th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600 border-b border-gray-200">
                            <button
                              type="button"
                              onClick={() => handleAdminSort('team')}
                              className="inline-flex items-center gap-1"
                            >
                              <span>Team</span>
                              {adminSortKey === 'team' && (
                                <span>{adminSortDirection === 'asc' ? '▲' : '▼'}</span>
                              )}
                            </button>
                          </th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600 border-b border-gray-200">
                            <button
                              type="button"
                              onClick={() => handleAdminSort('visibility')}
                              className="inline-flex items-center gap-1"
                            >
                              <span>Visibility</span>
                              {adminSortKey === 'visibility' && (
                                <span>{adminSortDirection === 'asc' ? '▲' : '▼'}</span>
                              )}
                            </button>
                          </th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600 border-b border-gray-200 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleAdminSort('createdAt')}
                              className="inline-flex items-center gap-1"
                            >
                              <span>Created At</span>
                              {adminSortKey === 'createdAt' && (
                                <span>{adminSortDirection === 'asc' ? '▲' : '▼'}</span>
                              )}
                            </button>
                          </th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600 border-b border-gray-200 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleAdminSort('lastLoginAt')}
                              className="inline-flex items-center gap-1"
                            >
                              <span>Last Login</span>
                              {adminSortKey === 'lastLoginAt' && (
                                <span>{adminSortDirection === 'asc' ? '▲' : '▼'}</span>
                              )}
                            </button>
                          </th>
                          {isSuperAdmin && (
                            <th className="px-3 py-2 text-right font-semibold text-gray-600 border-b border-gray-200 whitespace-nowrap">
                              Edit
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sortedAdminAccounts.map(account => (
                          <tr key={account.username}>
                            <td className="px-3 py-2 text-gray-900 font-medium">
                              {account.username}
                            </td>
                            <td className="px-3 py-2 text-gray-700">
                              {account.email || '—'}
                            </td>
                            <td className="px-3 py-2 text-gray-700">
                              {account.role || '—'}
                            </td>
                            <td className="px-3 py-2 text-gray-700">
                              {account.country || '—'}
                            </td>
                            <td className="px-3 py-2 text-gray-700">
                              {account.plant || '—'}
                            </td>
                            <td className="px-3 py-2 text-gray-700">
                              {account.team || '—'}
                            </td>
                            <td className="px-3 py-2 text-gray-700">
                              {account.isPublicProfile === false ? 'Private' : 'Public'}
                            </td>
                            <td className="px-3 py-2 text-gray-700">
                              {account.createdAt
                                ? new Date(account.createdAt).toLocaleString()
                                : '—'}
                            </td>
                            <td className="px-3 py-2 text-gray-700">
                              {account.lastLoginAt
                                ? new Date(account.lastLoginAt).toLocaleString()
                                : '—'}
                            </td>
                            {isSuperAdmin && (
                              <td className="px-3 py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditAdminAccount(account)}
                                  className="px-2 py-1 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  Edit
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdminPanelOpen && editingAdminAccount && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              if (!isSavingAdminAccount) {
                setEditingAdminAccount(null);
              }
            }}
          />
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Edit user account
                </h3>
                <p className="text-xs text-gray-500">
                  Update role and profile fields for {editingAdminAccount.username}.
                </p>
              </div>
              <button
                onClick={() => {
                  if (!isSavingAdminAccount) {
                    setEditingAdminAccount(null);
                  }
                }}
                className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={editAdminForm.role}
                  onChange={e => handleChangeEditAdminField('role', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select role</option>
                  <option value="Super admin">Super admin</option>
                  <option value="admin">admin</option>
                  <option value="Common user">Common user</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Country/Region
                  </label>
                  <select
                    value={editAdminForm.country}
                    onChange={e => handleChangeEditAdminField('country', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select Region</option>
                    <option value="China">China</option>
                    <option value="US">US</option>
                    <option value="EMEA">EMEA</option>
                    <option value="APAC">APAC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Plant/Office
                  </label>
                  <select
                    value={editAdminForm.plant}
                    onChange={e => handleChangeEditAdminField('plant', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select Plant/Office</option>
                    <option value="BJ">BJ</option>
                    <option value="SH">SH</option>
                    <option value="TW">TW</option>
                    <option value="SZFTZ">SZFTZ</option>
                    <option value="SZBAN">SZBAN</option>
                    <option value="EM1">EM1</option>
                    <option value="EM5">EM5</option>
                    <option value="LOV">LOV</option>
                    <option value="PU3">PU3</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Team
                </label>
                <select
                  value={editAdminForm.team}
                  onChange={e => handleChangeEditAdminField('team', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                  <option value="">Select Functional Team</option>
                  <option value="Commercial">Commercial</option>
                  <option value="SC">SC</option>
                  <option value="Technical">Technical</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-700">Profile visibility</span>
                <select
                  value={editAdminForm.isPublicProfile ? 'public' : 'private'}
                  onChange={e =>
                    handleChangeEditAdminField(
                      'isPublicProfile',
                      e.target.value === 'public',
                    )
                  }
                  className="border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-700"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end gap-2 bg-gray-50">
              <button
                type="button"
                onClick={() => {
                  if (!isSavingAdminAccount) {
                    setEditingAdminAccount(null);
                  }
                }}
                className="px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                disabled={isSavingAdminAccount}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAdminAccount}
                className="px-3 py-1.5 text-xs rounded-md bg-slate-700 text-white hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isSavingAdminAccount}
              >
                {isSavingAdminAccount ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {isLogoPreviewOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60"
          onClick={() => setIsLogoPreviewOpen(false)}
        >
          <div
            className="relative max-w-[95vw] max-h-[95vh]"
            onClick={event => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsLogoPreviewOpen(false)}
              className="absolute -top-3 -right-3 rounded-full bg-white/90 text-gray-700 shadow-md hover:bg-white p-1"
              aria-label="Close logo preview"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="A3 Bowler logo full size"
              className="max-w-[95vw] max-h-[85vh] w-auto h-auto rounded-md bg-white object-contain"
            />
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        <AccountSettingsModal
          isOpen={isAccountSettingsOpen}
          onClose={() => setIsAccountSettingsOpen(false)}
          mode="account"
        />
      </Suspense>

      <Suspense fallback={null}>
        <AccountSettingsModal
          isOpen={isEmailSettingsOpen}
          onClose={() => setIsEmailSettingsOpen(false)}
          mode="email"
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

      {isDataChartingOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[95] flex items-stretch justify-center overflow-hidden">
              <div
                className="absolute inset-0 bg-gray-900/60"
                onClick={() => setIsDataChartingOpen(false)}
              />
              <div className="relative z-[96] flex h-full w-full flex-col bg-white shadow-2xl border-t border-gray-200 rounded-none overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-6 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <span className="text-base">📊</span>
                        <span>Data Analysis</span>
                      </h2>
                      <p className="text-xs text-gray-500">
                        Loading the ECharts charting workspace, please wait...
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDataChartingOpen(false)}
                    className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-1 items-center justify-center bg-slate-50/60">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative flex h-12 w-12 items-center justify-center">
                      <div className="h-10 w-10 rounded-full border-2 border-emerald-500/40 border-t-emerald-500 animate-spin" />
                      <span className="absolute text-xs font-semibold text-emerald-700">
                        E
                      </span>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-medium text-gray-900">
                        ECharts loading indicator
                      </p>
                      <p className="text-xs text-gray-500">
                        Modal is ready. You can close it at any time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        >
          <DataChartingModal
            isOpen={isDataChartingOpen}
            onClose={() => setIsDataChartingOpen(false)}
          />
        </Suspense>
      )}

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

      {isQuickDemoOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-8">
          <div
            className="absolute inset-0 bg-gray-900/60"
            onClick={() => {
              if (!isGeneratingQuickDemo) {
                setIsQuickDemoOpen(false);
                setQuickDemoMetricName('');
              }
            }}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-indigo-600 text-white flex items-center justify-center">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                  Quick sample metric with AI
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isGeneratingQuickDemo) {
                    setIsQuickDemoOpen(false);
                    setQuickDemoMetricName('');
                  }
                }}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-4 sm:px-6 sm:py-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold tracking-wide text-gray-500 uppercase mb-1">
                  Metric you would like to create
                </label>
                <input
                  type="text"
                  value={quickDemoMetricName}
                  onChange={e => setQuickDemoMetricName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder='e.g. "Customer complaint rate", "On-time delivery", "Scrap rate"'
                  disabled={isGeneratingQuickDemo}
                />
              </div>
            </div>
            <div className="px-4 py-3 sm:px-6 sm:py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!isGeneratingQuickDemo) {
                    setIsQuickDemoOpen(false);
                    setQuickDemoMetricName('');
                  }
                }}
                className="px-3 py-1.5 text-xs sm:text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                disabled={isGeneratingQuickDemo}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateQuickDemo}
                className="px-3 py-1.5 text-xs sm:text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isGeneratingQuickDemo}
              >
                {isGeneratingQuickDemo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating demo metric...</span>
                  </>
                ) : (
                  <>
                    <FlaskConical className="w-4 h-4" />
                    <span>Create sample metric</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAllA3ModalOpen && (
        <div className="fixed inset-0 z-[140] bg-slate-900/40 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
          <div className="flex-1 bg-white flex flex-col w-full h-full rounded-none shadow-2xl overflow-hidden print-summary-root">
            <div className="flex items-center justify-between px-6 py-4 border-b border-indigo-500/20 bg-gradient-to-r from-brand-600 to-accent-600">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white shadow-sm ring-1 ring-white/20">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-base font-bold text-white tracking-tight">A3 Portfolio</h2>
                  <p className="text-xs text-indigo-100 font-medium">
                    Review and filter A3 problem-solving cases across your portfolio.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAllA3ModalOpen(false);
                  setSelectedGlobalA3(null);
                  setAllA3Cases([]);
                  setAllA3Error(null);
                }}
                className="rounded-full p-2 text-indigo-100 hover:bg-white/20 hover:text-white transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
              {isA3PortfolioSidebarOpen && (
                <div className={clsx(
                  "border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col flex-1 min-h-0 transition-all duration-300",
                  isAllA3KanbanView ? "w-full" : "w-full lg:w-1/2"
                )}>
                <div className="px-5 py-4 border-b border-slate-200/60 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20 shadow-sm">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-brand-50 text-brand-600">
                          <LayoutGrid className="w-3.5 h-3.5" />
                        </div>
                        <p className="text-xs font-bold tracking-wide text-slate-800 uppercase">
                          {isAdminOrSuperAdmin || !userPlant
                            ? 'A3 Portfolio'
                            : `A3 Portfolio (${userPlant})`}
                        </p>
                      </div>
                      <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 border border-slate-200">
                        {isAllA3Loading ? '...' : visibleAllA3Cases.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative group">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-hover:text-brand-500 transition-colors" />
                        <input
                          type="text"
                          placeholder="Search cases..."
                          value={a3SearchTerm}
                          onChange={(e) => setA3SearchTerm(e.target.value)}
                          className="pl-8 pr-7 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 hover:border-brand-200 hover:bg-white transition-all w-32 sm:w-48 placeholder:text-slate-400"
                        />
                        {a3SearchTerm && (
                          <button
                            onClick={() => setA3SearchTerm('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <label className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-600 cursor-pointer select-none group bg-slate-50 px-2 py-1 rounded-md border border-slate-200 hover:border-brand-200 hover:bg-brand-50/50 transition-all">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            className="peer h-3.5 w-3.5 text-brand-600 border-slate-300 rounded focus:ring-brand-500 transition-all cursor-pointer"
                            checked={a3BestPracticeOnly}
                            onChange={e => setA3BestPracticeOnly(e.target.checked)}
                          />
                        </div>
                        <span className="group-hover:text-brand-700 transition-colors flex items-center gap-1">
                          <Lightbulb className={clsx("w-3 h-3", a3BestPracticeOnly ? "fill-amber-400 text-amber-500" : "text-slate-400")} />
                          Best practice only
                        </span>
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <button
                      type="button"
                      onClick={() => setIsAllA3KanbanView(!isAllA3KanbanView)}
                      className={clsx(
                        "inline-flex items-center justify-center w-8 h-8 rounded-xl border transition-all shadow-sm",
                        isAllA3KanbanView
                          ? "bg-brand-50 text-brand-600 border-brand-200 ring-1 ring-brand-500/20"
                          : "border-slate-200 text-slate-400 hover:text-brand-600 hover:border-brand-200 hover:bg-brand-50"
                      )}
                      title={isAllA3KanbanView ? "Switch to list view" : "Switch to Kanban board"}
                    >
                      {isAllA3KanbanView ? <List className="w-4 h-4" /> : <Kanban className="w-4 h-4" />}
                    </button>
                    {!isAllA3KanbanView && (
                      <button
                        type="button"
                        onClick={() => setIsA3PortfolioSidebarOpen(false)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-xl border border-slate-200 text-slate-400 hover:text-brand-600 hover:border-brand-200 hover:bg-brand-50 transition-all shadow-sm"
                        title="Collapse portfolio list"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-auto bg-gray-50">
                  {allA3Error && (
                    <div className="m-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                      {allA3Error}
                    </div>
                  )}
                  {isAllA3Loading ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                      <div className="p-3 bg-brand-50 rounded-full mb-3">
                        <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
                      </div>
                      <p className="text-sm font-medium text-slate-900">Syncing Portfolio</p>
                      <p className="text-xs text-slate-500 mt-1">Fetching the latest A3 cases...</p>
                    </div>
                  ) : visibleAllA3Cases.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                      <div className="p-4 bg-slate-50 rounded-full border border-slate-100 mb-3 shadow-sm">
                        <Layers className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">No Cases Found</h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-[200px] leading-relaxed">
                        {a3SearchTerm ? "No cases match your search criteria." : "There are no public A3 cases available in the portfolio yet."}
                      </p>
                      {a3SearchTerm && (
                        <button 
                          onClick={() => setA3SearchTerm('')}
                          className="mt-3 text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  ) : isAllA3KanbanView ? (
                    <div className="h-full overflow-x-auto overflow-y-hidden p-6">
                      <div className="flex h-full gap-6 min-w-max">
                        {allA3KanbanColumns.map((column, colIndex) => (
                          <div 
                            key={column.key} 
                            className="w-80 flex-shrink-0 flex flex-col h-full bg-slate-50/50 rounded-2xl border border-slate-200/60 shadow-sm backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500"
                            style={{ animationDelay: `${colIndex * 100}ms` }}
                          >
                            <div className={clsx("px-4 py-3 border-b flex items-center justify-between rounded-t-2xl transition-colors duration-300", column.headerClass)}>
                              <div className="flex items-center gap-2">
                                <div className={clsx("w-2 h-2 rounded-full ring-2 ring-white/50", column.dotClass)} />
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{column.label}</span>
                              </div>
                              <span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm", column.badgeClass)}>
                                {column.items.length}
                              </span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                              {column.items.map((item, itemIndex) => (
                                <button
                                  key={`${item.a3.id}`}
                                  onClick={() => {
                                    setSelectedGlobalA3(item.a3);
                                    setIsAllA3KanbanView(false);
                                  }}
                                  className="w-full text-left bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-brand-300 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden animate-in fade-in zoom-in-95"
                                  style={{ animationDelay: `${(colIndex * 50) + (itemIndex * 30)}ms` }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                  
                                  <div className="flex items-start justify-between mb-2.5 relative z-10">
                                    <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-md border shadow-sm", item.priorityClass)}>
                                      {item.priority}
                                    </span>
                                    {item.a3.endDate && (
                                      <div className="flex items-center gap-1">
                                        <Clock3 className="w-3 h-3 text-slate-400" />
                                        <span className={clsx("text-[10px] font-medium", new Date(item.a3.endDate) < new Date() ? "text-rose-600 font-bold" : "text-slate-500")}>
                                          {new Date(item.a3.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <h4 className="text-sm font-bold text-slate-800 mb-1.5 leading-snug group-hover:text-brand-600 transition-colors line-clamp-2 relative z-10">
                                    {item.a3.title || 'Untitled A3'}
                                  </h4>
                                  
                                  <p className="text-xs text-slate-500 line-clamp-2 mb-3.5 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity relative z-10">
                                    {item.a3.problemStatement || item.a3.description || 'No details provided.'}
                                  </p>
                                  
                                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 relative z-10">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-white shadow-sm ring-1 ring-slate-100">
                                        {(item.a3.owner || 'U').charAt(0).toUpperCase()}
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-700 font-semibold truncate max-w-[80px] leading-none mb-0.5">
                                          {item.a3.owner || 'Unassigned'}
                                        </span>
                                        <span className="text-[9px] text-slate-400 leading-none">Owner</span>
                                      </div>
                                    </div>
                                    <span className={clsx("text-[9px] font-bold px-2 py-0.5 rounded-full border shadow-sm tracking-tight", item.labelColorClass)}>
                                      {item.displayLabel}
                                    </span>
                                  </div>
                                  
                                  {item.a3.isBestPractice && (
                                    <div className="absolute -top-1 -right-1 p-1 z-20">
                                      <div className="bg-amber-100 text-amber-600 rounded-bl-xl rounded-tr-xl p-1.5 shadow-sm border border-amber-200/50 group-hover:rotate-12 transition-transform duration-300">
                                        <Lightbulb className="w-3.5 h-3.5 fill-amber-500" />
                                      </div>
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 space-y-3">
                      <div className="hidden md:grid grid-cols-12 gap-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-2.5 bg-slate-50/80 backdrop-blur-sm rounded-lg border border-slate-100 mb-2 sticky top-0 z-10 shadow-sm">
                        <span className="col-span-5">A3 Case Details</span>
                        <span className="col-span-2">Owner</span>
                        <span className="col-span-2">Plant</span>
                        <span className="col-span-1">Due</span>
                        <span className="col-span-2 text-right">Status</span>
                      </div>
                      <div className="space-y-3 pb-4">
                        {visibleAllA3Cases.map(a3 => {
                          const isSelected = selectedGlobalA3 && selectedGlobalA3.id === a3.id;
                          const status = (a3.status || 'Not Started').trim();
                          const statusColor =
                            status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10 shadow-emerald-100'
                              : status === 'In Progress'
                              ? 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/10 shadow-blue-100'
                              : 'bg-slate-50 text-slate-600 border-slate-200 ring-slate-500/10';
                          const primaryMetricId = (a3.linkedMetricIds || [])[0];
                          const relatedMetricLabel =
                            primaryMetricId && metricLabelById.get(primaryMetricId);
                          return (
                            <button
                              key={`${a3.userId || a3.userAccountId || 'user'}:${a3.id}`}
                              type="button"
                              onClick={() => setSelectedGlobalA3(a3)}
                              className={clsx(
                                'w-full text-left rounded-xl border p-4 transition-all duration-300 group relative overflow-hidden',
                                isSelected 
                                  ? 'border-brand-500 bg-brand-50/30 shadow-md ring-1 ring-brand-500/20' 
                                  : 'border-slate-200 bg-white hover:border-brand-300 hover:shadow-lg hover:shadow-brand-500/5 hover:-translate-y-0.5'
                              )}
                            >
                              <div className="flex flex-col md:grid md:grid-cols-12 md:gap-4 md:items-center relative z-10">
                                <div className="md:col-span-5 pr-2">
                                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                    <span className="text-[10px] inline-flex items-center rounded-md border px-1.5 py-0.5 font-bold bg-slate-100 text-slate-600 border-slate-200 shadow-sm">
                                      {a3.group || 'Ungrouped'}
                                    </span>
                                    {a3.isBestPractice && (
                                      <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200 shadow-sm ring-1 ring-amber-500/10">
                                        <Lightbulb className="w-3 h-3 mr-1 fill-amber-400 text-amber-500" />
                                        Best practice
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm font-bold text-slate-800 group-hover:text-brand-700 transition-colors line-clamp-1">
                                    {a3.title || 'Untitled A3'}
                                  </div>
                                  {relatedMetricLabel && (
                                    <div className="mt-1 text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                                      <div className="p-0.5 rounded bg-slate-100 text-slate-500">
                                        <TrendingUp className="w-3 h-3" />
                                      </div>
                                      {relatedMetricLabel}
                                    </div>
                                  )}
                                  <div className="mt-1.5 text-[11px] text-slate-500 line-clamp-2 leading-relaxed opacity-80">
                                    {a3.problemStatement || a3.description || 'No problem statement recorded.'}
                                  </div>
                                </div>
                                <div className="mt-3 md:mt-0 md:col-span-2 flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-white shadow-sm ring-1 ring-slate-200">
                                    {(a3.owner || 'U').charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-semibold text-slate-700 truncate">{a3.owner || 'Unassigned'}</span>
                                    <span className="text-[10px] text-slate-400">Owner</span>
                                  </div>
                                </div>
                                <div className="mt-1 md:mt-0 md:col-span-2 text-xs font-medium text-slate-600 flex items-center gap-1.5">
                                  <div className="p-1 rounded bg-slate-50 text-slate-400">
                                    <Building2 className="w-3.5 h-3.5" />
                                  </div>
                                  {a3.plant || '—'}
                                </div>
                                <div className="mt-1 md:mt-0 md:col-span-1 text-xs font-medium text-slate-600">
                                  {a3.endDate ? (
                                    <span className={clsx(
                                      "px-1.5 py-0.5 rounded-md border",
                                      new Date(a3.endDate) < new Date() && status !== 'Completed'
                                        ? "bg-red-50 text-red-700 border-red-200"
                                        : "bg-slate-50 text-slate-600 border-slate-200"
                                    )}>
                                      {new Date(a3.endDate).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                                    </span>
                                  ) : '—'}
                                </div>
                                <div className="mt-2 md:mt-0 md:col-span-2 text-right">
                                  <span
                                    className={clsx(
                                      'inline-flex items-center rounded-lg border px-2.5 py-1 text-[10px] font-bold shadow-sm ring-1 transition-all',
                                      statusColor,
                                    )}
                                  >
                                    {status === 'Completed' && <Check className="w-3 h-3 mr-1" />}
                                    {status === 'In Progress' && <Clock3 className="w-3 h-3 mr-1" />}
                                    {status || 'Not Started'}
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              )}
              <div
                className={clsx(
                  'w-full bg-gray-100 flex flex-col flex-1 min-h-0',
                  isA3PortfolioSidebarOpen ? 'lg:w-1/2' : 'lg:w-full',
                )}
              >
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-20">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1 rounded bg-brand-50 text-brand-600">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-xs font-bold tracking-wide text-slate-700 uppercase">
                        A3 Report Preview
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium ml-6">
                      Executive summary view
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdminOrSuperAdmin && selectedGlobalA3 && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!selectedGlobalA3 || !isAdminOrSuperAdmin) {
                            return;
                          }
                          const ownerId = selectedGlobalA3.userAccountId || selectedGlobalA3.userId;
                          if (!ownerId) {
                            toast.error('Unable to identify owner for this A3 case.');
                            return;
                          }
                          const nextValue = !selectedGlobalA3.isBestPractice;
                          try {
                            setIsUpdatingBestPractice(true);
                            await dataService.updateA3BestPractice(ownerId, selectedGlobalA3.id, nextValue);
                            setAllA3Cases(prev =>
                              prev.map(c =>
                                c.id === selectedGlobalA3.id &&
                                (c.userId === selectedGlobalA3.userId ||
                                  c.userAccountId === selectedGlobalA3.userAccountId)
                                  ? { ...c, isBestPractice: nextValue }
                                  : c,
                              ),
                            );
                            setSelectedGlobalA3(prev =>
                              prev ? { ...prev, isBestPractice: nextValue } : prev,
                            );
                            toast.success(
                              nextValue
                                ? 'Marked as best practice.'
                                : 'Removed best practice flag.',
                            );
                          } catch (error) {
                            console.error('Failed to update best practice flag', error);
                            toast.error('Failed to update best practice flag. Please try again.');
                          } finally {
                            setIsUpdatingBestPractice(false);
                          }
                        }}
                        className={clsx(
                          'inline-flex items-center rounded-xl border px-3 py-1.5 text-[11px] font-bold transition-all shadow-sm',
                          selectedGlobalA3.isBestPractice
                            ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 ring-1 ring-amber-500/20'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                        )}
                        disabled={isUpdatingBestPractice}
                      >
                        <Lightbulb className="w-3.5 h-3.5 mr-1.5" />
                        <span>
                          {selectedGlobalA3.isBestPractice
                            ? 'Best practice'
                            : 'Mark best practice'}
                        </span>
                      </button>
                    )}
                    {!isA3PortfolioSidebarOpen && (
                      <button
                        type="button"
                        onClick={() => setIsA3PortfolioSidebarOpen(true)}
                        className="ml-2 inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-all shadow-sm"
                        title="Show portfolio list"
                      >
                        <ChevronRight className="w-3.5 h-3.5 mr-1.5" />
                        <span className="hidden sm:inline">Show List</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
                  {!selectedGlobalA3 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-300">
                        <FileText className="w-8 h-8" />
                      </div>
                      <p className="text-sm font-bold text-slate-600">No A3 case selected</p>
                      <p className="text-xs mt-1">Select a case from the list to view the report.</p>
                    </div>
                  ) : (
                    <div className="space-y-6 max-w-5xl mx-auto">
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-100/50">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                              {selectedGlobalA3.title || 'A3 Problem Solving Report'}
                            </h3>
                            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500 font-medium">
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
                                <span className="text-slate-400">Owner:</span>
                                <span className="text-slate-700 font-bold">
                                  {selectedGlobalA3.owner || 'Unassigned'}
                                </span>
                              </span>
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
                                <span className="text-slate-400">Group:</span>
                                <span className="text-slate-700 font-bold">
                                  {selectedGlobalA3.group || 'Ungrouped'}
                                </span>
                              </span>
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
                                <span className="text-slate-400">Plant:</span>
                                <span className="text-slate-700 font-bold">
                                  {selectedGlobalA3.plant || '—'}
                                </span>
                              </span>
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
                                <span className="text-slate-400">Due:</span>
                                <span className="text-slate-700 font-bold">
                                  {selectedGlobalA3.endDate || '—'}
                                </span>
                              </span>
                            </div>
                          </div>
                          <span className={clsx(
                            'px-3 py-1 rounded-full text-xs font-bold border',
                            (selectedGlobalA3.status || 'In Progress') === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : (selectedGlobalA3.status || 'In Progress') === 'In Progress'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          )}>
                            {selectedGlobalA3.status || 'In Progress'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-100/50 group hover:shadow-md transition-shadow">
                          <h4 className="flex items-center gap-3 text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-brand-50 text-brand-600 text-xs shadow-sm ring-1 ring-brand-100">1</span>
                            Problem Statement
                          </h4>
                          <div className="text-sm text-slate-600 space-y-2 leading-relaxed">
                            <p>
                              <span className="font-bold text-slate-900">Problem:</span>{' '}
                              {selectedGlobalA3.problemStatement || 'Not defined'}
                            </p>
                          </div>
                          {selectedGlobalA3.isBestPractice && (
                            <div className="mt-4 inline-flex items-center rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-bold text-amber-700 shadow-sm">
                              <Lightbulb className="w-3.5 h-3.5 mr-1.5 fill-amber-400 text-amber-500" />
                              Best practice case
                            </div>
                          )}
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-100/50 group hover:shadow-md transition-shadow">
                          <h4 className="flex items-center gap-3 text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-brand-50 text-brand-600 text-xs shadow-sm ring-1 ring-brand-100">2</span>
                            Data Analysis
                          </h4>
                          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                            <span className="font-bold text-slate-900 block mb-1">Observation:</span>
                            {selectedGlobalA3.dataAnalysisObservations ||
                              'No data observations recorded.'}
                          </p>
                          {Array.isArray(selectedGlobalA3.dataAnalysisImages) &&
                            selectedGlobalA3.dataAnalysisImages.length > 0 && (
                              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {selectedGlobalA3.dataAnalysisImages.map(image => (
                                  <div
                                    key={image.id}
                                    className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-sm"
                                  >
                                    <img
                                      src={image.src}
                                      alt="Data analysis evidence"
                                      className="w-full h-32 object-contain bg-white hover:scale-105 transition-transform duration-300"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-100/50 group hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                            <h4 className="flex items-center gap-3 text-sm font-bold text-slate-800 uppercase tracking-wider">
                              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-brand-50 text-brand-600 text-xs shadow-sm ring-1 ring-brand-100">3</span>
                              Root Cause Analysis (5 Whys)
                            </h4>
                            {selectedGlobalA3.mindMapNodes &&
                              selectedGlobalA3.mindMapNodes.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setGlobalRootCauseView(
                                      globalRootCauseView === 'text' ? 'mindmap' : 'text',
                                    )
                                  }
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-600 transition-all border border-slate-200"
                                >
                                  {globalRootCauseView === 'text'
                                    ? 'Show mindmap snapshot'
                                    : 'Show text summary'}
                                </button>
                              )}
                          </div>
                          <div className="text-sm text-slate-600 space-y-4">
                            {globalRootCauseView === 'text' ? (
                              <>
                                {selectedGlobalA3.mindMapText && (
                                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                                    <h5 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                                      5 Whys Analysis
                                    </h5>
                                    <p className="whitespace-pre-wrap font-mono text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                      {selectedGlobalA3.mindMapText}
                                    </p>
                                  </div>
                                )}
                              </>
                            ) : (
                              selectedGlobalA3.mindMapNodes &&
                              selectedGlobalA3.mindMapNodes.length > 0 && (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                                  <h5 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                                    5 Whys Mindmap Snapshot
                                  </h5>
                                  <div className="pointer-events-none rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-white">
                                    <MindMap
                                      initialNodes={selectedGlobalA3.mindMapNodes}
                                      initialScale={selectedGlobalA3.mindMapScale}
                                      fixedHeight={selectedGlobalA3.mindMapCanvasHeight}
                                    />
                                  </div>
                                </div>
                              )
                            )}
                            <div>
                              <h5 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                                Identified Root Cause
                              </h5>
                              {selectedGlobalA3.rootCause ? (
                                <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl text-red-900 font-medium">
                                  {selectedGlobalA3.rootCause}
                                </div>
                              ) : (
                                <p className="italic text-slate-400">
                                  Root cause not identified yet.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-100/50 group hover:shadow-md transition-shadow">
                          <h4 className="flex items-center gap-3 text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-brand-50 text-brand-600 text-xs shadow-sm ring-1 ring-brand-100">4</span>
                            Action Plan
                          </h4>
                          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm ring-1 ring-slate-100/50">
                            <table className="min-w-full divide-y divide-slate-100">
                              <thead className="bg-slate-50/80 backdrop-blur-sm">
                                <tr>
                                  <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Task
                                  </th>
                                  <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Description
                                  </th>
                                  <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Owner
                                  </th>
                                  <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    End Date
                                  </th>
                                  <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-slate-50">
                                {selectedGlobalA3.actionPlanTasks &&
                                selectedGlobalA3.actionPlanTasks.length > 0 ? (
                                  selectedGlobalA3.actionPlanTasks.map(task => (
                                    <tr key={task.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                                      <td className="px-4 py-3.5 text-sm font-bold text-slate-800 group-hover:text-brand-700 transition-colors">
                                        {task.name}
                                      </td>
                                      <td className="px-4 py-3.5 text-sm text-slate-600 leading-relaxed">
                                        {task.description || ''}
                                      </td>
                                      <td className="px-4 py-3.5 text-sm text-slate-500">
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200 shadow-sm">
                                            {(task.owner || 'U').charAt(0).toUpperCase()}
                                          </div>
                                          <span className="font-medium text-xs">{task.owner}</span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3.5 text-xs font-mono font-medium text-slate-500 bg-slate-50/50 rounded-lg mx-2 my-1 inline-block">
                                        {task.endDate || '—'}
                                      </td>
                                      <td className="px-4 py-3.5 text-sm">
                                        <span className={clsx(
                                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border shadow-sm transition-all",
                                          task.status === 'Completed' 
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/10 shadow-emerald-100" 
                                            : "bg-slate-50 text-slate-600 border-slate-200 ring-1 ring-slate-500/10"
                                        )}>
                                          {task.status === 'Completed' && <Check className="w-3 h-3" />}
                                          {task.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td
                                      colSpan={5}
                                      className="px-4 py-12 text-sm text-center text-slate-400 italic bg-slate-50/30"
                                    >
                                      <div className="flex flex-col items-center justify-center gap-2">
                                        <div className="p-2 rounded-full bg-slate-100 text-slate-300">
                                          <Calendar className="w-6 h-6" />
                                        </div>
                                        <span>No actions defined yet.</span>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-100/50 group hover:shadow-md transition-shadow">
                          <h4 className="flex items-center gap-3 text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-brand-50 text-brand-600 text-xs shadow-sm ring-1 ring-brand-100">5</span>
                            Results & Follow-up
                          </h4>
                          <div className="text-sm text-slate-600 space-y-2 leading-relaxed">
                            <p>
                              <span className="font-bold text-slate-900 block mb-1">Outcome:</span>
                              {selectedGlobalA3.results || 'No results recorded yet.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
