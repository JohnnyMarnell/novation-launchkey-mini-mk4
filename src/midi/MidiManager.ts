import midi from '@julusian/midi';

export class MidiManager {
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
  }

  // Send Note On message
  sendNoteOn(note: number, velocity: number = 100, channel: number = 0) {
    const status = 0x90 | channel; // Note On
    this.midiOut.sendMessage([status, note, velocity]);
  }

  // Send Note Off message
  sendNoteOff(note: number, channel: number = 0) {
    const status = 0x80 | channel; // Note Off
    this.midiOut.sendMessage([status, note, 0]);
  }

  // Send Control Change message
  sendCC(ccNumber: number, value: number, channel: number = 0) {
    const status = 0xB0 | channel; // Control Change
    this.midiOut.sendMessage([status, ccNumber, value]);
  }

  // Close MIDI ports
  close() {
    this.midiOut.closePort();
    this.midiIn.closePort();
  }
}
