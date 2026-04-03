import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const PointsPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>积分管理</Title>
      </div>
    </div>
  );
};

export default PointsPage;
