import MidiInterface from '../MidiInterface';

export class Keyboard {
  private container: HTMLElement;
  private midi: MidiInterface;
  private keys: HTMLElement[] = [];

  // Launchkey Mini MK4 has 25 keys (2 octaves starting from C)
  private readonly numKeys = 25;
  private readonly startNote = 48; // C3 (MIDI note 48)

  private keyChannel = 8;

  // Drag state
  private isDragging = false;
  private currentNote: number | null = null;

  // Computer keyboard to MIDI note mapping (using key codes)
  private readonly computerKeyMap: Record<string, number> = {
    // White keys (QWERTY row)
    'Tab': 48,         // C3
    'KeyQ': 50,        // D3
    'KeyW': 52,        // E3
    'KeyE': 53,        // F3
    'KeyR': 55,        // G3
    'KeyT': 57,        // A3
    'KeyY': 59,        // B3
    'KeyU': 60,        // C4
    'KeyI': 62,        // D4
    'KeyO': 64,        // E4
    'KeyP': 65,        // F4
    'BracketLeft': 67, // G4
    'BracketRight': 69,// A4
    'Backslash': 71,   // B4

    // Black keys (Number row)
    'Digit1': 49,      // C#3
    'Digit2': 51,      // D#3
    // Digit3 is unused (E-F gap)
    'Digit4': 54,      // F#3
    'Digit5': 56,      // G#3
    'Digit6': 58,      // A#3
    // Digit7 is unused (B-C gap)
    'Digit8': 61,      // C#4
    'Digit9': 63,      // D#4
    'Minus': 66,       // F#4
    'Equal': 68,       // G#4
    'Backspace': 70,   // A#4
  };

  // Track which computer key codes are currently pressed
  private pressedComputerKeys: Set<string> = new Set();

  constructor(container: HTMLElement, midi: MidiInterface) {
    this.container = container;
    this.midi = midi;
    this.createKeyboard();
    this.setupGlobalListeners();
  }

  private createKeyboard() {
    const keyboardDiv = document.createElement('div');
    keyboardDiv.className = 'keyboard';

    for (let i = 0; i < this.numKeys; i++) {
      const note = this.startNote + i;
      const keyDiv = document.createElement('div');
      const noteInOctave = note % 12;

      // Determine if it's a black key
      const isBlackKey = [1, 3, 6, 8, 10].includes(noteInOctave);
      keyDiv.className = isBlackKey ? 'key black-key' : 'key white-key';

      // Mouse event listeners for drag support
      keyDiv.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.startDrag(note);
      });

      keyDiv.addEventListener('mouseenter', () => {
        if (this.isDragging) {
          this.switchToNote(note);
        }
      });

      // Touch support (separate from drag)
      keyDiv.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.handleNoteOn(note);
      });
      keyDiv.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.handleNoteOff(note);
      });

      this.keys.push(keyDiv);
      keyboardDiv.appendChild(keyDiv);
    }

    this.container.appendChild(keyboardDiv);
  }

  private setupGlobalListeners() {
    document.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.stopDrag();
      }
    });

    // Computer keyboard listeners
    document.addEventListener('keydown', (e) => {
      this.handleComputerKeyDown(e);
    });

    document.addEventListener('keyup', (e) => {
      this.handleComputerKeyUp(e);
    });
  }

  private handleComputerKeyDown(e: KeyboardEvent) {
    // Ignore if user is typing in an input field
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    const code = e.code;
    const midiNote = this.computerKeyMap[code];

    // Check if this key is mapped and not already pressed
    if (midiNote !== undefined && !this.pressedComputerKeys.has(code)) {
      e.preventDefault(); // Prevent default browser behavior
      this.pressedComputerKeys.add(code);
      this.handleNoteOn(midiNote);
    }
  }

  private handleComputerKeyUp(e: KeyboardEvent) {
    const code = e.code;
    const midiNote = this.computerKeyMap[code];

    // Check if this key is mapped and was pressed
    if (midiNote !== undefined && this.pressedComputerKeys.has(code)) {
      e.preventDefault();
      this.pressedComputerKeys.delete(code);
      this.handleNoteOff(midiNote);
    }
  }

  private startDrag(note: number) {
    this.isDragging = true;
    this.switchToNote(note);
  }

  private switchToNote(note: number) {
    if (this.currentNote === note) return;

    // Turn off previous note
    if (this.currentNote !== null) {
      this.handleNoteOff(this.currentNote);
    }

    // Turn on new note
    this.currentNote = note;
    this.handleNoteOn(note);
  }

  private stopDrag() {
    this.isDragging = false;
    if (this.currentNote !== null) {
      this.handleNoteOff(this.currentNote);
      this.currentNote = null;
    }
  }

  private handleNoteOn(note: number) {
    const keyIndex = note - this.startNote;
    const key = this.keys[keyIndex];
    if (key && !key.classList.contains('active')) {
      key.classList.add('active');
      this.midi.sendNoteOn(note, 120, this.keyChannel);
      console.log(`Note On: ${note}`);
    }
  }

  private handleNoteOff(note: number) {
    const keyIndex = note - this.startNote;
    const key = this.keys[keyIndex];
    if (key && key.classList.contains('active')) {
      key.classList.remove('active');
      this.midi.sendNoteOff(note, this.keyChannel);
      console.log(`Note Off: ${note}`);
    }
  }
}
