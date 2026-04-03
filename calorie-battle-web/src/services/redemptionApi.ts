import { request } from './api';
import type { RedemptionItem, Redemption } from '@/types/user.types';
import type { PaginatedData, PaginationParams } from '@/types/api.types';

export const redemptionApi = {
  /** 获取兑换商品列表 */
  getItems() {
    return request.get<RedemptionItem[]>('/redemption/items');
  },

  /** 兑换商品 */
  redeem(itemId: number) {
    return request.post<Redemption>('/redemption/redeem', { item_id: itemId });
  },

  /** 获取我的兑换记录 */
  getMyRedemptions(params?: PaginationParams) {
    return request.get<PaginatedData<Redemption>>('/redemption/mine', params);
  },
};
