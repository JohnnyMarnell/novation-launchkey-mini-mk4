# Novation Launchkey Mini MK4 GUI

A web-based MIDI controller that simulates the Novation Launchkey Mini MK4.

## Quick Start

```bash
# Install dependencies
yarn install

# Start server with HMR (http://localhost:5173)
yarn dev

# Build for production (port 3000)
yarn build

# Run production build
yarn start
```

## Controls

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
