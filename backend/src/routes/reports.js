const express = require('express');
const mongoose = require('mongoose');
const Equipment = require('../models/Equipment');
const Reservation = require('../models/Reservation');
const Payment = require('../models/Payment');
const Maintenance = require('../models/Maintenance');
const SupportTicket = require('../models/SupportTicket');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// -------------------- Tableau de bord principal --------------------
router.get('/dashboard', authenticate, authorize('admin'), async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const [totalEquipment, availableEquipment, rentedEquipment, maintenanceEquipment] = await Promise.all([
      Equipment.countDocuments(),
      Equipment.countDocuments({ status: 'available' }),
      Equipment.countDocuments({ status: 'rented' }),
      Equipment.countDocuments({ status: 'maintenance' })
    ]);

    const [totalReservations, pendingReservations, activeReservations, monthlyReservations] = await Promise.all([
      Reservation.countDocuments(),
      Reservation.countDocuments({ status: 'pending' }),
      Reservation.countDocuments({ status: 'active' }),
      Reservation.countDocuments({ createdAt: { $gte: startOfMonth } })
    ]);

    const [monthlyRevenueAgg, yearlyRevenueAgg] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'succeeded', paymentDate: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { $match: { status: 'succeeded', paymentDate: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const [scheduledMaintenances, overdueMaintenances] = await Promise.all([
      Maintenance.countDocuments({ status: 'scheduled' }),
      Maintenance.countDocuments({ status: 'scheduled', scheduledDate: { $lt: today } })
    ]);

    res.json({
      equipment: {
        total: totalEquipment,
        available: availableEquipment,
        rented: rentedEquipment,
        maintenance: maintenanceEquipment,
        utilizationRate: totalEquipment > 0 ? ((rentedEquipment / totalEquipment) * 100).toFixed(1) : 0
      },
      reservations: {
        total: totalReservations,
        pending: pendingReservations,
        active: activeReservations,
        monthly: monthlyReservations
      },
      revenue: {
        monthly: monthlyRevenueAgg[0]?.total || 0,
        yearly: yearlyRevenueAgg[0]?.total || 0
      },
      maintenance: {
        scheduled: scheduledMaintenances,
        overdue: overdueMaintenances
      }
    });
  } catch (error) {
    logger.error('Erreur lors de la génération du tableau de bord:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// -------------------- Rapport d'utilisation des équipements --------------------
router.get('/equipment-utilization', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate, equipmentId } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchStage = { status: { $in: ['completed', 'active'] } };
    if (Object.keys(dateFilter).length) matchStage.startDate = dateFilter;
    if (equipmentId) matchStage.equipment = mongoose.Types.ObjectId(equipmentId);

    const utilization = await Reservation.aggregate([
      { $match: matchStage },
      { $group: { _id: '$equipment', totalDays: { $sum: '$numberOfDays' }, totalReservations: { $sum: 1 }, totalRevenue: { $sum: '$totalCost' } } },
      { $lookup: { from: 'equipment', localField: '_id', foreignField: '_id', as: 'equipmentInfo' } },
      { $unwind: '$equipmentInfo' },
      { $project: {
          name: '$equipmentInfo.name',
          brand: '$equipmentInfo.brand',
          model: '$equipmentInfo.model',
          dailyRate: '$equipmentInfo.dailyRate',
          totalDays: 1,
          totalReservations: 1,
          totalRevenue: 1,
          utilizationRate: { $multiply: [{ $divide: ['$totalDays', 365] }, 100] }
      }},
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json(utilization);
  } catch (error) {
    logger.error('Erreur lors du rapport d\'utilisation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// -------------------- Rapport financier --------------------
router.get('/financial', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate, period = 'monthly' } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchStage = { status: 'succeeded' };
    if (Object.keys(dateFilter).length) matchStage.paymentDate = dateFilter;

    let groupBy;
    switch (period) {
      case 'daily': groupBy = { year: { $year: '$paymentDate' }, month: { $month: '$paymentDate' }, day: { $dayOfMonth: '$paymentDate' } }; break;
      case 'weekly': groupBy = { year: { $year: '$paymentDate' }, week: { $week: '$paymentDate' } }; break;
      case 'yearly': groupBy = { year: { $year: '$paymentDate' } }; break;
      default: groupBy = { year: { $year: '$paymentDate' }, month: { $month: '$paymentDate' } };
    }

    const [revenue, revenueByType, maintenanceCostsAgg] = await Promise.all([
      Payment.aggregate([
        { $match: matchStage },
        { $group: { _id: groupBy, totalRevenue: { $sum: '$amount' }, totalTransactions: { $sum: 1 }, averageTransaction: { $avg: '$amount' } } },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),
      Payment.aggregate([
        { $match: matchStage },
        { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Maintenance.aggregate([
        { $match: { status: 'completed', ...(Object.keys(dateFilter).length && { actualEndDate: dateFilter }) } },
        { $group: { _id: null, totalCost: { $sum: { $add: [{ $ifNull: ['$cost.labor', 0] }, { $ifNull: ['$cost.parts', 0] }, { $ifNull: ['$cost.external', 0] }] } } } }
      ])
    ]);

    const totalRevenue = revenue.reduce((sum, item) => sum + item.totalRevenue, 0);
    const maintenanceCosts = maintenanceCostsAgg[0]?.totalCost || 0;

    res.json({ revenue, revenueByType, maintenanceCosts, netProfit: totalRevenue - maintenanceCosts });
  } catch (error) {
    logger.error('Erreur lors du rapport financier:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// -------------------- Rapport de maintenance --------------------
router.get('/maintenance', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchStage = {};
    if (Object.keys(dateFilter).length) matchStage.scheduledDate = dateFilter;

    const maintenanceByEquipment = await Maintenance.aggregate([
      { $match: matchStage },
      { $group: {
          _id: '$equipment',
          totalMaintenances: { $sum: 1 },
          totalCost: { $sum: { $add: [{ $ifNull: ['$cost.labor', 0] }, { $ifNull: ['$cost.parts', 0] }, { $ifNull: ['$cost.external', 0] }] } },
          preventiveCount: { $sum: { $cond: [{ $eq: ['$type', 'preventive'] }, 1, 0] } },
          correctiveCount: { $sum: { $cond: [{ $eq: ['$type', 'corrective'] }, 1, 0] } },
          emergencyCount: { $sum: { $cond: [{ $eq: ['$type', 'emergency'] }, 1, 0] } }
      }},
      { $lookup: { from: 'equipment', localField: '_id', foreignField: '_id', as: 'equipmentInfo' } },
      { $unwind: '$equipmentInfo' },
      { $project: {
          name: '$equipmentInfo.name',
          brand: '$equipmentInfo.brand',
          model: '$equipmentInfo.model',
          totalMaintenances: 1,
          totalCost: 1,
          preventiveCount: 1,
          correctiveCount: 1,
          emergencyCount: 1,
          preventiveRatio: { $multiply: [{ $divide: ['$preventiveCount', '$totalMaintenances'] }, 100] }
      }},
      { $sort: { totalCost: -1 } }
    ]);

    const avgRepairTimeAgg = await Maintenance.aggregate([
      { $match: { status: 'completed', actualStartDate: { $exists: true }, actualEndDate: { $exists: true }, ...matchStage } },
      { $project: { repairTime: { $divide: [{ $subtract: ['$actualEndDate', '$actualStartDate'] }, 1000 * 60 * 60] } } },
      { $group: { _id: null, avgRepairTime: { $avg: '$repairTime' } } }
    ]);

    res.json({ byEquipment: maintenanceByEquipment, averageRepairTime: avgRepairTimeAgg[0]?.avgRepairTime || 0 });
  } catch (error) {
    logger.error('Erreur lors du rapport de maintenance:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// -------------------- Rapport de satisfaction client --------------------
router.get('/customer-satisfaction', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchStage = { 'satisfaction.rating': { $exists: true } };
    if (Object.keys(dateFilter).length) matchStage['satisfaction.ratedAt'] = dateFilter;

    const satisfactionAgg = await SupportTicket.aggregate([
      { $match: matchStage },
      { $group: {
          _id: null,
          averageRating: { $avg: '$satisfaction.rating' },
          totalRatings: { $sum: 1 },
          ratingDistribution: { $push: '$satisfaction.rating' }
      }}
    ]);

    const ratingCounts = {};
    satisfactionAgg[0]?.ratingDistribution.forEach(r => { ratingCounts[r] = (ratingCounts[r] || 0) + 1; });

    res.json({
      averageRating: satisfactionAgg[0]?.averageRating || 0,
      totalRatings: satisfactionAgg[0]?.totalRatings || 0,
      ratingDistribution: ratingCounts
    });
  } catch (error) {
    logger.error('Erreur lors du rapport de satisfaction:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// -------------------- Export CSV (JSON pour l'instant) --------------------
router.get('/export/:type', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { type } = req.params;
    const { startDate, endDate } = req.query;
    let data = [];

    switch (type) {
      case 'reservations': {
        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);
        data = await Reservation.find(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {})
          .populate('equipment', 'name brand model')
          .populate('client', 'firstName lastName email')
          .lean();
        break;
      }
      case 'payments': {
        const filter = { status: 'succeeded' };
        if (startDate && endDate) filter.paymentDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
        data = await Payment.find(filter).populate('client', 'firstName lastName email').lean();
        break;
      }
      default:
        return res.status(400).json({ error: 'Type de rapport non supporté' });
    }

    res.json({ message: 'Données exportées avec succès', data, count: data.length });
  } catch (error) {
    logger.error('Erreur lors de l\'export:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
