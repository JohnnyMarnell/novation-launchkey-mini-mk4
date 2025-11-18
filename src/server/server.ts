import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { WebSocketServer } from 'ws';
import MidiHandler from './midi-handler.js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const globalModeAvailable = args.includes('--global');

// Conditionally import GlobalKeyboardListener
let GlobalKeyboardListener: any = null;
if (globalModeAvailable) {
  try {
    const module = await import('node-global-key-listener');
    GlobalKeyboardListener = module.GlobalKeyboardListener;
    console.log('✓ Global keyboard listener available');
  } catch (error) {
    console.error('Failed to import node-global-key-listener:', error);
  }
}

const app = new Hono();
const midiHandler = new MidiHandler();

// Serve static files from dist directory
app.use('/*', serveStatic({ root: './dist' }));

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', message: 'MIDI server running' });
});

// Fallback to index.html for SPA routing
app.get('*', (c) => {
  try {
    const indexPath = resolve(__dirname, '../../dist/index.html');
    const html = readFileSync(indexPath, 'utf-8');
    return c.html(html);
  } catch (error) {
    return c.text('index.html not found. Run `npm run build` first.', 404);
  }
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const server = serve({
  fetch: app.fetch,
  port,
});

console.log(`🚀 Server running at http://localhost:${port}`);

// Create WebSocket server
const wss = new WebSocketServer({ server: server as any });

wss.on('connection', (ws) => {
  midiHandler.addClient(ws);

  let globalKeyListener: any = null;
  let isGlobalListenerActive = false;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      // Handle global keyboard listener toggle
      if (message.type === 'toggle-global-keyboard') {
        if (!GlobalKeyboardListener) {
          ws.send(JSON.stringify({
            type: 'global-keyboard-error',
            message: 'Global keyboard listener not available. Start server with --global flag.'
          }));
          return;
        }

        if (message.enabled && !isGlobalListenerActive) {
          // Start global keyboard listener
          globalKeyListener = new GlobalKeyboardListener();
          isGlobalListenerActive = true;

          globalKeyListener.addListener((e: any) => {
            // Forward global keyboard events to client
            ws.send(JSON.stringify({
              type: 'global-keyboard-event',
              event: {
                state: e.state, // "DOWN" or "UP"
                name: e.name,
                rawKey: e.rawKey
              }
            }));
          });

          console.log('✓ Global keyboard listener started for client');
          ws.send(JSON.stringify({
            type: 'global-keyboard-status',
            enabled: true
          }));
        } else if (!message.enabled && isGlobalListenerActive) {
          // Stop global keyboard listener
          if (globalKeyListener) {
            globalKeyListener.kill();
            globalKeyListener = null;
          }
          isGlobalListenerActive = false;
          console.log('✓ Global keyboard listener stopped for client');
          ws.send(JSON.stringify({
            type: 'global-keyboard-status',
            enabled: false
          }));
        }
        return;
      }

      midiHandler.handleMessage(message);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      ws.send(JSON.stringify({ error: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    // Clean up global keyboard listener on disconnect
    if (globalKeyListener) {
      globalKeyListener.kill();
    }
    midiHandler.removeClient(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  // Send connection success message with global mode availability
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connected to MIDI server',
    globalModeAvailable
  }));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing MIDI ports...');
  midiHandler.close();
  wss.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing MIDI ports...');
  midiHandler.close();
  wss.close();
  process.exit(0);
});
