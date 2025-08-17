import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Users, Mail, Phone, ExternalLink, LogOut, Calendar, TrendingUp, Globe, Clock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import AdminNavigation from "@/components/AdminNavigation";

const Dashboard = () => {
  const { user, userProfile, signOut } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [clientData, setClientData] = useState<any>(null);
  const [stats, setStats] = useState({ 
    totalLeads: 0, 
    newLeads: 0,
    leadsToday: 0,
    leadsThisMonth: 0,
    readLeads: 0,
    unreadLeads: 0,
    dailyAverage: 0
  });
  const [chartData, setChartData] = useState({
    last30Days: [],
    monthlyHistory: [],
    leadsBySite: []
  });
  const { toast } = useToast();

  useEffect(() => {
    if (user && userProfile) {
      loadData();
    }
  }, [user, userProfile]);

  const loadData = async () => {
    try {
      let allLeads: any[] = [];
      
      if (userProfile?.user_type === 'admin') {
        // Admin: ver todos os leads
        const { data } = await supabase
          .from("leads")
          .select(`
            *,
            clients(script_id, website_url)
          `)
          .order("created_at", { ascending: false });
        
        allLeads = data || [];
        setLeads(allLeads);
        
        console.log('Dashboard - Total leads carregados (admin):', allLeads.length);
        console.log('Dashboard - Dados dos leads (admin):', allLeads);
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
          
          allLeads = clientLeads || [];
          setLeads(allLeads);
          
          console.log('Dashboard - Cliente leads carregados:', allLeads.length);
          console.log('Dashboard - Dados dos leads do cliente:', allLeads);
        }
      }

      // Calcular estatísticas
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const leadsToday = allLeads.filter(lead => 
        new Date(lead.created_at) >= today
      ).length;
      
      const leadsThisMonth = allLeads.filter(lead => 
        new Date(lead.created_at) >= thisMonth
      ).length;

      const readLeads = allLeads.filter(lead => lead.status === 'read').length;
      const unreadLeads = allLeads.filter(lead => lead.status === 'new').length;
      
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const currentDay = now.getDate();
      const dailyAverage = currentDay > 0 ? Math.round(leadsThisMonth / currentDay * 10) / 10 : 0;

      setStats({
        totalLeads: allLeads.length,
        newLeads: unreadLeads,
        leadsToday,
        leadsThisMonth,
        readLeads,
        unreadLeads,
        dailyAverage
      });

      console.log('Dashboard - Estatísticas calculadas:', {
        totalLeads: allLeads.length,
        newLeads: unreadLeads,
        leadsToday,
        leadsThisMonth,
        readLeads,
        unreadLeads,
        dailyAverage
      });
      await prepareChartData(allLeads);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const prepareChartData = async (leads: any[]) => {
    // Gráfico 1: Últimos 30 dias
    const last30DaysData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayLeads = leads.filter(lead => {
        const leadDate = new Date(lead.created_at);
        return leadDate >= dayStart && leadDate < dayEnd;
      }).length;
      
      last30DaysData.push({
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        leads: dayLeads
      });
    }

    // Gráfico 2: Histórico por mês (últimos 12 meses)
    const monthlyHistoryData = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthLeads = leads.filter(lead => {
        const leadDate = new Date(lead.created_at);
        return leadDate >= monthStart && leadDate <= monthEnd;
      }).length;
      
      monthlyHistoryData.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        leads: monthLeads
      });
    }

    // Gráfico 3: Leads por site (apenas para admin)
    let leadsBySiteData = [];
    if (userProfile?.user_type === 'admin') {
      const currentMonth = new Date();
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const leadsByClient = leads
        .filter(lead => new Date(lead.created_at) >= monthStart)
        .reduce((acc, lead) => {
          const clientName = lead.clients?.website_url || 'Site não identificado';
          acc[clientName] = (acc[clientName] || 0) + 1;
          return acc;
        }, {});

      leadsBySiteData = Object.entries(leadsByClient).map(([site, count]) => ({
        site,
        leads: count
      }));
    }

    setChartData({
      last30Days: last30DaysData,
      monthlyHistory: monthlyHistoryData,
      leadsBySite: leadsBySiteData
    });
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
    <div className="min-h-screen bg-background">
      {/* Navegação para todos os usuários autenticados */}
      <AdminNavigation />
      
      <div className="p-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Hoje</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.leadsToday}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads do Mês</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.leadsThisMonth}</div>
            </CardContent>
          </Card>

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
              <CardTitle className="text-sm font-medium">Leads Lidos</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.readLeads}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Não Lidos</CardTitle>
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unreadLeads}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média Diária</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.dailyAverage}</div>
              <p className="text-xs text-muted-foreground mt-1">leads/dia</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico 1: Últimos 30 dias */}
          <Card>
            <CardHeader>
              <CardTitle>Leads nos Últimos 30 Dias</CardTitle>
              <CardDescription>Evolução diária de leads recebidos</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  leads: {
                    label: "Leads",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.last30Days}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="leads" fill="var(--color-leads)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Gráfico 2: Histórico mensal */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Leads por Mês</CardTitle>
              <CardDescription>Evolução mensal dos últimos 12 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  leads: {
                    label: "Leads",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.monthlyHistory}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="leads" stroke="var(--color-leads)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico 3: Leads por site (apenas admin) */}
        {userProfile?.user_type === 'admin' && chartData.leadsBySite.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Leads por Site no Mês</CardTitle>
              <CardDescription>Distribuição de leads por site no mês atual</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  leads: {
                    label: "Leads",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.leadsBySite} layout="horizontal">
                    <XAxis type="number" />
                    <YAxis dataKey="site" type="category" width={150} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="leads" fill="var(--color-leads)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

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
                      <TableCell>{lead.clients?.website_url || 'Site não identificado'}</TableCell>
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
    </div>
  );
};

export default Dashboard;