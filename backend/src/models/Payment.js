const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  reservation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Le montant est requis'],
    min: [0, 'Le montant doit être positif']
  },
  currency: {
    type: String,
    default: 'EUR',
    uppercase: true
  },
  type: {
    type: String,
    enum: ['deposit', 'payment', 'refund'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'bank_transfer', 'cash', 'check'],
    default: 'stripe'
  },
  stripePaymentIntentId: String,
  stripeChargeId: String,
  stripeRefundId: String,
  transactionId: String,
  paymentDate: Date,
  failureReason: String,
  refundReason: String,
  refundDate: Date,
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Index pour les performances
paymentSchema.index({ reservation: 1, status: 1 });
paymentSchema.index({ client: 1, paymentDate: -1 });
paymentSchema.index({ stripePaymentIntentId: 1 });

// Méthode pour marquer le paiement comme réussi
paymentSchema.methods.markAsSucceeded = function(transactionData = {}) {
  this.status = 'succeeded';
  this.paymentDate = new Date();
  if (transactionData.stripeChargeId) {
    this.stripeChargeId = transactionData.stripeChargeId;
  }
  if (transactionData.transactionId) {
    this.transactionId = transactionData.transactionId;
  }
  return this.save();
};

// Méthode pour marquer le paiement comme échoué
paymentSchema.methods.markAsFailed = function(reason) {
  this.status = 'failed';
  this.failureReason = reason;
  return this.save();
};

// Méthode statique pour calculer les revenus par période
paymentSchema.statics.getRevenueByPeriod = async function(startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        status: 'succeeded',
        paymentDate: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        totalTransactions: { $sum: 1 }
      }
    }
  ]);
};

// Méthode statique pour obtenir les statistiques de paiement
paymentSchema.statics.getPaymentStats = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
};

module.exports = mongoose.model('Payment', paymentSchema);