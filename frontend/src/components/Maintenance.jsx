// src/components/Maintenance.jsx
import React, { useState } from "react";
import { FaTools, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export default function Maintenance() {
  const [engines, setEngines] = useState([
    {
      id: 1,
      name: "Camion Volvo",
      status: "Disponible",
      maintenanceList: [
        { id: 1, description: "Vidange moteur", date: "2025-08-01", done: true },
        { id: 2, description: "Changement pneus", date: "2025-08-05", done: false },
      ],
    },
    {
      id: 2,
      name: "Tracteur John Deere",
      status: "En maintenance",
      maintenanceList: [
        { id: 1, description: "Révision hydraulique", date: "2025-08-10", done: false },
      ],
    },
    {
      id: 3,
      name: "Bulldozer CAT",
      status: "Disponible",
      maintenanceList: [
        { id: 1, description: "Nettoyage complet", date: "2025-08-03", done: true },
      ],
    },
  ]);

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">Gestion des maintenances</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {engines.map((engine) => (
            <motion.div
              key={engine.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white shadow-md rounded-xl overflow-hidden hover:shadow-lg transition transform hover:scale-105"
            >
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-xl font-semibold">{engine.name}</h3>
                {engine.status === "Disponible" ? (
                  <FaCheckCircle className="text-green-600 text-2xl" />
                ) : (
                  <FaTimesCircle className="text-red-600 text-2xl" />
                )}
              </div>

              <div className="p-4">
                <h4 className="font-semibold mb-2">Liste des maintenances :</h4>
                {engine.maintenanceList.length === 0 ? (
                  <p className="text-gray-500">Aucune maintenance enregistrée</p>
                ) : (
                  engine.maintenanceList.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      className="flex justify-between items-center bg-gray-100 p-2 rounded mb-2"
                    >
                      <div>
                        <p className="font-medium">{task.description}</p>
                        <p className="text-gray-500 text-sm">Date: {task.date}</p>
                      </div>
                      {task.done ? (
                        <FaCheckCircle className="text-green-600" />
                      ) : (
                        <FaTools className="text-yellow-600" />
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
