import API from './api';

export const reservationService = {
  // Récupérer toutes les réservations
  getAll: async (params = {}) => {
    const response = await API.get('/reservations', { params });
    return response.data;
  },

  // Récupérer une réservation par ID
  getById: async (id) => {
    const response = await API.get(`/reservations/${id}`);
    return response.data;
  },

  // Créer une nouvelle réservation
  create: async (reservationData) => {
    const response = await API.post('/reservations', reservationData);
    return response.data;
  },

  // Approuver une réservation (admin)
  approve: async (id) => {
    const response = await API.patch(`/reservations/${id}/approve`);
    return response.data;
  },

  // Rejeter une réservation (admin)
  reject: async (id, rejectionReason) => {
    const response = await API.patch(`/reservations/${id}/reject`, { rejectionReason });
    return response.data;
  },

  // Annuler une réservation
  cancel: async (id, cancellationReason) => {
    const response = await API.patch(`/reservations/${id}/cancel`, { cancellationReason });
    return response.data;
  },

  // Terminer une réservation (admin)
  complete: async (id) => {
    const response = await API.patch(`/reservations/${id}/complete`);
    return response.data;
  },

  // Récupérer les réservations actives (admin)
  getActive: async () => {
    const response = await API.get('/reservations/active/list');
    return response.data;
  }
};