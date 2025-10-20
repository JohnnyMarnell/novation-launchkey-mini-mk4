// Preload script for Electron
// This runs before the renderer process loads

import { ipcRenderer } from 'electron';

console.log('Preload script loaded');

// Expose MIDI API to renderer process
window.electronAPI = {
  sendNoteOn: (note: number, velocity: number, channel: number) => {
    ipcRenderer.send('midi:note-on', note, velocity, channel);
  },
  sendNoteOff: (note: number, channel: number) => {
    ipcRenderer.send('midi:note-off', note, channel);
  },
  sendCC: (ccNumber: number, value: number, channel: number) => {
    ipcRenderer.send('midi:cc', ccNumber, value, channel);
  }
};

declare global {
  interface Window {
    electronAPI: {
      sendNoteOn: (note: number, velocity: number, channel: number) => void;
      sendNoteOff: (note: number, channel: number) => void;
      sendCC: (ccNumber: number, value: number, channel: number) => void;
    };
  }
}
