import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { FileEntry } from '../models/FileEntry';
import { DriveEntry } from '../models/DriveEntry';

const execAsync = promisify(exec);

export class FileSystemController {
  /**
   * Get all available drives (Windows) or root directory (Unix-based)
   */
  async getDrives(): Promise<DriveEntry[]> {
    try {
      if (process.platform === 'win32') {
        const { stdout } = await execAsync('wmic logicaldisk get name');
        const drives = stdout
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && line !== 'Name' && line.match(/^[A-Z]:/))
          .map(drive => ({
            path: drive + '\\',
            name: drive,
            type: 'drive' as const
          }));
        return drives;
      } else {
        // For Unix-based systems, return root
        return [{ path: '/', name: 'Root', type: 'drive' as const }];
      }
    } catch (error) {
      console.error('Error getting drives:', error);
      return [];
    }
  }

  /**
   * Read directory contents and return file/folder entries
   */
  async readDirectory(dirPath: string): Promise<FileEntry[]> {
    try {
      const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
      
      const entries = await Promise.all(
        items.map(async (item) => {
          const fullPath = path.join(dirPath, item.name);
          try {
            const stats = await fs.promises.stat(fullPath);
            return {
              name: item.name,
              path: fullPath,
              isDirectory: item.isDirectory(),
              size: stats.size,
              modified: stats.mtime,
              type: item.isDirectory() ? 'folder' as const : 'file' as const
            };
          } catch (error) {
            // Skip items we can't access
            return null;
          }
        })
      );

      return entries.filter((entry): entry is FileEntry => entry !== null);
    } catch (error) {
      console.error('Error reading directory:', error);
      throw error;
    }
  }

  /**
   * Get parent directory path
   */
  getParentDirectory(currentPath: string): string | null {
    const parentPath = path.dirname(currentPath);
    // Check if we're at the root
    if (parentPath === currentPath) {
      return null;
    }
    return parentPath;
  }
}
