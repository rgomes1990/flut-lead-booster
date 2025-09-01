
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
      label: "Usuários",
      icon: Users,
      path: "/admin",
      roles: ["admin"]
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
    },
    {
      label: "Landing",
      icon: PlusCircle,
      path: "/landing-pages",
      roles: ["admin", "client"]
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userProfile?.user_type || 'client')
  );

  return (
    <nav className="bg-blue-600 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/f5619431-8313-40c2-84d7-beabfa0ba9cc.png"
              alt="FLUT"
              className="h-8 w-auto object-contain"
            />
          </div>
          
          <div className="flex items-center space-x-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 text-white hover:bg-blue-500 border-2 border-transparent ${
                    active ? "border-[#b2ff00] font-semibold" : ""
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="text-white hover:bg-blue-500 flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavigation;
