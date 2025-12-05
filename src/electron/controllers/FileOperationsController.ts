import * as fs from 'fs';
import * as path from 'path';

export class FileOperationsController {
    private copiedPath: string | null = null;

    /**
     * Copy file or directory path to clipboard
     */
    copyPath(filePath: string): void {
        this.copiedPath = filePath;
    }

    /**
     * Get copied path
     */
    getCopiedPath(): string | null {
        return this.copiedPath;
    }

    /**
     * Check if there's something copied
     */
    hasCopiedPath(): boolean {
        return this.copiedPath !== null;
    }

    /**
     * Native file copy using kernel-level operations
     */
    async copyFile(src: string, dst: string): Promise<boolean> {
        try {
            if (process.platform === 'win32') {
                // Use native Windows copy with better performance
                return await this.copyFileWindows(src, dst);
            } else {
                // Use Node.js fs.promises.copyFile for Unix-based systems
                return await this.copyFileUnix(src, dst);
            }
        } catch (error) {
            console.error('Error copying file:', error);
            return false;
        }
    }

    /**
     * Windows-specific file copy using native API
     */
    private async copyFileWindows(src: string, dst: string): Promise<boolean> {
        try {
            const win32 = require('win32-api');
            const { Kernel32 } = win32;

            console.log('Loading Kernel32 functions...');

            // You need to LOAD the functions first
            const kernel32 = Kernel32.load([
                'CopyFileExW',
                'CopyFileW',
                'GetLastError'
            ]);

            console.log('Loaded Kernel32 functions:', Object.keys(kernel32));

            // Now you can use the functions
            const srcPath = src.replace(/\//g, '\\');
            const dstPath = dst.replace(/\//g, '\\');

            // Try CopyFileExW first
            if (kernel32.CopyFileExW) {
                console.log('Using CopyFileExW...');

                const COPY_FILE_FAIL_IF_EXISTS = 0x00000001;

                const result = kernel32.CopyFileExW(
                    srcPath,
                    dstPath,
                    null,  // lpProgressRoutine
                    null,  // lpData
                    null,  // pbCancel
                    COPY_FILE_FAIL_IF_EXISTS
                );

                if (result) {
                    console.log('✅ CopyFileExW succeeded');
                    return true;
                } else {
                    const errorCode = kernel32.GetLastError();
                    console.warn(`CopyFileExW failed with error: ${errorCode}`);
                }
            }

            // Fallback to CopyFileW
            if (kernel32.CopyFileW) {
                console.log('Trying CopyFileW...');

                const result = kernel32.CopyFileW(
                    srcPath,
                    dstPath,
                    true  // bFailIfExists
                );

                if (result) {
                    console.log('✅ CopyFileW succeeded');
                    return true;
                } else {
                    const errorCode = kernel32.GetLastError();
                    console.warn(`CopyFileW failed with error: ${errorCode}`);
                    throw new Error(`Windows API error: ${errorCode}`);
                }
            }

            throw new Error('No copy functions loaded');

        } catch (apiError: any) {
            console.log('❌ Windows API failed:', apiError.message);

            // Fallback to Node.js
            const fs = require('fs/promises');
            await fs.copyFile(src, dst);
            console.log('✅ Fallback to fs.copyFile successful');
            return true;
        }
    }

    /**
     * Unix-specific file copy
     */
    private async copyFileUnix(src: string, dst: string): Promise<boolean> {
        try {
            await fs.promises.copyFile(src, dst);
            return true;
        } catch (error) {
            console.error('Unix copy error:', error);
            return false;
        }
    }

    /**
     * Copy directory recursively
     */
    async copyDirectory(src: string, dst: string): Promise<boolean> {
        try {
            await fs.promises.mkdir(dst, { recursive: true });
            const entries = await fs.promises.readdir(src, { withFileTypes: true });

            for (const entry of entries) {
                const srcPath = path.join(src, entry.name);
                const dstPath = path.join(dst, entry.name);

                if (entry.isDirectory()) {
                    await this.copyDirectory(srcPath, dstPath);
                } else {
                    await this.copyFile(srcPath, dstPath);
                }
            }

            return true;
        } catch (error) {
            console.error('Error copying directory:', error);
            return false;
        }
    }

    /**
     * Paste the copied file or directory
     */
    async paste(destinationDir: string): Promise<boolean> {
        if (!this.copiedPath) {
            console.log('No copied path');
            return false;
        }

        try {
            console.log('Pasting from:', this.copiedPath, 'to:', destinationDir);
            const stats = await fs.promises.stat(this.copiedPath);
            const fileName = path.basename(this.copiedPath);
            let destination = path.join(destinationDir, fileName);

            // Check if destination already exists
            if (fs.existsSync(destination)) {
                // Generate a unique name
                const ext = path.extname(fileName);
                const base = path.basename(fileName, ext);
                let counter = 1;

                while (fs.existsSync(destination)) {
                    destination = path.join(destinationDir, `${base} (${counter})${ext}`);
                    counter++;
                }
                console.log('File exists, using new name:', destination);
            }

            let result: boolean;
            if (stats.isDirectory()) {
                console.log('Copying directory');
                result = await this.copyDirectory(this.copiedPath, destination);
            } else {
                console.log('Copying file');
                result = await this.copyFile(this.copiedPath, destination);
            }

            console.log('Paste result:', result);
            return result;
        } catch (error) {
            console.error('Error pasting:', error);
            return false;
        }
    }

    /**
     * Delete file or directory using SHFileOperationW (Windows) or fs.rm (Unix)
     */
    async deletePath(filePath: string): Promise<boolean> {
        try {
            if (process.platform === 'win32') {
                return await this.deletePathWindows(filePath);
            } else {
                return await this.deletePathUnix(filePath);
            }
        } catch (error) {
            console.error('Error deleting:', error);
            return false;
        }
    }

    /**
     * Windows-specific delete using recycle bin
     */
    private async deletePathWindows(filePath: string): Promise<boolean> {
        try {
            // Use Electron shell.trashItem for recycle bin (uses SHFileOperationW)
            try {
                const { shell } = require('electron');

                // shell.trashItem uses Windows SHFileOperationW with FOF_ALLOWUNDO
                await shell.trashItem(filePath);
                console.log('Moved to recycle bin using shell.trashItem');
                return true;
            } catch (trashError) {
                // Fallback to fs.rm if trash fails
                console.log('Trash failed, using fs.rm:', trashError);
                await fs.promises.rm(filePath, { recursive: true, force: true });
                return true;
            }
        } catch (error) {
            console.error('Windows delete error:', error);
            return false;
        }
    }

    /**
     * Unix-specific delete
     */
    private async deletePathUnix(filePath: string): Promise<boolean> {
        try {
            await fs.promises.rm(filePath, { recursive: true, force: true });
            return true;
        } catch (error) {
            console.error('Unix delete error:', error);
            return false;
        }
    }

    /**
     * Open file or directory with default application
     */
    async openPath(filePath: string): Promise<void> {
        try {
            if (process.platform === 'win32') {
                await this.openPathWindows(filePath);
            } else {
                await this.openPathUnix(filePath);
            }
        } catch (error) {
            console.error('Error opening path:', error);
        }
    }

    /**
     * Windows-specific open using native API
     */
    private async openPathWindows(filePath: string): Promise<void> {
        try {
            // Use Electron shell.openPath (uses ShellExecuteW internally)
            const { shell } = require('electron');
            const result = await shell.openPath(filePath);

            if (result) {
                console.warn('Shell open returned error:', result);
            } else {
                console.log('Opened with electron shell (uses ShellExecuteW)');
            }
        } catch (error) {
            console.error('Windows open error:', error);
            throw error;
        }
    }

    /**
     * Unix-specific open using electron shell
     */
    private async openPathUnix(filePath: string): Promise<void> {
        try {
            const { shell } = require('electron');
            await shell.openPath(filePath);
        } catch (error) {
            console.error('Unix open error:', error);
            throw error;
        }
    }
}
