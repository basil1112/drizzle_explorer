import { ipcMain } from 'electron';
import { FileSystemController } from '../controllers/FileSystemController';

const fileSystemController = new FileSystemController();

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
}
