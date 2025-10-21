import { channel } from 'diagnostics_channel';
import { MidiManager } from '../midi/MidiManager';

export class Keyboard {
  private container: HTMLElement;
  private midiManager: MidiManager;
  private keys: HTMLElement[] = [];

  // Launchkey Mini MK4 has 25 keys (2 octaves starting from C)
  private readonly numKeys = 25;
  private readonly startNote = 48; // C3 (MIDI note 48)

  private keyChannel = 8;

  constructor(container: HTMLElement, midiManager: MidiManager) {
    this.container = container;
    this.midiManager = midiManager;
    this.createKeyboard();
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

      // Add event listeners
      keyDiv.addEventListener('mousedown', () => this.handleNoteOn(note));
      keyDiv.addEventListener('mouseup', () => this.handleNoteOff(note));
      keyDiv.addEventListener('mouseleave', () => this.handleNoteOff(note));

      // Touch support
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

  private handleNoteOn(note: number) {
    const keyIndex = note - this.startNote;
    const key = this.keys[keyIndex];
    if (key && !key.classList.contains('active')) {
      key.classList.add('active');
      this.midiManager.sendNoteOn(note, 100, this.keyChannel);
      console.log(`Note On: ${note}`);
    }
  }

  private handleNoteOff(note: number) {
    const keyIndex = note - this.startNote;
    const key = this.keys[keyIndex];
    if (key && key.classList.contains('active')) {
      key.classList.remove('active');
      this.midiManager.sendNoteOff(note, this.keyChannel);
      console.log(`Note Off: ${note}`);
    }
  }
}
