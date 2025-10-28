export class OledScreen {
  private screenElement: HTMLElement | null = null;
  private persistentContent: string = '';
  private tempTimer: number | null = null;
  private readonly TEMP_DISPLAY_DURATION = 2000; // 2 seconds

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

  private formatLines(lines: string[]): string {
    // Format lines as HTML similar to the original structure
    return `<div class="display-content">${lines.map(line =>
      `<span class="mode-text">${line || ''}</span>`
    ).join('<br>')}</div>`;
  }

  private render(content: string) {
    if (this.screenElement) {
      this.screenElement.innerHTML = content;
    }
  }
}
