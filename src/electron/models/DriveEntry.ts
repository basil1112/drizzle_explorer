export interface DriveEntry {
  path: string;
  name: string;
  type: 'drive';
  letter?: string;
  total?: string;
  totalBytes?: number;
  free?: string;
  freeBytes?: number;
  used?: string;
  usedBytes?: number;
  percentage?: number;
}
