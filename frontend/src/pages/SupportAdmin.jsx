import { useEffect, useState } from "react";

export default function SupportAdmin() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/support/messages", {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await res.json();
        setTickets(data);
      } catch (error) {
        console.error("Erreur lors du chargement des tickets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📩 Tickets de Support</h1>

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : tickets.length === 0 ? (
        <p className="text-gray-500">Aucun ticket pour le moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tickets.map((ticket) => (
            <div
              key={ticket._id}
              className="border rounded-2xl p-4 bg-white shadow"
            >
              <h2 className="font-semibold text-lg">{ticket.name}</h2>
              <p className="text-sm text-gray-600">{ticket.email}</p>
              <p className="mt-2">{ticket.message}</p>
              <p className="text-xs text-gray-400 mt-3">
                ⏰ {new Date(ticket.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
