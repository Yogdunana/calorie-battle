import React, { useState, useCallback } from 'react';
import {
  Typography,
  Table,
  Tag,
  Select,
  Input,
  Button,
  Space,
  Tooltip,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/services/adminApi';
import type { AuditLog } from '@/types/user.types';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

const ACTION_COLORS: Record<string, string> = {
  create: 'green',
  update: 'blue',
  delete: 'red',
  approve: 'green',
  reject: 'red',
  login: 'purple',
  export: 'cyan',
  toggle_status: 'orange',
  adjust_points: 'gold',
  override: 'magenta',
  reset_password: 'volcano',
};

const AuditLogPage: React.FC = () => {
  // 筛选状态
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [actionFilter, setActionFilter] = useState<string | undefined>(undefined);
  const [operatorIdFilter, setOperatorIdFilter] = useState<number | undefined>(undefined);
  const [targetTypeFilter, setTargetTypeFilter] = useState<string | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page, pageSize, actionFilter, operatorIdFilter, targetTypeFilter],
    queryFn: () =>
      adminApi.getAuditLogs({
        page,
        pageSize,
        action: actionFilter,
        operator_id: operatorIdFilter,
        target_type: targetTypeFilter,
      }),
  });

  const logs = data?.data?.list ?? [];
  const pagination = data?.data?.pagination;

  const handleSearch = useCallback(() => {
    setPage(1);
  }, []);

  const columns: ColumnsType<AuditLog> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 70,
    },
    {
      title: '操作时间',
      dataIndex: 'created_at',
      width: 180,
      render: (text: string) => (text ? new Date(text).toLocaleString('zh-CN') : '--'),
    },
    {
      title: '操作者',
      dataIndex: 'operator_name',
      width: 120,
      render: (text: string, record: AuditLog) => (
        <Tooltip title={`操作者ID: ${record.operator_id}`}>
          <span>{text || `ID:${record.operator_id}`}</span>
        </Tooltip>
      ),
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      width: 130,
      render: (action: string) => (
        <Tag color={ACTION_COLORS[action] || 'default'}>{action}</Tag>
      ),
    },
    {
      title: '目标类型',
      dataIndex: 'target_type',
      width: 120,
      render: (text: string) => text || '--',
    },
    {
      title: '目标ID',
      dataIndex: 'target_id',
      width: 90,
      render: (val: number) => (val != null ? val : '--'),
    },
    {
      title: '详情',
      dataIndex: 'detail',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text || '--'}>
          <span>{text || '--'}</span>
        </Tooltip>
      ),
    },
    {
      title: 'IP 地址',
      dataIndex: 'ip_address',
      width: 140,
      render: (text: string) => text || '--',
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>操作日志</Title>
      </div>

      {/* 筛选栏 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input
          placeholder="操作者ID"
          allowClear
          value={operatorIdFilter != null ? String(operatorIdFilter) : ''}
          onChange={(e) => {
            const val = e.target.value;
            setOperatorIdFilter(val ? Number(val) : undefined);
          }}
          style={{ width: 140 }}
          type="number"
        />
        <Select
          placeholder="按操作类型筛选"
          allowClear
          value={actionFilter}
          onChange={(val) => {
            setActionFilter(val);
            setPage(1);
          }}
          style={{ width: 160 }}
          showSearch
          options={[
            { label: 'create (创建)', value: 'create' },
            { label: 'update (更新)', value: 'update' },
            { label: 'delete (删除)', value: 'delete' },
            { label: 'approve (通过)', value: 'approve' },
            { label: 'reject (驳回)', value: 'reject' },
            { label: 'login (登录)', value: 'login' },
            { label: 'export (导出)', value: 'export' },
            { label: 'toggle_status (切换状态)', value: 'toggle_status' },
            { label: 'adjust_points (调整积分)', value: 'adjust_points' },
            { label: 'override (覆盖审核)', value: 'override' },
            { label: 'reset_password (重置密码)', value: 'reset_password' },
          ]}
        />
        <Select
          placeholder="按目标类型筛选"
          allowClear
          value={targetTypeFilter}
          onChange={(val) => {
            setTargetTypeFilter(val);
            setPage(1);
          }}
          style={{ width: 160 }}
          showSearch
          options={[
            { label: 'user (用户)', value: 'user' },
            { label: 'review (审核)', value: 'review' },
            { label: 'task (任务)', value: 'task' },
            { label: 'redemption_item (商品)', value: 'redemption_item' },
            { label: 'redemption (兑换)', value: 'redemption' },
            { label: 'photo (投稿)', value: 'photo' },
            { label: 'announcement (公告)', value: 'announcement' },
            { label: 'config (配置)', value: 'config' },
            { label: 'sensitive_word (敏感词)', value: 'sensitive_word' },
          ]}
        />
        <Button icon={<SearchOutlined />} onClick={handleSearch}>
          搜索
        </Button>
      </div>

      <Table<AuditLog>
        rowKey="id"
        columns={columns}
        dataSource={logs}
        loading={isLoading}
        scroll={{ x: 1100 }}
        pagination={
          pagination
            ? {
                current: pagination.page,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`,
                onChange: (p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                },
              }
            : false
        }
      />
    </div>
  );
};

export default AuditLogPage;
