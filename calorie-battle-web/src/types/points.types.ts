export interface PointSummary {
  total_points: number;
  total_earned: number;
  total_used: number;
  available_points: number;
}

export type PointLogType = 'earn' | 'spend' | 'adjust';

export interface PointLog {
  id: number;
  user_id: number;
  type: PointLogType;
  amount: number;
  balance_after: number;
  source: string;
  description?: string;
  related_id?: number;
  created_at?: string;
  operator_id?: number;
  operator_name?: string;
}
