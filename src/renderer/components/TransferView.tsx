import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { ProgressBar } from 'primereact/progressbar';
import { TabView, TabPanel } from 'primereact/tabview';
import { Message } from 'primereact/message';
import { WebRTCFileTransfer, TransferProgress } from '../utils/webrtc';
import { Profile } from '../../types';
import { formatFileSize } from '../utils/fileTypeUtils';

interface TransferViewProps {
    darkMode: boolean;
}

const TransferView: React.FC<TransferViewProps> = ({ darkMode }) => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [mode, setMode] = useState<'send' | 'receive'>('send');
    const [connectionState, setConnectionState] = useState<'disconnected' | 'waiting' | 'connected'>('disconnected');
    const [mySignal, setMySignal] = useState<string>('');
    const [peerSignal, setPeerSignal] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<string>('');
    const [transferQueue, setTransferQueue] = useState<string[]>([]);
    const [transferProgress, setTransferProgress] = useState<TransferProgress | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
    
    const webrtcRef = useRef<WebRTCFileTransfer | null>(null);

    useEffect(() => {
        loadProfile();
        loadTransferQueue();
        
        // Poll for queue updates every second
        const interval = setInterval(loadTransferQueue, 1000);
        
        return () => {
            clearInterval(interval);
            if (webrtcRef.current) {
                webrtcRef.current.destroy();
            }
        };
    }, []);

    const loadTransferQueue = () => {
        const queue = JSON.parse(localStorage.getItem('transferQueue') || '[]');
        setTransferQueue(queue);
    };

    const removeFromQueue = (filePath: string) => {
        const queue = transferQueue.filter(f => f !== filePath);
        localStorage.setItem('transferQueue', JSON.stringify(queue));
        setTransferQueue(queue);
    };

    const clearQueue = () => {
        localStorage.setItem('transferQueue', JSON.stringify([]));
        setTransferQueue([]);
    };

    const loadProfile = async () => {
        try {
            const profileData = await window.electronAPI.getProfile();
            setProfile(profileData);
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    const initializeConnection = (isInitiator: boolean) => {
        console.log(`🔧 Initializing connection as ${isInitiator ? 'INITIATOR' : 'RECEIVER'}`);
        
        if (webrtcRef.current) {
            webrtcRef.current.destroy();
        }

        const webrtc = new WebRTCFileTransfer(isInitiator);
        webrtcRef.current = webrtc;

        // Set mode and initial state
        setMode(isInitiator ? 'send' : 'receive');
        if (!isInitiator) {
            // For receiver, set to waiting immediately since they need to paste offer
            setConnectionState('waiting');
            showMessage('info', 'Paste the sender\'s offer in the "Peer Connection Data" tab');
        }

        webrtc.setOnSignal((signal) => {
            console.log(`📡 Signal generated for ${isInitiator ? 'INITIATOR' : 'RECEIVER'}:`, signal.type);
            setMySignal(JSON.stringify(signal));
            setConnectionState('waiting');
            if (isInitiator) {
                showMessage('info', 'Copy your connection data and send it to the peer');
            } else {
                showMessage('success', 'Answer generated! Copy your connection data and send it back to the sender');
            }
        });

        webrtc.setOnProgress((progress) => {
            setTransferProgress(progress);
            if (progress.status === 'completed') {
                const savedPath = (progress as any).savedPath;
                if (savedPath) {
                    // Copy file path to clipboard
                    navigator.clipboard.writeText(savedPath);
                    showMessage('success', `File saved! Path copied to clipboard: ${savedPath}`);
                } else {
                    showMessage('success', `Transfer completed: ${progress.fileName}`);
                }
            } else if (progress.status === 'error') {
                showMessage('error', `Transfer failed: ${progress.error}`);
            }
        });

        webrtc.setOnConnection((connected) => {
            setConnectionState(connected ? 'connected' : 'disconnected');
            if (connected) {
                showMessage('success', 'Connected to peer!');
            } else if (connectionState === 'connected') {
                // Connection was lost
                showMessage('error', 'Connection lost');
            }
        });

        webrtc.setOnError((error) => {
            console.error('WebRTC error:', error);
            showMessage('error', error);
        });
    };

    const connectToPeer = () => {
        if (!peerSignal.trim()) {
            showMessage('error', 'Please paste peer connection data');
            return;
        }

        if (!webrtcRef.current) {
            showMessage('error', 'Please create or join a connection first');
            return;
        }

        try {
            const signal = JSON.parse(peerSignal);
            console.log('Signaling to peer:', signal);
            webrtcRef.current.signal(signal);
            showMessage('info', 'Processing connection data...');
        } catch (error: any) {
            console.error('Failed to parse peer signal:', error);
            showMessage('error', `Invalid connection data: ${error.message}`);
        }
    };

    const selectFile = async () => {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.onchange = (e: any) => {
                const file = e.target.files[0];
                if (file) {
                    setSelectedFile(file.path);
                }
            };
            input.click();
        } catch (error: any) {
            showMessage('error', 'Failed to select file');
        }
    };

    const sendFile = async (filePath?: string) => {
        const fileToSend = filePath || selectedFile;
        
        if (!fileToSend) {
            showMessage('error', 'Please select a file to send');
            return;
        }

        if (!webrtcRef.current?.isConnected()) {
            showMessage('error', 'Not connected to peer');
            return;
        }

        try {
            await webrtcRef.current.sendFile(fileToSend);
            // Remove from queue after successful send
            if (filePath && transferQueue.includes(filePath)) {
                removeFromQueue(filePath);
            }
        } catch (error: any) {
            showMessage('error', `Failed to send file: ${error.message}`);
        }
    };

    const cancelTransfer = () => {
        webrtcRef.current?.cancelTransfer();
        showMessage('info', 'Transfer cancelled');
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showMessage('success', 'Copied to clipboard');
    };

    const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    const formatSpeed = (bytesPerSecond?: number) => {
        if (!bytesPerSecond) return '';
        if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`;
        if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(2)} KB/s`;
        return `${(bytesPerSecond / (1024 * 1024)).toFixed(2)} MB/s`;
    };

    return (
        <div className={`h-full overflow-auto p-6 ${darkMode ? 'bg-[#252525]' : 'bg-gray-50'}`}>
            <div className="max-w-6xl mx-auto">
                <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    P2P File Transfer
                </h2>

                {message && (
                    <Message 
                        severity={message.type === 'success' ? 'success' : message.type === 'error' ? 'error' : 'info'} 
                        text={message.text}
                        className="mb-4 w-full"
                    />
                )}

                {/* Profile Info */}
                <Card className={`mb-4 ${darkMode ? 'bg-[#2a2a2a]' : 'bg-white'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                Your UUID
                            </h3>
                            <p className={`font-mono text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {profile?.uuid}
                            </p>
                        </div>
                        <Button
                            icon="pi pi-copy"
                            label="Copy"
                            onClick={() => copyToClipboard(profile?.uuid || '')}
                            outlined
                        />
                    </div>
                </Card>

                {/* Connection Setup */}
                <Card className={`mb-4 ${darkMode ? 'bg-[#2a2a2a]' : 'bg-white'}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        Connection Setup
                    </h3>

                    <div className="flex gap-2 mb-4">
                        <Button
                            label="Create Connection (Send)"
                            icon="pi pi-send"
                            onClick={() => initializeConnection(true)}
                            disabled={connectionState !== 'disconnected'}
                            className="flex-1"
                        />
                        <Button
                            label="Join Connection (Receive)"
                            icon="pi pi-download"
                            onClick={() => initializeConnection(false)}
                            disabled={connectionState !== 'disconnected'}
                            className="flex-1"
                            severity="secondary"
                        />
                    </div>

                    {connectionState !== 'disconnected' && (
                        <>
                            {mode === 'receive' && !mySignal && (
                                <div className={`p-4 rounded mb-4 ${darkMode ? 'bg-purple-900/20 border border-purple-800' : 'bg-purple-50 border border-purple-200'}`}>
                                    <p className={`text-sm font-semibold mb-2 ${darkMode ? 'text-purple-200' : 'text-purple-800'}`}>
                                        📝 Receiver Workflow:
                                    </p>
                                    <ol className={`text-sm space-y-1 ml-4 list-decimal ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                                        <li>Go to <strong>"Peer Connection Data"</strong> tab below</li>
                                        <li>Paste the <strong>sender's offer</strong> (the JSON data they sent you)</li>
                                        <li>Click <strong>"Connect to Peer"</strong> button</li>
                                        <li>Your answer will appear in <strong>"My Connection Data"</strong> tab</li>
                                        <li>Copy your answer and send it back to the sender</li>
                                    </ol>
                                </div>
                            )}
                        <TabView>
                            <TabPanel header="My Connection Data">
                                <div className="space-y-2">
                                    <div className={`p-3 rounded mb-2 ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                                        <p className={`text-xs ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                                            <strong>Instructions:</strong> {mode === 'send' 
                                                ? 'Copy the entire text below and send it to the receiver via any messaging app (WhatsApp, Telegram, email, etc.)'
                                                : 'After pasting the sender\'s data and clicking Connect, your answer will appear here. Copy it and send it back to the sender.'}
                                        </p>
                                    </div>
                                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Your Connection Data:
                                    </label>
                                    <InputTextarea
                                        value={mySignal || (mode === 'receive' ? '⏳ Waiting... First paste the sender\'s offer in "Peer Connection Data" tab and click Connect. Your answer will appear here automatically.' : '')}
                                        readOnly
                                        rows={6}
                                        className="w-full font-mono text-xs"
                                        onClick={(e) => e.currentTarget.select()}
                                    />
                                    <Button
                                        icon="pi pi-copy"
                                        label="Copy All Connection Data"
                                        onClick={() => copyToClipboard(mySignal)}
                                        outlined
                                        className="w-full"
                                    />
                                </div>
                            </TabPanel>
                            <TabPanel header="Peer Connection Data">
                                <div className="space-y-2">
                                    <div className={`p-3 rounded mb-2 ${darkMode ? 'bg-orange-900/20 border border-orange-800' : 'bg-orange-50 border border-orange-200'}`}>
                                        <p className={`text-xs ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}>
                                            <strong>Instructions:</strong> {mode === 'send' 
                                                ? 'Paste the receiver\'s answer data here and click Connect to establish the connection.'
                                                : 'Paste the sender\'s offer data here first, then click Connect. This will generate your answer in the other tab.'}
                                        </p>
                                    </div>
                                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Paste Peer's Connection Data:
                                    </label>
                                    <InputTextarea
                                        value={peerSignal}
                                        onChange={(e) => setPeerSignal(e.target.value)}
                                        rows={6}
                                        className="w-full font-mono text-xs"
                                        placeholder='{"type":"offer","sdp":"v=0..."}'
                                    />
                                    <Button
                                        icon="pi pi-link"
                                        label="Connect to Peer"
                                        onClick={connectToPeer}
                                        disabled={connectionState === 'connected' || !peerSignal.trim()}
                                        className="w-full"
                                    />
                                </div>
                            </TabPanel>
                        </TabView>
                        </>
                    )}

                    <div className="mt-4 flex items-center gap-2">
                        <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Status:
                        </span>
                        <span className={`px-3 py-1 rounded text-sm font-medium ${
                            connectionState === 'connected' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : connectionState === 'waiting'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                            {connectionState === 'connected' ? 'Connected' : connectionState === 'waiting' ? 'Waiting for peer' : 'Disconnected'}
                        </span>
                    </div>
                </Card>

                {/* Transfer Queue */}
                {transferQueue.length > 0 && (
                    <Card className={`mb-4 ${darkMode ? 'bg-[#2a2a2a]' : 'bg-white'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                Transfer Queue ({transferQueue.length})
                            </h3>
                            <Button
                                label="Clear All"
                                icon="pi pi-times"
                                onClick={clearQueue}
                                size="small"
                                severity="secondary"
                                outlined
                            />
                        </div>

                        <div className="space-y-2">
                            {transferQueue.map((filePath, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center justify-between p-3 rounded border ${
                                        darkMode ? 'border-gray-700 bg-[#1e1e1e]' : 'border-gray-200 bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <i className="pi pi-file text-blue-500" />
                                        <span className={`text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {filePath.split(/[\\/]/).pop()}
                                        </span>
                                    </div>
                                    <div className="flex gap-1">
                                        {connectionState === 'connected' && (
                                            <Button
                                                icon="pi pi-send"
                                                size="small"
                                                onClick={() => sendFile(filePath)}
                                                disabled={transferProgress?.status === 'transferring'}
                                                tooltip="Send file"
                                            />
                                        )}
                                        <Button
                                            icon="pi pi-times"
                                            size="small"
                                            severity="danger"
                                            outlined
                                            onClick={() => removeFromQueue(filePath)}
                                            tooltip="Remove from queue"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* File Transfer */}
                {connectionState === 'connected' && mode === 'send' && (
                    <Card className={`mb-4 ${darkMode ? 'bg-[#2a2a2a]' : 'bg-white'}`}>
                        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            Send File
                        </h3>

                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <Button
                                    label="Select File"
                                    icon="pi pi-file"
                                    onClick={selectFile}
                                    outlined
                                />
                                {selectedFile && (
                                    <span className={`flex items-center text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {selectedFile.split(/[\\/]/).pop()}
                                    </span>
                                )}
                            </div>

                            <Button
                                label="Send File"
                                icon="pi pi-send"
                                onClick={() => sendFile()}
                                disabled={!selectedFile || (transferProgress?.status === 'transferring')}
                                className="w-full"
                            />
                        </div>
                    </Card>
                )}

                {/* Transfer Progress */}
                {transferProgress && (
                    <Card className={`${darkMode ? 'bg-[#2a2a2a]' : 'bg-white'}`}>
                        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            Transfer Progress
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {transferProgress.fileName}
                                    </span>
                                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {transferProgress.percentage.toFixed(1)}%
                                    </span>
                                </div>
                                <ProgressBar value={transferProgress.percentage} />
                            </div>

                            <div className={`grid grid-cols-2 gap-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <div>
                                    <span className="font-medium">Size:</span> {formatFileSize(transferProgress.fileSize)}
                                </div>
                                <div>
                                    <span className="font-medium">Transferred:</span> {formatFileSize(transferProgress.bytesTransferred)}
                                </div>
                                {transferProgress.speed && (
                                    <div>
                                        <span className="font-medium">Speed:</span> {formatSpeed(transferProgress.speed)}
                                    </div>
                                )}
                                <div>
                                    <span className="font-medium">Status:</span> {transferProgress.status}
                                </div>
                            </div>

                            {transferProgress.status === 'transferring' && (
                                <Button
                                    label="Cancel Transfer"
                                    icon="pi pi-times"
                                    onClick={cancelTransfer}
                                    severity="danger"
                                    outlined
                                    className="w-full"
                                />
                            )}

                            {transferProgress.status === 'error' && transferProgress.error && (
                                <Message severity="error" text={transferProgress.error} className="w-full" />
                            )}
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default TransferView;
