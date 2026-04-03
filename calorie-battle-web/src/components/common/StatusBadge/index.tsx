import React from 'react';
import { Tag } from 'antd';
import { getStatusColor, getStatusText } from '@/utils/format';

interface StatusBadgeProps {
  status: string;
  text?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, text }) => {
  const color = getStatusColor(status);
  const displayText = text || getStatusText(status);

  return <Tag color={color}>{displayText}</Tag>;
};

export default StatusBadge;
