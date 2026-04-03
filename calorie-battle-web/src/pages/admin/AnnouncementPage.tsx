import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const AnnouncementPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>公告管理</Title>
      </div>
    </div>
  );
};

export default AnnouncementPage;
