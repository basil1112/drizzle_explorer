import { contextBridge, ipcRenderer } from 'electron';
import { FileEntry } from '../models/FileEntry';
import { DriveEntry } from '../models/DriveEntry';

contextBridge.exposeInMainWorld('electronAPI', {
  getDrives: (): Promise<DriveEntry[]> => ipcRenderer.invoke('get-drives'),
  readDirectory: (path: string): Promise<FileEntry[]> => ipcRenderer.invoke('read-directory', path),
  getParentDirectory: (path: string): Promise<string | null> => ipcRenderer.invoke('get-parent-directory', path),
});
