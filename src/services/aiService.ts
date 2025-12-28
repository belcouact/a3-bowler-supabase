import { Metric, Bowler, A3Case, AIModelKey } from '../types';

export interface AnalysisResult {
  trend: 'stable' | 'capable' | 'unstable' | 'incapable' | 'improving' | 'degrading';
  achievementRate: number;
  suggestion: string[];
  summary: string;
}

interface A3WhyNode {
  cause: string;
  children?: A3WhyNode[];
}

export interface A3FromMetricPlan {
  problemStatement: string;
  whyTree: A3WhyNode[];
  rootCauses: string[];
  actions: {
    name: string;
    description?: string;
    owner?: string;
    group?: string;
    startDate?: string;
    endDate?: string;
    status?: 'Not Started' | 'In Progress' | 'Completed';
    progress?: number;
  }[];
}

const calculateStats = (values: number[]) => {
  if (values.length === 0) return { mean: 0, stdDev: 0, min: 0, max: 0 };
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  return { mean, stdDev, min: Math.min(...values), max: Math.max(...values) };
};

const parseTarget = (targetStr: string): { min?: number; max?: number; val?: number } => {
    const rangeMatch = targetStr.match(/^(?:\{|\[)?\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:\}|\])?$/);
    if (rangeMatch) {
        return { min: parseFloat(rangeMatch[1]), max: parseFloat(rangeMatch[2]) };
    }
    const val = parseFloat(targetStr);
    return isNaN(val) ? {} : { val };
};

