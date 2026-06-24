const express = require('express');
const router = express.Router();
const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

router.get('/', async (req, res) => {
  const checks = {
    server: 'ok',
    ytdlp: false,
    ffmpeg: false,
    directories: {},
    diskSpace: null
  };

  try { execSync('yt-dlp --version'); checks.ytdlp = true; } catch {}
  try { execSync('ffmpeg -version'); checks.ffmpeg = true; } catch {}

  const dirs = ['downloads', 'output', 'music', 'logs'];
  dirs.forEach(d => {
    checks.directories[d] = fs.existsSync(path.resolve(`./${d}`));
  });

  res.json(checks);
});

module.exports = router;
