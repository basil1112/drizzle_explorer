import { contextBridge, ipcRenderer } from 'electron';
import { FileEntry } from '../electron/models/FileEntry';
import { DriveEntry } from '../electron/models/DriveEntry';

contextBridge.exposeInMainWorld('electronAPI', {
  getDrives: (): Promise<DriveEntry[]> => ipcRenderer.invoke('get-drives'),
  readDirectory: (path: string): Promise<FileEntry[]> => ipcRenderer.invoke('read-directory', path),
  getParentDirectory: (path: string): Promise<string | null> => ipcRenderer.invoke('get-parent-directory', path),
  copyPath: (path: string): Promise<boolean> => ipcRenderer.invoke('copy-path', path),
  hasCopiedPath: (): Promise<boolean> => ipcRenderer.invoke('has-copied-path'),
  pastePath: (destinationDir: string): Promise<boolean> => ipcRenderer.invoke('paste-path', destinationDir),
  openPath: (path: string): Promise<boolean> => ipcRenderer.invoke('open-path', path),
});
