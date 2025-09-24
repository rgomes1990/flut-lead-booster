
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface TextareaWithCounterProps {
  id: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

const TextareaWithCounter = ({
  id,
  label,
  placeholder,
  required = false,
  value,
  onChange,
  maxLength = 122
}: TextareaWithCounterProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
      </Label>
      <div className="space-y-1">
        <Textarea
          id={id}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          rows={3}
          className="w-full resize-none"
        />
        <div className="flex justify-end">
          <span className={`text-xs ${
            value.length > maxLength * 0.9 ? 'text-red-500' : 'text-gray-500'
          }`}>
            {value.length}/{maxLength} caracteres
          </span>
        </div>
      </div>
    </div>
  );
};

export default TextareaWithCounter;
