import React from 'react';

interface HeaderProps {
  onLogout: () => void;
}

function Header({ onLogout }: HeaderProps) {
  console.log('Header component rendered'); // Add this for debugging
  return (
    <header className="header">
      <button onClick={onLogout} className="logout-btn">Logout</button>
    </header>
  );
}

export default Header;