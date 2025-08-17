import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Globe, LogOut, Contact, BarChart3, Calendar, Settings, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { FlutLogo } from "./FlutLogo";
import { useState } from "react";

const AdminNavigation = () => {
  const location = useLocation();
  const { signOut, userProfile } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    {
      path: "/dashboard",
      icon: BarChart3,
      label: "Dashboard"
    },
    {
      path: "/admin", 
      icon: Users,
      label: userProfile?.user_type === 'admin' ? 'Usuários' : 'Meu Perfil'
    },
    {
      path: "/sites",
      icon: Globe,
      label: "Sites"
    },
    {
      path: "/leads-captured",
      icon: Contact,
      label: "Leads Capturados"
    },
    {
      path: "/plans",
      icon: Calendar,
      label: "Planos"
    }
  ];

  const handleInstallationClick = async () => {
    try {
      const { data: sites } = await supabase
        .from('sites')
        .select('id')
        .eq('user_id', userProfile?.user_id)
        .limit(1);
      
      if (sites && sites.length > 0) {
        window.location.href = `/sites/${sites[0].id}/config`;
      } else {
        window.location.href = '/sites';
      }
    } catch (error) {
      window.location.href = '/sites';
    }
  };

  return (
    <nav className="bg-primary shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <FlutLogo variant="white" size="md" />
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex space-x-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link key={item.path} to={item.path}>
                  <Button 
                    variant="ghost"
                    className={`flex items-center gap-2 text-white hover:text-primary hover:bg-white/90 transition-all duration-200 ${
                      isActive ? "bg-accent text-primary font-medium shadow-md" : ""
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden xl:block">{item.label}</span>
                  </Button>
                </Link>
              );
            })}

            {/* Installation button for clients */}
            {userProfile?.user_type === 'client' && (
              <Button 
                variant="ghost"
                className={`flex items-center gap-2 text-white hover:text-primary hover:bg-white/90 transition-all duration-200 ${
                  location.pathname.includes("/config") ? "bg-accent text-primary font-medium shadow-md" : ""
                }`}
                onClick={handleInstallationClick}
              >
                <Settings className="h-4 w-4" />
                <span className="hidden xl:block">Instalação</span>
              </Button>
            )}
          </div>

          {/* Desktop Logout Button */}
          <div className="hidden lg:block">
            <Button 
              variant="ghost" 
              onClick={signOut}
              className="flex items-center gap-2 text-white hover:text-red-400 hover:bg-white/10 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-primary-dark/20 rounded-lg mt-2 mb-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link 
                    key={item.path} 
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button 
                      variant="ghost"
                      className={`w-full justify-start gap-3 text-white hover:text-primary hover:bg-white/90 transition-all duration-200 ${
                        isActive ? "bg-accent text-primary font-medium" : ""
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}

              {/* Mobile Installation button for clients */}
              {userProfile?.user_type === 'client' && (
                <Button 
                  variant="ghost"
                  className={`w-full justify-start gap-3 text-white hover:text-primary hover:bg-white/90 transition-all duration-200 ${
                    location.pathname.includes("/config") ? "bg-accent text-primary font-medium" : ""
                  }`}
                  onClick={() => {
                    handleInstallationClick();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Settings className="h-5 w-5" />
                  Instalação
                </Button>
              )}

              {/* Mobile Logout */}
              <Button 
                variant="ghost" 
                onClick={() => {
                  signOut();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full justify-start gap-3 text-white hover:text-red-400 hover:bg-white/10 transition-all duration-200 border-t border-white/10 mt-3 pt-3"
              >
                <LogOut className="h-5 w-5" />
                Sair
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default AdminNavigation;