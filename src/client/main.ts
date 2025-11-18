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
  private keyboard: Keyboard | null = null;
  private globalKeyboardEnabled: boolean = false;

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
      this.keyboard = new Keyboard(keyboardSection, this.midi);
    } else {
      console.warn('Keyboard section not found, keyboard not initialized');
    }

    // Wire up OLED updates
    this.midi.onOledUpdate((lines, isPersistent) => {
      oled.updateDisplay(lines, isPersistent);
    });

    // Setup global keyboard listener toggle
    this.setupGlobalKeyboardToggle();

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

  private setupGlobalKeyboardToggle() {
    const globalToggle = document.getElementById('global-toggle') as HTMLButtonElement;
    if (!globalToggle) {
      console.warn('Global toggle button not found');
      return;
    }

    // Initially disable until we know if global mode is available
    globalToggle.disabled = true;

    // Listen for server messages
    this.midi.addListener((message: any) => {
      if (message.type === 'connected' && message.globalModeAvailable !== undefined) {
        // Enable/disable the button based on server availability
        globalToggle.disabled = !message.globalModeAvailable;
        if (!message.globalModeAvailable) {
          globalToggle.title = 'Global mode not available. Start server with --global flag.';
        } else {
          globalToggle.title = 'Toggle global keyboard listener';
        }
      } else if (message.type === 'global-keyboard-status') {
        // Update toggle state
        this.globalKeyboardEnabled = message.enabled;
        if (message.enabled) {
          globalToggle.classList.add('active');
          // Disable focused keyboard input to prevent doubles
          if (this.keyboard) {
            this.keyboard.setEnabled(false);
          }
        } else {
          globalToggle.classList.remove('active');
          // Re-enable focused keyboard input
          if (this.keyboard) {
            this.keyboard.setEnabled(true);
          }
        }
      } else if (message.type === 'global-keyboard-event') {
        // Forward global keyboard events to the keyboard component
        if (this.keyboard && this.globalKeyboardEnabled) {
          this.keyboard.handleGlobalKeyEvent(message.event);
        }
      } else if (message.type === 'global-keyboard-error') {
        console.error('Global keyboard error:', message.message);
        alert(message.message);
      }
    });

    // Toggle handler
    globalToggle.addEventListener('click', () => {
      if (globalToggle.disabled) return;

      const newState = !this.globalKeyboardEnabled;
      // Send toggle request to server
      this.midi.sendRaw({
        type: 'toggle-global-keyboard',
        enabled: newState
      });
    });
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
