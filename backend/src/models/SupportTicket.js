const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true,
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: [true, 'Le sujet est requis'],
    maxlength: [200, 'Le sujet ne peut pas dépasser 200 caractères']
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    maxlength: [2000, 'La description ne peut pas dépasser 2000 caractères']
  },
  category: {
    type: String,
    enum: ['technical', 'billing', 'reservation', 'equipment', 'general'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'],
    default: 'open'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  messages: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [1000, 'Le message ne peut pas dépasser 1000 caractères']
    },
    isInternal: {
      type: Boolean,
      default: false
    },
    attachments: [{
      filename: String,
      originalName: String,
      mimeType: String
    }],
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  reservation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation'
  },
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment'
  },
  tags: [String],
  resolution: String,
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  satisfaction: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    ratedAt: Date
  }
}, {
  timestamps: true
});

// Index pour les performances
supportTicketSchema.index({ client: 1, status: 1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });
supportTicketSchema.index({ category: 1, priority: 1 });

// Génération automatique du numéro de ticket
supportTicketSchema.pre('save', async function(next) {
  if (!this.ticketNumber) {
    const count = await this.constructor.countDocuments();
    this.ticketNumber = `TK${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Méthode pour ajouter un message
supportTicketSchema.methods.addMessage = function(authorId, content, isInternal = false, attachments = []) {
  this.messages.push({
    author: authorId,
    content,
    isInternal,
    attachments
  });
  return this.save();
};

// Méthode pour résoudre le ticket
supportTicketSchema.methods.resolve = function(resolvedBy, resolution) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.resolvedBy = resolvedBy;
  this.resolution = resolution;
  return this.save();
};

// Méthode statique pour obtenir les statistiques des tickets
supportTicketSchema.statics.getTicketStats = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: {
          status: '$status',
          category: '$category'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.status',
        categories: {
          $push: {
            category: '$_id.category',
            count: '$count'
          }
        },
        total: { $sum: '$count' }
      }
    }
  ]);
};

module.exports = mongoose.model('SupportTicket', supportTicketSchema);