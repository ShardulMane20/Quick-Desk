import { useState, useEffect } from "react";
import { HelpDeskLayout } from "@/components/HelpDeskLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Ticket, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Eye,
  MessageSquare,
  Plus
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from "react-router-dom";

const weeklyTickets = [
  { day: 'Mon', open: 12, resolved: 18 },
  { day: 'Tue', open: 19, resolved: 15 },
  { day: 'Wed', open: 15, resolved: 22 },
  { day: 'Thu', open: 22, resolved: 19 },
  { day: 'Fri', open: 18, resolved: 25 },
  { day: 'Sat', open: 8, resolved: 12 },
  { day: 'Sun', open: 6, resolved: 8 },
];

const ticketsByCategory = [
  { name: 'Technical Issues', value: 45, color: '#3b82f6' },
  { name: 'Account Issues', value: 25, color: '#10b981' },
  { name: 'Billing', value: 15, color: '#f59e0b' },
  { name: 'Feature Requests', value: 10, color: '#8b5cf6' },
  { name: 'Other', value: 5, color: '#6b7280' },
];

const recentTickets = [
  { 
    id: "TD-001", 
    title: "Unable to login to account", 
    status: "open", 
    priority: "high", 
    customer: "John Smith",
    created: "2 hours ago",
    category: "Account Issues"
  },
  { 
    id: "TD-002", 
    title: "Payment processing error", 
    status: "in_progress", 
    priority: "medium", 
    customer: "Sarah Johnson",
    created: "4 hours ago",
    category: "Billing"
  },
  { 
    id: "TD-003", 
    title: "Feature request: Dark mode", 
    status: "resolved", 
    priority: "low", 
    customer: "Mike Chen",
    created: "1 day ago",
    category: "Feature Requests"
  },
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

export default function HelpDeskDashboard() {
  const [userRole, setUserRole] = useState<"end_user" | "support_agent" | "admin">("end_user");

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      setUserRole(userData.role || "end_user");
    }
  }, []);

  return (
    <HelpDeskLayout userRole={userRole}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              {userRole === "end_user" ? "Track your support requests" : 
               userRole === "support_agent" ? "Manage customer tickets" : 
               "Overview of all help desk activities"}
            </p>
          </div>
          <Link to="/create-ticket">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {userRole === "end_user" ? "My Tickets" : "Total Tickets"}
              </CardTitle>
              <Ticket className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {userRole === "end_user" ? "12" : "2,847"}
              </div>
              <p className="text-xs text-green-600 mt-1">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Open Tickets</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {userRole === "end_user" ? "3" : "124"}
              </div>
              <p className="text-xs text-red-600 mt-1">
                <ArrowUp className="w-3 h-3 inline mr-1" />
                +5 since yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Resolved Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {userRole === "end_user" ? "2" : "89"}
              </div>
              <p className="text-xs text-green-600 mt-1">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                +15% efficiency
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">2.4h</div>
              <p className="text-xs text-green-600 mt-1">
                <ArrowDown className="w-3 h-3 inline mr-1" />
                30min faster
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ticket Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Weekly Ticket Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={weeklyTickets} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
                    axisLine={true}
                    tickLine={true}
                    tick={true}
                  />
                  <YAxis
                    axisLine={true}
                    tickLine={true}
                    tick={true}
                  />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="open"
                    stackId="1"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Tickets by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ticketsByCategory}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({name, value}) => `${name}: ${value}%`}
                  >
                    {ticketsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">
              {userRole === "end_user" ? "My Recent Tickets" : "Recent Tickets"}
            </CardTitle>
            <Link to="/tickets">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="font-mono text-sm text-blue-600">{ticket.id}</span>
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status.replace("_", " ")}
                      </Badge>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </div>
                    <h3 className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                      {ticket.title}
                    </h3>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <span>Customer: {ticket.customer}</span>
                      <span>Category: {ticket.category}</span>
                      <span>Created: {ticket.created}</span>
                    </div>
                  </div>
                  <Link to={`/ticket/${ticket.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </HelpDeskLayout>
  );
}
