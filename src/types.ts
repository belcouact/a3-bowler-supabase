export interface MetricData {
  target: string;
  actual: string;
  targetNote?: string;
  actualNote?: string;
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
  objective?: string;
  champion?: string;
  commitment?: string;
  tag?: string;
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

export interface A3Case {
  id: string;
  title: string;
  description?: string;
  owner?: string;
  group?: string;
  priority?: 'Low' | 'Medium' | 'High';
  startDate?: string;
  endDate?: string;
  status?: string;
  problemStatement?: string;
  results?: string;
  mindMapNodes?: MindMapNodeData[];
  mindMapText?: string;
  rootCause?: string;
  actionPlanTasks?: ActionPlanTaskData[];
  dataAnalysisObservations?: string;
  dataAnalysisImages?: DataAnalysisImage[];
  dataAnalysisCanvasHeight?: number;
  resultImages?: DataAnalysisImage[];
  resultCanvasHeight?: number;
}
