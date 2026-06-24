const express = require('express');
const router = express.Router();
const VideoService = require('../services/VideoService');
const ScriptService = require('../services/ScriptService');
const FFmpegService = require('../services/FFmpegService');
const MetadataService = require('../services/MetadataService');
const { v4: uuidv4 } = require('uuid');

// POST /api/video/process — main pipeline entry point
router.post('/process', async (req, res) => {
  const { url, contentType, videoFormat, generateShorts } = req.body;

  if (!url) return res.status(400).json({ error: 'Video URL is required' });

  const jobId = uuidv4();
  res.json({ jobId, message: 'Processing started', status: 'queued' });

  // Run pipeline async and emit socket events
  const io = global.io;
  const emit = (event, data) => io.emit(`job:${jobId}`, { event, ...data });

  try {
    emit('progress', { step: 'download', percent: 0, message: 'Starting download...' });

    // STEP 1: Download
    const downloadResult = await VideoService.download(url, jobId);
    emit('progress', { step: 'download', percent: 100, message: 'Download complete', file: downloadResult.filePath });

    // STEP 2: Analyze & Script
    emit('progress', { step: 'script', percent: 0, message: 'Analyzing content and generating script...' });
    const scriptResult = await ScriptService.generate({
      videoPath: downloadResult.filePath,
      videoInfo: downloadResult.info,
      contentType: contentType || 'auto',
      jobId
    });
    emit('progress', { step: 'script', percent: 100, message: 'Script generated', script: scriptResult });

    // STEP 3: Edit video
    emit('progress', { step: 'edit', percent: 0, message: 'Applying effects, captions, and music...' });
    const editResult = await FFmpegService.produceVideo({
      inputPath: downloadResult.filePath,
      script: scriptResult,
      videoFormat: videoFormat || 'shorts',
      jobId
    });
    emit('progress', { step: 'edit', percent: 100, message: 'Video editing complete', output: editResult });

    // STEP 4: Generate metadata
    emit('progress', { step: 'metadata', percent: 0, message: 'Generating YouTube metadata...' });
    const metadata = await MetadataService.generate({
      videoInfo: downloadResult.info,
      script: scriptResult,
      contentType,
      jobId
    });
    emit('progress', { step: 'metadata', percent: 100, message: 'Metadata ready', metadata });

    emit('complete', {
      jobId,
      download: downloadResult,
      script: scriptResult,
      output: editResult,
      metadata
    });

    global.logger.info(`Job ${jobId} completed successfully`);
  } catch (err) {
    global.logger.error(`Job ${jobId} failed: ${err.message}`);
    emit('error', { message: err.message });
  }
});

// GET /api/video/info?url=...
router.get('/info', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL required' });
  const info = await VideoService.getInfo(url);
  res.json(info);
});

// GET /api/video/jobs — list all processed jobs
router.get('/jobs', async (req, res) => {
  const jobs = await VideoService.listJobs();
  res.json(jobs);
});

// GET /api/video/download/:jobId — download final package as zip
router.get('/download/:jobId', async (req, res) => {
  const { jobId } = req.params;
  const zipPath = await VideoService.packageJob(jobId);
  res.download(zipPath);
});

module.exports = router;
