import { Metric } from '../context/AppContext';

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

  // 2. Calculate Trend
  let trend: AnalysisResult['trend'] = 'stable';
  let slope = 0;
  
  // Normalize attribute
  const attribute = (metric.attribute || 'individual data').toLowerCase();
  const isAccumulative = attribute.includes('accumulative') || attribute.includes('cumulative');
  const isMovingAverage = attribute.includes('moving') || attribute.includes('average');

  if (dataPoints.length >= 2) {
    let values = dataPoints.map(p => p.actual);
    let performTrendAnalysis = true;
    
    // For accumulative data, we analyze the trend of the *rate of change* (deltas)
    // unless there are too few points, then we fall back to absolute values but that's trivial for accumulative.
    if (isAccumulative) {
        if (values.length >= 3) {
            const deltas = [];
            for(let i = 1; i < values.length; i++) {
                deltas.push(values[i] - values[i-1]);
            }
            values = deltas;
        } else {
            // Not enough data to determine trend of growth rate (need at least 2 intervals, so 3 points)
            trend = 'stable';
            performTrendAnalysis = false;
        }
    }

    if (performTrendAnalysis && values.length >= 2) {
        const n = values.length;
        // Simple slope calculation (using index as x)
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += values[i];
        sumXY += i * values[i];
        sumXX += i * i;
        }
        slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        
        const avg = sumY / n;
        const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / n;
        const stdDev = Math.sqrt(variance);

        const cv = Math.abs(avg) > 0.0001 ? stdDev / Math.abs(avg) : 0; // Coefficient of Variation

        // Adjusted thresholds
        if (cv > 0.2 && Math.abs(slope) < (stdDev * 0.1)) {
            trend = 'fluctuating';
        } else if (slope > 0.01 * Math.abs(avg)) { 
            trend = 'increasing';
        } else if (slope < -0.01 * Math.abs(avg)) {
            trend = 'decreasing';
        } else {
            trend = 'stable';
        }
    }
  }

  // 3. Detect Anomalies (Z-score)
  const anomalies: string[] = [];
  if (dataPoints.length >= 3) {
      let values = dataPoints.map(p => p.actual);
      let valueMap = dataPoints.map((p, i) => ({ val: p.actual, month: p.month, originalIndex: i }));

      // For accumulative, check deltas for anomalies
      if (isAccumulative) {
          const deltas = [];
          for(let i = 1; i < values.length; i++) {
              deltas.push(values[i] - values[i-1]);
          }
          values = deltas;
          // Map deltas back to the month where the jump happened (the second month of the pair)
          valueMap = valueMap.slice(1).map((v, i) => ({ ...v, val: values[i] })); 
      }

      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length);

      if (stdDev > 0) {
          valueMap.forEach(p => {
              const zScore = (p.val - mean) / stdDev;
              if (Math.abs(zScore) > 2) { // 2 standard deviations
                  const direction = p.val > mean ? 'higher' : 'lower';
                  const context = isAccumulative ? 'increase' : 'value';
                  anomalies.push(`${p.month}: The ${context} (${p.val.toFixed(2)}) is significantly ${direction} than average.`);
              }
          });
      }
  }

  // 4. Generate Summary
  const lastPoint = dataPoints[dataPoints.length - 1];
  let summary = '';
  
  // Trend Interpretation based on Target Rule
  const rule = metric.targetMeetingRule || 'gte';
  let trendAssessment = '';
  
  if (trend === 'stable') {
      trendAssessment = 'remaining stable';
  } else if (trend === 'fluctuating') {
      trendAssessment = 'fluctuating significantly';
  } else {
      // Directional trend
      let isGood = false;
      if (rule === 'gte') { // Higher is better
          isGood = trend === 'increasing';
      } else if (rule === 'lte') { // Lower is better
          isGood = trend === 'decreasing';
      } else { // Within range
          // For within_range, moving towards center is good, but simple slope doesn't tell us center.
          // We'll just report the direction.
      }
      
      const direction = trend;
      if (rule !== 'within_range') {
        trendAssessment = `showing a ${isGood ? 'favorable' : 'concerning'} ${direction} trend`;
      } else {
        trendAssessment = `showing a ${direction} trend`;
      }
  }

  // Attribute Context
  if (isAccumulative) {
      summary += `Based on the accumulative data analysis, the rate of growth is ${trendAssessment}. `;
  } else if (isMovingAverage) {
      summary += `The moving average indicates the metric is ${trendAssessment}. `;
  } else {
      summary += `The metric is ${trendAssessment}. `;
  }

  summary += `Target achievement rate is ${achievementRate.toFixed(1)}%. `;
  
  if (dataPoints.length > 0) {
      summary += `The most recent value for ${lastPoint.month} is ${lastPoint.actual}. `;
  }

  if (anomalies.length > 0) {
      summary += `Detected ${anomalies.length} anomal${anomalies.length > 1 ? 'ies' : 'y'}: ${anomalies.join(' ')}`;
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
