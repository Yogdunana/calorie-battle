import React from 'react';
import { Result } from 'antd';
import { PauseCircleOutlined } from '@ant-design/icons';

const RankingPage: React.FC = () => {
  return (
    <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
      <Result
        icon={<PauseCircleOutlined style={{ color: '#faad14' }} />}
        title="功能未开启"
        subTitle="该功能暂未开放使用，敬请期待"
      />
    </div>
  );
};

export default RankingPage;

{/* ========== 原始代码（已注释） ========== */}
{/*
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Typography, Card, List, Avatar, Tag, Empty, Space } from 'antd';
import {
  TrophyOutlined,
  StarFilled,
  StarOutlined,
  UserOutlined,
  CrownOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { rankingApi } from '@/services/rankingApi';
import useAuthStore from '@/app/store/authStore';
import { formatPoints } from '@/utils/format';
import type { RankingItem } from '@/types/user.types';

const { Title, Text } = Typography;

function getRankStyle(rank: number): { color: string; bgColor: string; icon: React.ReactNode } {
  switch (rank) {
    case 1: return { color: '#ffd700', bgColor: 'linear-gradient(135deg, #fffbe6 0%, #fff1b8 100%)', icon: <CrownOutlined style={{ color: '#ffd700', fontSize: 24 }} /> };
    case 2: return { color: '#c0c0c0', bgColor: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)', icon: <SafetyCertificateOutlined style={{ color: '#c0c0c0', fontSize: 22 }} /> };
    case 3: return { color: '#cd7f32', bgColor: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)', icon: <TrophyOutlined style={{ color: '#cd7f32', fontSize: 20 }} /> };
    default: return { color: '#999', bgColor: 'transparent', icon: (<Text type="secondary" style={{ fontSize: 16, fontWeight: 600 }}>{rank}</Text>) };
  }
}

const TopThreeCard: React.FC<{ item: RankingItem; rank: number }> = ({ item, rank }) => {
  const style = getRankStyle(rank);
  const size = rank === 1 ? { avatar: 64, fontSize: 20 } : { avatar: 52, fontSize: 16 };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 12px', borderRadius: 16, background: style.bgColor, border: rank === 1 ? '2px solid #ffd700' : '1px solid #f0f0f0', position: 'relative', transition: 'transform 0.2s' }}>
      <div style={{ position: 'absolute', top: -12, background: '#fff', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        {style.icon}
      </div>
      <Avatar size={size.avatar} src={item.avatar} icon={<UserOutlined />} style={{ marginTop: 16, border: rank === 1 ? '3px solid #ffd700' : '2px solid #d9d9d9', boxShadow: rank === 1 ? '0 4px 12px rgba(255,215,0,0.3)' : 'none' }} />
      <Text strong style={{ marginTop: 10, fontSize: size.fontSize, maxWidth: 80, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.username}</Text>
      <Text style={{ color: style.color, fontSize: rank === 1 ? 18 : 15, fontWeight: 700, marginTop: 4 }}>{formatPoints(item.total_points)}</Text>
      <Text type="secondary" style={{ fontSize: 12 }}>积分</Text>
    </div>
  );
};

const RankingPage: React.FC = () => {
  const { user } = useAuthStore();
  const { data: rankingData, isLoading } = useQuery({ queryKey: ['ranking'], queryFn: () => rankingApi.getRanking() });
  const rankingList: RankingItem[] = rankingData?.data || [];
  const topThree = rankingList.filter((item) => item.rank <= 3);
  const restList = rankingList.filter((item) => item.rank > 3);
  const myRanking = rankingList.find((item) => item.is_current_user || item.user_id === user?.id);

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}><TrophyOutlined style={{ color: '#faad14', marginRight: 8 }} />排行榜</Title>
      </div>
      {topThree.length > 0 && (
        <Card style={{ marginBottom: 24, borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} bodyStyle={{ padding: '32px 16px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 16 }}>
            {[topThree.find((i) => i.rank === 2), topThree.find((i) => i.rank === 1), topThree.find((i) => i.rank === 3)].filter(Boolean).map((item) => (
              <div key={item!.rank} style={{ flex: 1, maxWidth: 160, marginBottom: item!.rank === 1 ? 0 : 16 }}>
                <TopThreeCard item={item!} rank={item!.rank} />
              </div>
            ))}
          </div>
        </Card>
      )}
      {myRanking && (
        <Card style={{ marginBottom: 16, borderRadius: 12, background: '#e6f4ff', border: '1px solid #91caff' }} bodyStyle={{ padding: '12px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Space size={12}>
              <Tag color="blue" style={{ margin: 0, fontSize: 13 }}>我的排名</Tag>
              <Text strong style={{ fontSize: 16 }}>第 {myRanking.rank} 名</Text>
            </Space>
            <Space size={16}>
              <Text type="secondary">累计获得</Text>
              <Text strong style={{ color: '#1677ff', fontSize: 18 }}>{formatPoints(myRanking.total_earned)}</Text>
              <Text type="secondary">可用积分</Text>
              <Text strong style={{ color: '#faad14', fontSize: 18 }}>{formatPoints(myRanking.total_points)}</Text>
            </Space>
          </div>
        </Card>
      )}
      <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <List loading={isLoading} locale={{ emptyText: <Empty description="暂无排名数据" /> }} dataSource={restList} renderItem={(item) => {
          const isCurrentUser = item.is_current_user || item.user_id === user?.id;
          const rankStyle = getRankStyle(item.rank);
          return (
            <List.Item style={{ padding: '14px 20px', background: isCurrentUser ? '#e6f4ff' : undefined, borderRadius: 8, marginBottom: 4, border: isCurrentUser ? '1px solid #91caff' : 'none' }}>
              <List.Item.Meta
                avatar={<div style={{ width: 36, textAlign: 'center', lineHeight: '36px' }}>{rankStyle.icon}</div>}
                title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar size="small" src={item.avatar} icon={<UserOutlined />} /><Text strong={isCurrentUser}>{item.username}</Text>{isCurrentUser && <Tag color="blue" style={{ margin: 0 }}>我</Tag>}</div>}
                description={<Text type="secondary" style={{ fontSize: 13 }}>累计获得 {formatPoints(item.total_earned)} 积分</Text>}
              />
              <div style={{ textAlign: 'right' }}>
                <Text strong style={{ fontSize: 18, color: rankStyle.color }}>{formatPoints(item.total_points)}</Text>
                <br /><Text type="secondary" style={{ fontSize: 12 }}>积分</Text>
              </div>
            </List.Item>
          );
        }} />
      </Card>
    </div>
  );
};

export default RankingPage;
*/}
