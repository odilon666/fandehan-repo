const express = require('express');
const Equipment = require('../models/Equipment');
const Reservation = require('../models/Reservation');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, validateObjectId } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

// --- GET tous les équipements ---
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      city,
      status = 'available',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    if (status && status !== 'all') query.status = status;
    if (search) query.$text = { $search: search };
    if (category) query.category = category;
    if (brand) query.brand = new RegExp(brand, 'i');
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (minPrice || maxPrice) {
      query.dailyRate = {};
      if (minPrice) query.dailyRate.$gte = parseFloat(minPrice);
      if (maxPrice) query.dailyRate.$lte = parseFloat(maxPrice);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const equipment = await Equipment.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Equipment.countDocuments(query);

    const stats = await Equipment.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$dailyRate' },
          maxPrice: { $max: '$dailyRate' },
          categories: { $addToSet: '$category' },
          brands: { $addToSet: '$brand' },
          cities: { $addToSet: '$location.city' }
        }
      }
    ]);

    res.json({
      equipment,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
      filters: stats[0] || {}
    });
  } catch (error) {
    logger.error('Erreur récupération équipements:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- GET équipement par ID ---
router.get('/:id', validateObjectId(), async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) return res.status(404).json({ error: 'Équipement non trouvé' });
    res.json(equipment);
  } catch (error) {
    logger.error('Erreur récupération équipement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- GET disponibilité d'un équipement ---
router.get('/:id/availability', validateObjectId(), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'Dates de début et de fin requises' });

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) return res.status(400).json({ error: 'La date de fin doit être postérieure à la date de début' });

    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) return res.status(404).json({ error: 'Équipement non trouvé' });

    const hasConflict = await Reservation.checkConflict(req.params.id, start, end);
    const isAvailable = !hasConflict && equipment.isAvailable();

    res.json({
      available: isAvailable,
      equipment: { id: equipment._id, name: equipment.name, status: equipment.status, dailyRate: equipment.dailyRate },
      period: { startDate: start, endDate: end, days: Math.ceil((end - start) / (1000 * 60 * 60 * 24)) },
      conflicts: hasConflict,
      estimatedCost: isAvailable ? Math.ceil((end - start) / (1000 * 60 * 60 * 24)) * equipment.dailyRate : null
    });
  } catch (error) {
    logger.error('Erreur disponibilité équipement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- POST création équipement (admin) ---
router.post('/', authenticate, authorize('admin'), validate('createEquipment'), async (req, res) => {
  try {
    const equipment = new Equipment(req.validatedData);
    await equipment.save();
    logger.info(`Équipement créé: ${equipment.name} par ${req.user.email}`);
    res.status(201).json({ message: 'Équipement créé', equipment });
  } catch (error) {
    logger.error('Erreur création équipement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- PUT mise à jour équipement (admin) ---
router.put('/:id', authenticate, authorize('admin'), validateObjectId(), async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!equipment) return res.status(404).json({ error: 'Équipement non trouvé' });
    logger.info(`Équipement mis à jour: ${equipment.name} par ${req.user.email}`);
    res.json({ message: 'Équipement mis à jour', equipment });
  } catch (error) {
    logger.error('Erreur mise à jour équipement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- DELETE équipement (admin) ---
router.delete('/:id', authenticate, authorize('admin'), validateObjectId(), async (req, res) => {
  try {
    const activeReservations = await Reservation.find({ equipment: req.params.id, status: { $in: ['approved', 'active'] } });
    if (activeReservations.length > 0) return res.status(400).json({ error: 'Impossible de supprimer avec réservations actives' });

    const equipment = await Equipment.findByIdAndDelete(req.params.id);
    if (!equipment) return res.status(404).json({ error: 'Équipement non trouvé' });

    logger.info(`Équipement supprimé: ${equipment.name} par ${req.user.email}`);
    res.json({ message: 'Équipement supprimé' });
  } catch (error) {
    logger.error('Erreur suppression équipement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- GET catégories ---
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Equipment.distinct('category');
    res.json(categories);
  } catch (error) {
    logger.error('Erreur récupération catégories:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- GET marques ---
router.get('/meta/brands', async (req, res) => {
  try {
    const brands = await Equipment.distinct('brand');
    res.json(brands);
  } catch (error) {
    logger.error('Erreur récupération marques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
