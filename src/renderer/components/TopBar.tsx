import React from 'react';
import { Button } from 'primereact/button';

interface TabState {
    id: number;
    title: string;
    view: 'home' | 'browser' | 'settings' | 'transfer';
    path: string;
    drive: string;
}

interface TopBarProps {
    tabs: TabState[];
    activeTabIndex: number;
    darkMode: boolean;
    onTabClick: (index: number) => void;
    onTabClose: (tabId: number) => void;
    onNewTab: () => void;
    onThemeToggle: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
    tabs,
    activeTabIndex,
    darkMode,
    onTabClick,
    onTabClose,
    onNewTab,
    onThemeToggle,
}) => {
    return (
        <div className={`flex items-center border-b ${darkMode ? 'bg-[#252526] border-[#3e3e42]' : 'bg-white border-gray-300'}`}>
            <div className="flex-1 flex items-center">
                {/* Tabs */}
                <div className="flex items-center overflow-x-auto">
                    {tabs.map((tab, index) => (
                        <div
                            key={tab.id}
                            className={`flex items-center gap-2 px-4 py-2 cursor-pointer border-r transition-colors ${activeTabIndex === index
                                    ? darkMode
                                        ? 'bg-[#1e1e1e] border-[#3e3e42]'
                                        : 'bg-[#f5f5f5] border-gray-300'
                                    : darkMode
                                        ? 'bg-[#2d2d30] hover:bg-[#2a2d2e] border-[#3e3e42]'
                                        : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
                                }`}
                            onClick={() => onTabClick(index)}
                        >
                            <i className={`pi ${tab.view === 'home' ? 'pi-home' : 'pi-folder'} text-sm`}></i>
                            <span className="text-sm whitespace-nowrap">{tab.title}</span>
                            {tabs.length > 1 && (
                                <button
                                    className={`ml-2 rounded hover:bg-opacity-20 ${darkMode ? 'hover:bg-gray-400' : 'hover:bg-gray-600'
                                        }`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onTabClose(tab.id);
                                    }}
                                >
                                    <i className="pi pi-times text-xs p-1"></i>
                                </button>
                            )}
                        </div>
                    ))}

                    {/* New Tab Button */}
                    <button
                        className={`px-3 py-2 transition-colors ${darkMode
                                ? 'hover:bg-[#2a2d2e] text-gray-400 hover:text-gray-200'
                                : 'hover:bg-gray-200 text-gray-600 hover:text-gray-800'
                            }`}
                        onClick={onNewTab}
                        title="New Tab"
                    >
                        <i className="pi pi-plus text-sm"></i>
                    </button>
                </div>
            </div>

            {/* Theme Toggle */}
            <div className="px-3">
                <Button
                    icon={darkMode ? 'pi pi-sun' : 'pi pi-moon'}
                    rounded
                    text
                    severity="secondary"
                    onClick={onThemeToggle}
                    tooltip={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                />
            </div>
        </div>
    );
};

export default TopBar;
