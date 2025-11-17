import MidiInterface from './MidiInterface';
import { Keyboard } from './components/Keyboard';
import { Knobs } from './components/Knobs';
import { OledScreen } from './components/OledScreen';
import { Controls } from './components/Controls';
import { Pads } from './components/Pads';
import { Wheels } from './components/Wheels';
import './style.css';

class App {
  private midi: MidiInterface;
  private pressedNumpadKeys: Set<string> = new Set();
  private sustainPedalOn: boolean = false;

  constructor() {
    console.log('Initializing Launchkey Mini MK4 GUI...');

    // Initialize MIDI
    this.midi = new MidiInterface();

    // Verify the keyboard container exists
    const container = document.querySelector('.keyboard-container');
    if (!container) {
      throw new Error('Keyboard container not found');
    }

    // Initialize components - they now find their own DOM elements
    const oled = new OledScreen();
    new Controls(this.midi);
    new Knobs(this.midi);
    new Pads(this.midi); // Initialize pads component
    new Wheels(this.midi); // Initialize pitch and mod wheels

    // Keyboard still needs a container since it creates keys dynamically
    const keyboardSection = document.getElementById('keyboard-section');
    if (keyboardSection) {
      new Keyboard(keyboardSection, this.midi);
    } else {
      console.warn('Keyboard section not found, keyboard not initialized');
    }

    // Wire up OLED updates
    this.midi.onOledUpdate((lines, isPersistent) => {
      oled.updateDisplay(lines, isPersistent);
    });

    // Numpad sustain pedal functionality
    const sustainIndicator = document.getElementById('sustain-indicator');

    const setSustain = (on: boolean) => {
      if (on && !this.sustainPedalOn) {
        this.midi.sendCC(64, 127, 8);
        this.sustainPedalOn = true;
        sustainIndicator?.classList.add('active');
        console.log('Sustain pedal ON');
      } else if (!on && this.sustainPedalOn) {
        this.midi.sendCC(64, 0, 8);
        this.sustainPedalOn = false;
        sustainIndicator?.classList.remove('active');
        console.log('Sustain pedal OFF');
      }
    };

    // Click to toggle sustain
    sustainIndicator?.addEventListener('click', () => {
      setSustain(!this.sustainPedalOn);
    });

    document.addEventListener('keydown', (e) => {
      // Numpad keys
      if (e.code.startsWith('Numpad')) {
        if (!this.pressedNumpadKeys.has(e.code)) {
          this.pressedNumpadKeys.add(e.code);
          if (this.pressedNumpadKeys.size === 1) {
            setSustain(true);
          }
        }
      }
      // Quote keys (single ' and double ")
      else if (e.code === 'Quote') {
        if (!this.pressedNumpadKeys.has(e.code)) {
          this.pressedNumpadKeys.add(e.code);
          if (this.pressedNumpadKeys.size === 1) {
            setSustain(true);
          }
        }
      }
    });

    document.addEventListener('keyup', (e) => {
      // Numpad keys
      if (e.code.startsWith('Numpad')) {
        this.pressedNumpadKeys.delete(e.code);
        if (this.pressedNumpadKeys.size === 0) {
          setSustain(false);
        }
      }
      // Quote key
      else if (e.code === 'Quote') {
        this.pressedNumpadKeys.delete(e.code);
        if (this.pressedNumpadKeys.size === 0) {
          setSustain(false);
        }
      }
    });

    console.log('Launchkey Mini MK4 GUI ready!');
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new App());
} else {
  new App();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  console.log('Closing MIDI ports...');
});
