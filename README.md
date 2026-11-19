# Novation Launchkey Mini MK4 GUI

A web-based MIDI controller that simulates the Novation Launchkey Mini MK4.

## Quick Start

```bash
# Install dependencies
bun install

# Start server with HMR (http://localhost:5173)
bun run dev

# Build for production (port 3000)
bun run build

# Run production build
bun run start
```

## Controls

- **Knobs** are endless encoders: drag up (or right) to turn up, down (or left) to turn
  down — never round in a circle. Shift drags at a quarter of the speed; the mouse
  wheel, a trackpad swipe and the arrow keys (when a knob is focused) work too. Fingers
  work the same way, and a knob drag never scrolls the page.
- **Buttons** take a mouse or a finger, and two fingers at once (hold ▶ and tap Func).
  Keys: `a` play, `s` record, `f` Func, `→` is ▶, `↑`/`↓` the small arrows, `z x c v /` pads.
- **Global** and **Sus** sit where the device has Arp and Scale.
- The layout follows the window: the Mini MK4's own arrangement when there is width for
  it, the knobs and pads across the whole width on a narrow screen held upright.

Currently coded for when the keyboard is in DAW and Transport modes
(thus the maximum hacktion and customizaishe opportunez).

See html and code for various CC messages of buttons.
When using "transport mode", the encoders / knobs send endless incremental messages
(e.g. for transport timeline scrubbing, I suppose).

CC num: 85 - 92, vals: 65, 66, 68 for regular, fast, very fast right / +, and 63, 62, 60 for left / -.
All on channel 15 (plus standard touch start and end if enabled, on channel 14 num [knob], val 127 and 0)
Pads are channel 0, rows are cc 96 - 103, 112 - 119

## License

MIT
