import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { isImage, isVideo, isAudio, isText, isPDF, formatFileSize, formatDate } from '../utils/fileTypeUtils';

interface PreviewPanelProps {
    selectedFile: {
        name: string;
        path: string;
        isDirectory: boolean;
        size: number;
        modified: Date;
    } | null;
    darkMode: boolean;
    onClose?: () => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ selectedFile, darkMode, onClose }) => {
    const [imageLoading, setImageLoading] = useState(true);
    const [videoLoading, setVideoLoading] = useState(true);
    const [audioLoading, setAudioLoading] = useState(true);
    const [pdfLoading, setPdfLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefresh = () => {
        setImageLoading(true);
        setVideoLoading(true);
        setAudioLoading(true);
        setPdfLoading(true);
        setRefreshKey(prev => prev + 1);
    };

    // Reset loading states when file changes
    React.useEffect(() => {
        if (selectedFile) {
            setImageLoading(true);
            setVideoLoading(true);
            setAudioLoading(true);
            setPdfLoading(true);
        }
    }, [selectedFile?.path]);

    if (!selectedFile || selectedFile.isDirectory) {
        return (
            <div className={`h-full p-4 ${darkMode ? 'bg-[#252525]' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        Preview
                    </h3>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className={`p-2 rounded hover:bg-opacity-10 hover:bg-gray-500 transition-colors ${
                                darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
                            }`}
                            title="Close preview"
                        >
                            <i className="pi pi-times"></i>
                        </button>
                    )}
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {selectedFile?.isDirectory 
                        ? 'Folder preview not available' 
                        : 'Select a file to preview'}
                </div>
            </div>
            
        );
    }

    const renderPreview = () => {
        if (isImage(selectedFile.name)) {
            return (
                <div className="flex items-center justify-center p-4 relative" style={{ minHeight: '400px' }}>
                    {imageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <ProgressSpinner 
                                style={{ width: '50px', height: '50px' }}
                                strokeWidth="4"
                            />
                        </div>
                    )}
                    <img 
                        key={refreshKey}
                        src={`file:///${selectedFile.path}`} 
                        alt={selectedFile.name}
                        className="max-w-full max-h-full object-contain rounded"
                        style={{ maxHeight: '400px', display: imageLoading ? 'none' : 'block' }}
                        onLoad={() => setImageLoading(false)}
                        onError={() => setImageLoading(false)}
                    />
                </div>
            );
        }

        if (isVideo(selectedFile.name)) {
            return (
                <div className="p-4 relative" style={{ minHeight: '400px' }}>
                    {videoLoading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <ProgressSpinner 
                                style={{ width: '50px', height: '50px' }}
                                strokeWidth="4"
                            />
                        </div>
                    )}
                    <video 
                        key={refreshKey}
                        controls 
                        className="w-full rounded"
                        style={{ maxHeight: '400px', display: videoLoading ? 'none' : 'block' }}
                        onLoadedData={() => setVideoLoading(false)}
                        onError={() => setVideoLoading(false)}
                    >
                        <source src={`file:///${selectedFile.path}`} />
                        Your browser does not support the video tag.
                    </video>
                </div>
            );
        }

        if (isAudio(selectedFile.name)) {
            return (
                <div className="p-4">
                    <div className={`flex items-center justify-center mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {audioLoading ? (
                            <ProgressSpinner 
                                style={{ width: '50px', height: '50px' }}
                                strokeWidth="4"
                            />
                        ) : (
                            <i className="pi pi-volume-up text-6xl"></i>
                        )}
                    </div>
                    <audio 
                        key={refreshKey}
                        controls 
                        className="w-full"
                        onLoadedData={() => setAudioLoading(false)}
                        onError={() => setAudioLoading(false)}
                    >
                        <source src={`file:///${selectedFile.path}`} />
                        Your browser does not support the audio tag.
                    </audio>
                </div>
            );
        }

        if (isPDF(selectedFile.name)) {
            return (
                <div className="p-4 relative" style={{ minHeight: '500px' }}>
                    {pdfLoading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <ProgressSpinner 
                                style={{ width: '50px', height: '50px' }}
                                strokeWidth="4"
                            />
                        </div>
                    )}
                    <iframe 
                        key={refreshKey}
                        src={`file:///${selectedFile.path}`}
                        className="w-full rounded border"
                        style={{ height: '500px', display: pdfLoading ? 'none' : 'block' }}
                        title="PDF Preview"
                        onLoad={() => setPdfLoading(false)}
                    />
                </div>
            );
        }

        if (isText(selectedFile.name)) {
            return (
                <div className={`p-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <div className="mb-2 font-semibold">Text file preview</div>
                    <div className={`p-3 rounded ${darkMode ? 'bg-[#1e1e1e]' : 'bg-gray-100'}`}>
                        Text preview requires file reading implementation
                    </div>
                </div>
            );
        }

        return (
            <div className={`p-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <i className="pi pi-file text-6xl mb-4"></i>
                <div>Preview not available for this file type</div>
            </div>
        );
    };

    return (
        <div className={`h-full overflow-auto ${darkMode ? 'bg-[#252525]' : 'bg-white'}`}>
            <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        Preview
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={handleRefresh}
                            className={`p-2 rounded hover:bg-opacity-10 hover:bg-gray-500 transition-colors ${
                                darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
                            }`}
                            title="Refresh preview"
                        >
                            <i className="pi pi-refresh"></i>
                        </button>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className={`p-2 rounded hover:bg-opacity-10 hover:bg-gray-500 transition-colors ${
                                    darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
                                }`}
                                title="Close preview"
                            >
                                <i className="pi pi-times"></i>
                            </button>
                        )}
                    </div>
                </div>
                {renderPreview()}
                <Card className={`mb-2 ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-50'}`}>
                    <div className="space-y-2">
                        <div className={`font-semibold truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            {selectedFile.name}
                        </div>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <div>Size: {formatFileSize(selectedFile.size)}</div>
                            <div>Modified: {formatDate(selectedFile.modified)}</div>
                            <div className="truncate">Path: {selectedFile.path}</div>
                        </div>
                    </div>
                </Card>

                
            </div>
        </div>
    );
};

export default PreviewPanel;
