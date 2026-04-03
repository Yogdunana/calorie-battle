import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import useAuthStore from '@/app/store/authStore';
import useResponsive from '@/hooks/useResponsive';
import TabBar from './TabBar';

const MobileLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { isMobile } = useResponsive();

  if (!isMobile) {
    return null;
  }

  const handleAvatarClick = () => {
    navigate('/user/profile');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#f5f5f5',
      }}
    >
      {/* 顶部导航栏 */}
      <div
        style={{
          height: 48,
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid #eee',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 700, color: '#1677ff' }}>
          卡路里大作战
        </span>
        <Avatar
          size={32}
          src={user?.avatar}
          icon={<UserOutlined />}
          onClick={handleAvatarClick}
          style={{ cursor: 'pointer' }}
        />
      </div>

      {/* 内容区域 */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          paddingBottom: 50,
        }}
      >
        <Outlet />
      </div>

      {/* 底部 TabBar */}
      <TabBar currentPath={location.pathname} onTabChange={(path) => navigate(path)} />
    </div>
  );
};

export default MobileLayout;
