// Types for authentication and user profiles

/**
 * User object returned from Supabase auth
 */
export interface User {
  id: string;
  email: string;
  created_at: string;
  user_metadata?: {
    [key: string]: any;
  };
}

/**
 * User profile stored in Supabase database
 */
export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  bio?: string;
  avatar_url?: string;
  theme_preference: 'light' | 'dark' | 'system';
  study_streak: number;
  last_active: string;
  created_at: string;
  updated_at: string;
}

/**
 * Study session record for tracking progress
 */
export interface StudySession {
  id: string;
  user_id: string;
  topic: string;
  questions_asked: number;
  explanations_requested: number;
  duration_minutes: number;
  created_at: string;
}

/**
 * Saved question for future reference
 */
export interface SavedQuestion {
  id: string;
  user_id: string;
  question: string;
  answer: string;
  tags: string[];
  favorite: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * User preferences
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notification_preferences: {
    daily_reminder: boolean;
    study_milestone: boolean;
    new_features: boolean;
  };
}