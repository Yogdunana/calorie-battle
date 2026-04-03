import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';
import { StarOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import { formatPoints } from '@/utils/format';

interface PointCardProps {
  totalPoints: number;
  totalEarned: number;
  totalUsed: number;
  loading?: boolean;
}

const PointCard: React.FC<PointCardProps> = ({
  totalPoints,
  totalEarned,
  totalUsed,
  loading = false,
}) => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={8}>
        <Card loading={loading} hoverable>
          <Statistic
            title="可用积分"
            value={totalPoints}
            formatter={(value) => formatPoints(value as number)}
            valueStyle={{ color: '#1677ff' }}
            prefix={<StarOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card loading={loading} hoverable>
          <Statistic
            title="累计获得"
            value={totalEarned}
            formatter={(value) => formatPoints(value as number)}
            valueStyle={{ color: '#52c41a' }}
            prefix={<RiseOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card loading={loading} hoverable>
          <Statistic
            title="累计使用"
            value={totalUsed}
            formatter={(value) => formatPoints(value as number)}
            valueStyle={{ color: '#ff4d4f' }}
            prefix={<FallOutlined />}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default PointCard;
