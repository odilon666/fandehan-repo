const nodemailer = require('nodemailer');
const logger = require('./logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '') // Supprime les balises HTML pour le texte
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email envoyé à ${to}: ${subject}`);
      return result;
    } catch (error) {
      logger.error('Erreur lors de l\'envoi d\'email:', error);
      throw error;
    }
  }

  // Email de vérification de compte
  async sendVerificationEmail(user, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Vérification de votre compte</h2>
        <p>Bonjour ${user.firstName},</p>
        <p>Merci de vous être inscrit sur notre plateforme de location d'engins. Pour activer votre compte, veuillez cliquer sur le lien ci-dessous :</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Vérifier mon compte
          </a>
        </div>
        <p>Si vous ne pouvez pas cliquer sur le bouton, copiez et collez ce lien dans votre navigateur :</p>
        <p>${verificationUrl}</p>
        <p>Ce lien expirera dans 24 heures.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">Si vous n'avez pas créé de compte, ignorez cet email.</p>
      </div>
    `;

    return await this.sendEmail(
      user.email,
      'Vérification de votre compte - Location Engins',
      html
    );
  }

  // Email de confirmation de réservation
  async sendReservationConfirmation(reservation, user, equipment) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Confirmation de réservation</h2>
        <p>Bonjour ${user.firstName},</p>
        <p>Votre réservation a été confirmée avec les détails suivants :</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #495057;">Détails de la réservation</h3>
          <p><strong>Équipement :</strong> ${equipment.name}</p>
          <p><strong>Dates :</strong> ${new Date(reservation.startDate).toLocaleDateString('fr-FR')} - ${new Date(reservation.endDate).toLocaleDateString('fr-FR')}</p>
          <p><strong>Durée :</strong> ${reservation.numberOfDays} jour(s)</p>
          <p><strong>Coût total :</strong> ${reservation.totalCost}€</p>
          <p><strong>Statut :</strong> ${reservation.status === 'approved' ? 'Approuvée' : 'En attente'}</p>
        </div>
        
        <p>Vous recevrez un email de confirmation dès que votre réservation sera approuvée par notre équipe.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          Pour toute question, contactez-nous à support@locationengins.com
        </p>
      </div>
    `;

    return await this.sendEmail(
      user.email,
      `Confirmation de réservation - ${equipment.name}`,
      html
    );
  }

  // Email de notification de paiement
  async sendPaymentNotification(payment, reservation, user) {
    const statusText = {
      'succeeded': 'Paiement réussi',
      'failed': 'Échec du paiement',
      'refunded': 'Paiement remboursé'
    };

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${statusText[payment.status]}</h2>
        <p>Bonjour ${user.firstName},</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #495057;">Détails du paiement</h3>
          <p><strong>Montant :</strong> ${payment.amount}€</p>
          <p><strong>Type :</strong> ${payment.type}</p>
          <p><strong>Statut :</strong> ${statusText[payment.status]}</p>
          <p><strong>Date :</strong> ${new Date(payment.paymentDate || payment.createdAt).toLocaleDateString('fr-FR')}</p>
        </div>
        
        ${payment.status === 'failed' ? `
          <div style="background-color: #f8d7da; color: #721c24; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p><strong>Raison de l'échec :</strong> ${payment.failureReason}</p>
            <p>Veuillez réessayer le paiement ou contactez notre support.</p>
          </div>
        ` : ''}
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          Pour toute question, contactez-nous à support@locationengins.com
        </p>
      </div>
    `;

    return await this.sendEmail(
      user.email,
      `${statusText[payment.status]} - Réservation`,
      html
    );
  }
}

module.exports = new EmailService();