const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Middleware d'authentification
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Token d\'authentification requis' 
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('+password');
      
      if (!user || !user.isActive) {
        return res.status(401).json({ 
          error: 'Utilisateur non trouvé ou inactif' 
        });
      }

      req.user = user;
      req.userId = user._id;
      next();
    } catch (jwtError) {
      logger.warn('Token JWT invalide:', jwtError.message);
      return res.status(401).json({ 
        error: 'Token d\'authentification invalide' 
      });
    }
  } catch (error) {
    logger.error('Erreur dans le middleware d\'authentification:', error);
    return res.status(500).json({ 
      error: 'Erreur interne du serveur' 
    });
  }
};

// Middleware d'autorisation par rôle
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentification requise' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Accès refusé - permissions insuffisantes' 
      });
    }

    next();
  };
};

// Middleware pour vérifier si l'utilisateur peut accéder à ses propres données
const authorizeOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentification requise' 
    });
  }

  // Les admins peuvent accéder à toutes les données
  if (req.user.role === 'admin') {
    return next();
  }

  // Les clients ne peuvent accéder qu'à leurs propres données
  const targetUserId = req.params.userId || req.params.id || req.body.client;
  if (targetUserId && targetUserId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ 
      error: 'Accès refusé - vous ne pouvez accéder qu\'à vos propres données' 
    });
  }

  next();
};

module.exports = {
  authenticate,
  authorize,
  authorizeOwner
};