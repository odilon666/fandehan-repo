import { useState } from "react";

export default function SupportForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("http://localhost:5000/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-center">Support Client</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Votre nom"
            value={formData.name}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Votre email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg"
            required
          />
          <textarea
            name="message"
            placeholder="Votre message"
            value={formData.message}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg"
            rows="4"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Envoyer
          </button>
        </form>

        {status === "loading" && <p className="text-gray-500 mt-3 text-center">Envoi en cours...</p>}
        {status === "success" && <p className="text-green-600 mt-3 text-center">Message envoyé avec succès ✅</p>}
        {status === "error" && <p className="text-red-600 mt-3 text-center">Erreur lors de l’envoi ❌</p>}
      </div>
    </div>
  );
}
