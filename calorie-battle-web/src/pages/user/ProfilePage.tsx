import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Typography,
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Descriptions,
  Divider,
  Space,
  message,
  Tag,
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  LockOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { authApi } from '@/services/authApi';
import useAuthStore from '@/app/store/authStore';
import { ROLES, UPLOAD_BASE_URL } from '@/utils/constants';
import { validatePassword, validateUsername } from '@/utils/validate';

const { Title, Text } = Typography;

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // 修改用户名
  const updateProfileMutation = useMutation({
    mutationFn: (data: { username?: string; avatar?: string }) =>
      authApi.updateProfile(data),
    onSuccess: (res) => {
      message.success('用户名修改成功');
      updateUser(res.data);
      setEditingUsername(false);
      usernameForm.resetFields();
    },
    onError: (error: Error) => {
      message.error(error.message || '修改失败，请稍后重试');
    },
  });

  // 修改密码
  const changePasswordMutation = useMutation({
    mutationFn: (data: { oldPassword: string; newPassword: string }) =>
      authApi.changePassword(data),
    onSuccess: () => {
      message.success('密码修改成功，请重新登录');
      passwordForm.resetFields();
      // 密码修改成功后退出登录
      setTimeout(() => {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }, 1500);
    },
    onError: (error: Error) => {
      message.error(error.message || '密码修改失败，请稍后重试');
    },
  });

  // 提交用户名修改
  const handleUpdateUsername = async () => {
    try {
      const values = await usernameForm.validateFields();
      updateProfileMutation.mutate({ username: values.username });
    } catch {
      // 表单校验失败，不做额外处理
    }
  };

  // 提交密码修改
  const handleChangePassword = async () => {
    try {
      const values = await passwordForm.validateFields();
      changePasswordMutation.mutate({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
    } catch {
      // 表单校验失败，不做额外处理
    }
  };

  // 头像地址
  const avatarUrl = user?.avatar
    ? user.avatar.startsWith('http')
      ? user.avatar
      : `${UPLOAD_BASE_URL}/${user.avatar}`
    : undefined;

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>
          <UserOutlined style={{ marginRight: 8 }} />
          个人资料
        </Title>
      </div>

      {/* 用户基本信息卡片 */}
      <Card
        style={{ borderRadius: 12, marginBottom: 24 }}
        bodyStyle={{ padding: '32px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
          <Avatar
            size={80}
            src={avatarUrl}
            icon={<UserOutlined />}
            style={{
              border: '3px solid #e6f4ff',
              boxShadow: '0 4px 12px rgba(22,119,255,0.15)',
            }}
          />
          <div>
            <Space size={8} align="center">
              <Title level={4} style={{ margin: 0 }}>
                {user?.username}
              </Title>
              <Tag color="blue">{ROLES[user?.role || 'user']}</Tag>
            </Space>
            <Text type="secondary" style={{ fontSize: 13 }}>
              学号：{user?.account}
            </Text>
          </div>
        </div>

        <Descriptions
          bordered
          column={{ xs: 1, sm: 2 }}
          labelStyle={{ fontWeight: 500, background: '#fafafa', width: 120 }}
        >
          <Descriptions.Item label="学号">{user?.account}</Descriptions.Item>
          <Descriptions.Item label="姓名">{user?.username}</Descriptions.Item>
          <Descriptions.Item label="角色">
            <Tag color="blue">{ROLES[user?.role || 'user']}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="账号状态">
            <Tag color={user?.status === 'active' ? 'green' : 'red'}>
              {user?.status === 'active' ? '正常' : '已禁用'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="可用积分">
            <Text strong style={{ color: '#1677ff' }}>
              {user?.total_points ?? 0}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="累计获得">
            <Text strong style={{ color: '#52c41a' }}>
              {user?.total_earned ?? 0}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="注册时间" span={2}>
            {user?.created_at || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 修改用户名 */}
      <Card
        style={{ borderRadius: 12, marginBottom: 24 }}
        title={
          <Space>
            <EditOutlined />
            <span>修改姓名</span>
          </Space>
        }
      >
        {!editingUsername ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Space>
              <Text type="secondary">当前姓名：</Text>
              <Text strong>{user?.username}</Text>
            </Space>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                usernameForm.setFieldsValue({ username: user?.username });
                setEditingUsername(true);
              }}
            >
              修改
            </Button>
          </div>
        ) : (
          <Form
            form={usernameForm}
            layout="inline"
            style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入姓名' },
                {
                  validator: (_, value) => {
                    const error = validateUsername(value);
                    return error ? Promise.reject(new Error(error)) : Promise.resolve();
                  },
                },
              ]}
            >
              <Input
                placeholder="请输入新姓名"
                style={{ width: 200 }}
                maxLength={20}
              />
            </Form.Item>
            <Space>
              <Button
                type="primary"
                loading={updateProfileMutation.isPending}
                onClick={handleUpdateUsername}
                icon={<CheckCircleOutlined />}
              >
                保存
              </Button>
              <Button
                onClick={() => {
                  setEditingUsername(false);
                  usernameForm.resetFields();
                }}
              >
                取消
              </Button>
            </Space>
          </Form>
        )}
      </Card>

      {/* 修改密码 */}
      <Card
        style={{ borderRadius: 12 }}
        title={
          <Space>
            <LockOutlined />
            <span>修改密码</span>
          </Space>
        }
      >
        <Form
          form={passwordForm}
          layout="vertical"
          style={{ maxWidth: 480 }}
          onFinish={handleChangePassword}
        >
          <Form.Item
            name="oldPassword"
            label="旧密码"
            rules={[{ required: true, message: '请输入旧密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="请输入旧密码"
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              {
                validator: (_, value) => {
                  const error = validatePassword(value);
                  return error ? Promise.reject(new Error(error)) : Promise.resolve();
                },
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="6-32位，必须包含字母和数字"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="请再次输入新密码"
            />
          </Form.Item>

          <Divider style={{ margin: '8px 0 16px' }} />

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={changePasswordMutation.isPending}
              icon={<CheckCircleOutlined />}
              style={{ width: '100%' }}
            >
              修改密码
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ProfilePage;
