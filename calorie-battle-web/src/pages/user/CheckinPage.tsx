import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const CheckinPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>打卡提交</Title>
      </div>
    </div>
  );
};

export default CheckinPage;
