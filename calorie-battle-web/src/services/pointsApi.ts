import { request } from './api';
import type { PointSummary, PointLog } from '@/types/points.types';
import type { PaginatedData, PaginationParams } from '@/types/api.types';

export const pointsApi = {
  /** 获取积分概览 */
  getSummary() {
    return request.get<PointSummary>('/points/summary');
  },

  /** 获取积分记录 */
  getLogs(params?: PaginationParams & { type?: string }) {
    return request.get<PaginatedData<PointLog>>('/points/logs', params);
  },
};
