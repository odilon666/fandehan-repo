const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const scheduler = require('./utils/scheduler');

// Import des routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const equipmentRoutes = require('./routes/equipment');
const reservationRoutes = require('./routes/reservations');
const paymentRoutes = require('./routes/payments');
const maintenanceRoutes = require('./routes/maintenance');
const reportRoutes = require('./routes/reports');
const supportRoutes = require('./routes/support');

const app = express();

// --- Middleware global ---
// Limitation du nombre de requêtes
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
}));

app.use(helmet());

// 🔑 IMPORTANT : autoriser ton frontend Vite (par défaut http://localhost:5173)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Webhook Stripe (avant express.json pour raw)
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/support', supportRoutes);
app.use("/api/support", supportRoutes);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Middleware pour les routes non trouvées (404)
app.use((req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.originalUrl
  });
});

// Middleware global pour gérer les erreurs
app.use(errorHandler);

// --- Connexion MongoDB ---
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/equipment_rental')
  .then(() => logger.info('✅ Connexion MongoDB réussie'))
  .catch(error => {
    logger.error('❌ Erreur connexion MongoDB:', error);
    process.exit(1);
  });

// --- Démarrage serveur ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  logger.info(`🌍 Environnement: ${process.env.NODE_ENV}`);

  // Démarrer le scheduler
  scheduler.start();
});

// Arrêt propre du scheduler lors de la fermeture
['SIGTERM', 'SIGINT'].forEach(signal => {
  process.on(signal, () => {
    logger.info(`${signal} reçu, arrêt du serveur...`);
    scheduler.stop();
    process.exit(0);
  });
});

module.exports = app;
