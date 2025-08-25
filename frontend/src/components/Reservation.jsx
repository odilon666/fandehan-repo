// src/components/Reservations.jsx
import React, { useState } from "react";
import { FaCheck, FaTimes, FaTruck } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export default function Reservations() {
  const [reservations, setReservations] = useState([
    {
      id: 1,
      client: "Jean Dupont",
      engine: "Camion Volvo",
      orderDate: "2025-08-15",
      startDate: "2025-08-20",
      status: "En attente",
    },
    {
      id: 2,
      client: "Marie Curie",
      engine: "Tracteur John Deere",
      orderDate: "2025-08-14",
      startDate: "2025-08-22",
      status: "En attente",
    },
  ]);

  const handleStatus = (id, action) => {
    setReservations((prev) =>
      prev.map((res) =>
        res.id === id
          ? { ...res, status: action === "accept" ? "Acceptée ✅" : "Refusée ❌" }
          : res
      )
    );
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">Gestion des réservations</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {reservations.map((res) => (
            <motion.div
              key={res.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="bg-white shadow-lg rounded-xl p-4 flex flex-col gap-3 hover:shadow-2xl transition"
            >
              <div className="flex items-center gap-2">
                <FaTruck className="text-blue-500 text-xl" />
                <h3 className="font-semibold text-lg">{res.engine}</h3>
              </div>

              <p><span className="font-medium">Client :</span> {res.client}</p>
              <p><span className="font-medium">Date de commande :</span> {res.orderDate}</p>
              <p><span className="font-medium">Date de début :</span> {res.startDate}</p>
              <p><span className="font-medium">Statut :</span> {res.status}</p>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleStatus(res.id, "accept")}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded flex-1 flex justify-center items-center gap-1 transition"
                >
                  <FaCheck /> Accepter
                </button>
                <button
                  onClick={() => handleStatus(res.id, "refuse")}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded flex-1 flex justify-center items-center gap-1 transition"
                >
                  <FaTimes /> Refuser
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
