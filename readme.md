# Drizzle File Explorer

A TypeScript-based Electron application that provides a file explorer with drive listing functionality for Windows, Ubuntu, and Mac.

## Features

- 📁 Browse all available drives on your system
- 🗂️ Navigate through directories
- 📊 View file details (name, size, last modified)
- ⬅️ Back button navigation
- 🎨 Modern dark-themed UI

## Installation

Install dependencies:
```bash
npm install
```

## Running the Application

Build and run:
```bash
npm start
```

Or for development (with watch mode in separate terminal):
```bash
npm run watch
npm run dev
```

## Project Structure

```
drizzle_explorer/
├── src/
│   ├── main.ts       # Electron main process
│   ├── preload.ts    # Preload script for IPC
│   └── renderer.ts   # Frontend logic
├── index.html        # UI
├── package.json
└── tsconfig.json
```

## Technologies Used

- Electron - Desktop application framework
- TypeScript - Type-safe JavaScript
- Node.js - File system operations 