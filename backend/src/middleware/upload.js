const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer les dossiers s'ils n'existent pas
const createUploadDirs = () => {
  const dirs = ['uploads/documents', 'uploads/equipment', 'uploads/maintenance'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Configuration de stockage pour les documents utilisateur
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.user._id}-${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Configuration de stockage pour les images d'équipement
const equipmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/equipment/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `equipment-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Configuration de stockage pour les images de maintenance
const maintenanceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/maintenance/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `maintenance-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Filtre pour les documents (PDF, images)
const documentFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers JPEG, PNG et PDF sont autorisés'));
  }
};

// Filtre pour les images seulement
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers image (JPEG, PNG, WebP) sont autorisés'));
  }
};

// Middleware d'upload pour les documents utilisateur
const uploadDocument = multer({
  storage: documentStorage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: documentFilter
});

// Middleware d'upload pour les images d'équipement
const uploadEquipmentImages = multer({
  storage: equipmentStorage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Maximum 5 images
  },
  fileFilter: imageFilter
});

// Middleware d'upload pour les images de maintenance
const uploadMaintenanceImages = multer({
  storage: maintenanceStorage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10 // Maximum 10 images
  },
  fileFilter: imageFilter
});

module.exports = {
  uploadDocument,
  uploadEquipmentImages,
  uploadMaintenanceImages
};