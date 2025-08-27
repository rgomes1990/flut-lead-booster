import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ImportResult {
  total: number;
  success: number;
  errors: string[];
}

const CsvLeadImporter = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResult(null);
    } else {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo CSV válido.",
        variant: "destructive",
      });
    }
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }

    return data;
  };

  const importLeads = async () => {
    if (!file) return;

    setIsImporting(true);
    setProgress(0);
    
    try {
      const csvText = await file.text();
      const csvData = parseCSV(csvText);
      
      if (csvData.length === 0) {
        throw new Error("O arquivo CSV está vazio ou mal formatado");
      }

      const importResult: ImportResult = {
        total: csvData.length,
        success: 0,
        errors: []
      };

      // Verificar se as colunas necessárias existem
      const requiredFields = ['email', 'name', 'phone'];
      const availableFields = Object.keys(csvData[0]);
      const missingFields = requiredFields.filter(field => 
        !availableFields.some(available => available.toLowerCase().includes(field.toLowerCase()))
      );

      if (missingFields.length > 0) {
        throw new Error(`Campos obrigatórios não encontrados: ${missingFields.join(', ')}`);
      }

      // Processar cada linha do CSV
      for (let i = 0; i < csvData.length; i++) {
        const lead = csvData[i];
        setProgress(((i + 1) / csvData.length) * 100);

        try {
          // Encontrar o campo de email do usuário (pode ter nomes diferentes)
          const userEmailField = availableFields.find(field => 
            field.toLowerCase().includes('email') && 
            field.toLowerCase() !== 'email' // Assumindo que 'email' é do lead
          ) || 'Email'; // Campo padrão se não encontrar

          const userEmail = lead[userEmailField];
          const leadName = lead.name || lead.Name || lead.nome || lead.Nome;
          const leadEmail = lead.email || lead.Email;
          const leadPhone = lead.phone || lead.Phone || lead.telefone || lead.Telefone;
          const leadMessage = lead.message || lead.Message || lead.mensagem || lead.Mensagem || '';
          const websiteUrl = lead.website_url || lead.Website || lead.site || lead.Site || '';

          if (!userEmail || !leadName || !leadEmail || !leadPhone) {
            importResult.errors.push(`Linha ${i + 1}: Campos obrigatórios faltando`);
            continue;
          }

          // Buscar o usuário pelo email
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('email', userEmail)
            .single();

          if (profileError || !profile) {
            importResult.errors.push(`Linha ${i + 1}: Usuário não encontrado para o email ${userEmail}`);
            continue;
          }

          // Buscar o cliente associado ao usuário
          const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('id')
            .eq('user_id', profile.user_id)
            .single();

          if (clientError || !client) {
            importResult.errors.push(`Linha ${i + 1}: Cliente não encontrado para o usuário ${userEmail}`);
            continue;
          }

          // Inserir o lead
          const { error: leadError } = await supabase
            .from('leads')
            .insert({
              client_id: client.id,
              name: leadName,
              email: leadEmail,
              phone: leadPhone,
              message: leadMessage,
              website_url: websiteUrl,
              status: 'new',
              origin: 'Importação CSV',
              campaign: 'Importação Manual'
            });

          if (leadError) {
            importResult.errors.push(`Linha ${i + 1}: Erro ao inserir lead - ${leadError.message}`);
          } else {
            importResult.success++;
          }

        } catch (error: any) {
          importResult.errors.push(`Linha ${i + 1}: ${error.message}`);
        }
      }

      setResult(importResult);
      
      toast({
        title: "Importação concluída",
        description: `${importResult.success} de ${importResult.total} leads importados com sucesso.`,
        variant: importResult.errors.length > 0 ? "default" : "default",
      });

    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Importar Leads via CSV
        </CardTitle>
        <CardDescription>
          Importe leads em lote associando automaticamente aos usuários pelo email.
          O CSV deve conter as colunas: Email (do usuário), name, email (do lead), phone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="csv-file">Arquivo CSV</Label>
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={isImporting}
          />
        </div>

        {file && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            {file.name} ({Math.round(file.size / 1024)} KB)
          </div>
        )}

        {isImporting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Importando leads...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">Resultado da Importação</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total de registros:</span>
                <span className="ml-2 font-medium">{result.total}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Importados com sucesso:</span>
                <span className="ml-2 font-medium text-green-600">{result.success}</span>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">Erros encontrados:</span>
                </div>
                <div className="max-h-32 overflow-y-auto bg-muted p-3 rounded text-xs">
                  {result.errors.map((error, index) => (
                    <div key={index} className="text-red-600">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <Button 
          onClick={importLeads} 
          disabled={!file || isImporting}
          className="w-full"
        >
          {isImporting ? "Importando..." : "Importar Leads"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CsvLeadImporter;