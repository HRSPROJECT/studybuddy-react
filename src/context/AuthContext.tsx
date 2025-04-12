import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { User, UserProfile } from '../types/userTypes';

// Define the shape of our auth context
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  register: (email: string, password: string, username: string) => Promise<{ success: boolean; error: string | null }>;
  logout: () => Promise<{ success: boolean; error: string | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error: string | null }>;
  uploadAvatar: (file: File) => Promise<{ url: string | null; error: string | null }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error: string | null }>;
  signInWithGoogle: () => Promise<{ success: boolean; error: string | null }>;
  handleAuthCallback: () => Promise<{ success: boolean; error: string | null }>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  error: null,
  login: async () => ({ success: false, error: 'AuthContext not initialized' }),
  register: async () => ({ success: false, error: 'AuthContext not initialized' }),
  logout: async () => ({ success: false, error: 'AuthContext not initialized' }),
  updateProfile: async () => ({ success: false, error: 'AuthContext not initialized' }),
  uploadAvatar: async () => ({ url: null, error: 'AuthContext not initialized' }),
  resetPassword: async () => ({ success: false, error: 'AuthContext not initialized' }),
  signInWithGoogle: async () => ({ success: false, error: 'AuthContext not initialized' }),
  handleAuthCallback: async () => ({ success: false, error: 'AuthContext not initialized' }),
});

// Create the provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize - check if user is already logged in
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { user: currentUser, error: userError } = await authService.getCurrentUser();
        
        if (userError) {
          console.error('Error getting current user:', userError);
          setLoading(false);
          return;
        }

        if (currentUser) {
          setUser(currentUser);
          
          // Get user profile
          const { profile: userProfile, error: profileError } = await authService.getUserProfile(currentUser.id);
          
          if (profileError) {
            console.error('Error getting user profile:', profileError);
          } else if (userProfile) {
            setProfile(userProfile);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const { user: loggedInUser, error: loginError } = await authService.login(email, password);
      
      if (loginError) {
        setError(loginError.message);
        return { success: false, error: loginError.message };
      }

      if (loggedInUser) {
        setUser(loggedInUser);
        
        // Get user profile
        const { profile: userProfile, error: profileError } = await authService.getUserProfile(loggedInUser.id);
        
        if (profileError) {
          console.error('Error getting user profile:', profileError);
        } else if (userProfile) {
          setProfile(userProfile);
        }
        
        return { success: true, error: null };
      }
      
      return { success: false, error: 'Login failed' };
    } catch (err: any) {
      const errorMessage = err.message || 'An unknown error occurred during login';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (email: string, password: string, username: string) => {
    setError(null);
    try {
      const { user: newUser, error: registerError } = await authService.register(email, password, username);
      
      if (registerError) {
        setError(registerError.message);
        return { success: false, error: registerError.message };
      }

      if (newUser) {
        setUser(newUser);
        
        // Get user profile after registration
        const { profile: userProfile, error: profileError } = await authService.getUserProfile(newUser.id);
        
        if (profileError) {
          console.error('Error getting user profile after registration:', profileError);
        } else if (userProfile) {
          setProfile(userProfile);
        }
        
        return { success: true, error: null };
      }
      
      return { success: false, error: 'Registration failed' };
    } catch (err: any) {
      const errorMessage = err.message || 'An unknown error occurred during registration';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const { error: logoutError } = await authService.logout();
      
      if (logoutError) {
        setError(logoutError.message);
        return { success: false, error: logoutError.message };
      }

      // Clear user and profile state
      setUser(null);
      setProfile(null);
      
      return { success: true, error: null };
    } catch (err: any) {
      const errorMessage = err.message || 'An unknown error occurred during logout';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Update profile function
  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!user) {
        return { success: false, error: 'No user is logged in' };
      }

      const { profile: updatedProfile, error: updateError } = await authService.updateUserProfile(
        user.id,
        updates
      );
      
      if (updateError) {
        return { success: false, error: updateError.message };
      }

      if (updatedProfile) {
        setProfile(updatedProfile);
        return { success: true, error: null };
      }
      
      return { success: false, error: 'Profile update failed' };
    } catch (err: any) {
      const errorMessage = err.message || 'An unknown error occurred updating profile';
      return { success: false, error: errorMessage };
    }
  };

  // Upload avatar function
  const uploadAvatar = async (file: File) => {
    try {
      if (!user) {
        return { url: null, error: 'No user is logged in' };
      }

      const { url, error: uploadError } = await authService.uploadAvatar(user.id, file);
      
      if (uploadError) {
        return { url: null, error: uploadError.message };
      }

      // Update the profile state with the new avatar URL
      if (url && profile) {
        setProfile({ ...profile, avatar_url: url });
      }
      
      return { url, error: null };
    } catch (err: any) {
      const errorMessage = err.message || 'An unknown error occurred uploading avatar';
      return { url: null, error: errorMessage };
    }
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    try {
      const { error: resetError } = await authService.resetPassword(email);
      
      if (resetError) {
        return { success: false, error: resetError.message };
      }
      
      return { success: true, error: null };
    } catch (err: any) {
      const errorMessage = err.message || 'An unknown error occurred resetting password';
      return { success: false, error: errorMessage };
    }
  };

  // Sign in with Google function
  const signInWithGoogle = async () => {
    try {
      const { user: googleUser, error: googleError } = await authService.signInWithGoogle();
      
      if (googleError) {
        setError(googleError.message);
        return { success: false, error: googleError.message };
      }

      if (googleUser) {
        setUser(googleUser);
        
        // Get user profile
        const { profile: userProfile, error: profileError } = await authService.getUserProfile(googleUser.id);
        
        if (profileError) {
          console.error('Error getting user profile:', profileError);
        } else if (userProfile) {
          setProfile(userProfile);
        }
        
        return { success: true, error: null };
      }
      
      return { success: false, error: 'Google sign-in failed' };
    } catch (err: any) {
      const errorMessage = err.message || 'An unknown error occurred during Google sign-in';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Handle auth callback function
  const handleAuthCallback = async () => {
    try {
      const { user: callbackUser, error: callbackError } = await authService.handleAuthCallback();
      
      if (callbackError) {
        setError(callbackError.message);
        return { success: false, error: callbackError.message };
      }

      if (callbackUser) {
        setUser(callbackUser);
        
        // Get user profile
        const { profile: userProfile, error: profileError } = await authService.getUserProfile(callbackUser.id);
        
        if (profileError) {
          console.error('Error getting user profile:', profileError);
        } else if (userProfile) {
          setProfile(userProfile);
        }
        
        return { success: true, error: null };
      }
      
      return { success: false, error: 'Auth callback handling failed' };
    } catch (err: any) {
      const errorMessage = err.message || 'An unknown error occurred during auth callback handling';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Create the context value
  const value = {
    user,
    profile,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    uploadAvatar,
    resetPassword,
    signInWithGoogle,
    handleAuthCallback,
  };

  // Provide the context to the children
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Create a hook to use the auth context
export const useAuth = () => useContext(AuthContext);