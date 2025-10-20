declare global {
  interface Window {
    electronAPI: {
      sendNoteOn: (note: number, velocity: number, channel: number) => void;
      sendNoteOff: (note: number, channel: number) => void;
      sendCC: (ccNumber: number, value: number, channel: number) => void;
    };
  }
}

export {};
