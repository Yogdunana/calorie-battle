import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const PhotosPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>健身掠影</Title>
      </div>
    </div>
  );
};

export default PhotosPage;
