import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const SensitiveWordPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>敏感词管理</Title>
      </div>
    </div>
  );
};

export default SensitiveWordPage;
