# Novation Launchkey Mini MK4 GUI

A web-based MIDI controller that simulates the Novation Launchkey Mini MK4. Features a 25-key keyboard and 8 rotary knobs that send MIDI events through virtual MIDI ports.

## Features

Creates four virtual MIDI ports:
- **Launchkey Mini MK4 MIDI Out** - Keyboard notes (channel 8)
- **Launchkey Mini MK4 MIDI In** - Input receiver
- **Launchkey Mini MK4 DAW Out** - Knob CC messages (channel 15)
- **Launchkey Mini MK4 DAW In** - DAW feedback

## Quick Start

```bash
# Install dependencies
yarn install

# Start server (http://localhost:3000)
yarn dev

# Build for production
yarn build

# Run production build
yarn start
```

## Controls

**Keyboard**: 25 keys (C3-C5, notes 48-72), velocity 100
**Knobs**: K1-K8 (CC 21-28), range 0-127, drag vertically to adjust

See html and code for various CC messages of buttons.
When using "transport mode", the encoders / knobs send endless incremental messages
(e.g. for transport timeline scrubbing, I suppose).
CC num: 85 - 92, vals: 65, 66, 68 for regular, fast, very fast right / +, and 63, 62, 60 for left / -.
All on channel 15 (plus standard touch start and end if enabled, on channel 14 num [knob], val 127 and 0)
Pads are channel 0, rows are cc 96 - 103, 112 - 119

## License

MIT
