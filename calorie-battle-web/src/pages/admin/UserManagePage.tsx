import React, { useState, useCallback } from 'react';
import {
  Typography,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/adminApi';
import { ROLES, STATUS_COLORS } from '@/utils/constants';
import type { User, UserRole, UserStatus } from '@/types/auth.types';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { TextArea } = Input;

const ROLE_COLORS: Record<UserRole, string> = {
  user: 'blue',
  reviewer: 'purple',
  admin: 'red',
};

const UserManagePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // 筛选状态
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<UserStatus | undefined>(undefined);
  const [keyword, setKeyword] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, pageSize, roleFilter, statusFilter, keyword],
    queryFn: () =>
      adminApi.getUsers({
        page,
        pageSize,
        role: roleFilter,
        status: statusFilter,
        keyword: keyword || undefined,
      }),
  });

  const users = data?.data?.list ?? [];
  const pagination = data?.data?.pagination;

  // 切换用户状态
  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: number; status: 'active' | 'disabled' }) =>
      adminApi.toggleUserStatus(userId, status),
    onSuccess: () => {
      message.success('用户状态已更新');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: Error) => {
      message.error(err.message || '操作失败');
    },
  });

  // 调整积分
  const adjustPointsMutation = useMutation({
    mutationFn: ({ userId, amount, reason }: { userId: number; amount: number; reason?: string }) =>
      adminApi.adjustUserPoints(userId, { amount, reason }),
    onSuccess: () => {
      message.success('积分调整成功');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: Error) => {
      message.error(err.message || '积分调整失败');
    },
  });

  const handleToggleStatus = useCallback(
    (record: User) => {
      const newStatus: UserStatus = record.status === 'active' ? 'disabled' : 'active';
      const actionText = newStatus === 'active' ? '启用' : '禁用';
      Modal.confirm({
        title: `确认${actionText}`,
        content: `确定要${actionText}用户「${record.username}」吗？`,
        okText: '确定',
        cancelText: '取消',
        onOk: () => toggleStatusMutation.mutate({ userId: record.id, status: newStatus }),
      });
    },
    [toggleStatusMutation],
  );

  const handleAdjustPoints = useCallback(
    (record: User) => {
      setSelectedUser(record);
      form.resetFields();
      form.setFieldsValue({ amount: undefined, reason: '' });
      setModalVisible(true);
    },
    [form],
  );

  const handleAdjustSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      if (!selectedUser) return;
      adjustPointsMutation.mutate({
        userId: selectedUser.id,
        amount: values.amount,
        reason: values.reason,
      });
    } catch {
      // form validation failed
    }
  }, [form, selectedUser, adjustPointsMutation]);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setSelectedUser(null);
    form.resetFields();
  }, [form]);

  const handleSearch = useCallback(() => {
    setPage(1);
  }, []);

  const columns: ColumnsType<User> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 70,
    },
    {
      title: '学号',
      dataIndex: 'account',
      width: 140,
    },
    {
      title: '姓名',
      dataIndex: 'username',
      width: 120,
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 100,
      render: (role: UserRole) => (
        <Tag color={ROLE_COLORS[role] || 'default'}>{ROLES[role] || role}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (status: UserStatus) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '总积分',
      dataIndex: 'total_points',
      width: 100,
      render: (val: number) => (val != null ? val.toLocaleString() : '--'),
    },
    {
      title: '累计获得',
      dataIndex: 'total_earned',
      width: 100,
      render: (val: number) => (val != null ? val.toLocaleString() : '--'),
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      width: 170,
      render: (text: string) => (text ? new Date(text).toLocaleString('zh-CN') : '--'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_: unknown, record: User) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => handleToggleStatus(record)}
            loading={toggleStatusMutation.isPending}
          >
            {record.status === 'active' ? '禁用' : '启用'}
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleAdjustPoints(record)}
          >
            调整积分
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>用户管理</Title>
      </div>

      {/* 筛选栏 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input.Search
          placeholder="搜索学号或姓名"
          allowClear
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={handleSearch}
          style={{ width: 240 }}
        />
        <Select
          placeholder="按角色筛选"
          allowClear
          value={roleFilter}
          onChange={(val) => {
            setRoleFilter(val);
            setPage(1);
          }}
          style={{ width: 140 }}
          options={[
            { label: '普通用户', value: 'user' },
            { label: '审核员', value: 'reviewer' },
            { label: '管理员', value: 'admin' },
          ]}
        />
        <Select
          placeholder="按状态筛选"
          allowClear
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val);
            setPage(1);
          }}
          style={{ width: 140 }}
          options={[
            { label: '启用', value: 'active' },
            { label: '禁用', value: 'disabled' },
          ]}
        />
        <Button
          icon={<SearchOutlined />}
          onClick={handleSearch}
        >
          搜索
        </Button>
      </div>

      <Table<User>
        rowKey="id"
        columns={columns}
        dataSource={users}
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

      {/* 调整积分弹窗 */}
      <Modal
        title={`调整积分 - ${selectedUser?.username ?? ''}`}
        open={modalVisible}
        onOk={handleAdjustSubmit}
        onCancel={closeModal}
        confirmLoading={adjustPointsMutation.isPending}
        okText="确认调整"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="积分数值"
            name="amount"
            rules={[{ required: true, message: '请输入积分数值' }]}
            tooltip="正数为增加积分，负数为扣减积分"
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入积分数值（正数增加，负数扣减）"
            />
          </Form.Item>
          <Form.Item
            label="调整原因"
            name="reason"
            rules={[{ required: true, message: '请输入调整原因' }]}
          >
            <TextArea
              rows={3}
              placeholder="请输入调整原因"
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagePage;
