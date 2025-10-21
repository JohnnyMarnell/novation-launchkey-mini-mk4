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

interface OledDisplayState {
  fields: string[];
  target: number;
}

class MidiHandler {
  private midiOut: midi.Output;
  private midiIn: midi.Input;
  private dawOut: midi.Output;
  private dawIn: midi.Input;
  private clients: Set<WebSocket> = new Set();
  private oledState: Map<number, OledDisplayState> = new Map();
  private lastPersistentText: string[] = [];

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

    // Listen for SysEx messages on DAW input
    this.dawIn.on('message', (_deltaTime: number, message: number[]) => {
      this.handleIncomingMidi(message);
    });

    this.dawIn.ignoreTypes(false, false, false); // Enable SysEx, timing, active sensing
  }

  addClient(ws: WebSocket) {
    this.clients.add(ws);
    console.log(`WebSocket client connected. Total clients: ${this.clients.size}`);

    // Send current persistent text to new client
    if (this.lastPersistentText.length > 0) {
      const message = JSON.stringify({
        type: 'oled-update',
        lines: this.lastPersistentText,
        isPersistent: true,
      });
      ws.send(message);
    }
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
            console.log(`[MIDI] Note On  → Note: ${message.note}, Velocity: ${message.velocity}, Channel: ${message.channel}`);
          }
          break;

        case 'note-off':
          if (message.note !== undefined) {
            const status = 0x80 | message.channel;
            this.midiOut.sendMessage([status, message.note, 0]);
            console.log(`[MIDI] Note Off → Note: ${message.note}, Channel: ${message.channel}`);
          }
          break;

        case 'cc':
          if (message.ccNumber !== undefined && message.value !== undefined) {
            const status = 0xB0 | message.channel;
            this.dawOut.sendMessage([status, message.ccNumber, message.value]);
            console.log(`[MIDI] CC (DAW) → CC: ${message.ccNumber}, Value: ${message.value}, Channel: ${message.channel}`);
          }
          break;

        case 'cc-standard':
          if (message.ccNumber !== undefined && message.value !== undefined) {
            const status = 0xB0 | message.channel;
            this.midiOut.sendMessage([status, message.ccNumber, message.value]);
            console.log(`[MIDI] CC (Std) → CC: ${message.ccNumber}, Value: ${message.value}, Channel: ${message.channel}`);
          }
          break;

        default:
          console.warn('Unknown MIDI message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling MIDI message:', error);
    }
  }

  private handleIncomingMidi(message: number[]) {
    // Check for SysEx messages (F0 ... F7)
    if (message[0] === 0xF0 && message[message.length - 1] === 0xF7) {
      this.parseSysEx(message);
    }
  }

  private parseSysEx(message: number[]) {
    // Novation SysEx: F0 00 20 29 02 13 ...payload... F7
    if (message.length < 8) return;
    if (message[1] !== 0x00 || message[2] !== 0x20 || message[3] !== 0x29) return; // Not Novation
    if (message[4] !== 0x02 || message[5] !== 0x13) return; // Not Launchkey Mini MK4

    const payload = message.slice(6, -1); // Remove header and F7
    if (payload.length < 2) return;

    const command = payload[0];

    if (command === 0x06) {
      // Set field: 06 <target> <field> ...ASCII bytes
      const target = payload[1];
      const field = payload[2];
      const text = String.fromCharCode(...payload.slice(3));

      // Store in state
      if (!this.oledState.has(target)) {
        this.oledState.set(target, { fields: [], target });
      }
      const state = this.oledState.get(target)!;
      state.fields[field] = text;

      console.log(`[OLED] Target: 0x${target.toString(16)}, Field: ${field}, Text: "${text}"`);
    } else if (command === 0x04 && payload.length >= 3 && payload[2] === 0x7F) {
      // Trigger display: 04 <target> 7F
      const target = payload[1];
      const state = this.oledState.get(target);

      if (state) {
        console.log(`[OLED] Display triggered for target 0x${target.toString(16)}:`, state.fields);

        // Broadcast to all WebSocket clients
        this.broadcastOledUpdate(state.fields, target);
      }
    }
  }

  private broadcastOledUpdate(fields: string[], target?: number) {
    const isPersistent = target === 0x20; // 0x20 = persistentText, 0x21 = text (temporary)
    const lines = fields.filter(f => f !== undefined);

    // Store persistent text for new clients
    if (isPersistent) {
      this.lastPersistentText = lines;
    }

    const message = JSON.stringify({
      type: 'oled-update',
      lines,
      isPersistent,
    });

    this.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
      }
    });
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
