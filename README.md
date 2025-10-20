# Novation Launchkey Mini MK4 GUI

An Electron desktop application that provides a graphical interface for the Novation Launchkey Mini MK4. The GUI features a 25-key mini keyboard and 8 rotary knobs that send proper MIDI events through virtual MIDI devices.

## Features

- **25-Key Keyboard**: Interactive keyboard bed with visual feedback
- **8 Rotary Knobs**: Drag-controlled knobs that send CC messages
- **Virtual MIDI Devices**: Creates two properly named virtual MIDI ports using @julusian/midi
  - `Launchkey Mini MK4 MIDI Out`
  - `Launchkey Mini MK4 MIDI In`
- **Real-time MIDI Events**:
  - Note On/Off messages from keyboard
  - CC messages (21-28) from knobs

## Requirements

- Node.js (v18 or higher recommended)
- npm or yarn

## Installation

```bash
npm install
```

## Usage

Start the Electron app in development mode:

```bash
npm run dev
```

This will launch the app in an Electron window with hot-reloading enabled.

## MIDI Controls

### Keyboard
- **Range**: C3 to C5 (MIDI notes 48-72)
- **Interaction**: Click or touch keys to trigger Note On/Off messages
- **Velocity**: Fixed at 100

### Knobs
- **Count**: 8 knobs (K1-K8)
- **CC Numbers**: 21, 22, 23, 24, 25, 26, 27, 28
- **Range**: 0-127
- **Interaction**: Click and drag vertically to adjust values

## Build

Build the Electron app for your platform:

```bash
npm run electron:build
```

This will create a distributable application in the `release/` directory:
- **macOS**: `.dmg` file
- **Windows**: `.exe` installer
- **Linux**: `.AppImage` file

## Project Structure

```
electron/
  ├── main.ts                 # Electron main process
  └── preload.ts              # Preload script
src/
  ├── midi/
  │   └── MidiManager.ts      # MIDI virtual port management
  ├── components/
  │   ├── Keyboard.ts         # Keyboard GUI component
  │   └── Knobs.ts            # Knobs GUI component
  ├── main.ts                 # Application entry point
  └── style.css               # Styling
```

## Technologies

- TypeScript
- Electron
- Vite
- @julusian/midi

## How It Works

The app creates two virtual MIDI ports that other applications can connect to:
- **Launchkey Mini MK4 MIDI Out**: Sends MIDI messages when you interact with the GUI
- **Launchkey Mini MK4 MIDI In**: Receives MIDI messages (for future bidirectional communication)

You can connect these virtual ports to your DAW (Ableton, Logic Pro, etc.) or any other MIDI-compatible software to use the GUI as a MIDI controller.
