import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Badge,
  Alert,
  List,
  Space,
  Spin,
} from 'antd';
import {
  StarOutlined,
  RiseOutlined,
  FallOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  GiftOutlined,
  CameraOutlined,
  ClockCircleOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { pointsApi } from '@/services/pointsApi';
import { checkinApi } from '@/services/checkinApi';
import { adminApi } from '@/services/adminApi';
import useAuthStore from '@/app/store/authStore';
import { ACTIVITY_NAME } from '@/utils/constants';
import { formatPoints } from '@/utils/format';
import type { Announcement } from '@/types/user.types';

const { Title, Text } = Typography;

/** 快捷入口配置 */
const QUICK_ENTRIES = [
  {
    key: 'checkin',
    title: '打卡提交',
    icon: <CheckCircleOutlined style={{ fontSize: 28, color: '#1677ff' }} />,
    path: '/user/checkin',
    color: '#e6f4ff',
  },
  {
    key: 'ranking',
    title: '排行榜',
    icon: <TrophyOutlined style={{ fontSize: 28, color: '#faad14' }} />,
    path: '/user/ranking',
    color: '#fffbe6',
  },
  {
    key: 'redemption',
    title: '积分兑换',
    icon: <GiftOutlined style={{ fontSize: 28, color: '#52c41a' }} />,
    path: '/user/redemption',
    color: '#f6ffed',
  },
  {
    key: 'photos',
    title: '健身掠影',
    icon: <CameraOutlined style={{ fontSize: 28, color: '#722ed1' }} />,
    path: '/user/photos',
    color: '#f9f0ff',
  },
];

/** 公告类型对应的 Alert type */
function getAlertType(type: Announcement['type']): 'info' | 'warning' | 'error' {
  switch (type) {
    case 'warning':
      return 'warning';
    case 'important':
      return 'error';
    default:
      return 'info';
  }
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 获取积分概览
  const { data: pointsData, isLoading: pointsLoading } = useQuery({
    queryKey: ['pointsSummary'],
    queryFn: () => pointsApi.getSummary(),
  });

  // 获取待审核打卡数量
  const { data: pendingData } = useQuery({
    queryKey: ['pendingCheckins'],
    queryFn: () => checkinApi.getMyCheckins({ status: 'pending', pageSize: 1 }),
  });

  // 获取公告列表
  const { data: announcementsData } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => adminApi.getAnnouncements(),
  });

  const announcements = announcementsData?.data || [];
  const activeAnnouncements = announcements.filter((a) => a.status === 'active');
  const pendingCount = pendingData?.data?.pagination?.total || 0;
  const summary = pointsData?.data;

  // 公告自动轮播
  useEffect(() => {
    if (activeAnnouncements.length <= 1) return;

    timerRef.current = setInterval(() => {
      setCurrentAnnouncementIndex((prev) => (prev + 1) % activeAnnouncements.length);
    }, 4000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeAnnouncements.length]);

  return (
    <div className="page-container">
      {/* 活动主题 Banner */}
      <Card
        style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg, #1677ff 0%, #69b1ff 50%, #91caff 100%)',
          border: 'none',
          borderRadius: 12,
        }}
        bodyStyle={{ padding: '24px 32px' }}
      >
        <Space direction="vertical" size={4}>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
            清风爽动，向阳而生
          </Text>
          <Title level={2} style={{ color: '#fff', margin: 0 }}>
            {ACTIVITY_NAME}
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
            {user ? `欢迎回来，${user.username}` : ''}
          </Text>
        </Space>
      </Card>

      {/* 个人总积分卡片 */}
      <Spin spinning={pointsLoading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card className="stat-card" hoverable style={{ borderRadius: 12 }}>
              <Statistic
                title="可用积分"
                value={summary?.available_points ?? summary?.total_points ?? 0}
                formatter={(value) => formatPoints(value as number)}
                valueStyle={{ color: '#1677ff', fontWeight: 700 }}
                prefix={<StarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="stat-card" hoverable style={{ borderRadius: 12 }}>
              <Statistic
                title="累计获得"
                value={summary?.total_earned ?? 0}
                formatter={(value) => formatPoints(value as number)}
                valueStyle={{ color: '#52c41a' }}
                prefix={<RiseOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="stat-card" hoverable style={{ borderRadius: 12 }}>
              <Statistic
                title="已使用"
                value={summary?.total_used ?? 0}
                formatter={(value) => formatPoints(value as number)}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<FallOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </Spin>

      {/* 待审核打卡 + 公告通知 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card
            className="stat-card"
            hoverable
            style={{ borderRadius: 12, cursor: 'pointer' }}
            onClick={() => navigate('/user/reviews')}
          >
            <Space size={16} style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space size={12}>
                <ClockCircleOutlined style={{ fontSize: 24, color: '#faad14' }} />
                <div>
                  <Text type="secondary">待审核打卡</Text>
                  <div>
                    <Text strong style={{ fontSize: 24 }}>
                      {pendingCount}
                    </Text>
                    <Text type="secondary" style={{ marginLeft: 4 }}>
                      条
                    </Text>
                  </div>
                </div>
              </Space>
              {pendingCount > 0 && (
                <Badge count={pendingCount} style={{ backgroundColor: '#ff4d4f' }} />
              )}
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card className="stat-card" style={{ borderRadius: 12 }}>
            <Space size={8} style={{ marginBottom: 8 }}>
              <BellOutlined style={{ color: '#1677ff' }} />
              <Text strong>活动公告</Text>
            </Space>
            {activeAnnouncements.length > 0 ? (
              <div style={{ minHeight: 40 }}>
                <Alert
                  key={currentAnnouncementIndex}
                  type={getAlertType(activeAnnouncements[currentAnnouncementIndex].type)}
                  message={activeAnnouncements[currentAnnouncementIndex].title}
                  description={
                    <div
                      style={{
                        fontSize: 13,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {activeAnnouncements[currentAnnouncementIndex].content}
                    </div>
                  }
                  showIcon
                  style={{ borderRadius: 8 }}
                />
                {activeAnnouncements.length > 1 && (
                  <div style={{ textAlign: 'center', marginTop: 8 }}>
                    {activeAnnouncements.map((_, idx) => (
                      <span
                        key={idx}
                        onClick={() => setCurrentAnnouncementIndex(idx)}
                        style={{
                          display: 'inline-block',
                          width: idx === currentAnnouncementIndex ? 16 : 6,
                          height: 6,
                          borderRadius: 3,
                          margin: '0 3px',
                          background:
                            idx === currentAnnouncementIndex ? '#1677ff' : '#d9d9d9',
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Text type="secondary" style={{ fontSize: 13 }}>
                暂无公告
              </Text>
            )}
          </Card>
        </Col>
      </Row>

      {/* 快捷入口 */}
      <Card
        className="stat-card"
        style={{ borderRadius: 12, marginBottom: 24 }}
        bodyStyle={{ padding: '16px 8px' }}
      >
        <Title level={5} style={{ marginBottom: 16, paddingLeft: 16 }}>
          快捷入口
        </Title>
        <Row gutter={[8, 16]}>
          {QUICK_ENTRIES.map((entry) => (
            <Col key={entry.key} xs={12} sm={6}>
              <div
                onClick={() => navigate(entry.path)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px 8px',
                  borderRadius: 12,
                  background: entry.color,
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    '0 4px 12px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              >
                {entry.icon}
                <Text
                  style={{
                    marginTop: 8,
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {entry.title}
                </Text>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 公告列表 */}
      {activeAnnouncements.length > 0 && (
        <Card
          className="stat-card"
          style={{ borderRadius: 12 }}
          title={
            <Space>
              <BellOutlined />
              <span>全部公告</span>
            </Space>
          }
        >
          <List
            dataSource={activeAnnouncements}
            renderItem={(item) => (
              <List.Item style={{ padding: '12px 0' }}>
                <List.Item.Meta
                  avatar={
                    <Alert
                      type={getAlertType(item.type)}
                      showIcon={false}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        padding: 0,
                        border: 'none',
                        marginTop: 6,
                        minWidth: 8,
                      }}
                    />
                  }
                  title={
                    <Text strong style={{ fontSize: 14 }}>
                      {item.title}
                    </Text>
                  }
                  description={
                    <Space direction="vertical" size={2}>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {item.content}
                      </Text>
                      {item.created_at && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.created_at}
                        </Text>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
};

export default HomePage;
