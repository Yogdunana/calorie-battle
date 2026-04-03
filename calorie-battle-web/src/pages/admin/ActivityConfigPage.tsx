import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Form,
  Input,
  DatePicker,
  Switch,
  InputNumber,
  Button,
  Card,
  Spin,
  message,
  Divider,
  Row,
  Col,
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/adminApi';
import type { Activity } from '@/types/user.types';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;

interface ActivityFormData {
  name: string;
  description?: string;
  start_date: dayjs.Dayjs;
  end_date: dayjs.Dayjs;
  point_expire_date?: dayjs.Dayjs;
  checkin_enabled?: boolean;
  voting_enabled?: boolean;
  voting_start?: dayjs.Dayjs;
  voting_end?: dayjs.Dayjs;
  daily_vote_limit?: number;
}

const ActivityConfigPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [initialLoaded, setInitialLoaded] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-activity'],
    queryFn: () => adminApi.getActivity(),
  });

  const activity: Activity | undefined = data?.data;

  // Populate form when data loads
  useEffect(() => {
    if (activity && !initialLoaded) {
      form.setFieldsValue({
        name: activity.name,
        description: activity.description || '',
        start_date: activity.start_date ? dayjs(activity.start_date) : undefined,
        end_date: activity.end_date ? dayjs(activity.end_date) : undefined,
        point_expire_date: activity.point_expire_date ? dayjs(activity.point_expire_date) : undefined,
        checkin_enabled: activity.checkin_enabled ?? false,
        voting_enabled: activity.voting_enabled ?? false,
        voting_start: activity.voting_start ? dayjs(activity.voting_start) : undefined,
        voting_end: activity.voting_end ? dayjs(activity.voting_end) : undefined,
        daily_vote_limit: activity.daily_vote_limit ?? 1,
      });
      setInitialLoaded(true);
    }
  }, [activity, form, initialLoaded]);

  const updateMutation = useMutation({
    mutationFn: (values: ActivityFormData) => {
      const payload: Record<string, any> = {
        name: values.name,
        description: values.description || '',
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : undefined,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : undefined,
        point_expire_date: values.point_expire_date ? values.point_expire_date.format('YYYY-MM-DD') : undefined,
        checkin_enabled: values.checkin_enabled ?? false,
        voting_enabled: values.voting_enabled ?? false,
        voting_start: values.voting_start ? values.voting_start.format('YYYY-MM-DD HH:mm:ss') : undefined,
        voting_end: values.voting_end ? values.voting_end.format('YYYY-MM-DD HH:mm:ss') : undefined,
        daily_vote_limit: values.daily_vote_limit ?? 1,
      };
      return adminApi.updateActivity(activity?.id ?? 0, payload);
    },
    onSuccess: () => {
      message.success('活动配置保存成功');
      queryClient.invalidateQueries({ queryKey: ['admin-activity'] });
    },
    onError: (err: Error) => {
      message.error(err.message || '保存失败');
    },
  });

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      updateMutation.mutate(values);
    } catch {
      // form validation failed
    }
  }, [form, updateMutation]);

  const votingEnabled = Form.useWatch('voting_enabled', form);

  if (isLoading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>活动配置</Title>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={updateMutation.isPending}
          onClick={handleSubmit}
        >
          保存配置
        </Button>
      </div>

      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 16 }}
      >
        {/* 基本信息 */}
        <Card title="基本信息" style={{ marginBottom: 16 }}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="活动名称"
                name="name"
                rules={[{ required: true, message: '请输入活动名称' }]}
              >
                <Input placeholder="请输入活动名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="活动描述" name="description">
                <TextArea rows={2} placeholder="请输入活动描述" maxLength={500} showCount />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                label="开始日期"
                name="start_date"
                rules={[{ required: true, message: '请选择开始日期' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="请选择开始日期" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="结束日期"
                name="end_date"
                rules={[{ required: true, message: '请选择结束日期' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="请选择结束日期" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="积分过期日期" name="point_expire_date">
                <DatePicker style={{ width: '100%' }} placeholder="请选择积分过期日期" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 打卡配置 */}
        <Card title="打卡配置" style={{ marginBottom: 16 }}>
          <Form.Item
            label="打卡是否开启"
            name="checkin_enabled"
            valuePropName="checked"
          >
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>
        </Card>

        {/* 投票配置 */}
        <Card title="投票配置">
          <Form.Item
            label="投票是否开启"
            name="voting_enabled"
            valuePropName="checked"
          >
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>

          {votingEnabled && (
            <>
              <Divider />
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item label="投票开始时间" name="voting_start">
                    <DatePicker
                      style={{ width: '100%' }}
                      showTime
                      placeholder="请选择投票开始时间"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="投票结束时间" name="voting_end">
                    <DatePicker
                      style={{ width: '100%' }}
                      showTime
                      placeholder="请选择投票结束时间"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="每日投票上限" name="daily_vote_limit">
                    <InputNumber
                      min={1}
                      max={999}
                      style={{ width: '100%' }}
                      placeholder="请输入每日投票上限"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}
        </Card>
      </Form>
    </div>
  );
};

export default ActivityConfigPage;
