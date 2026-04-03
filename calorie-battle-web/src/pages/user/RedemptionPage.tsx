import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const RedemptionPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>积分兑换</Title>
      </div>
    </div>
  );
};

export default RedemptionPage;
