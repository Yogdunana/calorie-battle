import React, { useState, useCallback } from 'react';
import {
  Typography,
  Table,
  Tag,
  Button,
  Space,
  Select,
  Image,
  Modal,
  Form,
  InputNumber,
  Input,
  message,
  Tooltip,
} from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/adminApi';
import { UPLOAD_BASE_URL, CHECKIN_STATUS_MAP, STATUS_COLORS } from '@/utils/constants';
import type { WeightRecord } from '@/types/user.types';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

const WeightPlanReviewPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [recordTypeFilter, setRecordTypeFilter] = useState<string | undefined>(undefined);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<WeightRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-weight-plan', page, pageSize, statusFilter, recordTypeFilter],
    queryFn: () =>
      adminApi.getWeightPlanPending({
        page,
        pageSize,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(recordTypeFilter ? { type: recordTypeFilter } : {}),
      } as any),
  });

  const records = data?.data?.list ?? [];
  const pagination = data?.data?.pagination;

  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { status: 'approved' | 'rejected'; comment?: string; points?: number };
    }) => adminApi.reviewWeightPlan(id, data),
    onSuccess: (_, variables) => {
      if (variables.data.status === 'approved') {
        message.success('审核通过');
        setApproveModalVisible(false);
        form.resetFields();
      } else {
        message.success('已驳回');
        setRejectModalVisible(false);
        setRejectReason('');
      }
      setCurrentRecord(null);
      queryClient.invalidateQueries({ queryKey: ['admin-weight-plan'] });
    },
    onError: (err: Error) => {
      message.error(err.message || '操作失败');
    },
  });

  const handleApproveClick = useCallback((record: WeightRecord) => {
    setCurrentRecord(record);
    form.resetFields();
    form.setFieldsValue({
      weight: record.current_weight,
    });
    setApproveModalVisible(true);
  }, [form]);

  const handleApproveSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      if (!currentRecord) return;
      reviewMutation.mutate({
        id: currentRecord.id,
        data: {
          status: 'approved',
          comment: `体重: ${values.weight}kg${values.body_fat ? `, 体脂率: ${values.body_fat}%` : ''}`,
        },
      });
    } catch {
      // form validation failed
    }
  }, [form, currentRecord, reviewMutation]);

  const handleRejectClick = useCallback((record: WeightRecord) => {
    setCurrentRecord(record);
    setRejectReason('');
    setRejectModalVisible(true);
  }, []);

  const handleRejectSubmit = useCallback(() => {
    if (!rejectReason.trim()) {
      message.warning('请填写驳回原因');
      return;
    }
    if (!currentRecord) return;
    reviewMutation.mutate({
      id: currentRecord.id,
      data: { status: 'rejected', comment: rejectReason.trim() },
    });
  }, [currentRecord, rejectReason, reviewMutation]);

  const handleStatusChange = useCallback((value: string | undefined) => {
    setStatusFilter(value || undefined);
    setPage(1);
  }, []);

  const handleRecordTypeChange = useCallback((value: string | undefined) => {
    setRecordTypeFilter(value || undefined);
    setPage(1);
  }, []);

  const handlePreview = useCallback((url: string) => {
    setPreviewUrl(url);
    setPreviewVisible(true);
  }, []);

  const getImageUrl = useCallback((path?: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${UPLOAD_BASE_URL}/${path}`;
  }, []);

  const columns: ColumnsType<WeightRecord> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 70,
    },
    {
      title: '用户名',
      dataIndex: ['user', 'username'],
      width: 100,
      render: (text: string) => text || '--',
    },
    {
      title: '当前体重',
      dataIndex: 'current_weight',
      width: 100,
      render: (val: number) => (val != null ? `${val} kg` : '--'),
    },
    {
      title: '目标体重',
      dataIndex: 'target_weight',
      width: 100,
      render: (val: number) => (val != null ? `${val} kg` : '--'),
    },
    {
      title: '截图',
      dataIndex: 'image_url',
      width: 100,
      render: (url: string) => {
        const fullUrl = getImageUrl(url);
        if (!fullUrl) return '--';
        return (
          <Image
            src={fullUrl}
            width={60}
            height={60}
            style={{ objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
            preview={false}
            onClick={(e) => {
              e.stopPropagation();
              handlePreview(fullUrl);
            }}
            fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNjY2MiIGZvbnQtc2l6ZT0iMTIiP+ehruiuoTwvdGV4dD48L3N2Zz4="
          />
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>
          {CHECKIN_STATUS_MAP[status] || status}
        </Tag>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      width: 170,
      render: (text: string) => (text ? new Date(text).toLocaleString('zh-CN') : '--'),
    },
    {
      title: '审核时间',
      dataIndex: 'reviewed_at',
      width: 170,
      render: (text: string) => (text ? new Date(text).toLocaleString('zh-CN') : '--'),
    },
    {
      title: '审核意见',
      dataIndex: 'review_comment',
      width: 140,
      ellipsis: true,
      render: (text: string) =>
        text ? (
          <Tooltip title={text}>
            <span>{text}</span>
          </Tooltip>
        ) : (
          '--'
        ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: unknown, record: WeightRecord) => {
        if (record.status !== 'pending') {
          return <span style={{ color: '#999' }}>已处理</span>;
        }
        return (
          <Space>
            <Button
              type="primary"
              size="small"
              onClick={() => handleApproveClick(record)}
            >
              通过
            </Button>
            <Button
              danger
              size="small"
              onClick={() => handleRejectClick(record)}
            >
              驳回
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>轻盈计划审核</Title>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <Select
          placeholder="按记录类型筛选"
          allowClear
          style={{ width: 160 }}
          value={recordTypeFilter}
          onChange={handleRecordTypeChange}
          options={[
            { label: '全部', value: '' },
            { label: '初始记录', value: 'initial' },
            { label: '最终记录', value: 'final' },
          ]}
        />
        <Select
          placeholder="按状态筛选"
          allowClear
          style={{ width: 150 }}
          value={statusFilter}
          onChange={handleStatusChange}
          options={[
            { label: '全部', value: '' },
            { label: '待审核', value: 'pending' },
            { label: '已通过', value: 'approved' },
            { label: '已驳回', value: 'rejected' },
          ]}
        />
      </div>

      <Table<WeightRecord>
        rowKey="id"
        columns={columns}
        dataSource={records}
        loading={isLoading}
        scroll={{ x: 1200 }}
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

      {/* 通过弹窗 - 填写体重和体脂率 */}
      <Modal
        title="审核通过 - 确认体重数据"
        open={approveModalVisible}
        onOk={handleApproveSubmit}
        onCancel={() => {
          setApproveModalVisible(false);
          setCurrentRecord(null);
          form.resetFields();
        }}
        confirmLoading={reviewMutation.isPending}
        okText="确认通过"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16, color: '#666' }}>
          用户：{currentRecord?.user?.username || '--'}
        </div>
        <Form form={form} layout="vertical">
          <Form.Item
            label="体重 (kg)"
            name="weight"
            rules={[{ required: true, message: '请输入体重数值' }]}
          >
            <InputNumber
              min={20}
              max={300}
              step={0.1}
              precision={1}
              style={{ width: '100%' }}
              placeholder="请输入体重"
              addonAfter="kg"
            />
          </Form.Item>
          <Form.Item
            label="体脂率 (%)"
            name="body_fat"
          >
            <InputNumber
              min={3}
              max={70}
              step={0.1}
              precision={1}
              style={{ width: '100%' }}
              placeholder="选填"
              addonAfter="%"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 驳回弹窗 */}
      <Modal
        title="驳回审核"
        open={rejectModalVisible}
        onOk={handleRejectSubmit}
        onCancel={() => {
          setRejectModalVisible(false);
          setCurrentRecord(null);
          setRejectReason('');
        }}
        confirmLoading={reviewMutation.isPending}
        okText="确认驳回"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <div style={{ marginBottom: 8 }}>请填写驳回原因：</div>
        <Input.TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="请输入驳回原因..."
          maxLength={500}
          showCount
        />
      </Modal>

      {/* 图片预览 */}
      <Image
        style={{ display: 'none' }}
        preview={{
          visible: previewVisible,
          src: previewUrl,
          onVisibleChange: (visible) => setPreviewVisible(visible),
        }}
      />
    </div>
  );
};

export default WeightPlanReviewPage;
