import { useEffect, useState } from "react";
import { auth, db } from "@/firebase"; // adjust path if needed
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userTicketsQuery = query(
          collection(db, "tickets"),
          where("userId", "==", user.uid)
        );

        const unsubscribeTickets = onSnapshot(userTicketsQuery, (snapshot) => {
          const userTickets = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setTickets(userTickets);
          setLoading(false);
        });

        return () => unsubscribeTickets();
      } else {
        setTickets([]);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  if (loading) return <p>Loading your tickets...</p>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-4">Your Tickets</h2>
      {tickets.length === 0 ? (
        <p>No tickets found.</p>
      ) : (
        <ul className="space-y-4">
          {tickets.map((ticket) => (
            <li
              key={ticket.id}
              className="p-4 border rounded cursor-pointer hover:bg-gray-50"
              onClick={() => navigate(`/ticket/${ticket.id}`)}
            >
              <div className="flex justify-between">
                <span className="font-medium text-lg">{ticket.title}</span>
                <span className="text-sm text-gray-500">{ticket.status}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{ticket.description?.slice(0, 100)}...</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
