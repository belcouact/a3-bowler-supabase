import { Metric } from '../context/AppContext';

export interface AnalysisResult {
  trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
  achievementRate: number; // percentage 0-100
  suggestion: string[]; // Renamed from anomalies
  summary: string;
}

export const analyzeMetric = async (metric: Metric): Promise<AnalysisResult> => {
  const months = Object.keys(metric.monthlyData || {}).sort();
  const dataPoints: { month: string; actual: string; target: string }[] = [];

  months.forEach(month => {
    const data = metric.monthlyData?.[month];
    if (data && data.actual) {
      dataPoints.push({
        month,
        actual: data.actual,
        target: data.target || 'N/A'
      });
    }
  });

  if (dataPoints.length === 0) {
    return {
      trend: 'stable',
      achievementRate: 0,
      suggestion: [],
      summary: 'No data available for analysis.'
    };
  }

  const prompt = `
  You are an expert data analyst. Analyze the following metric data.

  Metric Context:
  - Name: "${metric.name}"
  - Definition: "${metric.definition || 'N/A'}"
  - Attribute: "${metric.attribute || 'Individual Data'}" (Important: Use this to determine how to interpret the numbers. e.g., 'Accumulative' means data adds up, 'Moving Average' smooths data.)
  - Target Meeting Rule: "${metric.targetMeetingRule || 'gte'}" (gte: Higher is better, lte: Lower is better, within_range: Must be between values).

  Data (Month | Actual | Target):
  ${dataPoints.map(p => `${p.month} | ${p.actual} | ${p.target}`).join('\n')}

  Instructions:
  1. Calculate the Target Achievement Rate (percentage of data points meeting the target based on the rule).
  2. Determine the Trend (increasing, decreasing, stable, or fluctuating). Consider the Attribute (e.g., for Accumulative, look at the rate of growth).
  3. Provide a concise Summary of the performance.
  4. Provide Suggestions for improvement or highlight significant abnormalities/insights.

  Response Format:
  You must return a valid JSON object ONLY, with no markdown or extra text.
  Structure:
  {
    "trend": "increasing" | "decreasing" | "stable" | "fluctuating",
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

