import { FileEntry } from './electron/models/FileEntry';
import { DriveEntry } from './electron/models/DriveEntry';

interface ElectronAPI {
  getDrives: () => Promise<DriveEntry[]>;
  readDirectory: (path: string) => Promise<FileEntry[]>;
  getParentDirectory: (path: string) => Promise<string | null>;
  getSpecialFolder: (folderName: string) => Promise<string>;
  copyPath: (path: string) => Promise<boolean>;
  hasCopiedPath: () => Promise<boolean>;
  pastePath: (destinationDir: string) => Promise<boolean>;
  openPath: (path: string) => Promise<boolean>;
  deletePath: (path: string) => Promise<boolean>;
  convertVideo: (path: string, targetFormat: string) => Promise<boolean>;
  scaleVideo: (path: string, resolution: string) => Promise<boolean>;
  sharpenVideo: (path: string) => Promise<boolean>;
  getVideoDuration: (path: string) => Promise<number>;
  trimVideo: (path: string, startTime: number, endTime: number) => Promise<boolean>;
  renameFile: (path: string, newName: string) => Promise<boolean>;
  convertImage: (path: string, targetFormat: string) => Promise<boolean>;
  sharpenImage: (path: string) => Promise<boolean>;
  compressImage: (path: string) => Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
