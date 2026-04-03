import React from 'react';
import { Card, Col, Row, Statistic, Typography, Spin } from 'antd';
import {
  UserOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  FireOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/services/adminApi';

const { Title } = Typography;

const DashboardPage: React.FC = () => {
  const { data: response, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.getDashboard(),
  });

  const stats = response?.data;

  const totalUsers = stats?.totalUsers ?? stats?.total_users;
  const totalCheckins = stats?.total_checkins;
  const totalPoints = stats?.totalPointsIssued ?? stats?.total_points_issued;
  const pendingReviews = stats?.pendingCount ?? stats?.pending_reviews;
  const todayCheckins = stats?.todaySubmissions ?? stats?.today_checkins;
  const weekCheckins = stats?.week_checkins;
  const activeTasks = stats?.active_tasks;
  const totalPointsRedeemed = stats?.total_points_redeemed;

  const cards = [
    {
      title: '总用户数',
      value: totalUsers,
      icon: <UserOutlined />,
      color: '#1890ff',
      suffix: '人',
    },
    {
      title: '总打卡数',
      value: totalCheckins,
      icon: <CheckCircleOutlined />,
      color: '#52c41a',
      suffix: '次',
    },
    {
      title: '总积分发放',
      value: totalPoints,
      icon: <TrophyOutlined />,
      color: '#faad14',
      suffix: '分',
    },
    {
      title: '待审核数量',
      value: pendingReviews,
      icon: <ClockCircleOutlined />,
      color: '#ff4d4f',
      suffix: '条',
    },
    {
      title: '今日打卡',
      value: todayCheckins,
      icon: <FireOutlined />,
      color: '#722ed1',
      suffix: '次',
    },
    {
      title: '本周打卡',
      value: weekCheckins,
      icon: <CalendarOutlined />,
      color: '#13c2c2',
      suffix: '次',
    },
    {
      title: '活跃任务',
      value: activeTasks,
      icon: <ThunderboltOutlined />,
      color: '#eb2f96',
      suffix: '个',
    },
    {
      title: '已兑换积分',
      value: totalPointsRedeemed,
      icon: <StarOutlined />,
      color: '#fa8c16',
      suffix: '分',
    },
  ];

  if (isLoading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>数据概览</Title>
      </div>
      <Row gutter={[16, 16]}>
        {cards.map((card) => (
          <Col xs={24} sm={12} md={8} lg={6} key={card.title}>
            <Card hoverable>
              <Statistic
                title={
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: `${card.color}15`,
                        color: card.color,
                        fontSize: 16,
                      }}
                    >
                      {card.icon}
                    </span>
                    {card.title}
                  </span>
                }
                value={card.value ?? '--'}
                suffix={card.value != null ? card.suffix : undefined}
                valueStyle={{ color: card.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default DashboardPage;
