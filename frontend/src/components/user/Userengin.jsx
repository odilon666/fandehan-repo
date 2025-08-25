// src/components/UserEngines.jsx
import React, { useState } from "react";
import { FaCheckCircle, FaTimesCircle, FaCheck } from "react-icons/fa";
import { motion } from "framer-motion";
import Voiture1 from "../../assets/voiture1.jpg"
import Tracteur from "../../assets/R.jpeg"

export default function UserEngines() {

  const engines = [
    { id: 1, name: "Camion Volvo", status: "Disponible", image: Voiture1 },
    { id: 2, name: "Tracteur John Deere", status: "Disponible", image: Tracteur },
  ];

  const [showPopup, setShowPopup] = useState(false);
  const [selectedEngine, setSelectedEngine] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [quantity, setQuantity] = useState(1);

  const today = new Date().toISOString().split("T")[0];

  const openPopup = (engine) => {
    setSelectedEngine(engine);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedEngine(null);
    setStartDate("");
    setQuantity(1);
  };

  const handleReservation = () => {
    console.log({
      engine: selectedEngine.name,
      today,
      startDate,
      quantity,
    });
    closePopup();
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {engines.map((engine) => (
          <motion.div
            key={engine.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition transform hover:scale-105"
          >
            <img src={engine.image} alt={engine.name} className="w-full h-40 object-cover" />
            <div className="p-4">
              <h2 className="text-xl font-semibold">{engine.name}</h2>
              <p className={`flex items-center gap-2 mt-2 font-medium ${engine.status === "Disponible" ? "text-green-600" : "text-red-600"}`}>
                {engine.status === "Disponible" ? <FaCheckCircle /> : <FaTimesCircle />}
                {engine.status}
              </p>
              {engine.status === "Disponible" && (
                <button
                  onClick={() => openPopup(engine)}
                  className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 transition"
                >
                  <FaCheck /> Réserver
                </button>
              )}
            </div>
          </motion.div>
        ))}
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

            <div className="mb-3">
              <label className="block text-gray-700 font-semibold">
                Date d'aujourd'hui
              </label>
              <input
                type="date"
                value={today}
                disabled
                className="w-full p-2 border rounded bg-gray-100"
              />
            </div>

            <div className="mb-3">
              <label className="block text-gray-700 font-semibold">
                Date de début de besoin
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold">
                Nombre
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={closePopup}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Annuler
              </button>
              <button
                onClick={handleReservation}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              >
                Confirmer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
