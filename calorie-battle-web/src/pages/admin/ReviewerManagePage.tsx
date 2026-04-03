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
  message,
  Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/adminApi';
import { STATUS_COLORS } from '@/utils/constants';
import type { User } from '@/types/auth.types';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

const ReviewerManagePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingReviewer, setEditingReviewer] = useState<User | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviewers'],
    queryFn: () => adminApi.getReviewers(),
  });

  const reviewers = data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (values: { account: string; username: string; password: string }) =>
      adminApi.createReviewer(values),
    onSuccess: () => {
      message.success('审核员创建成功');
      setCreateModalVisible(false);
      createForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['admin-reviewers'] });
    },
    onError: (err: Error) => {
      message.error(err.message || '创建失败');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { username?: string } }) =>
      adminApi.updateReviewer(id, data),
    onSuccess: () => {
      message.success('审核员信息已更新');
      setEditModalVisible(false);
      setEditingReviewer(null);
      editForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['admin-reviewers'] });
    },
    onError: (err: Error) => {
      message.error(err.message || '更新失败');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'active' | 'disabled' }) =>
      adminApi.toggleReviewerStatus(id, status),
    onSuccess: () => {
      message.success('状态已更新');
      queryClient.invalidateQueries({ queryKey: ['admin-reviewers'] });
    },
    onError: (err: Error) => {
      message.error(err.message || '操作失败');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: number) => adminApi.resetReviewerPassword(id),
    onSuccess: () => {
      message.success('密码已重置');
      queryClient.invalidateQueries({ queryKey: ['admin-reviewers'] });
    },
    onError: (err: Error) => {
      message.error(err.message || '重置失败');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteReviewer(id),
    onSuccess: () => {
      message.success('审核员已删除');
      queryClient.invalidateQueries({ queryKey: ['admin-reviewers'] });
    },
    onError: (err: Error) => {
      message.error(err.message || '删除失败');
    },
  });

  const handleCreateSubmit = useCallback(async () => {
    try {
      const values = await createForm.validateFields();
      createMutation.mutate(values);
    } catch {
      // form validation failed
    }
  }, [createForm, createMutation]);

  const handleEditClick = useCallback(
    (record: User) => {
      setEditingReviewer(record);
      editForm.setFieldsValue({ username: record.username });
      setEditModalVisible(true);
    },
    [editForm],
  );

  const handleEditSubmit = useCallback(async () => {
    try {
      const values = await editForm.validateFields();
      if (!editingReviewer) return;
      updateMutation.mutate({ id: editingReviewer.id, data: values });
    } catch {
      // form validation failed
    }
  }, [editForm, editingReviewer, updateMutation]);

  const handleToggleStatus = useCallback(
    (record: User) => {
      const newStatus = record.status === 'active' ? 'disabled' : 'active';
      const actionText = newStatus === 'active' ? '启用' : '禁用';
      Modal.confirm({
        title: `确认${actionText}`,
        content: `确定要${actionText}审核员「${record.username}」吗？`,
        okText: '确定',
        cancelText: '取消',
        onOk: () => toggleStatusMutation.mutate({ id: record.id, status: newStatus }),
      });
    },
    [toggleStatusMutation],
  );

  const handleResetPassword = useCallback(
    (record: User) => {
      Modal.confirm({
        title: '重置密码',
        content: `确定要重置审核员「${record.username}」的密码吗？`,
        okText: '确定',
        cancelText: '取消',
        onOk: () => resetPasswordMutation.mutate(record.id),
      });
    },
    [resetPasswordMutation],
  );

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
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 170,
      render: (text: string) => (text ? new Date(text).toLocaleString('zh-CN') : '--'),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right',
      render: (_: unknown, record: User) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditClick(record)}
          >
            编辑
          </Button>
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
            icon={<ReloadOutlined />}
            onClick={() => handleResetPassword(record)}
            loading={resetPasswordMutation.isPending}
          >
            重置密码
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除审核员「${record.username}」吗？此操作不可恢复。`}
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deleteMutation.isPending}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>审核员管理</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            createForm.resetFields();
            setCreateModalVisible(true);
          }}
        >
          创建审核员
        </Button>
      </div>

      <Table<User>
        rowKey="id"
        columns={columns}
        dataSource={reviewers}
        loading={isLoading}
        scroll={{ x: 900 }}
        pagination={false}
      />

      {/* 创建审核员弹窗 */}
      <Modal
        title="创建审核员"
        open={createModalVisible}
        onOk={handleCreateSubmit}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        confirmLoading={createMutation.isPending}
        okText="创建"
        cancelText="取消"
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            label="学号"
            name="account"
            rules={[
              { required: true, message: '请输入学号' },
              { max: 50, message: '学号不能超过50个字符' },
            ]}
          >
            <Input placeholder="请输入学号" />
          </Form.Item>
          <Form.Item
            label="姓名"
            name="username"
            rules={[
              { required: true, message: '请输入姓名' },
              { max: 50, message: '姓名不能超过50个字符' },
            ]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑审核员弹窗 */}
      <Modal
        title="编辑审核员"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingReviewer(null);
          editForm.resetFields();
        }}
        confirmLoading={updateMutation.isPending}
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            label="姓名"
            name="username"
            rules={[
              { required: true, message: '请输入姓名' },
              { max: 50, message: '姓名不能超过50个字符' },
            ]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReviewerManagePage;
