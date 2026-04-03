import { request } from './api';
import type { Task } from '@/types/checkin.types';
import type { ReviewItem } from '@/types/review.types';
import type { User } from '@/types/auth.types';
import type {
  DashboardStats,
  RedemptionItem,
  Redemption,
  PhotoWork,
  AuditLog,
  SystemConfig,
  Announcement,
  Activity,
  WeightRecord,
} from '@/types/user.types';
import type { PaginatedData, PaginationParams } from '@/types/api.types';

export const adminApi = {
  // ==================== 数据概览 ====================
  /** 获取仪表盘统计数据 */
  getDashboard() {
    return request.get<DashboardStats>('/admin/dashboard');
  },

  // ==================== 审核管理 ====================
  /** 获取所有审核记录 */
  getAllReviews(params?: PaginationParams & { status?: string; reviewer_id?: number; category?: string; userAccount?: string }) {
    return request.get<PaginatedData<ReviewItem>>('/admin/reviews', params);
  },

  /** 覆盖审核结果 */
  overrideReview(id: number, data: { status?: string; newStatus?: string; comment?: string; reason?: string }) {
    return request.post<ReviewItem>(`/admin/reviews/${id}/override`, data);
  },

  /** 通过审核 */
  approveReview(id: number) {
    return request.post<ReviewItem>(`/admin/review/${id}/approve`);
  },

  /** 驳回审核 */
  rejectReview(id: number, reason: string) {
    return request.post<ReviewItem>(`/admin/review/${id}/reject`, { comment: reason });
  },

  // ==================== 审核员管理 ====================
  /** 获取审核员列表 */
  getReviewers() {
    return request.get<User[]>('/admin/reviewers');
  },

  /** 创建审核员 */
  createReviewer(data: { account: string; username: string; password: string }) {
    return request.post<User>('/admin/reviewers', data);
  },

  /** 更新审核员信息 */
  updateReviewer(id: number, data: { username?: string }) {
    return request.put<User>(`/admin/reviewers/${id}`, data);
  },

  /** 切换审核员状态 */
  toggleReviewerStatus(id: number, status: 'active' | 'disabled') {
    return request.put(`/admin/reviewers/${id}/status`, { status });
  },

  /** 重置审核员密码 */
  resetReviewerPassword(id: number) {
    return request.put(`/admin/reviewers/${id}/reset-password`);
  },

  /** 删除审核员 */
  deleteReviewer(id: number) {
    return request.delete(`/admin/reviewers/${id}`);
  },

  // ==================== 任务管理 ====================
  /** 获取所有任务 */
  getTasks() {
    return request.get<Task[]>('/admin/tasks');
  },

  /** 创建任务 */
  createTask(data: { name: string; description: string; points: number; sort_order?: number }) {
    return request.post<Task>('/admin/tasks', data);
  },

  /** 更新任务 */
  updateTask(id: number, data: Partial<Task>) {
    return request.put<Task>(`/admin/tasks/${id}`, data);
  },

  /** 删除任务 */
  deleteTask(id: number) {
    return request.delete(`/admin/tasks/${id}`);
  },

  // ==================== 活动配置 ====================
  /** 获取活动信息 */
  getActivity() {
    return request.get<Activity>('/admin/activity');
  },

  /** 更新活动配置 */
  updateActivity(id: number, data: Partial<Activity> & Record<string, any>) {
    return request.put<Activity>('/admin/activity', data);
  },

  // ==================== 商品管理 ====================
  /** 获取兑换商品列表 */
  getRedemptionItems() {
    return request.get<RedemptionItem[]>('/admin/redemption-items');
  },

  /** 创建兑换商品 */
  createRedemptionItem(data: Partial<RedemptionItem>) {
    return request.post<RedemptionItem>('/admin/redemption-items', data);
  },

  /** 更新兑换商品 */
  updateRedemptionItem(id: number, data: Partial<RedemptionItem>) {
    return request.put<RedemptionItem>(`/admin/redemption-items/${id}`, data);
  },

  /** 删除兑换商品 */
  deleteRedemptionItem(id: number) {
    return request.delete(`/admin/redemption-items/${id}`);
  },

  // ==================== 兑换核销 ====================
  /** 核销兑换码 */
  redeemCode(code: string) {
    return request.post<Redemption>('/admin/redeem-code', { code });
  },

  /** 获取兑换记录 */
  getRedemptionRecords(params?: PaginationParams & { status?: string }) {
    return request.get<PaginatedData<Redemption>>('/admin/redemptions', params);
  },

  /** 获取兑换记录（别名） */
  getRedemptions(params?: PaginationParams & { status?: string }) {
    return request.get<PaginatedData<Redemption>>('/admin/redemptions', params);
  },

  // ==================== 投稿管理 ====================
  /** 获取所有健身掠影 */
  getPhotos(params?: PaginationParams & { status?: string }) {
    return request.get<PaginatedData<PhotoWork>>('/admin/photos', params);
  },

  /** 审核健身掠影 */
  reviewPhoto(id: number, data: { status?: string; action?: string; comment?: string; reject_reason?: string }) {
    return request.post<PhotoWork>(`/admin/photos/${id}/review`, data);
  },

  /** 更新投票配置 */
  updateVotingConfig(data: { max_votes_per_user?: number; voting_enabled?: boolean }) {
    return request.put('/admin/photos/voting-config', data);
  },

  // ==================== 轻盈计划审核 ====================
  /** 获取待审核的轻盈计划 */
  getWeightPlanPending(params?: PaginationParams) {
    return request.get<PaginatedData<WeightRecord>>('/admin/weight-plan/pending', params);
  },

  /** 审核轻盈计划 */
  reviewWeightPlan(id: number, data: { status: 'approved' | 'rejected'; comment?: string; points?: number }) {
    return request.post<WeightRecord>(`/admin/weight-plan/${id}/review`, data);
  },

  // ==================== 操作日志 ====================
  /** 获取操作日志 */
  getAuditLogs(params?: PaginationParams & { action?: string; operator_id?: number; target_type?: string }) {
    return request.get<PaginatedData<AuditLog>>('/admin/audit-logs', params);
  },

  // ==================== 系统配置 ====================
  /** 获取系统配置 */
  getConfigs() {
    return request.get<SystemConfig[]>('/admin/configs');
  },

  /** 更新系统配置 */
  updateConfig(key: string, value: string) {
    return request.put('/admin/configs', { key, value });
  },

  /** 批量更新系统配置 */
  updateConfigs(configsList: { config_key: string; config_value: string }[]) {
    return request.put('/admin/configs', { configs: configsList });
  },

  // ==================== 敏感词管理 ====================
  /** 获取敏感词列表 */
  getSensitiveWords() {
    return request.get<Array<{ id: number; word: string }>>('/admin/sensitive-words');
  },

  /** 添加敏感词 */
  addSensitiveWord(word: string) {
    return request.post('/admin/sensitive-words', { word });
  },

  /** 创建敏感词（别名） */
  createSensitiveWord(params: { word: string; category?: string }) {
    return request.post('/admin/sensitive-words', params);
  },

  /** 删除敏感词 */
  deleteSensitiveWord(id: number) {
    return request.delete(`/admin/sensitive-words/${id}`);
  },

  // ==================== 公告管理 ====================
  /** 获取公告列表 */
  getAnnouncements() {
    return request.get<Announcement[]>('/admin/announcements');
  },

  /** 创建公告 */
  createAnnouncement(data: { title: string; content: string; type: 'info' | 'warning' | 'important' }) {
    return request.post<Announcement>('/admin/announcements', data);
  },

  /** 更新公告 */
  updateAnnouncement(id: number, data: Partial<Announcement>) {
    return request.put<Announcement>(`/admin/announcements/${id}`, data);
  },

  /** 删除公告 */
  deleteAnnouncement(id: number) {
    return request.delete(`/admin/announcements/${id}`);
  },

  // ==================== 数据导出 ====================
  /** 导出数据 */
  exportData(type: string) {
    return request.get<Blob>('/admin/export', { type }, {
      responseType: 'blob',
    });
  },

  // ==================== 用户管理 ====================
  /** 调整用户积分 */
  adjustUserPoints(userId: number, data: { amount: number; reason?: string }) {
    return request.post('/admin/adjust-points', { userId, ...data });
  },

  /** 获取用户列表 */
  getUsers(params?: PaginationParams & { status?: string; role?: string; keyword?: string }) {
    return request.get<PaginatedData<User>>('/admin/users', params);
  },

  /** 切换用户状态 */
  toggleUserStatus(userId: number, status: 'active' | 'disabled') {
    return request.put(`/admin/users/${userId}/status`, { status });
  },

  /** 更新用户状态（别名） */
  updateUserStatus(userId: number, status: string) {
    return request.put(`/admin/users/${userId}/status`, { status });
  },
};
