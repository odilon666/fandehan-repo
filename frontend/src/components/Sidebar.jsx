// src/components/Sidebar.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Sidebar() {
  const [active, setActive] = useState("/"); // "/" par défaut

  const menuItems = [
    { name: "Dashboard", path: "/" },
    { name: "Gestion des Engins", path: "/engines" },
    { name: "Réservations", path: "/reservations" },
    { name: "Utilisateurs", path: "/users" },
    { name: "Rapports", path: "/reports" },
    { name: "Maintenance", path: "/maintenance" },
    { name: "Paiement", path: "/payment" },
  ];

  return (
    <div className="bg-gray-800 text-white w-64 min-h-screen p-4 flex flex-col justify-between">
      {/* Menu en haut */}
      <div>
        <div className="relative mb-6">
          {/* Fond animé */}
          <motion.div
            className="absolute inset-0 rounded-lg"
            initial={{ backgroundPosition: "0% 50%" }}
            animate={{ backgroundPosition: "100% 50%" }}
            transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
            style={{
              background: "linear-gradient(90deg, #34D399, #3B82F6, #FBBF24)",
              backgroundSize: "200% 200%",
              zIndex: 0,
            }}
          />
          {/* Titre au-dessus du fond */}
          <h2 className="relative text-2xl font-bold z-10 px-2 py-1">
            Admin Dashboard
          </h2>
        </div>

        <nav className="flex flex-col space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setActive(item.path)}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 
                ${active === item.path ? "bg-green-500 text-white" : "hover:bg-gray-700"}`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Bouton Déconnexion en bas */}
      <div className="mt-6">
        <button
          className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-200"
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
}
