import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Card,
  Col,
  Row,
  Statistic,
  Spin,
  Button,
  List,
  Tag,
  Empty,
} from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { reviewApi } from '@/services/reviewApi';
import { STATUS_COLORS, CHECKIN_STATUS_MAP } from '@/utils/constants';
import { formatDateTime } from '@/utils/format';
import type { ReviewItem } from '@/types/review.types';

const { Title, Text } = Typography;

const OverviewPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: pendingCountRes, isLoading: loadingPendingCount } = useQuery({
    queryKey: ['reviewer-pending-count'],
    queryFn: () => reviewApi.getPendingReviews({ pageSize: 1 }),
  });

  const { data: recentRes, isLoading: loadingRecent } = useQuery({
    queryKey: ['reviewer-recent-pending'],
    queryFn: () => reviewApi.getPendingReviews({ pageSize: 5 }),
  });

  const { data: historyCountRes, isLoading: loadingHistoryCount } = useQuery({
    queryKey: ['reviewer-history-count'],
    queryFn: () => reviewApi.getReviewHistory({ pageSize: 1 }),
  });

  const pendingTotal = pendingCountRes?.data?.pagination?.total ?? 0;
  const recentList: ReviewItem[] = recentRes?.data?.list ?? [];
  const historyTotal = historyCountRes?.data?.pagination?.total ?? 0;

  const isLoading = loadingPendingCount || loadingRecent || loadingHistoryCount;

  const statCards = [
    {
      title: '待审核数量',
      value: pendingTotal,
      icon: <ClockCircleOutlined />,
      color: '#ff4d4f',
      suffix: '条',
    },
    {
      title: '今日已审核',
      value: '--',
      icon: <ThunderboltOutlined />,
      color: '#722ed1',
      suffix: '条',
    },
    {
      title: '本周已审核',
      value: '--',
      icon: <CalendarOutlined />,
      color: '#13c2c2',
      suffix: '条',
    },
    {
      title: '累计已审核',
      value: historyTotal,
      icon: <CheckCircleOutlined />,
      color: '#52c41a',
      suffix: '条',
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
        <Title level={3}>审核概览</Title>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card) => (
          <Col xs={24} sm={12} md={6} key={card.title}>
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
                value={card.value}
                suffix={typeof card.value === 'number' ? card.suffix : undefined}
                valueStyle={{ color: card.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 快捷入口 */}
      <Card
        style={{ marginBottom: 24 }}
        hoverable
        onClick={() => navigate('/reviewer/pending')}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <Title level={5} style={{ margin: 0 }}>
              前往审核
            </Title>
            <Text type="secondary">
              当前有 {pendingTotal} 条记录待审核，点击查看详情
            </Text>
          </div>
          <Button type="primary" icon={<RightOutlined />}>
            待审核列表
          </Button>
        </div>
      </Card>

      {/* 最近待审核预览 */}
      <Card title="最近待审核记录" style={{ marginBottom: 24 }}>
        {recentList.length === 0 ? (
          <Empty description="暂无待审核记录" />
        ) : (
          <List
            dataSource={recentList}
            renderItem={(item: ReviewItem) => (
              <List.Item
                actions={[
                  <Button
                    key="view"
                    type="link"
                    size="small"
                    onClick={() => navigate('/reviewer/pending')}
                  >
                    去审核
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <span>
                      {item.user?.username || '--'}
                      <Tag
                        color={STATUS_COLORS[item.status] || 'default'}
                        style={{ marginLeft: 8 }}
                      >
                        {CHECKIN_STATUS_MAP[item.status] || item.status}
                      </Tag>
                    </span>
                  }
                  description={
                    <span>
                      {item.task_name || '--'}
                      {item.user?.account ? ` | ${item.user.account}` : ''}
                      {item.task_points != null ? ` | ${item.task_points} 积分` : ''}
                      {item.created_at
                        ? ` | ${formatDateTime(item.created_at)}`
                        : ''}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default OverviewPage;
