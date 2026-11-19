import MidiInterface from '../MidiInterface';

// The eight encoders. They are endless on the device, sending relative steps
// (Transport mode: CC 85-92 on channel 16, 64 ± the step size), so a knob here
// is a dial you push, not a value you set:
//
//   drag      up or right turns it up, down or left down — never round in a
//             circle, which is fiddly with a mouse and worse with a finger.
//             Pointer-captured, so the drag keeps going outside the knob and a
//             touch never scrolls the page. Shift: a quarter of the speed.
//   wheel     a mouse wheel or a two-finger trackpad swipe
//   keys      ↑ → one step up, ↓ ← one down, PgUp / PgDn four, when focused
//
// Steps are gathered and sent once a frame, as the device sends them: a size of
// 1, 2 or 4 a message (65/66/68 up, 63/62/60 down), so a fast drag arrives
// accelerated and a slow one a step at a time. The cap turns with every step.

const STEP_PX = 6;
const WHEEL_PX = 50;   // a mouse-wheel notch is 100 px in Chromium: two steps; a trackpad adds up
const DEG_PER_STEP = 9;
const SIZES = [4, 2, 1];

export class Knobs {
  private readonly ccMixer = 21;
  private readonly ccTransport = 85;
  private readonly knobChannel = 15;
  private readonly knobMode: 'mixer' | 'transport' = 'transport';

  constructor(private midi: MidiInterface) {
    document.querySelectorAll<HTMLElement>('.knob[data-knob-index]').forEach(el => {
      const index = Number(el.dataset.knobIndex);
      const cap = el.querySelector<HTMLElement>('.knob-visual');
      if (cap && index >= 0) this.wire(el, cap, index);
    });
  }

  private wire(knob: HTMLElement, cap: HTMLElement, index: number) {
    let pending = 0;        // whole steps not sent yet
    let carry = 0;          // drag distance not yet a whole step
    let turn = 0;           // the cap's angle
    let value = 64;         // mixer mode only: an absolute 0-127
    let frame = 0;
    let last: { x: number; y: number } | null = null;

    const flush = () => {
      frame = 0;
      let n = pending;
      pending = 0;
      if (!n) return;
      turn += n * DEG_PER_STEP;
      cap.style.setProperty('--turn', `${turn}deg`);
      if (this.knobMode === 'mixer') {
        value = Math.max(0, Math.min(127, value + n));
        this.midi.sendCC(this.ccMixer + index, value, this.knobChannel);
        cap.setAttribute('aria-valuenow', String(value));
        return;
      }
      const sign = Math.sign(n);
      for (n = Math.abs(n); n > 0;) {
        const size = SIZES.find(s => s <= n)!;
        this.midi.sendCC(this.ccTransport + index, 64 + sign * size, this.knobChannel);
        n -= size;
      }
    };
    const steps = (n: number) => {
      if (!n) return;
      pending += n;
      frame ||= requestAnimationFrame(flush);
    };

    cap.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      e.preventDefault();
      cap.setPointerCapture(e.pointerId);
      cap.focus({ preventScroll: true });
      last = { x: e.clientX, y: e.clientY };
      carry = 0;
      knob.classList.add('turning');
    });
    cap.addEventListener('pointermove', e => {
      if (!last || !cap.hasPointerCapture(e.pointerId)) return;
      const moved = (last.y - e.clientY) + (e.clientX - last.x);
      last = { x: e.clientX, y: e.clientY };
      carry += moved * (e.shiftKey ? 0.25 : 1);
      const whole = Math.trunc(carry / STEP_PX);
      carry -= whole * STEP_PX;
      steps(whole);
    });
    const end = () => {
      last = null;
      knob.classList.remove('turning');
    };
    cap.addEventListener('pointerup', end);
    cap.addEventListener('pointercancel', end);

    let wheelCarry = 0;
    cap.addEventListener('wheel', e => {
      e.preventDefault();
      // Lines (a mouse wheel's notches) are a step each; pixels (a trackpad) add up
      const px = e.deltaMode === 1 ? e.deltaY * WHEEL_PX : e.deltaY;
      wheelCarry -= px * (e.shiftKey ? 0.25 : 1);
      const whole = Math.trunc(wheelCarry / WHEEL_PX);
      wheelCarry -= whole * WHEEL_PX;
      steps(whole);
    }, { passive: false });

    cap.addEventListener('keydown', e => {
      const by: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 4, PageDown: -4 };
      if (!(e.key in by)) return;
      e.preventDefault();
      e.stopPropagation();   // the arrow keys are buttons elsewhere on the page
      steps(by[e.key]);
    });
  }
}
