import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/firebase";
import {
  collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc
} from "firebase/firestore";
import { HelpDeskLayout } from "@/components/HelpDeskLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface UserData {
  id: string;
  email: string;
  role: string;
}

interface CategoryData {
  id: string;
  name: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // Auth and permission check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.data()?.role !== "admin") {
        navigate("/");
        return;
      }

      setCurrentUser(user);
      fetchData();
    });

    return () => unsubscribe();
  }, [navigate]);

  // Fetch all admin data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersSnapshot, categoriesSnapshot] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "categories"))
      ]);

      setUsers(usersSnapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email,
        role: doc.data().role
      })));

      setCategories(categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      })));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update user role
  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  // Add new category
  const addCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      const newCategoryRef = doc(collection(db, "categories"));
      await setDoc(newCategoryRef, { name: newCategory.trim() });
      setCategories([...categories, {
        id: newCategoryRef.id,
        name: newCategory.trim()
      }]);
      setNewCategory("");
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  // Delete category
  const deleteCategory = async (categoryId: string) => {
    try {
      await deleteDoc(doc(db, "categories", categoryId));
      setCategories(categories.filter(cat => cat.id !== categoryId));
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  if (loading || !currentUser) {
    return (
      <HelpDeskLayout userRole="admin">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </HelpDeskLayout>
    );
  }

  return (
    <HelpDeskLayout userRole="admin">
      <div className="space-y-6 max-w-4xl mx-auto p-4">

        {/* User Management Section */}
        <Card>
          <CardHeader>
            <CardTitle>User Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Role</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Select
                          value={user.role}
                          onValueChange={(value) => updateUserRole(user.id, value)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="agent">Support Agent</SelectItem>
                            <SelectItem value="admin">Administrator</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </HelpDeskLayout>
  );
}