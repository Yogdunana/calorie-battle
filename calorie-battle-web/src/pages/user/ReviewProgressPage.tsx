import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const ReviewProgressPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>审核进度</Title>
      </div>
    </div>
  );
};

export default ReviewProgressPage;
