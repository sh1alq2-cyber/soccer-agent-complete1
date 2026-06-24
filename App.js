import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { io } from 'socket.io-client';
import Header from './components/Header';
import URLProcessor from './pages/URLProcessor';
import AgentDashboard from './pages/AgentDashboard';
import MusicLibrary from './pages/MusicLibrary';
import JobHistory from './pages/JobHistory';
import SystemStatus from './pages/SystemStatus';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

export default function App() {
  const [tab, setTab] = useState('processor');
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s = io(BACKEND_URL);
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    setSocket(s);
    return () => s.disconnect();
  }, []);

  const tabs = [
    { id: 'processor', label: '⚽ Process URL', icon: '🎬' },
    { id: 'agent', label: '🤖 Auto Agent', icon: '🤖' },
    { id: 'music', label: '🎵 Music', icon: '🎵' },
    { id: 'history', label: '📁 Jobs', icon: '📁' },
    { id: 'status', label: '⚙️ Status', icon: '⚙️' }
  ];

  return (
    <div className="app">
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1a1a26', color: '#f0f0f0', border: '1px solid rgba(255,255,255,0.1)' }
      }} />

      <Header connected={connected} />

      <nav className="tab-nav">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="main-content">
        {tab === 'processor' && <URLProcessor socket={socket} backendUrl={BACKEND_URL} />}
        {tab === 'agent' && <AgentDashboard socket={socket} backendUrl={BACKEND_URL} />}
        {tab === 'music' && <MusicLibrary backendUrl={BACKEND_URL} />}
        {tab === 'history' && <JobHistory backendUrl={BACKEND_URL} />}
        {tab === 'status' && <SystemStatus backendUrl={BACKEND_URL} />}
      </main>

      <footer className="footer">
        <span>⚽ Soccer Agent AI — World Cup 2026</span>
        <span className={`status-dot ${connected ? 'online' : 'offline'}`}>
          {connected ? '● Live' : '● Offline'}
        </span>
      </footer>
    </div>
  );
}
