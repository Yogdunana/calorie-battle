import { create } from 'zustand';
import type { User } from '@/types/auth.types';

interface AuthStoreState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const useAuthStore = create<AuthStoreState>((set) => {
  // 从 localStorage 初始化状态
  const savedToken = localStorage.getItem('accessToken');
  const savedUser = localStorage.getItem('user');

  let initialUser: User | null = null;
  if (savedUser) {
    try {
      initialUser = JSON.parse(savedUser);
    } catch {
      localStorage.removeItem('user');
    }
  }

  return {
    user: initialUser,
    accessToken: savedToken,
    isAuthenticated: !!(savedToken && initialUser),

    login: (user: User, token: string) => {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({
        user,
        accessToken: token,
        isAuthenticated: true,
      });
    },

    logout: () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
      });
    },

    updateUser: (userData: Partial<User>) => {
      set((state) => {
        const updatedUser = state.user ? { ...state.user, ...userData } : null;
        if (updatedUser) {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        return { user: updatedUser };
      });
    },
  };
});

export default useAuthStore;
