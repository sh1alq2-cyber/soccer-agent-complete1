import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import './MusicLibrary.css';

const MOOD_EMOJI = {
  epic_orchestral: '🎺', dark_tension: '🎸', upbeat_quirky: '🎹',
  anthemic: '🏟️', modern_trap: '🎧', emotional_piano: '🎵'
};

export default function MusicLibrary({ backendUrl }) {
  const [categories, setCategories] = useState([]);
  const [library, setLibrary] = useState({});
  const [recommendation, setRecommendation] = useState(null);
  const [selectedContentType, setSelectedContentType] = useState('goals');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadContentType, setDownloadContentType] = useState('goals');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchLibrary();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/music/categories`);
      setCategories(data);
    } catch {}
  };

  const fetchLibrary = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/music/library`);
      setLibrary(data);
    } catch {}
  };

  const getRecommendation = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/music/recommend?contentType=${selectedContentType}`);
      setRecommendation(data);
    } catch {}
  };

  const downloadTrack = async () => {
    if (!downloadUrl) { toast.error('Enter a track URL'); return; }
    setDownloading(true);
    try {
      await axios.post(`${backendUrl}/api/music/download`, {
        contentType: downloadContentType,
        trackUrl: downloadUrl
      });
      toast.success('🎵 Download started!');
      setDownloadUrl('');
      setTimeout(fetchLibrary, 3000);
    } catch {
      toast.error('Download failed');
    }
    setDownloading(false);
  };

  const totalTracks = Object.values(library).reduce((sum, arr) => sum + (arr?.length || 0), 0);

  return (
    <div className="music-library">

      {/* Header stats */}
      <div className="music-stats-row">
        <div className="music-stat">
          <span className="music-stat-num">{totalTracks}</span>
          <span className="music-stat-label">Tracks Downloaded</span>
        </div>
        <div className="music-stat">
          <span className="music-stat-num">{Object.keys(library).length}</span>
          <span className="music-stat-label">Categories</span>
        </div>
        <div className="music-stat">
          <span className="music-stat-num">100%</span>
          <span className="music-stat-label">Copyright Free</span>
        </div>
      </div>

      <div className="music-grid">

        {/* Music Recommendation */}
        <div className="card">
          <h3 className="card-title">🎯 MUSIC RECOMMENDER</h3>
          <p className="section-desc">Get the perfect music mood for your content type</p>

          <div className="form-group">
            <label className="form-label">Content Type</label>
            <select className="form-select" value={selectedContentType} onChange={e => setSelectedContentType(e.target.value)}>
              <option value="goals">⚽ Goals & Skills → Epic Orchestral</option>
              <option value="world_cup">🏆 World Cup → Anthemic</option>
              <option value="controversy">🔴 Controversy → Dark Tension</option>
              <option value="transfer">💸 Transfer → Modern Trap</option>
              <option value="player_story">⭐ Player Story → Emotional Piano</option>
              <option value="rivalry">🔥 Rivalry → Dark Tension</option>
              <option value="records">📊 Records → Emotional Piano</option>
              <option value="funny">😂 Funny → Upbeat Quirky</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={getRecommendation}>🎵 Get Recommendation</button>

          {recommendation && (
            <div className="recommendation-result">
              <div className="rec-mood">
                <span className="rec-emoji">{MOOD_EMOJI[recommendation.mood] || '🎵'}</span>
                <div>
                  <div className="rec-label-text">{recommendation.label}</div>
                  <div className="rec-description">{recommendation.description}</div>
                </div>
              </div>

              <div className="sources-list">
                {recommendation.sources?.map((s, i) => (
                  <div key={i} className="source-item">
                    <div className="source-info">
                      <span className="source-name">{s.name}</span>
                      <span className="badge badge-blue">{s.platform}</span>
                    </div>
                    <a href={s.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                      🔗 Open
                    </a>
                  </div>
                ))}
              </div>

              {recommendation.downloadCommand && (
                <div style={{ marginTop: 16 }}>
                  <div className="meta-label" style={{ marginBottom: 8 }}>DOWNLOAD COMMANDS</div>
                  {Object.entries(recommendation.downloadCommand).map(([k, v]) => (
                    <div key={k} style={{ marginBottom: 10 }}>
                      <div className="source-platform-label">{k.toUpperCase()}</div>
                      <div className="code-block" style={{ fontSize: 11 }}>{v}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add Music */}
        <div className="card">
          <h3 className="card-title">⬇️ ADD MUSIC</h3>
          <p className="section-desc">Download a copyright-free track from YouTube Audio Library, Pixabay, or Mixkit</p>

          <div className="form-group">
            <label className="form-label">Track URL (YouTube / Direct MP3)</label>
            <input
              className="form-input"
              placeholder="https://www.youtube.com/watch?v=... or https://pixabay.com/..."
              value={downloadUrl}
              onChange={e => setDownloadUrl(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Music Category</label>
            <select className="form-select" value={downloadContentType} onChange={e => setDownloadContentType(e.target.value)}>
              <option value="goals">epic_orchestral — Goals & Skills</option>
              <option value="world_cup">anthemic — World Cup</option>
              <option value="controversy">dark_tension — Controversy</option>
              <option value="transfer">modern_trap — Transfer</option>
              <option value="player_story">emotional_piano — Player Story</option>
            </select>
          </div>

          <button className="btn btn-primary" onClick={downloadTrack} disabled={downloading || !downloadUrl}>
            {downloading ? '⏳ Downloading...' : '⬇️ Download Track'}
          </button>

          <div className="divider" />

          <h4 style={{ marginBottom: 12, fontSize: 14, fontWeight: 600 }}>🆓 FREE MUSIC SOURCES</h4>
          {[
            { name: 'YouTube Audio Library', url: 'https://www.youtube.com/audiolibrary', desc: 'Best for monetized videos' },
            { name: 'Pixabay Music', url: 'https://pixabay.com/music/', desc: 'CC0 — no attribution' },
            { name: 'Mixkit', url: 'https://mixkit.co/free-stock-music/', desc: 'Free to use, no sign-up' },
            { name: 'Bensound', url: 'https://www.bensound.com/free-music-for-videos', desc: 'Attribution required' }
          ].map(s => (
            <div key={s.name} className="free-source-item">
              <div>
                <div className="source-name">{s.name}</div>
                <div className="source-desc">{s.desc}</div>
              </div>
              <a href={s.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">Visit →</a>
            </div>
          ))}
        </div>
      </div>

      {/* Music Categories */}
      <div className="card">
        <h3 className="card-title">🎼 MUSIC CATEGORIES</h3>
        <div className="categories-grid">
          {categories.map(cat => {
            const tracks = library[cat.id] || [];
            return (
              <div key={cat.id} className="category-card">
                <div className="cat-header">
                  <span className="cat-emoji">{MOOD_EMOJI[cat.id] || '🎵'}</span>
                  <div>
                    <div className="cat-name">{cat.label}</div>
                    <div className="cat-use">{cat.description}</div>
                  </div>
                  <span className={`badge ${tracks.length > 0 ? 'badge-green' : 'badge-red'}`}>
                    {tracks.length} tracks
                  </span>
                </div>
                {tracks.length > 0 && (
                  <div className="track-list">
                    {tracks.slice(0, 3).map(t => (
                      <div key={t} className="track-item">🎵 {t}</div>
                    ))}
                    {tracks.length > 3 && <div className="track-item muted">+{tracks.length - 3} more</div>}
                  </div>
                )}
                {tracks.length === 0 && (
                  <div className="no-tracks">No tracks yet — add music above</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Copyright info */}
      <div className="card copyright-card">
        <h3 className="card-title">⚖️ COPYRIGHT STRATEGY</h3>
        <div className="copyright-grid">
          <div className="copyright-item">
            <div className="copyright-icon">📱</div>
            <div className="copyright-title">Short-Form (≤60s)</div>
            <div className="copyright-desc">Use Pixabay CC0 or Mixkit — no attribution needed. Safe for Shorts monetization.</div>
          </div>
          <div className="copyright-item">
            <div className="copyright-icon">🖥️</div>
            <div className="copyright-title">Long-Form (2-10 min)</div>
            <div className="copyright-desc">YouTube Audio Library ONLY. Filter "Free to use" license. Download with yt-dlp + cookies.</div>
          </div>
          <div className="copyright-item">
            <div className="copyright-icon">🔇</div>
            <div className="copyright-title">Mix Levels</div>
            <div className="copyright-desc">Music at -18dB under narration. -12dB in music-only segments. Fade in 1.5s, fade out 2s.</div>
          </div>
          <div className="copyright-item">
            <div className="copyright-icon">⚠️</div>
            <div className="copyright-title">Fair Use Clips</div>
            <div className="copyright-desc">Max 40s from any single copyrighted source. Always add narration + effects + new structure.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
