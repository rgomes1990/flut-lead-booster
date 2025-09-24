import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MoneyInputProps {
  id: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
}

const MoneyInput = ({
  id,
  label,
  placeholder,
  required = false,
  value,
  onChange
}: MoneyInputProps) => {
  const formatMoney = (val: string) => {
    // Remove tudo exceto números
    const numbers = val.replace(/[^\d]/g, '');
    
    if (!numbers) return '';
    
    // Converte para centavos
    const amount = parseInt(numbers, 10);
    
    // Formata como moeda
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(amount / 100);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatMoney(rawValue);
    onChange(formattedValue);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
      </Label>
      <Input
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
};

export default MoneyInput;