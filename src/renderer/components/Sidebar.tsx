import React, { useState } from 'react';
import { Menu } from 'primereact/menu';
import { MenuItem } from 'primereact/menuitem';

interface DriveEntry {
  path: string;
  name: string;
  type: 'drive';
}

interface SidebarProps {
  drives: DriveEntry[];
  currentView: 'home' | 'browser' | 'settings' | 'transfer';
  currentDrive: string;
  darkMode: boolean;
  onHomeClick: () => void;
  onDriveClick: (path: string, name: string) => void;
  onQuickAccessClick: (folderName: string) => void;
  onSettingsClick?: () => void;
  onTransferClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  drives,
  currentView,
  currentDrive,
  darkMode,
  onHomeClick,
  onDriveClick,
  onQuickAccessClick,
  onSettingsClick,
  onTransferClick,
}) => {
  const [isPinnedExpanded, setIsPinnedExpanded] = useState(true);
  const [isDrivesExpanded, setIsDrivesExpanded] = useState(true);
  const [isQuickAccessExpanded, setIsQuickAccessExpanded] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pinnedItems: MenuItem[] = [
    {
      label: 'Home',
      icon: 'pi pi-home',
      command: () => onHomeClick(),
      className: currentView === 'home' ? 'bg-primary' : '',
    }
  ];

  const driveItems: MenuItem[] = drives.map(drive => ({
    label: drive.name,
    icon: 'pi pi-database',
    command: () => onDriveClick(drive.path, drive.name),
    className: currentDrive === drive.name ? 'bg-primary' : '',
  }));

  const quickAccessItems: MenuItem[] = [
    {
      label: 'Desktop',
      icon: 'pi pi-desktop',
      command: () => onQuickAccessClick('Desktop'),
    },
    {
      label: 'Downloads',
      icon: 'pi pi-download',
      command: () => onQuickAccessClick('Downloads'),
    },
    {
      label: 'Documents',
      icon: 'pi pi-file',
      command: () => onQuickAccessClick('Documents'),
    },
    {
      label: 'Pictures',
      icon: 'pi pi-images',
      command: () => onQuickAccessClick('Pictures'),
    },
    {
      label: 'Music',
      icon: 'pi pi-volume-up',
      command: () => onQuickAccessClick('Music'),
    },
    {
      label: 'Videos',
      icon: 'pi pi-video',
      command: () => onQuickAccessClick('Videos'),
    }
  ];

  const bottomMenuItems: MenuItem[] = [
    {
      label: 'Transfer',
      icon: 'pi pi-arrow-right-arrow-left',
      command: () => onTransferClick?.(),
    },
    {
      label: 'Settings',
      icon: 'pi pi-cog',
      command: () => onSettingsClick?.(),
    }
  ];

  return (
    <div className={`${isCollapsed ? 'w-[60px]' : 'w-[280px]'} h-full border-r flex flex-col transition-all duration-300 ${darkMode ? 'bg-[#1e1e1e] border-[#3e3e42]' : 'bg-white border-gray-200'
      }`}>
      
      {/* Hamburger Menu Header */}
      <div className={`p-3 border-b ${darkMode ? 'border-[#3e3e42]' : 'border-gray-200'}`}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`${isCollapsed ? 'w-full' : 'w-full'} flex items-center ${isCollapsed ? 'justify-center' : 'justify-start px-2'} p-2 rounded transition-colors ${
            darkMode ? 'hover:bg-[#2d2d30]' : 'hover:bg-gray-100'
          }`}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <i className={`pi pi-bars text-xl ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}></i>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {!isCollapsed ? (
          <>
            {/* Pinned Section */}
            <div className="mb-4">
              <div 
                className={`flex items-center justify-between px-2 py-1 cursor-pointer rounded transition-colors ${
                  darkMode ? 'hover:bg-[#2d2d30]' : 'hover:bg-gray-100'
                }`}
                onClick={() => setIsPinnedExpanded(!isPinnedExpanded)}
              >
                <h6 className={`text-xs uppercase font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Pinned
                </h6>
                <i className={`pi ${isPinnedExpanded ? 'pi-chevron-down' : 'pi-chevron-right'} text-xs ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}></i>
              </div>
              <div 
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isPinnedExpanded ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'
                }`}
              >
                <Menu model={pinnedItems} className="w-full border-none bg-transparent" />
              </div>
            </div>

            {/* Drives Section */}
            <div className="mb-4">
              <div 
                className={`flex items-center justify-between px-2 py-1 cursor-pointer rounded transition-colors ${
                  darkMode ? 'hover:bg-[#2d2d30]' : 'hover:bg-gray-100'
                }`}
                onClick={() => setIsDrivesExpanded(!isDrivesExpanded)}
              >
                <h6 className={`text-xs uppercase font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Drives
                </h6>
                <i className={`pi ${isDrivesExpanded ? 'pi-chevron-down' : 'pi-chevron-right'} text-xs ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}></i>
              </div>
              <div 
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isDrivesExpanded ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'
                }`}
              >
                {drives.length === 0 ? (
                  <div className={`text-xs p-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Loading drives...
                  </div>
                ) : (
                  <Menu model={driveItems} className="w-full border-none bg-transparent" />
                )}
              </div>
            </div>

            {/* Quick Access Section */}
            <div className="mb-4">
              <div 
                className={`flex items-center justify-between px-2 py-1 cursor-pointer rounded transition-colors ${
                  darkMode ? 'hover:bg-[#2d2d30]' : 'hover:bg-gray-100'
                }`}
                onClick={() => setIsQuickAccessExpanded(!isQuickAccessExpanded)}
              >
                <h6 className={`text-xs uppercase font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Quick Access
                </h6>
                <i className={`pi ${isQuickAccessExpanded ? 'pi-chevron-down' : 'pi-chevron-right'} text-xs ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}></i>
              </div>
              <div 
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isQuickAccessExpanded ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'
                }`}
              >
                <Menu model={quickAccessItems} className="w-full border-none bg-transparent" />
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Collapsed Icons Only View */}
            <button
              onClick={onHomeClick}
              className={`p-3 rounded transition-colors ${
                currentView === 'home' 
                  ? darkMode ? 'bg-[#094771]' : 'bg-blue-100'
                  : darkMode ? 'hover:bg-[#2d2d30]' : 'hover:bg-gray-100'
              }`}
              title="Home"
            >
              <i className="pi pi-home text-lg"></i>
            </button>
            
            {drives.map((drive, index) => (
              <button
                key={index}
                onClick={() => onDriveClick(drive.path, drive.name)}
                className={`p-3 rounded transition-colors ${
                  currentDrive === drive.name 
                    ? darkMode ? 'bg-[#094771]' : 'bg-blue-100'
                    : darkMode ? 'hover:bg-[#2d2d30]' : 'hover:bg-gray-100'
                }`}
                title={drive.name}
              >
                <i className="pi pi-database text-lg"></i>
              </button>
            ))}
            
            <div className={`my-2 border-t ${darkMode ? 'border-[#3e3e42]' : 'border-gray-200'}`}></div>
            
            <button
              onClick={() => onQuickAccessClick('Desktop')}
              className={`p-3 rounded transition-colors ${darkMode ? 'hover:bg-[#2d2d30]' : 'hover:bg-gray-100'}`}
              title="Desktop"
            >
              <i className="pi pi-desktop text-lg"></i>
            </button>
            <button
              onClick={() => onQuickAccessClick('Downloads')}
              className={`p-3 rounded transition-colors ${darkMode ? 'hover:bg-[#2d2d30]' : 'hover:bg-gray-100'}`}
              title="Downloads"
            >
              <i className="pi pi-download text-lg"></i>
            </button>
            <button
              onClick={() => onQuickAccessClick('Documents')}
              className={`p-3 rounded transition-colors ${darkMode ? 'hover:bg-[#2d2d30]' : 'hover:bg-gray-100'}`}
              title="Documents"
            >
              <i className="pi pi-file text-lg"></i>
            </button>
            <button
              onClick={() => onQuickAccessClick('Pictures')}
              className={`p-3 rounded transition-colors ${darkMode ? 'hover:bg-[#2d2d30]' : 'hover:bg-gray-100'}`}
              title="Pictures"
            >
              <i className="pi pi-images text-lg"></i>
            </button>
            <button
              onClick={() => onQuickAccessClick('Music')}
              className={`p-3 rounded transition-colors ${darkMode ? 'hover:bg-[#2d2d30]' : 'hover:bg-gray-100'}`}
              title="Music"
            >
              <i className="pi pi-volume-up text-lg"></i>
            </button>
            <button
              onClick={() => onQuickAccessClick('Videos')}
              className={`p-3 rounded transition-colors ${darkMode ? 'hover:bg-[#2d2d30]' : 'hover:bg-gray-100'}`}
              title="Videos"
            >
              <i className="pi pi-video text-lg"></i>
            </button>
          </div>
        )}
      </div>

      <div className={`p-4 border-t ${darkMode ? 'border-[#3e3e42]' : 'border-gray-200'}`}>
        {!isCollapsed ? (
          <Menu model={bottomMenuItems} className="w-full border-none bg-transparent" />
        ) : (
          <div className="flex flex-col gap-2">
            <button
              onClick={onTransferClick}
              className={`p-3 rounded transition-colors ${darkMode ? 'hover:bg-[#2d2d30]' : 'hover:bg-gray-100'}`}
              title="Transfer"
            >
              <i className="pi pi-arrow-right-arrow-left text-lg"></i>
            </button>
            <button
              onClick={onSettingsClick}
              className={`p-3 rounded transition-colors ${darkMode ? 'hover:bg-[#2d2d30]' : 'hover:bg-gray-100'}`}
              title="Settings"
            >
              <i className="pi pi-cog text-lg"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
