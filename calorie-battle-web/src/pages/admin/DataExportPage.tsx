import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const DataExportPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>数据导出</Title>
      </div>
    </div>
  );
};

export default DataExportPage;
