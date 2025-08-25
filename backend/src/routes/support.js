const express = require('express');
const SupportTicket = require('../models/SupportTicket');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, validateObjectId } = require('../middleware/validation');
const logger = require('../utils/logger');
const SupportMessage = require("../models/SupportMessage");

const router = express.Router();

// Obtenir tous les tickets
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      category, 
      priority, 
      assignedTo 
    } = req.query;

    const query = {};
    
    // Les clients ne voient que leurs tickets
    if (req.user.role === 'client') {
      query.client = req.user._id;
    } else {
      if (assignedTo) query.assignedTo = assignedTo;
    }

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tickets = await SupportTicket.find(query)
      .populate('client', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName')
      .populate('reservation', 'startDate endDate')
      .populate('equipment', 'name brand model')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SupportTicket.countDocuments(query);

    res.json({
      tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des tickets:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un ticket
router.post('/', authenticate, validate('createSupportTicket'), async (req, res) => {
  try {
    const ticketData = {
      ...req.validatedData,
      client: req.user._id
    };

    const ticket = new SupportTicket(ticketData);
    await ticket.save();
    await ticket.populate('client reservation equipment');

    logger.info(`Nouveau ticket créé par ${req.user.email}: ${ticket.subject}`);

    res.status(201).json({
      message: 'Ticket créé avec succès',
      ticket
    });

  } catch (error) {
    logger.error('Erreur lors de la création du ticket:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir un ticket par ID
router.get('/:id', authenticate, validateObjectId(), async (req, res) => {
  try {
    const query = { _id: req.params.id };
    
    // Les clients ne peuvent voir que leurs tickets
    if (req.user.role === 'client') {
      query.client = req.user._id;
    }

    const ticket = await SupportTicket.findOne(query)
      .populate('client', 'firstName lastName email phone')
      .populate('assignedTo', 'firstName lastName email')
      .populate('reservation')
      .populate('equipment')
      .populate('messages.author', 'firstName lastName role');

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket non trouvé' });
    }

    // Filtrer les messages internes pour les clients
    if (req.user.role === 'client') {
      ticket.messages = ticket.messages.filter(message => !message.isInternal);
    }

    res.json(ticket);

  } catch (error) {
    logger.error('Erreur lors de la récupération du ticket:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Ajouter un message à un ticket
router.post('/:id/messages', authenticate, validateObjectId(), async (req, res) => {
  try {
    const { content, isInternal = false } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Le contenu du message est requis' });
    }

    const query = { _id: req.params.id };
    
    // Les clients ne peuvent répondre qu'à leurs tickets
    if (req.user.role === 'client') {
      query.client = req.user._id;
    }

    const ticket = await SupportTicket.findOne(query);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket non trouvé' });
    }

    // Les clients ne peuvent pas envoyer de messages internes
    const messageIsInternal = req.user.role === 'admin' ? isInternal : false;

    await ticket.addMessage(req.user._id, content, messageIsInternal);
    await ticket.populate('messages.author', 'firstName lastName role');

    // Mettre à jour le statut si nécessaire
    if (ticket.status === 'waiting_customer' && req.user.role === 'client') {
      ticket.status = 'open';
      await ticket.save();
    }

    logger.info(`Message ajouté au ticket ${ticket.ticketNumber} par ${req.user.email}`);

    res.json({
      message: 'Message ajouté avec succès',
      ticket
    });

  } catch (error) {
    logger.error('Erreur lors de l\'ajout du message:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Assigner un ticket (admin seulement)
router.patch('/:id/assign', authenticate, authorize('admin'), validateObjectId(), async (req, res) => {
  try {
    const { assignedTo } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket non trouvé' });
    }

    ticket.assignedTo = assignedTo;
    ticket.status = 'in_progress';
    await ticket.save();
    await ticket.populate('assignedTo', 'firstName lastName email');

    logger.info(`Ticket ${ticket.ticketNumber} assigné à ${ticket.assignedTo?.email} par ${req.user.email}`);

    res.json({
      message: 'Ticket assigné avec succès',
      ticket
    });

  } catch (error) {
    logger.error('Erreur lors de l\'assignation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Changer le statut d'un ticket (admin seulement)
router.patch('/:id/status', authenticate, authorize('admin'), validateObjectId(), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket non trouvé' });
    }

    ticket.status = status;
    await ticket.save();

    logger.info(`Statut du ticket ${ticket.ticketNumber} changé en ${status} par ${req.user.email}`);

    res.json({
      message: 'Statut mis à jour avec succès',
      ticket
    });

  } catch (error) {
    logger.error('Erreur lors du changement de statut:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Résoudre un ticket (admin seulement)
router.patch('/:id/resolve', authenticate, authorize('admin'), validateObjectId(), async (req, res) => {
  try {
    const { resolution } = req.body;

    if (!resolution || resolution.trim().length === 0) {
      return res.status(400).json({ error: 'La résolution est requise' });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket non trouvé' });
    }

    await ticket.resolve(req.user._id, resolution);

    logger.info(`Ticket ${ticket.ticketNumber} résolu par ${req.user.email}`);

    res.json({
      message: 'Ticket résolu avec succès',
      ticket
    });

  } catch (error) {
    logger.error('Erreur lors de la résolution:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Évaluer un ticket (client seulement)
router.patch('/:id/rate', authenticate, validateObjectId(), async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Note invalide (1-5)' });
    }

    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      client: req.user._id,
      status: 'resolved'
    });
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket non trouvé ou non résolu' });
    }

    ticket.satisfaction = {
      rating,
      feedback,
      ratedAt: new Date()
    };
    
    ticket.status = 'closed';
    await ticket.save();

    logger.info(`Ticket ${ticket.ticketNumber} évalué (${rating}/5) par ${req.user.email}`);

    res.json({
      message: 'Évaluation enregistrée avec succès',
      ticket
    });

  } catch (error) {
    logger.error('Erreur lors de l\'évaluation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Statistiques des tickets (admin seulement)
router.get('/stats/overview', authenticate, authorize('admin'), async (req, res) => {
  try {
    const stats = await SupportTicket.getTicketStats();
    
    const totalTickets = await SupportTicket.countDocuments();
    const openTickets = await SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } });
    const resolvedTickets = await SupportTicket.countDocuments({ status: 'resolved' });
    
    // Temps moyen de résolution
    const avgResolutionTime = await SupportTicket.aggregate([
      {
        $match: {
          status: 'resolved',
          resolvedAt: { $exists: true }
        }
      },
      {
        $project: {
          resolutionTime: {
            $divide: [
              { $subtract: ['$resolvedAt', '$createdAt'] },
              1000 * 60 * 60 * 24 // Convertir en jours
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$resolutionTime' }
        }
      }
    ]);

    res.json({
      total: totalTickets,
      open: openTickets,
      resolved: resolvedTickets,
      resolutionRate: totalTickets > 0 ? ((resolvedTickets / totalTickets) * 100).toFixed(1) : 0,
      avgResolutionTime: avgResolutionTime[0]?.avgTime || 0,
      byStatus: stats
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// FAQ - Obtenir les questions fréquentes
router.get('/faq', async (req, res) => {
  try {
    // Pour l'instant, retourner une FAQ statique
    // Dans une vraie application, cela viendrait d'une base de données
    const faq = [
      {
        id: 1,
        question: "Comment puis-je réserver un engin ?",
        answer: "Vous pouvez réserver un engin en vous connectant à votre compte, en parcourant notre catalogue et en sélectionnant les dates souhaitées.",
        category: "reservation"
      },
      {
        id: 2,
        question: "Quels sont les modes de paiement acceptés ?",
        answer: "Nous acceptons les paiements par carte bancaire via notre système sécurisé Stripe.",
        category: "billing"
      },
      {
        id: 3,
        question: "Puis-je annuler ma réservation ?",
        answer: "Oui, vous pouvez annuler votre réservation depuis votre espace client, sous certaines conditions.",
        category: "reservation"
      },
      {
        id: 4,
        question: "Que faire en cas de panne de l'engin ?",
        answer: "En cas de panne, contactez immédiatement notre support technique via un ticket ou par téléphone.",
        category: "technical"
      }
    ];

    const { category } = req.query;
    const filteredFaq = category ? faq.filter(item => item.category === category) : faq;

    res.json(filteredFaq);

  } catch (error) {
    logger.error('Erreur lors de la récupération de la FAQ:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});



// POST /api/support → enregistre un message de support
router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Tous les champs sont obligatoires" });
    }

    const newMessage = new SupportMessage({ name, email, message });
    await newMessage.save();

    res.status(201).json({ message: "Message de support envoyé avec succès" });
  } catch (error) {
    console.error("Erreur lors de l’envoi du message :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// (optionnel) GET /api/support → récupère tous les messages (pour admin)
router.get("/", async (req, res) => {
  try {
    const messages = await SupportMessage.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    console.error("Erreur lors de la récupération des messages :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});




module.exports = router;