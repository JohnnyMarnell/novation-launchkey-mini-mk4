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

  // Computer keyboard to MIDI note mapping
  private readonly computerKeyMap: Record<string, number> = {
    // White keys (QWERTY row)
    'Tab': 48,      // C3
    'q': 50, 'Q': 50,      // D3
    'w': 52, 'W': 52,      // E3
    'e': 53, 'E': 53,      // F3
    'r': 55, 'R': 55,      // G3
    't': 57, 'T': 57,      // A3
    'y': 59, 'Y': 59,      // B3
    'u': 60, 'U': 60,      // C4
    'i': 62, 'I': 62,      // D4
    'o': 64, 'O': 64,      // E4
    'p': 65, 'P': 65,      // F4
    '[': 67,        // G4
    ']': 69,        // A4
    '\\': 71,       // B4

    // Black keys (Number row)
    '1': 49,        // C#3
    '2': 51,        // D#3
    // 3 is unused (E-F gap)
    '4': 54,        // F#3
    '5': 56,        // G#3
    '6': 58,        // A#3
    // 7 is unused (B-C gap)
    '8': 61,        // C#4
    '9': 63,        // D#4
    '0': 70,        // A#4
    '-': 66,        // F#4
    '=': 68,        // G#4
    'Backspace': 70, // A#4 
  };

  // Track which computer keys are currently pressed
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

    const key = e.key;
    const midiNote = this.computerKeyMap[key];

    // Check if this key is mapped and not already pressed
    if (midiNote !== undefined && !this.pressedComputerKeys.has(key)) {
      e.preventDefault(); // Prevent default browser behavior
      this.pressedComputerKeys.add(key);
      this.handleNoteOn(midiNote);
    }
  }

  private handleComputerKeyUp(e: KeyboardEvent) {
    const key = e.key;
    const midiNote = this.computerKeyMap[key];

    // Check if this key is mapped and was pressed
    if (midiNote !== undefined && this.pressedComputerKeys.has(key)) {
      e.preventDefault();
      this.pressedComputerKeys.delete(key);
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
      this.midi.sendNoteOn(note, 100, this.keyChannel);
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
