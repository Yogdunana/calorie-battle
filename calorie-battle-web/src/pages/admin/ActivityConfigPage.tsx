import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const ActivityConfigPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>活动配置</Title>
      </div>
    </div>
  );
};

export default ActivityConfigPage;
