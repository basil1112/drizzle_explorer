import React from 'react';
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
    <div className={`w-[280px] h-full border-r flex flex-col ${darkMode ? 'bg-[#1e1e1e] border-[#3e3e42]' : 'bg-white border-gray-200'
      }`}>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <h6 className={`text-xs uppercase font-semibold mb-2 px-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
            Pinned
          </h6>
          <Menu model={pinnedItems} className="w-full border-none bg-transparent" />
        </div>

        <div className="mb-4">
          <h6 className={`text-xs uppercase font-semibold mb-2 px-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
            Drives
          </h6>
          {drives.length === 0 ? (
            <div className={`text-xs p-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Loading drives...
            </div>
          ) : (
            <Menu model={driveItems} className="w-full border-none bg-transparent" />
          )}
        </div>

        <div className="mb-4">
          <h6 className={`text-xs uppercase font-semibold mb-2 px-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
            Quick Access
          </h6>
          <Menu model={quickAccessItems} className="w-full border-none bg-transparent" />
        </div>
      </div>

      <div className={`p-4 border-t ${darkMode ? 'border-[#3e3e42]' : 'border-gray-200'}`}>
        <Menu model={bottomMenuItems} className="w-full border-none bg-transparent" />
      </div>
    </div>
  );
};

export default Sidebar;
