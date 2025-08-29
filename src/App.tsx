
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Sites from "./pages/Sites";
import SiteConfig from "./pages/SiteConfig";
import LeadsCaptured from "./pages/LeadsCaptured";
import Plans from "./pages/Plans";
import Landing from "./pages/Landing";
import LeadDemo from "./pages/LeadDemo";
import Audit from "./pages/Audit";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'admin' | 'client' }) => {
  const { user, userProfile, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Se requer admin mas usuário não é admin, redireciona para dashboard
  if (requiredRole === 'admin' && userProfile?.user_type !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/landing" element={<Landing />} />
    <Route path="/demo" element={<LeadDemo />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/dashboard" element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    } />
    <Route path="/admin" element={
      <ProtectedRoute requiredRole="admin">
        <Admin />
      </ProtectedRoute>
    } />
    <Route path="/audit" element={
      <ProtectedRoute requiredRole="admin">
        <Audit />
      </ProtectedRoute>
    } />
    <Route path="/sites" element={
      <ProtectedRoute>
        <Sites />
      </ProtectedRoute>
    } />
    <Route path="/sites/:siteId/config" element={
      <ProtectedRoute>
        <SiteConfig />
      </ProtectedRoute>
    } />
    <Route path="/leads-captured" element={
      <ProtectedRoute>
        <LeadsCaptured />
      </ProtectedRoute>
    } />
    <Route path="/plans" element={
      <ProtectedRoute>
        <Plans />
      </ProtectedRoute>
    } />
    <Route path="/" element={<Index />} />
    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
