export class OledScreen {
  private container: HTMLElement;
  private lines: HTMLElement[] = [];
  private persistentLines: string[] = ['', '', ''];
  private tempTimer: number | null = null;
  private readonly TEMP_DISPLAY_DURATION = 2000; // 2 seconds

  constructor(container: HTMLElement) {
    this.container = container;
    this.createScreen();
  }

  private createScreen() {
    const screen = document.createElement('div');
    screen.className = 'oled-screen';

    // Create 3 lines for text display
    for (let i = 0; i < 3; i++) {
      const line = document.createElement('div');
      line.className = 'oled-line';
      line.textContent = '';
      this.lines.push(line);
      screen.appendChild(line);
    }

    this.container.appendChild(screen);
  }

  updateDisplay(lines: string[], isPersistent: boolean = false) {
    if (isPersistent) {
      // Store persistent text
      this.persistentLines = [...lines];

      // Only update display if no temporary message is showing
      if (this.tempTimer === null) {
        this.render(lines);
      }
    } else {
      // Temporary text - show now and revert after timer
      this.render(lines);

      // Clear existing timer if any
      if (this.tempTimer !== null) {
        clearTimeout(this.tempTimer);
      }

      // Set timer to revert to persistent text
      this.tempTimer = window.setTimeout(() => {
        this.render(this.persistentLines);
        this.tempTimer = null;
      }, this.TEMP_DISPLAY_DURATION);
    }
  }

  private render(lines: string[]) {
    for (let i = 0; i < 3; i++) {
      this.lines[i].textContent = lines[i] || '';
    }
  }
}
