import { request } from './api';
import type { Task, Checkin } from '@/types/checkin.types';
import type { PaginatedData, PaginationParams } from '@/types/api.types';

export const checkinApi = {
  /** 获取任务列表 */
  getTasks() {
    return request.get<Task[]>('/checkin/tasks');
  },

  /** 提交打卡 */
  submitCheckin(formData: FormData) {
    return request.post<Checkin>('/checkin/checkins', formData);
  },

  /** 获取我的打卡记录 */
  getMyCheckins(params?: PaginationParams & { status?: string }) {
    return request.get<PaginatedData<Checkin>>('/checkin/checkins/mine', params);
  },
};
