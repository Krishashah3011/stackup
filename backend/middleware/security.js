const helmet = require('helmet');

// ─── Helmet security headers ──────────────────────────────────────────────────
// Configured for API-only usage (no serving HTML pages)
const securityHeaders = helmet({
  contentSecurityPolicy: false,  // Not needed for pure API
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

// ─── Remove sensitive server info ─────────────────────────────────────────────
const removeServerHeader = (req, res, next) => {
  res.removeHeader('X-Powered-By');
  next();
};

// ─── Request size guard (belt-and-suspenders over express.json limit) ─────────
const requestSizeGuard = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

  if (contentLength > MAX_BYTES) {
    return res.status(413).json({
      success: false,
      message: 'Request payload too large. Maximum size is 10 MB.',
    });
  }
  next();
};

module.exports = { securityHeaders, removeServerHeader, requestSizeGuard };
