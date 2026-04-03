export type TaskStatus = 'active' | 'inactive';

export interface Task {
  id: number;
  name: string;
  description: string;
  points: number;
  status: TaskStatus;
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
  image_url?: string;
  description?: string;
  status: CheckinStatus;
  review_comment?: string;
  reviewer_id?: number;
  reviewer_name?: string;
  points?: number;
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
