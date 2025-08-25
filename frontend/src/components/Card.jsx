import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Card({ title, value, icon }) {
  const [count, setCount] = useState(0);

  // Animation progressive du nombre
  useEffect(() => {
    let start = 0;
    const duration = 1500; // 1.5s
    const increment = value / (duration / 16); // 60fps
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        start = value;
        clearInterval(timer);
      }
      setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      className="bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl rounded-2xl p-8 flex items-center gap-6 text-white cursor-pointer"
      whileHover={{ scale: 1.05 }}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Icône */}
      <div className="text-6xl bg-white bg-opacity-20 p-4 rounded-full">
        {icon}
      </div>

      {/* Texte */}
      <div>
        <p className="text-lg opacity-80">{title}</p>
        <h2 className="text-4xl font-extrabold">{count}</h2>
      </div>
    </motion.div>
  );
}