export const analyzeMetric = async (
  metric: Metric,
  model: AIModelKey,
  linkedA3Cases: A3Case[],
): Promise<AnalysisResult> => {
  const months = Object.keys(metric.monthlyData || {}).sort();
  const dataPoints: { month: string; actual: string; target: string }[] = [];
  const numericActuals: number[] = [];
  
  months.forEach(month => {
    const data = metric.monthlyData?.[month];
    if (data && data.actual) {
      dataPoints.push({
        month,
        actual: data.actual,
        target: data.target || 'N/A'
      });
      const val = parseFloat(data.actual);
      if (!isNaN(val)) numericActuals.push(val);
    }
  });

  const stats = calculateStats(numericActuals);

  const completedA3s = (linkedA3Cases || []).filter(
    c => (c.status || '').trim().toLowerCase() === 'completed',
  );
  const otherA3s = (linkedA3Cases || []).filter(
    c => (c.status || '').trim().toLowerCase() !== 'completed',
  );

  const a3ContextForPrompt =
    completedA3s.length === 0 && otherA3s.length === 0
      ? 'No A3 cases are currently linked to this metric.'
      : JSON.stringify(
          {
            completedA3s: completedA3s.map(c => ({
              id: c.id,
              title: c.title,
              owner: c.owner,
              group: c.group,
              tag: c.tag,
              startDate: c.startDate,
              endDate: c.endDate,
            })),
            otherA3s: otherA3s.map(c => ({
              id: c.id,
              title: c.title,
              owner: c.owner,
              group: c.group,
              tag: c.tag,
              status: c.status,
              startDate: c.startDate,
              endDate: c.endDate,
            })),
          },
          null,
          2,
        );
  
  // Try to calculate Capability (very rough estimate based on latest target)
  let capabilityInfo = "Not calculated (insufficient data or complex targets).";
  if (numericActuals.length >= 3 && dataPoints.length > 0) {
      const latestTarget = dataPoints[dataPoints.length - 1].target;
      const parsed = parseTarget(latestTarget);
      const rule = metric.targetMeetingRule || 'gte';
      
      if (rule === 'within_range' && parsed.min !== undefined && parsed.max !== undefined && stats.stdDev > 0) {
          const cpl = (stats.mean - parsed.min) / (3 * stats.stdDev);
          const cpu = (parsed.max - stats.mean) / (3 * stats.stdDev);
          const cpk = Math.min(cpl, cpu);
          capabilityInfo = `Cpk: ${cpk.toFixed(2)} (Target Range: ${parsed.min} - ${parsed.max})`;
      } else if (rule === 'gte' && parsed.val !== undefined && stats.stdDev > 0) {
          const cpk = (stats.mean - parsed.val) / (3 * stats.stdDev);
           capabilityInfo = `Cpk (One-sided Lower): ${cpk.toFixed(2)} (Target >= ${parsed.val})`;
      } else if (rule === 'lte' && parsed.val !== undefined && stats.stdDev > 0) {
          const cpk = (parsed.val - stats.mean) / (3 * stats.stdDev);
          capabilityInfo = `Cpk (One-sided Upper): ${cpk.toFixed(2)} (Target <= ${parsed.val})`;
      }
  }

  if (dataPoints.length === 0) {
    return {
      trend: 'stable',
      achievementRate: 0,
      suggestion: [],
      summary: 'No data available for analysis.'
    };
  }

  const prompt = `
  You are an expert quality engineer and data analyst. Perform a deep statistical analysis of the following metric.

  Metric Context:
  - Name: "${metric.name}"
  - Definition: "${metric.definition || 'N/A'}"
  - Attribute: "${metric.attribute || 'Individual Data'}" (Use this to interpret if data is accumulative or snapshot).
  - Target Meeting Rule: "${metric.targetMeetingRule || 'gte'}"
  
  Statistical Data (Calculated):
  - Mean: ${stats.mean.toFixed(2)}
  - Std Dev: ${stats.stdDev.toFixed(2)}
  - Min: ${stats.min}
  - Max: ${stats.max}
  - Process Capability: ${capabilityInfo}

  Linked A3 Problem-Solving Context (for this metric only):
  ${a3ContextForPrompt}

  Raw Data (Month | Actual | Target):
  ${dataPoints.map(p => `${p.month} | ${p.actual} | ${p.target}`).join('\n')}

  Instructions:
  1. **Classify the Process State (Trend):** Choose ONE of the following based on stability and capability:
     - "capable": Process is stable AND consistently meets targets (high Cpk or 100% achievement with low variance).
     - "stable": Process is predictable (low variance) but might not meet all targets.
     - "improving": Clear trend in the positive direction (closer to target).
     - "degrading": Clear trend in the negative direction (away from target).
     - "unstable": High variance, unpredictable, erratic swings.
     - "incapable": Stable but consistently fails to meet targets.
  
  2. **Calculate Achievement Rate:** % of points meeting the target.

  3. **Suggestions:** Provide 3-5 specific, actionable suggestions. 
     - If "unstable", suggest looking for special causes of variation.
     - If "incapable", suggest process redesign or resource adjustment.
     - If "improving", suggest standardizing the new methods.
     - Relate suggestions to the Metric Definition and Attribute.

  4. **Completed A3 Effectiveness and Next Step:**
     - If there are linked A3 cases, especially any with status "Completed", briefly assess whether performance appears to have improved after the A3 end date based on the data.
     - Comment explicitly on whether the completed A3 work appears effective or not.
     - Recommend the most appropriate next step (for example: sustain and standardize gains, run follow-up verification, extend or revise the A3, or initiate a new A3 with a different problem focus).
     - If there are no linked A3 cases and the process is unstable, degrading, or incapable, explicitly recommend starting an A3 and outline the likely problem focus.

  5. **Summary:** Provide a professional statistical summary. Mention stability (variation), capability (meeting targets), any significant shifts, and how current or future A3 work should focus on this metric. Avoid generic phrases.

  Response Format (JSON ONLY):
  {
    "trend": "capable" | "stable" | "improving" | "degrading" | "unstable" | "incapable",
    "achievementRate": number,
    "suggestion": string[],
    "summary": "string"
  }
  `;

  try {
    const response = await fetch('https://multi-model-worker.study-llm.me/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a helpful data analysis assistant that outputs strictly JSON.' },
          { role: 'user', content: prompt }
        ],
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    
    // Clean up content if it contains markdown code blocks
    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const result = JSON.parse(cleanContent);
    
    return {
      trend: result.trend || 'stable',
      achievementRate: typeof result.achievementRate === 'number' ? result.achievementRate : 0,
      suggestion: Array.isArray(result.suggestion) ? result.suggestion : [],
      summary: result.summary || 'Could not generate summary.'
    };

  } catch (error) {
    console.error('AI Analysis Error:', error);
    return {
      trend: 'stable',
      achievementRate: 0,
      suggestion: ['Error connecting to AI service.'],
      summary: 'Failed to analyze data.'
    };
  }
};

