import React from 'react';
import { TabBar } from 'antd-mobile';
import {
  AppOutline,
  HeartOutline,
  PictureOutline,
  UserOutline,
} from 'antd-mobile-icons';

interface TabBarProps {
  currentPath: string;
  onTabChange: (path: string) => void;
}

const tabs = [
  { key: '/user/home', title: '首页', icon: <AppOutline /> },
  // { key: '/user/checkin', title: '打卡', icon: <CheckCircleOutline /> },  // 功能未开启，已隐藏
  // { key: '/user/points', title: '积分', icon: <StarOutline /> },  // 功能未开启，已隐藏
  // { key: '/user/ranking', title: '排行', icon: <TrophyOutlined style={{ fontSize: 22 }} /> },  // 功能未开启，已隐藏
  { key: '/user/weight-plan', title: '轻盈计划', icon: <HeartOutline /> },
  { key: '/user/photos', title: '健身掠影', icon: <PictureOutline /> },
  { key: '/user/profile', title: '我的', icon: <UserOutline /> },
];

const TabBarComponent: React.FC<TabBarProps> = ({ currentPath, onTabChange }) => {
  // 找到当前激活的 tab
  const activeKey = tabs.find((tab) => currentPath.startsWith(tab.key))?.key || '/user/home';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#fff',
        borderTop: '1px solid #eee',
        zIndex: 100,
      }}
    >
      <TabBar
        activeKey={activeKey}
        onChange={(key) => onTabChange(key)}
        safeArea
      >
        {tabs.map((tab) => (
          <TabBar.Item key={tab.key} icon={tab.icon} title={tab.title} />
        ))}
      </TabBar>
    </div>
  );
};

export default TabBarComponent;
