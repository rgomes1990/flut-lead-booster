
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user && userProfile) {
        console.log('User authenticated. Type:', userProfile.user_type);
        
        // Sempre redireciona para dashboard independente do tipo de usuário
        navigate("/dashboard", { replace: true });
      } else if (!user) {
        console.log('User not authenticated, redirecting to auth');
        navigate("/auth", { replace: true });
      }
    }
  }, [user, userProfile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <img 
            src="/lovable-uploads/55c0da45-185f-4e1a-9bb7-be853452bb0f.png"
            alt="FLUT"
            className="h-16 w-auto object-contain mx-auto mb-4"
          />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Exibe uma tela de carregamento enquanto processa o redirecionamento
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <img 
          src="/lovable-uploads/55c0da45-185f-4e1a-9bb7-be853452bb0f.png"
          alt="FLUT"
          className="h-16 w-auto object-contain mx-auto mb-4"
        />
        <p className="text-muted-foreground">Redirecionando...</p>
      </div>
    </div>
  );
};

export default Index;
