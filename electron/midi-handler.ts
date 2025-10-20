import { ipcMain } from 'electron';
import midi from '@julusian/midi';

class MidiHandler {
  private midiOut: midi.Output;
  private midiIn: midi.Input;

  constructor() {
    // Create virtual MIDI output port
    this.midiOut = new midi.Output();
    this.midiOut.openVirtualPort('Launchkey Mini MK4 MIDI Out');

    // Create virtual MIDI input port
    this.midiIn = new midi.Input();
    this.midiIn.openVirtualPort('Launchkey Mini MK4 MIDI In');

    console.log('Virtual MIDI ports created:');
    console.log('- Launchkey Mini MK4 MIDI Out');
    console.log('- Launchkey Mini MK4 MIDI In');

    this.setupIpcHandlers();
  }

  private setupIpcHandlers() {
    // Handle Note On
    ipcMain.on('midi:note-on', (_event, note: number, velocity: number, channel: number) => {
      const status = 0x90 | channel;
      this.midiOut.sendMessage([status, note, velocity]);
    });

    // Handle Note Off
    ipcMain.on('midi:note-off', (_event, note: number, channel: number) => {
      const status = 0x80 | channel;
      this.midiOut.sendMessage([status, note, 0]);
    });

    // Handle Control Change
    ipcMain.on('midi:cc', (_event, ccNumber: number, value: number, channel: number) => {
      const status = 0xB0 | channel;
      this.midiOut.sendMessage([status, ccNumber, value]);
    });
  }

  close() {
    this.midiOut.closePort();
    this.midiIn.closePort();
  }
}

export default MidiHandler;
