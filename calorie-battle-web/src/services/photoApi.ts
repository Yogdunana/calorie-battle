import { request } from './api';
import type { PhotoWork, VoteRecord } from '@/types/user.types';
import type { PaginatedData, PaginationParams } from '@/types/api.types';

export const photoApi = {
  /** 提交健身掠影 */
  submit(formData: FormData) {
    return request.post<PhotoWork>('/photo', formData);
  },

  /** 获取健身掠影列表 */
  getPhotos(params?: PaginationParams) {
    return request.get<PaginatedData<PhotoWork>>('/photo', params);
  },

  /** 投票 */
  vote(id: number) {
    return request.post<VoteRecord>(`/photo/${id}/vote`);
  },

  /** 获取我的投票记录 */
  getMyVotes() {
    return request.get<VoteRecord[]>('/photo/my-votes');
  },
};
