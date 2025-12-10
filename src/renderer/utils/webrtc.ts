import SimplePeer from 'simple-peer';

export interface TransferProgress {
    fileName: string;
    fileSize: number;
    bytesTransferred: number;
    percentage: number;
    status: 'waiting' | 'connecting' | 'transferring' | 'completed' | 'error' | 'cancelled';
    error?: string;
    speed?: number; // bytes per second
}

export interface PeerConnection {
    peer: SimplePeer.Instance;
    isInitiator: boolean;
    remoteUUID?: string;
}

const CHUNK_SIZE = 64 * 1024; // 64KB chunks
const STUN_SERVERS = [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302',
    'stun:stun2.l.google.com:19302',
];

export class WebRTCFileTransfer {
    private peer: SimplePeer.Instance | null = null;
    private onProgressCallback?: (progress: TransferProgress) => void;
    private onSignalCallback?: (signal: any) => void;
    private onConnectionCallback?: (connected: boolean) => void;
    private transferCancelled: boolean = false;
    private currentTransfer: TransferProgress | null = null;

    constructor(isInitiator: boolean) {
        this.initPeer(isInitiator);
    }

    private initPeer(isInitiator: boolean) {
        this.peer = new SimplePeer({
            initiator: isInitiator,
            trickle: false, // Disable trickle ICE for simpler manual signaling
            config: {
                iceServers: STUN_SERVERS.map(url => ({ urls: url }))
            }
        });

        this.peer.on('signal', (signal) => {
            if (this.onSignalCallback) {
                this.onSignalCallback(signal);
            }
        });

        this.peer.on('connect', () => {
            console.log('WebRTC connection established');
            if (this.onConnectionCallback) {
                this.onConnectionCallback(true);
            }
        });

        this.peer.on('close', () => {
            console.log('WebRTC connection closed');
            if (this.onConnectionCallback) {
                this.onConnectionCallback(false);
            }
        });

        this.peer.on('error', (err) => {
            console.error('WebRTC error:', err);
            if (this.currentTransfer) {
                this.updateProgress({
                    ...this.currentTransfer,
                    status: 'error',
                    error: err.message
                });
            }
        });

        this.peer.on('data', (data) => {
            this.handleIncomingData(data);
        });
    }

    public setOnSignal(callback: (signal: any) => void) {
        this.onSignalCallback = callback;
    }

    public setOnProgress(callback: (progress: TransferProgress) => void) {
        this.onProgressCallback = callback;
    }

    public setOnConnection(callback: (connected: boolean) => void) {
        this.onConnectionCallback = callback;
    }

    public signal(signalData: any) {
        if (this.peer) {
            this.peer.signal(signalData);
        }
    }

    public async sendFile(filePath: string): Promise<void> {
        if (!this.peer || !this.peer.connected) {
            throw new Error('Peer not connected');
        }

        this.transferCancelled = false;

        try {
            // Read file using Electron API
            const fileBuffer = await window.electronAPI.readFileForTransfer(filePath);
            const fileName = filePath.split(/[\\/]/).pop() || 'unknown';
            const fileSize = fileBuffer.byteLength;

            // Initialize progress
            this.currentTransfer = {
                fileName,
                fileSize,
                bytesTransferred: 0,
                percentage: 0,
                status: 'transferring'
            };
            this.updateProgress(this.currentTransfer);

            // Send file metadata
            const metadata = JSON.stringify({
                type: 'metadata',
                fileName,
                fileSize
            });
            this.peer.send(metadata);

            // Send file in chunks
            const startTime = Date.now();
            let bytesTransferred = 0;

            for (let offset = 0; offset < fileSize; offset += CHUNK_SIZE) {
                if (this.transferCancelled) {
                    this.peer.send(JSON.stringify({ type: 'cancel' }));
                    throw new Error('Transfer cancelled');
                }

                const chunk = fileBuffer.slice(offset, Math.min(offset + CHUNK_SIZE, fileSize));
                this.peer.send(chunk);

                bytesTransferred += chunk.byteLength;
                const elapsedSeconds = (Date.now() - startTime) / 1000;
                const speed = elapsedSeconds > 0 ? bytesTransferred / elapsedSeconds : 0;

                this.currentTransfer = {
                    fileName,
                    fileSize,
                    bytesTransferred,
                    percentage: (bytesTransferred / fileSize) * 100,
                    status: 'transferring',
                    speed
                };
                this.updateProgress(this.currentTransfer);

                // Small delay to prevent blocking
                await new Promise(resolve => setTimeout(resolve, 0));
            }

            // Send completion signal
            this.peer.send(JSON.stringify({ type: 'complete' }));

            this.currentTransfer = {
                ...this.currentTransfer,
                status: 'completed',
                percentage: 100
            };
            this.updateProgress(this.currentTransfer);

        } catch (error: any) {
            if (this.currentTransfer) {
                this.currentTransfer = {
                    ...this.currentTransfer,
                    status: 'error',
                    error: error.message
                };
                this.updateProgress(this.currentTransfer);
            }
            throw error;
        }
    }

