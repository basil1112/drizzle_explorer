import React, { useState, useEffect } from 'react';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import Sidebar from './Sidebar';
import HomeView from './HomeView';
import BrowserView from './BrowserView';
import TopBar from './TopBar';
import BreadcrumbBar from './BreadcrumbBar';
import PreviewPanel from './PreviewPanel';
import SettingsView from './SettingsView';
import TransferModal from './TransferModal';
import { TransferProvider, useTransfer } from '../contexts/TransferContext';

interface DriveEntry {
    path: string;
    name: string;
    type: 'drive';
}

interface FileEntry {
    name: string;
    path: string;
    isDirectory: boolean;
    size: number;
    modified: Date;
    type: 'file' | 'folder';
}

type ViewType = 'home' | 'browser' | 'settings';

interface TabState {
    id: number;
    title: string;
    view: ViewType;
    path: string;
    drive: string;
    files: FileEntry[];
    loading: boolean;
    error: string;
    selectedFile: FileEntry | null;
    viewMode: 'list' | 'grid';
}

const App: React.FC = () => {
    const [drives, setDrives] = useState<DriveEntry[]>([]);
    const [darkMode, setDarkMode] = useState<boolean>(true);
    const [tabs, setTabs] = useState<TabState[]>([
        {
            id: 0,
            title: 'Home',
            view: 'home',
            path: '',
            drive: '',
            files: [],
            loading: false,
            error: '',
            selectedFile: null,
            viewMode: 'list'
        }
    ]);
    const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
    const [nextTabId, setNextTabId] = useState<number>(1);
    const { startTransfer } = useTransfer();

    useEffect(() => {
        loadDrives();
        loadLayoutTheme();
    }, []);

    const loadLayoutTheme = async () => {
        try {
            const theme = await window.electronAPI.getLayoutTheme();
            if (theme) {
                setDarkMode(theme.darkMode);
                // Update all tabs with saved layout
                const updatedTabs = tabs.map(tab => ({
                    ...tab,
                    viewMode: theme.layout as 'list' | 'grid'
                }));
                setTabs(updatedTabs);
            }
        } catch (err) {
            console.error('Error loading layout theme:', err);
        }
    };

    useEffect(() => {
        // Update theme
        const theme = darkMode ? 'lara-dark-blue' : 'lara-light-blue';
        const link = document.getElementById('theme-link') as HTMLLinkElement;
        if (link) {
            link.href = `https://unpkg.com/primereact/resources/themes/${theme}/theme.css`;
        } else {
            const newLink = document.createElement('link');
            newLink.id = 'theme-link';
            newLink.rel = 'stylesheet';
            newLink.href = `https://unpkg.com/primereact/resources/themes/${theme}/theme.css`;
            document.head.appendChild(newLink);
        }

        // Update body background
        document.body.style.backgroundColor = darkMode ? '#1e1e1e' : '#f5f5f5';

        // Save dark mode to database (skip on initial load)
        if (tabs.length > 0) {
            window.electronAPI.updateDarkMode(darkMode).catch(err => {
                console.error('Error saving dark mode:', err);
            });
        }
    }, [darkMode]); 
    
    
    
    const loadDrives = async () => {
        try {
            const driveList = await window.electronAPI.getDrives();
            setDrives(driveList);
        } catch (err) {
            console.error('Error loading drives:', err);
        }
    };

    const addNewTab = () => {
        const newTab: TabState = {
            id: nextTabId,
            title: 'Home',
            view: 'home',
            path: '',
            drive: '',
            files: [],
            loading: false,
            error: '',
            selectedFile: null,
            viewMode: 'list'
        };
        setTabs([...tabs, newTab]);
        setActiveTabIndex(tabs.length);
        setNextTabId(nextTabId + 1);
    };

    const closeTab = (tabId: number) => {
        if (tabs.length === 1) return; // Keep at least one tab

        const tabIndex = tabs.findIndex(t => t.id === tabId);
        const newTabs = tabs.filter(t => t.id !== tabId);
        setTabs(newTabs);

        if (activeTabIndex >= newTabs.length) {
            setActiveTabIndex(newTabs.length - 1);
        } else if (tabIndex <= activeTabIndex) {
            setActiveTabIndex(Math.max(0, activeTabIndex - 1));
        }
    };

    const updateTab = (tabId: number, updates: Partial<TabState>) => {
        setTabs(prevTabs => prevTabs.map(tab =>
            tab.id === tabId ? { ...tab, ...updates } : tab
        ));
    };

    const selectDrive = (drivePath: string, driveName: string) => {
        const currentTab = tabs[activeTabIndex];
        updateTab(currentTab.id, {
            drive: driveName,
            view: 'browser',
            title: driveName
        });
        loadDirectory(drivePath);
    };

    const loadDirectory = async (dirPath: string) => {
        const currentTab = tabs[activeTabIndex];
        updateTab(currentTab.id, {
            loading: true,
            error: '',
            path: dirPath
        });

        try {
            const entries = await window.electronAPI.readDirectory(dirPath);

            // Sort: directories first, then by name
            entries.sort((a: FileEntry, b: FileEntry) => {
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                return a.name.localeCompare(b.name);
            });

            updateTab(currentTab.id, {
                files: entries,
                loading: false
            });
        } catch (err) {
            console.error('Error loading directory:', err);
            updateTab(currentTab.id, {
                error: 'Error loading directory. Access denied or path not found.',
                files: [],
                loading: false
            });
        }
    };

    const goBack = async () => {
        const currentTab = tabs[activeTabIndex];
        if (!currentTab.path) return;

        try {
            const parentPath = await window.electronAPI.getParentDirectory(currentTab.path);

            if (parentPath) {
                loadDirectory(parentPath);
            } else {
                // Go back to home view
                switchToHomeView();
            }
        } catch (err) {
            console.error('Error going back:', err);
        }
    };

    const switchToHomeView = () => {
        const currentTab = tabs[activeTabIndex];
        updateTab(currentTab.id, {
            view: 'home',
            path: '',
            drive: '',
            files: [],
            title: 'Home',
            selectedFile: null
        });
    };

    const openQuickAccessFolder = async (folderName: string) => {
        try {
            // Get the actual folder path from the system
            const folderPath = await window.electronAPI.getSpecialFolder(folderName);

            if (folderPath) {
                const currentTab = tabs[activeTabIndex];
                updateTab(currentTab.id, {
                    view: 'browser',
                    title: folderName
                });
                loadDirectory(folderPath);
            }
        } catch (err) {
            console.error('Error opening quick access folder:', err);
        }
    };

    const handleSettingsClick = () => {
        const currentTab = tabs[activeTabIndex];
        updateTab(currentTab.id, {
            view: 'settings',
            title: 'Settings',
            selectedFile: null
        });
    };

    const handleTransferClick = () => {
        // Open the transfer modal
        startTransfer(true); // Default to initiator mode, can add UI to choose
    };

    const handleFileSelect = (file: FileEntry) => {
        const currentTab = tabs[activeTabIndex];
        updateTab(currentTab.id, {
            selectedFile: file
        });
    };

    const handleClosePreview = () => {
        const currentTab = tabs[activeTabIndex];
        updateTab(currentTab.id, {
            selectedFile: null
        });
    };

    const handleViewModeChange = async (mode: 'list' | 'grid') => {
        const currentTab = tabs[activeTabIndex];
        updateTab(currentTab.id, {
            viewMode: mode
        });
        // Save layout to database
        try {
            await window.electronAPI.updateLayout(mode);
        } catch (err) {
            console.error('Error saving layout:', err);
        }
    };

    const currentTab = tabs[activeTabIndex];

    return (
        <div className={`h-screen flex flex-col ${darkMode ? 'bg-[#1e1e1e] text-[#ddd]' : 'bg-[#f5f5f5] text-[#333]'}`}>
            {/* Top Tab Bar */}
            <TopBar
                tabs={tabs}
                activeTabIndex={activeTabIndex}
                darkMode={darkMode}
                onTabClick={setActiveTabIndex}
                onTabClose={closeTab}
                onNewTab={addNewTab}
                onThemeToggle={() => setDarkMode(!darkMode)}
            />

            {/* Breadcrumb Bar */}
            {currentTab.view === 'browser' && (
                <BreadcrumbBar
                    currentPath={currentTab.path}
                    darkMode={darkMode}
                    onBack={goBack}
                    onPathClick={loadDirectory}
                    viewMode={currentTab.viewMode}
                    onViewModeChange={handleViewModeChange}
                />
            )}

            {/* Tab Content - Splitter with Sidebar | BrowserView | PreviewSection */}
            <div className="flex-1 overflow-hidden">
                <Splitter style={{ height: '100%' }} className={darkMode ? 'dark-splitter' : 'light-splitter'}>
                    {/* Sidebar Panel */}
                    <SplitterPanel size={15} minSize={10} style={{ overflow: 'hidden',maxWidth: '280px' }}>
                        <div className="h-full overflow-auto">
                            <Sidebar
                                drives={drives}
                                currentView={currentTab.view}
                                currentDrive={currentTab.drive}
                                darkMode={darkMode}
                                onHomeClick={switchToHomeView}
                                onDriveClick={selectDrive}
                                onQuickAccessClick={openQuickAccessFolder}
                                onSettingsClick={handleSettingsClick}
                                onTransferClick={handleTransferClick}
                            />
                        </div>
                    </SplitterPanel>

                    {/* BrowserView Panel */}
                    <SplitterPanel size={60} minSize={30} style={{ overflow: 'hidden' }}>
                        <div className="h-full w-full overflow-auto">
                            {currentTab.view === 'home' ? (
                                <HomeView
                                    drives={drives}
                                    darkMode={darkMode}
                                    onDriveClick={selectDrive}
                                    onQuickAccessClick={openQuickAccessFolder}
                                />
                            ) : currentTab.view === 'settings' ? (
                                <SettingsView darkMode={darkMode} />
                            ) : (
                                <BrowserView
                                    currentPath={currentTab.path}
                                    files={currentTab.files}
                                    loading={currentTab.loading}
                                    error={currentTab.error}
                                    darkMode={darkMode}
                                    onBack={goBack}
                                    onDirectoryClick={loadDirectory}
                                    onFileSelect={handleFileSelect}
                                    viewMode={currentTab.viewMode}
                                />
                            )}
                        </div>
                    </SplitterPanel>

                    {/* Preview Panel */}
                    <SplitterPanel  size={25} minSize={15} style={{ overflow: 'hidden',display: (currentTab.selectedFile && currentTab.view === 'browser') ? 'block' : 'none' }}>
                        <PreviewPanel
                            selectedFile={currentTab.selectedFile}
                            darkMode={darkMode}
                            onClose={handleClosePreview}
                        />
                    </SplitterPanel>
                </Splitter>
            </div>

            {/* Transfer Modal - floats above everything */}
            <TransferModal />
        </div>
    );
};

const AppWithProvider: React.FC = () => {
    return (
        <TransferProvider>
            <App />
        </TransferProvider>
    );
};

export default AppWithProvider;
