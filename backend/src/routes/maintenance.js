const express = require('express');
const Maintenance = require('../models/Maintenance');
const Equipment = require('../models/Equipment');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, validateObjectId } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

// Récupérer toutes les maintenances avec pagination et filtres
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      priority,
      equipment,
      technician
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (equipment) query.equipment = equipment;
    if (technician) query.technician = technician;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const maintenances = await Maintenance.find(query)
      .populate('equipment', 'name brand model')
      .populate('technician', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName')
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Maintenance.countDocuments(query);

    res.json({
      maintenances,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des maintenances:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une nouvelle maintenance
router.post('/', authenticate, authorize('admin'), validate('createMaintenance'), async (req, res) => {
  try {
    const maintenanceData = { ...req.validatedData, assignedBy: req.user._id };

    // Vérifier équipement
    const equipment = await Equipment.findById(maintenanceData.equipment);
    if (!equipment) return res.status(404).json({ error: 'Équipement non trouvé' });

    // Vérifier technicien
    if (maintenanceData.technician) {
      const technician = await User.findById(maintenanceData.technician);
      if (!technician) return res.status(404).json({ error: 'Technicien non trouvé' });
    }

    const maintenance = new Maintenance(maintenanceData);
    await maintenance.save();
    await maintenance.populate('equipment technician assignedBy');

    logger.info(`Nouvelle maintenance pour ${equipment.name} programmée par ${req.user.email}`);
    res.status(201).json({ message: 'Maintenance programmée avec succès', maintenance });
  } catch (error) {
    logger.error('Erreur lors de la création de la maintenance:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir une maintenance par ID
router.get('/:id', authenticate, authorize('admin'), validateObjectId(), async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id)
      .populate('equipment')
      .populate('technician', 'firstName lastName email phone')
      .populate('assignedBy', 'firstName lastName');

    if (!maintenance) return res.status(404).json({ error: 'Maintenance non trouvée' });

    res.json(maintenance);
  } catch (error) {
    logger.error('Erreur lors de la récupération de la maintenance:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour une maintenance
router.put('/:id', authenticate, authorize('admin'), validateObjectId(), async (req, res) => {
  try {
    const allowedUpdates = [
      'type', 'priority', 'title', 'description', 'scheduledDate',
      'estimatedDuration', 'technician', 'cost', 'parts', 'notes'
    ];
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const maintenance = await Maintenance.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('equipment technician assignedBy');

    if (!maintenance) return res.status(404).json({ error: 'Maintenance non trouvée' });

    logger.info(`Maintenance ${maintenance._id} mise à jour par ${req.user.email}`);
    res.json({ message: 'Maintenance mise à jour avec succès', maintenance });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Démarrer une maintenance
router.patch('/:id/start', authenticate, authorize('admin'), validateObjectId(), async (req, res) => {
  try {
    const { technicianId } = req.body;
    const maintenance = await Maintenance.findById(req.params.id).populate('equipment');
    if (!maintenance) return res.status(404).json({ error: 'Maintenance non trouvée' });
    if (maintenance.status !== 'scheduled') return res.status(400).json({ error: 'Seules les maintenances programmées peuvent être démarrées' });

    if (technicianId) {
      const technician = await User.findById(technicianId);
      if (!technician) return res.status(404).json({ error: 'Technicien non trouvé' });
    }

    await maintenance.start(technicianId || req.user._id);
    await maintenance.populate('technician');

    logger.info(`Maintenance ${maintenance._id} démarrée par ${req.user.email}`);
    res.json({ message: 'Maintenance démarrée avec succès', maintenance });
  } catch (error) {
    logger.error('Erreur lors du démarrage:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Terminer une maintenance
router.patch('/:id/complete', authenticate, authorize('admin'), validateObjectId(), async (req, res) => {
  try {
    const { workPerformed, nextMaintenanceDate, cost, parts } = req.body;
    const maintenance = await Maintenance.findById(req.params.id).populate('equipment');

    if (!maintenance) return res.status(404).json({ error: 'Maintenance non trouvée' });
    if (maintenance.status !== 'in_progress') return res.status(400).json({ error: 'Seules les maintenances en cours peuvent être terminées' });

    if (cost) maintenance.cost = { ...maintenance.cost, ...cost };
    if (parts) maintenance.parts = parts;

    await maintenance.complete(workPerformed, nextMaintenanceDate);

    logger.info(`Maintenance ${maintenance._id} terminée par ${req.user.email}`);
    res.json({ message: 'Maintenance terminée avec succès', maintenance });
  } catch (error) {
    logger.error('Erreur lors de la finalisation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Annuler une maintenance
router.patch('/:id/cancel', authenticate, authorize('admin'), validateObjectId(), async (req, res) => {
  try {
    const { reason } = req.body;
    const maintenance = await Maintenance.findById(req.params.id).populate('equipment');

    if (!maintenance) return res.status(404).json({ error: 'Maintenance non trouvée' });
    if (!['scheduled', 'in_progress'].includes(maintenance.status)) return res.status(400).json({ error: 'Cette maintenance ne peut pas être annulée' });

    maintenance.status = 'cancelled';
    maintenance.notes = (maintenance.notes || '') + `\nAnnulée: ${reason}`;
    await maintenance.save();

    // Mettre équipement disponible si nécessaire
    if (maintenance.equipment.status === 'maintenance') {
      const otherMaintenances = await Maintenance.find({
        equipment: maintenance.equipment._id,
        status: 'in_progress',
        _id: { $ne: maintenance._id }
      });
      if (otherMaintenances.length === 0) await Equipment.findByIdAndUpdate(maintenance.equipment._id, { status: 'available' });
    }

    logger.info(`Maintenance ${maintenance._id} annulée par ${req.user.email}: ${reason}`);
    res.json({ message: 'Maintenance annulée avec succès', maintenance });
  } catch (error) {
    logger.error('Erreur lors de l\'annulation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Maintenances en retard
router.get('/overdue/list', authenticate, authorize('admin'), async (req, res) => {
  try {
    const overdueMaintenances = await Maintenance.getOverdueMaintenances();
    res.json(overdueMaintenances);
  } catch (error) {
    logger.error('Erreur lors de la récupération des maintenances en retard:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Statistiques
router.get('/stats/overview', authenticate, authorize('admin'), async (req, res) => {
  try {
    const stats = await Maintenance.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalCost: {
            $sum: {
              $add: [
                { $ifNull: ['$cost.labor', 0] },
                { $ifNull: ['$cost.parts', 0] },
                { $ifNull: ['$cost.external', 0] }
              ]
            }
          }
        }
      }
    ]);

    const typeStats = await Maintenance.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]);
    const priorityStats = await Maintenance.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]);

    res.json({ byStatus: stats, byType: typeStats, byPriority: priorityStats });
  } catch (error) {
    logger.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
