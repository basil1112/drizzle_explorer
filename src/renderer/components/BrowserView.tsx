import React, { useRef } from 'react';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { ProgressBar } from 'primereact/progressbar';
import { ContextMenu } from 'primereact/contextmenu';
import { MenuItem } from 'primereact/menuitem';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Slider } from 'primereact/slider';

interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: Date;
  type: 'file' | 'folder';
}

interface BrowserViewProps {
  currentPath: string;
  files: FileEntry[];
  loading: boolean;
  error: string;
  darkMode: boolean;
  onBack: () => void;
  onDirectoryClick: (path: string) => void;
}

const BrowserView: React.FC<BrowserViewProps> = ({
  currentPath,
  files,
  loading,
  error,
  darkMode,
  onBack,
  onDirectoryClick,
}) => {
  const cm = useRef<ContextMenu>(null);
  const [selectedFile, setSelectedFile] = React.useState<FileEntry | null>(null);
  const [hasCopied, setHasCopied] = React.useState<boolean>(false);
  const [isOperating, setIsOperating] = React.useState<boolean>(false);
  const [operationMessage, setOperationMessage] = React.useState<string>('');
  const [showDeleteDialog, setShowDeleteDialog] = React.useState<boolean>(false);
  const [fileToDelete, setFileToDelete] = React.useState<FileEntry | null>(null);
  const [showConvertDialog, setShowConvertDialog] = React.useState<boolean>(false);
  const [showScaleDialog, setShowScaleDialog] = React.useState<boolean>(false);
  const [showRenameDialog, setShowRenameDialog] = React.useState<boolean>(false);
  const [showImageConvertDialog, setShowImageConvertDialog] = React.useState<boolean>(false);
  const [showTrimDialog, setShowTrimDialog] = React.useState<boolean>(false);
  const [convertFormat, setConvertFormat] = React.useState<string>('mp4');
  const [scaleResolution, setScaleResolution] = React.useState<string>('1280x720');
  const [newFileName, setNewFileName] = React.useState<string>('');
  const [imageFormat, setImageFormat] = React.useState<string>('png');
  const [trimRange, setTrimRange] = React.useState<[number, number]>([0, 100]);
  const [videoDuration, setVideoDuration] = React.useState<number>(100);

  React.useEffect(() => {
    checkCopiedState();
  }, []);

  const checkCopiedState = async () => {
    const copied = await window.electronAPI.hasCopiedPath();
    setHasCopied(copied);
  };

  const handleOpen = async () => {
    if (selectedFile) {
      if (selectedFile.isDirectory) {
        onDirectoryClick(selectedFile.path);
      } else {
        await window.electronAPI.openPath(selectedFile.path);
      }
    }
  };

  const handleCopy = async () => {
    if (selectedFile) {
      console.log('Copying:', selectedFile.path);
      await window.electronAPI.copyPath(selectedFile.path);
      setHasCopied(true);
      console.log('Copy complete, hasCopied set to true');
    }
  };

  const handleDelete = () => {
    if (selectedFile) {
      setFileToDelete(selectedFile);
      setShowDeleteDialog(true);
    }
  };

  const confirmDelete = async () => {
    if (fileToDelete) {
      setShowDeleteDialog(false);
      setIsOperating(true);
      setOperationMessage(`Deleting ${fileToDelete.name}...`);
      console.log('Deleting:', fileToDelete.path);
      const success = await window.electronAPI.deletePath(fileToDelete.path);
      console.log('Delete result:', success);
      if (success) {
        setOperationMessage('Delete complete!');
        setTimeout(() => {
          setIsOperating(false);
          setOperationMessage('');
          // Refresh the directory
          onDirectoryClick(currentPath);
        }, 1000);
      } else {
        setOperationMessage('Delete failed!');
        console.error('Delete operation failed');
        setTimeout(() => {
          setIsOperating(false);
          setOperationMessage('');
        }, 2000);
      }
      setFileToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setFileToDelete(null);
  };

  const isVideoFile = (fileName: string): boolean => {
    const videoExtensions = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpeg', '.mpg'];
    return videoExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  };

  const isImageFile = (fileName: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.svg'];
    return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  };

  const handleConvert = () => {
    if (selectedFile) {
      setConvertFormat('mp4');
      setShowConvertDialog(true);
    }
  };

  const handleScaleDown = () => {
    if (selectedFile) {
      setScaleResolution('1280x720');
      setShowScaleDialog(true);
    }
  };

  const handleSharpenVideo = async () => {
    if (selectedFile) {
      setIsOperating(true);
      setOperationMessage(`Sharpening ${selectedFile.name}...`);
      console.log('Sharpening video:', selectedFile.path);
      const success = await window.electronAPI.sharpenVideo(selectedFile.path);
      console.log('Sharpen video result:', success);
      if (success) {
        setOperationMessage('Sharpen complete!');
        setTimeout(() => {
          setIsOperating(false);
          setOperationMessage('');
          onDirectoryClick(currentPath);
        }, 1000);
      } else {
        setOperationMessage('Sharpen failed!');
        setTimeout(() => {
          setIsOperating(false);
          setOperationMessage('');
        }, 2000);
      }
    }
  };

  const handleTrimVideo = async () => {
    if (selectedFile) {
      // Get video duration first
      const duration = await window.electronAPI.getVideoDuration(selectedFile.path);
      if (duration > 0) {
        setVideoDuration(duration);
        setTrimRange([0, duration]);
        setShowTrimDialog(true);
      } else {
        console.error('Could not get video duration');
      }
    }
  };

  const confirmTrimVideo = async () => {
    if (selectedFile) {
      setShowTrimDialog(false);
      setIsOperating(true);
      setOperationMessage(`Trimming ${selectedFile.name}...`);
      console.log('Trimming video:', selectedFile.path, 'from', trimRange[0], 'to', trimRange[1]);
      const success = await window.electronAPI.trimVideo(selectedFile.path, trimRange[0], trimRange[1]);
      console.log('Trim result:', success);
      if (success) {
        setOperationMessage('Trim complete!');
        setTimeout(() => {
          setIsOperating(false);
          setOperationMessage('');
          onDirectoryClick(currentPath);
        }, 1000);
      } else {
        setOperationMessage('Trim failed!');
        setTimeout(() => {
          setIsOperating(false);
          setOperationMessage('');
        }, 2000);
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRename = () => {
    if (selectedFile) {
      const nameWithoutExt = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.'));
      setNewFileName(nameWithoutExt);
      setShowRenameDialog(true);
    }
  };

  const confirmConvert = async () => {
    if (selectedFile) {
      setShowConvertDialog(false);
      setIsOperating(true);
      setOperationMessage(`Converting ${selectedFile.name} to ${convertFormat}...`);
      console.log('Converting:', selectedFile.path, 'to', convertFormat);
      const success = await window.electronAPI.convertVideo(selectedFile.path, convertFormat);
      console.log('Convert result:', success);
      if (success) {
        setOperationMessage('Convert complete!');
        setTimeout(() => {
          setIsOperating(false);
          setOperationMessage('');
          onDirectoryClick(currentPath);
        }, 1000);
      } else {
        setOperationMessage('Convert failed!');
        setTimeout(() => {
          setIsOperating(false);
          setOperationMessage('');
        }, 2000);
      }
    }
  };

  const confirmScaleDown = async () => {
    if (selectedFile) {
      setShowScaleDialog(false);
      setIsOperating(true);
      setOperationMessage(`Scaling down ${selectedFile.name} to ${scaleResolution}...`);
      console.log('Scaling:', selectedFile.path, 'to', scaleResolution);
      const success = await window.electronAPI.scaleVideo(selectedFile.path, scaleResolution);
      console.log('Scale result:', success);
      if (success) {
        setOperationMessage('Scale complete!');
        setTimeout(() => {
          setIsOperating(false);
          setOperationMessage('');
          onDirectoryClick(currentPath);
        }, 1000);
      } else {
        setOperationMessage('Scale failed!');
        setTimeout(() => {
          setIsOperating(false);
          setOperationMessage('');
        }, 2000);
      }
    }
  };

  const confirmRename = async () => {
    if (selectedFile && newFileName.trim()) {
      setShowRenameDialog(false);
      const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.'));
      const fullNewName = newFileName.trim() + ext;
      setIsOperating(true);
      setOperationMessage(`Renaming ${selectedFile.name} to ${fullNewName}...`);
      console.log('Renaming:', selectedFile.path, 'to', fullNewName);
      const success = await window.electronAPI.renameFile(selectedFile.path, fullNewName);
      console.log('Rename result:', success);
      if (success) {
        setOperationMessage('Rename complete!');
        setTimeout(() => {
          setIsOperating(false);
          setOperationMessage('');
          onDirectoryClick(currentPath);
        }, 1000);
      } else {
        setOperationMessage('Rename failed!');
        setTimeout(() => {
          setIsOperating(false);
          setOperationMessage('');
        }, 2000);
      }
    }
  };

  const handleConvertImage = () => {
    if (selectedFile) {
      setImageFormat('png');
      setShowImageConvertDialog(true);
    }
  };

  const handleSharpenImage = async () => {
    if (selectedFile) {
      setIsOperating(true);
      setOperationMessage(`Sharpening ${selectedFile.name}...`);
      console.log('Sharpening:', selectedFile.path);
      const success = await window.electronAPI.sharpenImage(selectedFile.path);
      console.log('Sharpen result:', success);
      if (success) {
        setOperationMessage('Sharpen complete!');
        setTimeout(() => {
          setIsOperating(false);
          setOperationMessage('');
          onDirectoryClick(currentPath);
        }, 1000);
      } else {
        setOperationMessage('Sharpen failed!');
        setTimeout(() => {
          setIsOperating(false);
          setOperationMessage('');
        }, 2000);
      }
    }
  };

  const handleCompressImage = async () => {
    if (selectedFile) {
      setIsOperating(true);
      setOperationMessage(`Compressing ${selectedFile.name}...`);
      console.log('Compressing:', selectedFile.path);
      const success = await window.electronAPI.compressImage(selectedFile.path);
      console.log('Compress result:', success);
      if (success) {
        setOperationMessage('Compress complete!');
        setTimeout(() => {
          setIsOperating(false);
          setOperationMessage('');
          onDirectoryClick(currentPath);
        }, 1000);
      } else {
        setOperationMessage('Compress failed!');
        setTimeout(() => {
          setIsOperating(false);
          setOperationMessage('');
        }, 2000);
      }
    }
  };

  const confirmConvertImage = async () => {
    if (selectedFile) {
      setShowImageConvertDialog(false);
      setIsOperating(true);
      setOperationMessage(`Converting ${selectedFile.name} to ${imageFormat}...`);
      console.log('Converting image:', selectedFile.path, 'to', imageFormat);
      const success = await window.electronAPI.convertImage(selectedFile.path, imageFormat);
      console.log('Convert result:', success);
      if (success) {
        setOperationMessage('Convert complete!');
        setTimeout(() => {
          setIsOperating(false);
          setOperationMessage('');
          onDirectoryClick(currentPath);
        }, 1000);
      } else {
        setOperationMessage('Convert failed!');
        setTimeout(() => {
          setIsOperating(false);
          setOperationMessage('');
        }, 2000);
      }
    }
  };

  const handlePaste = async () => {
    if (currentPath) {
      setIsOperating(true);
      setOperationMessage('Pasting file...');
      console.log('Pasting to:', currentPath);
      const success = await window.electronAPI.pastePath(currentPath);
      console.log('Paste result:', success);
      if (success) {
        setOperationMessage('Paste complete!');
        setTimeout(() => {
          setIsOperating(false);
          setOperationMessage('');
          // Refresh the directory to show the pasted file
          onDirectoryClick(currentPath);
        }, 1000);
      } else {
        setOperationMessage('Paste failed!');
        console.error('Paste operation failed');
        setTimeout(() => {
          setIsOperating(false);
          setOperationMessage('');
        }, 2000);
      }
    }
  };

  const getVideoOperationsMenu = (): MenuItem[] => {
    if (!selectedFile || !isVideoFile(selectedFile.name)) {
      return [];
    }
    return [
      {
        separator: true
      },
      {
        label: 'Operations',
        icon: 'pi pi-fw pi-cog',
        items: [
          {
            label: 'Convert',
            icon: 'pi pi-fw pi-replay',
            command: handleConvert
          },
          {
            label: 'Scale Down',
            icon: 'pi pi-fw pi-arrows-alt',
            command: handleScaleDown
          },
          {
            label: 'Sharpen Video',
            icon: 'pi pi-fw pi-sparkles',
            command: handleSharpenVideo
          },
          {
            label: 'Trim Video',
            icon: 'pi pi-fw pi-scissors',
            command: handleTrimVideo
          }
        ]
      }
    ];
  };

  const getImageOperationsMenu = (): MenuItem[] => {
    if (!selectedFile || !isImageFile(selectedFile.name)) {
      return [];
    }
    return [
      {
        separator: true
      },
      {
        label: 'Operations',
        icon: 'pi pi-fw pi-cog',
        items: [
          {
            label: 'Convert Image',
            command: handleConvertImage
          },
          {
            label: 'Sharpen Image',
            command: handleSharpenImage
          },
          {
            label: 'Compress Image',
            command: handleCompressImage
          }
        ]
      }
    ];
  };

  const menuItems: MenuItem[] = selectedFile ? [
    {
      label: 'Open',
      icon: 'pi pi-fw pi-folder-open',
      command: handleOpen
    },
    {
      label: 'Copy',
      icon: 'pi pi-fw pi-copy',
      command: handleCopy
    },
    {
      label: 'Rename',
      icon: 'pi pi-fw pi-pencil',
      command: handleRename
    },
    {
      label: 'Paste',
      icon: 'pi pi-fw pi-clone',
      command: handlePaste,
      disabled: !hasCopied
    },
    ...getVideoOperationsMenu(),
    ...getImageOperationsMenu(),
    {
      separator: true
    },
    {
      label: 'Delete',
      icon: 'pi pi-fw pi-trash',
      command: handleDelete,
      className: 'text-red-500'
    }
  ] : [
    {
      label: 'Paste',
      icon: 'pi pi-fw pi-clone',
      command: handlePaste,
      disabled: !hasCopied
    }
  ];

  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedFile(null);
    checkCopiedState();
    cm.current?.show(e as any);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const nameBodyTemplate = (rowData: FileEntry) => {
    return (
      <div className="flex items-center gap-2">
        <i className={`${rowData.isDirectory ? 'pi pi-folder text-yellow-500' : 'pi pi-file text-blue-400'} text-xl`}></i>
        <span>{rowData.name}</span>
      </div>
    );
  };

  const sizeBodyTemplate = (rowData: FileEntry) => {
    return rowData.isDirectory ? '-' : formatFileSize(rowData.size);
  };

  const modifiedBodyTemplate = (rowData: FileEntry) => {
    return new Date(rowData.modified).toLocaleString();
  };

  return (
    <div className="p-6" onContextMenu={handleBackgroundContextMenu}>
      <ContextMenu model={menuItems} ref={cm} />

      {/* Delete Confirmation Dialog */}
      <Dialog
        header="Confirm Delete"
        visible={showDeleteDialog}
        style={{ width: '450px' }}
        onHide={cancelDelete}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={cancelDelete}
              className="p-button-text"
            />
            <Button
              label="Delete"
              icon="pi pi-trash"
              onClick={confirmDelete}
              severity="danger"
            />
          </div>
        }
      >
        <div className="flex items-center gap-3">
          <i className="pi pi-exclamation-triangle text-4xl text-orange-500"></i>
          <div>
            <p className="mb-2">Are you sure you want to delete this {fileToDelete?.isDirectory ? 'folder' : 'file'}?</p>
            <p className="font-semibold">{fileToDelete?.name}</p>
          </div>
        </div>
      </Dialog>

      {/* Convert Video Dialog */}
      <Dialog
        header="Convert Video"
        visible={showConvertDialog}
        style={{ width: '450px' }}
        onHide={() => setShowConvertDialog(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => setShowConvertDialog(false)}
              className="p-button-text"
            />
            <Button
              label="Convert"
              icon="pi pi-replay"
              onClick={confirmConvert}
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block mb-2 font-semibold">File: {selectedFile?.name}</label>
          </div>
          <div>
            <label className="block mb-2">Convert to:</label>
            <Dropdown
              value={convertFormat}
              onChange={(e) => setConvertFormat(e.value)}
              options={[
                { label: 'MP4', value: 'mp4' },
                { label: 'AVI', value: 'avi' },
                { label: 'MKV', value: 'mkv' },
                { label: 'MOV', value: 'mov' },
                { label: 'WebM', value: 'webm' }
              ]}
              className="w-full"
            />
          </div>
        </div>
      </Dialog>

      {/* Scale Video Dialog */}
      <Dialog
        header="Scale Down Video"
        visible={showScaleDialog}
        style={{ width: '450px' }}
        onHide={() => setShowScaleDialog(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => setShowScaleDialog(false)}
              className="p-button-text"
            />
            <Button
              label="Scale"
              icon="pi pi-arrows-alt"
              onClick={confirmScaleDown}
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block mb-2 font-semibold">File: {selectedFile?.name}</label>
          </div>
          <div>
            <label className="block mb-2">Scale to resolution:</label>
            <Dropdown
              value={scaleResolution}
              onChange={(e) => setScaleResolution(e.value)}
              options={[
                { label: '640x480 (480p)', value: '640x480' },
                { label: '854x480 (480p Wide)', value: '854x480' },
                { label: '1280x720 (720p HD)', value: '1280x720' },
                { label: '1920x1080 (1080p Full HD)', value: '1920x1080' },
                { label: '2560x1440 (1440p 2K)', value: '2560x1440' },
                { label: '3840x2160 (2160p 4K)', value: '3840x2160' }
              ]}
              className="w-full"
            />
          </div>
        </div>
      </Dialog>

      {/* Rename File Dialog */}
      <Dialog
        header="Rename File"
        visible={showRenameDialog}
        style={{ width: '450px' }}
        onHide={() => setShowRenameDialog(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => setShowRenameDialog(false)}
              className="p-button-text"
            />
            <Button
              label="Rename"
              icon="pi pi-pencil"
              onClick={confirmRename}
              disabled={!newFileName.trim()}
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block mb-2 font-semibold">Current: {selectedFile?.name}</label>
          </div>
          <div>
            <label className="block mb-2">New name:</label>
            <InputText
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="w-full"
              placeholder="Enter new file name"
              autoFocus
            />
            <small className="text-gray-500">Extension will be preserved</small>
          </div>
        </div>
      </Dialog>

      {/* Convert Image Dialog */}
      <Dialog
        header="Convert Image"
        visible={showImageConvertDialog}
        style={{ width: '450px' }}
        onHide={() => setShowImageConvertDialog(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => setShowImageConvertDialog(false)}
              className="p-button-text"
            />
            <Button
              label="Convert"
              icon="pi pi-replay"
              onClick={confirmConvertImage}
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block mb-2 font-semibold">File: {selectedFile?.name}</label>
          </div>
          <div>
            <label className="block mb-2">Convert to:</label>
            <Dropdown
              value={imageFormat}
              onChange={(e) => setImageFormat(e.value)}
              options={[
                { label: 'PNG', value: 'png' },
                { label: 'JPEG', value: 'jpeg' },
                { label: 'WEBP', value: 'webp' },
                { label: 'GIF', value: 'gif' }
              ]}
              className="w-full"
            />
          </div>
        </div>
      </Dialog>

      {/* Trim Video Dialog */}
      <Dialog
        header="Trim Video"
        visible={showTrimDialog}
        style={{ width: '550px' }}
        onHide={() => setShowTrimDialog(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => setShowTrimDialog(false)}
              className="p-button-text"
            />
            <Button
              label="Trim"
              icon="pi pi-scissors"
              onClick={confirmTrimVideo}
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block mb-2 font-semibold">File: {selectedFile?.name}</label>
            <p className="text-sm text-gray-500">Duration: {formatTime(videoDuration)}</p>
          </div>
          <div>
            <label className="block mb-2">Select time range to keep:</label>
            <div className="px-2">
              <Slider
                value={trimRange}
                onChange={(e) => setTrimRange(e.value as [number, number])}
                range
                min={0}
                max={videoDuration}
                step={0.1}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span>Start: {formatTime(trimRange[0])}</span>
              <span>End: {formatTime(trimRange[1])}</span>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Duration: {formatTime(trimRange[1] - trimRange[0])}
            </div>
          </div>
        </div>
      </Dialog>

      {/* File Table */}
      <Card onContextMenu={handleBackgroundContextMenu}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
            <p className={`mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <i className="pi pi-exclamation-circle text-4xl text-red-500 mb-3"></i>
            <p className="text-red-500">{error}</p>
          </div>
        ) : files.length === 0 ? (
          <div
            className="text-center py-12"
            onContextMenu={handleBackgroundContextMenu}
          >
            <i className={`pi pi-inbox text-4xl mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}></i>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Empty directory</p>
          </div>
        ) : (
          <DataTable
            value={files}
            stripedRows
            rows={20}
            selectionMode="single"
            onRowClick={(e) => {
              if (e.data.isDirectory) {
                onDirectoryClick(e.data.path);
              }
            }}
            onContextMenu={(e) => {
              if (e.data) {
                setSelectedFile(e.data as FileEntry);
              } else {
                setSelectedFile(null);
              }
              checkCopiedState();
              cm.current?.show(e.originalEvent);
            }}
            contextMenuSelection={selectedFile || undefined}
            onContextMenuSelectionChange={(e) => setSelectedFile(e.value as FileEntry)}
            className="cursor-pointer"
            emptyMessage={
              <div
                className="text-center py-8"
                onContextMenu={handleBackgroundContextMenu}
              >
                <i className={`pi pi-inbox text-4xl mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}></i>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Empty directory</p>
              </div>
            }
          >
            <Column field="name" header="Name" body={nameBodyTemplate} sortable></Column>
            <Column field="size" header="Size" body={sizeBodyTemplate} sortable></Column>
            <Column field="modified" header="Modified" body={modifiedBodyTemplate} sortable></Column>
          </DataTable>
        )}
      </Card>

      {/* Progress Bar */}
      {isOperating && (
        <div className="fixed bottom-0 left-0 right-0 bg-surface-0 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700 p-4">
          <div className="flex items-center gap-3 mb-2">
            <i className="pi pi-spin pi-spinner text-primary"></i>
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{operationMessage}</span>
          </div>
          <ProgressBar mode="indeterminate" style={{ height: '6px' }} />
        </div>
      )}
    </div>
  );
};

export default BrowserView;
