const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Equipment = require('../models/Equipment');
require('dotenv').config();

async function seedDatabase() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/equipment_rental');
    console.log('Connexion MongoDB réussie');

    // Supprimer les données existantes
    await User.deleteMany({});
    await Equipment.deleteMany({});

    // Créer un utilisateur admin
    const adminPassword = await bcrypt.hash('password123', 12);
    const admin = new User({
      firstName: 'Admin',
      lastName: 'System',
      email: 'admin@test.com',
      password: adminPassword,
      role: 'admin',
      isActive: true,
      isEmailVerified: true
    });
    await admin.save();

    // Créer un utilisateur client
    const clientPassword = await bcrypt.hash('password123', 12);
    const client = new User({
      firstName: 'Client',
      lastName: 'Test',
      email: 'client@test.com',
      password: clientPassword,
      role: 'client',
      isActive: true,
      isEmailVerified: true
    });
    await client.save();

    // Créer quelques équipements
    const equipments = [
      {
        name: 'Excavatrice Caterpillar 320',
        description: 'Excavatrice hydraulique de 20 tonnes, idéale pour les gros travaux de terrassement',
        category: 'excavateur',
        brand: 'Caterpillar',
        model: '320',
        year: 2020,
        dailyRate: 350,
        specifications: {
          weight: 20,
          power: 150,
          capacity: 1.2,
          fuel: 'diesel'
        },
        location: {
          city: 'Paris',
          address: 'Zone industrielle Nord'
        },
        status: 'available',
        features: ['GPS', 'Climatisation', 'Marteau hydraulique'],
        minimumRentalDays: 1,
        maximumRentalDays: 30
      },
      {
        name: 'Bulldozer Komatsu D65',
        description: 'Bulldozer puissant pour nivellement et terrassement',
        category: 'bulldozer',
        brand: 'Komatsu',
        model: 'D65',
        year: 2019,
        dailyRate: 400,
        specifications: {
          weight: 18,
          power: 180,
          fuel: 'diesel'
        },
        location: {
          city: 'Lyon',
          address: 'Dépôt Sud'
        },
        status: 'available',
        features: ['Lame droite', 'Ripper arrière'],
        minimumRentalDays: 1,
        maximumRentalDays: 30
      },
      {
        name: 'Grue mobile Liebherr LTM 1030',
        description: 'Grue mobile de 30 tonnes pour levage précis',
        category: 'grue',
        brand: 'Liebherr',
        model: 'LTM 1030',
        year: 2021,
        dailyRate: 500,
        specifications: {
          weight: 25,
          power: 200,
          capacity: 30,
          fuel: 'diesel'
        },
        location: {
          city: 'Marseille',
          address: 'Port industriel'
        },
        status: 'available',
        features: ['Télescopique', 'Stabilisateurs automatiques'],
        minimumRentalDays: 1,
        maximumRentalDays: 15
      }
    ];

    for (const equipmentData of equipments) {
      const equipment = new Equipment(equipmentData);
      await equipment.save();
    }

    console.log('✅ Base de données initialisée avec succès');
    console.log('👤 Admin: admin@test.com / password123');
    console.log('👤 Client: client@test.com / password123');
    console.log(`📦 ${equipments.length} équipements créés`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;