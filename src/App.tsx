import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Login from './components/Login';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    const storedLogin = localStorage.getItem('isLoggedIn');
    if (storedLogin === 'true') {
      setIsLoggedIn(true);
    }
    
    // Initialize users if not already done
    const existingUsers = localStorage.getItem('users');
    if (!existingUsers) {
      const defaultUsers = [{ username: 'admin', password: 'admin' }];
      localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
  }, []);

  const handleLogin = (username: string, password: string): string | null => {
    const usersJson = localStorage.getItem('users');
    const users = usersJson ? JSON.parse(usersJson) : [];
    
    const user = users.find((u: any) => u.username === username && u.password === password);
    if (user) {
      setIsLoggedIn(true);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentUser', username);
      return null;
    } else {
      return 'Invalid credentials';
    }
  };

  const handleSignup = (username: string, password: string): { success: boolean; message: string } => {
    const usersJson = localStorage.getItem('users');
    const users = usersJson ? JSON.parse(usersJson) : [];
    
    if (users.some((u: any) => u.username === username)) {
      return { success: false, message: 'Username already exists' };
    }
    
    users.push({ username, password });
    localStorage.setItem('users', JSON.stringify(users));
    return { success: true, message: 'Account created successfully. You can now log in.' };
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
  };

  return (
    <div className="App">
      {isLoggedIn ? (
        <>
          <Header onLogout={handleLogout} />
          <Hero />
        </>
      ) : (
        <Login onLogin={handleLogin} onSignup={handleSignup} />
      )}
    </div>
  );
}

export default App;