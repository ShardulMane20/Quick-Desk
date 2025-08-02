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

export default function Dashboard() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({ total: 0, answered: 0 });
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [topContributors, setTopContributors] = useState<Contributor[]>([]);
  const [recentQuestions, setRecentQuestions] = useState<Question[]>([]);
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
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        }
      } else {
        navigate("/"); // Redirect to login if no user
      }
    });

    (async () => {
      const allQ = await getDocs(collection(db, "questions"));
      const answeredQ = await getDocs(
        query(collection(db, "questions"), where("answersCount", ">", 0))
      );
      setStats({ total: allQ.size, answered: answeredQ.size });
    })();

    const unsubscribeQ = onSnapshot(collection(db, "questions"), (snap) => {
      const data = snap.docs.map((doc) => doc.data() as Question);
      const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const counts: Record<string, { questions: number; answers: number }> =
        {};
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

    const recentQ = query(
      collection(db, "questions"),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const unsubscribeRecent = onSnapshot(recentQ, (snap) => {
      setRecentQuestions(snap.docs.map((d) => d.data() as Question));
    });

    return () => {
      unsubscribeAuth();
      unsubscribeQ();
      unsubscribeRecent();
    };
  }, [navigate]);

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
            <CardHeader>
              <CardTitle>Total Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.total}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Answered Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.answered}
              </div>
            </CardContent>
          </Card>
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
                  fill="#10b981"
                  stroke="#10b981"
                />
                <Area
                  type="monotone"
                  dataKey="answers"
                  fill="#3b82f6"
                  stroke="#3b82f6"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Role-based Content */}
        {userProfile?.role === "admin" && (
          <Card>
            <CardHeader>
              <CardTitle>Admin Panel</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Here you can manage users, data, and platform analytics.</p>
            </CardContent>
          </Card>
        )}

        {userProfile?.role === "support_agent" && (
          <Card>
            <CardHeader>
              <CardTitle>Support Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Access moderation and unresolved tickets here.</p>
            </CardContent>
          </Card>
        )}

        {/* Top Contributors */}
        <Card>
          <CardHeader>
            <CardTitle>Top Contributors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topContributors.map((contributor, index) => (
              <div key={index} className="flex justify-between">
                <span>{contributor.name}</span>
                <span>{contributor.reputation} pts</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Questions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentQuestions.map((q, i) => (
              <div key={i} className="border-b pb-2">
                <h4 className="font-medium">{q.title}</h4>
                <div className="text-sm text-gray-600">
                  {q.views} views · {q.answersCount} answers · {q.votes} votes
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
