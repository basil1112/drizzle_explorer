# Project Structure

## Overview
The project follows a clean architecture pattern with separation of concerns:

```
drizzle_explorer/
├── src/
│   ├── controllers/          # Business logic controllers
│   │   └── FileSystemController.ts
│   ├── api/                  # IPC communication handlers
│   │   └── ipcHandlers.ts
│   ├── models/               # Data models and interfaces
│   │   ├── FileEntry.ts
│   │   ├── DriveEntry.ts
│   │   └── index.ts
│   ├── renderer/             # Frontend code
│   │   ├── preload.ts        # Electron preload script
│   │   └── renderer.ts       # UI logic
│   ├── main.ts               # Electron main process entry
│   └── types.d.ts            # Global type declarations
├── dist/                     # Compiled JavaScript (auto-generated)
├── index.html                # Application UI
├── package.json
├── tsconfig.json
└── readme.md
```

## Architecture

### Controllers (`src/controllers/`)
Contains business logic separated from the main process:
- **FileSystemController.ts**: Handles file system operations (get drives, read directories, navigate)

### API (`src/api/`)
Manages IPC (Inter-Process Communication) between main and renderer processes:
- **ipcHandlers.ts**: Registers and manages all IPC handlers using controllers

### Models (`src/models/`)
Defines data structures and interfaces:
- **FileEntry.ts**: Interface for file/folder entries
- **DriveEntry.ts**: Interface for drive entries
- **index.ts**: Barrel export for models

### Renderer (`src/renderer/`)
Frontend code that runs in the browser context:
- **preload.ts**: Securely exposes IPC methods to renderer via contextBridge
- **renderer.ts**: UI logic, DOM manipulation, and event handling

### Main Process
- **main.ts**: Electron application entry point, window management, and IPC setup

## Benefits of This Structure

1. **Separation of Concerns**: Each layer has a specific responsibility
2. **Maintainability**: Easy to locate and modify specific functionality
3. **Scalability**: Simple to add new features (controllers, models, API handlers)
4. **Testability**: Controllers can be unit tested independently
5. **Type Safety**: Shared models ensure consistency between main and renderer
6. **Security**: Preload script properly isolates IPC communication

## Adding New Features

### New File Operation
1. Add method to `FileSystemController.ts`
2. Register IPC handler in `ipcHandlers.ts`
3. Expose method in `preload.ts`
4. Use in `renderer.ts`

### New Data Model
1. Create interface in `src/models/NewModel.ts`
2. Export from `src/models/index.ts`
3. Import where needed using `import { NewModel } from '../models'`
