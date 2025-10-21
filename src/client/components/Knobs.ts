import MidiInterface from '../MidiInterface';

export class Knobs {
  private container: HTMLElement;
  private midi: MidiInterface;

  // Launchkey Mini MK4 has 8 knobs
  private readonly numKnobs = 8;
  // CC numbers for the 8 knobs (standard mapping for Launchkey Mini)
  private readonly ccNumbers = [21, 22, 23, 24, 25, 26, 27, 28];

  private knobChannel = 15

  constructor(container: HTMLElement, midi: MidiInterface) {
    this.container = container;
    this.midi = midi;
    this.createKnobs();
  }

  private createKnobs() {
    const knobsDiv = document.createElement('div');
    knobsDiv.className = 'knobs-container';

    for (let i = 0; i < this.numKnobs; i++) {
      const knobWrapper = document.createElement('div');
      knobWrapper.className = 'knob-wrapper';

      const knobLabel = document.createElement('div');
      knobLabel.className = 'knob-label';
      knobLabel.textContent = `K${i + 1}`;

      const knob = document.createElement('div');
      knob.className = 'knob';

      const knobIndicator = document.createElement('div');
      knobIndicator.className = 'knob-indicator';
      knob.appendChild(knobIndicator);

      const valueDisplay = document.createElement('div');
      valueDisplay.className = 'knob-value';
      valueDisplay.textContent = '0';

      let isDragging = false;
      let startY = 0;
      let currentValue = 0;

      const handleMove = (clientY: number) => {
        if (!isDragging) return;

        const delta = startY - clientY;
        currentValue = Math.max(0, Math.min(127, currentValue + delta));
        startY = clientY;

        this.updateKnob(knob, currentValue, valueDisplay);
        this.midi.sendCC(this.ccNumbers[i], Math.round(currentValue), this.knobChannel);
        console.log(`Knob ${i + 1} (CC${this.ccNumbers[i]}): ${Math.round(currentValue)}`);
      };

      knob.addEventListener('mousedown', (e) => {
        isDragging = true;
        startY = e.clientY;
        e.preventDefault();
      });

      document.addEventListener('mousemove', (e) => handleMove(e.clientY));

      document.addEventListener('mouseup', () => {
        isDragging = false;
      });

      // Touch support
      knob.addEventListener('touchstart', (e) => {
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

      knobWrapper.appendChild(knobLabel);
      knobWrapper.appendChild(knob);
      knobWrapper.appendChild(valueDisplay);
      knobsDiv.appendChild(knobWrapper);
    }

    this.container.appendChild(knobsDiv);
  }

  private updateKnob(knob: HTMLElement, value: number, valueDisplay: HTMLElement) {
    const rotation = (value / 127) * 270 - 135; // -135 to +135 degrees
    const indicator = knob.querySelector('.knob-indicator') as HTMLElement;
    if (indicator) {
      indicator.style.transform = `rotate(${rotation}deg)`;
    }
    valueDisplay.textContent = Math.round(value).toString();
  }
}
