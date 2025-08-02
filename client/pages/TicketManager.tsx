import { useState, useEffect } from "react";
import { HelpDeskLayout } from "@/components/HelpDeskLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Calendar,
  User,
  Tag,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Link } from "react-router-dom";

const mockTickets = [
  {
    id: "TD-001",
    title: "Unable to login to account",
    description: "User cannot access their account after password reset",
    status: "open",
    priority: "high",
    category: "Account Issues",
    customer: "John Smith",
    assignedTo: "Sarah Wilson",
    created: "2024-01-15T10:30:00Z",
    updated: "2024-01-15T14:20:00Z",
    tags: ["login", "password", "urgent"]
  },
  {
    id: "TD-002",
    title: "Payment processing error",
    description: "Credit card payment failing during checkout process",
    status: "in_progress",
    priority: "medium",
    category: "Billing",
    customer: "Sarah Johnson",
    assignedTo: "Mike Chen",
    created: "2024-01-15T09:15:00Z",
    updated: "2024-01-15T13:45:00Z",
    tags: ["payment", "billing", "checkout"]
  },
  {
    id: "TD-003",
    title: "Feature request: Dark mode",
    description: "Request for dark mode theme option in the application",
    status: "resolved",
    priority: "low",
    category: "Feature Requests",
    customer: "Mike Chen",
    assignedTo: "Alex Rodriguez",
    created: "2024-01-14T16:20:00Z",
    updated: "2024-01-15T11:30:00Z",
    tags: ["feature", "ui", "theme"]
  },
  {
    id: "TD-004",
    title: "Database connection timeout",
    description: "Application experiencing intermittent database connectivity issues",
    status: "open",
    priority: "high",
    category: "Technical Issues",
    customer: "Lisa Zhang",
    assignedTo: null,
    created: "2024-01-15T08:45:00Z",
    updated: "2024-01-15T08:45:00Z",
    tags: ["database", "performance", "critical"]
  },
  {
    id: "TD-005",
    title: "Email notifications not working",
    description: "Users not receiving email notifications for account activities",
    status: "closed",
    priority: "medium",
    category: "Technical Issues",
    customer: "David Brown",
    assignedTo: "Sarah Wilson",
    created: "2024-01-14T12:10:00Z",
    updated: "2024-01-14T18:30:00Z",
    tags: ["email", "notifications", "resolved"]
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

export default function TicketManager() {
  const [userRole, setUserRole] = useState<"end_user" | "support_agent" | "admin">("end_user");
  const [tickets, setTickets] = useState(mockTickets);
  const [filteredTickets, setFilteredTickets] = useState(mockTickets);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    priority: "all",
    category: "all",
    assignee: "all"
  });

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      setUserRole(userData.role || "end_user");
    }
  }, []);

  useEffect(() => {
    let filtered = tickets;

    // Filter by search
    if (filters.search) {
      filtered = filtered.filter(ticket => 
        ticket.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        ticket.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        ticket.id.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Filter by status
    if (filters.status !== "all") {
      filtered = filtered.filter(ticket => ticket.status === filters.status);
    }

    // Filter by priority
    if (filters.priority !== "all") {
      filtered = filtered.filter(ticket => ticket.priority === filters.priority);
    }

    // Filter by category
    if (filters.category !== "all") {
      filtered = filtered.filter(ticket => ticket.category === filters.category);
    }

    // Filter by assignee
    if (filters.assignee !== "all") {
      if (filters.assignee === "unassigned") {
        filtered = filtered.filter(ticket => !ticket.assignedTo);
      } else {
        filtered = filtered.filter(ticket => ticket.assignedTo === filters.assignee);
      }
    }

    // For end users, only show their tickets
    if (userRole === "end_user") {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      filtered = filtered.filter(ticket => ticket.customer === user.name);
    }

    setFilteredTickets(filtered);
  }, [filters, tickets, userRole]);

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "all",
      priority: "all",
      category: "all",
      assignee: "all"
    });
  };

  return (
    <HelpDeskLayout userRole={userRole}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {userRole === "end_user" ? "My Tickets" : "All Tickets"}
            </h1>
            <p className="text-gray-600 mt-1">
              Showing {filteredTickets.length} of {tickets.length} tickets
            </p>
          </div>
          <Link to="/create-ticket">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              New Ticket
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search tickets..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              {/* Priority Filter */}
              <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Technical Issues">Technical Issues</SelectItem>
                  <SelectItem value="Account Issues">Account Issues</SelectItem>
                  <SelectItem value="Billing">Billing</SelectItem>
                  <SelectItem value="Feature Requests">Feature Requests</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Ticket Header */}
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="font-mono text-sm font-medium text-blue-600">{ticket.id}</span>
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

                    {/* Ticket Title and Description */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer">
                      {ticket.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">{ticket.description}</p>

                    {/* Ticket Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        Customer: {ticket.customer}
                      </span>
                      {ticket.assignedTo && (
                        <span className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          Assigned: {ticket.assignedTo}
                        </span>
                      )}
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Created: {new Date(ticket.created).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Updated: {new Date(ticket.updated).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {ticket.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 ml-4">
                    <Link to={`/ticket/${ticket.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    {(userRole === "support_agent" || userRole === "admin") && (
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredTickets.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
              <p className="text-gray-600 mb-4">
                {filters.search || filters.status !== "all" || filters.priority !== "all" || filters.category !== "all"
                  ? "Try adjusting your filters to see more tickets."
                  : "Create your first ticket to get started."}
              </p>
              <Link to="/create-ticket">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Create Ticket
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </HelpDeskLayout>
  );
}
