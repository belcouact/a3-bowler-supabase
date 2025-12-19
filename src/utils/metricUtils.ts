import { Bowler, Metric } from '../types';

export const isViolation = (
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

export const getBowlerStatusColor = (bowler: Bowler): string => {
  // Default fallback color (Yellow/Gray equivalent or just the default avatar color if no data)
  const DEFAULT_COLOR = 'bg-yellow-100 text-yellow-700';
  const GREEN_COLOR = 'bg-green-100 text-green-700';
  const RED_COLOR = 'bg-red-100 text-red-700';

  if (!bowler.metrics || bowler.metrics.length === 0) {
    return DEFAULT_COLOR;
  }

  // 1. Get all unique months from all metrics
  const allMonthsSet = new Set<string>();
  bowler.metrics?.forEach((metric: Metric) => {
    if (metric.monthlyData) {
      Object.keys(metric.monthlyData).forEach(month => {
        // Only consider months where actual data exists
        if (metric.monthlyData![month].actual) {
           allMonthsSet.add(month);
        }
      });
    }
  });

  // Sort months descending (latest first)
  // Assuming keys are "YYYY-MM" which sort correctly string-wise
  const sortedMonths = Array.from(allMonthsSet).sort().reverse();
  
  // If no data at all
  if (sortedMonths.length === 0) {
    return DEFAULT_COLOR;
  }

  const latestMonth = sortedMonths[0];
  const latest3Months = sortedMonths.slice(0, 3);

  // Check Green Condition: Latest 1 month data meeting target for ALL metrics
  // "meeting the target for all metrics"
  // We only check metrics that have data for this month? 
  // Or if a metric is missing data for the latest month, does it fail the "all metrics" check?
  // "ignore empty data column" implies if the column exists (it does, since it's in sortedMonths), 
  // we check the cells. If a cell is empty, we probably ignore that metric for the calculation?
  // But if ALL metrics are ignored, what then?
  
  let allMet = true;
  let hasCheckedAnyMetric = false;

  if (bowler.metrics) {
    for (const metric of bowler.metrics) {
      const data = metric.monthlyData?.[latestMonth];
      if (data && data.actual && data.target) {
        hasCheckedAnyMetric = true;
        if (isViolation(metric.targetMeetingRule, data.target, data.actual)) {
          allMet = false;
          break;
        }
      }
      // If data is missing for this metric in this month, we ignore it (continue)
    }
  }

  if (hasCheckedAnyMetric && allMet) {
    return GREEN_COLOR;
  }

  // Check Red Condition: If ANY of the metric not meeting the target for the latest consecutive 3 months
  // We need 3 months of data to establish this.
  if (latest3Months.length === 3 && bowler.metrics) {
    for (const metric of bowler.metrics) {
      let consecutiveFailures = 0;
      
      for (const month of latest3Months) {
        const data = metric.monthlyData?.[month];
        if (data && data.actual && data.target) {
          if (isViolation(metric.targetMeetingRule, data.target, data.actual)) {
            consecutiveFailures++;
          } else {
            // Met target or invalid data, break consecutive chain
            break;
          }
        } else {
           // Missing data breaks consecutive chain? 
           // "not meeting the target for the latest consecutive 3 months"
           // If data is missing, we can't say it didn't meet target.
           break;
        }
      }

      if (consecutiveFailures === 3) {
        return RED_COLOR;
      }
    }
  }

  // Yellow: anything else
  return DEFAULT_COLOR;
};
