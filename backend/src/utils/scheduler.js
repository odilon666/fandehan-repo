const cron = require('node-cron');
const Equipment = require('../models/Equipment');
const Reservation = require('../models/Reservation');
const Maintenance = require('../models/Maintenance');
const emailService = require('./email');
const logger = require('./logger');

class Scheduler {
  constructor() {
    this.jobs = [];
  }

  // Démarrer tous les jobs programmés
  start() {
    // Vérifier les réservations qui commencent aujourd'hui (tous les jours à 8h)
    const checkReservationsJob = cron.schedule('0 8 * * *', async () => {
      await this.checkStartingReservations();
    }, { scheduled: false });

    // Vérifier les réservations qui se terminent aujourd'hui (tous les jours à 18h)
    const checkEndingReservationsJob = cron.schedule('0 18 * * *', async () => {
      await this.checkEndingReservations();
    }, { scheduled: false });

    // Vérifier les maintenances en retard (tous les jours à 9h)
    const checkOverdueMaintenanceJob = cron.schedule('0 9 * * *', async () => {
      await this.checkOverdueMaintenance();
    }, { scheduled: false });

    // Nettoyer les anciens logs (tous les dimanches à 2h)
    const cleanupJob = cron.schedule('0 2 * * 0', async () => {
      await this.cleanupOldData();
    }, { scheduled: false });

    this.jobs = [
      checkReservationsJob,
      checkEndingReservationsJob,
      checkOverdueMaintenanceJob,
      cleanupJob
    ];

    // Démarrer tous les jobs
    this.jobs.forEach(job => job.start());
    logger.info('Scheduler démarré avec succès');
  }

  // Arrêter tous les jobs
  stop() {
    this.jobs.forEach(job => job.stop());
    logger.info('Scheduler arrêté');
  }

  // Vérifier les réservations qui commencent aujourd'hui
  async checkStartingReservations() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const startingReservations = await Reservation.find({
        status: 'approved',
        startDate: {
          $gte: today,
          $lt: tomorrow
        }
      }).populate('equipment client');

      for (const reservation of startingReservations) {
        // Mettre à jour le statut de la réservation
        reservation.status = 'active';
        await reservation.save();

        // Mettre à jour le statut de l'équipement
        await Equipment.findByIdAndUpdate(reservation.equipment._id, {
          status: 'rented'
        });

        logger.info(`Réservation ${reservation._id} activée automatiquement`);
      }

      if (startingReservations.length > 0) {
        logger.info(`${startingReservations.length} réservations activées aujourd'hui`);
      }

    } catch (error) {
      logger.error('Erreur lors de la vérification des réservations qui commencent:', error);
    }
  }

  // Vérifier les réservations qui se terminent aujourd'hui
  async checkEndingReservations() {
    try {
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const endingReservations = await Reservation.find({
        status: 'active',
        endDate: { $lte: today }
      }).populate('equipment client');

      for (const reservation of endingReservations) {
        // Mettre à jour le statut de la réservation
        reservation.status = 'completed';
        await reservation.save();

        // Vérifier s'il n'y a pas d'autres réservations actives pour cet équipement
        const otherActiveReservations = await Reservation.find({
          equipment: reservation.equipment._id,
          status: 'active',
          _id: { $ne: reservation._id }
        });

        if (otherActiveReservations.length === 0) {
          // Libérer l'équipement
          await Equipment.findByIdAndUpdate(reservation.equipment._id, {
            status: 'available'
          });
        }

        logger.info(`Réservation ${reservation._id} terminée automatiquement`);
      }

      if (endingReservations.length > 0) {
        logger.info(`${endingReservations.length} réservations terminées aujourd'hui`);
      }

    } catch (error) {
      logger.error('Erreur lors de la vérification des réservations qui se terminent:', error);
    }
  }

  // Vérifier les maintenances en retard
  async checkOverdueMaintenance() {
    try {
      const overdueMaintenances = await Maintenance.getOverdueMaintenances();

      if (overdueMaintenances.length > 0) {
        logger.warn(`${overdueMaintenances.length} maintenances en retard détectées`);
        
        // Ici, on pourrait envoyer des notifications aux administrateurs
        // ou créer des alertes dans le système
      }

    } catch (error) {
      logger.error('Erreur lors de la vérification des maintenances en retard:', error);
    }
  }

  // Nettoyer les anciennes données
  async cleanupOldData() {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Supprimer les anciens tokens de réinitialisation expirés
      const User = require('../models/User');
      await User.updateMany(
        { passwordResetExpires: { $lt: new Date() } },
        { 
          $unset: { 
            passwordResetToken: 1, 
            passwordResetExpires: 1 
          } 
        }
      );

      logger.info('Nettoyage des anciennes données effectué');

    } catch (error) {
      logger.error('Erreur lors du nettoyage:', error);
    }
  }
}

module.exports = new Scheduler();