const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { validate } = require('../middleware/validation');
const emailService = require('../utils/email');
const logger = require('../utils/logger');

const router = express.Router();

// --- Helpers ---
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '1d' }
  );
};

// --- ROUTES ---

// Inscription
router.post('/register', validate('register'), async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.validatedData;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un compte avec cet email existe déjà'
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = new User({
      firstName,
      lastName,
      email,
      password,
      phone,
      emailVerificationToken: verificationToken
    });

    await user.save();

    try {
      await emailService.sendVerificationEmail(user, verificationToken);
    } catch (err) {
      logger.error("Erreur d'envoi email vérification:", err);
    }

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès. Vérifiez votre email pour activer votre compte.',
      token,
      expiresIn: process.env.JWT_EXPIRE,
      data: user.toPublicJSON()
    });

  } catch (error) {
    logger.error("Erreur inscription:", error);
    res.status(500).json({ success: false, message: "Erreur lors de la création du compte" });
  }
});

// Connexion
router.post('/login', validate('login'), async (req, res) => {
  try {
    const { email, password } = req.validatedData;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      expiresIn: process.env.JWT_EXPIRE,
      data: user.toPublicJSON()
    });

  } catch (error) {
    logger.error("Erreur connexion:", error);
    res.status(500).json({ success: false, message: "Erreur lors de la connexion" });
  }
});

// Vérification d'email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token requis' });

    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Token invalide ou expiré' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.json({ success: true, message: 'Email vérifié avec succès', data: user.toPublicJSON() });

  } catch (error) {
    logger.error("Erreur vérification email:", error);
    res.status(500).json({ success: false, message: "Erreur lors de la vérification" });
  }
});

// Demande reset password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = Date.now() + 3600000;
      await user.save();

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      try {
        await emailService.sendEmail(user.email, 'Réinitialisation de mot de passe', `
          <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez ici :</p>
          <a href="${resetUrl}">Réinitialiser mon mot de passe</a>
        `);
      } catch (err) {
        logger.error("Erreur envoi mail reset:", err);
      }
    }

    res.json({
      success: true,
      message: 'Si cet email existe, un lien de réinitialisation a été envoyé'
    });

  } catch (error) {
    logger.error("Erreur demande reset:", error);
    res.status(500).json({ success: false, message: "Erreur lors de la demande" });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token et mot de passe requis' });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Token invalide ou expiré' });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Mot de passe réinitialisé avec succès' });

  } catch (error) {
    logger.error("Erreur reset password:", error);
    res.status(500).json({ success: false, message: "Erreur lors de la réinitialisation" });
  }
});

module.exports = router;
