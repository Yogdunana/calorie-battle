import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const UserManagePage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>用户管理</Title>
      </div>
    </div>
  );
};

export default UserManagePage;
