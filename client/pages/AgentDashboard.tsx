import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/firebase";
import { signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Plus,
  ArrowUp,
  ArrowDown,
  Eye,
  Mail,
  List,
  Filter,
  Search,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface UserProfile {
  firstName: string;
  lastName: string;
  role: string;
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved";
  priority: "low" | "medium" | "high";
  createdAt: any;
  createdBy: string;
  assignedTo?: string;
  replies?: {
    message: string;
    sender: string;
    timestamp: any;
  }[];
}

export default function AgentDashboard() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [activeQueue, setActiveQueue] = useState<"my_tickets" | "all">("my_tickets");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
  });
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        }
      } else {
        navigate("/");
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  useEffect(() => {
    if (!userProfile) return;

    let q;
    if (activeQueue === "my_tickets") {
      q = query(
        collection(db, "tickets"),
        where("assignedTo", "==", auth.currentUser?.uid)
      );
    } else {
      q = query(collection(db, "tickets"));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Ticket[];
      setTickets(ticketsData);
    });

    return () => unsubscribe();
  }, [userProfile, activeQueue]);

  useEffect(() => {
    let result = [...tickets];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(ticket =>
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply priority filter
    if (priorityFilter !== "all") {
      result = result.filter(ticket => ticket.priority === priorityFilter);
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(ticket => ticket.status === statusFilter);
    }
    
    setFilteredTickets(result);
  }, [tickets, searchTerm, priorityFilter, statusFilter]);

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      const ticketRef = doc(db, "tickets", selectedTicket.id);
      const newReply = {
        message: replyMessage,
        sender: auth.currentUser?.uid,
        timestamp: new Date(),
      };

      await updateDoc(ticketRef, {
        replies: [...(selectedTicket.replies || []), newReply],
        status: selectedTicket.status === "open" ? "in_progress" : selectedTicket.status,
      });

      setReplyMessage("");
      setSelectedTicket(null);
    } catch (error) {
      console.error("Error replying to ticket:", error);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: Ticket["status"]) => {
    try {
      await updateDoc(doc(db, "tickets", ticketId), {
        status: newStatus,
      });
    } catch (error) {
      console.error("Error updating ticket status:", error);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.title.trim() || !newTicket.description.trim()) return;

    try {
      await addDoc(collection(db, "tickets"), {
        title: newTicket.title,
        description: newTicket.description,
        priority: newTicket.priority,
        status: "open",
        createdAt: new Date(),
        createdBy: auth.currentUser?.uid,
      });

      setNewTicket({
        title: "",
        description: "",
        priority: "medium",
      });
    } catch (error) {
      console.error("Error creating ticket:", error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Support Agent Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome {userProfile?.firstName}!
            </p>
          </div>
          <Button
            variant="outline"
            className="border border-red-500 text-red-600"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>

        {/* Ticket Queues */}
        <div className="flex gap-4">
          <Button
            variant={activeQueue === "my_tickets" ? "default" : "outline"}
            onClick={() => setActiveQueue("my_tickets")}
          >
            My Tickets
          </Button>
          <Button
            variant={activeQueue === "all" ? "default" : "outline"}
            onClick={() => setActiveQueue("all")}
          >
            All Tickets
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tickets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>{ticket.title}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        ticket.priority === "high"
                          ? "bg-red-100 text-red-800"
                          : ticket.priority === "medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}>
                        {ticket.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={ticket.status}
                        onValueChange={(value) =>
                          handleStatusChange(ticket.id, value as Ticket["status"])
                        }
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {new Date(ticket.createdAt?.seconds * 1000).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Reply
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create New Ticket (for agents to create on behalf of users) */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Ticket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Title"
              value={newTicket.title}
              onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
            />
            <Textarea
              placeholder="Description"
              value={newTicket.description}
              onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
            />
            <Select
              value={newTicket.priority}
              onValueChange={(value) =>
                setNewTicket({...newTicket, priority: value as "low" | "medium" | "high"})
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleCreateTicket}>
              <Plus className="w-4 h-4 mr-2" />
              Create Ticket
            </Button>
          </CardContent>
        </Card>

        {/* Ticket Reply Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle>{selectedTicket.title}</CardTitle>
                <div className="text-sm text-gray-600">
                  Priority: {selectedTicket.priority} | Status: {selectedTicket.status}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded">
                  <p>{selectedTicket.description}</p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Replies</h3>
                  {selectedTicket.replies?.length ? (
                    selectedTicket.replies.map((reply, index) => (
                      <div key={index} className="border-l-4 border-gray-300 pl-4 py-2">
                        <p>{reply.message}</p>
                        <div className="text-sm text-gray-500 mt-1">
                          {new Date(reply.timestamp?.seconds * 1000).toLocaleString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No replies yet</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Textarea
                    placeholder="Type your reply here..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                      Cancel
                    </Button>
                    <Button onClick={handleReply}>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Reply
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}