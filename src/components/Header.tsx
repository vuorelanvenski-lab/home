import React from 'react';

interface HeaderProps {
  onNavigate: (page: 'home' | 'fun') => void;
  currentPage: 'home' | 'fun';
}

function Header({ onNavigate, currentPage }: HeaderProps) {
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
    </header>
  );
}

export default Header;