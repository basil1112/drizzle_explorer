// WebRTC Worker Manager - Communication layer with native WebRTC worker
import { TransferProgress } from './webrtc';

export class NativeWebRTCWorker {
    private worker: Worker | null = null;
    private onSignalCallback: ((signal: any) => void) | null = null;
    private onProgressCallback: ((progress: TransferProgress) => void) | null = null;
    private onConnectionCallback: ((connected: boolean) => void) | null = null;
    private onErrorCallback: ((error: string) => void) | null = null;
    private pendingCandidates: any[] = [];
    private remoteDescriptionSet = false;

    constructor(isInitiator: boolean) {
        console.log(`🔧 NativeWebRTCWorker: Creating worker (${isInitiator ? 'INITIATOR' : 'RECEIVER'})`);
        
        this.worker = new Worker(
            new URL('../workers/webrtc.worker.ts', import.meta.url)
        );

        this.worker.onmessage = (e: MessageEvent) => {
            this.handleWorkerMessage(e.data);
        };

        this.worker.onerror = (error) => {
            console.error('❌ NativeWebRTCWorker: Worker error', error);
            this.onErrorCallback?.(`Worker error: ${error.message}`);
        };

        // Initialize peer in worker
        this.postMessage({ type: 'init', data: { isInitiator } });
    }

    private postMessage(message: any) {
        if (!this.worker) {
            console.error('❌ NativeWebRTCWorker: Worker not initialized');
            return;
        }
        this.worker.postMessage(message);
    }

    private async handleWorkerMessage(message: any) {
        const { type, data } = message;

        switch (type) {
            case 'candidate':
                // ICE candidate generated
                this.onSignalCallback?.({ candidate: data });
                break;

            case 'signal-complete':
                // All ICE candidates gathered, send complete SDP
                this.onSignalCallback?.(data);
                break;

            case 'connection-state':
                console.log(`🔌 Connection state: ${data}`);
                break;

            case 'connected':
                this.onConnectionCallback?.(data);
                break;

            case 'data-channel-open':
                console.log('✅ Data channel opened');
                break;

            case 'data-channel-close':
                console.log('🔌 Data channel closed');
                break;

            case 'progress':
                const progress = data as TransferProgress;
                this.onProgressCallback?.(progress);
                break;

            case 'save-file':
                // Receiver needs to save file
                await this.handleFileSave(data.fileName, data.fileData);
                break;

            case 'buffer-low':
                // Buffer is low, can send more data
                break;

            case 'error':
                this.onErrorCallback?.(data);
                break;
        }
    }

    private async handleFileSave(fileName: string, fileData: Uint8Array) {
        try {
            console.log(`💾 Saving file: ${fileName}`);
            const savedPath = await window.electronAPI.saveReceivedFile(fileName, fileData);
            
            this.onProgressCallback?.({
                fileName,
                fileSize: fileData.byteLength,
                bytesTransferred: fileData.byteLength,
                percentage: 100,
                status: 'completed',
                savedPath
            });
        } catch (error: any) {
            console.error('❌ File save error:', error);
            this.onErrorCallback?.(`File save error: ${error.message}`);
        }
    }

    // Public API
    setOnSignal(callback: (signal: any) => void) {
        this.onSignalCallback = callback;
    }

    setOnProgress(callback: (progress: TransferProgress) => void) {
        this.onProgressCallback = callback;
    }

    setOnConnection(callback: (connected: boolean) => void) {
        this.onConnectionCallback = callback;
    }

    setOnError(callback: (error: string) => void) {
        this.onErrorCallback = callback;
    }

    signal(signalData: any) {
        console.log('📡 Signaling to worker:', signalData.type || signalData.sdp?.type || 'candidate');
        
        // Send signal to worker
        this.postMessage({
            type: 'signal',
            data: signalData
        });

        if (signalData.sdp) {
            this.remoteDescriptionSet = true;
            // Process any pending candidates
            while (this.pendingCandidates.length > 0) {
                const candidate = this.pendingCandidates.shift();
                this.postMessage({
                    type: 'signal',
                    data: { candidate }
                });
            }
        }
    }

    async sendFile(filePath: string) {
        try {
            // Get file info
            const { fileName, fileSize } = await window.electronAPI.getFileInfo(filePath);
            console.log(`📤 Sending file: ${fileName} (${fileSize} bytes)`);

            // Read and send file in chunks
            const CHUNK_SIZE = 64 * 1024;
            for (let offset = 0; offset < fileSize; offset += CHUNK_SIZE) {
                const chunkSize = Math.min(CHUNK_SIZE, fileSize - offset);
                const chunk = await window.electronAPI.readFileChunk(filePath, offset, chunkSize);
                
                this.postMessage({
                    type: 'send-chunk',
                    data: {
                        fileName,
                        fileSize,
                        offset,
                        chunk
                    }
                });

                // Small delay to prevent overwhelming
                await new Promise(resolve => setTimeout(resolve, 5));
            }
        } catch (error: any) {
            console.error('❌ Send file error:', error);
            this.onErrorCallback?.(`Send file error: ${error.message}`);
        }
    }

    cancelTransfer() {
        this.postMessage({ type: 'cancel' });
    }

    destroy() {
        this.postMessage({ type: 'destroy' });
        this.worker?.terminate();
        this.worker = null;
    }

    isConnected(): boolean {
        // This is tracked via callback
        return false;
    }
}
