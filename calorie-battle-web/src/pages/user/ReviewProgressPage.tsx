import React from 'react';
import { Result } from 'antd';
import { PauseCircleOutlined } from '@ant-design/icons';

const ReviewProgressPage: React.FC = () => {
  return (
    <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
      <Result
        icon={<PauseCircleOutlined style={{ color: '#faad14' }} />}
        title="功能未开启"
        subTitle="该功能暂未开放使用，敬请期待"
      />
    </div>
  );
};

export default ReviewProgressPage;

{/* ========== 原始代码（已注释） ========== */}
{/*
import React, { useState, useMemo } from 'react';
import {
  Typography,
  Card,
  Tag,
  Image,
  Segmented,
  Pagination,
  Spin,
  Empty,
  Descriptions,
  Space,
  Tooltip,
} from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TrophyOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { checkinApi } from '@/services/checkinApi';
import { UPLOAD_BASE_URL, STATUS_COLORS } from '@/utils/constants';
import { formatDateTime, getStatusText } from '@/utils/format';
import type { Checkin, CheckinStatus } from '@/types/checkin.types';

const { Title, Text } = Typography;

const STATUS_FILTER_OPTIONS = [
  { label: '全部', value: '' },
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
];

const STATUS_ICON_MAP: Record<string, React.ReactNode> = {
  pending: <ClockCircleOutlined />,
  approved: <CheckCircleOutlined />,
  rejected: <CloseCircleOutlined />,
};

const ReviewProgressPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-checkins', statusFilter, page, pageSize],
    queryFn: async () => {
      const params: Record<string, any> = { page, pageSize };
      if (statusFilter) { params.status = statusFilter; }
      const res = await checkinApi.getMyCheckins(params);
      return res.data;
    },
  });

  const checkinList = data?.list || [];
  const pagination = data?.pagination;

  const getImageUrls = (checkin: Checkin): string[] => {
    if (checkin.images && checkin.images.length > 0) {
      return checkin.images.map((img) => img.startsWith('http') ? img : `${UPLOAD_BASE_URL}/${img}`);
    }
    if (checkin.image_url) {
      return [checkin.image_url.startsWith('http') ? checkin.image_url : `${UPLOAD_BASE_URL}/${checkin.image_url}`];
    }
    return [];
  };

  const parseSubmitData = (submitData?: string): Record<string, any> => {
    if (!submitData) return {};
    try { return JSON.parse(submitData); } catch { return {}; }
  };

  const getTaskName = (checkin: Checkin): string => {
    if (checkin.task?.name) return checkin.task.name;
    if (checkin.task_name) return checkin.task_name;
    return '未知活动';
  };

  const getTaskCategory = (checkin: Checkin): string => {
    if (checkin.task?.category) return checkin.task.category;
    if (checkin.task_category) return checkin.task_category;
    return '';
  };

  const getPoints = (checkin: Checkin): number | null => {
    if (checkin.points_awarded !== undefined && checkin.points_awarded !== null) return checkin.points_awarded;
    if (checkin.points !== undefined && checkin.points !== null) return checkin.points;
    return null;
  };

  const stats = useMemo(() => {
    if (!data?.list) return { total: 0, pending: 0, approved: 0, rejected: 0 };
    const list = data.list;
    return {
      total: list.length,
      pending: list.filter((c) => c.status === 'pending').length,
      approved: list.filter((c) => c.status === 'approved').length,
      rejected: list.filter((c) => c.status === 'rejected').length,
    };
  }, [data]);

  const handlePageChange = (newPage: number, newPageSize: number) => { setPage(newPage); };
  const handleStatusChange = (value: string) => { setStatusFilter(value); setPage(1); };

  return (
    <div className="page-container">
      <div className="page-header"><Title level={3}>审核进度</Title></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <Card size="small" variant="borderless" style={{ background: '#f6f8fa', textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>全部记录</Text>
          <div style={{ fontSize: 24, fontWeight: 600, marginTop: 4 }}>{pagination?.total ?? 0}</div>
        </Card>
        <Card size="small" variant="borderless" style={{ background: '#e6f4ff', textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>待审核</Text>
          <div style={{ fontSize: 24, fontWeight: 600, marginTop: 4, color: '#1677ff' }}>{stats.pending}</div>
        </Card>
        <Card size="small" variant="borderless" style={{ background: '#f6ffed', textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>已通过</Text>
          <div style={{ fontSize: 24, fontWeight: 600, marginTop: 4, color: '#52c41a' }}>{stats.approved}</div>
        </Card>
        <Card size="small" variant="borderless" style={{ background: '#fff2f0', textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>已驳回</Text>
          <div style={{ fontSize: 24, fontWeight: 600, marginTop: 4, color: '#ff4d4f' }}>{stats.rejected}</div>
        </Card>
      </div>
      <div style={{ marginBottom: 16 }}>
        <Segmented options={STATUS_FILTER_OPTIONS} value={statusFilter} onChange={handleStatusChange} block />
      </div>
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}><Spin size="large" tip="加载中..." /></div>
      ) : isError || checkinList.length === 0 ? (
        <Empty description={isError ? '加载失败，请稍后重试' : '暂无打卡记录'} style={{ padding: '60px 0' }} />
      ) : (
        <>
          <Image.PreviewGroup>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {checkinList.map((checkin) => {
                const imageUrls = getImageUrls(checkin);
                const submitData = parseSubmitData(checkin.submit_data);
                const points = getPoints(checkin);
                const taskName = getTaskName(checkin);
                const taskCategory = getTaskCategory(checkin);
                const statusColor = STATUS_COLORS[checkin.status] || 'default';
                const statusText = getStatusText(checkin.status);
                return (
                  <Card key={checkin.id} size="small" hoverable style={{ borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <Space size={8} align="center">
                          <Tag color={statusColor} icon={STATUS_ICON_MAP[checkin.status]}>{statusText}</Tag>
                          <Text strong style={{ fontSize: 15 }}>{taskName}</Text>
                          {taskCategory && <Tag>{taskCategory}</Tag>}
                        </Space>
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>提交时间：{formatDateTime(checkin.created_at)}</Text>
                        </div>
                      </div>
                      {checkin.status === 'approved' && points !== null && (
                        <Tooltip title="已获得积分">
                          <Tag color="gold" icon={<TrophyOutlined />} style={{ fontSize: 14, padding: '2px 8px' }}>+{points}</Tag>
                        </Tooltip>
                      )}
                    </div>
                    {imageUrls.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                        {imageUrls.map((url, idx) => (
                          <Image key={idx} src={url} alt={`凭证 ${idx + 1}`} width={80} height={80} style={{ objectFit: 'cover', borderRadius: 6, border: '1px solid #f0f0f0' }} />
                        ))}
                      </div>
                    )}
                    {Object.keys(submitData).length > 0 && (
                      <div style={{ background: '#fafafa', borderRadius: 6, padding: '8px 12px', marginBottom: 12 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>打卡信息：</Text>
                        <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
                          {Object.entries(submitData).map(([key, value]) => (
                            <Text key={key} style={{ fontSize: 13 }}>
                              <Text type="secondary">{key}：</Text>
                              <Text strong>{String(value)}</Text>
                            </Text>
                          ))}
                        </div>
                      </div>
                    )}
                    {checkin.status === 'rejected' && checkin.reject_reason && (
                      <div style={{ background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 6, padding: '8px 12px' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>驳回原因：</Text>
                        <div style={{ marginTop: 4 }}><Text style={{ color: '#cf1322', fontSize: 13 }}>{checkin.reject_reason}</Text></div>
                      </div>
                    )}
                    {checkin.reviewed_at && (
                      <div style={{ marginTop: 8, textAlign: 'right' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>审核时间：{formatDateTime(checkin.reviewed_at)}</Text>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </Image.PreviewGroup>
          {pagination && pagination.totalPages > 1 && (
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <Pagination current={pagination.page} pageSize={pagination.pageSize} total={pagination.total} onChange={handlePageChange} showSizeChanger={false} showTotal={(total) => `共 ${total} 条记录`} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReviewProgressPage;
*/}
