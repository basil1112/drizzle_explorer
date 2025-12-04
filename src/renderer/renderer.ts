let currentPath: string = '';
let currentDrive: string = '';
let currentView: 'home' | 'browser' = 'home';

// Load drives on startup
async function loadDrives() {
  const driveList = document.getElementById('driveList')!;
  const drivesGrid = document.getElementById('drivesGrid')!;
  
  try {
    const drives = await window.electronAPI.getDrives();
    
    if (drives.length === 0) {
      driveList.innerHTML = '<div class="error" style="font-size: 12px; padding: 10px;">No drives found</div>';
      drivesGrid.innerHTML = '<div class="col-12"><div class="error">No drives found</div></div>';
      return;
    }
    
    // Populate sidebar drives
    driveList.innerHTML = '';
    drives.forEach(drive => {
      const link = document.createElement('a');
      link.href = '#';
      link.className = 'drive-link';
      link.textContent = `💾 ${drive.name}`;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        selectDrive(drive.path, drive.name);
      });
        driveList.appendChild(link);
    });

    // Populate home view drives grid
    drivesGrid.innerHTML = '';
    for (const drive of drives) {
      const driveInfo = await getDriveInfo(drive.path);
      const col = document.createElement('div');
      col.className = 'col-md-6';
      col.innerHTML = `
        <div class="drive-card" data-path="${drive.path}">
          <strong>💾 ${drive.name}</strong>
          <p class="mt-2 mb-1">${driveInfo}</p>
          <div class="progress">
            <div class="progress-bar bg-secondary" style="width: 70%;"></div>
          </div>
        </div>
      `;
      col.querySelector('.drive-card')!.addEventListener('click', () => {
        selectDrive(drive.path, drive.name);
      });
      drivesGrid.appendChild(col);
    }
  } catch (error) {
    console.error('Error loading drives:', error);
    driveList.innerHTML = '<div class="error" style="font-size: 12px; padding: 10px;">Error loading drives</div>';
    drivesGrid.innerHTML = '<div class="col-12"><div class="error">Error loading drives</div></div>';
  }
}

async function getDriveInfo(drivePath: string): Promise<string> {
  try {
    const entries = await window.electronAPI.readDirectory(drivePath);
    return `${entries.length} items`;
  } catch (error) {
    return 'Unable to read';
  }
}

function selectDrive(drivePath: string, driveName: string) {
  // Remove active class from all sidebar links
  document.querySelectorAll('.sidebar a').forEach(item => {
    item.classList.remove('active');
  });
  
  // Add active class to selected drive in sidebar
  document.querySelectorAll('.drive-link').forEach(link => {
    if (link.textContent?.includes(driveName)) {
      link.classList.add('active');
    }
  });
  
  currentDrive = drivePath;
  switchToBrowserView();
  loadDirectory(drivePath);
}

function switchToBrowserView() {
  currentView = 'browser';
  document.getElementById('homeView')!.style.display = 'none';
  document.getElementById('browserView')!.classList.add('active');
}

function switchToHomeView() {
  currentView = 'home';
  document.getElementById('homeView')!.style.display = 'block';
  document.getElementById('browserView')!.classList.remove('active');
  
  // Remove active class from all sidebar links
  document.querySelectorAll('.sidebar a').forEach(item => {
    item.classList.remove('active');
  });
  document.getElementById('homeLink')!.classList.add('active');
  
  // Reset browser state
  currentPath = '';
  currentDrive = '';
  (document.getElementById('backButton') as HTMLButtonElement).disabled = true;
}

async function loadDirectory(dirPath: string) {
  const fileTableBody = document.getElementById('fileTableBody')!;
  const currentPathElement = document.getElementById('currentPath')!;
  const backButton = document.getElementById('backButton') as HTMLButtonElement;
  
  currentPath = dirPath;
  currentPathElement.textContent = dirPath;
  
  // Show loading
  fileTableBody.innerHTML = '<tr><td colspan="3" class="loading">Loading...</td></tr>';
  
  try {
    const entries = await window.electronAPI.readDirectory(dirPath);
    
    if (entries.length === 0) {
      fileTableBody.innerHTML = '<tr><td colspan="3" class="empty-state">Empty directory</td></tr>';
      backButton.disabled = false;
      return;
    }
    
    // Sort: directories first, then by name
    entries.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
    
    fileTableBody.innerHTML = '';
    
    entries.forEach(entry => {
      const row = document.createElement('tr');
      
      const icon = entry.isDirectory ? 
        '<span class="file-icon folder-icon">📁</span>' : 
        '<span class="file-icon file-icon-generic">📄</span>';
      
      const size = entry.isDirectory ? '-' : formatFileSize(entry.size);
      const modified = new Date(entry.modified).toLocaleString();
      
      row.innerHTML = `
        <td>${icon}${entry.name}</td>
        <td>${size}</td>
        <td>${modified}</td>
      `;
      
      if (entry.isDirectory) {
        row.addEventListener('click', () => loadDirectory(entry.path));
      }
      
      fileTableBody.appendChild(row);
    });
    
    // Enable back button
    backButton.disabled = false;
    
  } catch (error) {
    console.error('Error loading directory:', error);
    fileTableBody.innerHTML = '<tr><td colspan="3" class="error">Error loading directory. Access denied or path not found.</td></tr>';
    backButton.disabled = false;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function goBack() {
  if (!currentPath) return;
  
  try {
    const parentPath = await window.electronAPI.getParentDirectory(currentPath);
    
    if (parentPath) {
      loadDirectory(parentPath);
    } else {
      // We're at the root of a drive, go back to home view
      switchToHomeView();
    }
  } catch (error) {
    console.error('Error going back:', error);
  }
}

async function openQuickAccessFolder(folderName: string) {
  try {
    // Get user's home directory from first drive and navigate to common folders
    const drives = await window.electronAPI.getDrives();
    if (drives.length > 0) {
      // Try to construct path to user folder (Windows-specific for now)
      const userProfile = process.env.USERPROFILE || 'C:\\Users\\' + (process.env.USERNAME || 'User');
      let folderPath = '';
      
      switch (folderName) {
        case 'Desktop':
          folderPath = userProfile + '\\Desktop';
          break;
        case 'Downloads':
          folderPath = userProfile + '\\Downloads';
          break;
        case 'Documents':
          folderPath = userProfile + '\\Documents';
          break;
        case 'Pictures':
          folderPath = userProfile + '\\Pictures';
          break;
        case 'Music':
          folderPath = userProfile + '\\Music';
          break;
        case 'Videos':
          folderPath = userProfile + '\\Videos';
          break;
      }
      
      if (folderPath) {
        switchToBrowserView();
        loadDirectory(folderPath);
      }
    }
  } catch (error) {
    console.error('Error opening quick access folder:', error);
  }
}

// Event listeners
document.getElementById('backButton')!.addEventListener('click', goBack);

document.getElementById('homeLink')!.addEventListener('click', (e) => {
  e.preventDefault();
  switchToHomeView();
});

// Quick access tiles in home view
document.querySelectorAll('.quick-tile').forEach(tile => {
  tile.addEventListener('click', () => {
    const folderName = tile.getAttribute('data-path');
    if (folderName) {
      openQuickAccessFolder(folderName);
    }
  });
});

// Quick access links in sidebar
document.querySelectorAll('.quick-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const folderName = (link as HTMLElement).getAttribute('data-path');
    if (folderName) {
      openQuickAccessFolder(folderName);
    }
  });
});

// Initialize
switchToHomeView();
loadDrives();
