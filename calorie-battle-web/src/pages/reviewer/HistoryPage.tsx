import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const HistoryPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>审核记录</Title>
      </div>
    </div>
  );
};

export default HistoryPage;
