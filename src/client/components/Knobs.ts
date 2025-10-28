import MidiInterface from '../MidiInterface';

export class Knobs {
  private midi: MidiInterface;

  // Launchkey Mini MK4 has 8 knobs
  private readonly numKnobs = 8;
  // CC numbers for the 8 knobs (standard mapping for Launchkey Mini)
  private readonly ccNumbers = [21, 22, 23, 24, 25, 26, 27, 28];

  private knobChannel = 15

  constructor(midi: MidiInterface) {
    this.midi = midi;
    this.initializeKnobs();
  }

  private initializeKnobs() {
    // Find all existing knob elements in the DOM
    const knobElements = document.querySelectorAll('.knob[data-knob-index]');

    knobElements.forEach((knobWrapper) => {
      const index = parseInt(knobWrapper.getAttribute('data-knob-index') || '0');
      if (index >= this.numKnobs) return;

      const knobVisual = knobWrapper.querySelector('.knob-visual') as HTMLElement;
      if (!knobVisual) return;

      let isDragging = false;
      let startY = 0;
      let currentValue = 0;

      const handleMove = (clientY: number) => {
        if (!isDragging) return;

        const delta = startY - clientY;
        currentValue = Math.max(0, Math.min(127, currentValue + delta));
        startY = clientY;

        this.updateKnob(knobVisual, currentValue);
        this.midi.sendCC(this.ccNumbers[index], Math.round(currentValue), this.knobChannel);
        console.log(`Knob ${index + 1} (CC${this.ccNumbers[index]}): ${Math.round(currentValue)}`);
      };

      knobVisual.addEventListener('mousedown', (e) => {
        isDragging = true;
        startY = e.clientY;
        e.preventDefault();
      });

      document.addEventListener('mousemove', (e) => handleMove(e.clientY));

      document.addEventListener('mouseup', () => {
        isDragging = false;
      });

      // Touch support
      knobVisual.addEventListener('touchstart', (e) => {
        isDragging = true;
        startY = e.touches[0].clientY;
        e.preventDefault();
      });

      document.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches.length > 0) {
          handleMove(e.touches[0].clientY);
        }
      });

      document.addEventListener('touchend', () => {
        isDragging = false;
      });
    });
  }

  private updateKnob(knobVisual: HTMLElement, value: number) {
    const rotation = (value / 127) * 270 - 135; // -135 to +135 degrees
    // Rotate the ::after pseudo-element by rotating the entire knob visual
    knobVisual.style.transform = `rotate(${rotation}deg)`;
  }
}
