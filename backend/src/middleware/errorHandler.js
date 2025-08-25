const logger = require('../utils/logger');

// Middleware pour gérer toutes les erreurs
function errorHandler(error, req, res, next) {
  logger.error('Erreur non gérée:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message
    }));
    return res.status(400).json({ error: 'Erreur de validation', details: errors });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({ error: 'Erreur de duplication', message: `${field} déjà utilisé` });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({ error: 'ID invalide' });
  }

  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token d\'authentification invalide' });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token d\'authentification expiré' });
  }

  if (error.type && error.type.startsWith('Stripe')) {
    return res.status(400).json({ error: 'Erreur de paiement', message: error.message });
  }

  const statusCode = error.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' ? 'Erreur interne du serveur' : error.message;

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
}

module.exports = errorHandler;
