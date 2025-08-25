// src/components/DashboardHome.jsx
import React from "react";
import Card from "./Card";
import { 
  FaUsers, FaTools, FaTruck, FaClipboardList, 
  FaClock, FaUserPlus, FaCheckCircle 
} from "react-icons/fa";

export default function DashboardHome() {
  const totalClients = 128;
  const totalEngines = 45;
  const totalMaintenances = 12;

  return (
    <div className="p-6">
      <h2 className="text-4xl font-bold text-gray-800">Bienvenue, Administrateur</h2>
      <p className="mt-2 text-gray-600">Voici un résumé de vos données.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <Card title="Nombre de clients" value={totalClients} icon={<FaUsers />} colorFrom="from-blue-500" colorTo="to-blue-700" />
        <Card title="Nombre d'engins" value={totalEngines} icon={<FaTruck />} colorFrom="from-green-500" colorTo="to-green-700" />
        <Card title="Maintenances en cours" value={totalMaintenances} icon={<FaTools />} colorFrom="from-yellow-500" colorTo="to-yellow-700" />
        <Card title="Commandes totales" value={320} icon={<FaClipboardList />} colorFrom="from-purple-500" colorTo="to-purple-700" />
        <Card title="Commandes en cours" value={45} icon={<FaClock />} colorFrom="from-red-500" colorTo="to-red-700" />
        <Card title="Clients inscrits" value={1280} icon={<FaUserPlus />} colorFrom="from-pink-500" colorTo="to-pink-700" />
        <Card title="Clients ayant terminé" value={890} icon={<FaCheckCircle />} colorFrom="from-indigo-500" colorTo="to-indigo-700" />
      </div>
    </div>
  );
}
