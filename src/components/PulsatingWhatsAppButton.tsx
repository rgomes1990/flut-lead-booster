
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PulsatingWhatsAppButtonProps {
  onClick: () => void;
  className?: string;
}

const PulsatingWhatsAppButton = ({ onClick, className = "" }: PulsatingWhatsAppButtonProps) => {
  return (
    <div className="relative">
      {/* Animação de pulso mais forte e destacada */}
      <div className="absolute -inset-6 bg-green-500 rounded-full opacity-30 animate-ping animation-delay-0"></div>
      <div className="absolute -inset-4 bg-green-400 rounded-full opacity-40 animate-ping animation-delay-200"></div>
      <div className="absolute -inset-2 bg-green-600 rounded-full opacity-50 animate-pulse"></div>
      
      <Button 
        onClick={onClick}
        className={`
          relative z-10 h-14 w-14 rounded-full shadow-2xl hover:shadow-3xl 
          transition-all duration-300 bg-green-500 hover:bg-green-600 
          text-white border-4 border-white hover:scale-125 transform
          animate-bounce hover:animate-none
          ${className}
        `}
        size="lg"
      >
        <MessageSquare className="h-7 w-7" />
      </Button>
      
      {/* Efeito de brilho adicional mais intenso */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-300 via-green-500 to-green-700 opacity-0 hover:opacity-30 transition-opacity duration-300 animate-pulse"></div>
      
      {/* Anel de destaque rotativo */}
      <div className="absolute -inset-3 rounded-full border-2 border-green-400 opacity-60 animate-spin" style={{ animationDuration: '3s' }}></div>
    </div>
  );
};

export default PulsatingWhatsAppButton;
