import { request } from './api';
import type { ReviewItem, BatchReviewRequest } from '@/types/review.types';
import type { PaginatedData, PaginationParams } from '@/types/api.types';

export const reviewApi = {
  /** 获取待审核列表 */
  getPendingReviews(params?: PaginationParams & { category?: string }) {
    return request.get<PaginatedData<ReviewItem>>('/review/pending', params);
  },

  /** 通过审核 */
  approveReview(id: number) {
    return request.post<ReviewItem>(`/review/${id}/approve`);
  },

  /** 驳回审核 */
  rejectReview(id: number, reason: string) {
    return request.post<ReviewItem>(`/review/${id}/reject`, { comment: reason });
  },

  /** 批量审核 */
  batchReview(data: BatchReviewRequest) {
    return request.post('/review/batch', data);
  },

  /** 获取审核历史 */
  getReviewHistory(params?: PaginationParams & { status?: string }) {
    return request.get<PaginatedData<ReviewItem>>('/review/history', params);
  },
};
