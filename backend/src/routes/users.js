const express = require('express');
const User = require('../models/User');
const { authenticate, authorize, authorizeOwner } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');
const logger = require('../utils/logger');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// --- Multer pour upload de documents ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/documents/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Seuls les fichiers JPEG, PNG et PDF sont autorisés'));
  }
});

// --- Routes ---

// GET tous les utilisateurs (admin)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, isActive } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select('-password -passwordResetToken -emailVerificationToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET profil utilisateur
router.get('/profile', authenticate, async (req, res) => {
  try {
    res.json(req.user.toPublicJSON());
  } catch (error) {
    logger.error('Erreur récupération profil:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT mise à jour profil
router.put('/profile', authenticate, async (req, res) => {
  try {
    const allowedUpdates = ['firstName', 'lastName', 'phone', 'address'];
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ message: 'Profil mis à jour', user: user.toPublicJSON() });
  } catch (error) {
    logger.error('Erreur mise à jour profil:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST upload document
router.post('/documents', authenticate, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier fourni' });
    const { type } = req.body;
    if (!['identity', 'license', 'insurance'].includes(type)) return res.status(400).json({ error: 'Type de document invalide' });

    const document = { type, filename: req.file.filename, originalName: req.file.originalname };
    const user = await User.findById(req.user._id);
    user.documents.push(document);
    await user.save();

    res.json({ message: 'Document uploadé', document });
  } catch (error) {
    logger.error('Erreur upload document:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET utilisateur par ID
router.get('/:id', authenticate, validateObjectId(), authorizeOwner, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -passwordResetToken -emailVerificationToken');
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (error) {
    logger.error('Erreur récupération utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH activer/désactiver utilisateur (admin)
router.patch('/:id/status', authenticate, authorize('admin'), validateObjectId(), async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    logger.info(`Utilisateur ${user.email} ${isActive ? 'activé' : 'désactivé'} par ${req.user.email}`);
    res.json({ message: `Utilisateur ${isActive ? 'activé' : 'désactivé'}`, user: user.toPublicJSON() });
  } catch (error) {
    logger.error('Erreur mise à jour statut utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
