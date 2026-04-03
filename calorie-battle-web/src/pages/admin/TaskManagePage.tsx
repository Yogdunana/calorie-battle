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
  Popconfirm,
  message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/adminApi';
import { STATUS_COLORS } from '@/utils/constants';
import type { Task } from '@/types/checkin.types';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;

interface TaskFormData {
  category?: string;
  name: string;
  description: string;
  points: number;
  submit_rules?: string;
  required_fields?: string;
  start_time?: dayjs.Dayjs;
  end_time?: dayjs.Dayjs;
  is_active?: boolean;
  sort_order?: number;
}

const TaskManagePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tasks'],
    queryFn: () => adminApi.getTasks(),
  });

  const tasks = data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (values: TaskFormData) => {
      const payload: Record<string, any> = {
        name: values.name,
        description: values.description,
        points: values.points,
      };
      if (values.category) payload.category = values.category;
      if (values.submit_rules) {
        try {
          payload.submit_rules = JSON.parse(values.submit_rules);
        } catch {
          payload.submit_rules = values.submit_rules;
        }
      }
      if (values.required_fields) {
        payload.required_fields = values.required_fields
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean);
      }
      if (values.start_time) payload.start_time = values.start_time.toISOString();
      if (values.end_time) payload.end_time = values.end_time.toISOString();
      if (values.is_active !== undefined) payload.is_active = values.is_active;
      if (values.sort_order !== undefined) payload.sort_order = values.sort_order;
      return adminApi.createTask(payload as any);
    },
    onSuccess: () => {
      message.success('任务创建成功');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
    },
    onError: (err: Error) => {
      message.error(err.message || '创建失败');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: TaskFormData }) => {
      const payload: Record<string, any> = {
        name: values.name,
        description: values.description,
        points: values.points,
      };
      if (values.category !== undefined) payload.category = values.category;
      if (values.submit_rules) {
        try {
          payload.submit_rules = JSON.parse(values.submit_rules);
        } catch {
          payload.submit_rules = values.submit_rules;
        }
      }
      if (values.required_fields !== undefined) {
        payload.required_fields = values.required_fields
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean);
      }
      if (values.start_time) payload.start_time = values.start_time.toISOString();
      if (values.end_time) payload.end_time = values.end_time.toISOString();
      if (values.is_active !== undefined) payload.is_active = values.is_active;
      if (values.sort_order !== undefined) payload.sort_order = values.sort_order;
      return adminApi.updateTask(id, payload as any);
    },
    onSuccess: () => {
      message.success('任务更新成功');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
    },
    onError: (err: Error) => {
      message.error(err.message || '更新失败');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteTask(id),
    onSuccess: () => {
      message.success('任务已删除');
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
    },
    onError: (err: Error) => {
      message.error(err.message || '删除失败');
    },
  });

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setEditingTask(null);
    setIsEdit(false);
    form.resetFields();
  }, [form]);

  const handleCreateClick = useCallback(() => {
    setIsEdit(false);
    setEditingTask(null);
    form.resetFields();
    form.setFieldsValue({
      is_active: true,
      sort_order: 0,
      points: 0,
    });
    setModalVisible(true);
  }, [form]);

  const handleEditClick = useCallback(
    (record: Task) => {
      setIsEdit(true);
      setEditingTask(record);
      form.resetFields();
      form.setFieldsValue({
        category: record.category || '',
        name: record.name,
        description: record.description,
        points: record.points,
        submit_rules: record.submit_rules
          ? typeof record.submit_rules === 'string'
            ? record.submit_rules
            : JSON.stringify(record.submit_rules, null, 2)
          : '',
        required_fields: record.required_fields?.join(', ') || '',
        start_time: record.created_at ? dayjs(record.created_at) : undefined,
        end_time: record.updated_at ? dayjs(record.updated_at) : undefined,
        is_active: record.is_active ?? record.status === 'active',
        sort_order: record.sort_order ?? 0,
      });
      setModalVisible(true);
    },
    [form],
  );

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      if (isEdit && editingTask) {
        updateMutation.mutate({ id: editingTask.id, values });
      } else {
        createMutation.mutate(values);
      }
    } catch {
      // form validation failed
    }
  }, [form, isEdit, editingTask, createMutation, updateMutation]);

  const columns: ColumnsType<Task> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 70,
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 100,
      render: (text: string) => text || '--',
    },
    {
      title: '任务名称',
      dataIndex: 'name',
      width: 160,
      ellipsis: true,
    },
    {
      title: '描述',
      dataIndex: 'description',
      width: 200,
      ellipsis: true,
      render: (text: string) => text || '--',
    },
    {
      title: '积分',
      dataIndex: 'points',
      width: 80,
      render: (val: number) => (val != null ? val : '--'),
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      width: 70,
      render: (val: number) => (val != null ? val : '--'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (status: string, record: Task) => {
        const isActive = record.is_active ?? status === 'active';
        return (
          <Tag color={isActive ? 'green' : 'default'}>
            {isActive ? '启用' : '禁用'}
          </Tag>
        );
      },
    },
    {
      title: '必填字段',
      dataIndex: 'required_fields',
      width: 150,
      render: (fields: string[]) => {
        if (!fields || fields.length === 0) return '--';
        return fields.map((f) => (
          <Tag key={f} style={{ marginBottom: 2 }}>
            {f}
          </Tag>
        ));
      },
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
      render: (_: unknown, record: Task) => (
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
            description={`确定要删除任务「${record.name}」吗？此操作不可恢复。`}
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
        <Title level={3} style={{ margin: 0 }}>任务管理</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateClick}
        >
          创建任务
        </Button>
      </div>

      <Table<Task>
        rowKey="id"
        columns={columns}
        dataSource={tasks}
        loading={isLoading}
        scroll={{ x: 1300 }}
        pagination={false}
      />

      {/* 创建/编辑任务弹窗 */}
      <Modal
        title={isEdit ? '编辑任务' : '创建任务'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={closeModal}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText={isEdit ? '保存' : '创建'}
        cancelText="取消"
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="分类"
            name="category"
          >
            <Input placeholder="请输入任务分类（如：运动、饮食等）" />
          </Form.Item>

          <Form.Item
            label="任务名称"
            name="name"
            rules={[
              { required: true, message: '请输入任务名称' },
              { max: 100, message: '任务名称不能超过100个字符' },
            ]}
          >
            <Input placeholder="请输入任务名称" />
          </Form.Item>

          <Form.Item
            label="任务描述"
            name="description"
            rules={[
              { required: true, message: '请输入任务描述' },
            ]}
          >
            <TextArea
              rows={3}
              placeholder="请输入任务描述"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="积分"
            name="points"
            rules={[{ required: true, message: '请输入积分' }]}
          >
            <InputNumber
              min={0}
              max={9999}
              style={{ width: '100%' }}
              placeholder="请输入积分"
            />
          </Form.Item>

          <Form.Item
            label="提交规则 (JSON)"
            name="submit_rules"
            tooltip="JSON 格式的提交规则配置"
          >
            <TextArea
              rows={3}
              placeholder='例如: {"need_image": true, "max_images": 3}'
            />
          </Form.Item>

          <Form.Item
            label="必填字段"
            name="required_fields"
            tooltip="用英文逗号分隔多个字段名"
          >
            <Input placeholder="例如: image, description" />
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
        </Form>
      </Modal>
    </div>
  );
};

export default TaskManagePage;
