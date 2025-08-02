import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
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
  Users,
  TrendingUp,
  Award,
  Plus,
  ArrowUp,
  ArrowDown,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Tag,
  Ticket,
} from "lucide-react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface UserProfile {
  firstName: string;
  lastName: string;
  role: string;
}

interface Question {
  createdAt: Timestamp;
  views: number;
  answersCount: number;
  votes: number;
  title: string;
}

interface Contributor {
  name: string;
  answersCount: number;
  reputation: number;
}

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userEmail: string;
  assigneeEmail?: string;
}

export default function Dashboard() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({ 
    totalQuestions: 0, 
    answeredQuestions: 0,
    totalTickets: 0,
    openTickets: 0,
    myOpenTickets: 0
  });
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [topContributors, setTopContributors] = useState<Contributor[]>([]);
  const [recentQuestions, setRecentQuestions] = useState<Question[]>([]);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const getStatusColor = (status: string) => {
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

  const getPriorityColor = (priority: string) => {
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

  const getStatusIcon = (status: string) => {
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

  const formatISTDate = (date: Timestamp | Date) => {
    try {
      const dateObj = date instanceof Timestamp ? date.toDate() : new Date(date);
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

useEffect(() => {
  const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
    if (user) {
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        const userData = docSnap.data() as UserProfile;
        setUserProfile(userData);
        
        // Fetch ticket stats for the current user
        const ticketsQuery = userData.role === "end_user" 
          ? query(collection(db, "tickets"), where("userEmail", "==", user.email))
          : collection(db, "tickets");
          
        const ticketsSnapshot = await getDocs(ticketsQuery);
        const openTicketsSnapshot = await getDocs(
          query(ticketsQuery, where("status", "==", "open"))
        );
        
        const myOpenTicketsSnapshot = userData.role !== "end_user"
          ? await getDocs(
              query(
                collection(db, "tickets"), 
                where("assigneeEmail", "==", user.email),
                where("status", "in", ["open", "in_progress"])
              )
            )
          : { size: 0 };

        setStats(prev => ({
          ...prev,
          totalTickets: ticketsSnapshot.size,
          openTickets: openTicketsSnapshot.size,
          myOpenTickets: myOpenTicketsSnapshot.size
        }));
      }
    } else {
      navigate("/");
    }
  });

  // Fetch question stats
  (async () => {
    const allQ = await getDocs(collection(db, "questions"));
    const answeredQ = await getDocs(
      query(collection(db, "questions"), where("answersCount", ">", 0))
    );
    setStats(prev => ({
      ...prev,
      totalQuestions: allQ.size,
      answeredQuestions: answeredQ.size
    }));
  })();

  // Weekly activity data
  const unsubscribeQ = onSnapshot(collection(db, "questions"), (snap) => {
    const data = snap.docs.map((doc) => doc.data() as Question);
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts: Record<string, { questions: number; answers: number }> = {};
    
    data.forEach((q) => {
      const date = q.createdAt.toDate();
      const day = weekdays[date.getDay()];
      counts[day] = counts[day] || { questions: 0, answers: 0 };
      counts[day].questions++;
      counts[day].answers += q.answersCount || 0;
    });
    
    setWeeklyData(
      Object.entries(counts).map(([day, { questions, answers }]) => ({
        day,
        questions,
        answers,
      }))
    );
  });

  // Top contributors
  (async () => {
    const q = query(
      collection(db, "users"),
      orderBy("reputation", "desc"),
      limit(5)
    );
    const snap = await getDocs(q);
    setTopContributors(
      snap.docs.map((d) => ({
        name: `${d.data().firstName} ${d.data().lastName}`,
        answersCount: d.data().answersCount || 0,
        reputation: d.data().reputation || 0,
      }))
    );
  })();

  // Recent questions
  const recentQ = query(
    collection(db, "questions"),
    orderBy("createdAt", "desc"),
    limit(5)
  );
  const unsubscribeRecent = onSnapshot(recentQ, (snap) => {
    setRecentQuestions(snap.docs.map((d) => d.data() as Question));
  });

  // Recent tickets
  const recentTicketsQuery = query(
    collection(db, "tickets"),
    orderBy("createdAt", "desc"),
    limit(5)
  );
  const unsubscribeTickets = onSnapshot(recentTicketsQuery, (snap) => {
    setRecentTickets(snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Ticket)));
  });

  return () => {
    unsubscribeAuth();
    unsubscribeQ();
    unsubscribeRecent();
    unsubscribeTickets();
  };
}, [navigate]); // Removed userProfile?.role from dependencies

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome {userProfile?.firstName}! Role: {userProfile?.role}
            </p>
          </div>
          <div className="flex gap-2">
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Ask Question
            </Button>
            <Link to="/create-ticket">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Ticket className="w-4 h-4 mr-2" />
                New Ticket
              </Button>
            </Link>
            <Button
              variant="outline"
              className="border border-red-500 text-red-600"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Total Questions</CardTitle>
              <MessageSquare className="h-6 w-6 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalQuestions}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Answered Questions</CardTitle>
              <CheckCircle className="h-6 w-6 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.answeredQuestions}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Total Tickets</CardTitle>
              <Ticket className="h-6 w-6 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalTickets}
              </div>
            </CardContent>
          </Card>

          {userProfile?.role === "end_user" ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>My Open Tickets</CardTitle>
                <AlertCircle className="h-6 w-6 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.myOpenTickets}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Open Tickets</CardTitle>
                <AlertCircle className="h-6 w-6 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.openTickets}
                </div>
                {userProfile?.role !== "end_user" && stats.myOpenTickets > 0 && (
                  <div className="text-sm text-gray-600 mt-1">
                    {stats.myOpenTickets} assigned to me
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Weekly Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="questions"
                  name="Questions"
                  fill="#10b981"
                  stroke="#10b981"
                />
                <Area
                  type="monotone"
                  dataKey="answers"
                  name="Answers"
                  fill="#3b82f6"
                  stroke="#3b82f6"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Role-based Content */}
        {userProfile?.role === "admin" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Admin Panel</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Here you can manage users, data, and platform analytics.</p>
                <div className="flex gap-2">
                  <Button variant="outline">Manage Users</Button>
                  <Button variant="outline">System Analytics</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm">
                    View All Tickets
                  </Button>
                  <Button variant="outline" size="sm">
                    View Unassigned
                  </Button>
                  <Button variant="outline" size="sm">
                    High Priority
                  </Button>
                  <Button variant="outline" size="sm">
                    System Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {userProfile?.role === "support_agent" && (
          <Card>
            <CardHeader>
              <CardTitle>Support Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Link to="/tickets">
                  <Button variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    View All Tickets
                  </Button>
                </Link>
                <Link to="/tickets?status=open">
                  <Button variant="outline">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Open Tickets
                  </Button>
                </Link>
                <Link to="/tickets?assignee=me">
                  <Button variant="outline">
                    <User className="w-4 h-4 mr-2" />
                    My Tickets
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Tickets */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Tickets</CardTitle>
              <Link to="/tickets">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentTickets.map((ticket) => (
              <div key={ticket.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(ticket.status)}>
                      {getStatusIcon(ticket.status)}
                      <span className="ml-1">{ticket.status?.replace("_", " ") || "Unknown"}</span>
                    </Badge>
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority || "Unknown"}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {formatISTDate(ticket.createdAt)}
                    </span>
                  </div>
                  <Link to={`/ticket/${ticket.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </Link>
                </div>
                <h4 className="font-medium mt-2">{ticket.subject || "No Subject"}</h4>
                <div className="text-sm text-gray-600">
                  {ticket.userEmail} • {ticket.assigneeEmail || "Unassigned"}
                </div>
              </div>
            ))}
            {recentTickets.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                No recent tickets found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Contributors */}
        <Card>
          <CardHeader>
            <CardTitle>Top Contributors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topContributors.map((contributor, index) => (
              <div key={index} className="flex justify-between items-center">
                <span>{contributor.name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {contributor.answersCount} answers
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-800">
                    {contributor.reputation} pts
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Questions */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Questions</CardTitle>
              <Link to="/questions">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentQuestions.map((q, i) => (
              <div key={i} className="border-b pb-2">
                <h4 className="font-medium">{q.title}</h4>
                <div className="text-sm text-gray-600">
                  {q.views} views • {q.answersCount} answers • {q.votes} votes
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}