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
import type { RedemptionItem } from '@/types/user.types';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { TextArea } = Input;

interface ItemFormData {
  name: string;
  description?: string;
  points_required: number;
  stock: number;
  rules?: string;
  redeem_location?: string;
  is_active?: boolean;
  sort_order?: number;
}

const ItemManagePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<RedemptionItem | null>(null);
  const [isEdit, setIsEdit] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-redemption-items'],
    queryFn: () => adminApi.getRedemptionItems(),
  });

  const items = data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (values: ItemFormData) => {
      const payload: Record<string, any> = {
        name: values.name,
        description: values.description || '',
        points_required: values.points_required,
        stock: values.stock,
      };
      if (values.rules) payload.rules = values.rules;
      if (values.redeem_location) payload.redeem_location = values.redeem_location;
      if (values.is_active !== undefined) payload.is_active = values.is_active;
      if (values.sort_order !== undefined) payload.sort_order = values.sort_order;
      return adminApi.createRedemptionItem(payload as any);
    },
    onSuccess: () => {
      message.success('商品创建成功');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['admin-redemption-items'] });
    },
    onError: (err: Error) => {
      message.error(err.message || '创建失败');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: ItemFormData }) => {
      const payload: Record<string, any> = {
        name: values.name,
        description: values.description || '',
        points_required: values.points_required,
        stock: values.stock,
      };
      if (values.rules !== undefined) payload.rules = values.rules;
      if (values.redeem_location !== undefined) payload.redeem_location = values.redeem_location;
      if (values.is_active !== undefined) payload.is_active = values.is_active;
      if (values.sort_order !== undefined) payload.sort_order = values.sort_order;
      return adminApi.updateRedemptionItem(id, payload as any);
    },
    onSuccess: () => {
      message.success('商品更新成功');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['admin-redemption-items'] });
    },
    onError: (err: Error) => {
      message.error(err.message || '更新失败');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteRedemptionItem(id),
    onSuccess: () => {
      message.success('商品已删除');
      queryClient.invalidateQueries({ queryKey: ['admin-redemption-items'] });
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
      is_active: true,
      sort_order: 0,
      points_required: 0,
      stock: 0,
    });
    setModalVisible(true);
  }, [form]);

  const handleEditClick = useCallback(
    (record: RedemptionItem) => {
      setIsEdit(true);
      setEditingItem(record);
      form.resetFields();
      form.setFieldsValue({
        name: record.name,
        description: record.description || '',
        points_required: record.points_required,
        stock: record.stock,
        rules: (record as any).rules || '',
        redeem_location: (record as any).redeem_location || '',
        is_active: record.status === 'active',
        sort_order: (record as any).sort_order ?? 0,
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

  const columns: ColumnsType<RedemptionItem> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 70,
    },
    {
      title: '商品名称',
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
      title: '所需积分',
      dataIndex: 'points_required',
      width: 100,
      render: (val: number) => (val != null ? val : '--'),
    },
    {
      title: '库存',
      dataIndex: 'stock',
      width: 80,
      render: (val: number) => (val != null ? val : '--'),
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
        <Tag color={status === 'active' ? 'green' : 'default'}>
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
      render: (_: unknown, record: RedemptionItem) => (
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
            description={`确定要删除商品「${record.name}」吗？此操作不可恢复。`}
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
        <Title level={3} style={{ margin: 0 }}>商品管理</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateClick}
        >
          创建商品
        </Button>
      </div>

      <Table<RedemptionItem>
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={isLoading}
        scroll={{ x: 1100 }}
        pagination={false}
      />

      {/* 创建/编辑商品弹窗 */}
      <Modal
        title={isEdit ? '编辑商品' : '创建商品'}
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
            label="商品名称"
            name="name"
            rules={[
              { required: true, message: '请输入商品名称' },
              { max: 100, message: '商品名称不能超过100个字符' },
            ]}
          >
            <Input placeholder="请输入商品名称" />
          </Form.Item>

          <Form.Item
            label="商品描述"
            name="description"
          >
            <TextArea rows={3} placeholder="请输入商品描述" maxLength={500} showCount />
          </Form.Item>

          <Form.Item
            label="所需积分"
            name="points_required"
            rules={[{ required: true, message: '请输入所需积分' }]}
          >
            <InputNumber
              min={0}
              max={99999}
              style={{ width: '100%' }}
              placeholder="请输入所需积分"
            />
          </Form.Item>

          <Form.Item
            label="库存"
            name="stock"
            rules={[{ required: true, message: '请输入库存数量' }]}
          >
            <InputNumber
              min={0}
              max={99999}
              style={{ width: '100%' }}
              placeholder="请输入库存数量"
            />
          </Form.Item>

          <Form.Item
            label="兑换规则"
            name="rules"
          >
            <TextArea rows={3} placeholder="请输入兑换规则" maxLength={1000} showCount />
          </Form.Item>

          <Form.Item
            label="核销地点"
            name="redeem_location"
          >
            <Input placeholder="请输入核销地点" />
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

export default ItemManagePage;
