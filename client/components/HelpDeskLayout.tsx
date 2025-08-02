import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
  Filter,
  Settings,
  Users,
  Tags,
  BarChart3,
  LogOut
} from "lucide-react";

interface HelpDeskLayoutProps {
  children: ReactNode;
  userRole?: "end_user" | "support_agent" | "admin";
}

export function HelpDeskLayout({ children, userRole = "end_user" }: HelpDeskLayoutProps) {
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const getNavigationItems = () => {
    const common = [
      { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
      { path: "/tickets", label: "Tickets", icon: Ticket },
      { path: "/create-ticket", label: "New Ticket", icon: Plus, isButton: true },
    ];

    const agentItems = [
      { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
      { path: "/tickets", label: "All Tickets", icon: Ticket },
      { path: "/my-tickets", label: "My Tickets", icon: User },
      { path: "/create-ticket", label: "New Ticket", icon: Plus, isButton: true },
    ];

    const adminItems = [
      { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
      { path: "/tickets", label: "All Tickets", icon: Ticket },
      { path: "/users", label: "Users", icon: Users },
      { path: "/categories", label: "Categories", icon: Tags },
      { path: "/settings", label: "Settings", icon: Settings },
      { path: "/create-ticket", label: "New Ticket", icon: Plus, isButton: true },
    ];

    switch (userRole) {
      case "support_agent":
        return agentItems;
      case "admin":
        return adminItems;
      default:
        return common;
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
                {userRole === "end_user" ? "User" : userRole === "support_agent" ? "Agent" : "Admin"}
              </Badge>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center space-x-4">
              {navigationItems.slice(0, -1).map((item) => (
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
              ))}
              <Link to="/create-ticket">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  New Ticket
                </Button>
              </Link>
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
              <Button variant="ghost" size="sm">
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
              placeholder="Search tickets..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-2">
              {navigationItems.map((item) => (
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
