import { ipcMain, dialog, app } from 'electron';
import { FileSystemController } from '../controllers/FileSystemController';
import { FileOperationsController } from '../controllers/FileOperationsController';
import { VideoOperationsController } from '../controllers/VideoOperationsController';
import { ImageOperationsController } from '../controllers/ImageOperationsController';
import { CompressionController } from '../controllers/CompressionController';
import { getProfile, updateProfile, regenerateUUID, getTransferQueue, addToTransferQueue, removeFromTransferQueue, clearTransferQueue, getSetting, setSetting, getAllSettings, getLayoutTheme, updateLayout, updateDarkMode, updateLayoutTheme } from '../database/db';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';

const fileSystemController = new FileSystemController();
const fileOperationsController = new FileOperationsController();
const videoOperationsController = new VideoOperationsController();
const imageOperationsController = new ImageOperationsController();
const compressionController = new CompressionController();

/**
 * Register all IPC handlers for file system operations
 */
export function registerFileSystemHandlers() {
  // Get all drives (Windows)
  ipcMain.handle('get-drives', async () => {
    return await fileSystemController.getDrives();
  });

  // Read directory contents
  ipcMain.handle('read-directory', async (event, dirPath: string) => {
    return await fileSystemController.readDirectory(dirPath);
  });

  // Get parent directory
  ipcMain.handle('get-parent-directory', async (event, currentPath: string) => {
    return fileSystemController.getParentDirectory(currentPath);
  });

  // Get Windows special folders
  ipcMain.handle('get-special-folder', async (event, folderName: string) => {
    return fileSystemController.getSpecialFolder(folderName);
  });

  // File operations
  ipcMain.handle('copy-path', async (event, filePath: string) => {
    fileOperationsController.copyPath(filePath);
    return true;
  });

  ipcMain.handle('has-copied-path', async () => {
    return fileOperationsController.hasCopiedPath();
  });

  ipcMain.handle('paste-path', async (event, destinationDir: string) => {
    return await fileOperationsController.paste(destinationDir);
  });

  ipcMain.handle('open-path', async (event, filePath: string) => {
    await fileOperationsController.openPath(filePath);
    return true;
  });

  ipcMain.handle('delete-path', async (event, filePath: string) => {
    return await fileOperationsController.deletePath(filePath);
  });

  // Video operations
  ipcMain.handle('convert-video', async (event, filePath: string, targetFormat: string) => {
    return await videoOperationsController.convertVideo(filePath, targetFormat);
  });

  ipcMain.handle('scale-video', async (event, filePath: string, resolution: string) => {
    return await videoOperationsController.scaleVideo(filePath, resolution);
  });

  ipcMain.handle('sharpen-video', async (event, filePath: string) => {
    return await videoOperationsController.sharpenVideo(filePath);
  });

  ipcMain.handle('get-video-duration', async (event, filePath: string) => {
    return await videoOperationsController.getVideoDuration(filePath);
  });

  ipcMain.handle('trim-video', async (event, filePath: string, startTime: number, endTime: number) => {
    return await videoOperationsController.trimVideo(filePath, startTime, endTime);
  });

  ipcMain.handle('rename-file', async (event, filePath: string, newName: string) => {
    return await videoOperationsController.renameFile(filePath, newName);
  });

  // Image operations
  ipcMain.handle('convert-image', async (event, filePath: string, targetFormat: string) => {
    return await imageOperationsController.convertImage(filePath, targetFormat);
  });

  ipcMain.handle('sharpen-image', async (event, filePath: string) => {
    return await imageOperationsController.sharpenImage(filePath);
  });

  ipcMain.handle('compress-image', async (event, filePath: string) => {
    return await imageOperationsController.compressImage(filePath);
  });

  // Profile operations
  ipcMain.handle('get-profile', async () => {
    return getProfile();
  });

  ipcMain.handle('update-profile', async (event, name: string) => {
    return updateProfile(name);
  });

  ipcMain.handle('regenerate-uuid', async () => {
    return regenerateUUID();
  });

  // Transfer queue operations
  ipcMain.handle('get-transfer-queue', async () => {
    return getTransferQueue();
  });

  ipcMain.handle('add-to-transfer-queue', async (event, filePath: string) => {
    return addToTransferQueue(filePath);
  });

  ipcMain.handle('remove-from-transfer-queue', async (event, filePath: string) => {
    removeFromTransferQueue(filePath);
    return true;
  });

  ipcMain.handle('clear-transfer-queue', async () => {
    clearTransferQueue();
    return true;
  });

  // Settings operations
  ipcMain.handle('get-setting', async (event, key: string) => {
    return getSetting(key);
  });

  ipcMain.handle('set-setting', async (event, key: string, value: string) => {
    setSetting(key, value);
    return true;
  });

  ipcMain.handle('get-all-settings', async () => {
    return getAllSettings();
  });

  // Layout theme operations
  ipcMain.handle('get-layout-theme', async () => {
    return getLayoutTheme();
  });

  ipcMain.handle('update-layout', async (event, layout: string) => {
    return updateLayout(layout);
  });

  ipcMain.handle('update-dark-mode', async (event, darkMode: boolean) => {
    return updateDarkMode(darkMode);
  });

  ipcMain.handle('update-layout-theme', async (event, layout: string, darkMode: boolean) => {
    return updateLayoutTheme(layout, darkMode);
  });

  // Compression operations
  ipcMain.handle('compress-7zip', async (event, sourcePath: string, outputPath?: string) => {
    try {
      const result = await compressionController.compress7zip(sourcePath, outputPath);
      return { success: true, outputPath: result };
    } catch (error: any) {
      console.error('Compress 7zip error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('compress-native', async (event, sourcePath: string, outputPath?: string) => {
    try {
      const result = await compressionController.compressNative(sourcePath, outputPath);
      return { success: true, outputPath: result };
    } catch (error: any) {
      console.error('Compress native error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('extract-7zip', async (event, archivePath: string, outputDir?: string) => {
    try {
      const result = await compressionController.extract7zip(archivePath, outputDir);
      return { success: true, outputPath: result };
    } catch (error: any) {
      console.error('Extract 7zip error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('extract-native', async (event, archivePath: string, outputDir?: string) => {
    try {
      const result = await compressionController.extractNative(archivePath, outputDir);
      return { success: true, outputPath: result };
    } catch (error: any) {
      console.error('Extract native error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('is-compressed-file', async (event, filePath: string) => {
    return compressionController.isCompressedFile(filePath);
  });

  // File transfer operations
  ipcMain.handle('get-file-info', async (event, filePath: string) => {
    try {
      const stats = await fs.stat(filePath);
      const fileName = path.basename(filePath);
      return {
        fileName,
        fileSize: stats.size
      };
    } catch (error: any) {
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  });

  ipcMain.handle('read-file-chunk', async (event, filePath: string, offset: number, length: number) => {
    try {
      const fileHandle = await fs.open(filePath, 'r');
      const buffer = Buffer.allocUnsafe(length);
      const { bytesRead } = await fileHandle.read(buffer, 0, length, offset);
      await fileHandle.close();
      
      return buffer.slice(0, bytesRead);
    } catch (error: any) {
      throw new Error(`Failed to read file chunk: ${error.message}`);
    }
  });

  ipcMain.handle('save-received-file', async (event, fileName: string, data: Uint8Array) => {
    try {
      const downloadsPath = app.getPath('downloads');
      const savePath = path.join(downloadsPath, fileName);
      
      // Check if file exists and create unique name if needed
      let finalPath = savePath;
      let counter = 1;
      const ext = path.extname(fileName);
      const baseName = path.basename(fileName, ext);
      
      while (await fs.access(finalPath).then(() => true).catch(() => false)) {
        finalPath = path.join(downloadsPath, `${baseName} (${counter})${ext}`);
        counter++;
      }
      
      await fs.writeFile(finalPath, Buffer.from(data));
      return finalPath;
    } catch (error: any) {
      throw new Error(`Failed to save file: ${error.message}`);
    }
  });

  // Stream-based file writing for large file transfers
  const activeStreams = new Map<string, fsSync.WriteStream>();

  ipcMain.handle('init-write-stream', async (event, fileName: string) => {
    try {
      const downloadsPath = app.getPath('downloads');
      const savePath = path.join(downloadsPath, fileName);
      
      // Check if file exists and create unique name if needed
      let finalPath = savePath;
      let counter = 1;
      const ext = path.extname(fileName);
      const baseName = path.basename(fileName, ext);
      
      while (await fs.access(finalPath).then(() => true).catch(() => false)) {
        finalPath = path.join(downloadsPath, `${baseName} (${counter})${ext}`);
        counter++;
      }

      // Create write stream
      const writeStream = fsSync.createWriteStream(finalPath);
      const streamId = `${Date.now()}-${Math.random()}`;
      
      activeStreams.set(streamId, writeStream);
      
      return { streamId, finalPath };
    } catch (error: any) {
      throw new Error(`Failed to initialize write stream: ${error.message}`);
    }
  });

  ipcMain.handle('write-chunk', async (event, streamId: string, chunk: Uint8Array) => {
    try {
      const stream = activeStreams.get(streamId);
      if (!stream) {
        throw new Error(`Stream ${streamId} not found`);
      }

      // Write chunk to stream
      return new Promise<void>((resolve, reject) => {
        const canContinue = stream.write(Buffer.from(chunk));
        if (canContinue) {
          resolve();
        } else {
          // Wait for drain event if buffer is full
          stream.once('drain', () => resolve());
          stream.once('error', reject);
        }
      });
    } catch (error: any) {
      throw new Error(`Failed to write chunk: ${error.message}`);
    }
  });

  ipcMain.handle('finalize-write-stream', async (event, streamId: string) => {
    try {
      const stream = activeStreams.get(streamId);
      if (!stream) {
        throw new Error(`Stream ${streamId} not found`);
      }

      // Close the stream
      return new Promise<void>((resolve, reject) => {
        stream.end(() => {
          activeStreams.delete(streamId);
          resolve();
        });
        stream.once('error', reject);
      });
    } catch (error: any) {
      throw new Error(`Failed to finalize write stream: ${error.message}`);
    }
  });

  ipcMain.handle('cancel-write-stream', async (event, streamId: string) => {
    try {
      const stream = activeStreams.get(streamId);
      if (stream) {
        stream.destroy();
        activeStreams.delete(streamId);
      }
    } catch (error: any) {
      console.error('Error canceling write stream:', error);
    }
  });
}
