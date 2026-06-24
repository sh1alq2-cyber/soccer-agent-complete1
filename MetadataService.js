const axios = require('axios');
const path = require('path');
const fs = require('fs-extra');

const BASE_TAGS = [
  'world cup 2026', 'FIFA 2026', 'soccer highlights', 'football 2026',
  'WorldCup2026', 'Soccer', 'Football', 'Goals', 'FIFA',
  'USA Mexico Canada 2026', 'Road to 2026', 'soccer goals',
  'football skills', 'soccer tricks', 'best goals', 'top 10 goals'
];

const TITLE_FORMULAS = [
  '[EVENT] That SHOCKED The Entire World',
  'Top 10 [CATEGORY] Moments — World Cup 2026',
  'The [SUPERLATIVE] [EVENT] In Soccer History',
  'Nobody Expected This From [PLAYER] | World Cup 2026',
  '[PLAYER]\'s IMPOSSIBLE [EVENT] Left Everyone SPEECHLESS',
  'This [EVENT] Broke The Internet — World Cup 2026 Reaction'
];

class MetadataService {

  static async generate({ videoInfo, script, contentType, jobId }) {
    const title = videoInfo?.title || 'Soccer Highlight';
    const playerName = this._extractPlayerName(title, videoInfo?.description || '');
    const eventName = this._extractEvent(title);

    const youtubeTitle = this._buildTitle(title, contentType, playerName, eventName);
    const description = this._buildDescription({ title, script, contentType, playerName });
    const tags = this._buildTags({ title, contentType, playerName });
    const thumbnailBrief = this.generateThumbnailBrief({ title, contentType, playerName });

    const metadata = {
      title: youtubeTitle,
      description,
      tags,
      category: 'Sports',
      language: 'en',
      madeForKids: false,
      thumbnailBrief,
      scheduleTime: this._getOptimalPublishTime(),
      hashtags: ['#WorldCup2026', '#Soccer', '#Football', '#FIFA2026', '#Goals'],
      fairUseDisclaimer: 'This video is created for educational and commentary purposes under Fair Use.'
    };

    if (jobId) {
      const dir = path.join(process.env.OUTPUT_DIR || './output', jobId);
      await fs.ensureDir(dir);
      await fs.writeJSON(path.join(dir, 'youtube_metadata.json'), metadata, { spaces: 2 });
    }

    return metadata;
  }

  static async generateFromText({ title, description, contentType, keywords }) {
    return this.generate({
      videoInfo: { title, description },
      script: { hook: '', cta: '' },
      contentType,
      jobId: null
    });
  }

  static _buildTitle(original, contentType, player, event) {
    const templates = {
      goals: `${player ? player + "'s " : ''}IMPOSSIBLE Goal Left Fans SPEECHLESS | World Cup 2026`,
      world_cup: `World Cup 2026: ${event || original.slice(0, 40)} That Changed EVERYTHING`,
      controversy: `The Controversial ${event || 'Moment'} That BROKE The Internet`,
      transfer: `${player || 'SHOCK'} Transfer CONFIRMED — Soccer World REACTS`,
      player_story: `${player || 'His'} Rise From NOTHING To World Cup Legend`,
      matches: `The Match That DEFINED A Generation | World Cup 2026 Classic`,
      rivalry: `${event || 'The Rivalry'} That DIVIDED The Soccer World`,
      records: `${player || 'The Record'} That Will NEVER Be Broken | World Cup History`
    };

    return (templates[contentType] || `${original.slice(0, 60)} | World Cup 2026`).slice(0, 100);
  }

  static _buildDescription({ title, script, contentType, playerName }) {
    const hook = script?.hook || "You won't believe this soccer moment.";
    const narrative = script?.narrative || '';

    return `${hook}

${narrative.slice(0, 300)}

🏆 WORLD CUP 2026 CONTENT — Every day we bring you the best soccer highlights, viral moments, and World Cup 2026 analysis.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 TIMESTAMPS
0:00 - Hook
0:05 - Context
0:15 - Main Moment
0:45 - Reaction
0:55 - Subscribe CTA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔔 SUBSCRIBE for daily World Cup 2026 content: @YourChannel
👍 LIKE if this blew your mind
💬 COMMENT: Who's your World Cup 2026 favorite?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📺 MORE VIDEOS:
▶ Top 10 World Cup Goals of All Time
▶ World Cup 2026 Predictions
▶ Most Controversial Moments in Soccer

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#WorldCup2026 #Soccer #Football #FIFA2026 #Goals #SoccerHighlights #FIFAWorldCup #Football2026

⚠️ FAIR USE NOTICE: This video is for educational and commentary purposes under Fair Use (17 U.S.C. § 107).`;
  }

  static _buildTags({ title, contentType, playerName }) {
    const specific = [];
    if (playerName) specific.push(playerName, `${playerName} goals`, `${playerName} skills`, `${playerName} 2026`);
    if (contentType) specific.push(contentType.replace('_', ' '), `${contentType.replace('_', ' ')} 2026`);

    // Extract keywords from title
    const titleWords = title.toLowerCase().split(' ').filter(w => w.length > 4);
    specific.push(...titleWords.slice(0, 5));

    return [...new Set([...specific, ...BASE_TAGS])].slice(0, 50);
  }

  static generateThumbnailBrief({ title, contentType, playerName }) {
    return {
      background: 'High-contrast action shot or stadium crowd with bokeh',
      playerFace: playerName ? `${playerName} — shocked/celebrating expression, large` : 'Player in peak action',
      textOverlay: {
        line1: { text: 'IMPOSSIBLE', style: 'Bold red, black outline, 120px' },
        line2: { text: playerName?.toUpperCase() || 'GOAL', style: 'Bold yellow, black outline, 90px' }
      },
      effects: 'Brightness +15%, Saturation +20%, add glow around player',
      arrow: 'Yellow arrow pointing to key element (ball/player/scoreboard)',
      abTest: [
        'Version A: Player face + score overlay',
        'Version B: Action shot + shock text only'
      ]
    };
  }

  static _extractPlayerName(title, description) {
    const players = ['Messi', 'Ronaldo', 'Mbappé', 'Neymar', 'Haaland', 'De Bruyne', 'Bellingham', 'Vinicius', 'Salah', 'Kane'];
    for (const p of players) {
      if (title.includes(p) || description.includes(p)) return p;
    }
    return null;
  }

  static _extractEvent(title) {
    const events = ['World Cup', 'Champions League', 'El Clásico', 'derby', 'final', 'goal', 'transfer'];
    for (const e of events) {
      if (title.toLowerCase().includes(e.toLowerCase())) return e;
    }
    return null;
  }

  static _getOptimalPublishTime() {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const optimal = ['Tuesday', 'Thursday', 'Saturday'];
    const times = ['14:00 EST', '17:00 EST', '20:00 EST'];
    return `${optimal[Math.floor(Math.random() * optimal.length)]} at ${times[Math.floor(Math.random() * times.length)]}`;
  }
}

module.exports = MetadataService;
