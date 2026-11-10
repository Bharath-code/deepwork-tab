import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json' };
const STUB = '<script src="/tools/preview/chrome-stub.js"></script>';

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
  const file = join(ROOT, path);
  if (!file.startsWith(ROOT)) return res.writeHead(403).end();
  try {
    let body = await readFile(file);
    const ext = extname(file);
    if (ext === '.html' && !path.startsWith('/site/')) body = String(body).replace('</head>', `${STUB}</head>`);
    res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
}).listen(8766, '127.0.0.1', () => console.log('preview on http://127.0.0.1:8766'));
