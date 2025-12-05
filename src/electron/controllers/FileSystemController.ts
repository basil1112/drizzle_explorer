import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { FileEntry } from '../models/FileEntry';
import { DriveEntry } from '../models/DriveEntry';

const execAsync = promisify(exec);

export class FileSystemController {
  /**
   * Helper function to format bytes
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  /**
   * Get all available drives with detailed information (Windows) or root directory (Unix-based)
   */
  async getDrives(): Promise<DriveEntry[]> {
    const drives: DriveEntry[] = [];
    
    try {
      if (process.platform === 'win32') {
        // Windows: Check drives A-Z
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        
        for (const letter of letters) {
          const drivePath = `${letter}:\\`;
          try {
            // Check if drive exists
            await fs.promises.access(drivePath);
            
            // Get drive stats
            const stats = await fs.promises.statfs(drivePath);
            const totalBytes = stats.blocks * stats.bsize;
            const freeBytes = stats.bfree * stats.bsize;
            const usedBytes = totalBytes - freeBytes;
            const usedPercentage = Math.round((usedBytes / totalBytes) * 100);
            
            // Try to get volume name
            let volumeName = letter;
            try {
              const { stdout } = await execAsync(`vol ${letter}:`);
              const match = stdout.match(/Volume in drive [A-Z] is (.+)/);
              if (match && match[1]) {
                volumeName = match[1].trim();
              }
            } catch (e) {
              // Volume name not available
            }
            
            drives.push({
              name: `${volumeName} (${letter}:)`,
              letter: letter,
              path: drivePath,
              total: this.formatBytes(totalBytes),
              totalBytes: totalBytes,
              free: this.formatBytes(freeBytes),
              freeBytes: freeBytes,
              used: this.formatBytes(usedBytes),
              usedBytes: usedBytes,
              percentage: usedPercentage,
              type: 'drive' as const
            });
          } catch (err) {
            // Drive doesn't exist or not accessible
          }
        }
      } else {
        // Unix-based systems
        const stats = await fs.promises.statfs('/');
        const totalBytes = stats.blocks * stats.bsize;
        const freeBytes = stats.bfree * stats.bsize;
        const usedBytes = totalBytes - freeBytes;
        const usedPercentage = Math.round((usedBytes / totalBytes) * 100);
        
        drives.push({
          name: 'Root (/)',
          letter: '/',
          path: '/',
          total: this.formatBytes(totalBytes),
          totalBytes: totalBytes,
          free: this.formatBytes(freeBytes),
          freeBytes: freeBytes,
          used: this.formatBytes(usedBytes),
          usedBytes: usedBytes,
          percentage: usedPercentage,
          type: 'drive' as const
        });
      }
    } catch (error) {
      console.error('Error getting drives:', error);
    }
    
    return drives;
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

  /**
   * Get system paths
   */
  getSystemPaths(): Record<string, string> {
    const homedir = os.homedir();
    return {
      home: homedir,
      desktop: path.join(homedir, 'Desktop'),
      documents: path.join(homedir, 'Documents'),
      downloads: path.join(homedir, 'Downloads'),
      pictures: path.join(homedir, 'Pictures'),
      music: path.join(homedir, 'Music'),
      videos: path.join(homedir, 'Videos')
    };
  }
}
