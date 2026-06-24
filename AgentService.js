const TrendService = require('./TrendService');
const VideoService = require('./VideoService');
const ScriptService = require('./ScriptService');
const FFmpegService = require('./FFmpegService');
const MetadataService = require('./MetadataService');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs-extra');

let agentRunning = false;
let agentLogs = [];
const MAX_LOGS = 200;

function log(message, level = 'info') {
  const entry = { timestamp: new Date().toISOString(), level, message };
  agentLogs.unshift(entry);
  if (agentLogs.length > MAX_LOGS) agentLogs = agentLogs.slice(0, MAX_LOGS);
  global.logger[level](message);
  if (global.io) global.io.emit('agent:log', entry);
}

class AgentService {

  static getStatus() {
    return {
      running: agentRunning,
      lastRun: agentLogs.find(l => l.message.includes('Cycle complete'))?.timestamp || null,
      totalLogs: agentLogs.length
    };
  }

  static start() {
    agentRunning = true;
    log('🤖 Autonomous agent started');
  }

  static stop() {
    agentRunning = false;
    log('🛑 Autonomous agent stopped');
  }

  static getRecentLogs(n = 50) {
    return agentLogs.slice(0, n);
  }

  static async runCycle() {
    if (!agentRunning) return;

    log('🔄 Starting autonomous cycle...');

    try {
      // STEP 1: Trend scan
      log('📊 Scanning World Cup 2026 trends...');
      const trends = await TrendService.getSoccerTrends();
      log(`Found ${trends.length} trending topics`);

      if (!trends.length) {
        log('No trends found, skipping cycle', 'warn');
        return;
      }

      // STEP 2: Select best topic
      const best = trends[0];
      log(`🎯 Selected topic: "${best.topic}" (score: ${best.score})`);

      // STEP 3: Find source video
      if (!best.videoUrl) {
        log('No video URL for this topic, searching...', 'warn');
        return;
      }

      const jobId = uuidv4();
      log(`🚀 Starting job ${jobId} for topic: ${best.topic}`);

      // STEP 4: Download
      log('⬇️ Downloading video...');
      const downloaded = await VideoService.download(best.videoUrl, jobId);
      log(`✅ Downloaded: ${downloaded.filename}`);

      // STEP 5: Script
      log('✍️ Generating script...');
      const script = await ScriptService.generate({
        videoPath: downloaded.filePath,
        videoInfo: downloaded.info,
        contentType: best.contentType || 'world_cup',
        jobId
      });
      log('✅ Script generated');

      // STEP 6: Edit
      log('🎬 Producing video...');
      const output = await FFmpegService.produceVideo({
        inputPath: downloaded.filePath,
        script,
        videoFormat: 'shorts',
        jobId
      });
      log(`✅ Video produced: ${output.outputFile}`);

      // STEP 7: Metadata
      const metadata = await MetadataService.generate({
        videoInfo: downloaded.info,
        script,
        contentType: best.contentType,
        jobId
      });
      log(`✅ Metadata generated: "${metadata.title}"`);

      log(`🎉 Cycle complete — Job ${jobId} ready for review`);

      if (global.io) {
        global.io.emit('agent:job_complete', { jobId, metadata, output });
      }

    } catch (err) {
      log(`❌ Cycle error: ${err.message}`, 'error');
    }
  }
}

module.exports = AgentService;
