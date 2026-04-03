import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const RankingPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>排行榜</Title>
      </div>
    </div>
  );
};

export default RankingPage;
