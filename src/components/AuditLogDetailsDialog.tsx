
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

interface AuditLogDetailsDialogProps {
  log: AuditLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuditLogDetailsDialog: React.FC<AuditLogDetailsDialogProps> = ({ 
  log, 
  open, 
  onOpenChange 
}) => {
  if (!log) return null;

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

  const renderJsonData = (data: any, title: string) => {
    if (!data) return null;

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-sm text-muted-foreground">{title}</h4>
        <div className="bg-muted/50 p-3 rounded-md">
          <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalhes do Log de Auditoria
            {getOperationBadge(log.operation)}
          </DialogTitle>
          <DialogDescription>
            Informações detalhadas sobre as alterações realizadas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Data/Hora</label>
              <p className="text-sm">
                {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Usuário</label>
              <p className="text-sm">{log.user_email || "Sistema"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tabela</label>
              <p className="text-sm">{getTableDisplayName(log.table_name)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">ID do Registro</label>
              <p className="text-sm font-mono">{log.record_id || "N/A"}</p>
            </div>
          </div>

          <Separator />

          {/* Valores antigos e novos */}
          <div className="space-y-4">
            {log.operation === 'UPDATE' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {renderJsonData(log.old_values, "Valores Anteriores")}
                {renderJsonData(log.new_values, "Valores Novos")}
              </div>
            )}

            {log.operation === 'INSERT' && (
              renderJsonData(log.new_values, "Dados Inseridos")
            )}

            {log.operation === 'DELETE' && (
              renderJsonData(log.old_values, "Dados Removidos")
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuditLogDetailsDialog;
