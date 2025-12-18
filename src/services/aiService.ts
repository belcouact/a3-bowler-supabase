import { Metric, MetricData } from '../context/AppContext';

export interface AnalysisResult {
  trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
  achievementRate: number; // percentage 0-100
  anomalies: string[];
  summary: string;
}

const isViolation = (
  rule: 'gte' | 'lte' | 'within_range' | undefined,
  targetStr: string | undefined,
  actualStr: string | undefined
): boolean => {
  if (!actualStr || !targetStr) return false;
  
  const actual = parseFloat(actualStr);
  if (isNaN(actual)) return false;

  const effectiveRule = rule || 'gte';

  if (effectiveRule === 'gte') {
    const target = parseFloat(targetStr);
    if (isNaN(target)) return false;
    return actual < target;
  }

  if (effectiveRule === 'lte') {
    const target = parseFloat(targetStr);
    if (isNaN(target)) return false;
    return actual > target;
  }

  if (effectiveRule === 'within_range') {
    const match = targetStr.match(/^[{\[]?\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*[}\]]?$/);
    if (match) {
      const min = parseFloat(match[1]);
      const max = parseFloat(match[2]);
      if (!isNaN(min) && !isNaN(max)) {
        return actual < min || actual > max;
      }
    }
  }

  return false;
};

export const analyzeMetric = (metric: Metric): AnalysisResult => {
  const months = Object.keys(metric.monthlyData || {}).sort();
  const dataPoints: { month: string; actual: number; target: string; isViolation: boolean }[] = [];

  months.forEach(month => {
    const data = metric.monthlyData?.[month];
    if (data && data.actual && !isNaN(parseFloat(data.actual))) {
      const actualVal = parseFloat(data.actual);
      dataPoints.push({
        month,
        actual: actualVal,
        target: data.target,
        isViolation: isViolation(metric.targetMeetingRule, data.target, data.actual)
      });
    }
  });

  if (dataPoints.length === 0) {
    return {
      trend: 'stable',
      achievementRate: 0,
      anomalies: [],
      summary: 'No data available for analysis.'
    };
  }

  // 1. Calculate Achievement Rate
  const totalPoints = dataPoints.filter(p => p.target).length;
  const violationCount = dataPoints.filter(p => p.target && p.isViolation).length;
  const successCount = totalPoints - violationCount;
  const achievementRate = totalPoints > 0 ? (successCount / totalPoints) * 100 : 0;

  // 2. Calculate Trend (Simple Linear Regression or comparison of recent points)
  let trend: AnalysisResult['trend'] = 'stable';
  if (dataPoints.length >= 2) {
    const values = dataPoints.map(p => p.actual);
    const n = values.length;
    // Simple slope calculation (using index as x)
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumXX += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Determine trend based on slope and some threshold
    // Also consider standard deviation for fluctuation
    const avg = sumY / n;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    const cv = Math.abs(avg) > 0.0001 ? stdDev / Math.abs(avg) : 0; // Coefficient of Variation

    if (cv > 0.2 && Math.abs(slope) < (stdDev * 0.1)) {
        trend = 'fluctuating';
    } else if (slope > 0.01 * Math.abs(avg)) { // somewhat arbitrary threshold
        trend = 'increasing';
    } else if (slope < -0.01 * Math.abs(avg)) {
        trend = 'decreasing';
    } else {
        trend = 'stable';
    }
  }

  // 3. Detect Anomalies (Z-score)
  const anomalies: string[] = [];
  if (dataPoints.length >= 3) {
      const values = dataPoints.map(p => p.actual);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length);

      if (stdDev > 0) {
          dataPoints.forEach(p => {
              const zScore = (p.actual - mean) / stdDev;
              if (Math.abs(zScore) > 2) { // 2 standard deviations
                  anomalies.push(`${p.month}: Value ${p.actual} is significantly ${p.actual > mean ? 'higher' : 'lower'} than average.`);
              }
          });
      }
  }

  // 4. Generate Summary
  const lastPoint = dataPoints[dataPoints.length - 1];
  let summary = `The metric shows a ${trend} trend. `;
  summary += `Target achievement rate is ${achievementRate.toFixed(1)}%. `;
  
  if (dataPoints.length > 0) {
      summary += `The most recent value for ${lastPoint.month} is ${lastPoint.actual}. `;
  }

  if (anomalies.length > 0) {
      summary += `Detected ${anomalies.length} anomal${anomalies.length > 1 ? 'ies' : 'y'}.`;
  } else {
      summary += `No significant anomalies detected.`;
  }

  return {
    trend,
    achievementRate,
    anomalies,
    summary
  };
};
