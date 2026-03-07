import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    VANTA: any;
  }
}

function Hero() {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);

  useEffect(() => {
    if (window.VANTA && vantaRef.current && !vantaEffect.current) {
      vantaEffect.current = window.VANTA.NET({
        el: vantaRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: 0xdd3fff,
        backgroundColor: 0x0,
        points: 18.00,
        maxDistance: 16.00,
        spacing: 16.00
      });
    }

    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, []);

  return (
    <section className="hero" ref={vantaRef}>
      <h1>boots</h1>
      <div className="icon-links">
        <a href="https://steamcommunity.com/profiles/76561198971745350" target="_blank" rel="noopener noreferrer" className="icon-link">
          <i className="fab fa-steam icon"></i>
          Steam
        </a>
        <a href="https://x.com/" target="_blank" rel="noopener noreferrer" className="icon-link">
          <i className="fab fa-twitter icon"></i>
          X
        </a>
        <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" className="icon-link">
          <i className="fab fa-youtube icon"></i>
          YouTube
        </a>
        <a href="https://www.chess.com/" target="_blank" rel="noopener noreferrer" className="icon-link">
          <i className="fas fa-chess icon"></i>
          Chess.com
        </a>
      </div>
    </section>
  );
}

export default Hero;
export {};