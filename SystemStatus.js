import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SystemStatus.css';

export default function SystemStatus({ backendUrl }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStatus(); }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/status`);
      setStatus(data);
    } catch {
      setStatus({ error: 'Cannot reach backend' });
    }
    setLoading(false);
  };

  const TOOL_INSTALL = {
    ytdlp: {
      name: 'yt-dlp', description: 'Video downloader (required)',
      install: ['pip install yt-dlp', '# or', 'brew install yt-dlp', '# or download from https://github.com/yt-dlp/yt-dlp/releases']
    },
    ffmpeg: {
      name: 'FFmpeg', description: 'Video editor (required)',
      install: ['brew install ffmpeg', '# or on Ubuntu:', 'sudo apt install ffmpeg', '# Windows: https://ffmpeg.org/download.html']
    }
  };

  return (
    <div className="system-status">
      <div className="status-header">
        <h2 className="card-title" style={{ marginBottom: 4 }}>⚙️ SYSTEM STATUS</h2>
        <button className="btn btn-ghost" onClick={fetchStatus} disabled={loading}>🔄 Refresh</button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Checking system...</div>}

      {status && !loading && (
        <>
          {/* Core checks */}
          <div className="card">
            <h3 className="card-title">🔍 SYSTEM CHECKS</h3>
            <div className="checks-list">
              {[
                { key: 'server', label: 'Backend Server', value: status.server === 'ok' },
                { key: 'ytdlp', label: 'yt-dlp', value: status.ytdlp },
                { key: 'ffmpeg', label: 'FFmpeg', value: status.ffmpeg }
              ].map(({ key, label, value }) => (
                <div key={key} className="check-row">
                  <div className="check-icon">{value ? '✅' : '❌'}</div>
                  <div className="check-info">
                    <div className="check-name">{label}</div>
                    <div className="check-status-text">{value ? 'Installed & ready' : 'Not found'}</div>
                  </div>
                  <span className={`badge ${value ? 'badge-green' : 'badge-red'}`}>
                    {value ? 'OK' : 'MISSING'}
                  </span>
                </div>
              ))}

              {/* Directories */}
              {status.directories && Object.entries(status.directories).map(([dir, exists]) => (
                <div key={dir} className="check-row">
                  <div className="check-icon">{exists ? '✅' : '⚠️'}</div>
                  <div className="check-info">
                    <div className="check-name">/{dir} directory</div>
                    <div className="check-status-text">{exists ? 'Exists' : 'Missing (will auto-create)'}</div>
                  </div>
                  <span className={`badge ${exists ? 'badge-green' : 'badge-gold'}`}>
                    {exists ? 'OK' : 'AUTO'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Install guides */}
          {(!status.ytdlp || !status.ffmpeg) && (
            <div className="card">
              <h3 className="card-title">📦 INSTALLATION GUIDE</h3>
              {Object.entries(TOOL_INSTALL)
                .filter(([k]) => !status[k])
                .map(([k, tool]) => (
                  <div key={k} className="install-section">
                    <div className="install-header">
                      <span className="install-icon">⚠️</span>
                      <div>
                        <div className="install-name">{tool.name}</div>
                        <div className="install-desc">{tool.description}</div>
                      </div>
                    </div>
                    <div className="code-block">{tool.install.join('\n')}</div>
                  </div>
                ))}
            </div>
          )}

          {/* Environment Setup */}
          <div className="card">
            <h3 className="card-title">🔑 ENVIRONMENT SETUP</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
              Copy <code className="inline-code">.env.example</code> to <code className="inline-code">.env</code> in the backend folder and fill in your API keys.
            </p>
            <div className="env-grid">
              {[
                { key: 'OPENAI_API_KEY', label: 'OpenAI API Key', desc: 'For AI script generation', required: false, link: 'https://platform.openai.com' },
                { key: 'ANTHROPIC_API_KEY', label: 'Anthropic API Key', desc: 'Alternative AI (Claude)', required: false, link: 'https://console.anthropic.com' },
                { key: 'YOUTUBE_API_KEY', label: 'YouTube Data API v3', desc: 'For trend scanning', required: false, link: 'https://console.cloud.google.com' },
                { key: 'YOUTUBE_CLIENT_ID', label: 'YouTube OAuth Client', desc: 'For publishing to YouTube', required: false, link: 'https://console.cloud.google.com' }
              ].map(env => (
                <div key={env.key} className="env-item">
                  <div className="env-key">{env.key}</div>
                  <div className="env-label">{env.label}</div>
                  <div className="env-desc">{env.desc}</div>
                  <a href={env.link} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }}>
                    Get Key →
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Quick start */}
          <div className="card">
            <h3 className="card-title">🚀 QUICK START</h3>
            <div className="quickstart-steps">
              {[
                { n: '1', title: 'Clone & Install', cmd: 'cd backend && npm install\ncd ../frontend && npm install' },
                { n: '2', title: 'Configure Environment', cmd: 'cp backend/.env.example backend/.env\n# Edit backend/.env with your API keys' },
                { n: '3', title: 'Install yt-dlp & FFmpeg', cmd: 'pip install yt-dlp\nbrew install ffmpeg  # macOS\n# or: sudo apt install ffmpeg  # Ubuntu' },
                { n: '4', title: 'Start Backend', cmd: 'cd backend && npm start\n# Runs on http://localhost:5000' },
                { n: '5', title: 'Start Frontend', cmd: 'cd frontend && npm start\n# Runs on http://localhost:3000' },
                { n: '6', title: 'Process a Video', cmd: '# Paste any soccer video URL in the\n# "Process URL" tab and click Run!' }
              ].map(step => (
                <div key={step.n} className="quickstart-item">
                  <div className="qs-num">{step.n}</div>
                  <div className="qs-body">
                    <div className="qs-title">{step.title}</div>
                    <div className="code-block">{step.cmd}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
