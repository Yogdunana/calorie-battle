import React, { useState, useCallback } from 'react';
import {
  Typography,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  Image,
  Modal,
  message,
  Tooltip,
} from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/adminApi';
import { UPLOAD_BASE_URL, CHECKIN_STATUS_MAP, STATUS_COLORS } from '@/utils/constants';
import type { ReviewItem } from '@/types/review.types';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Search } = Input;

const ReviewManagePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [userAccount, setUserAccount] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', page, pageSize, statusFilter, categoryFilter, userAccount],
    queryFn: () =>
      adminApi.getAllReviews({
        page,
        pageSize,
        status: statusFilter,
        category: categoryFilter,
        userAccount: userAccount || undefined,
      }),
  });

  const reviews = data?.data?.list ?? [];
  const pagination = data?.data?.pagination;

  const approveMutation = useMutation({
    mutationFn: (id: number) => adminApi.approveReview(id),
    onSuccess: () => {
      message.success('审核通过');
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
    onError: (err: Error) => {
      message.error(err.message || '操作失败');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      adminApi.rejectReview(id, reason),
    onSuccess: () => {
      message.success('已驳回');
      setRejectModalVisible(false);
      setRejectId(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
    onError: (err: Error) => {
      message.error(err.message || '操作失败');
    },
  });

  const handleApprove = useCallback(
    (id: number) => {
      Modal.confirm({
        title: '确认通过',
        content: '确定要通过该审核记录吗？',
        okText: '确定',
        cancelText: '取消',
        onOk: () => approveMutation.mutate(id),
      });
    },
    [approveMutation],
  );

  const handleRejectClick = useCallback((id: number) => {
    setRejectId(id);
    setRejectReason('');
    setRejectModalVisible(true);
  }, []);

  const handleRejectSubmit = useCallback(() => {
    if (!rejectReason.trim()) {
      message.warning('请填写驳回原因');
      return;
    }
    if (rejectId !== null) {
      rejectMutation.mutate({ id: rejectId, reason: rejectReason.trim() });
    }
  }, [rejectId, rejectReason, rejectMutation]);

  const handleSearch = useCallback(() => {
    setUserAccount(searchValue);
    setPage(1);
  }, [searchValue]);

  const handleStatusChange = useCallback((value: string | undefined) => {
    setStatusFilter(value || undefined);
    setPage(1);
  }, []);

  const handleCategoryChange = useCallback((value: string | undefined) => {
    setCategoryFilter(value || undefined);
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

  const columns: ColumnsType<ReviewItem> = [
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
      title: '学号',
      dataIndex: ['user', 'account'],
      width: 120,
      render: (text: string) => text || '--',
    },
    {
      title: '活动名称',
      dataIndex: 'task_name',
      width: 140,
      ellipsis: true,
      render: (text: string) => text || '--',
    },
    {
      title: '任务分类',
      dataIndex: 'task_category',
      width: 100,
      render: (text: string) => text || '--',
    },
    {
      title: '凭证图片',
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
      title: '积分',
      dataIndex: 'points',
      width: 80,
      render: (val: number) => (val != null ? val : '--'),
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
      render: (_: unknown, record: ReviewItem) => {
        if (record.status !== 'pending') {
          return <span style={{ color: '#999' }}>已处理</span>;
        }
        return (
          <Space>
            <Button
              type="primary"
              size="small"
              loading={approveMutation.isPending}
              onClick={() => handleApprove(record.id)}
            >
              通过
            </Button>
            <Button
              danger
              size="small"
              loading={rejectMutation.isPending}
              onClick={() => handleRejectClick(record.id)}
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
        <Title level={3}>审核管理</Title>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
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
        <Input
          placeholder="按任务分类筛选"
          style={{ width: 160 }}
          value={categoryFilter}
          onChange={(e) => handleCategoryChange(e.target.value || undefined)}
          allowClear
        />
        <Search
          placeholder="按学号搜索"
          allowClear
          style={{ width: 200 }}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onSearch={handleSearch}
          enterButton
        />
      </div>

      <Table<ReviewItem>
        rowKey="id"
        columns={columns}
        dataSource={reviews}
        loading={isLoading}
        scroll={{ x: 1400 }}
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

      {/* 驳回弹窗 */}
      <Modal
        title="驳回审核"
        open={rejectModalVisible}
        onOk={handleRejectSubmit}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectId(null);
          setRejectReason('');
        }}
        confirmLoading={rejectMutation.isPending}
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

export default ReviewManagePage;
