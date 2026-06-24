import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import './AgentDashboard.css';

export default function AgentDashboard({ socket, backendUrl }) {
  const [agentStatus, setAgentStatus] = useState({ running: false });
  const [logs, setLogs] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [cycleRunning, setCycleRunning] = useState(false);
  const [completedJobs, setCompletedJobs] = useState([]);
  const logsEndRef = useRef();

  useEffect(() => {
    fetchStatus();
    fetchLogs();
    fetchTrends();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const logHandler = (entry) => {
      setLogs(prev => [entry, ...prev].slice(0, 100));
    };
    const jobCompleteHandler = (data) => {
      setCompletedJobs(prev => [data, ...prev]);
      toast.success(`✅ Job complete: ${data.metadata?.title?.slice(0, 40)}...`);
      setCycleRunning(false);
    };
    socket.on('agent:log', logHandler);
    socket.on('agent:job_complete', jobCompleteHandler);
    return () => {
      socket.off('agent:log', logHandler);
      socket.off('agent:job_complete', jobCompleteHandler);
    };
  }, [socket]);

  const fetchStatus = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/agent/status`);
      setAgentStatus(data);
    } catch {}
  };

  const fetchLogs = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/agent/logs`);
      setLogs(data);
    } catch {}
  };

  const fetchTrends = async () => {
    setLoadingTrends(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/agent/trends`);
      setTrends(data);
    } catch {}
    setLoadingTrends(false);
  };

  const toggleAgent = async () => {
    const endpoint = agentStatus.running ? '/api/agent/stop' : '/api/agent/start';
    await axios.post(`${backendUrl}${endpoint}`);
    await fetchStatus();
    toast.success(agentStatus.running ? '🛑 Agent stopped' : '🤖 Agent started');
  };

  const runNow = async () => {
    setCycleRunning(true);
    await axios.post(`${backendUrl}/api/agent/run-now`);
    toast.success('🔄 Agent cycle triggered!');
  };

  const CONTENT_TYPE_EMOJI = {
    world_cup: '🏆', goals: '⚽', controversy: '🔴',
    transfer: '💸', player_story: '⭐', matches: '🎯',
    rivalry: '🔥', records: '📊'
  };

  return (
    <div className="agent-dashboard">

      {/* Agent Control */}
      <div className="card agent-control-card">
        <div className="agent-header">
          <div className="agent-icon-wrap">
            <span className={`agent-icon ${agentStatus.running ? 'running' : ''}`}>🤖</span>
          </div>
          <div className="agent-info">
            <h2 className="card-title" style={{ marginBottom: 4 }}>AUTONOMOUS AGENT</h2>
            <p className="agent-desc">
              Runs every 6 hours — scans World Cup 2026 trends, finds viral source videos,
              downloads and re-produces them, generates metadata, and queues for publishing.
            </p>
          </div>
          <div className="agent-status-badge">
            <span className={`badge ${agentStatus.running ? 'badge-green' : 'badge-red'}`}>
              {agentStatus.running ? '● RUNNING' : '● STOPPED'}
            </span>
          </div>
        </div>

        <div className="agent-controls">
          <button
            className={`btn ${agentStatus.running ? 'btn-danger' : 'btn-primary'}`}
            onClick={toggleAgent}
          >
            {agentStatus.running ? '🛑 Stop Agent' : '🚀 Start Agent'}
          </button>
          <button
            className="btn btn-gold"
            onClick={runNow}
            disabled={cycleRunning}
          >
            {cycleRunning ? '⏳ Running...' : '⚡ Run Cycle Now'}
          </button>
          <button className="btn btn-ghost" onClick={fetchStatus}>
            🔄 Refresh Status
          </button>
        </div>

        <div className="agent-stats">
          <div className="stat-item">
            <div className="stat-value">{agentStatus.running ? '6h' : '—'}</div>
            <div className="stat-label">Cycle Interval</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{completedJobs.length}</div>
            <div className="stat-label">Jobs This Session</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{agentStatus.lastRun ? new Date(agentStatus.lastRun).toLocaleTimeString() : '—'}</div>
            <div className="stat-label">Last Run</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{trends.length}</div>
            <div className="stat-label">Trending Topics</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">

        {/* Trending Topics */}
        <div className="card trends-card">
          <div className="card-header-row">
            <h3 className="card-title" style={{ marginBottom: 0 }}>📈 TRENDING TOPICS</h3>
            <button className="btn btn-ghost btn-sm" onClick={fetchTrends} disabled={loadingTrends}>
              {loadingTrends ? '⏳' : '🔄 Refresh'}
            </button>
          </div>
          <p className="section-desc">Live World Cup 2026 trending topics — agent targets top-scored items</p>

          {loadingTrends ? (
            <div className="loading-row">Scanning trends...</div>
          ) : (
            <div className="trends-list">
              {trends.map((t, i) => (
                <div key={i} className="trend-item">
                  <div className="trend-rank">#{i + 1}</div>
                  <div className="trend-body">
                    <div className="trend-topic">
                      {CONTENT_TYPE_EMOJI[t.contentType] || '⚽'} {t.topic}
                    </div>
                    <div className="trend-meta">
                      <span className="badge badge-blue">{t.contentType || 'general'}</span>
                      {t.channelTitle && <span className="trend-channel">{t.channelTitle}</span>}
                    </div>
                  </div>
                  <div className="trend-score">
                    <div className="score-bar">
                      <div className="score-fill" style={{ width: `${t.score * 10}%` }} />
                    </div>
                    <span className="score-num">{t.score}/10</span>
                  </div>
                </div>
              ))}
              {!trends.length && <div className="empty-state">No trends loaded yet</div>}
            </div>
          )}
        </div>

        {/* Agent Logs */}
        <div className="card logs-card">
          <div className="card-header-row">
            <h3 className="card-title" style={{ marginBottom: 0 }}>📋 AGENT LOGS</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setLogs([])}>🗑️ Clear</button>
          </div>

          <div className="logs-container">
            {logs.length === 0 && (
              <div className="empty-state">No logs yet — start the agent or run a cycle</div>
            )}
            {logs.map((log, i) => (
              <div key={i} className={`log-item ${log.level}`}>
                <span className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span className="log-msg">{log.message}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>

      {/* Completed Jobs */}
      {completedJobs.length > 0 && (
        <div className="card">
          <h3 className="card-title">✅ COMPLETED THIS SESSION</h3>
          <div className="completed-list">
            {completedJobs.map((job, i) => (
              <div key={i} className="completed-item">
                <div className="completed-title">{job.metadata?.title}</div>
                <div className="completed-meta">
                  <span className="badge badge-green">Ready</span>
                  <span className="completed-time">{new Date().toLocaleTimeString()}</span>
                </div>
                <a
                  href={`${backendUrl}/api/video/download/${job.jobId}`}
                  className="btn btn-ghost btn-sm"
                  target="_blank"
                  rel="noreferrer"
                >
                  ⬇️ Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline Info */}
      <div className="card pipeline-info-card">
        <h3 className="card-title">⚙️ AUTONOMOUS PIPELINE</h3>
        <div className="pipeline-steps">
          {[
            { icon: '📊', step: '1. TREND SCAN', desc: 'Scans YouTube, Twitter/X for World Cup 2026 trending topics every 6 hours' },
            { icon: '🎯', step: '2. TOPIC SELECT', desc: 'Scores topics by virality × evergreen value, picks the highest' },
            { icon: '⬇️', step: '3. DOWNLOAD', desc: 'Downloads source video via yt-dlp at best available quality' },
            { icon: '✍️', step: '4. SCRIPT AI', desc: 'Generates professional English narration with hook, story, CTA' },
            { icon: '🎬', step: '5. EDIT', desc: 'Applies captions, slow-mo, zoom, music, color grading via FFmpeg' },
            { icon: '📝', step: '6. METADATA', desc: 'Generates YouTube title, description, tags, thumbnail brief' },
            { icon: '📦', step: '7. PACKAGE', desc: 'Bundles everything into a ready-to-publish ZIP package' }
          ].map(({ icon, step, desc }) => (
            <div key={step} className="pipeline-step">
              <div className="pipeline-icon">{icon}</div>
              <div>
                <div className="pipeline-step-name">{step}</div>
                <div className="pipeline-step-desc">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
