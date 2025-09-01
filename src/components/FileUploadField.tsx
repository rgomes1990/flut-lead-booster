
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, FileImage } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  multiple?: boolean;
  value?: string | string[];
  onChange: (value: string | string[]) => void;
}

const FileUploadField = ({
  id,
  label,
  placeholder,
  required = false,
  multiple = false,
  value,
  onChange
}: FileUploadFieldProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Simulate file upload - In a real app, you'd upload to Supabase Storage
        // For now, we'll create a mock URL
        const mockUrl = `uploaded/${file.name}-${Date.now()}`;
        uploadedUrls.push(mockUrl);
      }

      if (multiple) {
        const currentValues = Array.isArray(value) ? value : (value ? [value] : []);
        onChange([...currentValues, ...uploadedUrls]);
      } else {
        onChange(uploadedUrls[0]);
      }

      toast({
        title: "Upload concluído",
        description: `${uploadedUrls.length} arquivo(s) enviado(s) com sucesso.`,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer o upload do arquivo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (indexOrUrl: number | string) => {
    if (multiple && Array.isArray(value)) {
      const newValues = value.filter((_, index) => index !== indexOrUrl);
      onChange(newValues);
    } else {
      onChange('');
    }
  };

  const renderFilePreview = (fileUrl: string, index?: number) => (
    <div key={index || fileUrl} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
      <FileImage className="h-4 w-4 text-gray-500" />
      <span className="text-sm text-gray-700 flex-1 truncate">
        {fileUrl.split('/').pop()}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => removeFile(index !== undefined ? index : fileUrl)}
        className="h-6 w-6 p-0"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input
            id={id}
            type="file"
            multiple={multiple}
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById(id)?.click()}
            disabled={uploading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Enviando..." : placeholder || "Selecionar arquivo(s)"}
          </Button>
        </div>

        {/* Preview uploaded files */}
        <div className="space-y-2">
          {multiple && Array.isArray(value) ? (
            value.map((fileUrl, index) => renderFilePreview(fileUrl, index))
          ) : (
            value && typeof value === 'string' && renderFilePreview(value)
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploadField;
