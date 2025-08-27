import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Copy, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ImportResult {
  total: number;
  success: number;
  errors: string[];
}

const CsvPasteImporter = () => {
  const [csvData, setCsvData] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const parseCSVData = (data: string): any[] => {
    const lines = data.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    // Parse CSV with better handling of quoted values and commas inside quotes
    const parseCSVLine = (line: string): string[] => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"' && !inQuotes) {
          inQuotes = true;
        } else if (char === '"' && inQuotes) {
          if (nextChar === '"') {
            current += '"';
            i++; // Skip next quote
          } else {
            inQuotes = false;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]);
    const parsedData = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length > 0) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        parsedData.push(row);
      }
    }

    return parsedData;
  };

  const importLeads = async () => {
    if (!csvData.trim()) {
      toast({
        title: "Dados não encontrados",
        description: "Por favor, cole os dados CSV na área de texto.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setProgress(0);
    
    try {
      const parsedData = parseCSVData(csvData);
      
      if (parsedData.length === 0) {
        throw new Error("Os dados CSV estão vazios ou mal formatados");
      }

      const importResult: ImportResult = {
        total: parsedData.length,
        success: 0,
        errors: []
      };

      // Verificar se as colunas necessárias existem
      const requiredFields = ['Email-cliente', 'name', 'email', 'cellphone'];
      const availableFields = Object.keys(parsedData[0]);
      const missingFields = requiredFields.filter(field => 
        !availableFields.includes(field)
      );

      if (missingFields.length > 0) {
        throw new Error(`Campos obrigatórios não encontrados: ${missingFields.join(', ')}`);
      }

      // Processar cada linha dos dados
      for (let i = 0; i < parsedData.length; i++) {
        const lead = parsedData[i];
        setProgress(((i + 1) / parsedData.length) * 100);

        try {
          // Mapear campos dos dados para campos do sistema
          const userEmail = lead['Email-cliente'];
          const leadName = lead['name'];
          const leadEmail = lead['email'];
          const leadPhone = lead['cellphone'];
          const leadMessage = lead['message'] || '';
          const websiteUrl = lead['url_pesquisa'] || '';
          const leadOrigin = lead['origem'] || 'Importação CSV';
          const leadCreatedAt = lead['created_at'] || new Date().toISOString();

          if (!userEmail || !leadName || !leadEmail || !leadPhone) {
            importResult.errors.push(`Linha ${i + 1}: Campos obrigatórios faltando (Email-cliente, name, email, cellphone)`);
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
              origin: leadOrigin,
              campaign: 'Importação Manual',
              created_at: leadCreatedAt
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
          <Copy className="h-5 w-5" />
          Importar Leads via Cópia e Cola
        </CardTitle>
        <CardDescription>
          Cole os dados CSV diretamente aqui. Use vírgulas para separar as colunas.
          Colunas obrigatórias: Email-cliente, name, email, cellphone, message, origem, url_pesquisa, created_at.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="csv-data">Dados CSV</Label>
          <Textarea
            id="csv-data"
            placeholder="Cole aqui os dados CSV com cabeçalhos...
Exemplo:
Email-cliente,name,email,cellphone,message,origem,url_pesquisa,created_at
usuario@email.com,João Silva,joao@email.com,11999999999,Olá,Facebook,https://site.com,2024-01-15T10:00:00Z"
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            disabled={isImporting}
            className="min-h-32"
          />
        </div>

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
          disabled={!csvData.trim() || isImporting}
          className="w-full"
        >
          {isImporting ? "Importando..." : "Importar Leads"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CsvPasteImporter;