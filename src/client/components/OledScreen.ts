export class OledScreen {
  private screenElement: HTMLElement | null = null;
  private persistentContent: string = '';
  private tempTimer: number | null = null;
  private readonly TEMP_DISPLAY_DURATION = 2_000;

  constructor() {
    this.initializeScreen();
  }

  private initializeScreen() {
    // Find the existing OLED screen element in the DOM
    this.screenElement = document.getElementById('oled-screen');
    if (!this.screenElement) {
      console.error('OLED screen element not found');
      return;
    }

    // Store the initial content as persistent
    this.persistentContent = this.screenElement.innerHTML;
  }

  updateDisplay(lines: string[], isPersistent: boolean = false) {
    if (!this.screenElement) return;

    // Convert lines array to HTML content
    const content = this.formatLines(lines);

    if (isPersistent) {
      // Store persistent content
      this.persistentContent = content;

      // Only update display if no temporary message is showing
      if (this.tempTimer === null) {
        this.render(content);
      }
    } else {
      // Temporary text - show now and revert after timer
      this.render(content);

      // Clear existing timer if any
      if (this.tempTimer !== null) {
        clearTimeout(this.tempTimer);
      }

      // Set timer to revert to persistent text
      this.tempTimer = window.setTimeout(() => {
        this.render(this.persistentContent);
        this.tempTimer = null;
      }, this.TEMP_DISPLAY_DURATION);
    }
  }

  // The screen's own glyphs (Programmer's Reference, "Setting text"): empty box, filled box, flat, heart
  private static readonly GLYPHS: Record<string, string> = {
    '\x1b': '\u2610', '\x1c': '\u2588', '\x1d': '\u266d', '\x1e': '\u2665',
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
  };

  private formatLines(lines: string[]): string {
    const text = (line: string) => [...(line || '')].map(ch => OledScreen.GLYPHS[ch] ?? ch).join('');
    // One block per line: a <br> between them as well doubled every gap and pushed the first and last lines off the screen
    return `<div class="display-content">${lines.map(line =>
      `<span class="mode-text">${text(line)}</span>`
    ).join('')}</div>`;
  }

  /** The DAW cancelled the temporary display: back to the stationary one now */
  cancelTemporary() {
    if (this.tempTimer !== null) {
      clearTimeout(this.tempTimer);
      this.tempTimer = null;
    }
    this.render(this.persistentContent);
  }

  private render(content: string) {
    if (this.screenElement) {
      this.screenElement.innerHTML = content;
    }
  }
}
