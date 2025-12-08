/**
 * Utility functions for file type detection and classification
 */

export const getFileExtension = (filename: string): string => {
    return filename.slice(filename.lastIndexOf('.')).toLowerCase();
};

/**
 * Format file size from bytes to human-readable format
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format date to localized string
 */
export const formatDate = (date: Date): string => {
    return new Date(date).toLocaleString();
};

export const IMAGE_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', 
    '.webp', '.svg', '.ico', '.tiff', '.tif'
];

export const VIDEO_EXTENSIONS = [
    '.mp4', '.webm', '.ogg', '.mov', '.avi', 
    '.mkv', '.m4v', '.mpeg', '.mpg', '.wmv', '.flv'
];

export const AUDIO_EXTENSIONS = [
    '.mp3', '.wav', '.ogg', '.m4a', '.aac', 
    '.flac', '.wma', '.opus'
];

export const TEXT_EXTENSIONS = [
    '.txt', '.md', '.json', '.xml', '.html', 
    '.css', '.js', '.ts', '.tsx', '.jsx', 
    '.py', '.java', '.c', '.cpp', '.h', '.log'
];

export const PDF_EXTENSION = '.pdf';

export const isImage = (filename: string): boolean => {
    return IMAGE_EXTENSIONS.includes(getFileExtension(filename));
};

export const isVideo = (filename: string): boolean => {
    return VIDEO_EXTENSIONS.includes(getFileExtension(filename));
};

export const isAudio = (filename: string): boolean => {
    return AUDIO_EXTENSIONS.includes(getFileExtension(filename));
};

export const isText = (filename: string): boolean => {
    return TEXT_EXTENSIONS.includes(getFileExtension(filename));
};

export const isPDF = (filename: string): boolean => {
    return getFileExtension(filename) === PDF_EXTENSION;
};

export const getFileType = (filename: string): 'image' | 'video' | 'audio' | 'text' | 'pdf' | 'other' => {
    if (isImage(filename)) return 'image';
    if (isVideo(filename)) return 'video';
    if (isAudio(filename)) return 'audio';
    if (isText(filename)) return 'text';
    if (isPDF(filename)) return 'pdf';
    return 'other';
};
