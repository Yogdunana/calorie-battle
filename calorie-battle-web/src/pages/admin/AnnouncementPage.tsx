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
  Switch,
  Select,
  DatePicker,
  Popconfirm,
  message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/adminApi';
import { STATUS_COLORS } from '@/utils/constants';
import type { Announcement } from '@/types/user.types';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;

interface AnnouncementFormData {
  type: 'info' | 'warning' | 'important';
  title: string;
  content: string;
  image_url?: string;
  link_url?: string;
  sort_order?: number;
  is_active?: boolean;
  start_time?: dayjs.Dayjs;
  end_time?: dayjs.Dayjs;
}

const TYPE_MAP: Record<string, { label: string; color: string }> = {
  info: { label: '通知', color: 'blue' },
  warning: { label: '警告', color: 'orange' },
  important: { label: '重要', color: 'red' },
};

const AnnouncementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: () => adminApi.getAnnouncements(),
  });

  const announcements = data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (values: AnnouncementFormData) => {
      const payload: Record<string, any> = {
        type: values.type,
        title: values.title,
        content: values.content,
      };
      if (values.image_url) payload.image_url = values.image_url;
      if (values.link_url) payload.link_url = values.link_url;
      if (values.sort_order !== undefined) payload.sort_order = values.sort_order;
      if (values.is_active !== undefined) payload.is_active = values.is_active;
      if (values.start_time) payload.start_time = values.start_time.toISOString();
      if (values.end_time) payload.end_time = values.end_time.toISOString();
      return adminApi.createAnnouncement(payload as any);
    },
    onSuccess: () => {
      message.success('公告创建成功');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
    },
    onError: (err: Error) => {
      message.error(err.message || '创建失败');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: AnnouncementFormData }) => {
      const payload: Record<string, any> = {
        type: values.type,
        title: values.title,
        content: values.content,
      };
      if (values.image_url !== undefined) payload.image_url = values.image_url;
      if (values.link_url !== undefined) payload.link_url = values.link_url;
      if (values.sort_order !== undefined) payload.sort_order = values.sort_order;
      if (values.is_active !== undefined) payload.is_active = values.is_active;
      if (values.start_time) payload.start_time = values.start_time.toISOString();
      if (values.end_time) payload.end_time = values.end_time.toISOString();
      return adminApi.updateAnnouncement(id, payload as any);
    },
    onSuccess: () => {
      message.success('公告更新成功');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
    },
    onError: (err: Error) => {
      message.error(err.message || '更新失败');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteAnnouncement(id),
    onSuccess: () => {
      message.success('公告已删除');
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
    },
    onError: (err: Error) => {
      message.error(err.message || '删除失败');
    },
  });

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setEditingItem(null);
    setIsEdit(false);
    form.resetFields();
  }, [form]);

  const handleCreateClick = useCallback(() => {
    setIsEdit(false);
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      type: 'info',
      is_active: true,
      sort_order: 0,
    });
    setModalVisible(true);
  }, [form]);

  const handleEditClick = useCallback(
    (record: Announcement) => {
      setIsEdit(true);
      setEditingItem(record);
      form.resetFields();
      form.setFieldsValue({
        type: record.type,
        title: record.title,
        content: record.content,
        image_url: (record as any).image_url || '',
        link_url: (record as any).link_url || '',
        sort_order: (record as any).sort_order ?? 0,
        is_active: record.status === 'active',
        start_time: (record as any).start_time ? dayjs((record as any).start_time) : undefined,
        end_time: (record as any).end_time ? dayjs((record as any).end_time) : undefined,
      });
      setModalVisible(true);
    },
    [form],
  );

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      if (isEdit && editingItem) {
        updateMutation.mutate({ id: editingItem.id, values });
      } else {
        createMutation.mutate(values);
      }
    } catch {
      // form validation failed
    }
  }, [form, isEdit, editingItem, createMutation, updateMutation]);

  const columns: ColumnsType<Announcement> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 70,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 90,
      render: (type: string) => {
        const info = TYPE_MAP[type];
        return info ? (
          <Tag color={info.color}>{info.label}</Tag>
        ) : (
          <Tag>{type}</Tag>
        );
      },
    },
    {
      title: '标题',
      dataIndex: 'title',
      width: 200,
      ellipsis: true,
    },
    {
      title: '内容',
      dataIndex: 'content',
      width: 260,
      ellipsis: true,
      render: (text: string) => text || '--',
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      width: 80,
      render: (val: number) => (val != null ? val : '--'),
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
      width: 160,
      fixed: 'right',
      render: (_: unknown, record: Announcement) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditClick(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除公告「${record.title}」吗？此操作不可恢复。`}
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
        <Title level={3} style={{ margin: 0 }}>公告管理</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateClick}
        >
          创建公告
        </Button>
      </div>

      <Table<Announcement>
        rowKey="id"
        columns={columns}
        dataSource={announcements}
        loading={isLoading}
        scroll={{ x: 1100 }}
        pagination={false}
      />

      {/* 创建/编辑公告弹窗 */}
      <Modal
        title={isEdit ? '编辑公告' : '创建公告'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={closeModal}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText={isEdit ? '保存' : '创建'}
        cancelText="取消"
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="类型"
            name="type"
            rules={[{ required: true, message: '请选择公告类型' }]}
          >
            <Select
              placeholder="请选择公告类型"
              options={[
                { label: '通知', value: 'info' },
                { label: '警告', value: 'warning' },
                { label: '重要', value: 'important' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="标题"
            name="title"
            rules={[
              { required: true, message: '请输入公告标题' },
              { max: 100, message: '标题不能超过100个字符' },
            ]}
          >
            <Input placeholder="请输入公告标题" />
          </Form.Item>

          <Form.Item
            label="内容"
            name="content"
            rules={[{ required: true, message: '请输入公告内容' }]}
          >
            <TextArea rows={4} placeholder="请输入公告内容" maxLength={2000} showCount />
          </Form.Item>

          <Form.Item
            label="图片URL"
            name="image_url"
          >
            <Input placeholder="请输入图片URL（可选）" />
          </Form.Item>

          <Form.Item
            label="链接URL"
            name="link_url"
          >
            <Input placeholder="请输入链接URL（可选）" />
          </Form.Item>

          <Form.Item
            label="排序"
            name="sort_order"
          >
            <InputNumber
              min={0}
              max={9999}
              style={{ width: '100%' }}
              placeholder="数值越小排序越靠前"
            />
          </Form.Item>

          <Form.Item
            label="是否启用"
            name="is_active"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <Form.Item label="开始时间" name="start_time">
            <DatePicker
              style={{ width: '100%' }}
              showTime
              placeholder="请选择开始时间（可选）"
            />
          </Form.Item>

          <Form.Item label="结束时间" name="end_time">
            <DatePicker
              style={{ width: '100%' }}
              showTime
              placeholder="请选择结束时间（可选）"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AnnouncementPage;
