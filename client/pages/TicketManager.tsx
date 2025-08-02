import { useState, useEffect, useCallback } from "react";
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
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase.ts";
import { onAuthStateChanged } from "firebase/auth";
import { debounce } from "lodash"; // Ensure lodash is installed: npm install lodash

const TicketManager = () => {
  const [userRole, setUserRole] = useState("end_user");
  const [userEmail, setUserEmail] = useState("");
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    priority: "all",
    category: "all",
    assignee: "all",
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize applyFilters to prevent recreating the debounced function
  const applyFilters = useCallback(
    debounce((tickets) => {
      let filtered = [...tickets];

      // Safe checks for ticket properties
      if (filters.search) {
        filtered = filtered.filter(
          (ticket) =>
            (ticket.subject || "").toLowerCase().includes(filters.search.toLowerCase()) ||
            (ticket.description || "").toLowerCase().includes(filters.search.toLowerCase()) ||
            (ticket.id || "").toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      if (filters.status !== "all") {
        filtered = filtered.filter((ticket) => ticket.status === filters.status);
      }

      if (filters.priority !== "all") {
        filtered = filtered.filter((ticket) => ticket.priority === filters.priority);
      }

      if (filters.category !== "all") {
        filtered = filtered.filter((ticket) => ticket.category === filters.category);
      }

      if (filters.assignee !== "all") {
        if (filters.assignee === "unassigned") {
          filtered = filtered.filter((ticket) => !ticket.assigneeEmail);
        } else {
          filtered = filtered.filter((ticket) => ticket.assigneeEmail === filters.assignee);
        }
      }

      if (userRole === "end_user") {
        filtered = filtered.filter((ticket) => ticket.userEmail === userEmail);
      }

      setFilteredTickets(filtered);
    }, 300),
    [filters, userRole, userEmail]
  );

  // Fetch tickets in real-time
  useEffect(() => {
    let q;
    try {
      q = query(collection(db, "tickets"), orderBy(filters.sortBy, filters.sortOrder));
    } catch (err) {
      console.error("Invalid query:", err);
      setError("Invalid sort configuration. Please try again.");
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const ticketsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTickets(ticketsData);
        setFilteredTickets(ticketsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching tickets:", error);
        if (error.code === "permission-denied") {
          setError("You don't have permission to view tickets. Please contact support.");
        } else {
          setError("Failed to load tickets: " + error.message);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [filters.sortBy, filters.sortOrder]);

  // Handle authentication and fetch user role from Firestore
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserEmail(user.email);
        // Fetch role from Firestore (assuming a 'users' collection with role field)
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          setUserRole(userDoc.exists() ? userDoc.data().role : "end_user");
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole("end_user");
        }
      } else {
        setUserEmail("");
        setUserRole("end_user");
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Apply filters when tickets or filters change
  useEffect(() => {
    applyFilters(tickets);
  }, [tickets, applyFilters]);

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "all",
      priority: "all",
      category: "all",
      assignee: "all",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };

  const handleSortChange = (sortBy) => {
    setFilters((prev) => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === "desc" ? "asc" : "desc",
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

const getPriorityColor = (priority) => {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-800";
    case "medium":
      return "bg-yellow-100 text-yellow-800";
    case "low":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
  const getStatusIcon = (status) => {
    switch (status) {
      case "open":
        return <AlertCircle className="w-4 h-4" />;
      case "in_progress":
        return <Clock className="w-4 h-4" />;
      case "resolved":
        return <CheckCircle className="w-4 h-4" />;
      case "closed":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Format date with IST, with fallback for non-Timestamp values
  const formatISTDate = (date) => {
    try {
      const dateObj = date?.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
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

        {/* Error State */}
        {error && (
          <Card>
            <CardContent className="text-center py-4 text-red-600">
              {error}
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
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
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
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
              <Select
                value={filters.priority}
                onValueChange={(value) => setFilters({ ...filters, priority: value })}
              >
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
              <Select
                value={filters.category}
                onValueChange={(value) => setFilters({ ...filters, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="General Inquiry">General Inquiry</SelectItem>
                  {/* Add more categories as needed */}
                </SelectContent>
              </Select>
              <Select
                value={filters.assignee}
                onValueChange={(value) => setFilters({ ...filters, assignee: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {/* Dynamically populate assignees if possible */}
                </SelectContent>
              </Select>
              <Select value={filters.sortBy} onValueChange={handleSortChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="updatedAt">Updated Date</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="text-center py-4 text-gray-600">
              Loading tickets...
            </CardContent>
          </Card>
        )}

        {/* Tickets List */}
        {!loading && !error && (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="font-mono text-sm font-medium text-blue-600">{ticket.id}</span>
                        <Badge className={getStatusColor(ticket.status)}>
                          {getStatusIcon(ticket.status)}
                          <span className="ml-1">{ticket.status?.replace("_", " ") || "Unknown"}</span>
                        </Badge>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority || "Unknown"}
                        </Badge>
                        <Badge variant="outline">
                          <Tag className="w-3 h-3 mr-1" />
                          {ticket.category || "Uncategorized"}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer">
                        {ticket.subject || "No Subject"}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">{ticket.description || "No description provided"}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          Customer: {ticket.userEmail || "Unknown"}
                        </span>
                        <span className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          Assignee: {ticket.assigneeEmail || "Unassigned"}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Created: {formatISTDate(ticket.createdAt)}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Updated: {formatISTDate(ticket.updatedAt)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {(ticket.tags || []).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Link to={`/ticket/${ticket.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      {(userRole === "support_agent" || userRole === "admin") && (
                        <Link to={`/edit-ticket/${ticket.id}`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredTickets.length === 0 && (
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
};

export default TicketManager;