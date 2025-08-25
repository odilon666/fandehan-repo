// src/components/Payment.jsx
import React, { useState } from "react";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export default function Payment() {
  const [payments, setPayments] = useState([
    { id: 1, user: "Jean Dupont", montant: 120, date: "2025-08-15", status: "Payé" },
    { id: 2, user: "Marie Curie", montant: 250, date: "2025-08-14", status: "En attente" },
    { id: 3, user: "Alice Martin", montant: 180, date: "2025-08-13", status: "Payé" },
  ]);

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">Historique des paiements</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {payments.map((payment) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white shadow-md rounded-xl p-6 flex flex-col gap-4 hover:shadow-lg transition transform hover:scale-105"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">{payment.user}</h3>
                {payment.status === "Payé" ? (
                  <FaCheckCircle className="text-green-600 text-2xl" />
                ) : (
                  <FaTimesCircle className="text-red-600 text-2xl" />
                )}
              </div>
              <p className="text-gray-500">Montant: <span className="font-bold">{payment.montant} €</span></p>
              <p className="text-gray-500">Date: <span className="font-bold">{payment.date}</span></p>
              <p className={`font-semibold ${payment.status === "Payé" ? "text-green-600" : "text-yellow-600"}`}>
                {payment.status}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
