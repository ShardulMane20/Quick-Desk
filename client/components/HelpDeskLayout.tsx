import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Bell, 
  User, 
  Menu, 
  LifeBuoy, 
  Ticket, 
  Plus, 
  Settings,
  Users,
  Tags,
  BarChart3,
  LogOut,
  Home
} from "lucide-react";
import { auth } from "@/firebase";
import { signOut } from "firebase/auth";

interface HelpDeskLayoutProps {
  children: ReactNode;
  userRole?: "user" | "agent" | "admin";
}

export function HelpDeskLayout({ children, userRole = "user" }: HelpDeskLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getNavigationItems = () => {
  const endUserItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/my-tickets", label: "My Tickets", icon: Ticket },
    { path: "/create-ticket", label: "New Ticket", icon: Plus, isButton: true },
  ];

  const supportAgentItems = [
    { path: "/tickets", label: "All Tickets", icon: Ticket },
    { path: "/assigned-tickets", label: "Assigned Tickets", icon: User },
    { path: "/create-ticket", label: "New Ticket", icon: Plus, isButton: true },
  ];

  const adminItems = [
    { path: "/tickets", label: "All Tickets", icon: Ticket },
  ];

  switch (userRole) {
    case "agent":
      return supportAgentItems;
    case "admin":
      return adminItems;
    default:
      return endUserItems;
  }
};
  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <LifeBuoy className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">QuickDesk</span>
              <Badge variant="secondary" className="ml-2 text-xs">
                {userRole === "user" ? "User" : userRole === "agent" ? "Agent" : "Admin"}
              </Badge>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={
                    userRole === "admin" ? "Search tickets or users..." : 
                    "Search tickets..."
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center space-x-4">
              {navigationItems.map((item) => (
                item.isButton ? (
                  <Button
                    key={item.path}
                    asChild
                    variant="default"
                    size="sm"
                    className="ml-2"
                  >
                    <Link to={item.path}>
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Link>
                  </Button>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === item.path
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </Button>
              <Button variant="ghost" size="sm">
                <User className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="md:hidden"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={
                userRole === "admin" ? "Search tickets or users..." : 
                "Search tickets..."
              }
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-2">
              {navigationItems.map((item) => (
                item.isButton ? (
                  <Button
                    key={item.path}
                    asChild
                    variant="default"
                    size="sm"
                    className="w-full"
                  >
                    <Link
                      to={item.path}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Link>
                  </Button>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === item.path
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <item.icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </Link>
                )
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}