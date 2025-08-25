const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom de l\'engin est requis'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
  },
  category: {
    type: String,
    required: [true, 'La catégorie est requise'],
    enum: ['excavateur', 'bulldozer', 'grue', 'chargeuse', 'compacteur', 'autres']
  },
  brand: {
    type: String,
    required: [true, 'La marque est requise'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'Le modèle est requis'],
    trim: true
  },
  year: {
    type: Number,
    min: [1950, 'L\'année doit être supérieure à 1950'],
    max: [new Date().getFullYear() + 1, 'L\'année ne peut pas être dans le futur']
  },
  dailyRate: {
    type: Number,
    required: [true, 'Le tarif journalier est requis'],
    min: [0, 'Le tarif doit être positif']
  },
  specifications: {
    weight: Number, // en tonnes
    power: Number, // en chevaux
    capacity: Number, // capacité de charge en tonnes
    fuel: {
      type: String,
      enum: ['diesel', 'essence', 'electrique', 'hybride']
    }
  },
  images: [{
    filename: String,
    originalName: String,
    url: String,
    isPrimary: { type: Boolean, default: false }
  }],
  location: {
    address: String,
    city: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  status: {
    type: String,
    enum: ['available', 'rented', 'maintenance', 'inactive'],
    default: 'available'
  },
  features: [String], // caractéristiques spéciales
  insuranceRequired: {
    type: Boolean,
    default: true
  },
  licenseRequired: {
    type: Boolean,
    default: true
  },
  minimumRentalDays: {
    type: Number,
    default: 1,
    min: 1
  },
  maximumRentalDays: {
    type: Number,
    default: 30,
    min: 1
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour la recherche et les performances
equipmentSchema.index({ name: 'text', description: 'text', brand: 'text' });
equipmentSchema.index({ category: 1, status: 1 });
equipmentSchema.index({ dailyRate: 1 });
equipmentSchema.index({ 'location.city': 1 });

// Virtual pour l'image principale
equipmentSchema.virtual('primaryImage').get(function() {
  const primaryImg = this.images.find(img => img.isPrimary);
  return primaryImg || (this.images.length > 0 ? this.images[0] : null);
});

// Méthode pour vérifier la disponibilité
equipmentSchema.methods.isAvailable = function() {
  return this.status === 'available';
};

// Méthode statique pour rechercher des équipements disponibles
equipmentSchema.statics.findAvailable = function(startDate, endDate) {
  return this.find({
    status: 'available',
    // Ajouter ici la logique pour vérifier les conflits de réservation
  });
};

module.exports = mongoose.model('Equipment', equipmentSchema);