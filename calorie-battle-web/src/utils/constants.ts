import type { UserRole } from '@/types/auth.types';

/** 用户角色枚举 */
export const ROLES: Record<UserRole, string> = {
  user: '普通用户',
  reviewer: '审核员',
  admin: '管理员',
};

/** 打卡状态映射 */
export const CHECKIN_STATUS_MAP: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
};

/** 状态颜色映射 */
export const STATUS_COLORS: Record<string, string> = {
  pending: 'blue',
  approved: 'green',
  rejected: 'red',
  active: 'green',
  inactive: 'default',
  disabled: 'red',
  completed: 'green',
  cancelled: 'default',
  info: 'blue',
  warning: 'orange',
  important: 'red',
};

/** 活动名称 */
export const ACTIVITY_NAME = '卡路里大作战';

/** API 基础地址 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/** 文件上传基础地址 */
export const UPLOAD_BASE_URL = import.meta.env.VITE_UPLOAD_BASE_URL || '/uploads';
