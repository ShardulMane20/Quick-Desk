import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HelpDeskLayout } from "@/components/HelpDeskLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  User, 
  Calendar, 
  Clock, 
  Tag, 
  MessageSquare, 
  Send, 
  Paperclip,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit2,
  ArrowLeft
} from "lucide-react";
import { auth, db } from "@/firebase";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

interface TicketMessage {
  id: string;
  author: string;
  authorId: string;
  authorRole: "customer" | "agent" | "admin" | "system";
  content: string;
  timestamp: Date;
  attachments?: Array<{
    id: string;
    name: string;
    size: number;
    url: string;
  }>;
  isInternal?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "open": return "bg-red-100 text-red-800";
    case "in_progress": return "bg-yellow-100 text-yellow-800";
    case "resolved": return "bg-green-100 text-green-800";
    case "closed": return "bg-gray-100 text-gray-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high": return "bg-red-100 text-red-800";
    case "medium": return "bg-yellow-100 text-yellow-800";
    case "low": return "bg-green-100 text-green-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "open": return <AlertCircle className="w-4 h-4" />;
    case "in_progress": return <Clock className="w-4 h-4" />;
    case "resolved": return <CheckCircle className="w-4 h-4" />;
    case "closed": return <XCircle className="w-4 h-4" />;
    default: return <AlertCircle className="w-4 h-4" />;
  }
};

