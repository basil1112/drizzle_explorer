// WebRTC Worker - Using native Chromium WebRTC APIs
// Runs in Web Worker context with full access to RTCPeerConnection and RTCDataChannel
// Worker context provides RTCPeerConnection, RTCDataChannel, and other WebRTC APIs via global scope

const CHUNK_SIZE = 64 * 1024; // 64KB chunks

// Access WebRTC APIs from global scope - they're available in Web Worker contexts in browsers
// In Webpack workers, we need to access them via globalThis
const getGlobal = (): any => {
    if (typeof globalThis !== 'undefined') return globalThis;
    if (typeof self !== 'undefined') return self;
    if (typeof window !== 'undefined') return window;
    if (typeof global !== 'undefined') return global;
    throw new Error('Unable to locate global object');
};

const workerGlobal = getGlobal();
const PeerConnection = workerGlobal.RTCPeerConnection || workerGlobal.webkitRTCPeerConnection;
const SessionDescription = workerGlobal.RTCSessionDescription;
const IceCandidate = workerGlobal.RTCIceCandidate;

console.log('🔍 Worker environment check:', {
    hasPeerConnection: !!PeerConnection,
    hasSessionDescription: !!SessionDescription,
    hasIceCandidate: !!IceCandidate,
    globalType: typeof workerGlobal,
    isWorker: typeof WorkerGlobalScope !== 'undefined'
});

if (!PeerConnection) {
    console.error('❌ Available globals:', Object.keys(workerGlobal).filter(k => k.includes('RTC')));
    throw new Error('RTCPeerConnection is not available in this worker context');
}

let peerConnection: any | null = null;
let dataChannel: any | null = null;
let receivingMetadata: { fileName: string; fileSize: number } | null = null;
let receivedChunks: Uint8Array[] = [];
let receivedBytes = 0;
let transferStartTime = 0;

const ICE_SERVERS: any = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
    ]
};

// Post message to main thread
const postToMain = (type: string, data?: any) => {
    self.postMessage({ type, data });
};

// Initialize peer connection
function initializePeerConnection(isInitiator: boolean): void {
    console.log(`🔧 Worker: Initializing as ${isInitiator ? 'INITIATOR' : 'RECEIVER'}`);
    
    peerConnection = new PeerConnection(ICE_SERVERS);

    // Handle ICE candidates
    peerConnection.onicecandidate = (event: any) => {
        if (event.candidate) {
            postToMain('candidate', event.candidate.toJSON());
        } else {
            // All candidates gathered, send complete signal
            postToMain('signal-complete', peerConnection!.localDescription);
        }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
        const state = peerConnection!.connectionState;
        console.log(`🔌 Worker: Connection state: ${state}`);
        postToMain('connection-state', state);
        
        if (state === 'connected') {
            postToMain('connected', true);
        } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
            postToMain('connected', false);
        }
    };

    // Handle ICE connection state
    peerConnection.oniceconnectionstatechange = () => {
        console.log(`❄️ Worker: ICE state: ${peerConnection!.iceConnectionState}`);
    };

    // Setup data channel
    if (isInitiator) {
        // Initiator creates the data channel
        dataChannel = peerConnection.createDataChannel('file-transfer', {
            ordered: true,
            maxRetransmits: 3
        });
        setupDataChannel(dataChannel);
        
        // Create offer
        createOffer();
    } else {
        // Receiver waits for data channel
        peerConnection.ondatachannel = (event: any) => {
            console.log('📡 Worker: Received data channel');
            dataChannel = event.channel;
            setupDataChannel(dataChannel);
        };
    }
}

// Create and send offer
async function createOffer(): Promise<void> {
    if (!peerConnection) return;
    
    try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        console.log('📤 Worker: Created offer');
        // Signal will be sent when ICE gathering completes
    } catch (error) {
        console.error('❌ Worker: Failed to create offer:', error);
        postToMain('error', `Failed to create offer: ${error}`);
    }
}

// Setup data channel handlers
function setupDataChannel(channel: any): void {
    channel.binaryType = 'arraybuffer';
    
    channel.onopen = () => {
        console.log('✅ Worker: Data channel open');
        postToMain('data-channel-open', true);
    };

    channel.onmessage = (event: any) => {
        handleIncomingData(event.data);
    };

    channel.onclose = () => {
        console.log('🔌 Worker: Data channel closed');
        postToMain('data-channel-close', true);
    };

    channel.onerror = (error: any) => {
        console.error('❌ Worker: Data channel error:', error);
        postToMain('error', 'Data channel error');
    };

    channel.onbufferedamountlow = () => {
        postToMain('buffer-low', true);
    };
}

// Handle incoming data
function handleIncomingData(data: any): void {
    try {
        let message: any;

        // Parse data
        if (typeof data === 'string') {
            message = JSON.parse(data);
        } else if (data instanceof ArrayBuffer) {
            // Try to decode as text first (might be JSON)
            const text = new TextDecoder().decode(data);
            try {
                message = JSON.parse(text);
            } catch {
                // Not JSON, treat as file chunk
                if (!receivingMetadata) {
                    console.warn('⚠️ Worker: Received chunk but no metadata');
                    return;
                }
                handleFileChunk(new Uint8Array(data));
                return;
            }
        }

        // Handle control messages
        if (message && message.type) {
            handleControlMessage(message);
        }
    } catch (error) {
        console.error('❌ Worker: Error handling data:', error);
        postToMain('error', `Data handling error: ${error}`);
    }
}

