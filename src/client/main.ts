import { MidiManager } from './midi/MidiManager';
import { Keyboard } from './components/Keyboard';
import { Knobs } from './components/Knobs';
import './style.css';

class App {
  private midiManager: MidiManager;

  constructor() {
    console.log('Initializing Launchkey Mini MK4 GUI...');

    // Initialize MIDI
    this.midiManager = new MidiManager();

    // Get container
    const container = document.getElementById('launchkey-container');
    if (!container) {
      throw new Error('Container not found');
    }

    // Create knobs section
    const knobsSection = document.createElement('div');
    knobsSection.className = 'section';
    container.appendChild(knobsSection);

    // Create keyboard section
    const keyboardSection = document.createElement('div');
    keyboardSection.className = 'section';
    container.appendChild(keyboardSection);

    // Initialize components
    new Knobs(knobsSection, this.midiManager);
    new Keyboard(keyboardSection, this.midiManager);

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
