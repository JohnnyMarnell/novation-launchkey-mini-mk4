import MidiInterface from '../MidiInterface';

export class Knobs {
  private midi: MidiInterface;
  private readonly ccMixer = 21;
  private readonly ccTransport = 85;
  private knobChannel = 15;
  private knobMode: 'mixer' | 'transport' = 'transport';

  constructor(midi: MidiInterface) {
    this.midi = midi;
    this.initializeKnobs();
  }

  private initializeKnobs() {
    // Find all existing knob elements in the DOM
    const knobElements = document.querySelectorAll('.knob[data-knob-index]');

    knobElements.forEach((knobWrapper) => {
      const index = parseInt(knobWrapper.getAttribute('data-knob-index') || '0');
      if (!(index >= 0)) return;

      const knobVisual = knobWrapper.querySelector('.knob-visual') as HTMLElement;
      if (!knobVisual) return;

      let isDragging = false;
      let startY = 0;
      let currentValue = 0;

      const handleMove = (clientY: number) => {
        if (!isDragging) return;

        const delta = startY - clientY;
        const ccNum = (this.knobMode === 'mixer' ? this.ccMixer : this.ccTransport) + index;

        if (this.knobMode === 'mixer') {
          // Mixer mode: direct CC value from visual position
          currentValue = Math.max(0, Math.min(127, currentValue + delta));
          this.updateKnob(knobVisual, currentValue);
          this.midi.sendCC(ccNum, Math.round(currentValue), this.knobChannel);
          console.log(`Knob ${index + 1} (CC${ccNum}) [MIXER]: ${Math.round(currentValue)}`);
        } else {
          // Transport/Relative mode: send relative encoder values (64 = center)
          // delta > 0 = dragging up (increase), delta < 0 = dragging down (decrease)
          const absDelta = Math.abs(delta);
          let relativeValue: number;

          if (absDelta === 0) {
            return; // No movement, don't send anything
          } else if (absDelta === 1) {
            relativeValue = delta > 0 ? 65 : 63; // +1 or -1
          } else if (absDelta <= 3) {
            relativeValue = delta > 0 ? 66 : 62; // +2 or -2
          } else if (absDelta <= 6) {
            relativeValue = delta > 0 ? 67 : 61; // +3 or -3
          } else {
            // Large movement: max out at +/-7
            relativeValue = delta > 0 ? 71 : 57; // +7 or -7
          }

          this.midi.sendCC(ccNum, relativeValue, this.knobChannel);
          console.log(`Knob ${index + 1} (CC${ccNum}) [TRANSPORT]: ${relativeValue} (delta: ${delta})`);
        }

        startY = clientY;
      };

      knobVisual.addEventListener('mousedown', (e) => {
        isDragging = true;
        startY = e.clientY;
        if (this.knobMode === 'mixer') {
          currentValue = this.getValueFromKnobVisual(knobVisual);
        }
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
        if (this.knobMode === 'mixer') {
          currentValue = this.getValueFromKnobVisual(knobVisual);
        }
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

  private getValueFromKnobVisual(knobVisual: HTMLElement): number {
    // Extract the rotation value from the transform style
    const transform = knobVisual.style.transform;
    const rotationMatch = transform.match(/rotate\(([^d]+)deg\)/);
    if (rotationMatch) {
      const rotation = parseFloat(rotationMatch[1]);
      // Reverse engineer: rotation = (value / 127) * 270 - 135
      const value = ((rotation + 135) / 270) * 127;
      return Math.round(Math.max(0, Math.min(127, value)));
    }
    return 0;
  }

  private updateKnob(knobVisual: HTMLElement, value: number) {
    const rotation = (value / 127) * 270 - 135; // -135 to +135 degrees
    // Rotate the ::after pseudo-element by rotating the entire knob visual
    knobVisual.style.transform = `rotate(${rotation}deg)`;
  }
}
