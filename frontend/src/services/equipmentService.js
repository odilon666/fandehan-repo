import API from './api';

export const equipmentService = {
  // Récupérer tous les équipements
  getAll: async (params = {}) => {
    const response = await API.get('/equipment', { params });
    return response.data;
  },

  // Récupérer un équipement par ID
  getById: async (id) => {
    const response = await API.get(`/equipment/${id}`);
    return response.data;
  },

  // Créer un nouvel équipement (admin)
  create: async (equipmentData) => {
    const response = await API.post('/equipment', equipmentData);
    return response.data;
  },

  // Mettre à jour un équipement (admin)
  update: async (id, equipmentData) => {
    const response = await API.put(`/equipment/${id}`, equipmentData);
    return response.data;
  },

  // Supprimer un équipement (admin)
  delete: async (id) => {
    const response = await API.delete(`/equipment/${id}`);
    return response.data;
  },

  // Vérifier la disponibilité
  checkAvailability: async (id, startDate, endDate) => {
    const response = await API.get(`/equipment/${id}/availability`, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Récupérer les catégories
  getCategories: async () => {
    const response = await API.get('/equipment/meta/categories');
    return response.data;
  },

  // Récupérer les marques
  getBrands: async () => {
    const response = await API.get('/equipment/meta/brands');
    return response.data;
  }
};