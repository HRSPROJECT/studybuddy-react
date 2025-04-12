import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserProfile } from '../../types/userTypes';

const Profile: React.FC = () => {
  const { user, profile, updateProfile, logout } = useAuth();
  const [username, setUsername] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [studyStreak, setStudyStreak] = useState(0);

  // Load user profile data when component mounts
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setTheme(profile.theme_preference || 'light');
      setStudyStreak(profile.study_streak || 0);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setIsSaved(false);

    if (!username) {
      setError('Username is required');
      setIsLoading(false);
      return;
    }

    try {
      const updatedProfile: Partial<UserProfile> = {
        username,
        bio: bio || '',
        theme_preference: theme
      };

      const { success, error } = await updateProfile(updatedProfile);
      
      if (success) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      } else if (error) {
        setError(error);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating your profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div>Please log in to view your profile</div>;
  }

  return (
    <div className="profile-container">
      <h2>Your Profile</h2>
      
      {error && <div className="error-message">{error}</div>}
      {isSaved && <div className="success-message">Profile updated successfully!</div>}
      
      <div className="profile-stats">
        <div className="stat-card">
          <h3>Study Streak</h3>
          <p className="stat-value">{studyStreak} days</p>
        </div>
        <div className="stat-card">
          <h3>Member Since</h3>
          <p className="stat-value">{new Date(user.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={user.email}
            disabled
            className="disabled-input"
          />
          <p className="field-note">Email cannot be changed</p>
        </div>

        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your display name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us a bit about yourself"
            rows={4}
          />
        </div>

        <div className="form-group">
          <label htmlFor="theme">Theme Preference</label>
          <select 
            id="theme"
            value={theme} 
            onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System Default</option>
          </select>
        </div>

        <button 
          type="submit" 
          className="primary-button"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>

        <button 
          type="button" 
          className="secondary-button"
          onClick={logout}
        >
          Logout
        </button>
      </form>
    </div>
  );
};

export default Profile;