const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const CONTENT_TYPES = {
  goals: 'Epic Goals & Skills',
  matches: 'Legendary Matches',
  world_cup: 'World Cup 2026',
  controversy: 'Controversial Moments',
  transfer: 'Transfer Sagas',
  rivalry: 'Rivalries',
  player_story: 'Player Stories',
  records: 'Historical Records'
};

class ScriptService {

  static async generate({ videoPath, videoInfo, contentType, jobId }) {
    const title = videoInfo?.title || 'Soccer Video';
    const description = videoInfo?.description || '';
    const duration = videoInfo?.duration || 60;
    const isShorts = duration <= 120;

    const prompt = this._buildPrompt({ title, description, contentType, isShorts, duration });

    let script;
    if (process.env.OPENAI_API_KEY) {
      script = await this._generateWithOpenAI(prompt);
    } else if (process.env.ANTHROPIC_API_KEY) {
      script = await this._generateWithClaude(prompt);
    } else {
      // Fallback: template-based script
      script = this._generateTemplate({ title, contentType, isShorts });
    }

    // Save script
    const outputDir = path.join(process.env.OUTPUT_DIR || './output', jobId);
    await fs.ensureDir(outputDir);
    await fs.writeFile(path.join(outputDir, 'script.txt'), JSON.stringify(script, null, 2));

    return script;
  }

  static _buildPrompt({ title, description, contentType, isShorts, duration }) {
    return `You are an expert YouTube content writer specializing in viral soccer content for World Cup 2026.

VIDEO TITLE: "${title}"
VIDEO DESCRIPTION: "${description?.slice(0, 500)}"
CONTENT TYPE: ${CONTENT_TYPES[contentType] || 'Soccer Content'}
FORMAT: ${isShorts ? 'YouTube Shorts (max 60 seconds)' : `Long-form (${Math.round(duration / 60)} minutes)`}

Write a complete English narration script with this structure:

1. HOOK (0-3 sec): One shocking sentence, stat, or question. Make it impossible to scroll past.
2. CONTEXT (3-15 sec): Quick setup — who, what, when, where.
3. MAIN NARRATIVE (15-${isShorts ? '55' : '480'} sec): The full story with timestamps for key moments.
4. CLIMAX (note "[SLOW-MO]" and "[ZOOM]" cues): The peak moment.
5. CTA (last 3 sec): Subscribe/comment prompt.

Also provide:
- THUMBNAIL_TEXT: 2-3 bold words for the thumbnail
- MUSIC_MOOD: one of [epic_orchestral, dark_tension, upbeat_quirky, anthemic, modern_trap, emotional_piano]
- KEY_MOMENTS: array of {timestamp_hint, description, effect} for editor
- CLIP_START: suggested start time description for best segment
- CLIP_END: suggested end time description

Respond as valid JSON.`;
  }

  static async _generateWithOpenAI(prompt) {
    const { data } = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    }, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
    });
    return JSON.parse(data.choices[0].message.content);
  }

  static async _generateWithClaude(prompt) {
    const { data } = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt + '\n\nRespond with valid JSON only.' }]
    }, {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    });
    const text = data.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : this._generateTemplate({});
  }

  static _generateTemplate({ title = 'Incredible Soccer Moment', contentType = 'goals', isShorts = true }) {
    return {
      hook: "You won't believe what happened in this match.",
      context: `This is one of the most incredible soccer moments ever captured. The World Cup 2026 is coming and moments like these remind us why we love this game.`,
      narrative: `${title} — a moment that left fans speechless around the world. Watch closely as the play develops... [KEY MOMENT at 0:15] ... The crowd erupts!`,
      climax: "[SLOW-MO] Watch that again — pure genius. [ZOOM] The goalkeeper had no chance.",
      cta: "Subscribe for daily World Cup 2026 content you won't find anywhere else!",
      thumbnail_text: "IMPOSSIBLE GOAL",
      music_mood: "epic_orchestral",
      key_moments: [
        { timestamp_hint: "0:05", description: "Setup play begins", effect: "zoom_in" },
        { timestamp_hint: "0:15", description: "Peak moment — goal/tackle/skill", effect: "slow_mo" },
        { timestamp_hint: "0:25", description: "Crowd/player reaction", effect: "zoom_reaction" }
      ],
      clip_start: "Opening scene / kickoff",
      clip_end: "Celebration or final whistle"
    };
  }
}

module.exports = ScriptService;
