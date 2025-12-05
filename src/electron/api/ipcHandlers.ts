import { ipcMain } from 'electron';
import { FileSystemController } from '../controllers/FileSystemController';
import { FileOperationsController } from '../controllers/FileOperationsController';
import { VideoOperationsController } from '../controllers/VideoOperationsController';
import { ImageOperationsController } from '../controllers/ImageOperationsController';

const fileSystemController = new FileSystemController();
const fileOperationsController = new FileOperationsController();
const videoOperationsController = new VideoOperationsController();
const imageOperationsController = new ImageOperationsController();

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
}
