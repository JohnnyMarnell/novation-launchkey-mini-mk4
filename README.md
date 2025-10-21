# Novation Launchkey Mini MK4 GUI

An Electron desktop application that simulates the Novation Launchkey Mini MK4 MIDI controller. Features a 25-key keyboard and 8 rotary knobs that send proper MIDI events through virtual MIDI devices.

## What This Does

This app creates **four virtual MIDI ports** that appear as real MIDI devices on your system, matching the actual Launchkey Mini MK4 hardware:

**Standard MIDI Ports:**
- **Launchkey Mini MK4 MIDI Out** - Sends keyboard note messages
- **Launchkey Mini MK4 MIDI In** - Receives MIDI messages (for future features)

**DAW MIDI Ports:**
- **Launchkey Mini MK4 DAW Out** - Sends knob control change messages
- **Launchkey Mini MK4 DAW In** - Receives DAW feedback (for future features)

You can connect these virtual ports to your DAW (Ableton Live, Logic Pro, FL Studio, etc.) or any MIDI-compatible software. The routing mimics the real hardware behavior where keyboard notes go to the standard MIDI port and knobs go to the DAW port.

## Requirements

- **Node.js** v18 or higher
- **macOS, Windows, or Linux**

## Quick Start

### 1. Install Dependencies

```bash
yarn install
```

### 2. Run in Development Mode

```bash
yarn dev
```

This launches the app in an Electron window with:
- Hot-reloading enabled (changes update automatically)
- DevTools open for debugging
- Virtual MIDI ports created and ready to use

### 3. Connect to Your DAW

1. Open your DAW or MIDI software
2. Go to MIDI settings/preferences
3. Look for devices named:
   - `Launchkey Mini MK4 MIDI Out` (for keyboard notes)
   - `Launchkey Mini MK4 MIDI In`
   - `Launchkey Mini MK4 DAW Out` (for knob controls)
   - `Launchkey Mini MK4 DAW In`
4. Enable/connect these devices
5. Interact with the GUI - your DAW should receive the MIDI messages!

**Tip:** Most DAWs expect knob CC messages from the DAW port. If your knobs aren't working, make sure you've enabled the "DAW Out" port.

## Building the App

To create a standalone application you can distribute:

```bash
yarn electron:build
```

This creates an installer/package in the `release/` directory:
- **macOS**: `Launchkey Mini MK4-*.dmg`
- **Windows**: `Launchkey Mini MK4 Setup *.exe`
- **Linux**: `Launchkey Mini MK4-*.AppImage`

## Controls

### Keyboard (25 Keys)
- **Range**: C3 to C5 (MIDI notes 48-72)
- **How to use**: Click or touch keys to play
- **MIDI Output**: Note On (velocity 100) when pressed, Note Off when released
- **MIDI Port**: Standard "MIDI Out" port
- **Visual feedback**: Keys light up purple/pink when active

### Knobs (8 Rotary Controls)
- **Labels**: K1, K2, K3, K4, K5, K6, K7, K8
- **CC Numbers**: 21, 22, 23, 24, 25, 26, 27, 28 (one for each knob)
- **Range**: 0-127
- **How to use**: Click and drag vertically (up = increase, down = decrease)
- **MIDI Port**: DAW "DAW Out" port (mimics real hardware behavior)
- **Visual feedback**: Indicator line rotates, value displayed below knob

## Project Structure

```
novation-launchkey-mini-mk4/
├── electron/
│   ├── main.ts           # Electron main process (creates window)
│   └── preload.ts        # Preload script (security bridge)
├── src/
│   ├── midi/
│   │   └── MidiManager.ts    # Creates virtual MIDI ports, sends MIDI messages
│   ├── components/
│   │   ├── Keyboard.ts       # 25-key keyboard GUI component
│   │   └── Knobs.ts          # 8 rotary knobs GUI component
│   ├── main.ts               # Application entry point
│   └── style.css             # UI styling (gradients, animations)
├── index.html            # HTML template
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite + Electron build config
└── .yarnrc.yml           # Yarn 4 configuration
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `yarn install` | Install all dependencies |
| `yarn dev` | Run app in development mode with hot-reload |
| `yarn electron:build` | Build distributable app for your platform |
| `yarn build` | Build for production (same as electron:build) |

## Tech Stack

- **Electron** - Desktop app framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool with hot-reload
- **@julusian/midi** - Node.js MIDI library for virtual port creation
- **Yarn 4** - Package manager

## Troubleshooting

### Virtual MIDI ports not appearing
- Make sure the app is running (`yarn dev`)
- Check the console output - you should see all 4 ports listed:
  - Launchkey Mini MK4 MIDI Out
  - Launchkey Mini MK4 MIDI In
  - Launchkey Mini MK4 DAW Out
  - Launchkey Mini MK4 DAW In
- On macOS: Check Audio MIDI Setup (Applications → Utilities)
- On Windows: Use MIDI monitoring software to verify ports exist
- On Linux: Use `aconnect -l` to list MIDI ports

### App won't start
- Ensure Node.js v18+ is installed: `node --version`
- Delete `node_modules` and reinstall: `rm -rf node_modules && yarn install`
- Check if another instance is already running

### MIDI not working in DAW
- Verify the virtual ports are enabled in your DAW's MIDI settings
- For keyboard notes: Enable "Launchkey Mini MK4 MIDI Out"
- For knobs: Enable "Launchkey Mini MK4 DAW Out"
- Try restarting your DAW after launching this app
- Some DAWs have separate track input vs control surface settings - check both

## License

MIT

## Credits

Built with Claude Code
