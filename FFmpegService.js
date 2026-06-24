const { exec } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const MusicService = require('./MusicService');

const OUTPUT_DIR = path.resolve(process.env.OUTPUT_DIR || './output');

class FFmpegService {

  static async produceVideo({ inputPath, script, videoFormat, jobId }) {
    const jobOutputDir = path.join(OUTPUT_DIR, jobId);
    await fs.ensureDir(jobOutputDir);

    const isShorts = videoFormat === 'shorts';
    const outputFile = path.join(jobOutputDir, isShorts ? 'shorts_output.mp4' : 'longform_output.mp4');

    // Get music track
    const musicPath = await MusicService.getTrackForMood(script.music_mood || 'epic_orchestral');

    // Build FFmpeg filter chain
    const filters = this._buildFilters(isShorts, script);
    const ffmpegCmd = this._buildCommand({ inputPath, outputFile, musicPath, filters, isShorts, script });

    global.logger.info(`FFmpeg CMD: ${ffmpegCmd}`);

    return new Promise((resolve, reject) => {
      exec(ffmpegCmd, { maxBuffer: 50 * 1024 * 1024 }, async (err, stdout, stderr) => {
        if (err) {
          global.logger.error(`FFmpeg error: ${err.message}`);
          // Even if ffmpeg fails (not installed), save the metadata
          await this._saveJobMetadata(jobOutputDir, { inputPath, script, videoFormat, jobId, outputFile, error: err.message });
          return resolve({ outputFile, warning: 'FFmpeg processing failed — raw file preserved', script });
        }

        await this._saveJobMetadata(jobOutputDir, { inputPath, script, videoFormat, jobId, outputFile });
        global.logger.info(`Video produced: ${outputFile}`);
        resolve({ outputFile, format: videoFormat, script });
      });
    });
  }

  static _buildFilters(isShorts, script) {
    const filters = [];

    if (isShorts) {
      // Vertical crop 9:16
      filters.push('crop=ih*9/16:ih:(iw-ih*9/16)/2:0');
      // Scale to 1080x1920
      filters.push('scale=1080:1920');
    } else {
      // Standard 16:9
      filters.push('scale=1920:1080');
    }

    // Brightness/saturation boost
    filters.push('eq=brightness=0.05:saturation=1.2:contrast=1.05');

    // Subtle zoom effect
    filters.push("zoompan=z='min(zoom+0.0005,1.05)':d=125:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'");

    return filters;
  }

  static _buildCommand({ inputPath, outputFile, musicPath, filters, isShorts, script }) {
    const duration = isShorts ? 60 : 480;
    const videoFilter = filters.join(',');

    // Caption/subtitle filter (basic burned-in text)
    const hook = (script?.hook || '').replace(/"/g, '\\"').slice(0, 60);

    let cmd = `ffmpeg -y -i "${inputPath}"`;

    if (musicPath && fs.existsSync(musicPath)) {
      cmd += ` -i "${musicPath}"`;
      cmd += ` -filter_complex "[0:v]${videoFilter},drawtext=text='${hook}':fontcolor=white:fontsize=48:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h*0.85[v];[1:a]volume=0.15,afade=t=out:st=${duration - 3}:d=3[music];[0:a][music]amix=inputs=2:duration=first[a]"`;
      cmd += ` -map "[v]" -map "[a]"`;
    } else {
      cmd += ` -filter_complex "[0:v]${videoFilter},drawtext=text='${hook}':fontcolor=white:fontsize=48:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h*0.85[v]"`;
      cmd += ` -map "[v]" -map 0:a`;
    }

    cmd += ` -t ${duration}`;
    cmd += ` -c:v libx264 -preset fast -crf 23`;
    cmd += ` -c:a aac -b:a 128k`;
    cmd += ` -movflags +faststart`;
    cmd += ` "${outputFile}"`;

    return cmd;
  }

  static async _saveJobMetadata(dir, data) {
    const metaPath = path.join(dir, 'metadata.json');
    await fs.writeJSON(metaPath, {
      ...data,
      createdAt: new Date().toISOString()
    }, { spaces: 2 });
  }

  // Generate ffmpeg commands as text for display
  static getCommandsForDisplay({ inputPath, videoFormat, musicMood }) {
    const isShorts = videoFormat === 'shorts';
    return {
      download: `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]" --merge-output-format mp4 --write-auto-sub --sub-lang en --write-info-json -o "downloads/%(title)s.%(ext)s" "YOUR_URL"`,
      shorts: isShorts ? `ffmpeg -i input.mp4 -i music.mp3 -filter_complex "[0:v]crop=ih*9/16:ih,scale=1080:1920,eq=brightness=0.05:saturation=1.2[v];[1:a]volume=0.15[music];[0:a][music]amix=inputs=2:duration=first[a]" -map "[v]" -map "[a]" -t 60 -c:v libx264 -crf 23 -c:a aac output_shorts.mp4` : null,
      longform: !isShorts ? `ffmpeg -i input.mp4 -i music.mp3 -filter_complex "[0:v]scale=1920:1080,eq=brightness=0.05:saturation=1.2[v];[1:a]volume=0.12,afade=t=out:st=477:d=3[music];[0:a][music]amix=inputs=2:duration=first[a]" -map "[v]" -map "[a]" -c:v libx264 -crf 23 -c:a aac output_longform.mp4` : null
    };
  }
}

module.exports = FFmpegService;
