const { exec } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

const MUSIC_DIR = path.resolve(process.env.MUSIC_DIR || './music');

const MUSIC_CATEGORIES = {
  epic_orchestral: {
    label: 'Epic / Orchestral',
    description: 'Goals, skills, legendary moments',
    sources: [
      { name: 'Pixabay - Epic Cinematic', url: 'https://pixabay.com/music/search/epic/', platform: 'Pixabay' },
      { name: 'YouTube Audio Library - Epic', url: 'https://www.youtube.com/audiolibrary', platform: 'YouTube' },
      { name: 'Mixkit - Action', url: 'https://mixkit.co/free-stock-music/action/', platform: 'Mixkit' }
    ],
    keywords: ['epic', 'orchestral', 'cinematic', 'rise', 'power']
  },
  dark_tension: {
    label: 'Dark / Tension',
    description: 'Controversy, red cards, VAR drama',
    sources: [
      { name: 'Pixabay - Dark Thriller', url: 'https://pixabay.com/music/search/thriller/', platform: 'Pixabay' },
      { name: 'Mixkit - Thriller', url: 'https://mixkit.co/free-stock-music/thriller/', platform: 'Mixkit' }
    ],
    keywords: ['dark', 'tension', 'thriller', 'dramatic']
  },
  upbeat_quirky: {
    label: 'Upbeat / Quirky',
    description: 'Funny moments, fails, bloopers',
    sources: [
      { name: 'Pixabay - Funny', url: 'https://pixabay.com/music/search/fun/', platform: 'Pixabay' },
      { name: 'Mixkit - Fun', url: 'https://mixkit.co/free-stock-music/fun/', platform: 'Mixkit' }
    ],
    keywords: ['fun', 'upbeat', 'quirky', 'happy']
  },
  anthemic: {
    label: 'Anthemic / Stadium',
    description: 'World Cup moments, national pride',
    sources: [
      { name: 'Pixabay - Inspiring', url: 'https://pixabay.com/music/search/inspiring/', platform: 'Pixabay' },
      { name: 'Mixkit - Inspirational', url: 'https://mixkit.co/free-stock-music/inspirational/', platform: 'Mixkit' }
    ],
    keywords: ['anthem', 'inspiring', 'motivational', 'sports']
  },
  modern_trap: {
    label: 'Modern Trap / Hip-Hop',
    description: 'Transfer news, player stories',
    sources: [
      { name: 'Pixabay - Hip Hop', url: 'https://pixabay.com/music/search/hip-hop/', platform: 'Pixabay' },
      { name: 'Mixkit - Hip Hop', url: 'https://mixkit.co/free-stock-music/hip-hop/', platform: 'Mixkit' }
    ],
    keywords: ['trap', 'hip-hop', 'urban', 'modern']
  },
  emotional_piano: {
    label: 'Emotional Piano / Strings',
    description: 'Historical content, player legacy',
    sources: [
      { name: 'Pixabay - Emotional', url: 'https://pixabay.com/music/search/emotional/', platform: 'Pixabay' },
      { name: 'Mixkit - Emotional', url: 'https://mixkit.co/free-stock-music/emotional/', platform: 'Mixkit' }
    ],
    keywords: ['emotional', 'piano', 'strings', 'nostalgic']
  }
};

const YOUTUBE_AUDIO_LIBRARY_CMD = `yt-dlp --flat-playlist --print "%(title)s|%(url)s" "https://www.youtube.com/audiolibrary/music?nv=1" --cookies-from-browser chrome`;

class MusicService {

  static recommend(contentType) {
    const mood = this._contentTypeToMood(contentType);
    const category = MUSIC_CATEGORIES[mood] || MUSIC_CATEGORIES.epic_orchestral;
    return {
      mood,
      ...category,
      downloadCommand: this._getDownloadCommand(mood),
      notes: 'All tracks from these sources are copyright-free for YouTube monetization'
    };
  }

  static _contentTypeToMood(contentType) {
    const map = {
      goals: 'epic_orchestral',
      matches: 'epic_orchestral',
      world_cup: 'anthemic',
      controversy: 'dark_tension',
      transfer: 'modern_trap',
      player_story: 'emotional_piano',
      rivalry: 'dark_tension',
      records: 'emotional_piano',
      funny: 'upbeat_quirky'
    };
    return map[contentType] || 'epic_orchestral';
  }

  static _getDownloadCommand(mood) {
    const keywords = MUSIC_CATEGORIES[mood]?.keywords.join(' ') || 'epic';
    return {
      pixabay: `# Download from Pixabay (no account needed)\n# Visit: https://pixabay.com/music/search/${keywords.split(' ')[0]}/\n# Filter: Free / CC0\n# Download MP3 directly`,
      youtube_audio_lib: `# YouTube Audio Library (requires YouTube login)\nyt-dlp --cookies-from-browser chrome -x --audio-format mp3 -o "music/%(title)s.%(ext)s" "https://www.youtube.com/audiolibrary/music"`,
      mixkit: `# Mixkit (completely free, no attribution needed)\n# Visit: https://mixkit.co/free-stock-music/${keywords.split(' ')[0]}/\n# Download WAV/MP3 directly`
    };
  }

  static async getTrackForMood(mood) {
    const moodDir = path.join(MUSIC_DIR, mood);
    if (await fs.pathExists(moodDir)) {
      const files = await fs.readdir(moodDir);
      const track = files.find(f => f.endsWith('.mp3') || f.endsWith('.wav') || f.endsWith('.m4a'));
      if (track) return path.join(moodDir, track);
    }

    // Check general music dir
    if (await fs.pathExists(MUSIC_DIR)) {
      const files = await fs.readdir(MUSIC_DIR);
      const track = files.find(f => f.endsWith('.mp3') || f.endsWith('.wav') || f.endsWith('.m4a'));
      if (track) return path.join(MUSIC_DIR, track);
    }

    return null; // No music available
  }

  static async downloadTrack(contentType, trackUrl) {
    const mood = this._contentTypeToMood(contentType);
    const moodDir = path.join(MUSIC_DIR, mood);
    await fs.ensureDir(moodDir);

    if (!trackUrl) return { error: 'No track URL provided' };

    return new Promise((resolve) => {
      const cmd = `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${moodDir}/%(title)s.%(ext)s" "${trackUrl}"`;
      exec(cmd, (err) => {
        if (err) resolve({ error: err.message });
        else resolve({ success: true, dir: moodDir });
      });
    });
  }

  static async listLibrary() {
    const library = {};
    if (!await fs.pathExists(MUSIC_DIR)) return library;

    const items = await fs.readdir(MUSIC_DIR);
    for (const item of items) {
      const itemPath = path.join(MUSIC_DIR, item);
      const stat = await fs.stat(itemPath);
      if (stat.isDirectory()) {
        const files = await fs.readdir(itemPath);
        library[item] = files.filter(f => /\.(mp3|wav|m4a|ogg)$/.test(f));
      } else if (/\.(mp3|wav|m4a|ogg)$/.test(item)) {
        library.general = library.general || [];
        library.general.push(item);
      }
    }
    return library;
  }

  static getCategories() {
    return Object.entries(MUSIC_CATEGORIES).map(([key, val]) => ({
      id: key,
      label: val.label,
      description: val.description,
      sources: val.sources
    }));
  }
}

module.exports = MusicService;
