import MidiInterface from './MidiInterface';
import { Keyboard } from './components/Keyboard';
import { Knobs } from './components/Knobs';
import { OledScreen } from './components/OledScreen';
import { Controls } from './components/Controls';
import { Pads } from './components/Pads';
import './style.css';

class App {
  private midi: MidiInterface;

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
