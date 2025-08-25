const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: [true, 'L\'équipement est requis']
  },
  type: {
    type: String,
    enum: ['preventive', 'corrective', 'emergency'],
    required: [true, 'Le type de maintenance est requis']
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  title: {
    type: String,
    required: [true, 'Le titre est requis'],
    maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
  },
  scheduledDate: {
    type: Date,
    required: [true, 'La date prévue est requise']
  },
  estimatedDuration: {
    type: Number, // en heures
    min: [0.5, 'La durée doit être d\'au moins 30 minutes']
  },
  actualStartDate: Date,
  actualEndDate: Date,
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cost: {
    labor: { type: Number, default: 0 },
    parts: { type: Number, default: 0 },
    external: { type: Number, default: 0 }
  },
  parts: [{
    name: String,
    quantity: Number,
    unitCost: Number,
    supplier: String
  }],
  workPerformed: {
    type: String,
    maxlength: [2000, 'Le détail des travaux ne peut pas dépasser 2000 caractères']
  },
  nextMaintenanceDate: Date,
  images: [{
    filename: String,
    originalName: String,
    description: String,
    takenAt: { type: Date, default: Date.now }
  }],
  notes: {
    type: String,
    maxlength: [1000, 'Les notes ne peuvent pas dépasser 1000 caractères']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour les performances
maintenanceSchema.index({ equipment: 1, scheduledDate: -1 });
maintenanceSchema.index({ status: 1, priority: 1 });
maintenanceSchema.index({ technician: 1, status: 1 });

// Virtual pour le coût total
maintenanceSchema.virtual('totalCost').get(function() {
  return (this.cost.labor || 0) + (this.cost.parts || 0) + (this.cost.external || 0);
});

// Virtual pour la durée réelle
maintenanceSchema.virtual('actualDuration').get(function() {
  if (this.actualStartDate && this.actualEndDate) {
    const diffTime = Math.abs(this.actualEndDate - this.actualStartDate);
    return Math.round(diffTime / (1000 * 60 * 60 * 100)) / 100; // en heures avec 2 décimales
  }
  return null;
});

// Middleware pour mettre à jour le statut de l'équipement
maintenanceSchema.pre('save', async function(next) {
  if (this.isModified('status')) {
    const Equipment = mongoose.model('Equipment');
    
    try {
      if (this.status === 'in_progress') {
        await Equipment.findByIdAndUpdate(this.equipment, { status: 'maintenance' });
      } else if (this.status === 'completed' || this.status === 'cancelled') {
        // Vérifier s'il n'y a pas d'autres maintenances en cours
        const otherMaintenances = await this.constructor.find({
          equipment: this.equipment,
          status: 'in_progress',
          _id: { $ne: this._id }
        });
        
        if (otherMaintenances.length === 0) {
          await Equipment.findByIdAndUpdate(this.equipment, { status: 'available' });
        }
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Méthode pour démarrer la maintenance
maintenanceSchema.methods.start = function(technicianId) {
  this.status = 'in_progress';
  this.actualStartDate = new Date();
  this.technician = technicianId;
  return this.save();
};

// Méthode pour terminer la maintenance
maintenanceSchema.methods.complete = function(workPerformed, nextMaintenanceDate) {
  this.status = 'completed';
  this.actualEndDate = new Date();
  this.workPerformed = workPerformed;
  if (nextMaintenanceDate) {
    this.nextMaintenanceDate = nextMaintenanceDate;
  }
  return this.save();
};

// Méthode statique pour obtenir les maintenances en retard
maintenanceSchema.statics.getOverdueMaintenances = function() {
  return this.find({
    status: 'scheduled',
    scheduledDate: { $lt: new Date() }
  }).populate('equipment technician');
};

module.exports = mongoose.model('Maintenance', maintenanceSchema);