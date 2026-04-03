import React from 'react';
import { Empty } from 'antd';

interface EmptyStateProps {
  message?: string;
  description?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  message = '暂无数据',
  description,
}) => {
  return <Empty description={description || message} />;
};

export default EmptyState;
