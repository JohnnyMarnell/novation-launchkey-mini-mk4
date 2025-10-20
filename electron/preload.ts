// Preload script for Electron
// This runs before the renderer process loads

console.log('Preload script loaded');

// Expose any APIs needed by the renderer process
// For now, we're using nodeIntegration: true, so this is minimal
