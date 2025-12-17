import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { WebRTCFileTransfer, TransferProgress } from '../utils/webrtc';

interface TransferContextType {
    isTransferActive: boolean;
    isMinimized: boolean;
    startTransfer: (isInitiator: boolean) => void;
    closeTransfer: () => void;
    toggleMinimize: () => void;
    webrtcRef: React.MutableRefObject<WebRTCFileTransfer | null>;
}

const TransferContext = createContext<TransferContextType | undefined>(undefined);

export const useTransfer = () => {
    const context = useContext(TransferContext);
    if (!context) {
        throw new Error('useTransfer must be used within TransferProvider');
    }
    return context;
};

interface TransferProviderProps {
    children: ReactNode;
}

export const TransferProvider: React.FC<TransferProviderProps> = ({ children }) => {
    const [isTransferActive, setIsTransferActive] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const webrtcRef = useRef<WebRTCFileTransfer | null>(null);

    const startTransfer = (isInitiator: boolean) => {
        setIsTransferActive(true);
        setIsMinimized(false);
    };

    const closeTransfer = () => {
        if (webrtcRef.current) {
            webrtcRef.current.destroy();
            webrtcRef.current = null;
        }
        setIsTransferActive(false);
        setIsMinimized(false);
    };

    const toggleMinimize = () => {
        setIsMinimized(prev => !prev);
    };

    return (
        <TransferContext.Provider
            value={{
                isTransferActive,
                isMinimized,
                startTransfer,
                closeTransfer,
                toggleMinimize,
                webrtcRef
            }}
        >
            {children}
        </TransferContext.Provider>
    );
};
