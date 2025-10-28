import MidiInterface from '../MidiInterface';

export class Controls {
  private midi: MidiInterface;
  private controlChannel = 15; // DAW channel

  // CC numbers for buttons (from mk4.ts comment)
  private readonly ccMap: Record<string, number | null> = {
    shift: 63,
    settings: null, // TODO: Find CC for Settings
    play: 115,
    record: 117,
    'oct-minus': 114,
    'oct-plus': 113,
    up: 51,
    down: 52,
    'nav-up': 51,
    'nav-down': 52,
    right: null, // TODO: Find CC for Right arrow
    arp: null, // TODO: Find CC for Arp
    scale: null, // TODO: Find CC for Scale
    func: null, // TODO: Find CC for Func
  };

  constructor(midi: MidiInterface) {
    this.midi = midi;
    this.initializeControls();
  }

  private initializeControls() {
    // Find all button elements with IDs and attach event listeners
    this.attachButtonListener('shift-btn', 'shift');
    this.attachButtonListener('settings-btn', 'settings');
    this.attachButtonListener('play-btn', 'play');
    this.attachButtonListener('record-btn', 'record');
    this.attachButtonListener('oct-minus-btn', 'oct-minus');
    this.attachButtonListener('oct-plus-btn', 'oct-plus');
    this.attachButtonListener('arp-btn', 'arp');
    this.attachButtonListener('scale-btn', 'scale');
    this.attachButtonListener('up-btn', 'up');
    this.attachButtonListener('down-btn', 'down');
    this.attachButtonListener('nav-up-btn', 'nav-up');
    this.attachButtonListener('nav-down-btn', 'nav-down');
    this.attachButtonListener('right-btn', 'right');
    this.attachButtonListener('func-btn', 'func');

    // Initialize pitch and mod strips (if needed for functionality)
    this.initializeStrip('pitch-strip');
    this.initializeStrip('mod-strip');
  }

  private attachButtonListener(elementId: string, type: string) {
    const button = document.getElementById(elementId);
    if (!button) {
      console.warn(`Button element with id '${elementId}' not found`);
      return;
    }

    button.addEventListener('mousedown', () => this.handleButtonPress(type));
    button.addEventListener('mouseup', () => this.handleButtonRelease(type));
    button.addEventListener('mouseleave', () => this.handleButtonRelease(type));

    // Touch support
    button.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleButtonPress(type);
    });
    button.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.handleButtonRelease(type);
    });
  }

  private initializeStrip(elementId: string) {
    const strip = document.getElementById(elementId);
    if (!strip) {
      console.warn(`Strip element with id '${elementId}' not found`);
      return;
    }

    // Add basic interaction for strips (can be expanded later)
    // For now, just make them visually interactive
    strip.addEventListener('mouseenter', () => {
      strip.style.background = 'linear-gradient(180deg, #555 0%, #333 100%)';
    });
    strip.addEventListener('mouseleave', () => {
      strip.style.background = '';
    });
  }

  private handleButtonPress(type: string) {
    const cc = this.ccMap[type];
    if (cc !== null && cc !== undefined) {
      this.midi.sendCC(cc, 127, this.controlChannel);
      console.log(`[Control] ${type} pressed (CC ${cc})`);
    } else {
      console.warn(`[Control] ${type} pressed (CC not yet mapped)`);
    }
  }

  private handleButtonRelease(type: string) {
    const cc = this.ccMap[type];
    if (cc !== null && cc !== undefined) {
      this.midi.sendCC(cc, 0, this.controlChannel);
      console.log(`[Control] ${type} released (CC ${cc})`);
    }
  }
}
