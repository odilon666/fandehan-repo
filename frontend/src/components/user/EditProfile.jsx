// src/components/UserProfile.jsx
import React from "react";
// import { useAuth } from "../context/AuthContext";

export default function UserProfile() {

  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-md">
      <h2 className="text-xl font-bold mb-4">Mon profil</h2>
      <label className="block mb-2">Nom :</label>
      <input type="text"   className="w-full p-2 border rounded mb-4" />
      <label className="block mb-2">Email :</label>
      <input type="email"  className="w-full p-2 border rounded mb-4" />
      <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">Enregistrer</button>
    </div>
  );
}
