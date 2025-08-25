// src/components/Users.jsx
import React, { useState } from "react";
import { FaTrash } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export default function Users() {
  const [users, setUsers] = useState([
    { id: 1, email: "jean.dupont@example.com", nom: "Dupont", prenom: "Jean", role: "User" },
    { id: 2, email: "marie.curie@example.com", nom: "Curie", prenom: "Marie", role: "User" },
    { id: 3, email: "admin@example.com", nom: "Admin", prenom: "Super", role: "Admin" },
  ]);

  const handleDelete = (id) => {
    setUsers((prev) => prev.filter((user) => user.id !== id));
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">Gestion des utilisateurs</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-gray-200 text-gray-700">
            <tr>
              <th className="py-3 px-4 text-left">Nom</th>
              <th className="py-3 px-4 text-left">Prénom</th>
              <th className="py-3 px-4 text-left">Email</th>
              <th className="py-3 px-4 text-left">Rôle</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {users.map((user) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="py-3 px-4">{user.nom}</td>
                  <td className="py-3 px-4">{user.prenom}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">{user.role}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded flex justify-center items-center gap-1 transition"
                    >
                      <FaTrash /> Supprimer
                    </button>
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
