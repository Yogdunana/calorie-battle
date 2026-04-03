export type UserRole = 'user' | 'reviewer' | 'admin';
export type UserStatus = 'active' | 'disabled';

export interface User {
  id: number;
  account: string;
  username: string;
  role: UserRole;
  avatar?: string;
  status: UserStatus;
  total_points: number;
  total_earned: number;
  total_used: number;
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  account: string;
  password: string;
  captchaToken?: string;
  captchaAnswer?: string;
}

export interface RegisterRequest {
  account: string;
  username: string;
  password: string;
  confirmPassword?: string;
  captchaToken?: string;
  captchaAnswer?: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}
