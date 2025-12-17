import React from 'react';
import { useTransfer } from '../contexts/TransferContext';
import TransferView from './TransferView';
import { Button } from 'primereact/button';

const TransferModal: React.FC = () => {
    const { isTransferActive, isMinimized, toggleMinimize, closeTransfer } = useTransfer();

    if (!isTransferActive) {
        return null;
    }

    return (
        <>
            {/* Minimized Indicator */}
            {isMinimized && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    backgroundColor: 'var(--surface-card)',
                    border: '1px solid var(--surface-border)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    minWidth: '280px'
                }}>
                    <i className="pi pi-sync" style={{ fontSize: '1.2rem', animation: 'spin 2s linear infinite' }} />
                    <span style={{ flex: 1, fontWeight: 500 }}>Transfer in progress...</span>
                    <Button
                        icon="pi pi-window-maximize"
                        rounded
                        text
                        size="small"
                        onClick={toggleMinimize}
                        tooltip="Expand"
                        tooltipOptions={{ position: 'top' }}
                    />
                    <Button
                        icon="pi pi-times"
                        rounded
                        text
                        severity="danger"
                        size="small"
                        onClick={closeTransfer}
                        tooltip="Cancel Transfer"
                        tooltipOptions={{ position: 'top' }}
                    />
                    <style>{`
                        @keyframes spin {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            )}

            {/* Full Modal - Keep mounted but hide when minimized */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: isMinimized ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9998,
                padding: '20px'
            }}>
                <div style={{
                    backgroundColor: 'var(--surface-card)',
                    borderRadius: '12px',
                    width: '100%',
                    maxWidth: '900px',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        borderBottom: '1px solid var(--surface-border)'
                    }}>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                            <i className="pi pi-send" style={{ marginRight: '8px' }} />
                            File Transfer
                        </h2>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Button
                                icon="pi pi-window-minimize"
                                rounded
                                text
                                onClick={toggleMinimize}
                                tooltip="Minimize"
                                tooltipOptions={{ position: 'top' }}
                            />
                            <Button
                                icon="pi pi-times"
                                rounded
                                text
                                severity="danger"
                                onClick={closeTransfer}
                                tooltip="Close"
                                tooltipOptions={{ position: 'top' }}
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div style={{
                        flex: 1,
                        overflow: 'auto',
                        padding: '20px'
                    }}>
                        <TransferView />
                    </div>
                </div>
            </div>
        </>
    );
};

export default TransferModal;
