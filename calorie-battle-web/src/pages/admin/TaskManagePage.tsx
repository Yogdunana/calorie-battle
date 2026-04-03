import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const TaskManagePage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>任务管理</Title>
      </div>
    </div>
  );
};

export default TaskManagePage;
