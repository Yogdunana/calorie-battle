import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const ReviewerManagePage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>审核员管理</Title>
      </div>
    </div>
  );
};

export default ReviewerManagePage;
