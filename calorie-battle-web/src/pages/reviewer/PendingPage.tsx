import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const PendingPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>待审核列表</Title>
      </div>
    </div>
  );
};

export default PendingPage;
