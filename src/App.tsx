import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import FunStuff from './components/FunStuff';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'fun'>('home');

  return (
    <div className="App">
      <Header onNavigate={setCurrentPage} currentPage={currentPage} />
      {currentPage === 'home' ? <Hero /> : <FunStuff />}
    </div>
  );
}

export default App;