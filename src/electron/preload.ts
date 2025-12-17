import { contextBridge, ipcRenderer } from 'electron';
import { FileEntry } from './models/FileEntry';
import { DriveEntry } from './models/DriveEntry';

contextBridge.exposeInMainWorld('electronAPI', {
  getDrives: (): Promise<DriveEntry[]> => ipcRenderer.invoke('get-drives'),
  readDirectory: (path: string): Promise<FileEntry[]> => ipcRenderer.invoke('read-directory', path),
  getParentDirectory: (path: string): Promise<string | null> => ipcRenderer.invoke('get-parent-directory', path),
  getSpecialFolder: (folderName: string): Promise<string> => ipcRenderer.invoke('get-special-folder', folderName),
  copyPath: (path: string): Promise<boolean> => ipcRenderer.invoke('copy-path', path),
  hasCopiedPath: (): Promise<boolean> => ipcRenderer.invoke('has-copied-path'),
  pastePath: (destinationDir: string): Promise<boolean> => ipcRenderer.invoke('paste-path', destinationDir),
  openPath: (path: string): Promise<boolean> => ipcRenderer.invoke('open-path', path),
  deletePath: (path: string): Promise<boolean> => ipcRenderer.invoke('delete-path', path),
  convertVideo: (path: string, targetFormat: string): Promise<boolean> => ipcRenderer.invoke('convert-video', path, targetFormat),
  scaleVideo: (path: string, resolution: string): Promise<boolean> => ipcRenderer.invoke('scale-video', path, resolution),
  sharpenVideo: (path: string): Promise<boolean> => ipcRenderer.invoke('sharpen-video', path),
  getVideoDuration: (path: string): Promise<number> => ipcRenderer.invoke('get-video-duration', path),
  trimVideo: (path: string, startTime: number, endTime: number): Promise<boolean> => ipcRenderer.invoke('trim-video', path, startTime, endTime),
  renameFile: (path: string, newName: string): Promise<boolean> => ipcRenderer.invoke('rename-file', path, newName),
  convertImage: (path: string, targetFormat: string): Promise<boolean> => ipcRenderer.invoke('convert-image', path, targetFormat),
  sharpenImage: (path: string): Promise<boolean> => ipcRenderer.invoke('sharpen-image', path),
  compressImage: (path: string): Promise<boolean> => ipcRenderer.invoke('compress-image', path),
  getProfile: (): Promise<any> => ipcRenderer.invoke('get-profile'),
  updateProfile: (name: string): Promise<any> => ipcRenderer.invoke('update-profile', name),
  regenerateUUID: (): Promise<any> => ipcRenderer.invoke('regenerate-uuid'),
  getTransferQueue: (): Promise<any[]> => ipcRenderer.invoke('get-transfer-queue'),
  addToTransferQueue: (filePath: string): Promise<any> => ipcRenderer.invoke('add-to-transfer-queue', filePath),
  removeFromTransferQueue: (filePath: string): Promise<boolean> => ipcRenderer.invoke('remove-from-transfer-queue', filePath),
  clearTransferQueue: (): Promise<boolean> => ipcRenderer.invoke('clear-transfer-queue'),
  getFileInfo: (path: string): Promise<{fileName: string; fileSize: number}> => ipcRenderer.invoke('get-file-info', path),
  readFileChunk: (path: string, offset: number, length: number): Promise<ArrayBuffer> => ipcRenderer.invoke('read-file-chunk', path, offset, length),
  saveReceivedFile: (fileName: string, data: Uint8Array): Promise<string> => ipcRenderer.invoke('save-received-file', fileName, data),
  // Stream-based file writing
  initWriteStream: (fileName: string): Promise<{streamId: string; finalPath: string}> => ipcRenderer.invoke('init-write-stream', fileName),
  writeChunk: (streamId: string, chunk: Uint8Array): Promise<void> => ipcRenderer.invoke('write-chunk', streamId, chunk),
  finalizeWriteStream: (streamId: string): Promise<void> => ipcRenderer.invoke('finalize-write-stream', streamId),
  cancelWriteStream: (streamId: string): Promise<void> => ipcRenderer.invoke('cancel-write-stream', streamId),
  // Settings
  getSetting: (key: string): Promise<string | undefined> => ipcRenderer.invoke('get-setting', key),
  setSetting: (key: string, value: string): Promise<boolean> => ipcRenderer.invoke('set-setting', key, value),
  getAllSettings: (): Promise<Record<string, string>> => ipcRenderer.invoke('get-all-settings'),
  // Compression
  compress7zip: (sourcePath: string, outputPath?: string): Promise<{success: boolean; outputPath?: string; error?: string}> => ipcRenderer.invoke('compress-7zip', sourcePath, outputPath),
  compressNative: (sourcePath: string, outputPath?: string): Promise<{success: boolean; outputPath?: string; error?: string}> => ipcRenderer.invoke('compress-native', sourcePath, outputPath),
  extract7zip: (archivePath: string, outputDir?: string): Promise<{success: boolean; outputPath?: string; error?: string}> => ipcRenderer.invoke('extract-7zip', archivePath, outputDir),
  extractNative: (archivePath: string, outputDir?: string): Promise<{success: boolean; outputPath?: string; error?: string}> => ipcRenderer.invoke('extract-native', archivePath, outputDir),
  isCompressedFile: (filePath: string): Promise<boolean> => ipcRenderer.invoke('is-compressed-file', filePath),
});
