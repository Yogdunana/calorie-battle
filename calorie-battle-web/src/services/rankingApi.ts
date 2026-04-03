import { request } from './api';
import type { RankingItem } from '@/types/user.types';

export const rankingApi = {
  /** 获取排行榜 */
  getRanking() {
    return request.get<RankingItem[]>('/ranking');
  },
};
