import { useMutation } from '@tanstack/react-query';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/app/store/authStore';
import { authApi } from '@/services/authApi';
import type { LoginRequest, RegisterRequest } from '@/types/auth.types';

/**
 * 认证相关 hook
 * 封装登录、注册、登出等操作
 */
export default function useAuth() {
  const navigate = useNavigate();
  const { login: storeLogin, logout: storeLogout, user } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response) => {
      const { accessToken, user: userInfo } = response.data;
      storeLogin(userInfo, accessToken);
      message.success('登录成功');

      // 根据角色跳转到不同页面
      switch (userInfo.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'reviewer':
          navigate('/reviewer/overview');
          break;
        default:
          navigate('/user/home');
          break;
      }
    },
    onError: (error: Error) => {
      message.error(error.message || '登录失败，请检查账号密码');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: () => {
      message.success('注册成功，请登录');
      navigate('/login');
    },
    onError: (error: Error) => {
      message.error(error.message || '注册失败，请稍后重试');
    },
  });

  const logout = () => {
    storeLogout();
    message.success('已退出登录');
    navigate('/login');
  };

  return {
    user,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
}
