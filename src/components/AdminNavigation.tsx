
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Settings, 
  Globe, 
  MessageSquare, 
  Users, 
  CreditCard,
  FileText,
  LogOut,
  PlusCircle
} from "lucide-react";

const AdminNavigation = () => {
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const menuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
      roles: ["admin", "client"]
    },
    {
      label: "Landing Pages",
      icon: PlusCircle,
      path: "/landing-pages",
      roles: ["admin", "client"]
    },
    {
      label: "Sites",
      icon: Globe,
      path: "/sites",
      roles: ["admin", "client"]
    },
    {
      label: "Leads Capturados",
      icon: MessageSquare,
      path: "/leads-captured",
      roles: ["admin", "client"]
    },
    {
      label: "Usuários",
      icon: Users,
      path: "/admin",
      roles: ["admin"]
    },
    {
      label: "Planos",
      icon: CreditCard,
      path: "/plans",
      roles: ["admin", "client"]
    },
    {
      label: "Auditoria",
      icon: FileText,
      path: "/audit",
      roles: ["admin"]
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userProfile?.user_type || 'client')
  );

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-primary">FLUT</h1>
            <Badge variant="secondary">Dashboard</Badge>
          </div>
          
          <div className="flex items-center space-x-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <div className="font-medium">{userProfile?.name}</div>
            <div className="text-muted-foreground">{user?.email}</div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavigation;
