const rateLimit = require('express-rate-limit');

// ─── General API rate limit ───────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs:          15 * 60 * 1000, // 15 minutes
  max:               200,
  standardHeaders:   true,
  legacyHeaders:     false,
  message: {
    success: false,
    message: 'Too many requests. Please wait 15 minutes before trying again.',
  },
  skip: (req) => process.env.NODE_ENV === 'test',
});

// ─── Auth endpoints (tighter) ─────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs:          15 * 60 * 1000,
  max:               20,             // 20 login/register attempts per 15 min
  standardHeaders:   true,
  legacyHeaders:     false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please wait 15 minutes.',
  },
  skip: (req) => process.env.NODE_ENV === 'test',
});

// ─── AI endpoints (expensive — Gemini calls) ──────────────────────────────────
const aiLimiter = rateLimit({
  windowMs:          60 * 60 * 1000, // 1 hour
  max:               20,             // 20 AI calls per hour per IP
  standardHeaders:   true,
  legacyHeaders:     false,
  message: {
    success: false,
    message: 'AI request limit reached. You can make 20 AI requests per hour.',
  },
  skip: (req) => process.env.NODE_ENV === 'test',
});

module.exports = { apiLimiter, authLimiter, aiLimiter };
