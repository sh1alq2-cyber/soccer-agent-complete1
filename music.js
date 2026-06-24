const express = require('express');
const router = express.Router();
const MusicService = require('../services/MusicService');
const path = require('path');

// GET /api/music/recommend?contentType=goals
router.get('/recommend', (req, res) => {
  const { contentType } = req.query;
  const recommendation = MusicService.recommend(contentType || 'epic_goals');
  res.json(recommendation);
});

// POST /api/music/download
router.post('/download', async (req, res) => {
  const { contentType, trackUrl } = req.body;
  res.json({ message: 'Music download started' });
  await MusicService.downloadTrack(contentType, trackUrl);
});

// GET /api/music/library — list downloaded tracks
router.get('/library', async (req, res) => {
  const tracks = await MusicService.listLibrary();
  res.json(tracks);
});

// GET /api/music/categories
router.get('/categories', (req, res) => {
  res.json(MusicService.getCategories());
});

module.exports = router;
