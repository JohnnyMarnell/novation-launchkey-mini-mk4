import WebSocketClient from '../websocket/WebSocketClient';

export class MidiManager {
  private wsClient: WebSocketClient;

  constructor() {
    console.log('MidiManager initialized - using WebSocket to communicate with server');
    this.wsClient = new WebSocketClient();
  }

  // Send Note On message via WebSocket
  sendNoteOn(note: number, velocity: number = 100, channel: number = 0) {
    this.wsClient.sendNoteOn(note, velocity, channel);
  }

  // Send Note Off message via WebSocket
  sendNoteOff(note: number, channel: number = 0) {
    this.wsClient.sendNoteOff(note, channel);
  }

  // Send Control Change message via WebSocket
  sendCC(ccNumber: number, value: number, channel: number = 0) {
    this.wsClient.sendCC(ccNumber, value, channel);
  }

  // Disconnect WebSocket when done
  disconnect() {
    this.wsClient.disconnect();
  }
}
