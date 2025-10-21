import midi from '@julusian/midi';
import type { WebSocket } from 'ws';

interface MidiMessage {
  type: 'note-on' | 'note-off' | 'cc' | 'cc-standard';
  note?: number;
  velocity?: number;
  channel: number;
  ccNumber?: number;
  value?: number;
}

class MidiHandler {
  private midiOut: midi.Output;
  private midiIn: midi.Input;
  private dawOut: midi.Output;
  private dawIn: midi.Input;
  private clients: Set<WebSocket> = new Set();

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
  }

  addClient(ws: WebSocket) {
    this.clients.add(ws);
    console.log(`WebSocket client connected. Total clients: ${this.clients.size}`);
  }

  removeClient(ws: WebSocket) {
    this.clients.delete(ws);
    console.log(`WebSocket client disconnected. Total clients: ${this.clients.size}`);
  }

  handleMessage(message: MidiMessage) {
    try {
      switch (message.type) {
        case 'note-on':
          if (message.note !== undefined && message.velocity !== undefined) {
            const status = 0x90 | message.channel;
            this.midiOut.sendMessage([status, message.note, message.velocity]);
          }
          break;

        case 'note-off':
          if (message.note !== undefined) {
            const status = 0x80 | message.channel;
            this.midiOut.sendMessage([status, message.note, 0]);
          }
          break;

        case 'cc':
          if (message.ccNumber !== undefined && message.value !== undefined) {
            const status = 0xB0 | message.channel;
            this.dawOut.sendMessage([status, message.ccNumber, message.value]);
          }
          break;

        case 'cc-standard':
          if (message.ccNumber !== undefined && message.value !== undefined) {
            const status = 0xB0 | message.channel;
            this.midiOut.sendMessage([status, message.ccNumber, message.value]);
          }
          break;

        default:
          console.warn('Unknown MIDI message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling MIDI message:', error);
    }
  }

  close() {
    this.midiOut.closePort();
    this.midiIn.closePort();
    this.dawOut.closePort();
    this.dawIn.closePort();
    this.clients.clear();
  }
}

export default MidiHandler;
