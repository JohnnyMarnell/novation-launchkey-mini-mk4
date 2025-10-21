import { ipcMain } from 'electron';
import midi from '@julusian/midi';

class MidiHandler {
  private midiOut: midi.Output;
  private midiIn: midi.Input;
  private dawOut: midi.Output;
  private dawIn: midi.Input;

  constructor() {
    // Create virtual MIDI ports (standard)
    this.midiOut = new midi.Output();
    this.midiOut.openVirtualPort('Launchkey Mini MK4 MIDI Out');

    this.midiIn = new midi.Input();
    this.midiIn.openVirtualPort('Launchkey Mini MK4 MIDI In');

    // Create virtual MIDI ports (DAW)
    this.dawOut = new midi.Output();
    this.dawOut.openVirtualPort('Launchkey Mini MK4 DAW Out');

    this.dawIn = new midi.Input();
    this.dawIn.openVirtualPort('Launchkey Mini MK4 DAW In');

    console.log('Virtual MIDI ports created:');
    console.log('- Launchkey Mini MK4 MIDI Out');
    console.log('- Launchkey Mini MK4 MIDI In');
    console.log('- Launchkey Mini MK4 DAW Out');
    console.log('- Launchkey Mini MK4 DAW In');

    this.setupIpcHandlers();
  }

  private setupIpcHandlers() {
    // Handle Note On - sent to standard MIDI port
    ipcMain.on('midi:note-on', (_event, note: number, velocity: number, channel: number) => {
      const status = 0x90 | channel;
      this.midiOut.sendMessage([status, note, velocity]);
    });

    // Handle Note Off - sent to standard MIDI port
    ipcMain.on('midi:note-off', (_event, note: number, channel: number) => {
      const status = 0x80 | channel;
      this.midiOut.sendMessage([status, note, 0]);
    });

    // Handle Control Change - sent to DAW port
    ipcMain.on('midi:cc', (_event, ccNumber: number, value: number, channel: number) => {
      const status = 0xB0 | channel;
      this.dawOut.sendMessage([status, ccNumber, value]);
    });

    // Also send CC to standard MIDI port for compatibility
    ipcMain.on('midi:cc-standard', (_event, ccNumber: number, value: number, channel: number) => {
      const status = 0xB0 | channel;
      this.midiOut.sendMessage([status, ccNumber, value]);
    });
  }

  close() {
    this.midiOut.closePort();
    this.midiIn.closePort();
    this.dawOut.closePort();
    this.dawIn.closePort();
  }
}

export default MidiHandler;
