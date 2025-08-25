// src/components/UserReservations.jsx
import React from "react";
import { motion } from "framer-motion";

export default function UserReservations() {
  const reservations = [
    { id: 1, engine: "Camion Volvo", date: "2025-08-20", status: "En attente" },
    { id: 2, engine: "Tracteur John Deere", date: "2025-08-22", status: "Acceptée" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {reservations.map((res) => (
        <motion.div
          key={res.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white shadow-md rounded-lg p-4 flex flex-col gap-2"
        >
          <h2 className="font-bold">{res.engine}</h2>
          <p>Date de commande : {res.date}</p>
          <p>Status : {res.status}</p>
        </motion.div>
      ))}
    </div>
  );
}
