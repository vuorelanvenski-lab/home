import React from 'react';

function Features() {
  return (
    <section className="features">
      <h2>Features</h2>
      <div className="feature-grid">
        <div className="feature-card">
          <h3>Fast</h3>
          <p>Lightning quick performance</p>
        </div>
        <div className="feature-card">
          <h3>Responsive</h3>
          <p>Works on all devices</p>
        </div>
        <div className="feature-card">
          <h3>Modern</h3>
          <p>Built with latest tech</p>
        </div>
      </div>
    </section>
  );
}

export default Features;