const winston = require('winston');
const path = require('path');

// Configuration des niveaux de log personnalisés
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Configuration des couleurs pour les logs
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(colors);

// Format pour les logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Configuration des transports
const transports = [
  new winston.transports.Console(),
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error'
  }),
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/all.log')
  })
];

// Création du logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  // Ne pas terminer le processus sur les erreurs non capturées
  exitOnError: false
});

module.exports = logger;