const express = require('express');
const Reservation = require('../models/Reservation');
const Equipment = require('../models/Equipment');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, validateObjectId } = require('../middleware/validation');
const emailService = require('../utils/email');
const logger = require('../utils/logger');

const router = express.Router();

// --- GET toutes les réservations ---
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, equipment, startDate, endDate, client } = req.query;
    const query = {};

    if (req.user.role === 'client') query.client = req.user._id;
    else if (client) query.client = client;

    if (status) query.status = status;
    if (equipment) query.equipment = equipment;

    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reservations = await Reservation.find(query)
      .populate('equipment', 'name brand model dailyRate images')
      .populate('client', 'firstName lastName email phone')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Reservation.countDocuments(query);

    res.json({
      reservations,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    logger.error('Erreur récupération réservations:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- POST créer réservation ---
router.post('/', authenticate, validate('createReservation'), async (req, res) => {
  try {
    const { equipment: equipmentId, startDate, endDate, deliveryAddress, deliveryRequired, notes } = req.validatedData;

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) return res.status(404).json({ error: 'Équipement non trouvé' });
    if (!equipment.isAvailable()) return res.status(400).json({ error: 'Équipement non disponible' });

    const hasConflict = await Reservation.checkConflict(equipmentId, new Date(startDate), new Date(endDate));
    if (hasConflict) return res.status(400).json({ error: 'Conflit de dates avec une autre réservation' });

    const start = new Date(startDate);
    const end = new Date(endDate);
    const numberOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const dailyRate = equipment.dailyRate;
    const deliveryCost = deliveryRequired ? 50 : 0;
    const totalCost = (numberOfDays * dailyRate) + deliveryCost;

    const reservation = new Reservation({
      equipment: equipmentId,
      client: req.user._id,
      startDate: start,
      endDate: end,
      dailyRate,
      numberOfDays,
      totalCost,
      deliveryAddress,
      deliveryRequired,
      deliveryCost,
      notes
    });

    await reservation.save();
    await reservation.populate('equipment client');

    try { await emailService.sendReservationConfirmation(reservation, req.user, equipment); } 
    catch (emailError) { logger.error('Erreur email confirmation:', emailError); }

    logger.info(`Réservation créée par ${req.user.email} pour ${equipment.name}`);
    res.status(201).json({ message: 'Réservation créée', reservation });
  } catch (error) {
    logger.error('Erreur création réservation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- GET réservation par ID ---
router.get('/:id', authenticate, validateObjectId(), async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role === 'client') query.client = req.user._id;

    const reservation = await Reservation.findOne(query)
      .populate('equipment')
      .populate('client', 'firstName lastName email phone')
      .populate('approvedBy', 'firstName lastName');

    if (!reservation) return res.status(404).json({ error: 'Réservation non trouvée' });
    res.json(reservation);
  } catch (error) {
    logger.error('Erreur récupération réservation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- PATCH approuver réservation (admin) ---
router.patch('/:id/approve', authenticate, authorize('admin'), validateObjectId(), async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate('equipment client');
    if (!reservation) return res.status(404).json({ error: 'Réservation non trouvée' });
    if (reservation.status !== 'pending') return res.status(400).json({ error: 'Seules les réservations en attente peuvent être approuvées' });

    const hasConflict = await Reservation.checkConflict(reservation.equipment._id, reservation.startDate, reservation.endDate, reservation._id);
    if (hasConflict) return res.status(400).json({ error: 'Conflit de dates détecté' });

    reservation.status = 'approved';
    reservation.approvedBy = req.user._id;
    reservation.approvedAt = new Date();
    await reservation.save();

    const today = new Date();
    if (reservation.startDate <= today && reservation.endDate >= today) {
      await Equipment.findByIdAndUpdate(reservation.equipment._id, { status: 'rented' });
    }

    logger.info(`Réservation ${reservation._id} approuvée par ${req.user.email}`);
    res.json({ message: 'Réservation approuvée', reservation });
  } catch (error) {
    logger.error('Erreur approbation réservation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- PATCH rejeter réservation (admin) ---
router.patch('/:id/reject', authenticate, authorize('admin'), validateObjectId(), async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const reservation = await Reservation.findById(req.params.id).populate('equipment client');
    if (!reservation) return res.status(404).json({ error: 'Réservation non trouvée' });
    if (reservation.status !== 'pending') return res.status(400).json({ error: 'Seules les réservations en attente peuvent être rejetées' });

    reservation.status = 'rejected';
    reservation.rejectionReason = rejectionReason;
    await reservation.save();

    logger.info(`Réservation ${reservation._id} rejetée par ${req.user.email}`);
    res.json({ message: 'Réservation rejetée', reservation });
  } catch (error) {
    logger.error('Erreur rejet réservation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- PATCH annuler réservation ---
router.patch('/:id/cancel', authenticate, validateObjectId(), async (req, res) => {
  try {
    const { cancellationReason } = req.body;
    const query = { _id: req.params.id };
    if (req.user.role === 'client') query.client = req.user._id;

    const reservation = await Reservation.findOne(query).populate('equipment');
    if (!reservation) return res.status(404).json({ error: 'Réservation non trouvée' });
    if (!['pending', 'approved'].includes(reservation.status)) return res.status(400).json({ error: 'Cette réservation ne peut pas être annulée' });

    reservation.status = 'cancelled';
    reservation.cancellationReason = cancellationReason;
    await reservation.save();

    if (reservation.equipment.status === 'rented') {
      await Equipment.findByIdAndUpdate(reservation.equipment._id, { status: 'available' });
    }

    logger.info(`Réservation ${reservation._id} annulée par ${req.user.email}`);
    res.json({ message: 'Réservation annulée', reservation });
  } catch (error) {
    logger.error('Erreur annulation réservation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- PATCH terminer réservation (admin) ---
router.patch('/:id/complete', authenticate, authorize('admin'), validateObjectId(), async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate('equipment');
    if (!reservation) return res.status(404).json({ error: 'Réservation non trouvée' });
    if (reservation.status !== 'active') return res.status(400).json({ error: 'Seules les réservations actives peuvent être terminées' });

    reservation.status = 'completed';
    await reservation.save();

    await Equipment.findByIdAndUpdate(reservation.equipment._id, { status: 'available' });

    logger.info(`Réservation ${reservation._id} terminée par ${req.user.email}`);
    res.json({ message: 'Réservation terminée', reservation });
  } catch (error) {
    logger.error('Erreur finalisation réservation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- GET réservations actives ---
router.get('/active/list', authenticate, authorize('admin'), async (req, res) => {
  try {
    const activeReservations = await Reservation.getActiveReservations();
    res.json(activeReservations);
  } catch (error) {
    logger.error('Erreur récupération réservations actives:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
