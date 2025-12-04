import { FileEntry } from './models/FileEntry';
import { DriveEntry } from './models/DriveEntry';

interface ElectronAPI {
  getDrives: () => Promise<DriveEntry[]>;
  readDirectory: (path: string) => Promise<FileEntry[]>;
  getParentDirectory: (path: string) => Promise<string | null>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
