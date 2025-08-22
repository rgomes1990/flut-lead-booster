
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PulsatingWhatsAppButtonProps {
  onClick: () => void;
  className?: string;
}

const PulsatingWhatsAppButton = ({ onClick, className = "" }: PulsatingWhatsAppButtonProps) => {
  return (
    <div className="relative">
      {/* Animação de pulso mais forte */}
      <div className="absolute -inset-4 bg-green-500 rounded-full opacity-20 animate-ping"></div>
      <div className="absolute -inset-2 bg-green-500 rounded-full opacity-30 animate-pulse"></div>
      
      <Button 
        onClick={onClick}
        className={`
          relative z-10 h-14 w-14 rounded-full shadow-lg hover:shadow-xl 
          transition-all duration-300 bg-green-500 hover:bg-green-600 
          text-white border-4 border-white hover:scale-110 transform
          ${className}
        `}
        size="lg"
      >
        <MessageSquare className="h-7 w-7" />
      </Button>
      
      {/* Efeito de brilho adicional */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-green-600 opacity-0 hover:opacity-20 transition-opacity duration-300 animate-pulse"></div>
    </div>
  );
};

export default PulsatingWhatsAppButton;
