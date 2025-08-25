// src/components/Engines.jsx
import React, { useState } from "react";
import { FaPlus, FaTruck, FaCheckCircle, FaTimesCircle, FaEdit, FaTrash } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Voiture1 from "../assets/voiture1.jpg";
import Tracteur from "../assets/R.jpeg";
import Bulldozer from "../assets/v2.jpg";

export default function Engines() {
  const [engines, setEngines] = useState([
    { id: 1, name: "Camion Volvo", status: "Disponible", image: Voiture1 },
    { id: 2, name: "Tracteur John Deere", status: "En maintenance", image: Tracteur },
    { id: 3, name: "Bulldozer CAT", status: "Disponible", image: Bulldozer },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEngine, setCurrentEngine] = useState({ id: null, name: "", status: "Disponible", image: "" });
  const [isEditMode, setIsEditMode] = useState(false);

  const openAddModal = () => {
    setCurrentEngine({ id: null, name: "", status: "Disponible", image: "" });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const openEditModal = (engine) => {
    setCurrentEngine(engine);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const saveEngine = () => {
    if (isEditMode) {
      setEngines(engines.map(e => e.id === currentEngine.id ? currentEngine : e));
    } else {
      setEngines([...engines, { ...currentEngine, id: Date.now() }]);
    }
    setIsModalOpen(false);
  };

  const deleteEngine = (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer cet engin ?")) {
      setEngines(engines.filter(e => e.id !== id));
    }
  };

  return (
    <div className="p-6">
      {/* Titre + bouton */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <FaTruck /> Gestion des engins
        </h1>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          onClick={openAddModal}
        >
          <FaPlus /> Ajouter un engin
        </button>
      </div>

      {/* Liste des engins */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {engines.map((engine, index) => (
          <motion.div
            key={engine.id}
            className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.05, boxShadow: "0px 15px 25px rgba(0,0,0,0.2)" }}
          >
            <img src={engine.image} alt={engine.name} className="w-full h-40 object-cover" />
            <div className="p-4">
              <h2 className="text-xl font-semibold">{engine.name}</h2>
              <p
                className={`flex items-center gap-2 mt-2 font-medium ${
                  engine.status === "Disponible" ? "text-green-600" : "text-red-600"
                }`}
              >
                {engine.status === "Disponible" ? <FaCheckCircle /> : <FaTimesCircle />}
                {engine.status}
              </p>

              {/* Boutons modifier / supprimer */}
              <div className="flex gap-2 mt-4">
                <button
                  className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded flex items-center gap-1"
                  onClick={() => openEditModal(engine)}
                >
                  <FaEdit /> Modifier
                </button>
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1"
                  onClick={() => deleteEngine(engine.id)}
                >
                  <FaTrash /> Supprimer
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg p-6 w-96"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <h2 className="text-2xl font-bold mb-4">{isEditMode ? "Modifier l'engin" : "Ajouter un engin"}</h2>
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Nom de l'engin"
                  value={currentEngine.name}
                  onChange={(e) => setCurrentEngine({ ...currentEngine, name: e.target.value })}
                  className="border p-2 rounded"
                />
<input
  type="file"
  accept="image/*"
  onChange={(e) => {
    const file = e.target.files[0];
    if (file) {
      setCurrentEngine({ ...currentEngine, image: URL.createObjectURL(file) });
    }
  }}
  className="border p-2 rounded"
/>                <select
                  value={currentEngine.status}
                  onChange={(e) => setCurrentEngine({ ...currentEngine, status: e.target.value })}
                  className="border p-2 rounded"
                >
                  <option value="Disponible">Disponible</option>
                  <option value="En maintenance">En maintenance</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                  onClick={() => setIsModalOpen(false)}
                >
                  Annuler
                </button>
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  onClick={saveEngine}
                >
                  {isEditMode ? "Enregistrer" : "Ajouter"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
