import dayjs from 'dayjs';
import { CHECKIN_STATUS_MAP, STATUS_COLORS } from './constants';

/**
 * 格式化日期
 */
export function formatDate(date?: string | null, format = 'YYYY-MM-DD'): string {
  if (!date) return '-';
  return dayjs(date).format(format);
}

/**
 * 格式化日期时间
 */
export function formatDateTime(date?: string | null): string {
  return formatDate(date, 'YYYY-MM-DD HH:mm:ss');
}

/**
 * 格式化积分显示
 */
export function formatPoints(points: number): string {
  if (points >= 10000) {
    return `${(points / 10000).toFixed(1)}万`;
  }
  return points.toLocaleString();
}

/**
 * 获取状态对应的颜色
 */
export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || 'default';
}

/**
 * 获取状态对应的中文文本
 */
export function getStatusText(status: string): string {
  return CHECKIN_STATUS_MAP[status] || status;
}
