import { createReadStream } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.pdf': 'application/pdf' };
const host = '127.0.0.1';
const port = Number(process.env.PORT ?? 4173);

try {
  await access(resolve(root, 'index.html'));
} catch {
  console.error('Primero ejecuta npm run build.');
  process.exit(1);
}

const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  try {
    const url = new URL(request.url, 'http://localhost');
    const path = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!path.startsWith(root + sep)) {
      response.writeHead(403).end();
      return;
    }
    const file = await stat(path);
    if (!file.isFile()) {
      response.writeHead(404).end();
      return;
    }
    const headers = {
      'Content-Type': types[extname(path)] ?? 'application/octet-stream',
      'Content-Length': file.size,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    };
    let range;
    if (extname(path) === '.pdf') {
      headers['Accept-Ranges'] = 'bytes';
      const requested = request.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
      if (requested && (requested[1] || requested[2])) {
        range = requested[1]
          ? { start: Number(requested[1]), end: requested[2] ? Math.min(Number(requested[2]), file.size - 1) : file.size - 1 }
          : { start: Math.max(0, file.size - Number(requested[2])), end: file.size - 1 };
        if (range.end < range.start) {
          response.writeHead(416, { 'Content-Range': `bytes */${file.size}` }).end();
          return;
        }
        headers['Content-Range'] = `bytes ${range.start}-${range.end}/${file.size}`;
        headers['Content-Length'] = range.end - range.start + 1;
      }
    }
    response.writeHead(range ? 206 : 200, headers);
    if (request.method === 'HEAD') response.end();
    else {
      const stream = createReadStream(path, range);
      stream.on('error', error => response.destroy(error));
      response.on('close', () => stream.destroy());
      stream.pipe(response);
    }
  } catch {
    response.writeHead(404).end();
  }
});
server.on('error', error => {
  console.error(error.message);
  process.exitCode = 1;
});
server.listen(port, host, () => console.log(`Debian en práctica · http://${host}:${port}`));
