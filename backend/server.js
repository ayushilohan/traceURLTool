const express = require('express');
const cors = require('cors');
const got = require('got');
const { parse } = require('url');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Helper: Trace redirects
async function traceRedirects(url) {
  const response = await got(url, {
    followRedirect: true,
    throwHttpErrors: false
  });

  const redirectChain = response.redirectUrls || [];
  const allSteps = [url, ...redirectChain, response.url];
  const results = [];

  for (let i = 0; i < allSteps.length; i++) {
    const targetUrl = allSteps[i];
    const parsed = parse(targetUrl);

    try {
      const headResp = await got(targetUrl, {
        method: 'HEAD',
        followRedirect: false,
        throwHttpErrors: false
      });

      results.push({
        step: i + 1,
        status: headResp.statusCode,
        scheme: parsed.protocol.replace(':', ''),
        host: parsed.host,
        path:
          (parsed.pathname || '') +
          (parsed.search || '') +
          (parsed.hash || '')
      });
    } catch (e) {
      results.push({
        step: i + 1,
        status: 'ERR',
        scheme: parsed.protocol.replace(':', ''),
        host: parsed.host,
        path:
          (parsed.pathname || '') +
          (parsed.search || '') +
          (parsed.hash || '')
      });
    }
  }

  return results;
}

// API Endpoint
app.post('/trace', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.startsWith('http')) {
      return res.status(400).json({ message: 'Invalid URL format.' });
    }

    console.log('Tracing URL:', url);
    const result = await traceRedirects(url);
    res.json(result);
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Failed to trace URL.' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
