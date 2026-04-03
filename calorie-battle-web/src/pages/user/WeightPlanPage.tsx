import React, { useState, useCallback, useMemo } from 'react';
import {
  Typography,
  Card,
  Alert,
  Button,
  Space,
  Upload,
  Modal,
  Timeline,
  Tag,
  Image,
  Empty,
  Spin,
  message,
  Descriptions,
} from 'antd';
import {
  UploadOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { weightPlanApi } from '@/services/weightPlanApi';
import { formatDateTime } from '@/utils/format';
import { UPLOAD_BASE_URL } from '@/utils/constants';
import type { WeightRecord } from '@/types/user.types';
import type { UploadFile } from 'antd';

const { Title, Text, Paragraph } = Typography;

/** 记录类型映射 */
const RECORD_TYPE_MAP: Record<string, { label: string; color: string }> = {
  initial: { label: '初始体重', color: 'blue' },
  final: { label: '最终体重', color: 'green' },
};

/** 审核状态映射 */
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: '待审核', color: 'blue', icon: <ClockCircleOutlined /> },
  approved: { label: '已通过', color: 'green', icon: <CheckCircleOutlined /> },
  rejected: { label: '已驳回', color: 'red', icon: <CloseCircleOutlined /> },
};

const WeightPlanPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [initialFileList, setInitialFileList] = useState<UploadFile[]>([]);
  const [finalFileList, setFinalFileList] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  // 获取我的记录
  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['weightPlanRecords'],
    queryFn: () => weightPlanApi.getMyRecords(),
  });

  const records = recordsData?.data ?? [];

  // 判断是否已提交过某种类型（后端返回的记录可能包含 record_type 字段）
  const hasInitial = useMemo(
    () => records.some((r) => (r as any).record_type === 'initial'),
    [records]
  );
  const hasFinal = useMemo(
    () => records.some((r) => (r as any).record_type === 'final'),
    [records]
  );

  // 提交操作
  const submitMutation = useMutation({
    mutationFn: async ({ recordType, file }: { recordType: 'initial' | 'final'; file: File }) => {
      const formData = new FormData();
      formData.append('record_type', recordType);
      formData.append('screenshot', file);
      const res = await weightPlanApi.submit(formData);
      return res.data;
    },
    onSuccess: (_, variables) => {
      message.success(`${variables.recordType === 'initial' ? '初始体重' : '最终体重'}截图提交成功，请等待审核`);
      if (variables.recordType === 'initial') {
        setInitialFileList([]);
      } else {
        setFinalFileList([]);
      }
      queryClient.invalidateQueries({ queryKey: ['weightPlanRecords'] });
    },
    onError: (error: Error) => {
      message.error(error.message || '提交失败，请稍后重试');
    },
  });

  // 图片预览
  const handlePreview = useCallback(async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as File);
    }
    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
  }, []);

  // 上传前校验
  const beforeUpload = useCallback((file: File) => {
    const isValidType = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type);
    if (!isValidType) {
      message.error('只能上传 JPG/PNG/JPEG/WEBP 格式的图片');
      return Upload.LIST_IGNORE;
    }
    const isValidSize = file.size / 1024 / 1024 < 10;
    if (!isValidSize) {
      message.error('图片大小不能超过 10MB');
      return Upload.LIST_IGNORE;
    }
    return false; // 阻止自动上传
  }, []);

  // 提交截图
  const handleSubmit = useCallback(
    (recordType: 'initial' | 'final') => {
      const fileList = recordType === 'initial' ? initialFileList : finalFileList;
      if (fileList.length === 0) {
        message.warning('请先上传体重/体脂截图');
        return;
      }

      const file = fileList[0].originFileObj;
      if (!file) {
        message.warning('请先上传体重/体脂截图');
        return;
      }

      const typeLabel = recordType === 'initial' ? '初始体重' : '最终体重';

      Modal.confirm({
        title: `确认提交${typeLabel}截图`,
        icon: <ExclamationCircleOutlined />,
        content: (
          <div>
            <p>提交类型：{typeLabel}</p>
            <p style={{ color: '#faad14', marginTop: 8 }}>
              请确保截图清晰显示体重和体脂数据。提交后将由审核员进行审核，审核通过后方可查看数据。
            </p>
          </div>
        ),
        okText: '确认提交',
        cancelText: '取消',
        onOk: () => submitMutation.mutate({ recordType, file }),
      });
    },
    [initialFileList, finalFileList, submitMutation]
  );

  // 渲染时间线颜色
  const getTimelineColor = (status: string): string => {
    switch (status) {
      case 'approved':
        return 'green';
      case 'rejected':
        return 'red';
      default:
        return 'blue';
    }
  };

  // 渲染记录列表
  const renderRecords = () => {
    if (recordsLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      );
    }

    if (records.length === 0) {
      return <Empty description="暂无提交记录" />;
    }

    // 按时间倒序
    const sortedRecords = [...records].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });

    return (
      <Timeline
        items={sortedRecords.map((record) => {
          const statusConfig = STATUS_CONFIG[record.status] || STATUS_CONFIG.pending;
          const recordType = (record as any).record_type as string | undefined;
          const typeConfig = recordType ? (RECORD_TYPE_MAP[recordType] || { label: recordType, color: 'default' }) : { label: '体重记录', color: 'blue' };
          const isApproved = record.status === 'approved';

          return {
            color: getTimelineColor(record.status),
            dot: statusConfig.icon,
            children: (
              <Card
                size="small"
                style={{ borderRadius: 8, marginBottom: 8 }}
                title={
                  <Space>
                    <Tag color={typeConfig.color}>{typeConfig.label}</Tag>
                    <Tag color={statusConfig.color} icon={statusConfig.icon}>
                      {statusConfig.label}
                    </Tag>
                  </Space>
                }
              >
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  {/* 截图预览 */}
                  {record.image_url && (
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        提交截图：
                      </Text>
                      <div style={{ marginTop: 4 }}>
                        <Image
                          src={`${UPLOAD_BASE_URL}${record.image_url}`}
                          alt="体重截图"
                          style={{ maxWidth: 200, maxHeight: 150, objectFit: 'cover', borderRadius: 8 }}
                          fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjYmZiZmJmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5Zu+54mH5Yqg6L295aSx6LSlPC90ZXh0Pjwvc3ZnPg=="
                        />
                      </div>
                    </div>
                  )}

                  {/* 审核通过后显示数据 */}
                  {isApproved && (
                    <Descriptions size="small" column={2} bordered>
                      <Descriptions.Item label="体重">
                        <Text strong style={{ color: '#1677ff', fontSize: 16 }}>
                          {record.current_weight} kg
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="目标体重">
                        <Text strong>{record.target_weight} kg</Text>
                      </Descriptions.Item>
                      {record.height && (
                        <Descriptions.Item label="身高">
                          {record.height} cm
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  )}

                  {/* 驳回原因 */}
                  {record.status === 'rejected' && record.review_comment && (
                    <Alert
                      type="error"
                      showIcon
                      message={`驳回原因：${record.review_comment}`}
                      style={{ borderRadius: 6 }}
                    />
                  )}

                  {/* 审核通过前提示 */}
                  {!isApproved && record.status !== 'rejected' && (
                    <Alert
                      type="info"
                      showIcon
                      message="审核通过后将在此展示体重、体脂数据"
                      style={{ borderRadius: 6 }}
                    />
                  )}

                  {/* 时间信息 */}
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      提交时间：{formatDateTime(record.created_at)}
                    </Text>
                    {record.reviewed_at && (
                      <>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          审核时间：{formatDateTime(record.reviewed_at)}
                        </Text>
                      </>
                    )}
                  </div>
                </Space>
              </Card>
            ),
          };
        })}
      />
    );
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>轻盈计划</Title>
      </div>

      {/* 活动规则说明 */}
      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 24, borderRadius: 8 }}
        message="活动规则"
        description={
          <div>
            <p style={{ margin: '4px 0' }}>
              1. 参与者需分别提交<strong>初始体重</strong>和<strong>最终体重</strong>的截图，截图需清晰显示体重和体脂数据。
            </p>
            <p style={{ margin: '4px 0' }}>
              2. 截图提交后由审核员审核，审核通过后将自动记录您的体重和体脂数据。
            </p>
            <p style={{ margin: '4px 0' }}>
              3. 审核通过前，体重和体脂数据不会展示，仅显示提交状态。
            </p>
            <p style={{ margin: '4px 0' }}>
              4. 每种类型（初始/最终）仅可提交一次，请确保截图清晰准确。
            </p>
          </div>
        }
      />

      {/* 上传区域 */}
      <Card title="提交体重/体脂截图" style={{ marginBottom: 24, borderRadius: 12 }}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {/* 初始体重 */}
          <div>
            <Title level={5}>
              <MedicineBoxOutlined style={{ marginRight: 8 }} />
              提交初始体重截图
            </Title>
            <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 12 }}>
              请上传包含体重和体脂数据的截图（如体脂秤APP截图、体检报告等）。
            </Paragraph>
            <Space>
              <Upload
                listType="picture"
                fileList={initialFileList}
                onPreview={handlePreview}
                beforeUpload={beforeUpload}
                accept=".jpg,.jpeg,.png,.webp"
                maxCount={1}
                onChange={({ fileList: newFileList }) => setInitialFileList(newFileList)}
              >
                <Button icon={<UploadOutlined />} disabled={hasInitial}>
                  选择图片
                </Button>
              </Upload>
              <Button
                type="primary"
                disabled={hasInitial || initialFileList.length === 0 || submitMutation.isPending}
                loading={submitMutation.isPending}
                onClick={() => handleSubmit('initial')}
              >
                {hasInitial ? '已提交' : '提交初始体重'}
              </Button>
            </Space>
            {hasInitial && (
              <Text type="success" style={{ marginLeft: 8, fontSize: 12 }}>
                已提交初始体重截图
              </Text>
            )}
          </div>

          {/* 最终体重 */}
          <div>
            <Title level={5}>
              <MedicineBoxOutlined style={{ marginRight: 8 }} />
              提交最终体重截图
            </Title>
            <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 12 }}>
              请上传包含体重和体脂数据的截图（如体脂秤APP截图、体检报告等）。
            </Paragraph>
            <Space>
              <Upload
                listType="picture"
                fileList={finalFileList}
                onPreview={handlePreview}
                beforeUpload={beforeUpload}
                accept=".jpg,.jpeg,.png,.webp"
                maxCount={1}
                onChange={({ fileList: newFileList }) => setFinalFileList(newFileList)}
              >
                <Button icon={<UploadOutlined />} disabled={hasFinal}>
                  选择图片
                </Button>
              </Upload>
              <Button
                type="primary"
                disabled={hasFinal || finalFileList.length === 0 || submitMutation.isPending}
                loading={submitMutation.isPending}
                onClick={() => handleSubmit('final')}
              >
                {hasFinal ? '已提交' : '提交最终体重'}
              </Button>
            </Space>
            {hasFinal && (
              <Text type="success" style={{ marginLeft: 8, fontSize: 12 }}>
                已提交最终体重截图
              </Text>
            )}
          </div>
        </Space>
      </Card>

      {/* 记录列表 */}
      <Card title="提交记录" style={{ borderRadius: 12 }}>
        {renderRecords()}
      </Card>

      {/* 图片预览弹窗 */}
      <Modal
        open={previewOpen}
        title="图片预览"
        footer={null}
        onCancel={() => setPreviewOpen(false)}
      >
        <img alt="预览" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </div>
  );
};

function getBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export default WeightPlanPage;
