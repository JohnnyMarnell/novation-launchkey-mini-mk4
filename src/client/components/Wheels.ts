import MidiInterface from '../MidiInterface';

export class Wheels {
  private midi: MidiInterface;
  private pitchStrip: HTMLElement | null;
  private modStrip: HTMLElement | null;

  // Current values (0-127 for mod, 0-16383 for pitch bend, 8192 is center)
  private modValue = 0;
  private pitchValue = 8192;

  // Drag state
  private isDraggingPitch = false;
  private isDraggingMod = false;
  private modChannel = 8; // Performance controls on channel 8

  // For spring-back animation on pitch wheel
  private pitchSpringTimer: number | null = null;

  constructor(midi: MidiInterface) {
    this.midi = midi;

    // Find the wheel elements
    this.pitchStrip = document.getElementById('pitch-strip');
    this.modStrip = document.getElementById('mod-strip');

    if (!this.pitchStrip || !this.modStrip) {
      console.warn('Pitch or Mod strip elements not found');
      return;
    }

    this.setupPitchWheel();
    this.setupModWheel();
    this.setupMidiListener();

    // Initialize visual positions
    this.updatePitchVisual();
    this.updateModVisual();
  }

  private setupPitchWheel() {
    if (!this.pitchStrip) return;

    // Mouse events
    this.pitchStrip.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.isDraggingPitch = true;
      this.stopPitchSpring();
      this.updatePitchFromMouse(e);
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isDraggingPitch) {
        this.updatePitchFromMouse(e);
      }
    });

    document.addEventListener('mouseup', () => {
      if (this.isDraggingPitch) {
        this.isDraggingPitch = false;
        this.startPitchSpring();
      }
    });

    // Touch events
    this.pitchStrip.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.isDraggingPitch = true;
      this.stopPitchSpring();
      this.updatePitchFromTouch(e);
    });

    document.addEventListener('touchmove', (e) => {
      if (this.isDraggingPitch) {
        this.updatePitchFromTouch(e);
      }
    });

    document.addEventListener('touchend', () => {
      if (this.isDraggingPitch) {
        this.isDraggingPitch = false;
        this.startPitchSpring();
      }
    });
  }

  private setupModWheel() {
    if (!this.modStrip) return;

    // Mouse events
    this.modStrip.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.isDraggingMod = true;
      this.updateModFromMouse(e);
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isDraggingMod) {
        this.updateModFromMouse(e);
      }
    });

    document.addEventListener('mouseup', () => {
      this.isDraggingMod = false;
    });

    // Touch events
    this.modStrip.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.isDraggingMod = true;
      this.updateModFromTouch(e);
    });

    document.addEventListener('touchmove', (e) => {
      if (this.isDraggingMod) {
        this.updateModFromTouch(e);
      }
    });

    document.addEventListener('touchend', () => {
      this.isDraggingMod = false;
    });
  }

  private setupMidiListener() {
    // Listen for incoming MIDI from any device to update GUI
    this.midi.addListener((event: any) => {
      if (event.type === 'midi') {
        const {midiType, channel, data, value} = event;

        // Pitch Bend (0xE0)
        if (midiType === 0xE0) {
          // Pitch bend uses 14-bit value: LSB in data, MSB in value
          const pitchValue14bit = (value << 7) | data;
          this.setPitchValue(pitchValue14bit, false); // Don't send back
          console.log(`[MIDI] Pitch Bend received: ${pitchValue14bit} (center: 8192)`);
        }
        // Modulation Wheel (CC1 on any channel)
        else if (midiType === 0xB0 && data === 1) {
          this.setModValue(value, false); // Don't send back
          console.log(`[MIDI] Modulation received: ${value} (channel ${channel})`);
        }
      }
    });
  }

  private updatePitchFromMouse(e: MouseEvent) {
    if (!this.pitchStrip) return;
    const rect = this.pitchStrip.getBoundingClientRect();
    this.updatePitchFromPosition(e.clientY, rect);
  }

  private updatePitchFromTouch(e: TouchEvent) {
    if (!this.pitchStrip || e.touches.length === 0) return;
    const rect = this.pitchStrip.getBoundingClientRect();
    this.updatePitchFromPosition(e.touches[0].clientY, rect);
  }

  private updatePitchFromPosition(clientY: number, rect: DOMRect) {
    // Calculate relative position (0 = top = max pitch up, 1 = bottom = max pitch down)
    const relativeY = (clientY - rect.top) / rect.height;
    const clampedY = Math.max(0, Math.min(1, relativeY));

    // Map to 14-bit pitch bend value (0-16383, center is 8192)
    // Inverted: top = 16383 (max up), center = 8192, bottom = 0 (max down)
    const pitchValue = Math.round((1 - clampedY) * 16383);

    this.setPitchValue(pitchValue, true);
  }

  private updateModFromMouse(e: MouseEvent) {
    if (!this.modStrip) return;
    const rect = this.modStrip.getBoundingClientRect();
    this.updateModFromPosition(e.clientY, rect);
  }

  private updateModFromTouch(e: TouchEvent) {
    if (!this.modStrip || e.touches.length === 0) return;
    const rect = this.modStrip.getBoundingClientRect();
    this.updateModFromPosition(e.touches[0].clientY, rect);
  }

  private updateModFromPosition(clientY: number, rect: DOMRect) {
    // Calculate relative position (0 = top = max, 1 = bottom = min)
    const relativeY = (clientY - rect.top) / rect.height;
    const clampedY = Math.max(0, Math.min(1, relativeY));

    // Map to 7-bit CC value (0-127)
    // Inverted: top = 127, bottom = 0
    const modValue = Math.round((1 - clampedY) * 127);

    this.setModValue(modValue, true);
  }

  private setPitchValue(value: number, sendMidi: boolean) {
    this.pitchValue = Math.max(0, Math.min(16383, value));
    this.updatePitchVisual();

    if (sendMidi) {
      // Split 14-bit value into LSB (data) and MSB (value)
      const lsb = this.pitchValue & 0x7F;
      const msb = (this.pitchValue >> 7) & 0x7F;
      this.midi.sendPitchBend(lsb, msb, this.modChannel);
    }
  }

  private setModValue(value: number, sendMidi: boolean) {
    this.modValue = Math.max(0, Math.min(127, value));
    this.updateModVisual();

    if (sendMidi) {
      this.midi.sendCC(1, this.modValue, this.modChannel); // CC1 = Modulation Wheel
    }
  }

  private updatePitchVisual() {
    if (!this.pitchStrip) return;

    // Map pitch value (0-16383, center 8192) to position (0-100%, center 50%)
    const percentage = (1 - (this.pitchValue / 16383)) * 100;

    // Create a gradient effect with the indicator at the current position
    const indicatorSize = 20; // Size of the bright indicator spot
    const top = Math.max(0, percentage - indicatorSize/2);
    const bottom = Math.min(100, percentage + indicatorSize/2);

    this.pitchStrip.style.background = `
      linear-gradient(
        to bottom,
        rgba(100, 150, 255, 0.2) 0%,
        rgba(100, 150, 255, 0.3) ${top}%,
        rgba(100, 200, 255, 0.9) ${percentage}%,
        rgba(100, 150, 255, 0.3) ${bottom}%,
        rgba(100, 150, 255, 0.2) 100%
      )
    `;
  }

  private updateModVisual() {
    if (!this.modStrip) return;

    // Map mod value (0-127) to position (0-100%)
    const percentage = (1 - (this.modValue / 127)) * 100;

    // Create a gradient from bottom up to the current value
    this.modStrip.style.background = `
      linear-gradient(
        to bottom,
        rgba(100, 150, 255, 0.2) 0%,
        rgba(100, 150, 255, 0.2) ${percentage}%,
        rgba(100, 200, 255, 0.8) ${percentage}%,
        rgba(100, 200, 255, 0.8) 100%
      )
    `;
  }

  // Spring-back animation for pitch wheel
  private startPitchSpring() {
    const springSpeed = 8; // Lower = faster
    const springStep = () => {
      const center = 8192;
      const diff = center - this.pitchValue;

      if (Math.abs(diff) < 50) {
        // Close enough, snap to center
        this.setPitchValue(center, true);
        this.pitchSpringTimer = null;
      } else {
        // Move toward center
        const step = diff / springSpeed;
        this.setPitchValue(this.pitchValue + step, true);
        this.pitchSpringTimer = window.requestAnimationFrame(springStep);
      }
    };

    this.pitchSpringTimer = window.requestAnimationFrame(springStep);
  }

  private stopPitchSpring() {
    if (this.pitchSpringTimer !== null) {
      window.cancelAnimationFrame(this.pitchSpringTimer);
      this.pitchSpringTimer = null;
    }
  }
}
