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
