import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, theme } from 'antd';
import {
  HomeOutlined,
  CheckSquareOutlined,
  AuditOutlined,
  StarOutlined,
  GiftOutlined,
  TrophyOutlined,
  HeartOutlined,
  CameraOutlined,
  DashboardOutlined,
  TeamOutlined,
  SettingOutlined,
  FileTextOutlined,
  PictureOutlined,
  BellOutlined,
  DatabaseOutlined,
  SafetyOutlined,
  UserOutlined,
  LogoutOutlined,
  KeyOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UnorderedListOutlined,
  CloudUploadOutlined,
  ShopOutlined,
  HistoryOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import useAuthStore from '@/app/store/authStore';
import type { UserRole } from '@/types/auth.types';
import { ROLES } from '@/utils/constants';

const { Header, Sider, Content } = Layout;

/** 用户端菜单 */
const userMenuItems: MenuProps['items'] = [
  { key: '/user/home', icon: <HomeOutlined />, label: '首页' },
  // { key: '/user/checkin', icon: <CheckSquareOutlined />, label: '打卡提交' },  // 功能未开启，已隐藏
  // { key: '/user/reviews', icon: <AuditOutlined />, label: '审核进度' },  // 功能未开启，已隐藏
  // { key: '/user/points', icon: <StarOutlined />, label: '积分管理' },  // 功能未开启，已隐藏
  // { key: '/user/redemption', icon: <GiftOutlined />, label: '积分兑换' },  // 功能未开启，已隐藏
  // { key: '/user/ranking', icon: <TrophyOutlined />, label: '排行榜' },  // 功能未开启，已隐藏
  { key: '/user/weight-plan', icon: <HeartOutlined />, label: '轻盈计划' },
  { key: '/user/photos', icon: <CameraOutlined />, label: '健身掠影' },
];

/** 审核员菜单 */
const reviewerMenuItems: MenuProps['items'] = [
  { key: '/reviewer/overview', icon: <DashboardOutlined />, label: '审核概览' },
  { key: '/reviewer/pending', icon: <UnorderedListOutlined />, label: '待审核列表' },
  { key: '/reviewer/history', icon: <HistoryOutlined />, label: '审核记录' },
];

/** 管理员菜单 */
const adminMenuItems: MenuProps['items'] = [
  { key: '/admin/dashboard', icon: <DashboardOutlined />, label: '数据概览' },
  { key: '/admin/reviews', icon: <AuditOutlined />, label: '审核管理' },
  { key: '/admin/weight-plan', icon: <HeartOutlined />, label: '轻盈计划审核' },
  { key: '/admin/reviewers', icon: <TeamOutlined />, label: '审核员管理' },
  { key: '/admin/tasks', icon: <UnorderedListOutlined />, label: '任务管理' },
  { key: '/admin/activity', icon: <BarChartOutlined />, label: '活动配置' },
  { key: '/admin/items', icon: <ShopOutlined />, label: '商品管理' },
  { key: '/admin/redemptions', icon: <GiftOutlined />, label: '兑换核销' },
  { key: '/admin/photos', icon: <PictureOutlined />, label: '投稿管理' },
  { key: '/admin/announcements', icon: <BellOutlined />, label: '公告管理' },
  { key: '/admin/audit-logs', icon: <FileTextOutlined />, label: '操作日志' },
  { key: '/admin/configs', icon: <SettingOutlined />, label: '系统配置' },
  { key: '/admin/sensitive-words', icon: <SafetyOutlined />, label: '敏感词管理' },
  { key: '/admin/export', icon: <CloudUploadOutlined />, label: '数据导出' },
  { key: '/admin/users', icon: <UserOutlined />, label: '用户管理' },
];

/** 根据角色获取菜单 */
function getMenuByRole(role: UserRole): MenuProps['items'] {
  switch (role) {
    case 'admin':
      return adminMenuItems;
    case 'reviewer':
      return reviewerMenuItems;
    default:
      return userMenuItems;
  }
}

const PcLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { token: themeToken } = theme.useToken();

  const menuItems = user ? getMenuByRole(user.role) : userMenuItems;

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  const userDropdownItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/user/profile'),
    },
    {
      key: 'password',
      icon: <KeyOutlined />,
      label: '修改密码',
      onClick: () => navigate('/user/change-password'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: themeToken.colorBgContainer,
          borderRight: `1px solid ${themeToken.colorBorderSecondary}`,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: `1px solid ${themeToken.colorBorderSecondary}`,
          }}
        >
          <span
            style={{
              fontSize: collapsed ? 16 : 18,
              fontWeight: 700,
              color: themeToken.colorPrimary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {collapsed ? '卡' : '卡路里大作战'}
          </span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: themeToken.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${themeToken.colorBorderSecondary}`,
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              style: { fontSize: 18, cursor: 'pointer' },
              onClick: () => setCollapsed(!collapsed),
            })}
            <span style={{ fontSize: 15, fontWeight: 500 }}>卡路里大作战</span>
          </div>
          <Dropdown menu={{ items: userDropdownItems }} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar size="small" src={user?.avatar} icon={<UserOutlined />} />
              <span>{user?.username || '未登录'}</span>
              <span style={{ color: themeToken.colorTextSecondary, fontSize: 12 }}>
                ({ROLES[user?.role || 'user']})
              </span>
            </div>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: themeToken.colorBgContainer,
            borderRadius: themeToken.borderRadiusLG,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
        <div
          style={{
            textAlign: 'center',
            padding: '12px 0',
            color: '#999',
            fontSize: 12,
          }}
        >
          © 2025 深北莫计协 版权所有
        </div>
      </Layout>
    </Layout>
  );
};

export default PcLayout;
