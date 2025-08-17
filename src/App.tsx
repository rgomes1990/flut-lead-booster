import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Sites from "./pages/Sites";
import SiteConfig from "./pages/SiteConfig";
import LeadsCaptured from "./pages/LeadsCaptured";
import Plans from "./pages/Plans";
import Landing from "./pages/Landing";
import LeadDemo from "./pages/LeadDemo";
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
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const DashboardRouter = () => {
  const { userProfile, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }
  
  // Redireciona baseado no tipo de usuário
  if (userProfile?.user_type === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  
  return <Dashboard />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
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
            <Route path="/sites" element={
              <ProtectedRoute requiredRole="admin">
                <Sites />
              </ProtectedRoute>
            } />
            <Route path="/sites/:siteId/config" element={
              <ProtectedRoute>
                <SiteConfig />
              </ProtectedRoute>
            } />
            <Route path="/leads-captured" element={
              <ProtectedRoute requiredRole="admin">
                <LeadsCaptured />
              </ProtectedRoute>
            } />
            <Route path="/plans" element={
              <ProtectedRoute requiredRole="admin">
                <Plans />
              </ProtectedRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
