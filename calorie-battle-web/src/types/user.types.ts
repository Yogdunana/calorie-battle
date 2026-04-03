export interface RankingItem {
  rank: number;
  user_id: number;
  username: string;
  avatar?: string;
  total_points: number;
  total_earned: number;
  is_current_user?: boolean;
}

export interface WeightRecord {
  id: number;
  user_id: number;
  current_weight: number;
  target_weight: number;
  height?: number;
  start_date?: string;
  image_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  review_comment?: string;
  created_at?: string;
  reviewed_at?: string;
  user?: {
    id: number;
    username: string;
    avatar?: string;
  };
}

export interface RedemptionItem {
  id: number;
  name: string;
  description?: string;
  image_url?: string;
  points_required: number;
  stock: number;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface Redemption {
  id: number;
  user_id: number;
  item_id: number;
  item_name?: string;
  points_cost: number;
  redeem_code?: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_at?: string;
  completed_at?: string;
  user?: {
    id: number;
    username: string;
    avatar?: string;
  };
}

export type PhotoWorkStatus = 'pending' | 'approved' | 'rejected';

export interface PhotoWork {
  id: number;
  user_id: number;
  image_url: string;
  title?: string;
  description?: string;
  vote_count: number;
  status: PhotoWorkStatus;
  created_at?: string;
  user?: {
    id: number;
    username: string;
    avatar?: string;
  };
  has_voted?: boolean;
}

export interface VoteRecord {
  id: number;
  user_id: number;
  photo_id: number;
  created_at?: string;
}

export interface Activity {
  id: number;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'inactive';
  checkin_points_base: number;
  weight_plan_points: number;
  photo_vote_points: number;
  point_expire_date?: string;
  checkin_enabled?: boolean;
  voting_enabled?: boolean;
  voting_start?: string;
  voting_end?: string;
  daily_vote_limit?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AuditLog {
  id: number;
  operator_id: number;
  operator_name: string;
  action: string;
  target_type: string;
  target_id: number;
  detail?: string;
  ip_address?: string;
  created_at?: string;
}

export interface SystemConfig {
  key: string;
  value: string;
  description?: string;
  updated_at?: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'important';
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface DashboardStats {
  total_users: number;
  total_checkins: number;
  total_points_issued: number;
  total_points_redeemed: number;
  pending_reviews: number;
  active_tasks: number;
  today_checkins: number;
  week_checkins: number;
  // Aliases used by admin Dashboard component
  totalUsers?: number;
  pendingCount?: number;
  todaySubmissions?: number;
  approvalRate?: number;
  totalCount?: number;
  totalPointsIssued?: number;
  activityBreakdown?: any[];
}
