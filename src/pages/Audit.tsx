
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminNavigation from "@/components/AdminNavigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileText, Filter, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values: any;
  new_values: any;
  user_email: string;
  created_at: string;
}

const Audit = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [tableFilter, setTableFilter] = useState<string>("");
  const [operationFilter, setOperationFilter] = useState<string>("");
  const [userFilter, setUserFilter] = useState<string>("");
  const { toast } = useToast();

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      // Use rpc to query audit_logs since it might not be in the generated types yet
      const { data, error } = await supabase.rpc('get_audit_logs');
      
      if (error) {
        // Fallback to direct query if RPC doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles' as any) // Using 'as any' to bypass type checking temporarily
          .select('*')
          .limit(0); // This will fail but let us try the audit_logs table directly
        
        if (fallbackError) {
          // Try direct access to audit_logs table using PostgrestQueryBuilder
          const response = await supabase
            .from('audit_logs' as any)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(500);
          
          if (response.error) throw response.error;
          setAuditLogs(response.data || []);
          setFilteredLogs(response.data || []);
        }
      } else {
        setAuditLogs(data || []);
        setFilteredLogs(data || []);
      }
    } catch (error: any) {
      console.error("Erro ao carregar logs de auditoria:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar logs de auditoria: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  useEffect(() => {
    let filtered = auditLogs;

    if (tableFilter) {
      filtered = filtered.filter(log => 
        log.table_name.toLowerCase().includes(tableFilter.toLowerCase())
      );
    }

    if (operationFilter) {
      filtered = filtered.filter(log => log.operation === operationFilter);
    }

    if (userFilter) {
      filtered = filtered.filter(log => 
        log.user_email?.toLowerCase().includes(userFilter.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  }, [auditLogs, tableFilter, operationFilter, userFilter]);

  const getOperationBadge = (operation: string) => {
    const variants = {
      INSERT: "default",
      UPDATE: "secondary", 
      DELETE: "destructive"
    } as const;

    const labels = {
      INSERT: "Criação",
      UPDATE: "Alteração",
      DELETE: "Exclusão"
    };

    return (
      <Badge variant={variants[operation as keyof typeof variants] || "default"}>
        {labels[operation as keyof typeof labels] || operation}
      </Badge>
    );
  };

  const getTableDisplayName = (tableName: string) => {
    const names = {
      profiles: "Perfis",
      clients: "Clientes", 
      leads: "Leads",
      sites: "Sites",
      site_configs: "Configurações de Site",
      subscription_plans: "Planos de Assinatura"
    };

    return names[tableName as keyof typeof names] || tableName;
  };

  const clearFilters = () => {
    setTableFilter("");
    setOperationFilter("");
    setUserFilter("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Carregando logs de auditoria...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Auditoria do Sistema</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            <CardDescription>
              Filtre os logs de auditoria por tabela, operação ou usuário
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="table-filter">Tabela</Label>
                <Input
                  id="table-filter"
                  placeholder="Filtrar por tabela..."
                  value={tableFilter}
                  onChange={(e) => setTableFilter(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="operation-filter">Operação</Label>
                <Select value={operationFilter} onValueChange={setOperationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as operações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as operações</SelectItem>
                    <SelectItem value="INSERT">Criação</SelectItem>
                    <SelectItem value="UPDATE">Alteração</SelectItem>
                    <SelectItem value="DELETE">Exclusão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="user-filter">Usuário</Label>
                <Input
                  id="user-filter"
                  placeholder="Filtrar por usuário..."
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={clearFilters} variant="outline" className="w-full">
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Logs de Auditoria ({filteredLogs.length})</span>
              <Button onClick={loadAuditLogs} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </CardTitle>
            <CardDescription>
              Histórico de todas as alterações realizadas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Tabela</TableHead>
                    <TableHead>Operação</TableHead>
                    <TableHead>Registro ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum log de auditoria encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {log.user_email || "Sistema"}
                        </TableCell>
                        <TableCell>
                          {getTableDisplayName(log.table_name)}
                        </TableCell>
                        <TableCell>
                          {getOperationBadge(log.operation)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.record_id ? log.record_id.substring(0, 8) + "..." : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Audit;
