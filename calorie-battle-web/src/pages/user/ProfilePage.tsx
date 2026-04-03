import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const ProfilePage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>个人资料</Title>
      </div>
    </div>
  );
};

export default ProfilePage;
