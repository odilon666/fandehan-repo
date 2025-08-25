const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const Reservation = require('../models/Reservation');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');
const emailService = require('../utils/email');
const logger = require('../utils/logger');

const router = express.Router();

// --- POST créer Payment Intent Stripe ---
router.post('/create-payment-intent', authenticate, async (req, res) => {
  try {
    const { reservationId, type = 'payment' } = req.body;

    const reservation = await Reservation.findById(reservationId).populate('client equipment');
    if (!reservation) return res.status(404).json({ error: 'Réservation non trouvée' });

    if (req.user.role === 'client' && reservation.client._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const amount = type === 'deposit' ? Math.round(reservation.totalCost * 0.3) : reservation.totalCost;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'eur',
      metadata: { reservationId, clientId: reservation.client._id.toString(), type }
    });

    const payment = new Payment({
      reservation: reservationId,
      client: reservation.client._id,
      amount,
      type,
      status: 'pending',
      stripePaymentIntentId: paymentIntent.id
    });

    await payment.save();

    res.json({ clientSecret: paymentIntent.client_secret, paymentId: payment._id, amount });
  } catch (error) {
    logger.error('Erreur création Payment Intent:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- POST webhook Stripe ---
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try { event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET); } 
  catch (err) { 
    logger.error('Erreur webhook Stripe:', err.message); 
    return res.status(400).send(`Webhook Error: ${err.message}`); 
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id }).populate('reservation client');
        if (payment) {
          await payment.markAsSucceeded({ stripeChargeId: paymentIntent.charges.data[0]?.id, transactionId: paymentIntent.id });
          const reservation = payment.reservation;
          if (payment.type === 'deposit') {
            reservation.deposit.status = 'paid';
            reservation.paymentStatus = 'partial';
          } else {
            reservation.paymentStatus = 'paid';
          }
          await reservation.save();
          try { await emailService.sendPaymentNotification(payment, reservation, payment.client); } 
          catch (emailError) { logger.error('Erreur email paiement:', emailError); }
          logger.info(`Paiement confirmé: ${payment._id} - ${payment.amount}€`);
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const failedPayment = event.data.object;
        const paymentRecord = await Payment.findOne({ stripePaymentIntentId: failedPayment.id }).populate('reservation client');
        if (paymentRecord) {
          await paymentRecord.markAsFailed(failedPayment.last_payment_error?.message);
          try { await emailService.sendPaymentNotification(paymentRecord, paymentRecord.reservation, paymentRecord.client); } 
          catch (emailError) { logger.error('Erreur email échec paiement:', emailError); }
          logger.warn(`Paiement échoué: ${paymentRecord._id}`);
        }
        break;
      }
    }
    res.json({ received: true });
  } catch (error) {
    logger.error('Erreur traitement webhook:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- GET historique des paiements ---
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    const query = {};
    if (req.user.role === 'client') query.client = req.user._id;
    if (status) query.status = status;
    if (type) query.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const payments = await Payment.find(query)
      .populate('reservation', 'startDate endDate totalCost')
      .populate('client', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(query);
    res.json({ payments, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    logger.error('Erreur récupération paiements:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- GET paiement par ID ---
router.get('/:id', authenticate, validateObjectId(), async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role === 'client') query.client = req.user._id;

    const payment = await Payment.findOne(query).populate('reservation').populate('client', 'firstName lastName email');
    if (!payment) return res.status(404).json({ error: 'Paiement non trouvé' });

    res.json(payment);
  } catch (error) {
    logger.error('Erreur récupération paiement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- POST remboursement (admin) ---
router.post('/:id/refund', authenticate, authorize('admin'), validateObjectId(), async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const payment = await Payment.findById(req.params.id).populate('reservation client');
    if (!payment) return res.status(404).json({ error: 'Paiement non trouvé' });
    if (payment.status !== 'succeeded') return res.status(400).json({ error: 'Seuls les paiements réussis peuvent être remboursés' });

    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      amount: amount ? amount * 100 : undefined,
      reason: 'requested_by_customer'
    });

    const refundPayment = new Payment({
      reservation: payment.reservation._id,
      client: payment.client._id,
      amount: -(amount || payment.amount),
      type: 'refund',
      status: 'succeeded',
      stripeRefundId: refund.id,
      refundReason: reason
    });
    await refundPayment.save();

    logger.info(`Remboursement créé: ${refundPayment._id} - ${refundPayment.amount}€`);
    res.json({ message: 'Remboursement effectué', refund: refundPayment });
  } catch (error) {
    logger.error('Erreur remboursement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- GET stats paiements (admin) ---
router.get('/stats/overview', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchStage = { status: 'succeeded' };
    if (Object.keys(dateFilter).length > 0) matchStage.paymentDate = dateFilter;

    const stats = await Payment.aggregate([
      { $match: matchStage },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' }, totalTransactions: { $sum: 1 }, averageTransaction: { $avg: '$amount' } } }
    ]);

    const paymentsByType = await Payment.aggregate([
      { $match: matchStage },
      { $group: { _id: '$type', count: { $sum: 1 }, total: { $sum: '$amount' } } }
    ]);

    res.json({
      overview: stats[0] || { totalRevenue: 0, totalTransactions: 0, averageTransaction: 0 },
      byType: paymentsByType
    });
  } catch (error) {
    logger.error('Erreur stats paiements:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
