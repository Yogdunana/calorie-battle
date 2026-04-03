import React, { useState } from 'react';
import {
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Select,
  Space,
  Spin,
  Alert,
  Tooltip,
} from 'antd';
import {
  StarOutlined,
  RiseOutlined,
  FallOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { pointsApi } from '@/services/pointsApi';
import { formatPoints, formatDateTime } from '@/utils/format';
import type { PointLog, PointLogType } from '@/types/points.types';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

/** 积分变动类型映射 */
const CHANGE_TYPE_MAP: Record<PointLogType, { label: string; color: string }> = {
  earn: { label: '获得', color: 'green' },
  spend: { label: '使用', color: 'red' },
  adjust: { label: '调整', color: 'blue' },
};

/** 筛选选项 */
const TYPE_FILTER_OPTIONS = [
  { label: '全部', value: '' },
  { label: '获得', value: 'earn' },
  { label: '使用', value: 'spend' },
  { label: '调整', value: 'adjust' },
];

const PointsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [changeType, setChangeType] = useState<string>('');

  // 获取积分概览
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['pointsSummary'],
    queryFn: () => pointsApi.getSummary(),
  });

  // 获取积分明细
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['pointsLogs', page, pageSize, changeType],
    queryFn: () =>
      pointsApi.getLogs({
        page,
        pageSize,
        type: changeType || undefined,
      }),
  });

  const summary = summaryData?.data;
  const logs = logsData?.data?.list ?? [];
  const pagination = logsData?.data?.pagination;

  // 表格列定义
  const columns: ColumnsType<PointLog> = [
    {
      title: '变动时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (val: string) => formatDateTime(val),
    },
    {
      title: '变动类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: PointLogType) => {
        const config = CHANGE_TYPE_MAP[type] || { label: type, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '变动数值',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (amount: number, record: PointLog) => {
        const color = record.type === 'earn' ? '#52c41a' : record.type === 'spend' ? '#ff4d4f' : '#1677ff';
        const prefix = record.type === 'earn' ? '+' : record.type === 'spend' ? '-' : '';
        return (
          <Text strong style={{ color }}>
            {prefix}{amount}
          </Text>
        );
      },
    },
    {
      title: '余额',
      dataIndex: 'balance_after',
      key: 'balance_after',
      width: 120,
      align: 'right',
      render: (val: number) => formatPoints(val),
    },
    {
      title: '来源/说明',
      dataIndex: 'source',
      key: 'source',
      ellipsis: true,
      render: (source: string, record: PointLog) => (
        <Tooltip title={record.description || source}>
          <Text>{source || record.description || '-'}</Text>
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>积分管理</Title>
      </div>

      {/* 积分总览 */}
      <Spin spinning={summaryLoading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card hoverable style={{ borderRadius: 12 }}>
              <Statistic
                title="当前可用积分"
                value={summary?.available_points ?? summary?.total_points ?? 0}
                formatter={(value) => formatPoints(value as number)}
                valueStyle={{ color: '#1677ff', fontWeight: 700 }}
                prefix={<StarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card hoverable style={{ borderRadius: 12 }}>
              <Statistic
                title="累计获得积分"
                value={summary?.total_earned ?? 0}
                formatter={(value) => formatPoints(value as number)}
                valueStyle={{ color: '#52c41a' }}
                prefix={<RiseOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card hoverable style={{ borderRadius: 12 }}>
              <Statistic
                title="已使用积分"
                value={summary?.total_used ?? 0}
                formatter={(value) => formatPoints(value as number)}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<FallOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </Spin>

      {/* 积分有效期提示 */}
      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 24, borderRadius: 8 }}
        message="积分有效期提示"
        description="活动期间获得的积分将在活动结束后统一清零，请及时使用积分兑换商品。"
      />

      {/* 积分明细 */}
      <Card
        title="积分明细"
        style={{ borderRadius: 12 }}
        extra={
          <Space>
            <Text type="secondary">筛选：</Text>
            <Select
              value={changeType}
              onChange={(val) => {
                setChangeType(val);
                setPage(1);
              }}
              options={TYPE_FILTER_OPTIONS}
              style={{ width: 120 }}
              size="small"
            />
          </Space>
        }
      >
        <Table<PointLog>
          rowKey="id"
          columns={columns}
          dataSource={logs}
          loading={logsLoading}
          locale={{ emptyText: '暂无积分记录' }}
          pagination={{
            current: page,
            pageSize,
            total: pagination?.total ?? 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (newPage, newPageSize) => {
              setPage(newPage);
              setPageSize(newPageSize);
            },
          }}
          scroll={{ x: 700 }}
        />
      </Card>
    </div>
  );
};

export default PointsPage;
