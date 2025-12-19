import { Metric } from '../types';

export interface AnalysisResult {
  trend: 'stable' | 'capable' | 'unstable' | 'incapable' | 'improving' | 'degrading';
  achievementRate: number; // percentage 0-100
  suggestion: string[]; // Renamed from anomalies
  summary: string;
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
    const rangeMatch = targetStr.match(/^[{\[]?\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*[}\]]?$/);
    if (rangeMatch) {
        return { min: parseFloat(rangeMatch[1]), max: parseFloat(rangeMatch[2]) };
    }
    const val = parseFloat(targetStr);
    return isNaN(val) ? {} : { val };
};

export const analyzeMetric = async (metric: Metric): Promise<AnalysisResult> => {
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

  4. **Summary:** Provide a professional statistical summary. Mention stability (variation), capability (meeting targets), and any significant shifts. Avoid generic phrases.

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
        model: 'deepseek',
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

export const generateComprehensiveSummary = async (context: string, prompt: string): Promise<string> => {
  try {
    const response = await fetch('https://multi-model-worker.study-llm.me/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek',
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

