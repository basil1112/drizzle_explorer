import React from 'react';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { MenuItem } from 'primereact/menuitem';

interface BreadcrumbBarProps {
    currentPath: string;
    darkMode: boolean;
    onBack: () => void;
    onPathClick?: (path: string) => void;
}

const BreadcrumbBar: React.FC<BreadcrumbBarProps> = ({
    currentPath,
    darkMode,
    onBack,
    onPathClick,
}) => {
    // Parse the path into breadcrumb items
    const getBreadcrumbItems = (): MenuItem[] => {
        if (!currentPath) return [];

        const pathParts = currentPath.split('\\').filter(part => part);
        const items: MenuItem[] = [];

        pathParts.forEach((part, index) => {
            const pathUpToHere = pathParts.slice(0, index + 1).join('\\') + '\\';
            items.push({
                label: part,
                command: () => {
                    if (onPathClick) {
                        onPathClick(pathUpToHere);
                    }
                }
            });
        });

        return items;
    };

    const home: MenuItem = {
        icon: 'pi pi-home',
        command: () => {
            if (onBack) {
                onBack();
            }
        }
    };

    return (
        <div className={`flex items-center gap-3 px-4 py-2 border-b ${darkMode ? 'bg-[#252526] border-[#3e3e42]' : 'bg-gray-50 border-gray-300'
            }`}>
            <Button
                icon="pi pi-arrow-left"
                label="Back"
                onClick={onBack}
                severity="secondary"
                outlined
                size="small"
            />
            <div className="flex-1">
                <BreadCrumb
                    model={getBreadcrumbItems()}
                    home={home}
                    className={darkMode ? 'bg-transparent' : ''}
                />
            </div>

            <Button
                icon="pi pi-copy"
                onClick={() => {
                    navigator.clipboard.writeText(currentPath);
                }}
                severity="secondary"
                outlined
                tooltip='copy path'
                tooltipOptions={{ position: 'top' }}
                size="small"
            />

        </div>
    );
};

export default BreadcrumbBar;
