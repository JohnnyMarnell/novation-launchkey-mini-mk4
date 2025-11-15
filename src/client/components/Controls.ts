import MidiInterface from '../MidiInterface';

export type Button = "shift" | "settings" | "play" | "record" | "up" | "down"
                    | "navUp" | "navDown" | "right" | "func"

export class Controls {
  private midi: MidiInterface;
  private controlChannel = 0;
  private pressedButtons: Set<string> = new Set(); // Track which buttons are currently pressed
  private pressedKeys: Set<string> = new Set(); // Track which keyboard keys are currently pressed

  // CC numbers for buttons (from mk4.ts comment)
  private readonly ccMap: Record<Button, number | null> = {
    shift: 63,
    play: 115,
    record: 117,
    up: 106,      // Main navigation up (larger arrows in display area)
    down: 107,    // Main navigation down (larger arrows in display area)
    navUp: 51,    // Transpose up (smaller arrows in right nav)
    navDown: 52,  // Transpose down (smaller arrows in right nav)
    right: 104,
    func: 105,
    settings: null, // Pretty sure this doesn't have a CC message
  };

  // Computer keyboard to control mapping
  private readonly keyboardMap: Record<string, Button> = {
    'a': 'play',
    'A': 'play',
    's': 'record',
    'S': 'record',
    'd': 'down',
    'D': 'down',
    'f': 'func',
    'F': 'func',
    'ArrowUp': 'navUp',
    'ArrowDown': 'navDown',
  };

  constructor(midi: MidiInterface) {
    this.midi = midi;
    this.initializeControls();
    this.setupKeyboardListeners();
  }

  private initializeControls() {
    // Find all button elements with IDs and attach event listeners
    this.attachButtonListener('shift-btn', 'shift');
    this.attachButtonListener('settings-btn', 'settings');
    this.attachButtonListener('play-btn', 'play');
    this.attachButtonListener('record-btn', 'record');
    this.attachButtonListener('up-btn', 'up');
    this.attachButtonListener('down-btn', 'down');
    this.attachButtonListener('nav-up-btn', 'navUp');
    this.attachButtonListener('nav-down-btn', 'navDown');
    this.attachButtonListener('right-btn', 'right');
    this.attachButtonListener('func-btn', 'func');

    // Initialize pitch and mod strips (if needed for functionality)
    this.initializeStrip('pitch-strip');
    this.initializeStrip('mod-strip');
  }

  private setupKeyboardListeners() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this))
    document.addEventListener('keyup', this.handleKeyUp.bind(this))
  }

  private handleKeyDown(e: KeyboardEvent) {
    // Ignore if user is typing in an input field
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    const controlType = this.keyboardMap[e.key];

    if (controlType && !this.pressedKeys.has(e.key)) {
      e.preventDefault();
      this.pressedKeys.add(e.key);
      this.handleButtonPress(controlType);

      // Add visual feedback to the button
      const buttonId = controlType + '-btn';
      const button = document.getElementById(buttonId);
      if (button) {
        button.classList.add('active');
      }
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    const controlType = this.keyboardMap[e.key];

    if (controlType && this.pressedKeys.has(e.key)) {
      e.preventDefault();
      this.pressedKeys.delete(e.key);
      this.handleButtonRelease(controlType);

      // Remove visual feedback from the button
      const buttonId = controlType + '-btn';
      const button = document.getElementById(buttonId);
      if (button) {
        button.classList.remove('active');
      }
    }
  }

  private attachButtonListener(elementId: string, type: string) {
    const button = document.getElementById(elementId);
    if (!button) {
      console.warn(`Button element with id '${elementId}' not found`);
      return;
    }

    button.addEventListener('mousedown', () => this.handleButtonPress(type));
    button.addEventListener('mouseup', () => this.handleButtonRelease(type));
    // Only release if button was actually pressed (not just hovering)
    button.addEventListener('mouseleave', () => {
      if (this.pressedButtons.has(type)) {
        this.handleButtonRelease(type);
      }
    });

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
    strip.addEventListener('mousemove', (e) => {
      console.log('wtf', e);
    });
  }

  private handleButtonPress(type: string) {
    // Track that this button is pressed
    this.pressedButtons.add(type);

    const cc = this.ccMap[type];
    if (cc !== null && cc !== undefined) {
      this.midi.sendCC(cc, 127, this.controlChannel);
      console.log(`[Control] ${type} pressed (CC ${cc})`);
    } else {
      console.warn(`[Control] ${type} pressed (CC not yet mapped)`);
    }
  }

  private handleButtonRelease(type: string) {
    // Only send release if button was actually pressed
    if (!this.pressedButtons.has(type)) {
      return;
    }

    // Remove from pressed buttons set
    this.pressedButtons.delete(type);

    const cc = this.ccMap[type];
    if (cc !== null && cc !== undefined) {
      this.midi.sendCC(cc, 0, this.controlChannel);
      console.log(`[Control] ${type} released (CC ${cc})`);
    }
  }
}