// Handle control messages
function handleControlMessage(message: any): void {
    console.log('📋 Worker: Control message:', message.type);

    switch (message.type) {
        case 'metadata':
            receivingMetadata = {
                fileName: message.fileName,
                fileSize: message.fileSize
            };
            receivedChunks = [];
            receivedBytes = 0;
            transferStartTime = Date.now();
            
            postToMain('progress', {
                fileName: message.fileName,
                fileSize: message.fileSize,
                bytesTransferred: 0,
                percentage: 0,
                status: 'transferring'
            });
            break;

        case 'complete':
            if (receivingMetadata) {
                saveReceivedFile();
            }
            break;

        case 'cancel':
            receivingMetadata = null;
            receivedChunks = [];
            receivedBytes = 0;
            postToMain('progress', {
                fileName: '',
                fileSize: 0,
                bytesTransferred: 0,
                percentage: 0,
                status: 'cancelled'
            });
            break;
    }
}

// Handle file chunks
function handleFileChunk(chunk: Uint8Array): void {
    if (!receivingMetadata) return;

    receivedChunks.push(chunk);
    receivedBytes += chunk.byteLength;

    const percentage = (receivedBytes / receivingMetadata.fileSize) * 100;
    const elapsed = (Date.now() - transferStartTime) / 1000;
    const speed = receivedBytes / elapsed;

    postToMain('progress', {
        fileName: receivingMetadata.fileName,
        fileSize: receivingMetadata.fileSize,
        bytesTransferred: receivedBytes,
        percentage,
        status: 'transferring',
        speed
    });
}

// Save received file
function saveReceivedFile(): void {
    if (!receivingMetadata) return;

    try {
        // Combine chunks
        const totalSize = receivedChunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
        const combined = new Uint8Array(totalSize);
        let offset = 0;
        for (const chunk of receivedChunks) {
            combined.set(chunk, offset);
            offset += chunk.byteLength;
        }

        // Send to main thread for file I/O
        postToMain('save-file', {
            fileName: receivingMetadata.fileName,
            fileData: combined
        });

        receivingMetadata = null;
        receivedChunks = [];
        receivedBytes = 0;
    } catch (error) {
        console.error('❌ Worker: Save error:', error);
        postToMain('error', `Save error: ${error}`);
    }
}

// Send file
function sendFile(fileName: string, fileSize: number, offset: number, chunk: ArrayBuffer): void {
    if (!dataChannel || dataChannel.readyState !== 'open') {
        postToMain('error', 'Data channel not open');
        return;
    }

    try {
        // Send metadata on first chunk
        if (offset === 0) {
            transferStartTime = Date.now();
            const metadata = JSON.stringify({
                type: 'metadata',
                fileName,
                fileSize
            });
            dataChannel.send(metadata);
        }

        // Send chunk as ArrayBuffer
        dataChannel.send(chunk);

        const bytesTransferred = offset + chunk.byteLength;
        const percentage = (bytesTransferred / fileSize) * 100;
        const elapsed = (Date.now() - transferStartTime) / 1000;
        const speed = bytesTransferred / elapsed;

        postToMain('progress', {
            fileName,
            fileSize,
            bytesTransferred,
            percentage,
            status: 'transferring',
            speed,
            bufferedAmount: dataChannel.bufferedAmount
        });

        // Send completion on last chunk
        if (bytesTransferred >= fileSize) {
            setTimeout(() => {
                dataChannel!.send(JSON.stringify({ type: 'complete' }));
                postToMain('progress', {
                    fileName,
                    fileSize,
                    bytesTransferred: fileSize,
                    percentage: 100,
                    status: 'completed',
                    speed
                });
            }, 100);
        }
    } catch (error) {
        console.error('❌ Worker: Send error:', error);
        postToMain('error', `Send error: ${error}`);
    }
}

// Cancel transfer
function cancelTransfer(): void {
    if (dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify({ type: 'cancel' }));
    }
    receivingMetadata = null;
    receivedChunks = [];
    receivedBytes = 0;
}

// Worker message handler
self.onmessage = async (event: any) => {
    const { type, data } = event.data;

    try {
        switch (type) {
            case 'init':
                initializePeerConnection(data.isInitiator);
                break;

            case 'signal':
                if (!peerConnection) {
                    console.error('❌ Worker: No peer connection');
                    return;
                }

                if (data.sdp) {
                    // Received SDP (offer or answer)
                    await peerConnection.setRemoteDescription(new SessionDescription(data.sdp));
                    console.log(`📥 Worker: Set remote ${data.sdp.type}`);

                    if (data.sdp.type === 'offer') {
                        // Create answer
                        const answer = await peerConnection.createAnswer();
                        await peerConnection.setLocalDescription(answer);
                        console.log('📤 Worker: Created answer');
                        // Answer will be sent when ICE gathering completes
                    }
                } else if (data.candidate) {
                    // Received ICE candidate
                    const candidate = new IceCandidate(data.candidate);
                    await peerConnection.addIceCandidate(candidate);
                    console.log('❄️ Worker: Added ICE candidate');
                }
                break;

            case 'send-chunk':
                sendFile(data.fileName, data.fileSize, data.offset, data.chunk);
                break;

            case 'cancel':
                cancelTransfer();
                break;

            case 'destroy':
                if (dataChannel) {
                    dataChannel.close();
                    dataChannel = null;
                }
                if (peerConnection) {
                    peerConnection.close();
                    peerConnection = null;
                }
                break;
        }
    } catch (error) {
        console.error('❌ Worker: Message handling error:', error);
        postToMain('error', `Worker error: ${error}`);
    }
};

console.log('🚀 Worker: WebRTC worker initialized');
