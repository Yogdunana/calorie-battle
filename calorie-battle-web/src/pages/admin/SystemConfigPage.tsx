import React, { useEffect, useState, useCallback } from 'react';
import {
  Typography,
  Form,
  Input,
  Button,
  Card,
  Spin,
  Space,
  message,
  Divider,
  Tooltip,
} from 'antd';
import { SaveOutlined, InfoCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/adminApi';

const { Title } = Typography;
const { TextArea } = Input;

interface ConfigItem {
  key: string;
  value: string;
  description?: string;
  updated_at?: string;
}

const SystemConfigPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [configKeys, setConfigKeys] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-configs'],
    queryFn: () => adminApi.getConfigs(),
  });

  const configs: ConfigItem[] = data?.data ?? [];

  // 当配置加载后，初始化表单
  useEffect(() => {
    if (configs.length > 0) {
      const formValues: Record<string, string> = {};
      configs.forEach((config) => {
        formValues[config.key] = config.value;
      });
      form.setFieldsValue(formValues);
      setConfigKeys(configs.map((c) => c.key));
    }
  }, [configs, form]);

  const updateMutation = useMutation({
    mutationFn: (configsList: { config_key: string; config_value: string }[]) =>
      adminApi.updateConfigs(configsList),
    onSuccess: () => {
      message.success('配置保存成功');
      queryClient.invalidateQueries({ queryKey: ['admin-configs'] });
    },
    onError: (err: Error) => {
      message.error(err.message || '保存失败');
    },
  });

  const handleSave = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const configsList = configKeys.map((key) => ({
        config_key: key,
        config_value: values[key] ?? '',
      }));
      updateMutation.mutate(configsList);
    } catch {
      // form validation failed
    }
  }, [form, configKeys, updateMutation]);

  const handleReset = useCallback(() => {
    if (configs.length > 0) {
      const formValues: Record<string, string> = {};
      configs.forEach((config) => {
        formValues[config.key] = config.value;
      });
      form.setFieldsValue(formValues);
      message.info('已重置为服务器配置');
    }
  }, [configs, form]);

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>系统配置</Title>
      </div>

      <Spin spinning={isLoading}>
        <Card>
          <Form form={form} layout="vertical">
            {configs.map((config, index) => (
              <React.Fragment key={config.key}>
                <Form.Item
                  label={
                    <Space>
                      <span style={{ fontWeight: 500 }}>{config.key}</span>
                      {config.description && (
                        <Tooltip title={config.description}>
                          <InfoCircleOutlined style={{ color: '#999' }} />
                        </Tooltip>
                      )}
                    </Space>
                  }
                  name={config.key}
                  extra={
                    config.description
                      ? <span style={{ color: '#999', fontSize: 12 }}>{config.description}</span>
                      : undefined
                  }
                >
                  <TextArea
                    rows={2}
                    placeholder={`请输入 ${config.key} 的值`}
                  />
                </Form.Item>
                {index < configs.length - 1 && <Divider style={{ margin: '8px 0' }} />}
              </React.Fragment>
            ))}
          </Form>

          <Divider />

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReset}
            >
              重置
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={updateMutation.isPending}
            >
              保存配置
            </Button>
          </div>
        </Card>
      </Spin>
    </div>
  );
};

export default SystemConfigPage;
