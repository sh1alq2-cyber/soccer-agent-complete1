const { exec, execSync } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const sanitize = require('sanitize-filename');
const archiver = require('archiver');
const { v4: uuidv4 } = require('uuid');

const DOWNLOADS_DIR = path.resolve(process.env.DOWNLOADS_DIR || './downloads');
const OUTPUT_DIR = path.resolve(process.env.OUTPUT_DIR || './output');

class VideoService {

  static async getInfo(url) {
    return new Promise((resolve, reject) => {
      const cmd = `yt-dlp --dump-json --no-playlist "${url}"`;
      exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
        if (err) return reject(new Error(`yt-dlp info failed: ${err.message}`));
        try {
          resolve(JSON.parse(stdout));
        } catch {
          reject(new Error('Failed to parse video info'));
        }
      });
    });
  }

  static async download(url, jobId) {
    const jobDir = path.join(DOWNLOADS_DIR, jobId);
    await fs.ensureDir(jobDir);

    return new Promise((resolve, reject) => {
      const cmd = [
        'yt-dlp',
        `-f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"`,
        `--merge-output-format mp4`,
        `--write-auto-sub`,
        `--sub-lang en`,
        `--write-info-json`,
        `--no-playlist`,
        `--restrict-filenames`,
        `-o "${jobDir}/%(title)s.%(ext)s"`,
        `"${url}"`
      ].join(' ');

      global.logger.info(`Downloading: ${url}`);
      global.logger.info(`CMD: ${cmd}`);

      exec(cmd, { maxBuffer: 50 * 1024 * 1024 }, async (err, stdout, stderr) => {
        if (err) {
          global.logger.error(`Download error: ${err.message}`);
          return reject(new Error(`Download failed: ${err.message}`));
        }

        // Find the downloaded mp4
        const files = await fs.readdir(jobDir);
        const mp4 = files.find(f => f.endsWith('.mp4'));
        const jsonFile = files.find(f => f.endsWith('.info.json'));

        if (!mp4) return reject(new Error('No MP4 file found after download'));

        const filePath = path.join(jobDir, mp4);
        let info = {};

        if (jsonFile) {
          try {
            info = JSON.parse(await fs.readFile(path.join(jobDir, jsonFile), 'utf-8'));
          } catch {}
        }

        global.logger.info(`Downloaded: ${filePath}`);
        resolve({ filePath, jobDir, info, filename: mp4 });
      });
    });
  }

  static async listJobs() {
    const jobs = [];
    if (!await fs.pathExists(OUTPUT_DIR)) return jobs;

    const dirs = await fs.readdir(OUTPUT_DIR);
    for (const d of dirs) {
      const meta = path.join(OUTPUT_DIR, d, 'metadata.json');
      if (await fs.pathExists(meta)) {
        jobs.push({ jobId: d, ...JSON.parse(await fs.readFile(meta, 'utf-8')) });
      }
    }
    return jobs.reverse();
  }

  static async packageJob(jobId) {
    const jobOutputDir = path.join(OUTPUT_DIR, jobId);
    const zipPath = path.join(OUTPUT_DIR, `${jobId}_package.zip`);

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve(zipPath));
      archive.on('error', reject);
      archive.pipe(output);
      archive.directory(jobOutputDir, false);
      archive.finalize();
    });
  }
}

module.exports = VideoService;
