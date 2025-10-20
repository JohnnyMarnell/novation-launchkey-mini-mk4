export class MidiManager {
  constructor() {
    console.log('MidiManager initialized - using IPC to communicate with main process');
  }

  // Send Note On message via IPC
  sendNoteOn(note: number, velocity: number = 100, channel: number = 0) {
    if (window.electronAPI) {
      window.electronAPI.sendNoteOn(note, velocity, channel);
    }
  }

  // Send Note Off message via IPC
  sendNoteOff(note: number, channel: number = 0) {
    if (window.electronAPI) {
      window.electronAPI.sendNoteOff(note, channel);
    }
  }

  // Send Control Change message via IPC
  sendCC(ccNumber: number, value: number, channel: number = 0) {
    if (window.electronAPI) {
      window.electronAPI.sendCC(ccNumber, value, channel);
    }
  }
}
