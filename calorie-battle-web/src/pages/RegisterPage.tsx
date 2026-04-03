import React from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import { validateAccount, validatePassword, validateUsername } from '@/utils/validate';

const { Title, Text } = Typography;

const RegisterPage: React.FC = () => {
  const { register, isRegistering } = useAuth();
  const [form] = Form.useForm();

  const handleSubmit = async (values: { account: string; username: string; password: string; confirmPassword: string }) => {
    const accountError = validateAccount(values.account);
    if (accountError) {
      message.error(accountError);
      return;
    }
    const usernameError = validateUsername(values.username);
    if (usernameError) {
      message.error(usernameError);
      return;
    }
    const passwordError = validatePassword(values.password);
    if (passwordError) {
      message.error(passwordError);
      return;
    }
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }
    register(values);
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
          <Text type="secondary">创建新账号</Text>
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
            <Input prefix={<UserOutlined />} placeholder="请输入学号（10位数字）" maxLength={10} />
          </Form.Item>

          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入姓名（2-20位）" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码（6-32位，含字母和数字）" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            rules={[{ required: true, message: '请确认密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请再次输入密码" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isRegistering}
              block
              style={{ height: 44 }}
            >
              注册
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Link to="/login">已有账号？去登录</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default RegisterPage;
