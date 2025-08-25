// src/components/UserPayment.jsx
import React from "react";
import { motion } from "framer-motion";

export default function UserPayment() {
  const payments = [
    { id: 1, amount: 120, date: "2025-08-15" },
    { id: 2, amount: 250, date: "2025-08-16" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {payments.map((pay) => (
        <motion.div
          key={pay.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white shadow-md rounded-lg p-4 flex flex-col gap-2"
        >
          <h2 className="font-bold">Montant : {pay.amount}€</h2>
          <p>Date : {pay.date}</p>
        </motion.div>
      ))}
    </div>
  );
}
