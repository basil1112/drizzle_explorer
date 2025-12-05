import React from 'react';
import { Card } from 'primereact/card';
import { ProgressBar } from 'primereact/progressbar';

interface DriveEntry {
  path: string;
  name: string;
  type: 'drive';
}

interface HomeViewProps {
  drives: DriveEntry[];
  darkMode: boolean;
  onDriveClick: (path: string, name: string) => void;
  onQuickAccessClick: (folderName: string) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ drives, darkMode, onDriveClick, onQuickAccessClick }) => {
  const quickAccessItems = [
    { name: 'Desktop', icon: 'pi pi-desktop' },
    { name: 'Downloads', icon: 'pi pi-download' },
    { name: 'Documents', icon: 'pi pi-file' },
    { name: 'Pictures', icon: 'pi pi-images' },
    { name: 'Music', icon: 'pi pi-volume-up' },
    { name: 'Videos', icon: 'pi pi-video' },
  ];

  return (
    <div className="p-6 min-h-screen">
      {/* Quick Access */}
      <h4 className={`mt-2 mb-4 text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        Quick Access
      </h4>
      <div className="grid grid-cols-6 gap-4 mb-8">
        {quickAccessItems.map((item) => (
          <Card
            key={item.name}
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => onQuickAccessClick(item.name)}
          >
            <div className="text-center">
              <i className={`${item.icon} text-3xl text-primary mb-2`}></i>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                {item.name}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Drives */}
      <h4 className={`mt-6 mb-4 text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        Drives
      </h4>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {drives.length === 0 ? (
          <div className="col-span-2">
            <Card>
              <div className={`text-center py-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Loading drives...
              </div>
            </Card>
          </div>
        ) : (
          drives.map((drive) => (
            <Card
              key={drive.path}
              className="cursor-pointer hover:shadow-lg transition-all"
              onClick={() => onDriveClick(drive.path, drive.name)}
            >
              <div className="flex items-center gap-3 mb-3">
                <i className="pi pi-database text-2xl text-primary"></i>
                <div className="flex-1">
                  <h5 className={`font-semibold text-base ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {drive.name}
                  </h5>
                </div>
              </div>
              <ProgressBar value={70} showValue={false} className="h-2" />
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default HomeView;
