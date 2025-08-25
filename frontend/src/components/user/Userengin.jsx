// src/components/UserEngines.jsx
import React, { useState, useEffect } from "react";
import { FaCheckCircle, FaTimesCircle, FaCheck } from "react-icons/fa";
import { motion } from "framer-motion";
import { equipmentService } from "../../services/equipmentService";
import { reservationService } from "../../services/reservationService";

export default function UserEngines() {
  const [engines, setEngines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showPopup, setShowPopup] = useState(false);
  const [selectedEngine, setSelectedEngine] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  useEffect(() => {
    loadEngines();
  }, []);

  const loadEngines = async () => {
    try {
      setLoading(true);
      const data = await equipmentService.getAll({ status: 'available' });
      setEngines(data.equipment || []);
    } catch (err) {
      setError("Erreur lors du chargement des équipements");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const openPopup = (engine) => {
    setSelectedEngine(engine);
    setStartDate(tomorrowStr);
    setEndDate(tomorrowStr);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedEngine(null);
    setStartDate("");
    setEndDate("");
    setQuantity(1);
    setError("");
  };

  const handleReservation = async () => {
    if (!startDate || !endDate) {
      setError("Veuillez sélectionner les dates");
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setError("La date de fin doit être après la date de début");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      
      const reservationData = {
        equipment: selectedEngine._id,
        startDate,
        endDate,
        notes: `Quantité demandée: ${quantity}`
      };

      await reservationService.create(reservationData);
      alert("Réservation créée avec succès ! Elle sera examinée par un administrateur.");
      closePopup();
      loadEngines(); // Recharger la liste
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la réservation");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="text-lg">Chargement des équipements...</div>
    </div>;
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Équipements disponibles</h1>
        <p className="text-gray-600 mt-2">Sélectionnez un équipement pour faire une réservation</p>
      </div>

      {error && !showPopup && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {engines.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">Aucun équipement disponible pour le moment</p>
          </div>
        ) : (
          engines.map((engine, index) => (
          <motion.div
            key={engine._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition transform hover:scale-105"
          >
            {engine.images && engine.images.length > 0 ? (
              <img src={engine.images[0].url} alt={engine.name} className="w-full h-40 object-cover" />
            ) : (
              <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">Pas d'image</span>
              </div>
            )}
            <div className="p-4">
              <h2 className="text-xl font-semibold">{engine.name}</h2>
              <p className="text-gray-600 text-sm mt-1">{engine.brand} {engine.model}</p>
              <p className="text-gray-800 font-bold mt-2">{engine.dailyRate}€/jour</p>
              <p className={`flex items-center gap-2 mt-2 font-medium ${engine.status === "available" ? "text-green-600" : "text-red-600"}`}>
                {engine.status === "available" ? <FaCheckCircle /> : <FaTimesCircle />}
                {engine.status === "available" ? "Disponible" : "Non disponible"}
              </p>
              {engine.status === "available" && (
                <button
                  onClick={() => openPopup(engine)}
                  className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 transition"
                >
                  <FaCheck /> Réserver
                </button>
              )}
            </div>
          </motion.div>
          ))
        )}
      </div>

      {/* POPUP */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg p-6 w-96 shadow-lg"
          >
            <h2 className="text-xl font-bold mb-4">
              Réservation - {selectedEngine.name}
            </h2>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="mb-3">
              <label className="block text-gray-700 font-semibold mb-1">
                Date de début
              </label>
              <input
                type="date"
                value={startDate}
                min={tomorrowStr}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="mb-3">
              <label className="block text-gray-700 font-semibold">
                Date de fin
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate || tomorrowStr}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold">
                Quantité (note)
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full p-2 border rounded"
              />
              <p className="text-xs text-gray-500 mt-1">Cette information sera transmise avec votre demande</p>
            </div>

            {startDate && endDate && (
              <div className="mb-4 p-3 bg-blue-50 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Estimation:</strong> {Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))} jour(s) × {selectedEngine.dailyRate}€ = {Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) * selectedEngine.dailyRate}€
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={closePopup}
                disabled={submitting}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Annuler
              </button>
              <button
                onClick={handleReservation}
                disabled={submitting}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {submitting ? "Envoi..." : "Confirmer"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
