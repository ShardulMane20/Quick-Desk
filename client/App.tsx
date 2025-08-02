import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import HelpDeskDashboard from "./pages/HelpDeskDashboard";
import Login from "./pages/Login";
import TicketManager from "./pages/TicketManager";
import CreateTicket from "./pages/CreateTicket";
import TicketDetail from "./pages/TicketDetail";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Auth />} />
           <Route path="/login" element={<Login />} />

          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tickets" element={<TicketManager />} />
          <Route path="/my-tickets" element={<TicketManager />} />
          <Route path="/create-ticket" element={<CreateTicket />} />
          <Route path="/ticket/:id" element={<TicketDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);