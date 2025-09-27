import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

// Set default timezone to Asia/Dhaka
dayjs.tz.setDefault('Asia/Dhaka');

export const TIMEZONE = 'Asia/Dhaka';

/**
 * Get current time in Asia/Dhaka timezone
 */
export function now() {
  return dayjs().tz(TIMEZONE);
}

/**
 * Convert any date to Asia/Dhaka timezone
 */
export function toDhakaTime(date?: string | Date | dayjs.Dayjs) {
  return dayjs(date).tz(TIMEZONE);
}

/**
 * Format date to Asia/Dhaka timezone with custom format
 */
export function formatDate(date?: string | Date | dayjs.Dayjs, format: string = 'YYYY-MM-DD HH:mm:ss') {
  return toDhakaTime(date).format(format);
}

/**
 * Format date for display in UI (e.g., "Dec 25, 2023")
 */
export function formatDateForDisplay(date?: string | Date | dayjs.Dayjs) {
  return toDhakaTime(date).format('MMM DD, YYYY');
}

/**
 * Format date and time for display (e.g., "Dec 25, 2023 at 2:30 PM")
 */
export function formatDateTimeForDisplay(date?: string | Date | dayjs.Dayjs) {
  return toDhakaTime(date).format('MMM DD, YYYY [at] h:mm A');
}

/**
 * Get relative time (e.g., "2 hours ago", "in 5 minutes")
 */
export function getRelativeTime(date?: string | Date | dayjs.Dayjs) {
  return toDhakaTime(date).fromNow();
}

/**
 * Check if date is today in Asia/Dhaka timezone
 */
export function isToday(date?: string | Date | dayjs.Dayjs) {
  return toDhakaTime(date).isSame(now(), 'day');
}

/**
 * Check if date is yesterday in Asia/Dhaka timezone
 */
export function isYesterday(date?: string | Date | dayjs.Dayjs) {
  return toDhakaTime(date).isSame(now().subtract(1, 'day'), 'day');
}

/**
 * Get start of day in Asia/Dhaka timezone
 */
export function startOfDay(date?: string | Date | dayjs.Dayjs) {
  return toDhakaTime(date).startOf('day');
}

/**
 * Get end of day in Asia/Dhaka timezone
 */
export function endOfDay(date?: string | Date | dayjs.Dayjs) {
  return toDhakaTime(date).endOf('day');
}

/**
 * Convert date to ISO string in Asia/Dhaka timezone
 */
export function toISOString(date?: string | Date | dayjs.Dayjs) {
  return toDhakaTime(date).toISOString();
}

/**
 * Smart date formatting for transaction lists
 * - Today: "Today at 2:30 PM"
 * - Yesterday: "Yesterday at 2:30 PM"  
 * - This week: "Monday at 2:30 PM"
 * - Older: "Dec 25, 2023 at 2:30 PM"
 */
export function formatTransactionDate(date?: string | Date | dayjs.Dayjs) {
  const dhakaDate = toDhakaTime(date);
  const nowDate = now();
  
  if (dhakaDate.isSame(nowDate, 'day')) {
    return `Today at ${dhakaDate.format('h:mm A')}`;
  }
  
  if (dhakaDate.isSame(nowDate.subtract(1, 'day'), 'day')) {
    return `Yesterday at ${dhakaDate.format('h:mm A')}`;
  }
  
  if (dhakaDate.isSame(nowDate, 'week')) {
    return `${dhakaDate.format('dddd')} at ${dhakaDate.format('h:mm A')}`;
  }
  
  return formatDateTimeForDisplay(dhakaDate);
}

export default dayjs;