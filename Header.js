import React from 'react';
import './Header.css';

export default function Header({ connected }) {
  return (
    <header className="header">
      <div className="header-left">
        <span className="header-logo">⚽</span>
        <div>
          <h1 className="header-title">SOCCER AGENT AI</h1>
          <p className="header-sub">Autonomous World Cup 2026 Content Machine</p>
        </div>
      </div>
      <div className="header-right">
        <span className="wc-badge">🏆 #WorldCup2026</span>
        <div className={`conn-indicator ${connected ? 'online' : 'offline'}`}>
          <span className="conn-dot"></span>
          {connected ? 'Connected' : 'Connecting...'}
        </div>
      </div>
    </header>
  );
}
