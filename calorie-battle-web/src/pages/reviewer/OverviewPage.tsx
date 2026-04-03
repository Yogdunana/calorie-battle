import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const OverviewPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>审核概览</Title>
      </div>
    </div>
  );
};

export default OverviewPage;
