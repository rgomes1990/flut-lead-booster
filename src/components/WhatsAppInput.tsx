import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WhatsAppInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const WhatsAppInput = ({
  id,
  label,
  value,
  onChange,
  placeholder = "+55 (11) 97551-0106"
}: WhatsAppInputProps) => {
  const formatWhatsApp = (inputValue: string) => {
    // Remove tudo que não é número
    const numbers = inputValue.replace(/\D/g, '');
    
    // Se está vazio, retorna +55
    if (numbers.length === 0) {
      return '+55 ';
    }
    
    // Se tem apenas 2 dígitos (55), mantém +55
    if (numbers.length <= 2) {
      return '+55 ';
    }
    
    // Se tem até 4 dígitos (55 + DDD), formata: +55 (XX
    if (numbers.length <= 4) {
      const ddd = numbers.slice(2);
      return `+55 (${ddd}`;
    }
    
    // Se tem até 6 dígitos (55 + DDD completo), formata: +55 (XX) 
    if (numbers.length <= 6) {
      const ddd = numbers.slice(2, 4);
      const firstPart = numbers.slice(4);
      return `+55 (${ddd}) ${firstPart}`;
    }
    
    // Se tem até 11 dígitos (55 + DDD + número), formata: +55 (XX) XXXXX-XXXX
    if (numbers.length <= 11) {
      const ddd = numbers.slice(2, 4);
      const firstPart = numbers.slice(4, 9);
      const secondPart = numbers.slice(9, 13);
      
      if (secondPart) {
        return `+55 (${ddd}) ${firstPart}-${secondPart}`;
      } else {
        return `+55 (${ddd}) ${firstPart}`;
      }
    }
    
    // Se tem mais de 11 dígitos, trunca
    const ddd = numbers.slice(2, 4);
    const firstPart = numbers.slice(4, 9);
    const secondPart = numbers.slice(9, 13);
    return `+55 (${ddd}) ${firstPart}-${secondPart}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Se o usuário tentar apagar o +55, mantém ele
    if (!inputValue.startsWith('+55')) {
      onChange('+55 ');
      return;
    }
    
    const formatted = formatWhatsApp(inputValue);
    onChange(formatted);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Impede que o usuário apague o +55
    if (e.key === 'Backspace' && value.length <= 4) {
      e.preventDefault();
      onChange('+55 ');
    }
  };

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="text"
        value={value || '+55 '}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={19} // +55 (XX) XXXXX-XXXX
      />
    </div>
  );
};

export default WhatsAppInput;