// src/components/Sidebar.jsx
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { name: "Dashboard", path: "/admin" },
    { name: "Gestion des Engins", path: "/admin/engines" },
    { name: "Réservations", path: "/admin/reservations" },
    { name: "Utilisateurs", path: "/admin/users" },
    { name: "Rapports", path: "/admin/reports" },
    { name: "Maintenance", path: "/admin/maintenance" },
    { name: "Paiement", path: "/admin/payment" },
    { name: "Support", path: "/admin/support" },
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
              className={`px-4 py-2 rounded-lg transition-colors duration-200 
                ${location.pathname === item.path ? "bg-green-500 text-white" : "hover:bg-gray-700"}`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Bouton Déconnexion en bas */}
      <div className="mt-6">
        <button
          onClick={logout}
          className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-200"
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
}
