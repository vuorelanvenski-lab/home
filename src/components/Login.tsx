import React, { useState } from 'react';

interface LoginProps {
  onLogin: (username: string, password: string) => string | null;
  onSignup: (username: string, password: string) => { success: boolean; message: string };
}

function Login({ onLogin, onSignup }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSignup, setIsSignup] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isSignup) {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 3) {
        setError('Password must be at least 3 characters');
        return;
      }
      const signupResult = onSignup(username, password);
      if (signupResult.success) {
        setSuccess(signupResult.message);
        setIsSignup(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        setError(signupResult.message);
      }
    } else {
      const loginError = onLogin(username, password);
      if (loginError) {
        setError(loginError);
      }
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>{isSignup ? 'Sign Up' : 'Login'}</h2>
        <div className="form-group">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {isSignup && (
          <div className="form-group">
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        )}
        {error && <p className="error">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        <button type="submit">{isSignup ? 'Sign Up' : 'Login'}</button>
        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: '#8411d1' }}>
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setError('');
              setSuccess('');
              setUsername('');
              setPassword('');
              setConfirmPassword('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#8411d1',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
              font: 'inherit'
            }}
          >
            {isSignup ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </form>
    </div>
  );
}

export default Login;