import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Globe, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const AdminNavigation = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <nav className="bg-card border-b border-border p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex space-x-4">
          <Link to="/admin">
            <Button 
              variant={location.pathname === "/admin" ? "default" : "ghost"}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Usuários
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