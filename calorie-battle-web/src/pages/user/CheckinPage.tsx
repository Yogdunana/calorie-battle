import React, { useState, useMemo, useCallback } from 'react';
import {
  Typography,
  Select,
  Upload,
  Button,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Alert,
  Modal,
  Card,
  Space,
  message,
  Spin,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkinApi } from '@/services/checkinApi';
import type { Task } from '@/types/checkin.types';
import type { UploadFile, UploadProps } from 'antd';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

/** 字段标签映射 */
const FIELD_LABEL_MAP: Record<string, string> = {
  duration: '运动时长（分钟）',
  distance: '距离（公里）',
  completed_at: '跑步完成时间',
  steps: '步数',
  calories: '消耗热量（千卡）',
  weight: '体重（公斤）',
  heart_rate: '心率（次/分）',
  notes: '备注说明',
};

/** 字段类型映射 */
const FIELD_TYPE_MAP: Record<string, string> = {
  duration: 'number',
  distance: 'number',
  completed_at: 'datetime',
  steps: 'number',
  calories: 'number',
  weight: 'number',
  heart_rate: 'number',
  notes: 'text',
};

const CheckinPage: React.FC = () => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  // 获取任务列表
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['checkin-tasks'],
    queryFn: async () => {
      const res = await checkinApi.getTasks();
      return res.data;
    },
  });

  // 过滤出活跃任务
  const activeTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter(
      (t) => t.is_active || t.status === 'active'
    );
  }, [tasks]);

  // 当前选中的任务
  const selectedTask = useMemo(() => {
    if (!selectedTaskId || !activeTasks) return null;
    return activeTasks.find((t) => t.id === selectedTaskId) || null;
  }, [selectedTaskId, activeTasks]);

  // 必填字段列表
  const requiredFields = useMemo(() => {
    if (!selectedTask?.required_fields) return [];
    return selectedTask.required_fields;
  }, [selectedTask]);

  // 提交打卡
  const submitMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await checkinApi.submitCheckin(formData);
      return res.data;
    },
    onSuccess: () => {
      message.success('打卡提交成功，请等待审核');
      handleReset();
      queryClient.invalidateQueries({ queryKey: ['checkin-tasks'] });
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

  // 图片变更
  const handleChange: UploadProps['onChange'] = useCallback(
    ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
      setFileList(newFileList);
    },
    []
  );

  // 上传前校验
  const beforeUpload = useCallback((file: File) => {
    const isValidType = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(
      file.type
    );
    if (!isValidType) {
      message.error('只能上传 JPG/PNG/JPEG/WEBP 格式的图片');
      return Upload.LIST_IGNORE;
    }
    const isValidSize = file.size / 1024 / 1024 < 10;
    if (!isValidSize) {
      message.error('图片大小不能超过 10MB');
      return Upload.LIST_IGNORE;
    }
    return false; // 阻止自动上传，仅保留本地文件
  }, []);

  // 提交确认
  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();

      if (!selectedTaskId) {
        message.warning('请选择活动任务');
        return;
      }

      if (fileList.length === 0) {
        message.warning('请至少上传一张凭证照片');
        return;
      }

      Modal.confirm({
        title: '确认提交打卡',
        icon: <ExclamationCircleOutlined />,
        content: (
          <div>
            <p>活动任务：{selectedTask?.name}</p>
            <p>凭证照片：{fileList.length} 张</p>
            {requiredFields.length > 0 && (
              <p>
                填写信息：
                {requiredFields
                  .map((f) => `${FIELD_LABEL_MAP[f] || f}: ${values[f] ?? '-'}`)
                  .join('、')}
              </p>
            )}
            <p style={{ color: '#faad14', marginTop: 8 }}>
              请确认信息无误后再提交，提交后将进入审核流程。
            </p>
          </div>
        ),
        okText: '确认提交',
        cancelText: '再想想',
        onOk: () => {
          const formData = new FormData();
          formData.append('task_id', String(selectedTaskId));

          // 构建 submit_data
          const submitData: Record<string, any> = {};
          requiredFields.forEach((field) => {
            const val = values[field];
            if (val !== undefined && val !== null) {
              if (field === 'completed_at' && dayjs.isDayjs(val)) {
                submitData[field] = val.format('YYYY-MM-DD HH:mm:ss');
              } else {
                submitData[field] = val;
              }
            }
          });
          formData.append('submit_data', JSON.stringify(submitData));

          // 添加图片文件
          fileList.forEach((file) => {
            if (file.originFileObj) {
              formData.append('images', file.originFileObj);
            }
          });

          submitMutation.mutate(formData);
        },
      });
    } catch {
      // 表单校验失败
    }
  }, [form, selectedTaskId, selectedTask, fileList, requiredFields, submitMutation]);

  // 重置表单
  const handleReset = useCallback(() => {
    form.resetFields();
    setSelectedTaskId(null);
    setFileList([]);
  }, [form]);

  // 任务切换时重置表单字段
  const handleTaskChange = useCallback(
    (taskId: number) => {
      setSelectedTaskId(taskId);
      form.resetFields(['duration', 'distance', 'completed_at', 'steps', 'calories', 'weight', 'heart_rate', 'notes']);
    },
    [form]
  );

  // 渲染动态表单项
  const renderDynamicFields = () => {
    if (requiredFields.length === 0) return null;

    return (
      <Card
        title="填写打卡信息"
        size="small"
        style={{ marginTop: 16 }}
      >
        <Form.Item
          label="活动说明"
          style={{ marginBottom: 16 }}
        >
          {selectedTask?.description ? (
            <Alert
              message={selectedTask.description}
              type="info"
              showIcon
            />
          ) : (
            <Text type="secondary">暂无说明</Text>
          )}
        </Form.Item>

        {requiredFields.map((field) => {
          const fieldType = FIELD_TYPE_MAP[field] || 'text';
          const label = FIELD_LABEL_MAP[field] || field;

          switch (fieldType) {
            case 'number':
              return (
                <Form.Item
                  key={field}
                  name={field}
                  label={label}
                  rules={[{ required: true, message: `请填写${label}` }]}
                >
                  <InputNumber
                    min={0}
                    step={field === 'distance' ? 0.01 : 1}
                    precision={field === 'distance' ? 2 : 0}
                    placeholder={`请输入${label}`}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              );
            case 'datetime':
              return (
                <Form.Item
                  key={field}
                  name={field}
                  label={label}
                  rules={[{ required: true, message: `请选择${label}` }]}
                  extra="请最晚于跑步完成后1天内上传，否则不予通过"
                >
                  <DatePicker
                    showTime
                    format="YYYY-MM-DD HH:mm:ss"
                    placeholder={`请选择${label}`}
                    disabledDate={(current) => current && current > dayjs().endOf('day')}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              );
            case 'text':
              return (
                <Form.Item
                  key={field}
                  name={field}
                  label={label}
                  rules={[{ required: true, message: `请填写${label}` }]}
                >
                  <TextArea
                    rows={3}
                    placeholder={`请输入${label}`}
                    maxLength={500}
                    showCount
                  />
                </Form.Item>
              );
            default:
              return (
                <Form.Item
                  key={field}
                  name={field}
                  label={label}
                  rules={[{ required: true, message: `请填写${label}` }]}
                >
                  <Input placeholder={`请输入${label}`} />
                </Form.Item>
              );
          }
        })}
      </Card>
    );
  };

  // 上传按钮
  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>上传照片</div>
    </div>
  );

  if (tasksLoading) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" tip="加载中..." />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>打卡提交</Title>
      </div>

      {/* 强制提示文案 */}
      <Alert
        type="warning"
        showIcon
        icon={<ExclamationCircleOutlined />}
        style={{ marginBottom: 24 }}
        message={
          <div>
            <p style={{ margin: 0 }}>
              <strong>注意事项：</strong>
            </p>
            <p style={{ margin: '4px 0 0 0' }}>
              1. 选择的活动与积分类型不匹配不得分
            </p>
            <p style={{ margin: '4px 0 0 0' }}>
              2. 跑步打卡需包含的核心要素：时长、距离、跑步完成时间（请最晚于跑步完成后1天内上传，否则不予通过）
            </p>
          </div>
        }
      />

      <Form form={form} layout="vertical">
        {/* 步骤1：选择活动任务 */}
        <Card title="选择活动任务" size="small">
          {activeTasks.length === 0 ? (
            <Empty description="暂无可用的活动任务" />
          ) : (
            <Form.Item
              name="task_id"
              label="活动任务"
              rules={[{ required: true, message: '请选择活动任务' }]}
            >
              <Select
                placeholder="请选择要打卡的活动任务"
                size="large"
                onChange={handleTaskChange}
                options={activeTasks.map((task: Task) => ({
                  value: task.id,
                  label: (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{task.name}</span>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {task.points} 积分
                      </Text>
                    </div>
                  ),
                }))}
              />
            </Form.Item>
          )}

          {selectedTask && (
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">
                {selectedTask.category && `分类：${selectedTask.category} | `}
                可获得 <Text strong style={{ color: '#1677ff' }}>{selectedTask.points}</Text> 积分
              </Text>
              {selectedTask.description && (
                <Paragraph
                  type="secondary"
                  style={{ marginTop: 8, marginBottom: 0 }}
                  ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}
                >
                  {selectedTask.description}
                </Paragraph>
              )}
            </div>
          )}
        </Card>

        {/* 步骤2：上传照片凭证 */}
        <Card title="上传照片凭证" size="small" style={{ marginTop: 16 }}>
          <Upload
            listType="picture-card"
            fileList={fileList}
            onPreview={handlePreview}
            onChange={handleChange}
            beforeUpload={beforeUpload}
            accept=".jpg,.jpeg,.png,.webp"
            maxCount={5}
            multiple
          >
            {fileList.length >= 5 ? null : uploadButton}
          </Upload>
          <Text type="secondary" style={{ fontSize: 12 }}>
            支持 JPG/PNG/JPEG/WEBP 格式，单张不超过 10MB，最多上传 5 张
          </Text>
        </Card>

        {/* 步骤3：动态填写信息 */}
        {renderDynamicFields()}

        {/* 提交按钮 */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Space size="middle">
            <Button size="large" onClick={handleReset}>
              重置
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              loading={submitMutation.isPending}
              onClick={handleSubmit}
            >
              提交打卡
            </Button>
          </Space>
        </div>
      </Form>

      {/* 图片预览弹窗 */}
      <Modal
        open={previewOpen}
        title="图片预览"
        footer={null}
        onCancel={() => setPreviewOpen(false)}
      >
        <img
          alt="预览"
          style={{ width: '100%' }}
          src={previewImage}
        />
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

export default CheckinPage;
