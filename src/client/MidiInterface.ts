class MidiInterface {
  private ws: WebSocket | null = null;
  private reconnectDelay = 1000;
  private oledCallback: ((lines: string[], isPersistent: boolean) => void) | null = null;
  private listeners: ((event: any) => void)[] = []

  constructor() {
    this.connect();
  }

  private connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // In development (port 5173), connect to server on port 3000
    // In production, connect to same host
    const isDev = window.location.port === '5173';
    const host = isDev ? `${window.location.hostname}:3000` : window.location.host;
    const wsUrl = `${protocol}//${host}`;

    console.log(`[MIDI] Connecting to ${wsUrl}`);
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('[MIDI] Connected');
      this.reconnectDelay = 1000;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'oled-update' && this.oledCallback) {
          this.oledCallback(data.lines, data.isPersistent || false);
        }
        this.listeners.forEach(listener => listener(data))
      } catch (error) {
        console.error('[MIDI] Error parsing message:', error);
      }
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

  public addListener(listener: (event: any) => void) {
    this.listeners.push(listener)
  }

  onOledUpdate(callback: (lines: string[], isPersistent: boolean) => void) {
    this.oledCallback = callback;
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

  sendPitchBend(lsb: number, msb: number, channel: number = 0) {
    this.send({ type: 'pitch-bend', lsb, msb, channel });
  }

  sendRaw(message: any) {
    this.send(message);
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}

export default MidiInterface;
