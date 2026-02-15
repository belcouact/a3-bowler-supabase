export interface MetricData {
  target: string;
  actual: string;
  targetNote?: string;
  actualNote?: string;
}

export type AIModelKey = 'gemini' | 'deepseek' | 'kimi' | 'glm';

export type EmailScheduleFrequency = 'weekly' | 'monthly';

export interface EmailScheduleSettings {
  frequency: EmailScheduleFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  timeOfDay: string;
  stopDate?: string;
  timezoneOffsetMinutes?: number;
}

export interface DashboardSettings {
  aiModel?: AIModelKey;
  emailSchedule?: EmailScheduleSettings;
  latestSummaryForEmail?: string;
  latestSummaryHtmlForEmail?: string;
  emailDefaults?: {
    recipients?: string;
    subject?: string;
  };
  emailConsolidate?: {
    enabled?: boolean;
    tags?: string;
  };
}

export interface Metric {
  id: string;
  name: string;
  definition: string;
  owner: string;
  scope: string;
  attribute: string;
  targetMeetingRule?: 'gte' | 'lte' | 'within_range';
  monthlyData?: Record<string, MetricData>;
}

export interface Bowler {
  id: string;
  name: string;
  description?: string;
  group?: string;
  champion?: string;
  commitment?: string;
  tag?: string;
  metricStartDate?: string;
  metrics?: Metric[];
  statusColor?: string;
}

export interface MindMapNodeData {
  id: string;
  text: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  customWidth?: number;
  customHeight?: number;
  parentId: string | null;
  type?: 'root' | 'child';
  color?: string;
}

export interface ActionPlanTaskData {
  id: string;
  name: string;
  description?: string;
  owner: string;
  group?: string;
  startDate: string;
  endDate: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  progress: number;
}

export interface DataAnalysisImage {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DashboardMindmap {
  id: string;
  title: string;
  description?: string;
  markdown: string;
  createdAt: string;
  updatedAt?: string;
}

export interface A3Case {
  id: string;
  title: string;
  description?: string;
  owner?: string;
  group?: string;
  tag?: string;
  linkedMetricIds?: string[];
  priority?: 'Low' | 'Medium' | 'High';
  startDate?: string;
  endDate?: string;
  status?: string;
  problemStatement?: string;
  problemContext?: string;
  results?: string;
  mindMapNodes?: MindMapNodeData[];
  mindMapText?: string;
  mindMapScale?: number;
  mindMapCanvasHeight?: number;
  rootCause?: string;
  actionPlanTasks?: ActionPlanTaskData[];
  dataAnalysisObservations?: string;
  dataAnalysisImages?: DataAnalysisImage[];
  dataAnalysisCanvasHeight?: number;
  resultImages?: DataAnalysisImage[];
  resultCanvasHeight?: number;
  isBestPractice?: boolean;
}

export interface GroupPerformanceRow {
  groupName: string;
  metricId: string;
  metricName: string;
  bowlerId?: string;
  latestMet: boolean | null;
  latestActual: string | null;
  fail2: boolean;
  fail3: boolean;
  achievementRate: number | null;
  linkedA3Count: number;
}
