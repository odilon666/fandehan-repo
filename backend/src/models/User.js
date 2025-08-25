const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Le prénom est requis'],
    trim: true,
    maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères']
  },
  lastName: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide'],
    unique: true // laisse unique ici, supprime userSchema.index({email:1})
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
    select: false
  },
  role: {
    type: String,
    enum: ['client', 'admin'],
    default: 'client'
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[0-9\-\(\)\s]+$/, 'Numéro de téléphone invalide']
  },
  address: {
    street: String,
    city: String,
    postalCode: String,
    country: { type: String, default: 'France' }
  },
  documents: [{
    type: {
      type: String,
      enum: ['identity', 'license', 'insurance'],
      required: true
    },
    filename: String,
    originalName: String,
    uploadDate: { type: Date, default: Date.now }
  }],
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index texte pour recherche fullName
userSchema.index({ firstName: 'text', lastName: 'text' });

// Virtual pour nom complet
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Hash du password avant save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Comparer le password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Retourner les infos publiques
userSchema.methods.toPublicJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  delete user.emailVerificationToken;
  return user;
};

module.exports = mongoose.model('User', userSchema);
