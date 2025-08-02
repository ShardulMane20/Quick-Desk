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
  Ticket,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
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
    totalQuestions: 21, // Dummy initial value
    answeredQuestions: 14, // Dummy initial value
    totalTickets: 50, // Dummy initial value
    openTickets: 15, // Dummy initial value
    myOpenTickets: 5 // Dummy initial value
  });
  const [weeklyData, setWeeklyData] = useState<any[]>([
    { day: "Sun", questions: 5, answers: 3 },
    { day: "Mon", questions: 8, answers: 6 },
    { day: "Tue", questions: 12, answers: 10 },
    { day: "Wed", questions: 15, answers: 12 },
    { day: "Thu", questions: 10, answers: 8 },
    { day: "Fri", questions: 7, answers: 5 },
    { day: "Sat", questions: 6, answers: 4 },
  ]);
  const [ticketStatusData, setTicketStatusData] = useState<any[]>([
    { name: "Open", value: 10 },
    { name: "In Progress", value: 8 },
    { name: "Resolved", value: 12 },
    { name: "Closed", value: 15 },
  ]);
  const [topContributors, setTopContributors] = useState<Contributor[]>([
    { name: "Shardul Mane", answersCount: 25, reputation: 150 },
    { name: "Narayan Sangele", answersCount: 20, reputation: 120 },
    { name: "Yash Kadav", answersCount: 15, reputation: 90 },
    { name: "Sakshi Pawar", answersCount: 10, reputation: 60 },
    { name: "Sneha Patil", answersCount: 8, reputation: 50 },
  ]);
  const [recentQuestions, setRecentQuestions] = useState<Question[]>([
    { createdAt: Timestamp.now(), views: 50, answersCount: 3, votes: 5, title: "How to configure Firebase?" },
    { createdAt: Timestamp.now(), views: 30, answersCount: 2, votes: 2, title: "React hooks best practices" },
    { createdAt: Timestamp.now(), views: 20, answersCount: 1, votes: 0, title: "Firestore query optimization" },
    { createdAt: Timestamp.now(), views: 15, answersCount: 0, votes: -1, title: "Authentication issues" },
    { createdAt: Timestamp.now(), views: 10, answersCount: 0, votes: 1, title: "Deploying to Vercel" },
  ]);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([
    { 
      id: "TICKET001", 
      subject: "Login issue", 
      status: "open", 
      priority: "high", 
      category: "General Inquiry", 
      createdAt: Timestamp.now(), 
      updatedAt: Timestamp.now(), 
      userEmail: "shaivamgh234@gmail.com" 
    },
    { 
      id: "TICKET002", 
      subject: "Payment failure", 
      status: "in_progress", 
      priority: "medium", 
      category: "General Inquiry", 
      createdAt: Timestamp.now(), 
      updatedAt: Timestamp.now(), 
      userEmail: "user2@example.com",
      assigneeEmail: "vishalvb544@gmail.com" 
    },
    { 
      id: "TICKET003", 
      subject: "Feature request", 
      status: "resolved", 
      priority: "low", 
      category: "General Inquiry", 
      createdAt: Timestamp.now(), 
      updatedAt: Timestamp.now(), 
      userEmail: "nishant2004@gmail.com" 
    },
    { 
      id: "TICKET004", 
      subject: "Bug report", 
      status: "closed", 
      priority: "high", 
      category: "General Inquiry", 
      createdAt: Timestamp.now(), 
      updatedAt: Timestamp.now(), 
      userEmail: "shakha2004@gmail.com" 
    },
    { 
      id: "TICKET005", 
      subject: "Account recovery", 
      status: "open", 
      priority: "medium", 
      category: "General Inquiry", 
      createdAt: Timestamp.now(), 
      updatedAt: Timestamp.now(), 
      userEmail: "mrunalps@gmail.com" 
    },
  ]);
  const [weeklyStats, setWeeklyStats] = useState({
    totalQuestions: 21,
    totalAnswers: 14,
    avgResponseTime: 4.5,
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
      if (user && user.email) {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          const userData = docSnap.data() as UserProfile;
          setUserProfile(userData);
          
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
            totalTickets: ticketsSnapshot.size || 50,
            openTickets: openTicketsSnapshot.size || 15,
            myOpenTickets: myOpenTicketsSnapshot.size || 5
          }));
        }
      } else {
        navigate("/");
      }
    });

    // Fetch question stats (initial load)
    (async () => {
      const allQ = await getDocs(collection(db, "questions"));
      const answeredQ = await getDocs(
        query(collection(db, "questions"), where("answersCount", ">", 0))
      );
      setStats(prev => ({
        ...prev,
        totalQuestions: allQ.size || 21,
        answeredQuestions: answeredQ.size || 14
      }));
    })();

    // Real-time listener for questions
    const unsubscribeQ = onSnapshot(collection(db, "questions"), (snap) => {
      const data = snap.docs.map((doc) => doc.data() as Question);
      const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const counts: Record<string, { questions: number; answers: number }> = {};
      
      // Filter questions from the last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      data.forEach((q) => {
        const date = q.createdAt.toDate();
        if (date >= oneWeekAgo) {
          const day = weekdays[date.getDay()];
          counts[day] = counts[day] || { questions: 0, answers: 0 };
          counts[day].questions++;
          counts[day].answers += q.answersCount || 0;
        }
      });
      
      const weeklyData = Object.entries(counts).map(([day, { questions, answers }]) => ({
        day,
        questions,
        answers,
      }));
      
      // Use Firebase data if available, otherwise keep dummy data
      setWeeklyData(weeklyData.length > 0 ? weeklyData : [
        { day: "Sun", questions: 5, answers: 3 },
        { day: "Mon", questions: 8, answers: 6 },
        { day: "Tue", questions: 12, answers: 10 },
        { day: "Wed", questions: 15, answers: 12 },
        { day: "Thu", questions: 10, answers: 8 },
        { day: "Fri", questions: 7, answers: 5 },
        { day: "Sat", questions: 6, answers: 4 },
      ]);
      
      // Update weekly stats
      const totalQuestions = weeklyData.reduce((sum, item) => sum + item.questions, 0) || 63;
      const totalAnswers = weeklyData.reduce((sum, item) => sum + item.answers, 0) || 48;
      setWeeklyStats(prev => ({
        ...prev,
        totalQuestions,
        totalAnswers,
      }));
    });

    // Real-time listener for tickets
    const unsubscribeTicketsStats = onSnapshot(collection(db, "tickets"), (snap) => {
      const ticketsData = snap.docs.map((doc) => doc.data() as Ticket);
      
      // Calculate average response time for resolved tickets
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const responseTimes = ticketsData
        .filter(ticket => ticket.createdAt && ticket.updatedAt && ticket.status === "resolved" && ticket.createdAt.toDate() >= oneWeekAgo)
        .map(ticket => {
          const created = ticket.createdAt.toDate().getTime();
          const updated = ticket.updatedAt.toDate().getTime();
          return (updated - created) / (1000 * 60 * 60); // Convert to hours
        });
      const avgResponseTime = responseTimes.length > 0 
        ? Number((responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length).toFixed(2))
        : 4.5;
      
      // Calculate ticket status distribution
      const statusCounts = {
        open: 0,
        in_progress: 0,
        resolved: 0,
        closed: 0,
      };
      
      ticketsData.forEach(ticket => {
        if (ticket.createdAt.toDate() >= oneWeekAgo && ticket.status in statusCounts) {
          statusCounts[ticket.status]++;
        }
      });
      
      const newTicketStatusData = [
        { name: "Open", value: statusCounts.open || 10 },
        { name: "In Progress", value: statusCounts.in_progress || 8 },
        { name: "Resolved", value: statusCounts.resolved || 12 },
        { name: "Closed", value: statusCounts.closed || 15 },
      ];
      
      setTicketStatusData(newTicketStatusData);
      setWeeklyStats(prev => ({
        ...prev,
        avgResponseTime,
      }));
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
        snap.docs.length > 0
          ? snap.docs.map((d) => ({
              name: `${d.data().firstName} ${d.data().lastName}`,
              answersCount: d.data().answersCount || 0,
              reputation: d.data().reputation || 0,
            }))
          : [
              { name: "Shardul Mane", answersCount: 25, reputation: 150 },
              { name: "Narayan Sangale", answersCount: 20, reputation: 120 },
              { name: "Yash Kadav", answersCount: 15, reputation: 90 },
              { name: "Sakshi Pawar", answersCount: 10, reputation: 60 },
              { name: "Sneha Patil", answersCount: 8, reputation: 50 },
            ]
      );
    })();

    // Recent questions
    const recentQ = query(
      collection(db, "questions"),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const unsubscribeRecent = onSnapshot(recentQ, (snap) => {
      setRecentQuestions(
        snap.docs.length > 0
          ? snap.docs.map((d) => d.data() as Question)
          : [
              { createdAt: Timestamp.now(), views: 50, answersCount: 3, votes: 5, title: "How to configure Firebase?" },
              { createdAt: Timestamp.now(), views: 30, answersCount: 2, votes: 2, title: "React hooks best practices" },
              { createdAt: Timestamp.now(), views: 20, answersCount: 1, votes: 0, title: "Firestore query optimization" },
              { createdAt: Timestamp.now(), views: 15, answersCount: 0, votes: -1, title: "Authentication issues" },
              { createdAt: Timestamp.now(), views: 10, answersCount: 0, votes: 1, title: "Deploying to Vercel" },
            ]
      );
    });

    // Recent tickets
    const recentTicketsQuery = query(
      collection(db, "tickets"),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const unsubscribeTickets = onSnapshot(recentTicketsQuery, (snap) => {
      setRecentTickets(
        snap.docs.length > 0
          ? snap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as Ticket))
          : [
              { 
                id: "TICKET001", 
                subject: "Login issue", 
                status: "open", 
                priority: "high", 
                category: "General Inquiry", 
                createdAt: Timestamp.now(), 
                updatedAt: Timestamp.now(), 
                userEmail: "shivam3522@gmail.com" 
              },
              { 
                id: "TICKET002", 
                subject: "Payment failure", 
                status: "in_progress", 
                priority: "medium", 
                category: "General Inquiry", 
                createdAt: Timestamp.now(), 
                updatedAt: Timestamp.now(), 
                userEmail: "user2@example.com",
                assigneeEmail: "rakshit2004@gmail.com" 
              },
              { 
                id: "TICKET003", 
                subject: "Feature request", 
                status: "resolved", 
                priority: "low", 
                category: "General Inquiry", 
                createdAt: Timestamp.now(), 
                updatedAt: Timestamp.now(), 
                userEmail: "snehapatil@gmail.com" 
              },
              { 
                id: "TICKET004", 
                subject: "Bug report", 
                status: "closed", 
                priority: "high", 
                category: "General Inquiry", 
                createdAt: Timestamp.now(), 
                updatedAt: Timestamp.now(), 
                userEmail: "nishantof@gmail.com" 
              },
              { 
                id: "TICKET005", 
                subject: "Account recovery", 
                status: "open", 
                priority: "medium", 
                category: "General Inquiry", 
                createdAt: Timestamp.now(), 
                updatedAt: Timestamp.now(), 
                userEmail: "vishal567@gmail.com" 
              },
            ]
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeQ();
      unsubscribeRecent();
      unsubscribeTickets();
      unsubscribeTicketsStats();
    };
  }, [navigate]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280'];
  const STATUS_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#6b7280'];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 p-6 bg-white rounded-xl shadow-lg">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-600">
              Dashboard
            </h1>
            <p className="text-gray-600 mt-2 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-500" />
              Welcome {userProfile?.firstName}! Role: <span className="ml-1 font-medium capitalize">{userProfile?.role}</span>
            </p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <Link to="/ask-question">
              
            </Link>
            <Link to="/create-ticket">
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all duration-300 transform hover:scale-105">
                <Ticket className="w-4 h-4 mr-2" />
                New Ticket
              </Button>
            </Link>
            <Button
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50 transition-all duration-300"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-l-4 border-blue-500">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-800">Total Questions</CardTitle>
              <MessageSquare className="h-6 w-6 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalQuestions}</div>
              <p className="text-sm text-gray-500 mt-1">All time questions</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-l-4 border-green-500">
            <CardHeader className="flex flex-row items-center justify-between">
  <CardTitle className="text-lg font-semibold text-gray-800">Answered Questions</CardTitle>
  <CheckCircle className="h-6 w-6 text-green-500" />
</CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.answeredQuestions}</div>
              <p className="text-sm text-gray-500 mt-1">Resolved queries</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-l-4 border-purple-500">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-800">Total Tickets</CardTitle>
              <Ticket className="h-6 w-6 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalTickets}</div>
              <p className="text-sm text-gray-500 mt-1">Support requests</p>
            </CardContent>
          </Card>

          {userProfile?.role === "end_user" ? (
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-l-4 border-red-500">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-800">My Open Tickets</CardTitle>
                <AlertCircle className="h-6 w-6 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.myOpenTickets}</div>
                <p className="text-sm text-gray-500 mt-1">Pending requests</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-l-4 border-red-500">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-800">Open Tickets</CardTitle>
                <AlertCircle className="h-6 w-6 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.openTickets}</div>
                {userProfile?.role !== "end_user" && stats.myOpenTickets > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    {stats.myOpenTickets} assigned to me
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1">Active tickets</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Weekly Activity */}
        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
              Weekly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Summary Stats */}
              <Card className="bg-gradient-to-br from-blue-50 to-gray-100 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-800">Weekly Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2 text-blue-500" />
                        Total Questions
                      </span>
                      <span className="text-lg font-bold text-gray-900">{weeklyStats.totalQuestions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                        Total Answers
                      </span>
                      <span className="text-lg font-bold text-gray-900">{weeklyStats.totalAnswers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-purple-500" />
                        Avg. Response Time
                      </span>
                      <span className="text-lg font-bold text-gray-900">{weeklyStats.avgResponseTime} hrs</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Line Chart */}
              <Card className="lg:col-span-2 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-800">Activity Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="day" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="questions"
                        name="Questions"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="answers"
                        name="Answers"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Pie Chart for Question Distribution */}
              <Card className="lg:col-span-1 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-800">Question Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={weeklyData}
                        dataKey="questions"
                        nameKey="day"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        label={({ day, questions }) => `${day}: ${questions}`}
                        labelLine={true}
                      >
                        {weeklyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Bar Chart for Ticket Status */}
              <Card className="lg:col-span-2 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-800">Ticket Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={ticketStatusData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="value" name="Tickets">
                        {ticketStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Role-based Content */}
        {userProfile?.role === "admin" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-l-4 border-purple-500">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-purple-500" />
                  Admin Panel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-gray-600">Manage users, data, and platform analytics with ease.</p>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="border-purple-500 text-purple-600 hover:bg-purple-50 transition-all duration-300"
                  >
                    Manage Users
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-purple-500 text-purple-600 hover:bg-purple-50 transition-all duration-300"
                  >
                    System Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-l-4 border-blue-500">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-blue-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-blue-500 text-blue-600 hover:bg-blue-50 transition-all duration-300"
                  >
                    View All Tickets
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-blue-500 text-blue-600 hover:bg-blue-50 transition-all duration-300"
                  >
                    View Unassigned
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-blue-500 text-blue-600 hover:bg-blue-50 transition-all duration-300"
                  >
                    High Priority
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-blue-500 text-blue-600 hover:bg-blue-50 transition-all duration-300"
                  >
                    System Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {userProfile?.role === "support_agent" && (
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 mb-8 border-l-4 border-indigo-500">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
                <Users className="w-5 h-5 mr-2 text-indigo-500" />
                Support Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Link to="/tickets">
                  <Button 
                    variant="outline" 
                    className="border-indigo-500 text-indigo-600 hover:bg-indigo-50 transition-all duration-300"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View All Tickets
                  </Button>
                </Link>
                <Link to="/tickets?status=open">
                  <Button 
                    variant="outline" 
                    className="border-indigo-500 text-indigo-600 hover:bg-indigo-50 transition-all duration-300"
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Open Tickets
                  </Button>
                </Link>
                <Link to="/tickets?assignee=me">
                  <Button 
                    variant="outline" 
                    className="border-indigo-500 text-indigo-600 hover:bg-indigo-50 transition-all duration-300"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    My Tickets
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Tickets */}
        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
                <Ticket className="w-5 h-5 mr-2 text-blue-500" />
                Recent Tickets
              </CardTitle>
              <Link to="/tickets">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-600 hover:bg-blue-50 transition-all duration-300"
                >
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentTickets.map((ticket) => (
              <div key={ticket.id} className="border-b pb-4 last:border-b-0 last:pb-0 hover:bg-gray-50 p-3 rounded-lg transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge className={`${getStatusColor(ticket.status)} flex items-center gap-1 font-medium`}>
                      {getStatusIcon(ticket.status)}
                      <span>{ticket.status?.replace("_", " ") || "Unknown"}</span>
                    </Badge>
                    <Badge className={`${getPriorityColor(ticket.priority)} font-medium`}>
                      {ticket.priority || "Unknown"}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {formatISTDate(ticket.createdAt)}
                    </span>
                  </div>
                  <Link to={`/ticket/${ticket.id}`}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-blue-600 hover:bg-blue-50 transition-all duration-300"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </Link>
                </div>
                <h4 className="font-medium mt-2 text-gray-800">{ticket.subject || "No Subject"}</h4>
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
        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
              <Award className="w-5 h-5 mr-2 text-yellow-500" />
              Top Contributors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topContributors.map((contributor, index) => (
              <div 
                key={index} 
                className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                <span className="font-medium text-gray-800">{contributor.name}</span>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className="bg-blue-100 text-blue-800 font-medium"
                  >
                    {contributor.answersCount} answers
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-800 font-medium">
                    {contributor.reputation} pts
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Questions */}
        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-emerald-500" />
                Recent Questions
              </CardTitle>
              <Link to="/questions">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-emerald-600 hover:bg-emerald-50 transition-all duration-300"
                >
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentQuestions.map((q, i) => (
              <div 
                key={i} 
                className="border-b pb-3 last:border-b-0 hover:bg-gray-50 p-3 rounded-lg transition-all duration-200"
              >
                <h4 className="font-medium text-gray-800">{q.title}</h4>
                <div className="text-sm text-gray-600 flex gap-4 mt-1">
                  <span className="flex items-center">
                    <Eye className="w-4 h-4 mr-1 text-blue-500" />
                    {q.views} views
                  </span>
                  <span className="flex items-center">
                    <MessageSquare className="w-4 h-4 mr-1 text-green-500" />
                    {q.answersCount} answers
                  </span>
                  <span className="flex items-center">
                    {q.votes >= 0 ? (
                      <ArrowUp className="w-4 h-4 mr-1 text-green-500" />
                    ) : (
                      <ArrowDown className="w-4 h-4 mr-1 text-red-500" />
                    )}
                    {q.votes} votes
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}