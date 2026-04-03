import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import useAuthStore from '@/app/store/authStore';
import useResponsive from '@/hooks/useResponsive';
import PcLayout from '@/components/layout/PcLayout';
import MobileLayout from '@/components/layout/MobileLayout';
import type { UserRole } from '@/types/auth.types';

// 懒加载页面组件
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));

// 用户页面
const UserHome = lazy(() => import('@/pages/user/HomePage'));
const UserCheckin = lazy(() => import('@/pages/user/CheckinPage'));
const UserReviews = lazy(() => import('@/pages/user/ReviewProgressPage'));
const UserPoints = lazy(() => import('@/pages/user/PointsPage'));
const UserRedemption = lazy(() => import('@/pages/user/RedemptionPage'));
const UserRanking = lazy(() => import('@/pages/user/RankingPage'));
const UserProfile = lazy(() => import('@/pages/user/ProfilePage'));
const UserChangePassword = lazy(() => import('@/pages/user/ChangePasswordPage'));
const UserWeightPlan = lazy(() => import('@/pages/user/WeightPlanPage'));
const UserPhotos = lazy(() => import('@/pages/user/PhotosPage'));

// 审核员页面
const ReviewerOverview = lazy(() => import('@/pages/reviewer/OverviewPage'));
const ReviewerPending = lazy(() => import('@/pages/reviewer/PendingPage'));
const ReviewerHistory = lazy(() => import('@/pages/reviewer/HistoryPage'));

// 管理员页面
const AdminDashboard = lazy(() => import('@/pages/admin/DashboardPage'));
const AdminReviews = lazy(() => import('@/pages/admin/ReviewManagePage'));
const AdminWeightPlan = lazy(() => import('@/pages/admin/WeightPlanReviewPage'));
const AdminReviewers = lazy(() => import('@/pages/admin/ReviewerManagePage'));
const AdminTasks = lazy(() => import('@/pages/admin/TaskManagePage'));
const AdminActivity = lazy(() => import('@/pages/admin/ActivityConfigPage'));
const AdminItems = lazy(() => import('@/pages/admin/ItemManagePage'));
const AdminRedemptions = lazy(() => import('@/pages/admin/RedemptionVerifyPage'));
const AdminPhotos = lazy(() => import('@/pages/admin/PhotoManagePage'));
const AdminAnnouncements = lazy(() => import('@/pages/admin/AnnouncementPage'));
const AdminAuditLogs = lazy(() => import('@/pages/admin/AuditLogPage'));
const AdminConfigs = lazy(() => import('@/pages/admin/SystemConfigPage'));
const AdminSensitiveWords = lazy(() => import('@/pages/admin/SensitiveWordPage'));
const AdminExport = lazy(() => import('@/pages/admin/DataExportPage'));
const AdminUsers = lazy(() => import('@/pages/admin/UserManagePage'));

/** 加载中组件 */
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 200 }}>
    <Spin size="large" tip="加载中..." />
  </div>
);

/** 带 Suspense 包裹的懒加载组件 */
function LazyLoad(Component: React.LazyExoticComponent<React.ComponentType>) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  );
}

/** 路由守卫：检查认证状态和角色权限 */
function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // 根据角色重定向
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'reviewer':
        return <Navigate to="/reviewer/overview" replace />;
      default:
        return <Navigate to="/user/home" replace />;
    }
  }

  return null;
}

/** 根布局：根据设备类型选择 PC 或移动端布局 */
function RootLayout() {
  const { isMobile } = useResponsive();
  const LayoutComponent = isMobile ? MobileLayout : PcLayout;
  return <LayoutComponent />;
}

/** 登录后根据角色重定向 */
function LoginRedirect() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'reviewer':
      return <Navigate to="/reviewer/overview" replace />;
    default:
      return <Navigate to="/user/home" replace />;
  }
}

const router = createBrowserRouter([
  // 无需登录的页面
  {
    path: '/login',
    element: LazyLoad(LoginPage),
  },
  {
    path: '/register',
    element: LazyLoad(RegisterPage),
  },
  {
    path: '/reset-password',
    element: LazyLoad(ResetPasswordPage),
  },

  // 需要登录的页面
  {
    path: '/',
    element: (
      <>
        <ProtectedRoute />
        <RootLayout />
      </>
    ),
    children: [
      // 根路径重定向
      {
        index: true,
        element: <LoginRedirect />,
      },

      // 用户页面
      {
        path: 'user',
        element: <ProtectedRoute roles={['user']} />,
      },
      {
        path: 'user/home',
        element: LazyLoad(UserHome),
      },
      {
        path: 'user/checkin',
        element: LazyLoad(UserCheckin),
      },
      {
        path: 'user/reviews',
        element: LazyLoad(UserReviews),
      },
      {
        path: 'user/points',
        element: LazyLoad(UserPoints),
      },
      {
        path: 'user/redemption',
        element: LazyLoad(UserRedemption),
      },
      {
        path: 'user/ranking',
        element: LazyLoad(UserRanking),
      },
      {
        path: 'user/profile',
        element: LazyLoad(UserProfile),
      },
      {
        path: 'user/change-password',
        element: LazyLoad(UserChangePassword),
      },
      {
        path: 'user/weight-plan',
        element: LazyLoad(UserWeightPlan),
      },
      {
        path: 'user/photos',
        element: LazyLoad(UserPhotos),
      },

      // 审核员页面
      {
        path: 'reviewer',
        element: <ProtectedRoute roles={['reviewer']} />,
      },
      {
        path: 'reviewer/overview',
        element: LazyLoad(ReviewerOverview),
      },
      {
        path: 'reviewer/pending',
        element: LazyLoad(ReviewerPending),
      },
      {
        path: 'reviewer/history',
        element: LazyLoad(ReviewerHistory),
      },

      // 管理员页面
      {
        path: 'admin',
        element: <ProtectedRoute roles={['admin']} />,
      },
      {
        path: 'admin/dashboard',
        element: LazyLoad(AdminDashboard),
      },
      {
        path: 'admin/reviews',
        element: LazyLoad(AdminReviews),
      },
      {
        path: 'admin/weight-plan',
        element: LazyLoad(AdminWeightPlan),
      },
      {
        path: 'admin/reviewers',
        element: LazyLoad(AdminReviewers),
      },
      {
        path: 'admin/tasks',
        element: LazyLoad(AdminTasks),
      },
      {
        path: 'admin/activity',
        element: LazyLoad(AdminActivity),
      },
      {
        path: 'admin/items',
        element: LazyLoad(AdminItems),
      },
      {
        path: 'admin/redemptions',
        element: LazyLoad(AdminRedemptions),
      },
      {
        path: 'admin/photos',
        element: LazyLoad(AdminPhotos),
      },
      {
        path: 'admin/announcements',
        element: LazyLoad(AdminAnnouncements),
      },
      {
        path: 'admin/audit-logs',
        element: LazyLoad(AdminAuditLogs),
      },
      {
        path: 'admin/configs',
        element: LazyLoad(AdminConfigs),
      },
      {
        path: 'admin/sensitive-words',
        element: LazyLoad(AdminSensitiveWords),
      },
      {
        path: 'admin/export',
        element: LazyLoad(AdminExport),
      },
      {
        path: 'admin/users',
        element: LazyLoad(AdminUsers),
      },
    ],
  },

  // 404 重定向
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;
