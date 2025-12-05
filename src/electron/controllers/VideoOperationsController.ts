import * as fs from 'fs';
import * as path from 'path';
import ffmpeg from 'fluent-ffmpeg';

export class VideoOperationsController {
  /**
   * Convert video to different format using FFmpeg
   */
  async convertVideo(filePath: string, targetFormat: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const dir = path.dirname(filePath);
        const fileName = path.basename(filePath, path.extname(filePath));
        const outputPath = path.join(dir, `${fileName}_converted.${targetFormat}`);

        console.log('Converting video:', filePath, 'to', outputPath);

        ffmpeg(filePath)
          .output(outputPath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .on('start', (commandLine) => {
            console.log('FFmpeg command:', commandLine);
          })
          .on('progress', (progress) => {
            console.log('Processing: ' + progress.percent + '% done');
          })
          .on('end', () => {
            console.log('Video conversion complete:', outputPath);
            resolve(true);
          })
          .on('error', (err) => {
            console.error('Error converting video:', err.message);
            resolve(false);
          })
          .run();
      } catch (error) {
        console.error('Error setting up video conversion:', error);
        resolve(false);
      }
    });
  }

  /**
   * Scale down video to specified resolution using FFmpeg
   */
  async scaleVideo(filePath: string, resolution: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const dir = path.dirname(filePath);
        const fileName = path.basename(filePath, path.extname(filePath));
        const ext = path.extname(filePath);
        const outputPath = path.join(dir, `${fileName}_${resolution.replace('x', '_')}${ext}`);

        console.log('Scaling video:', filePath, 'to', resolution);

        ffmpeg(filePath)
          .output(outputPath)
          .size(resolution)
          .videoCodec('libx264')
          .audioCodec('copy')
          .on('start', (commandLine) => {
            console.log('FFmpeg command:', commandLine);
          })
          .on('progress', (progress) => {
            console.log('Processing: ' + progress.percent + '% done');
          })
          .on('end', () => {
            console.log('Video scaling complete:', outputPath);
            resolve(true);
          })
          .on('error', (err) => {
            console.error('Error scaling video:', err.message);
            resolve(false);
          })
          .run();
      } catch (error) {
        console.error('Error setting up video scaling:', error);
        resolve(false);
      }
    });
  }

  /**
   * Sharpen video using unsharp filter
   */
  async sharpenVideo(filePath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const dir = path.dirname(filePath);
        const fileName = path.basename(filePath, path.extname(filePath));
        const ext = path.extname(filePath);
        const outputPath = path.join(dir, `${fileName}_sharpened${ext}`);

        console.log('Sharpening video:', filePath);

        ffmpeg(filePath)
          .output(outputPath)
          .videoFilter('unsharp')
          .videoCodec('libx264')
          .audioCodec('copy')
          .on('start', (commandLine) => {
            console.log('FFmpeg command:', commandLine);
          })
          .on('progress', (progress) => {
            console.log('Processing: ' + progress.percent + '% done');
          })
          .on('end', () => {
            console.log('Video sharpening complete:', outputPath);
            resolve(true);
          })
          .on('error', (err) => {
            console.error('Error sharpening video:', err.message);
            resolve(false);
          })
          .run();
      } catch (error) {
        console.error('Error setting up video sharpening:', error);
        resolve(false);
      }
    });
  }

  /**
   * Get video duration in seconds
   */
  async getVideoDuration(filePath: string): Promise<number> {
    return new Promise((resolve) => {
      try {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
          if (err) {
            console.error('Error getting video duration:', err.message);
            resolve(0);
          } else {
            const duration = metadata.format.duration || 0;
            console.log('Video duration:', duration, 'seconds');
            resolve(duration);
          }
        });
      } catch (error) {
        console.error('Error setting up ffprobe:', error);
        resolve(0);
      }
    });
  }

  /**
   * Trim video to specified time range
   */
  async trimVideo(filePath: string, startTime: number, endTime: number): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const dir = path.dirname(filePath);
        const fileName = path.basename(filePath, path.extname(filePath));
        const ext = path.extname(filePath);
        const outputPath = path.join(dir, `${fileName}_trimmed${ext}`);

        console.log('Trimming video:', filePath, 'from', startTime, 'to', endTime);

        const duration = endTime - startTime;

        ffmpeg(filePath)
          .setStartTime(startTime)
          .setDuration(duration)
          .output(outputPath)
          .videoCodec('copy')
          .audioCodec('copy')
          .on('start', (commandLine) => {
            console.log('FFmpeg command:', commandLine);
          })
          .on('progress', (progress) => {
            console.log('Processing: ' + progress.percent + '% done');
          })
          .on('end', () => {
            console.log('Video trimming complete:', outputPath);
            resolve(true);
          })
          .on('error', (err) => {
            console.error('Error trimming video:', err.message);
            resolve(false);
          })
          .run();
      } catch (error) {
        console.error('Error setting up video trimming:', error);
        resolve(false);
      }
    });
  }

  /**
   * Rename file
   */
  async renameFile(filePath: string, newName: string): Promise<boolean> {
    try {
      const dir = path.dirname(filePath);
      const newPath = path.join(dir, newName);

      console.log('Renaming:', filePath, 'to', newPath);

      // Check if target file already exists
      if (fs.existsSync(newPath)) {
        console.error('Target file already exists:', newPath);
        return false;
      }

      await fs.promises.rename(filePath, newPath);
      console.log('Rename complete:', newPath);
      return true;
    } catch (error) {
      console.error('Error renaming file:', error);
      return false;
    }
  }
}
