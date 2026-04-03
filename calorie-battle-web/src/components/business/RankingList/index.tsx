import React from 'react';
import { List, Avatar, Typography, Tag } from 'antd';
import { TrophyOutlined, StarFilled, StarOutlined, UserOutlined } from '@ant-design/icons';
import type { RankingItem } from '@/types/user.types';

const { Text } = Typography;

interface RankingListProps {
  data: RankingItem[];
  loading?: boolean;
  currentUserId?: number;
}

/** 获取排名奖牌样式 */
function getRankStyle(rank: number): { color: string; icon: React.ReactNode } {
  switch (rank) {
    case 1:
      return { color: '#ffd700', icon: <TrophyOutlined style={{ color: '#ffd700', fontSize: 20 }} /> };
    case 2:
      return { color: '#c0c0c0', icon: <StarFilled style={{ color: '#c0c0c0', fontSize: 18 }} /> };
    case 3:
      return { color: '#cd7f32', icon: <StarOutlined style={{ color: '#cd7f32', fontSize: 16 }} /> };
    default:
      return { color: '#999', icon: <Text type="secondary">{rank}</Text> };
  }
}

const RankingList: React.FC<RankingListProps> = ({ data, loading = false, currentUserId }) => {
  return (
    <List
      loading={loading}
      dataSource={data}
      renderItem={(item) => {
        const isCurrentUser = item.is_current_user || item.user_id === currentUserId;
        const rankStyle = getRankStyle(item.rank);

        return (
          <List.Item
            style={{
              padding: '12px 16px',
              background: isCurrentUser ? '#e6f4ff' : undefined,
              borderRadius: 8,
              marginBottom: 4,
            }}
          >
            <List.Item.Meta
              avatar={
                <div style={{ width: 40, textAlign: 'center', lineHeight: '40px' }}>
                  {rankStyle.icon}
                </div>
              }
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar size="small" src={item.avatar} icon={<UserOutlined />} />
                  <Text strong={isCurrentUser}>{item.username}</Text>
                  {isCurrentUser && <Tag color="blue">我</Tag>}
                </div>
              }
              description={
                <Text type="secondary">
                  累计 {item.total_earned} 积分
                </Text>
              }
            />
            <div style={{ textAlign: 'right' }}>
              <Text strong style={{ fontSize: 16, color: rankStyle.color }}>
                {item.total_points}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>积分</Text>
            </div>
          </List.Item>
        );
      }}
    />
  );
};

export default RankingList;
