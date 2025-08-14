import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Users, Mail, Phone, ExternalLink, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { user, userProfile, signOut } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [clientData, setClientData] = useState<any>(null);
  const [stats, setStats] = useState({ totalLeads: 0, newLeads: 0 });
  const { toast } = useToast();

  useEffect(() => {
    if (user && userProfile) {
      loadData();
    }
  }, [user, userProfile]);

  const loadData = async () => {
    try {
      if (userProfile?.user_type === 'admin') {
        // Admin: ver todos os leads
        const { data: allLeads } = await supabase
          .from("leads")
          .select(`
            *,
            clients(company_name, script_id)
          `)
          .order("created_at", { ascending: false });
        
        setLeads(allLeads || []);
        setStats({
          totalLeads: allLeads?.length || 0,
          newLeads: allLeads?.filter(lead => lead.status === 'new').length || 0
        });
      } else {
        // Cliente: ver apenas seus leads
        const { data: client } = await supabase
          .from("clients")
          .select("*")
          .eq("user_id", user?.id)
          .single();
        
        setClientData(client);

        if (client) {
          const { data: clientLeads } = await supabase
            .from("leads")
            .select("*")
            .eq("client_id", client.id)
            .order("created_at", { ascending: false });
          
          setLeads(clientLeads || []);
          setStats({
            totalLeads: clientLeads?.length || 0,
            newLeads: clientLeads?.filter(lead => lead.status === 'new').length || 0
          });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const exportToCSV = () => {
    if (leads.length === 0) {
      toast({
        title: "Nenhum lead para exportar",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Nome", "Email", "Telefone", "Mensagem", "Status", "Data"];
    const csvContent = [
      headers.join(","),
      ...leads.map(lead => [
        lead.name,
        lead.email,
        lead.phone,
        lead.message || "",
        lead.status,
        new Date(lead.created_at).toLocaleDateString()
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Arquivo CSV exportado com sucesso!",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">FLUT Dashboard</h1>
            <p className="text-muted-foreground">
              {userProfile?.user_type === 'admin' ? 'Painel Administrativo' : 'Painel do Cliente'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => window.open('/demo', '_blank')} variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver Demo
            </Button>
            <Button onClick={signOut} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLeads}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Novos</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.newLeads}</div>
            </CardContent>
          </Card>

          {clientData && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Seu ID de Script</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clientData.script_id}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Use este ID no parâmetro 'x' do script
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Script Info para clientes */}
        {clientData && (
          <Card>
            <CardHeader>
              <CardTitle>Código do Script</CardTitle>
              <CardDescription>
                Copie e cole este código no seu site para ativar o botão de WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md">
                <code className="text-sm">
                  {`<!-- inicio Flut -->\n<script src='https://qwisnnipdjqmxpgfvhij.supabase.co/functions/v1/show-modal?x=${clientData.script_id}&z=https://seusite.com.br&o='></script>\n<!-- fim Flut -->`}
                </code>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leads Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Leads Recebidos</CardTitle>
              <CardDescription>
                Lista de todos os leads captados
              </CardDescription>
            </div>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  {userProfile?.user_type === 'admin' && <TableHead>Cliente</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell>{lead.phone}</TableCell>
                    <TableCell className="max-w-xs truncate">{lead.message || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={lead.status === 'new' ? 'default' : 'secondary'}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(lead.created_at)}</TableCell>
                    {userProfile?.user_type === 'admin' && (
                      <TableCell>{lead.clients?.company_name}</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {leads.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum lead encontrado
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;