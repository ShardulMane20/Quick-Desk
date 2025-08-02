import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger}from "@/components/ui/tabs"
  import {Button,
} from "@/components/ui/button"
import {  Input}from "@/components/ui/input"
import {  Label}from "@/components/ui/label"
import { LifeBuoy, Eye, EyeOff } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // LOGIN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
      navigate("/dashboard");
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        setAuthError("No user found with this email.");
      } else if (err.code === "auth/wrong-password") {
        setAuthError("Incorrect password.");
      } else {
        setAuthError("Login failed. Please try again.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // REGISTER
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (registerData.password !== registerData.confirmPassword) {
      setAuthError("Passwords don't match.");
      return;
    }

    setAuthLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        registerData.email,
        registerData.password
      );

      await setDoc(doc(db, "users", userCred.user.uid), {
        email: registerData.email,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        role: "user", // 👈 Default role
        createdAt: new Date(),
      });

      navigate("/dashboard");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setAuthError("Email already in use.");
      } else if (err.code === "auth/weak-password") {
        setAuthError("Password should be at least 6 characters.");
      } else {
        setAuthError("Registration failed.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <LifeBuoy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">QuickDesk</h1>
          <p className="text-gray-600 mt-2">Professional Help Desk System</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-xl">Get Started</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Sign Up</TabsTrigger>
              </TabsList>

              {/* Login */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        placeholder="Enter your password"
                        className="pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {authError && <p className="text-sm text-red-600">{authError}</p>}

                  <Button type="submit" disabled={authLoading} className="w-full bg-blue-600 hover:bg-blue-700">
                    {authLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              {/* Register */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={registerData.firstName}
                        onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                        placeholder="John"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={registerData.lastName}
                        onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      placeholder="Create a password"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      placeholder="Confirm your password"
                      required
                    />
                  </div>

                  {authError && <p className="text-sm text-red-600">{authError}</p>}

                  <Button type="submit" disabled={authLoading} className="w-full bg-blue-600 hover:bg-blue-700">
                    {authLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
