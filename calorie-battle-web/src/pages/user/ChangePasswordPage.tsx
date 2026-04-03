import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const ChangePasswordPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>修改密码</Title>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
