// src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { FaUserCircle } from "react-icons/fa";

export default function Navbar({role}) {
  const [isScrolled, setIsScrolled] = useState(false);

  // Détection du scroll pour changer le style
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`sticky top-0 z-50 p-4 flex justify-between items-center transition-colors duration-300 ${
        isScrolled ? "bg-gray-100 shadow-md" : "bg-white shadow"
      }`}
    >
      <h1 className="text-xl font-bold hover:text-blue-600 transition-colors duration-300 cursor-pointer">
        Tableau de bord
      </h1>
      <div className="flex items-center gap-4">
        {/* Avatar rond de l'utilisateur */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white text-lg font-bold">
            A
          </div>
          <span className="font-medium">{role}</span>
        </div>

      </div>
    </div>
  );
}
