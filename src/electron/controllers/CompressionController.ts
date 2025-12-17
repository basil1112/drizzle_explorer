import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

export class CompressionController {
    /**
     * Check if a file is a compressed archive
     */
    isCompressedFile(filePath: string): boolean {
        const ext = path.extname(filePath).toLowerCase();
        return ['.zip', '.7z', '.rar', '.tar', '.gz', '.bz2', '.xz', '.tgz', '.tbz2'].includes(ext);
    }

    /**
     * Compress using 7zip-min (cross-platform)
     */
    async compress7zip(sourcePath: string, outputPath?: string): Promise<string> {
        try {
            const sevenZip = require('7zip-min');
            const stats = await fs.promises.stat(sourcePath);
            const isDirectory = stats.isDirectory();
            
            // Default output path if not provided
            if (!outputPath) {
                const baseName = path.basename(sourcePath);
                const parentDir = path.dirname(sourcePath);
                outputPath = path.join(parentDir, `${baseName}.7z`);
            }

            return new Promise((resolve, reject) => {
                sevenZip.pack(sourcePath, outputPath, (err: Error) => {
                    if (err) {
                        console.error('7zip compression error:', err);
                        reject(err);
                    } else {
                        console.log('7zip compression successful:', outputPath);
                        resolve(outputPath);
                    }
                });
            });
        } catch (error) {
            console.error('Error in compress7zip:', error);
            throw error;
        }
    }

    /**
     * Compress using native OS methods
     */
    async compressNative(sourcePath: string, outputPath?: string): Promise<string> {
        try {
            const stats = await fs.promises.stat(sourcePath);
            const isDirectory = stats.isDirectory();
            const baseName = path.basename(sourcePath);
            const parentDir = path.dirname(sourcePath);
            
            // Default output path if not provided
            if (!outputPath) {
                outputPath = path.join(parentDir, `${baseName}.zip`);
            }

            if (process.platform === 'win32') {
                // Windows: Use PowerShell Compress-Archive
                const psCommand = `Compress-Archive -Path "${sourcePath}" -DestinationPath "${outputPath}" -Force`;
                await execAsync(`powershell -Command "${psCommand}"`);
                console.log('Windows native compression successful');
            } else if (process.platform === 'darwin') {
                // macOS: Use ditto or zip
                const command = `cd "${parentDir}" && zip -r "${path.basename(outputPath)}" "${baseName}"`;
                await execAsync(command);
                console.log('macOS native compression successful');
            } else {
                // Linux: Use zip
                const command = `cd "${parentDir}" && zip -r "${path.basename(outputPath)}" "${baseName}"`;
                await execAsync(command);
                console.log('Linux native compression successful');
            }

            return outputPath;
        } catch (error: any) {
            console.error('Native compression error:', error);
            throw new Error(`Native compression failed: ${error.message}`);
        }
    }

    /**
     * Extract using 7zip-min (cross-platform)
     */
    async extract7zip(archivePath: string, outputDir?: string): Promise<string> {
        try {
            const sevenZip = require('7zip-min');
            
            // Default output directory if not provided
            if (!outputDir) {
                const baseName = path.basename(archivePath, path.extname(archivePath));
                const parentDir = path.dirname(archivePath);
                outputDir = path.join(parentDir, baseName);
            }

            // Create output directory if it doesn't exist
            await fs.promises.mkdir(outputDir, { recursive: true });

            return new Promise((resolve, reject) => {
                sevenZip.unpack(archivePath, outputDir, (err: Error) => {
                    if (err) {
                        console.error('7zip extraction error:', err);
                        reject(err);
                    } else {
                        console.log('7zip extraction successful:', outputDir);
                        resolve(outputDir);
                    }
                });
            });
        } catch (error) {
            console.error('Error in extract7zip:', error);
            throw error;
        }
    }

    /**
     * Extract using native OS methods
     */
    async extractNative(archivePath: string, outputDir?: string): Promise<string> {
        try {
            const baseName = path.basename(archivePath, path.extname(archivePath));
            const parentDir = path.dirname(archivePath);
            
            // Default output directory if not provided
            if (!outputDir) {
                outputDir = path.join(parentDir, baseName);
            }

            // Create output directory if it doesn't exist
            await fs.promises.mkdir(outputDir, { recursive: true });

            const ext = path.extname(archivePath).toLowerCase();

            if (process.platform === 'win32') {
                // Windows: Use PowerShell Expand-Archive for .zip
                if (ext === '.zip') {
                    const psCommand = `Expand-Archive -Path "${archivePath}" -DestinationPath "${outputDir}" -Force`;
                    await execAsync(`powershell -Command "${psCommand}"`);
                    console.log('Windows native extraction successful');
                } else {
                    throw new Error('Windows native extraction only supports .zip files');
                }
            } else if (process.platform === 'darwin') {
                // macOS: Use unzip or tar
                if (ext === '.zip') {
                    await execAsync(`unzip -o "${archivePath}" -d "${outputDir}"`);
                } else if (['.tar', '.gz', '.tgz', '.bz2', '.tbz2', '.xz'].includes(ext)) {
                    await execAsync(`tar -xf "${archivePath}" -C "${outputDir}"`);
                } else {
                    throw new Error(`Unsupported archive format for macOS: ${ext}`);
                }
                console.log('macOS native extraction successful');
            } else {
                // Linux: Use unzip or tar
                if (ext === '.zip') {
                    await execAsync(`unzip -o "${archivePath}" -d "${outputDir}"`);
                } else if (['.tar', '.gz', '.tgz', '.bz2', '.tbz2', '.xz'].includes(ext)) {
                    await execAsync(`tar -xf "${archivePath}" -C "${outputDir}"`);
                } else {
                    throw new Error(`Unsupported archive format for Linux: ${ext}`);
                }
                console.log('Linux native extraction successful');
            }

            return outputDir;
        } catch (error: any) {
            console.error('Native extraction error:', error);
            throw new Error(`Native extraction failed: ${error.message}`);
        }
    }
}