const getRoleColor = (role: string) => {
  switch (role) {
    case "customer": return "bg-blue-100 text-blue-800";
    case "agent": return "bg-green-100 text-green-800";
    case "admin": return "bg-purple-100 text-purple-800";
    case "system": return "bg-gray-100 text-gray-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

export default function TicketDetail() {
  const { id } = useParams();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        // Get current user data
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          throw new Error("User not found");
        }
        
        const userData = userDoc.data();
        setCurrentUser({
          id: user.uid,
          ...userData
        });

        // Get ticket data
        const ticketDoc = await getDoc(doc(db, "tickets", id!));
        if (!ticketDoc.exists()) {
          throw new Error("Ticket not found");
        }

        const ticketData = ticketDoc.data();
        
        // Check permissions
        if (userData.role === "customer" && ticketData.customerId !== user.uid) {
          throw new Error("You don't have permission to view this ticket");
        }

        setTicket({
          id: ticketDoc.id,
          ...ticketData,
          createdAt: ticketData.createdAt.toDate(),
          updatedAt: ticketData.updatedAt.toDate()
        } as Ticket);

        // Get messages
        const messagesQuery = query(
          collection(db, "tickets", id!, "messages"),
          where("isInternal", "in", userData.role === "customer" ? [false, null] : [true, false, null])
        );
        
        const messagesSnapshot = await getDocs(messagesQuery);
        const messagesData = messagesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate()
        })) as TicketMessage[];

        setMessages(messagesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ticket || !currentUser) return;

    try {
      const messageData = {
        author: currentUser.name || currentUser.email,
        authorId: currentUser.id,
        authorRole: currentUser.role === "customer" ? "customer" : 
                    currentUser.role === "admin" ? "admin" : "agent",
        content: newMessage,
        timestamp: serverTimestamp(),
        isInternal: isInternal && currentUser.role !== "customer"
      };

      // Add message to Firestore
      const messageRef = await addDoc(
        collection(db, "tickets", ticket.id, "messages"),
        messageData
      );

      // Update local state
      const newMessageObj: TicketMessage = {
        id: messageRef.id,
        ...messageData,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newMessageObj]);
      setNewMessage("");
      setIsInternal(false);

      // Update ticket's last updated time
      await updateDoc(doc(db, "tickets", ticket.id), {
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!ticket || !currentUser) return;

    try {
      // Update ticket status in Firestore
      await updateDoc(doc(db, "tickets", ticket.id), {
        status,
        updatedAt: serverTimestamp()
      });

      // Update local state
      setTicket(prev => prev ? { ...prev, status, updatedAt: new Date() } : null);

      // Add system message
      const systemMessage = {
        author: "System",
        authorId: "system",
        authorRole: "system",
        content: `Status changed from '${ticket.status}' to '${status}' by ${currentUser.name || currentUser.email}`,
        timestamp: serverTimestamp(),
        isInternal: false
      };

      const messageRef = await addDoc(
        collection(db, "tickets", ticket.id, "messages"),
        systemMessage
      );

      // Update local messages
      setMessages(prev => [
        ...prev,
        {
          id: messageRef.id,
          ...systemMessage,
          timestamp: new Date()
        }
      ]);
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Failed to update ticket status");
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <HelpDeskLayout userRole={currentUser?.role || "user"}>
        <div className="max-w-6xl mx-auto p-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </HelpDeskLayout>
    );
  }

  if (error) {
    return (
      <HelpDeskLayout userRole={currentUser?.role || "user"}>
        <div className="max-w-6xl mx-auto p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-lg font-medium text-red-800">Error</h2>
            <p className="text-red-600">{error}</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </HelpDeskLayout>
    );
  }

  if (!ticket) {
    return (
      <HelpDeskLayout userRole={currentUser?.role || "user"}>
        <div className="max-w-6xl mx-auto p-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-medium text-gray-800">Ticket not found</h2>
            <p className="text-gray-600">The requested ticket could not be found.</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </HelpDeskLayout>
    );
  }

    return (
    <HelpDeskLayout userRole={currentUser?.role || "user"}>
      <div className="max-w-6xl mx-auto space-y-6 p-4">
        {/* Back button */}
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tickets
        </Button>

        {/* Ticket Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="font-mono text-lg font-medium text-blue-600">{ticket.id}</span>
                  <Badge className={getStatusColor(ticket.status)}>
                    {getStatusIcon(ticket.status)}
                    <span className="ml-1">{ticket.status.replace("_", " ")}</span>
                  </Badge>
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                  <Badge variant="outline">
                    <Tag className="w-3 h-3 mr-1" />
                    {ticket.category}
                  </Badge>
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 mb-4">{ticket.title}</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    <div>
                      <p className="font-medium">Customer</p>
                      <p>{ticket.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    <div>
                      <p className="font-medium">Assigned To</p>
                      <p>{ticket.assignedTo || "Unassigned"}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <div>
                      <p className="font-medium">Created</p>
                      <p>{ticket.createdAt.toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    <div>
                      <p className="font-medium">Last Updated</p>
                      <p>{ticket.updatedAt.toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {ticket.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions - Only for agents and admins */}
              {(currentUser?.role === "agent" || currentUser?.role === "admin") && (
                <div className="flex flex-col space-y-2 ml-6">
                  <Select value={ticket.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              )}
            </div>

            {/* Original Description */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Conversation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Conversation ({messages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id} className="flex space-x-4">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className={getRoleColor(message.authorRole)}>
                      {message.author.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-gray-900">{message.author}</span>
                      <Badge variant="outline" className="text-xs">
                        {message.authorRole}
                      </Badge>
                      {message.isInternal && (
                        <Badge variant="destructive" className="text-xs">
                          Internal
                        </Badge>
                      )}
                      <span className="text-sm text-gray-500">{formatTimestamp(message.timestamp)}</span>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${
                      message.authorRole === "system" 
                        ? "bg-gray-100 text-gray-600 italic"
                        : message.isInternal
                          ? "bg-yellow-50 border border-yellow-200"
                          : "bg-white border border-gray-200"
                    }`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.attachments.map(attachment => (
                            <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center space-x-2">
                                <Paperclip className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">{attachment.name}</span>
                              </div>
                              <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reply Section - Only visible if user can reply */}
        {(currentUser?.role === "user" || 
          currentUser?.role === "agent" || 
          currentUser?.role === "admin") && (
          <Card>
            <CardHeader>
              <CardTitle>Add Reply</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="min-h-[100px]"
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {(currentUser?.role === "agent" || currentUser?.role === "admin") && (
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={isInternal}
                          onChange={(e) => setIsInternal(e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-600">Internal note (not visible to customer)</span>
                      </label>
                    )}
                  </div>
                  
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Reply
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </HelpDeskLayout>
  );
}