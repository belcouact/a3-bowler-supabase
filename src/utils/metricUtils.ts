import { Bowler, Metric, A3Case, GroupPerformanceRow } from '../types';

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
    const match = targetStr.match(/^(?:\{|\[)?\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:\}|\])?$/);
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

export const computeGroupPerformanceTableData = (
  bowlers: Bowler[],
  a3Cases: A3Case[],
): GroupPerformanceRow[] => {
  const groupToMetrics: Record<string, Metric[]> = {};
  const metricOwnerById: Record<string, string> = {};

  bowlers.forEach(bowler => {
    const groupName = (bowler.group || 'Ungrouped').trim() || 'Ungrouped';
    const metrics = bowler.metrics || [];

    metrics.forEach(metric => {
      if (!metric || !metric.monthlyData || Object.keys(metric.monthlyData).length === 0) {
        return;
      }

      metricOwnerById[metric.id] = bowler.id;

      if (!groupToMetrics[groupName]) {
        groupToMetrics[groupName] = [];
      }
      groupToMetrics[groupName].push(metric);
    });
  });

  const groupNames = Object.keys(groupToMetrics).sort();

  if (groupNames.length === 0) return [];

  const rows: GroupPerformanceRow[] = [];

  const isValuePresent = (value: unknown) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    return true;
  };

  const hasDataAndTarget = (data: { actual?: unknown; target?: unknown } | undefined) =>
    !!data && isValuePresent(data.actual) && isValuePresent(data.target);

  groupNames.forEach(groupName => {
    const metrics = groupToMetrics[groupName] || [];

    metrics.forEach(metric => {
      const monthly = metric.monthlyData || {};
      const months = Object.keys(monthly)
        .filter(month => {
          const data = monthly[month];
          return hasDataAndTarget(data);
        })
        .sort();

      let latestMet: boolean | null = null;
      let latestActual: string | null = null;
      let fail2 = false;
      let fail3 = false;
      let achievementRate: number | null = null;
      let linkedA3Count = 0;

      if (months.length > 0) {
        const latestMonth = months[months.length - 1];
        const latest2Months = months.slice(-2);
        const latest3Months = months.slice(-3);

        const latestData = monthly[latestMonth];
        if (hasDataAndTarget(latestData)) {
          latestMet = !isViolation(
            metric.targetMeetingRule,
            latestData.target as string | undefined,
            latestData.actual as string | undefined,
          );
          latestActual = `${latestData.actual as string}`;
        }

        if (latest2Months.length === 2) {
          let allFail2 = true;
          for (const month of latest2Months) {
            const data = monthly[month];
            if (
              !hasDataAndTarget(data) ||
              !isViolation(
                metric.targetMeetingRule,
                data.target as string | undefined,
                data.actual as string | undefined,
              )
            ) {
              allFail2 = false;
              break;
            }
          }
          fail2 = allFail2;
        }

        if (latest3Months.length === 3) {
          let allFail3 = true;
          for (const month of latest3Months) {
            const data = monthly[month];
            if (
              !hasDataAndTarget(data) ||
              !isViolation(
                metric.targetMeetingRule,
                data.target as string | undefined,
                data.actual as string | undefined,
              )
            ) {
              allFail3 = false;
              break;
            }
          }
          fail3 = allFail3;
        }

        let totalPoints = 0;
        let metPoints = 0;
        months.forEach(month => {
          const data = monthly[month];
          if (!hasDataAndTarget(data)) return;
          totalPoints += 1;
          const violation = isViolation(
            metric.targetMeetingRule,
            data.target as string | undefined,
            data.actual as string | undefined,
          );
          if (!violation) {
            metPoints += 1;
          }
        });

        achievementRate = totalPoints > 0 ? (metPoints / totalPoints) * 100 : null;

        const isAtRisk = fail2 || fail3;
        if (isAtRisk) {
          linkedA3Count = a3Cases.filter(c => (c.linkedMetricIds || []).includes(metric.id)).length;
        }
      }

      rows.push({
        groupName,
        metricId: metric.id,
        metricName: metric.name,
        bowlerId: metricOwnerById[metric.id],
        latestMet,
        latestActual,
        fail2,
        fail3,
        achievementRate,
        linkedA3Count,
      });
    });
  });

  return rows;
};
