import { Season } from '@/stores/timeStore';

/**
 * Time utility functions for the game time system
 */

/**
 * Convert real-time milliseconds to game time based on speed
 */
export const realTimeToGameTime = (realTimeMs: number, speed: number): number => {
  return (realTimeMs / 1000) * speed; // Returns game minutes
};

/**
 * Convert game time to real-time display format
 */
export const formatGameTime = (hour: number, minute: number): string => {
  const h = hour.toString().padStart(2, '0');
  const m = minute.toString().padStart(2, '0');
  return `${h}:${m}`;
};

/**
 * Format game date for display
 */
export const formatGameDate = (year: number, month: number, day: number): string => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${monthNames[month - 1]} ${day}, ${year}`;
};

/**
 * Get quarter from month number
 */
export const getQuarterFromMonth = (month: number): Season => {
  if (month <= 3) return 'Q1';
  if (month <= 6) return 'Q2';
  if (month <= 9) return 'Q3';
  return 'Q4';
};

/**
 * Get the next quarter
 */
export const getNextQuarter = (currentQuarter: Season): Season => {
  switch (currentQuarter) {
    case 'Q1': return 'Q2';
    case 'Q2': return 'Q3';
    case 'Q3': return 'Q4';
    case 'Q4': return 'Q1';
  }
};

/**
 * Calculate business days in a quarter
 */
export const getBusinessDaysInQuarter = (quarter: Season): number => {
  // Simplified: assume 65 business days per quarter (13 weeks * 5 days)
  return 65;
};

/**
 * Check if current time is within business hours for a region
 */
export const isBusinessHour = (hour: number, region: 'US' | 'EU' | 'ASIA' = 'US'): boolean => {
  const businessHours = {
    US: { start: 9, end: 17 },
    EU: { start: 8, end: 18 },
    ASIA: { start: 9, end: 18 }
  };
  
  const hours = businessHours[region];
  return hour >= hours.start && hour < hours.end;
};

/**
 * Calculate the efficiency multiplier based on time of day
 */
export const getTimeEfficiencyMultiplier = (hour: number): number => {
  // Business hours (9-17) have 100% efficiency
  // Early morning/evening have 80% efficiency
  // Night hours have 60% efficiency
  if (hour >= 9 && hour < 17) return 1.0;
  if ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 20)) return 0.8;
  return 0.6;
};

/**
 * Get seasonal demand modifier
 */
export const getSeasonalDemandModifier = (quarter: Season): number => {
  switch (quarter) {
    case 'Q1': return 1.1; // Tax season
    case 'Q2': return 0.9; // Summer slowdown
    case 'Q3': return 1.0; // Normal
    case 'Q4': return 1.4; // Holiday rush
  }
};

/**
 * Calculate days until next quarter
 */
export const getDaysUntilNextQuarter = (
  currentMonth: number,
  currentDay: number
): number => {
  const quarterMonths = [3, 6, 9, 12];
  const nextQuarterMonth = quarterMonths.find(m => m > currentMonth) || 15; // Next year Q1
  
  if (nextQuarterMonth === 15) {
    // Next year Q1
    return (12 - currentMonth) * 30 + (30 - currentDay) + 30;
  }
  
  return (nextQuarterMonth - currentMonth) * 30 - currentDay;
};

/**
 * Generate time-based random seed for consistent randomness
 */
export const getTimeBasedSeed = (year: number, month: number, day: number): number => {
  return (year * 10000) + (month * 100) + day;
};

/**
 * Calculate compound growth over time periods
 */
export const calculateTimeBasedGrowth = (
  principal: number,
  rate: number,
  periods: number
): number => {
  return principal * Math.pow(1 + rate, periods);
};

/**
 * Get operating cost multiplier based on time
 */
export const getOperatingCostMultiplier = (hour: number, quarter: Season): number => {
  let baseMultiplier = 1.0;
  
  // Night operations cost 20% more
  if (hour < 6 || hour > 22) {
    baseMultiplier *= 1.2;
  }
  
  // Q4 holiday rush increases operational costs
  if (quarter === 'Q4') {
    baseMultiplier *= 1.15;
  }
  
  return baseMultiplier;
};

/**
 * Format time duration for display
 */
export const formatDuration = (days: number): string => {
  if (days < 1) {
    const hours = Math.floor(days * 24);
    return `${hours}h`;
  }
  
  if (days < 30) {
    return `${Math.floor(days)}d`;
  }
  
  const months = Math.floor(days / 30);
  const remainingDays = Math.floor(days % 30);
  
  if (remainingDays === 0) {
    return `${months}mo`;
  }
  
  return `${months}mo ${remainingDays}d`;
};

/**
 * Check if it's a special date (holidays, events)
 */
export const isSpecialDate = (month: number, day: number): string | null => {
  const specialDates = {
    '1-1': 'New Year',
    '1-15': 'Tax Prep Season Start',
    '4-15': 'Tax Deadline',
    '7-4': 'Independence Day',
    '11-25': 'Black Friday',
    '12-25': 'Christmas',
    '12-31': 'New Year\'s Eve'
  };
  
  const key = `${month}-${day}`;
  return specialDates[key as keyof typeof specialDates] || null;
};

/**
 * Get quarter color for UI theming
 */
export const getQuarterColor = (quarter: Season): string => {
  switch (quarter) {
    case 'Q1': return 'blue-500';   // Winter/Spring
    case 'Q2': return 'yellow-500'; // Summer
    case 'Q3': return 'orange-500'; // Fall
    case 'Q4': return 'red-500';    // Holiday season
  }
};

/**
 * Calculate time-weighted average for metrics
 */
export const calculateTimeWeightedAverage = (
  values: Array<{ value: number; timestamp: number }>,
  currentTime: number
): number => {
  if (values.length === 0) return 0;
  
  const weights = values.map(v => {
    const age = currentTime - v.timestamp;
    return Math.exp(-age / (1000 * 60 * 60 * 24)); // Decay over days
  });
  
  const weightedSum = values.reduce((sum, v, i) => sum + v.value * weights[i], 0);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
};
