import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Globe, LogOut, Contact, BarChart3, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const AdminNavigation = () => {
  const location = useLocation();
  const { signOut, userProfile } = useAuth();

  return (
    <nav className="bg-card border-b border-border p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex space-x-4">
          <Link to="/dashboard">
            <Button 
              variant={location.pathname === "/dashboard" ? "default" : "ghost"}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link to="/admin">
            <Button 
              variant={location.pathname === "/admin" ? "default" : "ghost"}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              {userProfile?.user_type === 'admin' ? 'Usuários' : 'Meu Perfil'}
            </Button>
          </Link>
          <Link to="/sites">
            <Button 
              variant={location.pathname === "/sites" ? "default" : "ghost"}
              className="flex items-center gap-2"
            >
              <Globe className="h-4 w-4" />
              Sites
            </Button>
          </Link>
          <Link to="/leads-captured">
            <Button 
              variant={location.pathname === "/leads-captured" ? "default" : "ghost"}
              className="flex items-center gap-2"
            >
              <Contact className="h-4 w-4" />
              Leads Capturados
            </Button>
          </Link>
          <Link to="/plans">
            <Button 
              variant={location.pathname === "/plans" ? "default" : "ghost"}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Planos
            </Button>
          </Link>
        </div>
        
        <Button 
          variant="ghost" 
          onClick={signOut}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </nav>
  );
};

export default AdminNavigation;