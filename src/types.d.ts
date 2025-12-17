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
  getProfile: () => Promise<Profile>;
  updateProfile: (name: string) => Promise<Profile>;
  regenerateUUID: () => Promise<Profile>;
  getTransferQueue: () => Promise<TransferQueueItem[]>;
  addToTransferQueue: (filePath: string) => Promise<TransferQueueItem>;
  removeFromTransferQueue: (filePath: string) => Promise<boolean>;
  clearTransferQueue: () => Promise<boolean>;
  getFileInfo: (path: string) => Promise<{fileName: string; fileSize: number}>;
  readFileChunk: (path: string, offset: number, length: number) => Promise<ArrayBuffer>;
  saveReceivedFile: (fileName: string, data: Uint8Array) => Promise<string>;
  // Stream-based file writing
  initWriteStream: (fileName: string) => Promise<{streamId: string; finalPath: string}>;
  writeChunk: (streamId: string, chunk: Uint8Array) => Promise<void>;
  finalizeWriteStream: (streamId: string) => Promise<void>;
  cancelWriteStream: (streamId: string) => Promise<void>;
  // Settings
  getSetting: (key: string) => Promise<string | undefined>;
  setSetting: (key: string, value: string) => Promise<boolean>;
  getAllSettings: () => Promise<Record<string, string>>;
  // Compression
  compress7zip: (sourcePath: string, outputPath?: string) => Promise<{success: boolean; outputPath?: string; error?: string}>;
  compressNative: (sourcePath: string, outputPath?: string) => Promise<{success: boolean; outputPath?: string; error?: string}>;
  extract7zip: (archivePath: string, outputDir?: string) => Promise<{success: boolean; outputPath?: string; error?: string}>;
  extractNative: (archivePath: string, outputDir?: string) => Promise<{success: boolean; outputPath?: string; error?: string}>;
  isCompressedFile: (filePath: string) => Promise<boolean>;
}

export interface Profile {
  id: number;
  uuid: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransferQueueItem {
  id: number;
  filePath: string;
  addedAt: string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
