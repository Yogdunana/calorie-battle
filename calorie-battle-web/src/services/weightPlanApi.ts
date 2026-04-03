import { request } from './api';
import type { WeightRecord } from '@/types/user.types';
import type { PaginatedData, PaginationParams } from '@/types/api.types';

export const weightPlanApi = {
  /** 提交轻盈计划 */
  submit(formData: FormData) {
    return request.post<WeightRecord>('/weight-plan', formData);
  },

  /** 获取我的轻盈计划记录 */
  getMyRecords() {
    return request.get<WeightRecord[]>('/weight-plan/mine');
  },

  /** 获取待审核的轻盈计划记录 */
  getPendingRecords(params?: PaginationParams & { record_type?: string; status?: string }) {
    return request.get<PaginatedData<WeightRecord>>('/weight-plan/pending', params);
  },

  /** 审核轻盈计划记录 */
  reviewRecord(id: number, data: { action: string; weight?: number; body_fat?: number; reject_reason?: string }) {
    return request.post<WeightRecord>(`/weight-plan/${id}/review`, data);
  },
};
