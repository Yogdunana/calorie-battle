import React from 'react';
import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

const HomePage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>首页</Title>
        <Paragraph>欢迎来到卡路里大作战！</Paragraph>
      </div>
    </div>
  );
};

export default HomePage;
