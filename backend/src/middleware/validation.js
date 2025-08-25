const Joi = require('joi');
const logger = require('../utils/logger');

// Validation des schémas
const schemas = {
  // Authentification
  register: Joi.object({
    firstName: Joi.string().trim().max(50).required(),
    lastName: Joi.string().trim().max(50).required(),
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required()
      .messages({
        'string.pattern.base': 'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial'
      }),
    phone: Joi.string().pattern(/^[\+]?[0-9\-\(\)\s]+$/).optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Équipement
  createEquipment: Joi.object({
    name: Joi.string().trim().max(100).required(),
    description: Joi.string().max(1000).required(),
    category: Joi.string().valid('excavateur', 'bulldozer', 'grue', 'chargeuse', 'compacteur', 'autres').required(),
    brand: Joi.string().trim().required(),
    model: Joi.string().trim().required(),
    year: Joi.number().min(1950).max(new Date().getFullYear() + 1).optional(),
    dailyRate: Joi.number().min(0).required(),
    specifications: Joi.object({
      weight: Joi.number().min(0).optional(),
      power: Joi.number().min(0).optional(),
      capacity: Joi.number().min(0).optional(),
      fuel: Joi.string().valid('diesel', 'essence', 'electrique', 'hybride').optional()
    }).optional(),
    location: Joi.object({
      address: Joi.string().optional(),
      city: Joi.string().optional(),
      coordinates: Joi.object({
        latitude: Joi.number().min(-90).max(90).optional(),
        longitude: Joi.number().min(-180).max(180).optional()
      }).optional()
    }).optional(),
    features: Joi.array().items(Joi.string()).optional(),
    minimumRentalDays: Joi.number().min(1).optional(),
    maximumRentalDays: Joi.number().min(1).optional()
  }),

  // Réservation
  createReservation: Joi.object({
    equipment: Joi.string().hex().length(24).required(),
    startDate: Joi.date().min('now').required(),
    endDate: Joi.date().greater(Joi.ref('startDate')).required(),
    deliveryAddress: Joi.object({
      street: Joi.string().optional(),
      city: Joi.string().optional(),
      postalCode: Joi.string().optional(),
      coordinates: Joi.object({
        latitude: Joi.number().min(-90).max(90).optional(),
        longitude: Joi.number().min(-180).max(180).optional()
      }).optional()
    }).optional(),
    deliveryRequired: Joi.boolean().optional(),
    notes: Joi.string().max(500).optional()
  }),

  // Maintenance
  createMaintenance: Joi.object({
    equipment: Joi.string().hex().length(24).required(),
    type: Joi.string().valid('preventive', 'corrective', 'emergency').required(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
    title: Joi.string().max(100).required(),
    description: Joi.string().max(1000).required(),
    scheduledDate: Joi.date().min('now').required(),
    estimatedDuration: Joi.number().min(0.5).optional(),
    technician: Joi.string().hex().length(24).optional()
  }),

  // Support
  createSupportTicket: Joi.object({
    subject: Joi.string().max(200).required(),
    description: Joi.string().max(2000).required(),
    category: Joi.string().valid('technical', 'billing', 'reservation', 'equipment', 'general').required(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
    reservation: Joi.string().hex().length(24).optional(),
    equipment: Joi.string().hex().length(24).optional()
  })
};

// Middleware de validation
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      logger.error(`Schema de validation '${schemaName}' non trouvé`);
      return res.status(500).json({ 
        error: 'Erreur de configuration de validation' 
      });
    }

    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({ 
        error: 'Données invalides',
        details: errors 
      });
    }

    req.validatedData = value;
    next();
  };
};

// Validation des paramètres d'URL
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ 
        error: `ID ${paramName} invalide` 
      });
    }

    next();
  };
};

module.exports = {
  validate,
  validateObjectId,
  schemas
};