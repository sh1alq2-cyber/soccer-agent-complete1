import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './JobHistory.css';

export default function JobHistory({ backendUrl }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/video/jobs`);
      setJobs(data);
    } catch {}
    setLoading(false);
  };

  const FORMAT_ICONS = { shorts: '📱', longform: '🖥️', both: '✨' };

  return (
    <div className="job-history">
      <div className="history-header">
        <div>
          <h2 className="card-title" style={{ marginBottom: 4 }}>📁 JOB HISTORY</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{jobs.length} jobs processed</p>
        </div>
        <button className="btn btn-ghost" onClick={fetchJobs}>🔄 Refresh</button>
      </div>

      {loading && <div className="loading-state">Loading jobs...</div>}

      {!loading && jobs.length === 0 && (
        <div className="card empty-jobs">
          <span style={{ fontSize: 48 }}>📭</span>
          <h3>No jobs yet</h3>
          <p>Process a video URL or run the autonomous agent to see jobs here</p>
        </div>
      )}

      <div className="jobs-grid">
        {jobs.map(job => (
          <div
            key={job.jobId}
            className={`job-card ${selected?.jobId === job.jobId ? 'selected' : ''}`}
            onClick={() => setSelected(selected?.jobId === job.jobId ? null : job)}
          >
            <div className="job-header">
              <div className="job-format">{FORMAT_ICONS[job.videoFormat] || '🎬'}</div>
              <div className="job-meta">
                <div className="job-title">{job.script?.thumbnail_text || 'Soccer Content'}</div>
                <div className="job-time">{job.createdAt ? new Date(job.createdAt).toLocaleString() : '—'}</div>
              </div>
              <span className="badge badge-green">Done</span>
            </div>

            {selected?.jobId === job.jobId && (
              <div className="job-detail">
                <div className="divider" />

                {job.script && (
                  <div className="detail-section">
                    <div className="detail-label">HOOK</div>
                    <div className="detail-value">{job.script.hook}</div>
                  </div>
                )}

                <div className="detail-section">
                  <div className="detail-label">JOB ID</div>
                  <code className="job-id-code">{job.jobId}</code>
                </div>

                <div className="job-actions">
                  <a
                    href={`${backendUrl}/api/video/download/${job.jobId}`}
                    className="btn btn-primary"
                    target="_blank"
                    rel="noreferrer"
                  >
                    ⬇️ Download Package
                  </a>
                  <a
                    href={`${backendUrl}/output/${job.jobId}/youtube_metadata.json`}
                    className="btn btn-ghost"
                    target="_blank"
                    rel="noreferrer"
                  >
                    📝 View Metadata
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
