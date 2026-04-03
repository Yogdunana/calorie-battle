import { request } from './api';
import type { LoginRequest, RegisterRequest, LoginResponse } from '@/types/auth.types';
import type { User } from '@/types/auth.types';

export const authApi = {
  /** 用户登录 */
  login(data: LoginRequest) {
    return request.post<LoginResponse>('/auth/login', data);
  },

  /** 用户注册 */
  register(data: RegisterRequest) {
    return request.post<User>('/auth/register', data);
  },

  /** 刷新 token */
  refreshToken() {
    return request.post<{ accessToken: string }>('/auth/refresh');
  },

  /** 重置密码 */
  resetPassword(data: { account: string; newPassword: string }) {
    return request.post('/auth/reset-password', data);
  },

  /** 修改密码 */
  changePassword(data: { oldPassword: string; newPassword: string }) {
    return request.put('/auth/password', data);
  },

  /** 更新个人资料 */
  updateProfile(data: { username?: string; avatar?: string }) {
    return request.put<User>('/auth/profile', data);
  },
};
