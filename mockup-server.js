const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME = { '.html':'text/html', '.css':'text/css', '.js':'application/javascript', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml' };

const server = http.createServer((req, res) => {
  let filePath = req.url === '/' ? '/mockup.html' : req.url;
  const full = path.join(__dirname, 'frontend', filePath.replace('/mockup.html', '/../mockup.html').replace(/^\/frontend/, ''));
  const tryPaths = [
    path.join(__dirname, filePath === '/mockup.html' ? 'mockup.html' : 'frontend' + filePath),
    path.join(__dirname, 'mockup.html')
  ];
  let served = false;
  for (const p of tryPaths) {
    if (fs.existsSync(p)) {
      const ext = path.extname(p);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
      res.end(fs.readFileSync(p));
      served = true; break;
    }
  }
  if (!served) { res.writeHead(404); res.end('Not found: ' + filePath); }
});

server.listen(4000, () => console.log('Mockup server on http://localhost:4000'));
