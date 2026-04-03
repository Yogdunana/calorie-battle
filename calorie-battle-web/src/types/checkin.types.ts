export type TaskStatus = 'active' | 'inactive';

export interface Task {
  id: number;
  name: string;
  category?: string;
  description: string;
  points: number;
  status: TaskStatus;
  is_active?: boolean;
  submit_rules?: Record<string, any>;
  required_fields?: string[];
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export type CheckinStatus = 'pending' | 'approved' | 'rejected';

export interface Checkin {
  id: number;
  user_id: number;
  task_id: number;
  task_name?: string;
  task_category?: string;
  task_points?: number;
  task?: {
    id: number;
    name: string;
    category?: string;
    points: number;
  };
  image_url?: string;
  images?: string[];
  description?: string;
  submit_data?: string;
  status: CheckinStatus;
  review_comment?: string;
  reject_reason?: string;
  reviewer_id?: number;
  reviewer_name?: string;
  points?: number;
  points_awarded?: number;
  created_at?: string;
  reviewed_at?: string;
  user?: {
    id: number;
    username: string;
    account?: string;
    avatar?: string;
  };
  reviewer?: {
    id: number;
    username: string;
  };
}

export interface CheckinSubmitRequest {
  task_id: number;
  image?: File;
  description?: string;
}
