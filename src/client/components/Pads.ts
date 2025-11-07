import MidiInterface from '../MidiInterface';

export class Pads {
  private midi: MidiInterface;
  private pads: HTMLElement[] = [];

  // Launchkey Mini MK4 has 16 pads (2x8 grid)
  private readonly numPads = 16;

  // MIDI channel for pads (channel 1 in user terms, 0-indexed)
  private padChannel = 0;

  // Pad MIDI note mapping based on Launchkey Mini MK4 spec
  private readonly padNotes = [
    // Top row (0-7)
    96, 97, 98, 99, 100, 101, 102, 103,
    // Bottom row (8-15)
    112, 113, 114, 115, 116, 117, 118, 119
  ];

  // Computer keyboard to pad index mapping
  // z, x, c, v should map to pad indexes 9, 11, 2, 3
  private readonly computerKeyToPad: Record<string, number> = {
    'z': 8,  // Bottom row, first pad, typically kick
    'Z': 8,
    'x': 10, // Bottom row, second pad, typically snare
    'X': 10,
    'c': 2,  // Top row, third pad, typically open hi hat
    'C': 2,
    'v': 3,  // Top row, fourth pad, typically closed hi hat
    'V': 3,
    '/': 15,
    '?': 15
  };

  // Track which pads are currently pressed
  private activePads: Set<number> = new Set();

  constructor(midi: MidiInterface) {
    this.midi = midi;
    this.initializePads();
    this.setupKeyboardListeners();
    
    const colors: any = {60: 'pink', 72: 'pink', 78: 'teal'};
    this.midi.addListener((event: any) => {
      if (event.type === 'midi') {
        const {midiType, channel, data, value} = event;
        const index = this.padNotes.indexOf(data);
        if (midiType === 0x90 && channel === 0 && index >= 0) {
          this.pads[index].style.backgroundColor = colors[value] || 'grey'
        }
      }
    })
  }

  private initializePads() {
    // Find all pad elements
    const padElements = document.querySelectorAll('.pad');

    padElements.forEach((padElement, index) => {
      if (index < this.numPads) {
        const pad = padElement as HTMLElement;
        this.pads.push(pad);

        // Add data attribute for easy identification
        pad.setAttribute('data-pad-index', index.toString());

        // Mouse events
        pad.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this.handlePadDown(index);
        });

        pad.addEventListener('mouseup', (e) => {
          e.preventDefault();
          this.handlePadUp(index);
        });

        pad.addEventListener('mouseleave', () => {
          // Release pad if mouse leaves while pressed
          if (this.activePads.has(index)) {
            this.handlePadUp(index);
          }
        });

        // Touch events
        pad.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.handlePadDown(index);
        });

        pad.addEventListener('touchend', (e) => {
          e.preventDefault();
          this.handlePadUp(index);
        });
      }
    });
  }

  private setupKeyboardListeners() {
    document.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    });

    document.addEventListener('keyup', (e) => {
      this.handleKeyUp(e);
    });
  }

  private handleKeyDown(e: KeyboardEvent) {
    // Ignore if user is typing in an input field
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    const padIndex = this.computerKeyToPad[e.key];

    if (padIndex !== undefined && !this.activePads.has(padIndex)) {
      e.preventDefault();
      this.handlePadDown(padIndex);
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    const padIndex = this.computerKeyToPad[e.key];

    if (padIndex !== undefined && this.activePads.has(padIndex)) {
      e.preventDefault();
      this.handlePadUp(padIndex);
    }
  }

  private handlePadDown(padIndex: number) {
    if (padIndex >= 0 && padIndex < this.numPads) {
      const pad = this.pads[padIndex];
      const note = this.padNotes[padIndex];

      if (pad && !this.activePads.has(padIndex)) {
        this.activePads.add(padIndex);
        pad.classList.add('pad-active');

        // Send MIDI note on with full velocity
        this.midi.sendNoteOn(note, 127, this.padChannel);
        console.log(`Pad ${padIndex} pressed - Note: ${note} on channel ${this.padChannel + 1}`);
      }
    }
  }

  private handlePadUp(padIndex: number) {
    if (padIndex >= 0 && padIndex < this.numPads) {
      const pad = this.pads[padIndex];
      const note = this.padNotes[padIndex];

      if (pad && this.activePads.has(padIndex)) {
        this.activePads.delete(padIndex);
        pad.classList.remove('pad-active');

        // Send MIDI note off
        this.midi.sendNoteOff(note, this.padChannel);
        console.log(`Pad ${padIndex} released - Note: ${note} off on channel ${this.padChannel + 1}`);
      }
    }
  }

  // Public method to trigger a pad programmatically
  public triggerPad(padIndex: number, velocity: number = 127) {
    if (padIndex >= 0 && padIndex < this.numPads) {
      const note = this.padNotes[padIndex];
      this.midi.sendNoteOn(note, velocity, this.padChannel);

      // Visual feedback
      const pad = this.pads[padIndex];
      if (pad) {
        pad.classList.add('pad-active');
        setTimeout(() => {
          pad.classList.remove('pad-active');
          this.midi.sendNoteOff(note, this.padChannel);
        }, 100);
      }
    }
  }
}