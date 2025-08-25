const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: [true, 'L\'équipement est requis']
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Le client est requis']
  },
  startDate: {
    type: Date,
    required: [true, 'La date de début est requise']
  },
  endDate: {
    type: Date,
    required: [true, 'La date de fin est requise']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  totalCost: {
    type: Number,
    required: true,
    min: 0
  },
  dailyRate: {
    type: Number,
    required: true,
    min: 0
  },
  numberOfDays: {
    type: Number,
    required: true,
    min: 1
  },
  deliveryAddress: {
    street: String,
    city: String,
    postalCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  deliveryRequired: {
    type: Boolean,
    default: false
  },
  deliveryCost: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    maxlength: [500, 'Les notes ne peuvent pas dépasser 500 caractères']
  },
  adminNotes: {
    type: String,
    maxlength: [500, 'Les notes admin ne peuvent pas dépasser 500 caractères']
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String,
  cancellationReason: String,
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid', 'refunded'],
    default: 'unpaid'
  },
  deposit: {
    amount: Number,
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour les performances
reservationSchema.index({ equipment: 1, startDate: 1, endDate: 1 });
reservationSchema.index({ client: 1, status: 1 });
reservationSchema.index({ startDate: 1, endDate: 1 });

// Virtual pour la durée en jours
reservationSchema.virtual('duration').get(function() {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Validation personnalisée pour s'assurer que endDate > startDate
reservationSchema.pre('validate', function(next) {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    next(new Error('La date de fin doit être postérieure à la date de début'));
  }
  next();
});

// Calcul automatique du coût total et du nombre de jours
reservationSchema.pre('save', function(next) {
  if (this.startDate && this.endDate && this.dailyRate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    this.numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    this.totalCost = (this.numberOfDays * this.dailyRate) + (this.deliveryCost || 0);
  }
  next();
});

// Méthode pour vérifier les conflits de dates
reservationSchema.statics.checkConflict = async function(equipmentId, startDate, endDate, excludeReservationId = null) {
  const query = {
    equipment: equipmentId,
    status: { $in: ['approved', 'active'] },
    $or: [
      {
        startDate: { $lt: endDate },
        endDate: { $gt: startDate }
      }
    ]
  };

  if (excludeReservationId) {
    query._id = { $ne: excludeReservationId };
  }

  const conflicts = await this.find(query);
  return conflicts.length > 0;
};

// Méthode pour obtenir les réservations actives
reservationSchema.statics.getActiveReservations = function() {
  return this.find({
    status: 'active',
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() }
  }).populate('equipment client');
};

module.exports = mongoose.model('Reservation', reservationSchema);