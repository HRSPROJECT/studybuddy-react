import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Redirect to login page since we're only using Google sign-in
  useEffect(() => {
    navigate('/login');
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { success, error } = await signInWithGoogle();
      
      if (!success && error) {
        setError(error);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during Google sign-in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>Create an Account</h2>
      {error && <div className="error-message">{error}</div>}
      
      <div className="auth-info">
        <p>StudyBuddy now uses Google sign-in for all accounts.</p>
        <p>You will be redirected to the login page.</p>
      </div>

      <button 
        onClick={handleGoogleSignIn}
        className="google-signin-button"
        disabled={isLoading}
        type="button"
      >
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" 
          alt="Google logo" 
          className="google-icon" 
        />
        {isLoading ? 'Signing in...' : 'Sign in with Google'}
      </button>
    </div>
  );
};

export default Register;