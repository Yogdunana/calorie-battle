import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const ItemManagePage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>商品管理</Title>
      </div>
    </div>
  );
};

export default ItemManagePage;
