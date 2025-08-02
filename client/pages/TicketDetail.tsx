import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function TicketDetail() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        alert("Please log in to view your ticket.");
        navigate("/login");
        return;
      }

      try {
        const ticketRef = doc(db, "tickets", ticketId);
        const ticketSnap = await getDoc(ticketRef);

        if (ticketSnap.exists()) {
          const ticketData = ticketSnap.data();

          if (ticketData.userId === user.uid) {
            setTicket({ id: ticketSnap.id, ...ticketData });
          } else {
            alert("You are not authorized to view this ticket.");
            navigate("/");
          }
        } else {
          alert("Ticket not found.");
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching ticket:", error);
        alert("An error occurred.");
        navigate("/");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [ticketId]);

  if (loading) return <p>Loading ticket details...</p>;
  if (!ticket) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-4">{ticket.title}</h1>
      <p className="text-gray-700 mb-2"><strong>Status:</strong> {ticket.status}</p>
      <p className="text-gray-700 mb-2"><strong>Category:</strong> {ticket.category}</p>
      <p className="text-gray-700"><strong>Description:</strong><br />{ticket.description}</p>
    </div>
  );
}
