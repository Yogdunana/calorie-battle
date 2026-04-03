import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const WeightPlanPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>轻盈计划</Title>
      </div>
    </div>
  );
};

export default WeightPlanPage;
