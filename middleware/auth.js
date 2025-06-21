const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.user.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'Token is not valid' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Add user to request object
    req.user = user;
    next();

  } catch (err) {
    console.error('Auth middleware error:', err);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token is not valid' });
    } else if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired' });
    }
    
    res.status(500).json({ error: 'Server error' });
  }
};

// Optional auth middleware (doesn't require token but adds user if present)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.user.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (err) {
    // Continue without user if token is invalid
    next();
  }
};

// Admin middleware (requires admin role)
const adminAuth = async (req, res, next) => {
  try {
    // First check if user is authenticated
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.user.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'Token is not valid' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Check if user is admin (you can add an isAdmin field to User model)
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    req.user = user;
    next();

  } catch (err) {
    console.error('Admin auth middleware error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Rate limiting middleware
const rateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    // Clean old entries
    for (const [key, timestamp] of requests.entries()) {
      if (now - timestamp > windowMs) {
        requests.delete(key);
      }
    }
    
    // Check current requests
    const userRequests = requests.get(ip) || [];
    const recentRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
    
    if (recentRequests.length >= max) {
      return res.status(429).json({ 
        error: 'Too many requests, please try again later',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    // Add current request
    recentRequests.push(now);
    requests.set(ip, recentRequests);
    
    next();
  };
};

// CORS middleware
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://yourdomain.com'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: 'Validation Error', details: errors });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ 
      error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` 
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

module.exports = {
  auth,
  optionalAuth,
  adminAuth,
  rateLimit,
  corsOptions,
  errorHandler,
  requestLogger,
  securityHeaders
}; 