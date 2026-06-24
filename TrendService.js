const axios = require('axios');

const SOCCER_TOPICS = [
  { topic: 'World Cup 2026 Qualifier Goals', contentType: 'world_cup', score: 10 },
  { topic: 'Messi World Cup 2026', contentType: 'player_story', score: 9 },
  { topic: 'Mbappé France 2026', contentType: 'player_story', score: 9 },
  { topic: 'World Cup 2026 Predictions', contentType: 'world_cup', score: 8 },
  { topic: 'Best Goals World Cup History', contentType: 'goals', score: 8 },
  { topic: 'World Cup 2026 Draw', contentType: 'world_cup', score: 8 },
  { topic: 'Champions League Goals', contentType: 'goals', score: 7 },
  { topic: 'Soccer Controversial Moments 2026', contentType: 'controversy', score: 7 },
  { topic: 'Transfer News 2026', contentType: 'transfer', score: 6 },
  { topic: 'El Clasico Best Moments', contentType: 'rivalry', score: 6 }
];

class TrendService {

  static async getSoccerTrends() {
    try {
      // Try YouTube Data API for trending soccer content
      if (process.env.YOUTUBE_API_KEY) {
        return await this._fetchYouTubeTrends();
      }
    } catch (err) {
      global.logger?.warn('YouTube API trend fetch failed, using fallback');
    }

    // Fallback: return curated topics
    return SOCCER_TOPICS.map(t => ({
      ...t,
      videoUrl: null, // Would be populated by search
      fetchedAt: new Date().toISOString()
    }));
  }

  static async _fetchYouTubeTrends() {
    const queries = [
      'World Cup 2026 goals',
      'soccer highlights 2026',
      'football world cup qualifier'
    ];

    const results = [];
    for (const q of queries) {
      const { data } = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q,
          type: 'video',
          order: 'viewCount',
          publishedAfter: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          maxResults: 3,
          key: process.env.YOUTUBE_API_KEY
        }
      });

      for (const item of data.items || []) {
        results.push({
          topic: item.snippet.title,
          contentType: this._detectContentType(item.snippet.title),
          score: 8,
          videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          thumbnailUrl: item.snippet.thumbnails?.high?.url,
          channelTitle: item.snippet.channelTitle,
          fetchedAt: new Date().toISOString()
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  static _detectContentType(title) {
    const t = title.toLowerCase();
    if (t.includes('goal') || t.includes('skill') || t.includes('trick')) return 'goals';
    if (t.includes('world cup')) return 'world_cup';
    if (t.includes('transfer') || t.includes('sign')) return 'transfer';
    if (t.includes('controversy') || t.includes('red card') || t.includes('var')) return 'controversy';
    if (t.includes('clasico') || t.includes('derby') || t.includes('rivalry')) return 'rivalry';
    if (t.includes('record') || t.includes('history') || t.includes('legend')) return 'records';
    return 'matches';
  }
}

module.exports = TrendService;
