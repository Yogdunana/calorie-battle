import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const DashboardPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>数据概览</Title>
      </div>
    </div>
  );
};

export default DashboardPage;
