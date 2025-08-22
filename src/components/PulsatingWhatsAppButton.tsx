
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PulsatingWhatsAppButtonProps {
  onClick: () => void;
  className?: string;
}

const PulsatingWhatsAppButton = ({ onClick, className = "" }: PulsatingWhatsAppButtonProps) => {
  return (
    <div className="relative">
      {/* Múltiplas ondas de pulso mais intensas e visíveis */}
      <div className="absolute -inset-8 bg-green-500 rounded-full opacity-20 animate-ping" style={{ animationDuration: '2s', animationDelay: '0s' }}></div>
      <div className="absolute -inset-6 bg-green-400 rounded-full opacity-30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }}></div>
      <div className="absolute -inset-4 bg-green-600 rounded-full opacity-40 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.6s' }}></div>
      <div className="absolute -inset-2 bg-green-300 rounded-full opacity-50 animate-pulse" style={{ animationDuration: '1.5s' }}></div>
      
      {/* Anel rotativo mais visível */}
      <div className="absolute -inset-5 rounded-full border-4 border-green-400 opacity-70 animate-spin" style={{ animationDuration: '4s' }}></div>
      <div className="absolute -inset-3 rounded-full border-2 border-green-300 opacity-60 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }}></div>
      
      <Button 
        onClick={onClick}
        className={`
          relative z-10 h-16 w-16 rounded-full shadow-2xl hover:shadow-3xl 
          transition-all duration-300 bg-green-500 hover:bg-green-600 
          text-white border-4 border-white hover:scale-110 transform
          animate-bounce hover:animate-none
          ${className}
        `}
        size="lg"
      >
        <MessageSquare className="h-8 w-8" />
      </Button>
      
      {/* Efeito de brilho pulsante mais intenso */}
      <div 
        className="absolute inset-0 rounded-full bg-gradient-to-r from-green-300 via-green-500 to-green-700 opacity-20 animate-pulse pointer-events-none" 
        style={{ animationDuration: '1s' }}
      ></div>
      
      {/* Efeito de destaque adicional */}
      <div 
        className="absolute -inset-1 rounded-full bg-green-400 opacity-30 animate-ping pointer-events-none" 
        style={{ animationDuration: '3s' }}
      ></div>
      
      {/* Partículas de brilho */}
      <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full opacity-80 animate-ping" style={{ animationDelay: '0.5s', animationDuration: '2s' }}></div>
      <div className="absolute bottom-3 left-3 w-1 h-1 bg-green-200 rounded-full opacity-70 animate-ping" style={{ animationDelay: '1s', animationDuration: '2.5s' }}></div>
      <div className="absolute top-4 left-2 w-1.5 h-1.5 bg-green-100 rounded-full opacity-60 animate-ping" style={{ animationDelay: '1.5s', animationDuration: '3s' }}></div>
    </div>
  );
};

export default PulsatingWhatsAppButton;
