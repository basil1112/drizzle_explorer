import SimplePeer from 'simple-peer';

export interface TransferProgress {
    fileName: string;
    fileSize: number;
    bytesTransferred: number;
    percentage: number;
    status: 'waiting' | 'connecting' | 'transferring' | 'completed' | 'error' | 'cancelled';
    error?: string;
    speed?: number; // bytes per second
    savedPath?: string; // Path where file was saved (for receiver)
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
    private onErrorCallback?: (error: string) => void;
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
            console.log('Signal generated:', signal.type || 'candidate');
            if (this.onSignalCallback) {
                this.onSignalCallback(signal);
            }
        });

        this.peer.on('connect', () => {
            console.log('✅ WebRTC connection established successfully!');
            if (this.onConnectionCallback) {
                this.onConnectionCallback(true);
            }
        });

        this.peer.on('close', () => {
            console.log('⚠️ WebRTC connection closed');
            if (this.onConnectionCallback) {
                this.onConnectionCallback(false);
            }
        });

        this.peer.on('error', (err) => {
            console.error('❌ WebRTC error:', err);
            const errorMsg = err.message || err.toString();
            
            if (this.onErrorCallback) {
                this.onErrorCallback(errorMsg);
            }
            
            if (this.currentTransfer) {
                this.updateProgress({
                    ...this.currentTransfer,
                    status: 'error',
                    error: errorMsg
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

    public setOnError(callback: (error: string) => void) {
        this.onErrorCallback = callback;
    }

    public signal(signalData: any) {
        if (this.peer) {
            console.log('Receiving signal:', signalData.type || 'unknown');
            try {
                this.peer.signal(signalData);
            } catch (error: any) {
                console.error('Failed to process signal:', error);
                if (this.onErrorCallback) {
                    this.onErrorCallback(`Signal error: ${error.message}`);
                }
            }
        }
    }

    public async sendFile(filePath: string): Promise<void> {
        if (!this.peer || !this.peer.connected) {
            throw new Error('Peer not connected');
        }

        this.transferCancelled = false;

        try {
            // Get file info first (don't load entire file)
            const { fileName, fileSize } = await window.electronAPI.getFileInfo(filePath);

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

            // Send file in chunks by reading from disk as needed
            const startTime = Date.now();
            let bytesTransferred = 0;

            for (let offset = 0; offset < fileSize; offset += CHUNK_SIZE) {
                if (this.transferCancelled) {
                    this.peer.send(JSON.stringify({ type: 'cancel' }));
                    throw new Error('Transfer cancelled');
                }

                // Read chunk from disk (on-demand, memory efficient)
                const chunkSize = Math.min(CHUNK_SIZE, fileSize - offset);
                const chunk = await window.electronAPI.readFileChunk(filePath, offset, chunkSize);
                
                // Wait for buffer to drain if it's getting full (backpressure)
                const peerAny = this.peer as any;
                while (peerAny._channel && peerAny._channel.bufferedAmount > CHUNK_SIZE * 4) {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
                
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

    private receivedMetadata: { fileName: string; fileSize: number } | null = null;
    private receivedBytes: number = 0;
    private writeStreamId: string | null = null;
    private writeStreamPath: string | null = null;

    private async handleIncomingData(data: any) {
        console.log('📥 Received data:', typeof data, data instanceof ArrayBuffer ? `ArrayBuffer(${data.byteLength} bytes)` : data instanceof Uint8Array ? `Uint8Array(${data.length} bytes)` : 'object/string');
        
        // Try to parse as JSON (metadata or control message)
        if (typeof data === 'string') {
            try {
                const message = JSON.parse(data);
                console.log('📋 Parsed message from string:', message);
                await this.handleControlMessage(message);
                return;
            } catch (e) {
                console.warn('⚠️ Failed to parse string as JSON:', e);
            }
        } else if (typeof data === 'object' && !ArrayBuffer.isView(data) && !(data instanceof ArrayBuffer)) {
            // Data is already a parsed object (simple-peer sometimes does this)
            console.log('📋 Received object directly:', data);
            await this.handleControlMessage(data);
            return;
        } else if (data instanceof Uint8Array || data instanceof ArrayBuffer) {
            // Could be either text (JSON) or binary chunk
            // Try to decode as text first
            try {
                const uint8Array = data instanceof Uint8Array ? data : new Uint8Array(data);
                const text = new TextDecoder().decode(uint8Array);
                const message = JSON.parse(text);
                
                // If it parses successfully and has a type field, it's a control message
                if (message.type) {
                    console.log('📋 Decoded message from Uint8Array:', message);
                    await this.handleControlMessage(message);
                    return;
                }
            } catch (e) {
                // Not JSON, treat as binary chunk
            }
            
            // Binary data chunk
            if (this.receivedMetadata && this.writeStreamId) {
                const chunk = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
                
                // Write chunk directly to disk via stream
                await window.electronAPI.writeChunk(this.writeStreamId, chunk);
                
                this.receivedBytes += chunk.length;

                const percentage = (this.receivedBytes / this.receivedMetadata.fileSize) * 100;
                console.log(`📦 Chunk written to disk: ${this.receivedBytes}/${this.receivedMetadata.fileSize} (${percentage.toFixed(1)}%)`);

                this.currentTransfer = {
                    fileName: this.receivedMetadata.fileName,
                    fileSize: this.receivedMetadata.fileSize,
                    bytesTransferred: this.receivedBytes,
                    percentage: percentage,
                    status: 'transferring'
                };
                this.updateProgress(this.currentTransfer);
            } else {
                console.warn('⚠️ Received chunk but no metadata or stream yet!');
            }
        }
    }

    private async handleControlMessage(message: any) {
        if (message.type === 'metadata') {
            console.log('📄 Receiving file metadata:', message.fileName, `(${message.fileSize} bytes)`);
            this.receivedMetadata = {
                fileName: message.fileName,
                fileSize: message.fileSize
            };
            this.receivedBytes = 0;

            // Initialize write stream
            try {
                const { streamId, finalPath } = await window.electronAPI.initWriteStream(message.fileName);
                this.writeStreamId = streamId;
                this.writeStreamPath = finalPath;
                console.log('✅ Write stream initialized:', streamId, 'Path:', finalPath);
            } catch (error: any) {
                console.error('❌ Failed to initialize write stream:', error);
                if (this.currentTransfer) {
                    this.currentTransfer = {
                        ...this.currentTransfer,
                        status: 'error',
                        error: `Failed to initialize write stream: ${error.message}`
                    };
                    this.updateProgress(this.currentTransfer);
                }
                return;
            }

            this.currentTransfer = {
                fileName: message.fileName,
                fileSize: message.fileSize,
                bytesTransferred: 0,
                percentage: 0,
                status: 'transferring'
            };
            this.updateProgress(this.currentTransfer);
            console.log('✅ Ready to receive chunks');
        } else if (message.type === 'complete') {
            console.log('🏁 Received completion signal, finalizing file...');
            await this.finalizeReceivedFile();
        } else if (message.type === 'cancel') {
            if (this.writeStreamId) {
                await window.electronAPI.cancelWriteStream(this.writeStreamId);
                this.writeStreamId = null;
                this.writeStreamPath = null;
            }
            if (this.currentTransfer) {
                this.currentTransfer = {
                    ...this.currentTransfer,
                    status: 'cancelled'
                };
                this.updateProgress(this.currentTransfer);
            }
            this.receivedMetadata = null;
            this.receivedBytes = 0;
        }
    }

    private async finalizeReceivedFile() {
        console.log('💾 finalizeReceivedFile called');
        
        if (!this.receivedMetadata || !this.writeStreamId) {
            console.error('❌ Cannot finalize: missing metadata or stream', {
                hasMetadata: !!this.receivedMetadata,
                hasStream: !!this.writeStreamId
            });
            return;
        }

        try {
            console.log('🔧 Finalizing write stream:', this.writeStreamId);
            
            // Finalize the stream
            await window.electronAPI.finalizeWriteStream(this.writeStreamId);
            
            console.log('✅ File saved successfully:', this.writeStreamPath);

            if (this.currentTransfer) {
                this.currentTransfer = {
                    ...this.currentTransfer,
                    status: 'completed',
                    percentage: 100,
                    savedPath: this.writeStreamPath || undefined
                };
                this.updateProgress(this.currentTransfer);
            }

            // Clean up
            this.writeStreamId = null;
            this.writeStreamPath = null;
            this.receivedMetadata = null;
            this.receivedBytes = 0;

        } catch (error: any) {
            console.error('❌ Error finalizing file:', error);
            if (this.currentTransfer) {
                this.currentTransfer = {
                    ...this.currentTransfer,
                    status: 'error',
                    error: error.message
                };
                this.updateProgress(this.currentTransfer);
            }
        }
    }

    private updateProgress(progress: TransferProgress) {
        if (this.onProgressCallback) {
            this.onProgressCallback(progress);
        }
    }

    public async cancelTransfer() {
        this.transferCancelled = true;
        
        // Cancel write stream if active
        if (this.writeStreamId) {
            try {
                await window.electronAPI.cancelWriteStream(this.writeStreamId);
            } catch (error) {
                console.error('Error canceling write stream:', error);
            }
            this.writeStreamId = null;
            this.writeStreamPath = null;
        }
        
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
        
        // Cancel any active stream
        if (this.writeStreamId) {
            window.electronAPI.cancelWriteStream(this.writeStreamId).catch(console.error);
            this.writeStreamId = null;
            this.writeStreamPath = null;
        }
    }

    public isConnected(): boolean {
        return this.peer?.connected || false;
    }
}
