import React, { useState, useCallback } from 'react';
import {
  Typography,
  Table,
  Tag,
  Select,
  Tooltip,
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import { reviewApi } from '@/services/reviewApi';
import { CHECKIN_STATUS_MAP, STATUS_COLORS } from '@/utils/constants';
import { formatDateTime } from '@/utils/format';
import type { ReviewItem } from '@/types/review.types';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

const HistoryPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ['reviewer-history', page, pageSize, statusFilter],
    queryFn: () =>
      reviewApi.getReviewHistory({
        page,
        pageSize,
        status: statusFilter,
      }),
  });

  const reviews: ReviewItem[] = data?.data?.list ?? [];
  const pagination = data?.data?.pagination;

  const handleStatusChange = useCallback((value: string | undefined) => {
    setStatusFilter(value || undefined);
    setPage(1);
  }, []);

  const columns: ColumnsType<ReviewItem> = [
    {
      title: '审核时间',
      dataIndex: 'reviewed_at',
      width: 170,
      render: (text: string) => (text ? formatDateTime(text) : '--'),
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
      title: '审核结果',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>
          {CHECKIN_STATUS_MAP[status] || status}
        </Tag>
      ),
    },
    {
      title: '审核意见/驳回原因',
      dataIndex: 'review_comment',
      width: 200,
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
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>审核记录</Title>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <Select
          placeholder="按审核状态筛选"
          allowClear
          style={{ width: 160 }}
          value={statusFilter}
          onChange={handleStatusChange}
          options={[
            { label: '已通过', value: 'approved' },
            { label: '已驳回', value: 'rejected' },
          ]}
        />
      </div>

      <Table<ReviewItem>
        rowKey="id"
        columns={columns}
        dataSource={reviews}
        loading={isLoading}
        scroll={{ x: 900 }}
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
    </div>
  );
};

export default HistoryPage;
