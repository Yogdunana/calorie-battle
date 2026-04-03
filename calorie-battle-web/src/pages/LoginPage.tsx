import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Input, Button, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import { validateAccount, validatePassword } from '@/utils/validate';
import { request } from '@/services/api';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoggingIn } = useAuth();
  const [form] = Form.useForm();
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);

  const fetchCaptcha = useCallback(async () => {
    setCaptchaLoading(true);
    try {
      const res = await request.get<{ captchaToken: string; question: string }>('/mail/captcha');
      setCaptchaToken(res.data.captchaToken);
      setCaptchaQuestion(res.data.question);
    } catch {
      message.error('获取验证题失败');
    } finally {
      setCaptchaLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCaptcha();
  }, [fetchCaptcha]);

  const handleSubmit = async (values: {
    account: string;
    password: string;
    captchaAnswer: string;
  }) => {
    const accountError = validateAccount(values.account);
    if (accountError) {
      message.error(accountError);
      return;
    }
    const passwordError = validatePassword(values.password);
    if (passwordError) {
      message.error(passwordError);
      return;
    }
    if (!values.captchaAnswer?.trim()) {
      message.error('请输入验证题答案');
      return;
    }
    login({
      account: values.account,
      password: values.password,
      captchaToken,
      captchaAnswer: values.captchaAnswer.trim(),
    });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card
        style={{ width: 400, maxWidth: '90vw', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ color: '#1677ff', marginBottom: 8 }}>
            🔥 卡路里大作战
          </Title>
          <Text type="secondary">登录你的账号</Text>
        </div>

        <Form
          form={form}
          onFinish={handleSubmit}
          size="large"
          autoComplete="off"
        >
          <Form.Item
            name="account"
            rules={[{ required: true, message: '请输入学号' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入学号" maxLength={10} />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>

          {/* 人机验证 */}
          <Form.Item>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                prefix={<SafetyCertificateOutlined />}
                placeholder={captchaQuestion || '加载中...'}
                style={{ flex: 1 }}
                disabled={!captchaQuestion}
              />
              <Button
                icon={<ReloadOutlined />}
                loading={captchaLoading}
                onClick={fetchCaptcha}
                disabled={captchaLoading}
              >
                换一题
              </Button>
            </Space.Compact>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoggingIn}
              block
              style={{ height: 44 }}
            >
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Link to="/register">注册账号</Link>
            <span style={{ margin: '0 8px', color: '#d9d9d9' }}>|</span>
            <Link to="/reset-password">忘记密码</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
