const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── protect ──────────────────────────────────────────────────────────────────
// Verifies the JWT in Authorization header and attaches req.user
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please log in to continue.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check user still exists in DB (guards against deleted accounts)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The account associated with this token no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    // Let the global error handler format JWT errors nicely
    next(error);
  }
};

// ─── optionalAuth ─────────────────────────────────────────────────────────────
// Attaches req.user if a valid token is present, but never blocks the request.
// Useful for routes that behave differently for authenticated users.
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user) req.user = user;
    }

    next();
  } catch {
    // Silently ignore invalid tokens for optional auth
    next();
  }
};

module.exports = { protect, optionalAuth };