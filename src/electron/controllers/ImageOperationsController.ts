import * as path from 'path';
import ffmpeg from 'fluent-ffmpeg';

export class ImageOperationsController {
  /**
   * Convert image to different format using FFmpeg
   */
  async convertImage(filePath: string, targetFormat: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const dir = path.dirname(filePath);
        const fileName = path.basename(filePath, path.extname(filePath));
        const outputPath = path.join(dir, `${fileName}_converted.${targetFormat}`);

        console.log('Converting image:', filePath, 'to', outputPath);

        ffmpeg(filePath)
          .output(outputPath)
          .on('start', (commandLine) => {
            console.log('FFmpeg command:', commandLine);
          })
          .on('end', () => {
            console.log('Image conversion complete:', outputPath);
            resolve(true);
          })
          .on('error', (err) => {
            console.error('Error converting image:', err.message);
            resolve(false);
          })
          .run();
      } catch (error) {
        console.error('Error setting up image conversion:', error);
        resolve(false);
      }
    });
  }

  /**
   * Sharpen image using FFmpeg unsharp filter
   */
  async sharpenImage(filePath: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const dir = path.dirname(filePath);
        const fileName = path.basename(filePath, path.extname(filePath));
        const ext = path.extname(filePath);
        const outputPath = path.join(dir, `${fileName}_sharpened${ext}`);

        console.log('Sharpening image:', filePath);

        ffmpeg(filePath)
          .output(outputPath)
          .videoFilter('unsharp')
          .on('start', (commandLine) => {
            console.log('FFmpeg command:', commandLine);
          })
          .on('end', () => {
            console.log('Image sharpening complete:', outputPath);
            resolve(true);
          })
          .on('error', (err) => {
            console.error('Error sharpening image:', err.message);
            resolve(false);
          })
          .run();
      } catch (error) {
        console.error('Error setting up image sharpening:', error);
        resolve(false);
      }
    });
  }

  /**
   * Compress image using FFmpeg
   */
  async compressImage(filePath: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const dir = path.dirname(filePath);
        const fileName = path.basename(filePath, path.extname(filePath));
        const ext = path.extname(filePath).toLowerCase();
        const outputPath = path.join(dir, `${fileName}_compressed${ext}`);

        console.log('Compressing image:', filePath);

        const command = ffmpeg(filePath).output(outputPath);

        // Apply compression based on format
        if (ext === '.jpg' || ext === '.jpeg') {
          command.outputOptions(['-q:v 5']); // Quality 5 (lower is better quality, range 2-31)
        } else if (ext === '.png') {
          command.outputOptions(['-compression_level 9']);
        } else if (ext === '.webp') {
          command.outputOptions(['-quality 80']);
        }

        command
          .on('start', (commandLine) => {
            console.log('FFmpeg command:', commandLine);
          })
          .on('end', () => {
            console.log('Image compression complete:', outputPath);
            resolve(true);
          })
          .on('error', (err) => {
            console.error('Error compressing image:', err.message);
            resolve(false);
          })
          .run();
      } catch (error) {
        console.error('Error setting up image compression:', error);
        resolve(false);
      }
    });
  }
}
