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
  Input,
  message,
} from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/adminApi';
import { UPLOAD_BASE_URL, CHECKIN_STATUS_MAP, STATUS_COLORS } from '@/utils/constants';
import type { PhotoWork } from '@/types/user.types';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

const PHOTO_STATUS_MAP: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
};

const PhotoManagePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-photos', page, pageSize, statusFilter],
    queryFn: () =>
      adminApi.getPhotos({
        page,
        pageSize,
        status: statusFilter,
      }),
  });

  const photos = data?.data?.list ?? [];
  const pagination = data?.data?.pagination;

  const approveMutation = useMutation({
    mutationFn: (id: number) =>
      adminApi.reviewPhoto(id, { status: 'approved' }),
    onSuccess: () => {
      message.success('已通过');
      queryClient.invalidateQueries({ queryKey: ['admin-photos'] });
    },
    onError: (err: Error) => {
      message.error(err.message || '操作失败');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      adminApi.reviewPhoto(id, { status: 'rejected', reject_reason: reason }),
    onSuccess: () => {
      message.success('已驳回');
      setRejectModalVisible(false);
      setRejectId(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-photos'] });
    },
    onError: (err: Error) => {
      message.error(err.message || '操作失败');
    },
  });

  const handleApprove = useCallback(
    (id: number) => {
      Modal.confirm({
        title: '确认通过',
        content: '确定要通过该投稿吗？',
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

  const handleStatusChange = useCallback((value: string | undefined) => {
    setStatusFilter(value || undefined);
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

  const columns: ColumnsType<PhotoWork> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 70,
    },
    {
      title: '作品图片',
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
      title: '标题',
      dataIndex: 'title',
      width: 140,
      ellipsis: true,
      render: (text: string) => text || '--',
    },
    {
      title: '投稿人',
      dataIndex: ['user', 'username'],
      width: 120,
      render: (text: string) => text || '--',
    },
    {
      title: '票数',
      dataIndex: 'vote_count',
      width: 80,
      render: (val: number) => (val != null ? val : 0),
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      width: 170,
      render: (text: string) => (text ? new Date(text).toLocaleString('zh-CN') : '--'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>
          {PHOTO_STATUS_MAP[status] || status}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: unknown, record: PhotoWork) => {
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
        <Title level={3}>投稿管理</Title>
      </div>

      <div style={{ marginBottom: 16 }}>
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

      <Table<PhotoWork>
        rowKey="id"
        columns={columns}
        dataSource={photos}
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

      {/* 驳回弹窗 */}
      <Modal
        title="驳回投稿"
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

export default PhotoManagePage;
