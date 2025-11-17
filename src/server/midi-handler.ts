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
  // Virtual ports (always created)
  private virtualMidiOut: midi.Output;
  private virtualMidiIn: midi.Input;
  private virtualDawOut: midi.Output;
  private virtualDawIn: midi.Input;

  // Real device ports (optional)
  private realMidiOut: midi.Output | null = null;
  private realMidiIn: midi.Input | null = null;
  private realDawOut: midi.Output | null = null;
  private realDawIn: midi.Input | null = null;

  private clients: Set<WebSocket> = new Set();
  private oledState: Map<number, OledDisplayState> = new Map();
  private lastPersistentText: string[] = [];

  constructor() {
    // Always create virtual MIDI ports
    this.virtualMidiOut = new midi.Output();
    this.virtualMidiOut.openVirtualPort('Launchkey Mini MK4 VIRTUAL MIDI Out');

    this.virtualMidiIn = new midi.Input();
    this.virtualMidiIn.openVirtualPort('Launchkey Mini MK4 VIRTUAL MIDI In');

    this.virtualDawOut = new midi.Output();
    this.virtualDawOut.openVirtualPort('Launchkey Mini MK4 VIRTUAL DAW Out');

    this.virtualDawIn = new midi.Input();
    this.virtualDawIn.openVirtualPort('Launchkey Mini MK4 VIRTUAL DAW In');

    console.log('✅ Virtual MIDI ports created');

    // Try to find real hardware
    const realDevice = this.findRealDevice();
    if (realDevice) {
      this.connectRealDevice(realDevice);
    }

    // Listen for messages from virtual DAW input (from jam app - for GUI/SysEx)
    this.virtualDawIn.on('message', (_deltaTime: number, message: number[]) => {
      // Forward to real device if connected (for OLED updates)
      if (this.realDawOut) {
        this.realDawOut.sendMessage(message);
      }
      // Also handle for GUI
      this.handleIncomingMidi(message);
    });
    this.virtualDawIn.ignoreTypes(false, false, false);

    // Listen for messages from virtual MIDI input (from jam app - for LED feedback)
    this.virtualMidiIn.on('message', (_deltaTime: number, message: number[]) => {
      // Forward to real device if connected (for pad LEDs)
      if (this.realMidiOut) {
        this.realMidiOut.sendMessage(message);
      }
    });
    this.virtualMidiIn.ignoreTypes(false, false, false);
  }

  private findRealDevice() {
    const outPorts = new midi.Output();
    const inPorts = new midi.Input();

    let midiOutPort = -1, midiInPort = -1, dawOutPort = -1, dawInPort = -1;
    let midiOutName = '', midiInName = '', dawOutName = '', dawInName = '';

    // Find real hardware ports (not VIRTUAL)
    for (let i = 0; i < outPorts.getPortCount(); i++) {
      const name = outPorts.getPortName(i);
      if (name.includes('Launchkey Mini MK4') && !name.includes('VIRTUAL')) {
        if (name.includes('MIDI In')) {
          midiOutPort = i;
          midiOutName = name;
        }
        if (name.includes('DAW In')) {
          dawOutPort = i;
          dawOutName = name;
        }
      }
    }

    for (let i = 0; i < inPorts.getPortCount(); i++) {
      const name = inPorts.getPortName(i);
      if (name.includes('Launchkey Mini MK4') && !name.includes('VIRTUAL')) {
        if (name.includes('MIDI Out')) {
          midiInPort = i;
          midiInName = name;
        }
        if (name.includes('DAW Out')) {
          dawInPort = i;
          dawInName = name;
        }
      }
    }

    outPorts.closePort();
    inPorts.closePort();

    if (midiOutPort >= 0 && midiInPort >= 0 && dawOutPort >= 0 && dawInPort >= 0) {
      return { midiOutPort, midiInPort, dawOutPort, dawInPort, midiOutName, midiInName, dawOutName, dawInName };
    }
    return null;
  }

  private connectRealDevice(device: { midiOutPort: number, midiInPort: number, dawOutPort: number, dawInPort: number, midiOutName: string, midiInName: string, dawOutName: string, dawInName: string }) {
    console.log('🎹 Real hardware detected - setting up bridge');

    // Connect to real device
    this.realMidiOut = new midi.Output();
    this.realMidiOut.openPort(device.midiOutPort);

    this.realMidiIn = new midi.Input();
    this.realMidiIn.openPort(device.midiInPort);

    this.realDawOut = new midi.Output();
    this.realDawOut.openPort(device.dawOutPort);

    this.realDawIn = new midi.Input();
    this.realDawIn.openPort(device.dawInPort);

    // Bridge: Real device inputs → Virtual outputs (like GUI does)
    this.realMidiIn.on('message', (_deltaTime: number, message: number[]) => {
      this.virtualMidiOut.sendMessage(message);
      this.handleIncomingMidi(message); // For GUI visual feedback
    });
    this.realMidiIn.ignoreTypes(false, false, false);

    this.realDawIn.on('message', (_deltaTime: number, message: number[]) => {
      this.virtualDawOut.sendMessage(message);
      this.handleIncomingMidi(message); // For GUI visual feedback
    });
    this.realDawIn.ignoreTypes(false, false, false);

    console.log('✅ Bridge active: Real hardware ↔ Virtual ports');
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
            this.virtualMidiOut.sendMessage([status, message.note, message.velocity]);
            console.log(`[GUI→Virtual] Note On  → Note: ${message.note}, Velocity: ${message.velocity}, Channel: ${message.channel}`);
          }
          break;

        case 'note-off':
          if (message.note !== undefined) {
            const status = 0x80 | message.channel;
            this.virtualMidiOut.sendMessage([status, message.note, 0]);
            console.log(`[GUI→Virtual] Note Off → Note: ${message.note}, Channel: ${message.channel}`);
          }
          break;

        case 'cc':
          if (message.ccNumber !== undefined && message.value !== undefined) {
            const status = 0xB0 | message.channel;
            this.virtualDawOut.sendMessage([status, message.ccNumber, message.value]);
            console.log(`[GUI→Virtual] CC → CC: ${message.ccNumber}, Value: ${message.value}, Channel: ${message.channel}`);
          }
          break;

        case 'cc-standard':
          if (message.ccNumber !== undefined && message.value !== undefined) {
            const status = 0xB0 | message.channel;
            this.virtualMidiOut.sendMessage([status, message.ccNumber, message.value]);
            console.log(`[GUI→Virtual] CC (Std) → CC: ${message.ccNumber}, Value: ${message.value}, Channel: ${message.channel}`);
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
    } else if (message.length === 3) {
      const [status, data, value] = message
      const channel = (status & 0x0F);
      const type = status & 0xF0;
      console.log(`[DAW midi] type=0x${type.toString(16).toUpperCase()}, channel=${channel}, data=${data}, value=${value}`);
      this.broadcast({type: 'midi', midiType: type, channel, data, value })
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

      // console.log(`[OLED] Target: 0x${target.toString(16)}, Field: ${field}, Text: "${text}"`);
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

    this.broadcast({
      type: 'oled-update',
      lines,
      isPersistent,
    })
  }

  private broadcast(msg: any) {
    this.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify(msg));
      }
    });
  }

  close() {
    // Close virtual ports
    this.virtualMidiOut.closePort();
    this.virtualMidiIn.closePort();
    this.virtualDawOut.closePort();
    this.virtualDawIn.closePort();

    // Close real device ports if connected
    if (this.realMidiOut) this.realMidiOut.closePort();
    if (this.realMidiIn) this.realMidiIn.closePort();
    if (this.realDawOut) this.realDawOut.closePort();
    if (this.realDawIn) this.realDawIn.closePort();

    this.clients.clear();
  }
}

export default MidiHandler;
