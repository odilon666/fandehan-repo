import { useState } from "react";

export default function SupportClient() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Envoi en cours...");

    try {
      const res = await fetch("http://localhost:3000/api/support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatus("✅ Message envoyé avec succès !");
        setForm({ name: "", email: "", message: "" });
      } else {
        setStatus("❌ Erreur lors de l'envoi.");
      }
    } catch (err) {
      setStatus("⚠️ Impossible de contacter le serveur.");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      {/* FAQ Section */}
      <div className="bg-white shadow rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-4">❓ Foire Aux Questions</h2>
        <ul className="space-y-3">
          <li>
            <strong>Comment réserver un engin ?</strong>
            <p>Vous pouvez parcourir le catalogue, choisir un engin et cliquer sur "Réserver".</p>
          </li>
          <li>
            <strong>Quels moyens de paiement sont acceptés ?</strong>
            <p>Nous acceptons carte bancaire, mobile money et virement bancaire.</p>
          </li>
          <li>
            <strong>Puis-je annuler une réservation ?</strong>
            <p>Oui, vous pouvez annuler depuis votre espace client tant que la réservation n’est pas confirmée.</p>
          </li>
        </ul>
      </div>

      {/* Formulaire de contact */}
      <div className="bg-white shadow rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-4">📩 Contactez le support</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Votre nom"
            required
            className="w-full border p-2 rounded-lg"
          />
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Votre email"
            required
            className="w-full border p-2 rounded-lg"
          />
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Votre message"
            required
            rows="4"
            className="w-full border p-2 rounded-lg"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Envoyer
          </button>
        </form>
        {status && <p className="mt-3 text-sm">{status}</p>}
      </div>
    </div>
  );
}
