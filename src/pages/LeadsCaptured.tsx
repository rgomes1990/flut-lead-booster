import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import AdminNavigation from "@/components/AdminNavigation";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  website_url: string;
  status: string;
  created_at: string;
  client: {
    user_id: string;
    website_url: string;
  };
  profile: {
    name: string;
    email: string;
  };
}

const LeadsCaptured = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { userProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (userProfile?.user_type === "admin") {
      loadLeads();
    }
  }, [userProfile]);

  useEffect(() => {
    const filtered = leads.filter(lead =>
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      lead.website_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.profile?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLeads(filtered);
  }, [searchTerm, leads]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      
      const { data: leadsData, error } = await supabase
        .from("leads")
        .select(`
          *,
          client:clients!inner(
            user_id,
            website_url,
            profile:profiles!inner(
              name,
              email
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transformar os dados para o formato esperado
      const transformedLeads = leadsData?.map((lead: any) => ({
        ...lead,
        client: {
          user_id: lead.client.user_id,
          website_url: lead.client.website_url,
        },
        profile: {
          name: lead.client.profile.name,
          email: lead.client.profile.email,
        }
      })) || [];

      setLeads(transformedLeads);
    } catch (error) {
      console.error("Erro ao carregar leads:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar leads capturados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["ID", "Nome", "E-mail", "WhatsApp", "Site", "Usuário", "Mensagem", "Status", "Data"];
    const csvContent = [
      headers.join(","),
      ...filteredLeads.map(lead =>
        [
          lead.id,
          `"${lead.name}"`,
          lead.email,
          lead.phone,
          lead.website_url,
          `"${lead.profile?.name || 'N/A'}"`,
          `"${lead.message || 'Não especificada'}"`,
          lead.status,
          formatDate(lead.created_at)
        ].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_capturados_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "new":
        return "default";
      case "contacted":
        return "secondary";
      case "qualified":
        return "outline";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "new":
        return "Novo";
      case "contacted":
        return "Contatado";
      case "qualified":
        return "Qualificado";
      default:
        return status;
    }
  };

  if (userProfile?.user_type !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation />
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-destructive">Acesso Negado</h2>
              <p className="text-muted-foreground mt-2">
                Você não tem permissão para acessar esta página.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">📋 Lista de Contatos Capturados</CardTitle>
                <CardDescription className="text-base mt-2">
                  O Flut captura todos os dados como (nome, email, telefone) das pessoas que entraram em contato com você através do Flut, exporte os dados em formato Excel.
                </CardDescription>
                <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    💡 <strong>Dica:</strong> Você pode impactar ainda mais seus clientes, utilize esses dados para fazer <strong>campanhas de email marketing</strong>.
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Pesquisar leads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-80"
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  {filteredLeads.length} resultados por página
                </span>
              </div>
              
              <Button onClick={exportToCSV} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Excel
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Carregando leads...</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Site</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Mensagem</TableHead>
                      <TableHead>Página</TableHead>
                      <TableHead>Origem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead, index) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                              Atendimento
                            </Badge>
                            <span className="text-sm text-muted-foreground">{index + 1}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium">
                                {lead.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium">{lead.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{lead.website_url}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{lead.profile?.name || 'N/A'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{lead.phone}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{lead.email}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{lead.message || 'Não especificada'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">Não especificada</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">Meta</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {filteredLeads.length === 0 && !loading && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum lead encontrado.</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeadsCaptured;