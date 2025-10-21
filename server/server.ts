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
    const indexPath = resolve(__dirname, '../dist/index.html');
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

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      midiHandler.handleMessage(message);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      ws.send(JSON.stringify({ error: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    midiHandler.removeClient(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  // Send connection success message
  ws.send(JSON.stringify({ type: 'connected', message: 'Connected to MIDI server' }));
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
