// src/components/Reports.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Reports() {
  const reservations = [
    {
      id: 1,
      client: "John Doe",
      engine: "Camion Volvo",
      startDate: "2025-08-10",
      endDate: "2025-08-12",
      status: "Acceptée",
    },
    {
      id: 2,
      client: "Jane Smith",
      engine: "Tracteur John Deere",
      startDate: "2025-08-11",
      endDate: "2025-08-13",
      status: "Refusée",
    },
    {
      id: 3,
      client: "Paul Martin",
      engine: "Bulldozer CAT",
      startDate: "2025-08-09",
      endDate: "2025-08-10",
      status: "En attente",
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">Rapports sur les réservations</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg shadow-md">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-3 px-4 text-left">Client</th>
              <th className="py-3 px-4 text-left">Engin</th>
              <th className="py-3 px-4 text-left">Date début</th>
              <th className="py-3 px-4 text-left">Date fin</th>
              <th className="py-3 px-4 text-left">Statut</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {reservations.map((res) => (
                <motion.tr
                  key={res.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="border-b last:border-none hover:bg-gray-50"
                >
                  <td className="py-3 px-4">{res.client}</td>
                  <td className="py-3 px-4">{res.engine}</td>
                  <td className="py-3 px-4">{res.startDate}</td>
                  <td className="py-3 px-4">{res.endDate}</td>
                  <td className={`py-3 px-4 font-semibold ${
                    res.status === "Acceptée"
                      ? "text-green-600"
                      : res.status === "Refusée"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}>
                    {res.status}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
