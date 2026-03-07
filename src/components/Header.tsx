import React from 'react';

interface HeaderProps {
  onLogout: () => void;
  onNavigate: (page: 'home' | 'fun') => void;
  currentPage: 'home' | 'fun';
}

function Header({ onLogout, onNavigate, currentPage }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-nav-group">
        <button
          onClick={() => onNavigate('home')}
          className={`header-nav-btn ${currentPage === 'home' ? 'active' : ''}`}
        >
          Home
        </button>
        <button
          onClick={() => onNavigate('fun')}
          className={`header-nav-btn ${currentPage === 'fun' ? 'active' : ''}`}
        >
          Fun Stuff
        </button>
      </div>
      <button onClick={onLogout} className="logout-btn">Logout</button>
    </header>
  );
}

export default Header;