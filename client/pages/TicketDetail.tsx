import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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
  Edit2
} from "lucide-react";

interface TicketMessage {
  id: string;
  author: string;
  authorRole: "customer" | "agent" | "system";
  content: string;
  timestamp: string;
  attachments?: Array<{
    id: string;
    name: string;
    size: number;
    url: string;
  }>;
  isInternal?: boolean;
}

const mockTicket = {
  id: "TD-001",
  title: "Unable to login to account",
  description: "User cannot access their account after password reset. Tried multiple times with the new password but keeps getting 'Invalid credentials' error.",
  status: "open",
  priority: "high",
  category: "Account Issues",
  customer: "John Smith",
  customerEmail: "john.smith@example.com",
  assignedTo: "Sarah Wilson",
  created: "2024-01-15T10:30:00Z",
  updated: "2024-01-15T14:20:00Z",
  tags: ["login", "password", "urgent"]
};

const mockMessages: TicketMessage[] = [
  {
    id: "1",
    author: "John Smith",
    authorRole: "customer",
    content: "I reset my password this morning but I'm still unable to login. The error message says 'Invalid credentials' even though I'm using the new password that was sent to my email.",
    timestamp: "2024-01-15T10:30:00Z"
  },
  {
    id: "2",
    author: "Sarah Wilson",
    authorRole: "agent",
    content: "Hi John, I'm sorry to hear you're having trouble logging in. Let me check your account status and see what might be causing this issue. Can you please confirm the email address you're using to log in?",
    timestamp: "2024-01-15T11:15:00Z"
  },
  {
    id: "3",
    author: "John Smith",
    authorRole: "customer",
    content: "Yes, I'm using john.smith@example.com - the same email address I've always used.",
    timestamp: "2024-01-15T11:45:00Z"
  },
  {
    id: "4",
    author: "Sarah Wilson",
    authorRole: "agent",
    content: "I can see that your password was successfully reset, but there might be a caching issue. Please try clearing your browser cache and cookies, then attempt to log in again. If that doesn't work, please try using an incognito/private browsing window.",
    timestamp: "2024-01-15T12:20:00Z",
    isInternal: false
  },
  {
    id: "5",
    author: "System",
    authorRole: "system",
    content: "Status changed from 'New' to 'In Progress' by Sarah Wilson",
    timestamp: "2024-01-15T12:21:00Z"
  }
];

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
    case "system": return "bg-gray-100 text-gray-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

export default function TicketDetail() {
  const { id } = useParams();
  const [userRole, setUserRole] = useState<"end_user" | "support_agent" | "admin">("end_user");
  const [ticket, setTicket] = useState(mockTicket);
  const [messages, setMessages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [newStatus, setNewStatus] = useState(ticket.status);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      setUserRole(userData.role || "end_user");
    }
  }, []);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const message: TicketMessage = {
      id: Date.now().toString(),
      author: user.name || "Anonymous",
      authorRole: userRole === "end_user" ? "customer" : "agent",
      content: newMessage,
      timestamp: new Date().toISOString(),
      isInternal: isInternal && userRole !== "end_user"
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");
    setIsInternal(false);
  };

  const handleStatusChange = (status: string) => {
    setNewStatus(status);
    setTicket(prev => ({ ...prev, status }));
    
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const systemMessage: TicketMessage = {
      id: Date.now().toString(),
      author: "System",
      authorRole: "system",
      content: `Status changed from '${ticket.status}' to '${status}' by ${user.name}`,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, systemMessage]);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
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

  return (
    <HelpDeskLayout userRole={userRole}>
      <div className="max-w-6xl mx-auto space-y-6">
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
                      <p>{ticket.customer}</p>
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
                      <p>{new Date(ticket.created).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    <div>
                      <p className="font-medium">Last Updated</p>
                      <p>{new Date(ticket.updated).toLocaleDateString()}</p>
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

              {/* Actions */}
              {(userRole === "support_agent" || userRole === "admin") && (
                <div className="flex flex-col space-y-2 ml-6">
                  <Select value={newStatus} onValueChange={handleStatusChange}>
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

        {/* Reply Section */}
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
                  {(userRole === "support_agent" || userRole === "admin") && (
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
      </div>
    </HelpDeskLayout>
  );
}