    private receivedChunks: Uint8Array[] = [];
    private receivedMetadata: { fileName: string; fileSize: number } | null = null;
    private receivedBytes: number = 0;

    private handleIncomingData(data: any) {
        // Try to parse as JSON (metadata or control message)
        if (typeof data === 'string' || data instanceof String) {
            try {
                const message = JSON.parse(data as string);
                
                if (message.type === 'metadata') {
                    this.receivedMetadata = {
                        fileName: message.fileName,
                        fileSize: message.fileSize
                    };
                    this.receivedChunks = [];
                    this.receivedBytes = 0;

                    this.currentTransfer = {
                        fileName: message.fileName,
                        fileSize: message.fileSize,
                        bytesTransferred: 0,
                        percentage: 0,
                        status: 'transferring'
                    };
                    this.updateProgress(this.currentTransfer);
                } else if (message.type === 'complete') {
                    this.saveReceivedFile();
                } else if (message.type === 'cancel') {
                    if (this.currentTransfer) {
                        this.currentTransfer = {
                            ...this.currentTransfer,
                            status: 'cancelled'
                        };
                        this.updateProgress(this.currentTransfer);
                    }
                    this.receivedChunks = [];
                    this.receivedMetadata = null;
                    this.receivedBytes = 0;
                }
            } catch (e) {
                // Not JSON, ignore
            }
        } else {
            // Binary data chunk
            if (this.receivedMetadata) {
                const chunk = new Uint8Array(data);
                this.receivedChunks.push(chunk);
                this.receivedBytes += chunk.length;

                this.currentTransfer = {
                    fileName: this.receivedMetadata.fileName,
                    fileSize: this.receivedMetadata.fileSize,
                    bytesTransferred: this.receivedBytes,
                    percentage: (this.receivedBytes / this.receivedMetadata.fileSize) * 100,
                    status: 'transferring'
                };
                this.updateProgress(this.currentTransfer);
            }
        }
    }

    private async saveReceivedFile() {
        if (!this.receivedMetadata || this.receivedChunks.length === 0) {
            return;
        }

        try {
            // Combine chunks
            const totalSize = this.receivedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
            const fileBuffer = new Uint8Array(totalSize);
            let offset = 0;
            for (const chunk of this.receivedChunks) {
                fileBuffer.set(chunk, offset);
                offset += chunk.length;
            }

            // Save file using Electron API
            await window.electronAPI.saveReceivedFile(
                this.receivedMetadata.fileName,
                fileBuffer
            );

            if (this.currentTransfer) {
                this.currentTransfer = {
                    ...this.currentTransfer,
                    status: 'completed',
                    percentage: 100
                };
                this.updateProgress(this.currentTransfer);
            }
        } catch (error: any) {
            if (this.currentTransfer) {
                this.currentTransfer = {
                    ...this.currentTransfer,
                    status: 'error',
                    error: error.message
                };
                this.updateProgress(this.currentTransfer);
            }
        } finally {
            this.receivedChunks = [];
            this.receivedMetadata = null;
            this.receivedBytes = 0;
        }
    }

    private updateProgress(progress: TransferProgress) {
        if (this.onProgressCallback) {
            this.onProgressCallback(progress);
        }
    }

    public cancelTransfer() {
        this.transferCancelled = true;
        if (this.currentTransfer) {
            this.currentTransfer = {
                ...this.currentTransfer,
                status: 'cancelled'
            };
            this.updateProgress(this.currentTransfer);
        }
    }

    public destroy() {
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
    }

    public isConnected(): boolean {
        return this.peer?.connected || false;
    }
}
