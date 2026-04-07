import React from 'react';
import { Result } from 'antd';
import { PauseCircleOutlined } from '@ant-design/icons';

const RedemptionPage: React.FC = () => {
  return (
    <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
      <Result
        icon={<PauseCircleOutlined style={{ color: '#faad14' }} />}
        title="功能未开启"
        subTitle="该功能暂未开放使用，敬请期待"
      />
    </div>
  );
};

export default RedemptionPage;

{/* ========== 原始代码（已注释） ========== */}
{/*
import React, { useState } from 'react';
import {
  Typography,
  Card,
  Row,
  Col,
  Tabs,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  message,
  Image,
  Empty,
  Spin,
} from 'antd';
import {
  GiftOutlined,
  ShoppingOutlined,
  CopyOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { redemptionApi } from '@/services/redemptionApi';
import { pointsApi } from '@/services/pointsApi';
import { formatPoints, formatDateTime } from '@/utils/format';
import { UPLOAD_BASE_URL } from '@/utils/constants';
import type { RedemptionItem, Redemption } from '@/types/user.types';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text, Paragraph } = Typography;

const REDEMPTION_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待核销', color: 'blue' },
  completed: { label: '已核销', color: 'green' },
  cancelled: { label: '已取消', color: 'default' },
};

const RedemptionPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: summaryData } = useQuery({ queryKey: ['pointsSummary'], queryFn: () => pointsApi.getSummary() });
  const { data: itemsData, isLoading: itemsLoading } = useQuery({ queryKey: ['redemptionItems'], queryFn: () => redemptionApi.getItems() });
  const { data: redemptionsData, isLoading: redemptionsLoading } = useQuery({ queryKey: ['myRedemptions', page, pageSize], queryFn: () => redemptionApi.getMyRedemptions({ page, pageSize }) });

  const redeemMutation = useMutation({
    mutationFn: (itemId: number) => redemptionApi.redeem(itemId),
    onSuccess: () => {
      message.success('兑换成功！');
      queryClient.invalidateQueries({ queryKey: ['redemptionItems'] });
      queryClient.invalidateQueries({ queryKey: ['myRedemptions'] });
      queryClient.invalidateQueries({ queryKey: ['pointsSummary'] });
    },
    onError: (error: Error) => { message.error(error.message || '兑换失败，请稍后重试'); },
  });

  const availablePoints = summaryData?.data?.available_points ?? summaryData?.data?.total_points ?? 0;
  const items = itemsData?.data ?? [];
  const redemptions = redemptionsData?.data?.list ?? [];
  const pagination = redemptionsData?.data?.pagination;

  const handleRedeem = (item: RedemptionItem) => {
    if (item.stock <= 0) { message.warning('该商品已兑完'); return; }
    if (availablePoints < item.points_required) { message.warning('积分不足，无法兑换'); return; }
    Modal.confirm({
      title: '确认兑换', icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>商品名称：{item.name}</p>
          <p>所需积分：<Text strong style={{ color: '#ff4d4f' }}>{item.points_required}</Text> 积分</p>
          <p>当前可用积分：{availablePoints} 积分</p>
          <p>兑换后剩余：{availablePoints - item.points_required} 积分</p>
          <p style={{ color: '#faad14', marginTop: 8 }}>兑换后积分将自动扣除，请确认无误。</p>
        </div>
      ),
      okText: '确认兑换', cancelText: '取消',
      onOk: () => redeemMutation.mutate(item.id),
    });
  };

  const columns: ColumnsType<Redemption> = [
    { title: '兑换时间', dataIndex: 'created_at', key: 'created_at', width: 180, render: (val: string) => formatDateTime(val) },
    { title: '商品名称', dataIndex: 'item_name', key: 'item_name', ellipsis: true, render: (val: string) => val || '-' },
    { title: '消耗积分', dataIndex: 'points_cost', key: 'points_cost', width: 100, align: 'right', render: (val: number) => (<Text strong style={{ color: '#ff4d4f' }}>-{formatPoints(val)}</Text>) },
    { title: '兑换码', dataIndex: 'redeem_code', key: 'redeem_code', width: 200, render: (code: string) => code ? (<Text copyable={{ tooltips: ['复制', '已复制'] }}>{code}</Text>) : '-' },
    { title: '核销状态', dataIndex: 'status', key: 'status', width: 100, render: (status: string) => { const config = REDEMPTION_STATUS_MAP[status] || { label: status, color: 'default' }; return <Tag color={config.color}>{config.label}</Tag>; } },
  ];

  const renderItemsGrid = () => {
    if (itemsLoading) { return <div style={{ textAlign: 'center', padding: '60px 0' }}><Spin size="large" /></div>; }
    const activeItems = items.filter((item) => item.status === 'active');
    if (activeItems.length === 0) { return <Empty description="暂无可兑换商品" />; }
    return (
      <Row gutter={[16, 16]}>
        {activeItems.map((item) => {
          const isOutOfStock = item.stock <= 0;
          const isInsufficient = availablePoints < item.points_required;
          return (
            <Col key={item.id} xs={24} sm={12} lg={8}>
              <Card hoverable={!isOutOfStock} style={{ borderRadius: 12, height: '100%' }} styles={{ body: { display: 'flex', flexDirection: 'column', height: '100%' } }}
                cover={item.image_url ? (
                  <div style={{ height: 160, overflow: 'hidden', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Image src={`${UPLOAD_BASE_URL}${item.image_url}`} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }} preview={false} />
                  </div>
                ) : (
                  <div style={{ height: 160, background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f4ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GiftOutlined style={{ fontSize: 48, color: '#1677ff' }} />
                  </div>
                )}
              >
                <div style={{ flex: 1 }}>
                  <Title level={5} style={{ marginBottom: 8 }}>{item.name}</Title>
                  {item.description && (<Paragraph type="secondary" style={{ marginBottom: 12, fontSize: 13 }} ellipsis={{ rows: 2 }}>{item.description}</Paragraph>)}
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong style={{ color: '#ff4d4f', fontSize: 18 }}>{formatPoints(item.points_required)}<Text type="secondary" style={{ fontSize: 12, fontWeight: 'normal' }}> 积分</Text></Text>
                      <Tag color={isOutOfStock ? 'red' : 'green'}>{isOutOfStock ? '已兑完' : `剩余 ${item.stock}`}</Tag>
                    </div>
                    {isInsufficient && !isOutOfStock && (<Text type="warning" style={{ fontSize: 12 }}>积分不足</Text>)}
                  </Space>
                </div>
                <div style={{ marginTop: 16 }}>
                  <Button type="primary" icon={<ShoppingOutlined />} block disabled={isOutOfStock || isInsufficient || redeemMutation.isPending} loading={redeemMutation.isPending} onClick={() => handleRedeem(item)}>
                    {isOutOfStock ? '已兑完' : '立即兑换'}
                  </Button>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    );
  };

  const tabItems = [
    { key: 'items', label: (<Space><GiftOutlined />兑换商品</Space>), children: renderItemsGrid() },
    { key: 'records', label: (<Space><CopyOutlined />兑换记录</Space>), children: (
      <Table<Redemption> rowKey="id" columns={columns} dataSource={redemptions} loading={redemptionsLoading} locale={{ emptyText: '暂无兑换记录' }} pagination={{
        current: page, pageSize, total: pagination?.total ?? 0, showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 条记录`,
        onChange: (newPage, newPageSize) => { setPage(newPage); setPageSize(newPageSize); },
      }} scroll={{ x: 760 }} />
    )},
  ];

  return (
    <div className="page-container">
      <div className="page-header"><Title level={3}>积分兑换</Title></div>
      <Card style={{ borderRadius: 12 }}><Tabs items={tabItems} /></Card>
    </div>
  );
};

export default RedemptionPage;
*/}