export const generateComprehensiveSummary = async (context: string, prompt: string, model: AIModelKey): Promise<string> => {
  try {
    const response = await fetch('https://multi-model-worker.study-llm.me/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant for the Metric Bowler & A3 Problem Solving application. 
            Here is the current data in the application: ${context}.
            Answer the user's questions based on this data. Be concise and helpful.`
          },
          { role: 'user', content: prompt }
        ],
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || data.choices?.[0]?.delta?.content || "Sorry, I couldn't generate a response.";

  } catch (error) {
    console.error('AI Summary Error:', error);
    return "Sorry, there was an error generating the summary. Please try again later.";
  }
};

export const generateAIContext = (bowlers: Bowler[], a3Cases: A3Case[]): string => {
  return JSON.stringify({
    bowlers: bowlers.map(b => ({
      ...b,
      group: b.group || 'Ungrouped'
    })),
    a3Cases: a3Cases.map(c => {
      const clone = { ...c };
      delete clone.mindMapNodes;
      delete clone.dataAnalysisImages;
      delete clone.resultImages;
      delete clone.dataAnalysisCanvasHeight;
      delete clone.resultCanvasHeight;
      return clone;
    })
  });
};

export const generateA3PlanFromMetric = async (
  metric: Metric,
  model: AIModelKey,
): Promise<A3FromMetricPlan> => {
  const today = new Date().toISOString().slice(0, 10);
  const months = Object.keys(metric.monthlyData || {}).sort();
  const dataPoints: { month: string; actual: string; target: string }[] = [];
  months.forEach(month => {
    const data = metric.monthlyData?.[month];
    if (data && data.actual) {
      dataPoints.push({
        month,
        actual: data.actual,
        target: data.target || 'N/A',
      });
    }
  });

  if (dataPoints.length === 0) {
    return {
      problemStatement: '',
      whyTree: [],
      rootCauses: [],
      actions: [],
    };
  }

  const prompt = `
You are an expert in A3 Problem Solving, Lean, and operational excellence.

You will receive the history of one performance metric.

Your tasks:
1) Write a clear, formal A3 Problem Statement in English only. It must describe the gap from target, where and when it occurs, and the impact. Do not include any solutions or suggestions in this field.
2) Build a concise 5-Whys style cause tree for this problem.
3) Identify the most likely root causes from that tree.
4) Propose a practical, time-phased action plan based on the root causes that reflects industrial best practice (for example: robust problem clarification, detailed root cause analysis, countermeasures, pilot/experiments, standardization, training, and follow-up monitoring). The plan should be realistic for an operational team to execute.

Metric Context:
- Name: "${metric.name}"
- Definition: "${metric.definition || 'N/A'}"
- Attribute: "${metric.attribute || 'Individual Data'}"
- Target Meeting Rule: "${metric.targetMeetingRule || 'gte'}"

Raw Data (Month | Actual | Target):
${dataPoints.map(p => `${p.month} | ${p.actual} | ${p.target}`).join('\n')}

Response requirements:
- Always respond in English.
- Make the cause tree logically streamlined: do NOT repeat the same cause text at the same level, and avoid creating multiple nodes that say essentially the same thing.
- When several detailed sub-causes share the same higher-level idea, represent that idea once as a single parent "cause" node and place the detailed variations under "children" instead of duplicating the parent text.
- Remove or merge any redundant nodes so that each "cause" string is distinct and adds new information.
- The action plan must include multiple tasks that cover diagnosis, countermeasures, piloting, standardization, and follow-up (including how to monitor the metric over the next 2–3 months).
- Use ${today} as today's date when planning the timeline for the action plan.
- Each task should describe what to do, how to do it, and who should own it so that a real team can execute it in a manufacturing or service environment (avoid generic phrases such as "optimize process" without concrete steps).
- Return JSON ONLY with this exact structure:
{
  "problemStatement": "single formal problem statement string",
  "whyTree": [
    {
      "cause": "first-level cause text",
      "children": [
        {
          "cause": "second-level cause text",
          "children": [
            {
              "cause": "third-level cause text"
            }
          ]
        }
      ]
    }
  ],
  "rootCauses": [
    "root cause sentence 1",
    "root cause sentence 2"
  ],
  "tasks": [
    {
      "name": "short action title",
      "description": "detailed what/how so a team can execute",
      "owner": "role or function (e.g. Production Supervisor)",
      "group": "theme or workstream name",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "status": "Not Started" | "In Progress" | "Completed",
      "progress": number
    }
  ]
}
`;

  try {
    const response = await fetch('https://multi-model-worker.study-llm.me/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are an A3 Problem Solving coach that outputs strictly JSON in the requested schema.',
          },
          { role: 'user', content: prompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    const cleanContent = content.replace(/```json/gi, '').replace(/```/g, '').trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleanContent);
    } catch {
      parsed = {};
    }

    const problemStatement =
      typeof parsed.problemStatement === 'string' ? parsed.problemStatement.trim() : '';

    const rawWhyTree = Array.isArray(parsed.whyTree) ? parsed.whyTree : [];
    const whyTree: A3WhyNode[] = rawWhyTree
      .map((n: any) => ({
        cause: typeof n.cause === 'string' ? n.cause.trim() : '',
        children: Array.isArray(n.children)
          ? n.children.map((c: any) => ({
              cause: typeof c.cause === 'string' ? c.cause.trim() : '',
              children: Array.isArray(c.children)
                ? c.children.map((g: any) => ({
                    cause: typeof g.cause === 'string' ? g.cause.trim() : '',
                  }))
                : undefined,
            }))
          : undefined,
      }))
      .filter((n: A3WhyNode) => n.cause);

    const rootCauses = Array.isArray(parsed.rootCauses)
      ? parsed.rootCauses
          .map((r: any) => (typeof r === 'string' ? r.trim() : ''))
          .filter((r: string) => r)
      : [];

    const actionsArray = Array.isArray(parsed.tasks)
      ? parsed.tasks
      : Array.isArray(parsed.actions)
      ? parsed.actions
      : [];
    const actions = actionsArray
      .map((a: any) => {
        const name = typeof a.name === 'string' ? a.name.trim() : '';
        if (!name) {
          return null;
        }
        const description =
          typeof a.description === 'string' ? a.description.trim() : '';
        const owner = typeof a.owner === 'string' ? a.owner.trim() : '';
        const group = typeof a.group === 'string' ? a.group.trim() : '';
        const startDate =
          typeof a.startDate === 'string' ? a.startDate.trim() : undefined;
        const endDate =
          typeof a.endDate === 'string' ? a.endDate.trim() : undefined;
        const rawStatus =
          typeof a.status === 'string' ? a.status.trim() : undefined;
        const status =
          rawStatus === 'Not Started' ||
          rawStatus === 'In Progress' ||
          rawStatus === 'Completed'
            ? rawStatus
            : undefined;
        const rawProgress =
          typeof a.progress === 'number' ? a.progress : undefined;
        const progress =
          typeof rawProgress === 'number' && isFinite(rawProgress)
            ? rawProgress
            : undefined;
        return {
          name,
          description,
          owner,
          group,
          startDate,
          endDate,
          status,
          progress,
        };
      })
      .filter((a: any) => a && a.name);

    return {
      problemStatement,
      whyTree,
      rootCauses,
      actions,
    };
  } catch (error) {
    console.error('AI A3 Plan Error:', error);
    return {
      problemStatement: '',
      whyTree: [],
      rootCauses: [],
      actions: [],
    };
  }
};
