class MidiInterface {
  private ws: WebSocket | null = null;
  private reconnectDelay = 1000;

  constructor() {
    this.connect();
  }

  private connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('[MIDI] Connected');
      this.reconnectDelay = 1000;
    };

    this.ws.onclose = () => {
      console.log('[MIDI] Disconnected, reconnecting...');
      setTimeout(() => this.connect(), this.reconnectDelay);
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10000);
    };

    this.ws.onerror = () => {
      console.error('[MIDI] WebSocket error');
    };
  }

  private send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  sendNoteOn(note: number, velocity: number = 100, channel: number = 0) {
    this.send({ type: 'note-on', note, velocity, channel });
  }

  sendNoteOff(note: number, channel: number = 0) {
    this.send({ type: 'note-off', note, channel });
  }

  sendCC(ccNumber: number, value: number, channel: number = 0) {
    this.send({ type: 'cc', ccNumber, value, channel });
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}

export default MidiInterface;
