import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, ChevronLeft, ChevronRight, ChevronDown, LogOut, User as UserIcon, Save, Loader2, Sparkles, Info, Zap, FileText, ExternalLink, Upload, Download, MoreVertical, TrendingUp, Layers, NotepadText, Lightbulb, Filter, Inbox, Users, X, Calendar, FlaskConical } from 'lucide-react';
import clsx from 'clsx';
import { useApp, A3Case } from '../context/AppContext';
import {
  Bowler,
  Metric,
  MetricData,
  AIModelKey,
  GroupPerformanceRow,
  A3Comment,
  A3Reaction,
  A3ReactionSection,
  A3ReactionType,
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
  const [isAllA3Loading, setIsAllA3Loading] = useState(false);
  const [allA3Error, setAllA3Error] = useState<string | null>(null);
  const [allA3Cases, setAllA3Cases] = useState<GlobalA3Case[]>([]);
  const [selectedGlobalA3, setSelectedGlobalA3] = useState<GlobalA3Case | null>(null);
  const [globalRootCauseView, setGlobalRootCauseView] = useState<'text' | 'mindmap'>('text');
  const [lastAllA3LoadedAt, setLastAllA3LoadedAt] = useState<number | null>(null);
  const [a3Comments, setA3Comments] = useState<A3Comment[]>([]);
  const [a3CommentCounts, setA3CommentCounts] = useState<Record<string, number>>({});
  const [isLoadingA3Comments, setIsLoadingA3Comments] = useState(false);
  const [a3CommentsError, setA3CommentsError] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [activeCommentSection, setActiveCommentSection] = useState<
    'all' | 'general' | 'problem' | 'data' | 'root' | 'action' | 'results'
  >('general');
  const [activeReplyToId, setActiveReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [a3Reactions, setA3Reactions] = useState<A3Reaction[]>([]);
  const [isQuickDemoOpen, setIsQuickDemoOpen] = useState(false);
  const [quickDemoMetricName, setQuickDemoMetricName] = useState('');
  const [isGeneratingQuickDemo, setIsGeneratingQuickDemo] = useState(false);
  const [isLoadingA3Reactions, setIsLoadingA3Reactions] = useState(false);
  const [a3BestPracticeOnly, setA3BestPracticeOnly] = useState(false);
  const [isUpdatingBestPractice, setIsUpdatingBestPractice] = useState(false);

  useEffect(() => {
    if (!selectedGlobalA3) {
      setA3Comments([]);
      setA3CommentsError(null);
      setNewCommentText('');
       setActiveCommentSection('general');
      setActiveReplyToId(null);
      setReplyText('');
      setA3Reactions([]);
      return;
    }

    let isCancelled = false;

    const loadComments = async () => {
      setIsLoadingA3Comments(true);
      setA3CommentsError(null);
      try {
        const comments = await dataService.loadA3Comments(selectedGlobalA3.id);
        if (!isCancelled) {
          setA3Comments(comments);
          setA3CommentCounts(prev => {
            const currentCount = comments.length;
            const existing = prev[selectedGlobalA3.id];
            if (existing === currentCount) {
              return prev;
            }
            return {
              ...prev,
              [selectedGlobalA3.id]: currentCount,
            };
          });
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to load A3 comments', error);
          setA3CommentsError('Failed to load comments.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingA3Comments(false);
        }
      }
    };

    loadComments();

    return () => {
      isCancelled = true;
    };
  }, [selectedGlobalA3]);

  useEffect(() => {
    if (!selectedGlobalA3) {
      return;
    }
    let isCancelled = false;

    const loadReactions = async () => {
      setIsLoadingA3Reactions(true);
      try {
        const reactions = await dataService.loadA3Reactions(selectedGlobalA3.id);
        if (!isCancelled) {
          setA3Reactions(reactions);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to load A3 reactions', error);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingA3Reactions(false);
        }
      }
    };

    loadReactions();

    return () => {
      isCancelled = true;
    };
  }, [selectedGlobalA3]);

  const filteredA3Comments = useMemo(() => {
    if (activeCommentSection === 'all') {
      return a3Comments;
    }
    const sectionKey =
      activeCommentSection === 'general' ? undefined : activeCommentSection;
    return a3Comments.filter(comment => {
      const value = comment.section || 'general';
      if (!sectionKey) {
        return value === 'general';
      }
      return value === sectionKey;
    });
  }, [a3Comments, activeCommentSection]);

  const reactionOptionsBySection: Record<
    A3ReactionSection,
    { key: A3ReactionType; label: string }[]
  > = {
    problem: [
      { key: 'like', label: 'Like' },
      { key: 'helpful', label: 'Helpful' },
      { key: 'me_too', label: 'Me too' },
    ],
    data: [
      { key: 'data_clear', label: 'Clear' },
      { key: 'data_missing', label: 'Needs more data' },
      { key: 'data_confusing', label: 'Confusing' },
    ],
    root: [
      { key: 'root_solid', label: 'Solid root cause' },
      { key: 'root_weak', label: 'Weak root cause' },
      { key: 'root_needs_5whys', label: 'Needs more 5 Whys' },
    ],
    action: [
      { key: 'actions_strong', label: 'Strong actions' },
      { key: 'actions_vague', label: 'Too vague' },
      { key: 'actions_too_many', label: 'Too many actions' },
    ],
    results: [
      { key: 'results_achieved', label: 'Achieved' },
      { key: 'results_partial', label: 'Partially achieved' },
      { key: 'results_not_achieved', label: 'Not achieved' },
    ],
  };

  const getReactionButtonClasses = (
    section: A3ReactionSection,
    userReacted: boolean,
  ) => {
    const base =
      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]';

    if (section === 'problem') {
      return clsx(
        base,
        userReacted
          ? 'bg-indigo-100 border-indigo-300 text-indigo-800'
          : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100',
      );
    }

    if (section === 'data') {
      return clsx(
        base,
        userReacted
          ? 'bg-amber-100 border-amber-300 text-amber-800'
          : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
      );
    }

    if (section === 'root') {
      return clsx(
        base,
        userReacted
          ? 'bg-teal-100 border-teal-300 text-teal-800'
          : 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100',
      );
    }

    if (section === 'action') {
      return clsx(
        base,
        userReacted
          ? 'bg-sky-100 border-sky-300 text-sky-800'
          : 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100',
      );
    }

    return clsx(
      base,
      userReacted
        ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
        : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
    );
  };

  const handleToggleReaction = async (
    type: A3ReactionType,
    section: A3ReactionSection,
  ) => {
    if (!selectedGlobalA3) {
      return;
    }
    if (!user || !user.username) {
      setIsLoginModalOpen(true);
      return;
    }
    const existing = a3Reactions.find(reaction => {
      const reactionSection =
        (reaction.section as A3ReactionSection | undefined) ?? 'problem';
      return (
        reaction.type === type &&
        reaction.userId === user.username &&
        reactionSection === section
      );
    });
    if (existing) {
      setA3Reactions(prev => prev.filter(reaction => reaction.id !== existing.id));
      try {
        await dataService.removeA3Reaction({
          a3Id: selectedGlobalA3.id,
          type,
          section,
          userId: user.username,
        });
      } catch (error) {
        console.error('Failed to remove reaction', error);
        setA3Reactions(prev => [...prev, existing]);
        toast.error('Failed to update reaction. Please try again.');
      }
      return;
    }
    const optimistic: A3Reaction = {
      id: `${Date.now()}-${type}`,
      a3Id: selectedGlobalA3.id,
      userId: user.username,
      username: user.username,
      section,
      type,
      createdAt: new Date().toISOString(),
    };
    setA3Reactions(prev => [...prev, optimistic]);
    try {
      const created = await dataService.addA3Reaction({
        a3Id: selectedGlobalA3.id,
        type,
        section,
        userId: user.username,
        username: user.username,
      });
      setA3Reactions(prev =>
        prev.map(reaction => (reaction === optimistic ? created : reaction)),
      );
    } catch (error) {
      console.error('Failed to add reaction', error);
      setA3Reactions(prev => prev.filter(reaction => reaction !== optimistic));
      toast.error('Failed to update reaction. Please try again.');
    }
  };

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

      return cases;
    },
    [allA3Cases, isAdminOrSuperAdmin, userPlant, a3BestPracticeOnly],
  );

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
      if (cases.length > 0) {
        try {
          const counts = await dataService.loadA3CommentCounts(
            cases.map(a3 => a3.id),
          );
          setA3CommentCounts(counts);
        } catch (error) {
          console.error('Failed to load A3 comment counts', error);
        }
      } else {
        setA3CommentCounts({});
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
      <header className="bg-white border-b border-gray-200 z-[60] shadow-sm h-16 flex items-center px-6 justify-between relative">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-md border border-teal-500 text-teal-500 flex items-center justify-center text-xs font-bold">
              A&amp;B
            </div>
            <div className="flex items-center space-x-1">
              <h1 className="text-lg font-semibold text-gray-900 tracking-tight hidden md:block">A3 Bowler</h1>
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
                    'flex items-center px-1 md:px-1.5 py-1.5 rounded text-xs md:text-sm font-medium transition-all duration-200',
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
          <div className="relative">
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
                  {isSuperAdmin && (
                    <button
                      onClick={() => {
                        setIsAdminPanelOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-slate-700"
                    >
                      <Users className="w-4 h-4 mr-3" />
                      User Mgmt
                    </button>
                  )}
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
                    onClick={async () => {
                      setIsMobileMenuOpen(false);
                      await handleOpenAllA3Modal();
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-slate-700"
                  >
                    <FileText className="w-4 h-4 mr-3" />
                    All A3 Cases
                  </button>

                  <button
                    onClick={() => {
                      setIsEmailSettingsOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-rose-600"
                  >
                    <Calendar className="w-4 h-4 mr-3" />
                    Email Scheduling
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
              <div className="relative">
                <button
                  onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                  className="h-8 w-8 rounded-full border border-pink-500 text-pink-600 bg-white shadow-sm hover:bg-pink-50 transition-colors flex items-center justify-center text-[10px] font-semibold"
                  title={`AI Model: ${modelOptions.find(option => option.key === selectedModel)?.label || ''}`}
                >
                  {modelLogos[selectedModel] ? (
                    <img
                      src={modelLogos[selectedModel]}
                      alt="AI model logo"
                      className="w-5 h-5"
                    />
                  ) : (
                    modelShortLabels[selectedModel]
                  )}
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
                <div className="h-8 px-3 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
                  {user.username ? user.username.substring(0, 3).toUpperCase() : <UserIcon className="w-4 h-4" />}
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
                      <>
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
                        <button
                          onClick={() => setIsQuickDemoOpen(true)}
                          className="p-1 rounded-md hover:bg-indigo-100 text-indigo-600 transition-colors"
                          title="Sample metric"
                        >
                          <FlaskConical className="w-5 h-5" />
                        </button>
                      </>
                    )}
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
                    <>
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
                      <button
                        onClick={() => setIsQuickDemoOpen(true)}
                        className="p-1 rounded-md hover:bg-indigo-100 text-indigo-600 transition-colors"
                        title="Sample metric"
                      >
                        <FlaskConical className="w-5 h-5" />
                      </button>
                    </>
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
                      Connect underperforming Bowler metrics to A3 problem solving.
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
                          'whitespace-nowrap py-2 px-2 border-b-2 text-xs md:text-sm font-medium inline-flex items-center gap-1.5 rounded-t-md transition-colors',
                          portfolioTab === 'bowler'
                            ? 'border-blue-500 text-blue-700 bg-blue-50'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200 hover:bg-gray-50',
                        )}
                      >
                        <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                        <span>Bowler Overview</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPortfolioTab('a3')}
                        className={clsx(
                          'whitespace-nowrap py-2 px-2 border-b-2 text-xs md:text-sm font-medium inline-flex items-center gap-1.5 rounded-t-md transition-colors',
                          portfolioTab === 'a3'
                            ? 'border-indigo-500 text-indigo-700 bg-indigo-50'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200 hover:bg-gray-50',
                        )}
                      >
                        <Layers className="w-3 h-3 md:w-4 md:h-4" />
                        <span>A3 Portfolio</span>
                      </button>
                    </nav>
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
                            <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
                              <div
                                className="rounded-lg border border-green-100 bg-green-50 px-3 py-3"
                                title="Share of metrics with latest month meeting target, among metrics that have latest data."
                              >
                                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                                  Metrics green (latest)
                                </p>
                                <p className="mt-1 text-lg font-semibold text-gray-900">
                                  {bowlerDashboardStats.pctGreen != null
                                    ? `${bowlerDashboardStats.pctGreen.toFixed(0)}%`
                                    : '—'}
                                </p>
                                <p className="mt-0.5 text-[11px] text-gray-500">
                                  {bowlerDashboardStats.metricsWithLatestData} metrics with latest data
                                </p>
                              </div>
                              <div
                                className="rounded-lg border border-red-100 bg-red-50 px-3 py-3"
                                title="Share of metrics failing in the last 2 or 3 months, among metrics that have latest data."
                              >
                                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                                  Failing 2–3 months
                                </p>
                                <p className="mt-1 text-lg font-semibold text-gray-900">
                                  {bowlerDashboardStats.pctFailing2or3 != null
                                    ? `${bowlerDashboardStats.pctFailing2or3.toFixed(0)}%`
                                    : '—'}
                                </p>
                                <p className="mt-0.5 text-[11px] text-gray-500">
                                  Based on latest low-performing rules
                                </p>
                              </div>
                              <div
                                className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-3"
                                title="Share of metrics linked to at least one active A3."
                              >
                                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                                  With active A3
                                </p>
                                <p className="mt-1 text-lg font-semibold text-gray-900">
                                  {bowlerDashboardStats.pctWithActiveA3.toFixed(0)}%
                                </p>
                                <p className="mt-0.5 text-[11px] text-gray-500">
                                  {bowlerDashboardStats.totalMetrics} metrics with any history
                                </p>
                              </div>
                              <div
                                className="rounded-lg border border-orange-100 bg-orange-50 px-3 py-3"
                                title="Average age in days of active A3s linked to these metrics."
                              >
                                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                                  Avg age of active A3s
                                </p>
                                <p className="mt-1 text-lg font-semibold text-gray-900">
                                  {bowlerDashboardStats.avgActiveA3AgeDays != null
                                    ? `${Math.round(bowlerDashboardStats.avgActiveA3AgeDays)} days`
                                    : '—'}
                                </p>
                                <p className="mt-0.5 text-[11px] text-gray-500">
                                  From A3 start date to today
                                </p>
                              </div>
                            </div>
                          )}
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
                          <div className="mt-4">
                            <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase">
                              A3 Dashboard
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500">
                              Snapshot of portfolio A3s addressing at-risk metrics by coverage, timing, status, and priority.
                            </p>
                          </div>
                          <div className="mt-2 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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
                                    <div className="h-[60px] border-b border-gray-200 bg-gray-50 flex items-center justify-between px-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">
                                      <p className="truncate">
                                        A3 List
                                      </p>
                                      <span className="text-[10px] text-gray-500 font-normal">
                                        {a3Timeline.rows.reduce(
                                          (acc, row) => acc + row.items.length,
                                          0,
                                        )}{' '}
                                        items
                                      </span>
                                    </div>
                                    <div>
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
                                              className="h-[32px] w-full flex items-center justify-between px-4 bg-gray-100 hover:bg-gray-200 text-[11px] text-gray-700"
                                              onClick={() => {
                                                setA3TimelineExpandedGroups(prev => ({
                                                  ...prev,
                                                  [row.groupName]: !(prev[row.groupName] !== false),
                                                }));
                                              }}
                                            >
                                              <div className="flex items-center gap-1 min-w-0">
                                                {isExpanded ? (
                                                  <ChevronDown className="w-3 h-3 text-gray-600" />
                                                ) : (
                                                  <ChevronRight className="w-3 h-3 text-gray-600" />
                                                )}
                                                <span className="truncate font-semibold text-blue-700 uppercase tracking-wider">
                                                  {row.groupName}
                                                </span>
                                              </div>
                                              <span className="ml-2 text-[10px] text-gray-500">
                                                {row.items.length}
                                              </span>
                                            </button>
                                            {isExpanded &&
                                              row.items.map(item => (
                                                <button
                                                  key={item.id}
                                                  type="button"
                                                  className="h-[48px] w-full flex items-center justify-between px-4 text-[11px] bg-white hover:bg-gray-50"
                                                  onClick={() => {
                                                    navigate(
                                                      `/a3-analysis/${item.id}/problem-statement`,
                                                    );
                                                  }}
                                                >
                                                  <div className="flex flex-col items-start min-w-0">
                                                    <span className="text-gray-900 text-[11px] leading-snug truncate w-full text-left">
                                                      {item.title}
                                                    </span>
                                                    <span className="mt-0.5 text-[10px] text-gray-500 truncate w-full text-left">
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
                                            <div className="h-[32px] border-b border-gray-100 bg-gray-50/50" />
                                            {isExpanded && row.items.length === 0 && (
                                              <div className="h-[48px] border-b border-gray-100 flex items-center px-3 text-[10px] text-gray-400 italic">
                                                No dated cases in this group.
                                              </div>
                                            )}
                                            {isExpanded &&
                                              row.items.map(item => (
                                                <div
                                                  key={item.id}
                                                  className="h-[48px] border-b border-gray-100 relative group"
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
                                                  <div className="relative h-full">
                                                    <button
                                                      type="button"
                                                      className={clsx(
                                                        'absolute top-2.5 h-7 rounded-md shadow-sm border border-opacity-20 flex items-start justify-start px-2 text-xs text-white overflow-hidden cursor-pointer z-10 transition-colors text-left',
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
                <input
                  type="text"
                  value={editAdminForm.role}
                  onChange={e => handleChangeEditAdminField('role', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Role"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Country/Region
                  </label>
                  <input
                    type="text"
                    value={editAdminForm.country}
                    onChange={e => handleChangeEditAdminField('country', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Country"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Plant/Office
                  </label>
                  <input
                    type="text"
                    value={editAdminForm.plant}
                    onChange={e => handleChangeEditAdminField('plant', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Plant or office"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Team
                </label>
                <input
                  type="text"
                  value={editAdminForm.team}
                  onChange={e => handleChangeEditAdminField('team', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Team"
                />
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
        <div className="fixed inset-0 z-[140] bg-gray-900/80 flex flex-col">
        <div className="flex-1 bg-white flex flex-col w-full h-full rounded-none shadow-2xl overflow-hidden print-summary-root">
            <div className="flex items-center justify-end px-4 py-3 border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setIsAllA3ModalOpen(false);
                  setSelectedGlobalA3(null);
                  setAllA3Cases([]);
                  setAllA3Error(null);
                }}
                className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
              {isA3PortfolioSidebarOpen && (
                <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col flex-1 min-h-0">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase">
                      {isAdminOrSuperAdmin || !userPlant
                        ? 'A3 Portfolio (All Plants)'
                        : `A3 Portfolio (${userPlant})`}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {isAllA3Loading
                        ? 'Loading cases from server...'
                        : `${visibleAllA3Cases.length} case${visibleAllA3Cases.length === 1 ? '' : 's'} visible`}
                    </p>
                    <div className="mt-1">
                      <label className="inline-flex items-center gap-1 text-[11px] text-gray-600">
                        <input
                          type="checkbox"
                          className="h-3 w-3 text-amber-600 border-gray-300 rounded"
                          checked={a3BestPracticeOnly}
                          onChange={e => setA3BestPracticeOnly(e.target.checked)}
                        />
                        <span>Best practice only</span>
                      </label>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsA3PortfolioSidebarOpen(false)}
                    className="ml-3 inline-flex items-center rounded-full border border-gray-200 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-50"
                    title="Collapse portfolio list"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto bg-gray-50">
                  {allA3Error && (
                    <div className="m-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                      {allA3Error}
                    </div>
                  )}
                  {isAllA3Loading ? (
                    <div className="h-full flex items-center justify-center text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600 mr-2" />
                      Loading A3 cases...
                    </div>
                  ) : visibleAllA3Cases.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-gray-500">
                      No public A3 cases found.
                    </div>
                  ) : (
                    <div className="p-3 space-y-2">
                      <div className="hidden md:grid grid-cols-7 gap-2 text-[11px] font-semibold text-gray-500 px-2 py-1">
                        <span className="col-span-2">A3 Title</span>
                        <span>Owner</span>
                        <span>Plant</span>
                        <span>Due Date</span>
                        <span>Status</span>
                        <span>Interactions</span>
                      </div>
                      <div className="space-y-1">
                        {visibleAllA3Cases.map(a3 => {
                          const isSelected = selectedGlobalA3 && selectedGlobalA3.id === a3.id;
                          const status = (a3.status || 'Not Started').trim();
                          const statusColor =
                            status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : status === 'In Progress'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-gray-50 text-gray-600 border-gray-200';
                          const primaryMetricId = (a3.linkedMetricIds || [])[0];
                          const relatedMetricLabel =
                            primaryMetricId && metricLabelById.get(primaryMetricId);
                          return (
                            <button
                              key={`${a3.userId || a3.userAccountId || 'user'}:${a3.id}`}
                              type="button"
                              onClick={() => setSelectedGlobalA3(a3)}
                              className={clsx(
                                'w-full text-left rounded-md border px-3 py-2 bg-white hover:bg-blue-50/40 transition-colors',
                                isSelected ? 'border-blue-400 bg-blue-50/60' : 'border-gray-100',
                              )}
                            >
                              <div className="flex flex-col md:grid md:grid-cols-7 md:gap-2 md:items-center">
                                <div className="md:col-span-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] inline-flex items-center rounded-full border px-1.5 py-0.5 font-medium bg-white text-gray-600">
                                      {a3.group || 'Ungrouped'}
                                    </span>
                                    {a3.isBestPractice && (
                                      <span className="inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200">
                                        <Lightbulb className="w-3 h-3 mr-1" />
                                        Best practice
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-1 text-xs font-semibold text-indigo-700 underline decoration-dotted underline-offset-2">
                                    {a3.title || 'Untitled A3'}
                                  </div>
                                  {relatedMetricLabel && (
                                    <div className="mt-0.5 text-[11px] text-gray-600">
                                      Related metric: {relatedMetricLabel}
                                    </div>
                                  )}
                                  <div className="mt-0.5 text-[11px] text-gray-500 line-clamp-2">
                                    {a3.problemStatement || a3.description || 'No problem statement recorded.'}
                                  </div>
                                </div>
                                <div className="mt-2 md:mt-0 text-[11px] text-gray-700">
                                  {a3.owner || 'Unassigned'}
                                </div>
                                <div className="mt-1 md:mt-0 text-[11px] text-gray-700">
                                  {a3.plant || '—'}
                                </div>
                                <div className="mt-1 md:mt-0 text-[11px] text-gray-700">
                                  {a3.endDate || '—'}
                                </div>
                                <div className="mt-1 md:mt-0 text-[11px] text-gray-700">
                                  <span
                                    className={clsx(
                                      'inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium',
                                      statusColor,
                                    )}
                                  >
                                    {status || 'Not Started'}
                                  </span>
                                </div>
                                <div className="mt-1 md:mt-0 text-[11px] text-gray-500 md:text-right">
                                  {(() => {
                                    const commentCount = a3CommentCounts[a3.id] ?? 0;
                                    const reactionCount =
                                      selectedGlobalA3 && selectedGlobalA3.id === a3.id
                                        ? a3Reactions.length
                                        : 0;
                                    return `${reactionCount} reaction${
                                      reactionCount === 1 ? '' : 's'
                                    }, ${commentCount} comment${
                                      commentCount === 1 ? '' : 's'
                                    }`;
                                  })()}
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
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase">
                        A3 Report Preview
                      </p>
                      {selectedGlobalA3 && (
                        <span className="inline-flex flex-col items-start sm:flex-row sm:items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-100">
                          <span>
                            {a3Reactions.length} reaction
                            {a3Reactions.length === 1 ? '' : 's'},
                          </span>
                          <span className="sm:ml-1">
                            {a3Comments.length} comment
                            {a3Comments.length === 1 ? '' : 's'}
                          </span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Same structure as the Report tab of A3 Analysis.
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
                          'inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-medium',
                          selectedGlobalA3.isBestPractice
                            ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
                        )}
                        disabled={isUpdatingBestPractice}
                      >
                        <Lightbulb className="w-3 h-3 mr-1" />
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
                        className="ml-1 inline-flex items-center rounded-full border border-gray-200 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-50"
                        title="Show portfolio list"
                      >
                        <ChevronRight className="w-3 h-3" />
                        <span className="ml-1 hidden sm:inline">Portfolio</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-4 bg-gray-50">
                  {!selectedGlobalA3 ? (
                    <div className="h-full flex items-center justify-center text-sm text-gray-500">
                      Select an A3 case from the list to view details.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-gray-900">
                          {selectedGlobalA3.title || 'A3 Problem Solving Report'}
                        </h3>
                        <div className="text-xs text-gray-500 space-x-3">
                          <span>
                            Owner:{' '}
                            <span className="font-medium text-gray-700">
                              {selectedGlobalA3.owner || 'Unassigned'}
                            </span>
                          </span>
                          <span>
                            Group:{' '}
                            <span className="font-medium text-gray-700">
                              {selectedGlobalA3.group || 'Ungrouped'}
                            </span>
                          </span>
                          <span>
                            Plant:{' '}
                            <span className="font-medium text-gray-700">
                              {selectedGlobalA3.plant || '—'}
                            </span>
                          </span>
                          <span>
                            Status:{' '}
                            <span className="font-medium text-gray-700">
                              {selectedGlobalA3.status || 'In Progress'}
                            </span>
                          </span>
                          <span>
                            Due:{' '}
                            <span className="font-medium text-gray-700">
                              {selectedGlobalA3.endDate || '—'}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 border-b pb-1">
                            1. Problem Statement
                          </h4>
                          <div className="text-sm text-gray-600 space-y-2">
                            <p>
                              <span className="font-medium text-gray-900">Problem:</span>{' '}
                              {selectedGlobalA3.problemStatement || 'Not defined'}
                            </p>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="text-gray-500">Reactions:</span>
                            {isLoadingA3Reactions && (
                              <span className="text-gray-400">Loading...</span>
                            )}
                            {!isLoadingA3Reactions &&
                              reactionOptionsBySection.problem.map(option => {
                                const count = a3Reactions.filter(reaction => {
                                  const section =
                                    (reaction.section as A3ReactionSection | undefined) ??
                                    'problem';
                                  return (
                                    reaction.type === option.key && section === 'problem'
                                  );
                                }).length;
                                const userReacted =
                                  !!user &&
                                  !!user.username &&
                                  a3Reactions.some(reaction => {
                                    const section =
                                      (reaction.section as
                                        | A3ReactionSection
                                        | undefined) ?? 'problem';
                                    return (
                                      reaction.type === option.key &&
                                      reaction.userId === user.username &&
                                      section === 'problem'
                                    );
                                  });
                                return (
                                  <button
                                    key={option.key}
                                    type="button"
                                    className={getReactionButtonClasses('problem', userReacted)}
                                    onClick={() =>
                                      handleToggleReaction(option.key, 'problem')
                                    }
                                  >
                                    <span>{option.label}</span>
                                    <span className="text-[10px] text-gray-500">
                                      {count}
                                    </span>
                                  </button>
                                );
                              })}
                          </div>
                          {selectedGlobalA3.isBestPractice && (
                            <div className="mt-3 inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                              <Lightbulb className="w-3 h-3 mr-1" />
                              Best practice case
                            </div>
                          )}
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 border-b pb-1">
                            2. Data Analysis
                          </h4>
                          <p className="text-xs text-gray-500 mt-2">
                            <span className="font-semibold block mb-1">Observation:</span>
                            {selectedGlobalA3.dataAnalysisObservations ||
                              'No data observations recorded.'}
                          </p>
                          {Array.isArray(selectedGlobalA3.dataAnalysisImages) &&
                            selectedGlobalA3.dataAnalysisImages.length > 0 && (
                              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {selectedGlobalA3.dataAnalysisImages.map(image => (
                                  <div
                                    key={image.id}
                                    className="border border-gray-200 rounded-md overflow-hidden bg-gray-50"
                                  >
                                    <img
                                      src={image.src}
                                      alt="Data analysis evidence"
                                      className="w-full h-24 object-contain bg-white"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="text-gray-500">Reactions:</span>
                            {isLoadingA3Reactions && (
                              <span className="text-gray-400">Loading...</span>
                            )}
                            {!isLoadingA3Reactions &&
                              reactionOptionsBySection.data.map(option => {
                                const count = a3Reactions.filter(reaction => {
                                  const section =
                                    (reaction.section as A3ReactionSection | undefined) ??
                                    'problem';
                                  return reaction.type === option.key && section === 'data';
                                }).length;
                                const userReacted =
                                  !!user &&
                                  !!user.username &&
                                  a3Reactions.some(reaction => {
                                    const section =
                                      (reaction.section as
                                        | A3ReactionSection
                                        | undefined) ?? 'problem';
                                    return (
                                      reaction.type === option.key &&
                                      reaction.userId === user.username &&
                                      section === 'data'
                                    );
                                  });
                                return (
                                  <button
                                    key={option.key}
                                    type="button"
                                    className={getReactionButtonClasses('data', userReacted)}
                                    onClick={() =>
                                      handleToggleReaction(option.key, 'data')
                                    }
                                  >
                                    <span>{option.label}</span>
                                    <span className="text-[10px] text-gray-500">
                                      {count}
                                    </span>
                                  </button>
                                );
                              })}
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                          <div className="flex items-center justify-between mb-2 border-b pb-1">
                            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                              3. Root Cause Analysis (5 Whys)
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
                                  className="px-2 py-1 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                                >
                                  {globalRootCauseView === 'text'
                                    ? 'Show mindmap snapshot'
                                    : 'Show text summary'}
                                </button>
                              )}
                          </div>
                          <div className="text-sm text-gray-600 space-y-4">
                            {globalRootCauseView === 'text' ? (
                              <>
                                {selectedGlobalA3.mindMapText && (
                                  <div className="bg-gray-50 p-3 rounded border border-gray-100">
                                    <h5 className="text-xs font-semibold text-gray-500 mb-1">
                                      5 Whys Analysis:
                                    </h5>
                                    <p className="whitespace-pre-wrap font-mono text-xs">
                                      {selectedGlobalA3.mindMapText}
                                    </p>
                                  </div>
                                )}
                              </>
                            ) : (
                              selectedGlobalA3.mindMapNodes &&
                              selectedGlobalA3.mindMapNodes.length > 0 && (
                                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                                  <h5 className="text-xs font-semibold text-gray-500 mb-2">
                                    5 Whys Mindmap Snapshot:
                                  </h5>
                                  <div className="pointer-events-none">
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
                              <h5 className="text-xs font-semibold text-gray-500 mb-1">
                                Identified Root Cause:
                              </h5>
                              {selectedGlobalA3.rootCause ? (
                                <p className="whitespace-pre-wrap">
                                  {selectedGlobalA3.rootCause}
                                </p>
                              ) : (
                                <p className="italic text-gray-500">
                                  Root cause not identified yet.
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="text-gray-500">Reactions:</span>
                            {isLoadingA3Reactions && (
                              <span className="text-gray-400">Loading...</span>
                            )}
                            {!isLoadingA3Reactions &&
                              reactionOptionsBySection.root.map(option => {
                                const count = a3Reactions.filter(reaction => {
                                  const section =
                                    (reaction.section as A3ReactionSection | undefined) ??
                                    'problem';
                                  return reaction.type === option.key && section === 'root';
                                }).length;
                                const userReacted =
                                  !!user &&
                                  !!user.username &&
                                  a3Reactions.some(reaction => {
                                    const section =
                                      (reaction.section as
                                        | A3ReactionSection
                                        | undefined) ?? 'problem';
                                    return (
                                      reaction.type === option.key &&
                                      reaction.userId === user.username &&
                                      section === 'root'
                                    );
                                  });
                                return (
                                  <button
                                    key={option.key}
                                    type="button"
                                    className={getReactionButtonClasses('root', userReacted)}
                                    onClick={() =>
                                      handleToggleReaction(option.key, 'root')
                                    }
                                  >
                                    <span>{option.label}</span>
                                    <span className="text-[10px] text-gray-500">
                                      {count}
                                    </span>
                                  </button>
                                );
                              })}
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 border-b pb-1">
                            4. Action Plan
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">
                                    Task
                                  </th>
                                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">
                                    Description
                                  </th>
                                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">
                                    Owner
                                  </th>
                                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">
                                    End Date
                                  </th>
                                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {selectedGlobalA3.actionPlanTasks &&
                                selectedGlobalA3.actionPlanTasks.length > 0 ? (
                                  selectedGlobalA3.actionPlanTasks.map(task => (
                                    <tr key={task.id}>
                                      <td className="px-2 py-1 text-xs text-gray-900">
                                        {task.name}
                                      </td>
                                      <td className="px-2 py-1 text-xs text-gray-500">
                                        {task.description || ''}
                                      </td>
                                      <td className="px-2 py-1 text-xs text-gray-500">
                                        {task.owner}
                                      </td>
                                      <td className="px-2 py-1 text-xs text-gray-500">
                                        {task.endDate || ''}
                                      </td>
                                      <td className="px-2 py-1 text-xs text-gray-600">
                                        {task.status}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td
                                      colSpan={5}
                                      className="px-2 py-4 text-xs text-center text-gray-500"
                                    >
                                      No actions defined.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="text-gray-500">Reactions:</span>
                            {isLoadingA3Reactions && (
                              <span className="text-gray-400">Loading...</span>
                            )}
                            {!isLoadingA3Reactions &&
                              reactionOptionsBySection.action.map(option => {
                                const count = a3Reactions.filter(reaction => {
                                  const section =
                                    (reaction.section as A3ReactionSection | undefined) ??
                                    'problem';
                                  return (
                                    reaction.type === option.key && section === 'action'
                                  );
                                }).length;
                                const userReacted =
                                  !!user &&
                                  !!user.username &&
                                  a3Reactions.some(reaction => {
                                    const section =
                                      (reaction.section as
                                        | A3ReactionSection
                                        | undefined) ?? 'problem';
                                    return (
                                      reaction.type === option.key &&
                                      reaction.userId === user.username &&
                                      section === 'action'
                                    );
                                  });
                                return (
                                  <button
                                    key={option.key}
                                    type="button"
                                    className={getReactionButtonClasses('action', userReacted)}
                                    onClick={() =>
                                      handleToggleReaction(option.key, 'action')
                                    }
                                  >
                                    <span>{option.label}</span>
                                    <span className="text-[10px] text-gray-500">
                                      {count}
                                    </span>
                                  </button>
                                );
                              })}
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 border-b pb-1">
                            5. Results & Follow-up
                          </h4>
                          <div className="text-sm text-gray-600 space-y-2">
                            <p>
                              <span className="font-medium text-gray-900">Outcome:</span>{' '}
                              {selectedGlobalA3.results || 'No results recorded yet.'}
                            </p>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="text-gray-500">Reactions:</span>
                            {isLoadingA3Reactions && (
                              <span className="text-gray-400">Loading...</span>
                            )}
                            {!isLoadingA3Reactions &&
                              reactionOptionsBySection.results.map(option => {
                                const count = a3Reactions.filter(reaction => {
                                  const section =
                                    (reaction.section as A3ReactionSection | undefined) ??
                                    'problem';
                                  return (
                                    reaction.type === option.key && section === 'results'
                                  );
                                }).length;
                                const userReacted =
                                  !!user &&
                                  !!user.username &&
                                  a3Reactions.some(reaction => {
                                    const section =
                                      (reaction.section as
                                        | A3ReactionSection
                                        | undefined) ?? 'problem';
                                    return (
                                      reaction.type === option.key &&
                                      reaction.userId === user.username &&
                                      section === 'results'
                                    );
                                  });
                                return (
                                  <button
                                    key={option.key}
                                    type="button"
                                    className={getReactionButtonClasses('results', userReacted)}
                                    onClick={() =>
                                      handleToggleReaction(option.key, 'results')
                                    }
                                  >
                                    <span>{option.label}</span>
                                    <span className="text-[10px] text-gray-500">
                                      {count}
                                    </span>
                                  </button>
                                );
                              })}
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                          <div className="mb-2 flex items-center justify-between border-b pb-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                                Comments
                              </h4>
                              <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-600 border border-gray-200">
                                {filteredA3Comments.length} of {a3Comments.length} comment
                                {a3Comments.length === 1 ? '' : 's'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px]">
                              {[
                                { key: 'all', label: 'All' },
                                { key: 'general', label: 'General' },
                                { key: 'problem', label: 'Problem' },
                                { key: 'data', label: 'Data' },
                                { key: 'root', label: 'Root' },
                                { key: 'action', label: 'Action' },
                                { key: 'results', label: 'Results' },
                              ].map(option => (
                                <button
                                  key={option.key}
                                  type="button"
                                  className={clsx(
                                    'px-2 py-0.5 rounded-full border text-[10px]',
                                    activeCommentSection === option.key
                                      ? 'bg-blue-600 border-blue-600 text-white'
                                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50',
                                  )}
                                  onClick={() =>
                                    setActiveCommentSection(option.key as typeof activeCommentSection)
                                  }
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-4">
                            {isLoadingA3Comments ? (
                              <div className="flex items-center text-xs text-gray-500">
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                <span>Loading comments...</span>
                              </div>
                            ) : (
                              <>
                                {a3CommentsError && (
                                  <p className="text-xs text-red-500">{a3CommentsError}</p>
                                )}
                                {filteredA3Comments.length === 0 && !a3CommentsError && (
                                  <p className="text-xs text-gray-500">
                                    No comments yet. Be the first to share feedback on this A3.
                                  </p>
                                )}
                                {filteredA3Comments.length > 0 && (
                                  <div className="space-y-4">
                                    {filteredA3Comments
                                      .filter(comment => !comment.parentId)
                                      .map(comment => {
                                        const replies = filteredA3Comments.filter(
                                          reply => reply.parentId === comment.id,
                                        );
                                        const isReplying = activeReplyToId === comment.id;
                                        const createdAt = comment.createdAt
                                          ? new Date(comment.createdAt)
                                          : null;
                                        return (
                                          <div key={comment.id} className="text-xs text-gray-700">
                                            <div className="flex items-center justify-between">
                                              <span className="font-semibold text-gray-900">
                                                {comment.username || comment.userId || 'Anonymous'}
                                              </span>
                                              {createdAt && (
                                                <span className="text-[11px] text-gray-400">
                                                  {createdAt.toLocaleString()}
                                                </span>
                                              )}
                                            </div>
                                            {comment.section && (
                                              <span className="mt-0.5 inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                                                {comment.section === 'problem'
                                                  ? 'Problem'
                                                  : comment.section === 'data'
                                                  ? 'Data'
                                                  : comment.section === 'root'
                                                  ? 'Root'
                                                  : comment.section === 'action'
                                                  ? 'Action'
                                                  : comment.section === 'results'
                                                  ? 'Results'
                                                  : 'General'}
                                              </span>
                                            )}
                                            <p className="mt-1 whitespace-pre-wrap text-gray-700">
                                              {comment.content}
                                            </p>
                                            <button
                                              type="button"
                                              className="mt-1 text-[11px] font-medium text-blue-600 hover:text-blue-700"
                                              onClick={() => {
                                                if (isReplying) {
                                                  setActiveReplyToId(null);
                                                  setReplyText('');
                                                } else {
                                                  setActiveReplyToId(comment.id);
                                                  setReplyText('');
                                                }
                                              }}
                                            >
                                              {isReplying ? 'Cancel reply' : 'Reply'}
                                            </button>
                                            {isReplying && (
                                              <div className="mt-2">
                                                <textarea
                                                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                  rows={2}
                                                  placeholder="Write your reply..."
                                                  value={replyText}
                                                  onChange={e => setReplyText(e.target.value)}
                                                />
                                                <div className="mt-1 flex justify-end gap-2">
                                                  <button
                                                    type="button"
                                                    className="inline-flex items-center rounded-md border border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-50"
                                                    onClick={() => {
                                                      setActiveReplyToId(null);
                                                      setReplyText('');
                                                    }}
                                                    disabled={isSubmittingReply}
                                                  >
                                                    Cancel
                                                  </button>
                                                  <button
                                                    type="button"
                                                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                                                    onClick={async () => {
                                                      if (!selectedGlobalA3) {
                                                        return;
                                                      }
                                                      if (!replyText.trim()) {
                                                        return;
                                                      }
                                                      if (!user || !user.username) {
                                                        setIsLoginModalOpen(true);
                                                        return;
                                                      }
                                                      try {
                                                        setIsSubmittingReply(true);
                                                        const created = await dataService.addA3Comment({
                                                          a3Id: selectedGlobalA3.id,
                                                          content: replyText.trim(),
                                                          section:
                                                            comment.section || activeCommentSection,
                                                          parentId: comment.id,
                                                          userId: user.username,
                                                          username: user.username,
                                                        });
                                                        setA3Comments(prev => [...prev, created]);
                                                        setA3CommentCounts(prev => {
                                                          const current =
                                                            prev[selectedGlobalA3.id] ?? 0;
                                                          return {
                                                            ...prev,
                                                            [selectedGlobalA3.id]: current + 1,
                                                          };
                                                        });
                                                        setReplyText('');
                                                        setActiveReplyToId(null);
                                                      } catch (error) {
                                                        console.error('Failed to post reply', error);
                                                        toast.error(
                                                          'Failed to post reply. Please try again.',
                                                        );
                                                      } finally {
                                                        setIsSubmittingReply(false);
                                                      }
                                                    }}
                                                    disabled={isSubmittingReply || !replyText.trim()}
                                                  >
                                                    {isSubmittingReply && (
                                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                    )}
                                                    <span>Post reply</span>
                                                  </button>
                                                </div>
                                              </div>
                                            )}
                                            {replies.length > 0 && (
                                              <div className="mt-2 border-l border-gray-200 pl-3 space-y-2">
                                                {replies.map(reply => {
                                                  const replyCreatedAt = reply.createdAt
                                                    ? new Date(reply.createdAt)
                                                    : null;
                                                  return (
                                                    <div key={reply.id} className="text-xs">
                                                      <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-gray-900">
                                                          {reply.username ||
                                                            reply.userId ||
                                                            'Anonymous'}
                                                        </span>
                                                        {replyCreatedAt && (
                                                          <span className="text-[11px] text-gray-400">
                                                            {replyCreatedAt.toLocaleString()}
                                                          </span>
                                                        )}
                                                      </div>
                                                      <p className="mt-1 whitespace-pre-wrap text-gray-700">
                                                        {reply.content}
                                                      </p>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                  </div>
                                )}
                              </>
                            )}

                            <div className="border-t border-gray-100 pt-3 mt-2">
                              <p className="text-[11px] text-gray-500 mb-2">
                                Share feedback or questions about this A3 report.
                              </p>
                              <textarea
                                className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                                placeholder={
                                  user
                                    ? 'Write a comment...'
                                    : 'Log in to comment on this A3 report.'
                                }
                                value={newCommentText}
                                onChange={e => setNewCommentText(e.target.value)}
                              />
                              <div className="mt-2 flex items-center justify-between">
                                {!user && (
                                  <span className="text-[11px] text-gray-500">
                                    You need to log in to post comments.
                                  </span>
                                )}
                                <button
                                  type="button"
                                  className="ml-auto inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                                  onClick={async () => {
                                    if (!selectedGlobalA3) {
                                      return;
                                    }
                                    if (!newCommentText.trim()) {
                                      return;
                                    }
                                    if (!user || !user.username) {
                                      setIsLoginModalOpen(true);
                                      return;
                                    }
                                    try {
                                      setIsSubmittingComment(true);
                                      const created = await dataService.addA3Comment({
                                        a3Id: selectedGlobalA3.id,
                                        content: newCommentText.trim(),
                                        section:
                                          activeCommentSection === 'all'
                                            ? 'general'
                                            : activeCommentSection,
                                        userId: user.username,
                                        username: user.username,
                                      });
                                      setA3Comments(prev => [...prev, created]);
                                      setA3CommentCounts(prev => {
                                        const current =
                                          prev[selectedGlobalA3.id] ?? 0;
                                        return {
                                          ...prev,
                                          [selectedGlobalA3.id]: current + 1,
                                        };
                                      });
                                      setNewCommentText('');
                                    } catch (error) {
                                      console.error('Failed to post comment', error);
                                      toast.error(
                                        'Failed to post comment. Please try again.',
                                      );
                                    } finally {
                                      setIsSubmittingComment(false);
                                    }
                                  }}
                                  disabled={isSubmittingComment || !newCommentText.trim()}
                                >
                                  {isSubmittingComment && (
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  )}
                                  <span>Post comment</span>
                                </button>
                              </div>
                            </div>
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
