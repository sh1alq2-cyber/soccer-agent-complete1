import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import './URLProcessor.css';

const CONTENT_TYPES = [
  { value: 'auto', label: '🤖 Auto Detect' },
  { value: 'goals', label: '⚽ Goals & Skills' },
  { value: 'world_cup', label: '🏆 World Cup 2026' },
  { value: 'controversy', label: '🔴 Controversial' },
  { value: 'transfer', label: '💸 Transfer News' },
  { value: 'player_story', label: '⭐ Player Story' },
  { value: 'matches', label: '🎯 Legendary Matches' },
  { value: 'rivalry', label: '🔥 Rivalry' },
  { value: 'records', label: '📊 Records' }
];

const VIDEO_FORMATS = [
  { value: 'shorts', label: '📱 YouTube Shorts (≤60s, 9:16)' },
  { value: 'longform', label: '🖥️ Long-Form (2-10 min, 16:9)' },
  { value: 'both', label: '✨ Both Formats' }
];

const STEPS = ['download', 'script', 'edit', 'metadata'];
const STEP_LABELS = { download: '⬇️ Download', script: '✍️ Script', edit: '🎬 Edit', metadata: '📝 Metadata' };

export default function URLProcessor({ socket, backendUrl }) {
  const [url, setUrl] = useState('');
  const [contentType, setContentType] = useState('auto');
  const [videoFormat, setVideoFormat] = useState('shorts');
  const [processing, setProcessing] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [progress, setProgress] = useState({});
  const [result, setResult] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const urlInputRef = useRef();

  useEffect(() => {
    if (!socket || !jobId) return;
    const handler = (data) => {
      if (data.event === 'progress') {
        setProgress(prev => ({ ...prev, [data.step]: { percent: data.percent, message: data.message } }));
      }
      if (data.event === 'complete') {
        setResult(data);
        setProcessing(false);
        toast.success('🎉 Video package ready!');
      }
      if (data.event === 'error') {
        setProcessing(false);
        toast.error('❌ ' + data.message);
      }
    };
    socket.on(`job:${jobId}`, handler);
    return () => socket.off(`job:${jobId}`, handler);
  }, [socket, jobId]);

  const fetchVideoInfo = async () => {
    if (!url.trim()) return;
    setFetchingInfo(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/video/info?url=${encodeURIComponent(url)}`);
      setVideoInfo(data);
    } catch {
      toast.error('Could not fetch video info');
    }
    setFetchingInfo(false);
  };

  const handleProcess = async () => {
    if (!url.trim()) { toast.error('Please enter a video URL'); return; }
    setProcessing(true);
    setProgress({});
    setResult(null);

    try {
      const { data } = await axios.post(`${backendUrl}/api/video/process`, {
        url, contentType, videoFormat
      });
      setJobId(data.jobId);
      toast.success('Processing started!');
    } catch (err) {
      setProcessing(false);
      toast.error(err.response?.data?.error || 'Failed to start processing');
    }
  };

  const downloadPackage = async () => {
    if (!jobId) return;
    window.open(`${backendUrl}/api/video/download/${jobId}`, '_blank');
  };

  const currentStep = STEPS.find(s => progress[s] && progress[s].percent < 100) ||
    (result ? 'done' : null);

  return (
    <div className="processor">
      {/* URL Input Panel */}
      <div className="card">
        <h2 className="card-title">🎬 VIDEO URL PROCESSOR</h2>
        <p className="processor-desc">
          Paste any soccer video URL (YouTube, Twitter/X, Instagram, TikTok, Reddit) — the agent will download, re-edit, script, and package it professionally.
        </p>

        <div className="form-group">
          <label className="form-label">Video URL</label>
          <div className="url-row">
            <input
              ref={urlInputRef}
              className="form-input"
              placeholder="https://www.youtube.com/watch?v=... or any video URL"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchVideoInfo()}
            />
            <button className="btn btn-ghost" onClick={fetchVideoInfo} disabled={fetchingInfo || !url}>
              {fetchingInfo ? '⏳' : '🔍 Preview'}
            </button>
          </div>
        </div>

        {videoInfo && (
          <div className="video-preview-card">
            {videoInfo.thumbnail && <img src={videoInfo.thumbnail} alt="thumb" className="preview-thumb" />}
            <div className="preview-info">
              <div className="preview-title">{videoInfo.title}</div>
              <div className="preview-meta">
                <span>👤 {videoInfo.uploader}</span>
                <span>⏱️ {videoInfo.duration ? `${Math.floor(videoInfo.duration / 60)}m ${videoInfo.duration % 60}s` : 'Unknown'}</span>
                <span>👁️ {videoInfo.view_count?.toLocaleString() || '—'} views</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Content Type</label>
            <select className="form-select" value={contentType} onChange={e => setContentType(e.target.value)}>
              {CONTENT_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Output Format</label>
            <select className="form-select" value={videoFormat} onChange={e => setVideoFormat(e.target.value)}>
              {VIDEO_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        </div>

        <button
          className="btn btn-primary process-btn"
          onClick={handleProcess}
          disabled={processing || !url}
        >
          {processing ? '⏳ Processing...' : '🚀 Process Video'}
        </button>
      </div>

      {/* Progress Panel */}
      {(processing || result) && (
        <div className="card progress-panel">
          <h3 className="card-title">📊 PIPELINE PROGRESS</h3>
          <div className="steps-grid">
            {STEPS.map(step => {
              const p = progress[step];
              const done = p?.percent === 100;
              const active = currentStep === step;
              return (
                <div key={step} className={`step-card ${done ? 'done' : active ? 'active' : 'pending'}`}>
                  <div className="step-label">{STEP_LABELS[step]}</div>
                  {p ? (
                    <>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${p.percent}%` }} />
                      </div>
                      <div className="step-msg">{p.message}</div>
                    </>
                  ) : (
                    <div className="step-msg pending-msg">Waiting...</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Result Panel */}
      {result && (
        <div className="result-grid">
          {/* Script */}
          {result.script && (
            <div className="card result-card">
              <h3 className="card-title">✍️ GENERATED SCRIPT</h3>
              <div className="script-section">
                <div className="script-label">🎯 HOOK</div>
                <p className="script-text">{result.script.hook}</p>
              </div>
              <div className="script-section">
                <div className="script-label">📖 NARRATIVE</div>
                <p className="script-text">{result.script.narrative}</p>
              </div>
              <div className="script-section">
                <div className="script-label">🎬 CLIMAX</div>
                <p className="script-text">{result.script.climax}</p>
              </div>
              <div className="script-section">
                <div className="script-label">📣 CTA</div>
                <p className="script-text">{result.script.cta}</p>
              </div>
              {result.script.music_mood && (
                <div className="music-rec">
                  <span>🎵 Music: </span>
                  <span className="badge badge-blue">{result.script.music_mood}</span>
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          {result.metadata && (
            <div className="card result-card">
              <h3 className="card-title">📝 YOUTUBE METADATA</h3>
              <div className="meta-field">
                <div className="meta-label">TITLE</div>
                <div className="meta-value title-value">{result.metadata.title}</div>
              </div>
              <div className="meta-field">
                <div className="meta-label">DESCRIPTION</div>
                <textarea className="meta-textarea" value={result.metadata.description} readOnly rows={6} />
              </div>
              <div className="meta-field">
                <div className="meta-label">TAGS ({result.metadata.tags?.length})</div>
                <div className="tags-wrap">
                  {result.metadata.tags?.slice(0, 15).map(t => (
                    <span key={t} className="tag-chip">{t}</span>
                  ))}
                  {result.metadata.tags?.length > 15 && <span className="tag-chip muted">+{result.metadata.tags.length - 15} more</span>}
                </div>
              </div>
              <div className="meta-field">
                <div className="meta-label">⏰ OPTIMAL PUBLISH TIME</div>
                <div className="badge badge-gold">{result.metadata.scheduleTime}</div>
              </div>
            </div>
          )}

          {/* Thumbnail Brief */}
          {result.metadata?.thumbnailBrief && (
            <div className="card result-card">
              <h3 className="card-title">🖼️ THUMBNAIL BRIEF</h3>
              <div className="thumb-grid">
                {Object.entries(result.metadata.thumbnailBrief).map(([k, v]) => (
                  <div key={k} className="thumb-item">
                    <div className="meta-label">{k.toUpperCase()}</div>
                    <div className="thumb-value">
                      {typeof v === 'object' ? JSON.stringify(v, null, 2) : v}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Download */}
          <div className="card result-card download-card">
            <h3 className="card-title">📦 DOWNLOAD PACKAGE</h3>
            <p>Your complete content package is ready — video file, script, YouTube metadata, and thumbnail brief.</p>
            <div className="download-actions">
              <button className="btn btn-primary" onClick={downloadPackage}>
                ⬇️ Download Full Package (.zip)
              </button>
              {result.output?.outputFile && (
                <a
                  href={`${backendUrl}/output/${jobId}/${videoFormat === 'shorts' ? 'shorts_output.mp4' : 'longform_output.mp4'}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost"
                >
                  ▶️ Preview Video
                </a>
              )}
            </div>
            <div className="job-id-display">Job ID: <code>{jobId}</code></div>
          </div>
        </div>
      )}
    </div>
  );
}
