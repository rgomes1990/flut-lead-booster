
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut, BarChart3, Users, Globe, FileText, CreditCard, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { InternalLogo } from "@/components/InternalLogo";

const AdminNavigation = () => {
  const { user, userProfile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
    ...(userProfile?.user_type === 'admin' ? [
      { path: "/admin", label: "Usuários", icon: Users },
      { path: "/audit", label: "Auditoria", icon: Search },
    ] : []),
    { path: "/sites", label: "Sites", icon: Globe },
    { path: "/leads-captured", label: "Leads Capturados", icon: FileText },
    { path: "/plans", label: "Planos", icon: CreditCard },
  ];

  const NavigationContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-4 border-b">
        <InternalLogo size="sm" />
        <span className="font-semibold text-lg">FLUT</span>
      </div>
      
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3 text-sm">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium">{user?.email}</div>
            <div className="text-xs text-muted-foreground">
              {userProfile?.user_type === 'admin' ? 'Administrador' : 'Cliente'}
            </div>
          </div>
        </div>
        <Button
          onClick={handleSignOut}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-card border-r shadow-sm z-40">
        <NavigationContent />
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-card border-b shadow-sm z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <InternalLogo size="sm" />
            <span className="font-semibold text-lg">FLUT</span>
          </div>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <NavigationContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Spacer for fixed navigation */}
      <div className="lg:ml-64 lg:pt-0 pt-16">
        {/* Content goes here */}
      </div>
    </>
  );
};

export default AdminNavigation;
