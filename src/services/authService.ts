import { supabase } from './supabaseClient';
import { User, UserProfile, StudySession, SavedQuestion } from '../types/userTypes';
import { SUPABASE_CONFIG } from '../../cloudfare';

/**
 * Authentication service to handle all user-related operations with Supabase
 */
export const authService = {
  /**
   * Register a new user with email and password
   */
  async register(email: string, password: string, username: string): Promise<{ user: User | null; error: Error | null }> {
    try {
      // 1. Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User registration failed');

      // 2. Create a profile for the user
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          username,
          theme_preference: 'system',
          study_streak: 0,
          last_active: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      return { user: authData.user as any, error: null };
    } catch (error) {
      console.error('Registration error:', error);
      return { user: null, error: error as Error };
    }
  },

  /**
   * Login an existing user with email and password
   */
  async login(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Update last_active timestamp
      if (data.user) {
        await supabase
          .from('profiles')
          .update({ last_active: new Date().toISOString() })
          .eq('user_id', data.user.id);

        // Check and update study streak
        await this.updateStudyStreak(data.user.id);
      }

      return { user: data.user as any, error: null };
    } catch (error) {
      console.error('Login error:', error);
      return { user: null, error: error as Error };
    }
  },

  /**
   * Log out the current user
   */
  async logout(): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Logout error:', error);
      return { error: error as Error };
    }
  },

  /**
   * Get the current logged-in user
   */
  async getCurrentUser(): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { user: data.user as any, error: null };
    } catch (error) {
      console.error('Get current user error:', error);
      return { user: null, error: error as Error };
    }
  },

  /**
   * Reset password for a user (sends email)
   */
  async resetPassword(email: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: error as Error };
    }
  },

  /**
   * Update the user's password (after reset)
   */
  async updatePassword(password: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Update password error:', error);
      return { error: error as Error };
    }
  },

  // Profile Management
  /**
   * Get a user's profile by user ID
   */
  async getUserProfile(userId: string): Promise<{ profile: UserProfile | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return { profile: data as UserProfile, error: null };
    } catch (error) {
      console.error('Get user profile error:', error);
      return { profile: null, error: error as Error };
    }
  },

  /**
   * Update a user's profile
   */
  async updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<{ profile: UserProfile | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) throw error;
      return { profile: data as UserProfile, error: null };
    } catch (error) {
      console.error('Update user profile error:', error);
      return { profile: null, error: error as Error };
    }
  },

  /**
   * Upload avatar image for user
   */
  async uploadAvatar(userId: string, file: File): Promise<{ url: string | null; error: Error | null }> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const avatarUrl = data.publicUrl;

      // Update profile with avatar URL
      await this.updateUserProfile(userId, { avatar_url: avatarUrl });

      return { url: avatarUrl, error: null };
    } catch (error) {
      console.error('Upload avatar error:', error);
      return { url: null, error: error as Error };
    }
  },

  // Progress Tracking
  /**
   * Record a new study session
   */
  async recordStudySession(
    userId: string,
    topic: string,
    questionsAsked: number,
    explanationsRequested: number,
    durationMinutes: number
  ): Promise<{ session: StudySession | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: userId,
          topic,
          questions_asked: questionsAsked,
          explanations_requested: explanationsRequested,
          duration_minutes: durationMinutes,
        })
        .select('*')
        .single();

      if (error) throw error;

      // Update last_active timestamp
      await supabase
        .from('profiles')
        .update({ last_active: new Date().toISOString() })
        .eq('user_id', userId);

      // Update study streak
      await this.updateStudyStreak(userId);

      return { session: data as StudySession, error: null };
    } catch (error) {
      console.error('Record study session error:', error);
      return { session: null, error: error as Error };
    }
  },

  /**
   * Get user's study sessions with pagination
   */
  async getStudySessions(
    userId: string,
    page = 1,
    pageSize = 10
  ): Promise<{ sessions: StudySession[]; count: number; error: Error | null }> {
    try {
      // Get total count
      const { count, error: countError } = await supabase
        .from('study_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) throw countError;

      // Get paginated sessions
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return { sessions: data as StudySession[], count: count || 0, error: null };
    } catch (error) {
      console.error('Get study sessions error:', error);
      return { sessions: [], count: 0, error: error as Error };
    }
  },

  /**
   * Save a question and its answer
   */
  async saveQuestion(
    userId: string,
    question: string,
    answer: string,
    tags: string[] = []
  ): Promise<{ savedQuestion: SavedQuestion | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('saved_questions')
        .insert({
          user_id: userId,
          question,
          answer,
          tags,
          favorite: false,
        })
        .select('*')
        .single();

      if (error) throw error;
      return { savedQuestion: data as SavedQuestion, error: null };
    } catch (error) {
      console.error('Save question error:', error);
      return { savedQuestion: null, error: error as Error };
    }
  },

  /**
   * Get saved questions with filtering and pagination
   */
  async getSavedQuestions(
    userId: string,
    options: {
      page?: number;
      pageSize?: number;
      filterFavorites?: boolean;
      tags?: string[];
      searchQuery?: string;
    } = {}
  ): Promise<{ questions: SavedQuestion[]; count: number; error: Error | null }> {
    try {
      const { page = 1, pageSize = 10, filterFavorites, tags, searchQuery } = options;

      // Start query
      let query = supabase
        .from('saved_questions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // Apply filters
      if (filterFavorites) {
        query = query.eq('favorite', true);
      }

      if (tags && tags.length > 0) {
        query = query.contains('tags', tags);
      }

      if (searchQuery) {
        query = query.or(`question.ilike.%${searchQuery}%,answer.ilike.%${searchQuery}%`);
      }

      // Get count
      const { count, error: countError } = await query;

      if (countError) throw countError;

      // Get paginated data
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return { questions: data as SavedQuestion[], count: count || 0, error: null };
    } catch (error) {
      console.error('Get saved questions error:', error);
      return { questions: [], count: 0, error: error as Error };
    }
  },

  /**
   * Toggle favorite status of a saved question
   */
  async toggleFavorite(
    questionId: string,
    currentStatus: boolean
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase
        .from('saved_questions')
        .update({ favorite: !currentStatus })
        .eq('id', questionId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('Toggle favorite error:', error);
      return { success: false, error: error as Error };
    }
  },

  /**
   * Delete a saved question
   */
  async deleteSavedQuestion(questionId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase.from('saved_questions').delete().eq('id', questionId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('Delete saved question error:', error);
      return { success: false, error: error as Error };
    }
  },

  /**
   * Update study streak based on user activity
   */
  async updateStudyStreak(userId: string): Promise<void> {
    try {
      // Get the user's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('last_active, study_streak')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      const now = new Date();
      const lastActive = new Date(profileData.last_active);
      
      // Calculate days between now and last active
      const timeDiff = now.getTime() - lastActive.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

      let newStreak = profileData.study_streak;
      
      // If last active was yesterday, increment streak
      if (daysDiff === 1) {
        newStreak += 1;
      } 
      // If last active was today, maintain streak
      else if (daysDiff === 0) {
        // Do nothing, keep current streak
      } 
      // If more than one day has passed, reset streak to 1
      else {
        newStreak = 1;
      }

      // Update the streak
      await supabase
        .from('profiles')
        .update({ study_streak: newStreak, last_active: now.toISOString() })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Update study streak error:', error);
    }
  },

  /**
   * Sign in with Google
   * Redirects the user to Google auth page and handles the callback
   */
  async signInWithGoogle(): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      return { user: null, error: null }; // User will be handled in the callback
    } catch (error) {
      console.error('Google sign-in error:', error);
      return { user: null, error: error as Error };
    }
  },

  /**
   * Handle the callback from OAuth providers (like Google)
   * Should be called in the callback page component
   */
  async handleAuthCallback(): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      if (!data.session || !data.session.user) {
        throw new Error('No user found in the session');
      }
      
      const userId = data.session.user.id;
      
      // Check if user profile exists
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      // If no profile exists, create one for the OAuth user
      if (!profileData) {
        const username = data.session.user.email?.split('@')[0] || `user_${userId.substring(0, 8)}`;
        
        await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            username,
            theme_preference: 'system',
            study_streak: 0,
            last_active: new Date().toISOString(),
            avatar_url: data.session.user.user_metadata?.avatar_url || null,
          });
      } else {
        // Update last_active timestamp
        await supabase
          .from('profiles')
          .update({ last_active: new Date().toISOString() })
          .eq('user_id', userId);
          
        // Check and update study streak
        await this.updateStudyStreak(userId);
      }
      
      return { user: data.session.user as any, error: null };
    } catch (error) {
      console.error('Auth callback error:', error);
      return { user: null, error: error as Error };
    }
  },
};