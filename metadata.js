const express = require('express');
const router = express.Router();
const MetadataService = require('../services/MetadataService');

// POST /api/metadata/generate
router.post('/generate', async (req, res) => {
  const { title, description, contentType, keywords } = req.body;
  const metadata = await MetadataService.generateFromText({ title, description, contentType, keywords });
  res.json(metadata);
});

// POST /api/metadata/thumbnail-brief
router.post('/thumbnail-brief', async (req, res) => {
  const { title, contentType, playerName } = req.body;
  const brief = await MetadataService.generateThumbnailBrief({ title, contentType, playerName });
  res.json(brief);
});

module.exports = router;
