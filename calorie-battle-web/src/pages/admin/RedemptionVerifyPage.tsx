import React, { useState, useCallback } from 'react';
import {
  Typography,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  Card,
  Descriptions,
  message,
  Alert,
} from 'antd';
import { ScanOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/adminApi';
import { STATUS_COLORS } from '@/utils/constants';
import type { Redemption } from '@/types/user.types';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Search } = Input;

const REDEMPTION_STATUS_MAP: Record<string, string> = {
  pending: '待核销',
  completed: '已核销',
  cancelled: '已过期',
};

const RedemptionVerifyPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [redeemCode, setRedeemCode] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const { data: recordsData, isLoading } = useQuery({
    queryKey: ['admin-redemptions', page, pageSize, statusFilter],
    queryFn: () =>
      adminApi.getRedemptionRecords({
        page,
        pageSize,
        status: statusFilter,
      }),
  });

  const records = recordsData?.data?.list ?? [];
  const pagination = recordsData?.data?.pagination;

  const redeemMutation = useMutation({
    mutationFn: (code: string) => adminApi.redeemCode(code),
    onSuccess: () => {
      message.success('核销成功');
      setRedeemCode('');
      queryClient.invalidateQueries({ queryKey: ['admin-redemptions'] });
    },
    onError: (err: Error) => {
      message.error(err.message || '核销失败');
    },
  });

  const lastRedeemed = redeemMutation.data?.data as Redemption | undefined;

  const handleRedeem = useCallback(() => {
    const code = redeemCode.trim();
    if (!code) {
      message.warning('请输入兑换码');
      return;
    }
    redeemMutation.mutate(code);
  }, [redeemCode, redeemMutation]);

  const handleStatusChange = useCallback((value: string | undefined) => {
    setStatusFilter(value || undefined);
    setPage(1);
  }, []);

  const columns: ColumnsType<Redemption> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 70,
    },
    {
      title: '兑换时间',
      dataIndex: 'created_at',
      width: 170,
      render: (text: string) => (text ? new Date(text).toLocaleString('zh-CN') : '--'),
    },
    {
      title: '用户',
      dataIndex: ['user', 'username'],
      width: 120,
      render: (text: string) => text || '--',
    },
    {
      title: '商品',
      dataIndex: 'item_name',
      width: 160,
      ellipsis: true,
      render: (text: string) => text || '--',
    },
    {
      title: '积分',
      dataIndex: 'points_cost',
      width: 80,
      render: (val: number) => (val != null ? val : '--'),
    },
    {
      title: '兑换码',
      dataIndex: 'redeem_code',
      width: 180,
      render: (text: string) => text || '--',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>
          {REDEMPTION_STATUS_MAP[status] || status}
        </Tag>
      ),
    },
    {
      title: '核销时间',
      dataIndex: 'completed_at',
      width: 170,
      render: (text: string) => (text ? new Date(text).toLocaleString('zh-CN') : '--'),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>兑换核销</Title>
      </div>

      {/* 核销区域 */}
      <Card title="扫码核销" style={{ marginBottom: 16 }}>
        <Space.Compact style={{ width: '100%', maxWidth: 600 }}>
          <Search
            placeholder="请输入兑换码"
            allowClear
            value={redeemCode}
            onChange={(e) => setRedeemCode(e.target.value)}
            onSearch={handleRedeem}
            enterButton={
              <Button
                type="primary"
                icon={<ScanOutlined />}
                loading={redeemMutation.isPending}
              >
                核销
              </Button>
            }
            style={{ width: '100%' }}
          />
        </Space.Compact>

        {lastRedeemed && (
          <Alert
            type="success"
            showIcon
            message="核销成功"
            style={{ marginTop: 16 }}
            description={
              <Descriptions size="small" column={2} style={{ marginTop: 8 }}>
                <Descriptions.Item label="兑换码">{lastRedeemed.redeem_code || '--'}</Descriptions.Item>
                <Descriptions.Item label="用户">{lastRedeemed.user?.username || '--'}</Descriptions.Item>
                <Descriptions.Item label="商品">{lastRedeemed.item_name || '--'}</Descriptions.Item>
                <Descriptions.Item label="消耗积分">{lastRedeemed.points_cost ?? '--'}</Descriptions.Item>
              </Descriptions>
            }
          />
        )}

        {redeemMutation.isError && (
          <Alert
            type="error"
            showIcon
            message="核销失败"
            description={redeemMutation.error?.message || '请检查兑换码是否正确'}
            style={{ marginTop: 16 }}
          />
        )}
      </Card>

      {/* 兑换记录列表 */}
      <Card title="兑换记录">
        <div style={{ marginBottom: 16 }}>
          <Select
            placeholder="按状态筛选"
            allowClear
            style={{ width: 150 }}
            value={statusFilter}
            onChange={handleStatusChange}
            options={[
              { label: '全部', value: '' },
              { label: '待核销', value: 'pending' },
              { label: '已核销', value: 'completed' },
              { label: '已过期', value: 'cancelled' },
            ]}
          />
        </div>

        <Table<Redemption>
          rowKey="id"
          columns={columns}
          dataSource={records}
          loading={isLoading}
          scroll={{ x: 1000 }}
          pagination={{
            current: page,
            pageSize,
            total: pagination?.total ?? 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>
    </div>
  );
};

export default RedemptionVerifyPage;
