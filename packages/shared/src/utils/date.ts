import { 
  addDays, 
  addHours, 
  addMinutes, 
  subDays, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  isAfter,
  isBefore,
  isEqual,
  parseISO
} from 'date-fns';

export function createDateRange(
  start: Date | string,
  end: Date | string
): { from: Date; to: Date } {
  const startDate = typeof start === 'string' ? parseISO(start) : start;
  const endDate = typeof end === 'string' ? parseISO(end) : end;
  
  return {
    from: startOfDay(startDate),
    to: endOfDay(endDate),
  };
}

export function getDateRangePresets() {
  const now = new Date();
  
  return {
    today: createDateRange(now, now),
    yesterday: createDateRange(subDays(now, 1), subDays(now, 1)),
    last7Days: createDateRange(subDays(now, 6), now),
    last30Days: createDateRange(subDays(now, 29), now),
    thisWeek: createDateRange(startOfWeek(now), endOfWeek(now)),
    thisMonth: createDateRange(startOfMonth(now), endOfMonth(now)),
    last3Months: createDateRange(subDays(now, 89), now),
    last6Months: createDateRange(subDays(now, 179), now),
    lastYear: createDateRange(subDays(now, 364), now),
  };
}

export function isDateInRange(date: Date, range: { from: Date; to: Date }): boolean {
  return (isAfter(date, range.from) || isEqual(date, range.from)) &&
         (isBefore(date, range.to) || isEqual(date, range.to));
}

export function addTime(date: Date, time: { days?: number; hours?: number; minutes?: number }): Date {
  let result = date;
  
  if (time.days) {
    result = addDays(result, time.days);
  }
  
  if (time.hours) {
    result = addHours(result, time.hours);
  }
  
  if (time.minutes) {
    result = addMinutes(result, time.minutes);
  }
  
  return result;
}

export function createExpirationDate(hours: number): Date {
  return addTime(new Date(), { hours });
}

export function isExpired(date: Date): boolean {
  return isBefore(date, new Date());
}

export function timeUntilExpiration(date: Date): number {
  return Math.max(0, date.getTime() - Date.now());
}

export function getTimezones(): Array<{ value: string; label: string; offset: string }> {
  return [
    { value: 'America/New_York', label: 'Eastern Time', offset: 'UTC-5' },
    { value: 'America/Chicago', label: 'Central Time', offset: 'UTC-6' },
    { value: 'America/Denver', label: 'Mountain Time', offset: 'UTC-7' },
    { value: 'America/Los_Angeles', label: 'Pacific Time', offset: 'UTC-8' },
    { value: 'Europe/London', label: 'Greenwich Mean Time', offset: 'UTC+0' },
    { value: 'Europe/Paris', label: 'Central European Time', offset: 'UTC+1' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time', offset: 'UTC+9' },
    { value: 'Asia/Shanghai', label: 'China Standard Time', offset: 'UTC+8' },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time', offset: 'UTC+10' },
    { value: 'UTC', label: 'Coordinated Universal Time', offset: 'UTC+0' },
  ];
}

export function formatTimeAgo(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
}