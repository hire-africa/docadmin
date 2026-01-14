const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '8080', 10);

console.log(`Starting Next.js server on ${hostname}:${port}`);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        const { pathname } = parsedUrl;

        // Basic logging for production
        if (!pathname.startsWith('/_next')) {
          console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);
        }

        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('CRITICAL: Error handling request:', err);
        res.statusCode = 500;
        res.end('internal server error');
      }
    })
      .once('error', (err) => {
        console.error('FAILED to start server:', err);
        process.exit(1);
      })
      .listen(port, hostname, () => {
        console.log(`🚀 Server ready on http://${hostname}:${port} (NODE_ENV: ${process.env.NODE_ENV})`);
      });
  })
  .catch((err) => {
    console.error('FAILED to prepare Next.js app:', err);
    process.exit(1);
  });
