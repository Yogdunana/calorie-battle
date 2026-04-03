import type { CheckinStatus } from './checkin.types';

export interface ReviewItem {
  id: number;
  checkin_id: number;
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
}

/** ReviewRecord is an alias for ReviewItem used in reviewer pages */
export type ReviewRecord = ReviewItem;

export interface BatchReviewRequest {
  ids: number[];
  action: 'approve' | 'reject';
  comment?: string;
}
