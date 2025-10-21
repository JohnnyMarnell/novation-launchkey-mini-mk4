import MidiInterface from './MidiInterface';
import { Keyboard } from './components/Keyboard';
import { Knobs } from './components/Knobs';
import { OledScreen } from './components/OledScreen';
import './style.css';

class App {
  private midi: MidiInterface;

  constructor() {
    console.log('Initializing Launchkey Mini MK4 GUI...');

    // Initialize MIDI
    this.midi = new MidiInterface();

    // Get container
    const container = document.getElementById('launchkey-container');
    if (!container) {
      throw new Error('Container not found');
    }

    // Create OLED screen section
    const oledSection = document.createElement('div');
    oledSection.className = 'section oled-section';
    container.appendChild(oledSection);

    // Create knobs section
    const knobsSection = document.createElement('div');
    knobsSection.className = 'section';
    container.appendChild(knobsSection);

    // Create keyboard section
    const keyboardSection = document.createElement('div');
    keyboardSection.className = 'section';
    container.appendChild(keyboardSection);

    // Initialize components
    const oled = new OledScreen(oledSection);
    new Knobs(knobsSection, this.midi);
    new Keyboard(keyboardSection, this.midi);

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
