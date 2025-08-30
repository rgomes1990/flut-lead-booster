import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminNavigation from "@/components/AdminNavigation";
import LeadsFilters from "@/components/LeadsFilters";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  website_url: string;
  created_at: string;
  status: string;
  origin: string;
  campaign: string;
  audience: string;
  ad_content: string;
  clients: {
    id: string;
    profiles: {
      name: string;
    };
  };
}

const LeadsCaptured = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const leadsPerPage = 10;

  useEffect(() => {
    if (userProfile) {
      loadLeads();
    }
  }, [userProfile, currentPage, searchTerm, statusFilter, clientFilter, dateRange]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("leads")
        .select(`
          *,
          clients (
            id,
            profiles (name)
          )
        `, { count: 'exact' });

      if (userProfile?.user_type !== "admin") {
        query = query.in('client_id', 
          await supabase
            .from('clients')
            .select('id')
            .eq('user_id', userProfile?.user_id || '')
            .then(({ data }) => data?.map(c => c.id) || [])
        );
      }

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      if (clientFilter && userProfile?.user_type === "admin") {
        query = query.eq("clients.id", clientFilter);
      }

      if (dateRange.start) {
        query = query.gte("created_at", dateRange.start);
      }

      if (dateRange.end) {
        query = query.lte("created_at", dateRange.end + "T23:59:59");
      }

      const from = (currentPage - 1) * leadsPerPage;
      const to = from + leadsPerPage - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      setLeads(data || []);
      setTotalLeads(count || 0);
      setTotalPages(Math.ceil((count || 0) / leadsPerPage));
      
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
        return "default";
      case "converted":
        return "default";
      default:
        return "secondary";
    }
  };

  const exportToCSV = () => {
    if (leads.length === 0) return;

    const headers = ["Nome", "Email", "Telefone", "Mensagem", "Site", "Status", "Data/Hora", "Cliente"];
    const csvContent = [
      headers.join(","),
      ...leads.map(lead => [
        `"${lead.name}"`,
        `"${lead.email}"`,
        `"${lead.phone}"`,
        `"${lead.message || ''}"`,
        `"${lead.website_url}"`,
        `"${lead.status}"`,
        `"${formatDate(lead.created_at)}"`,
        `"${lead.clients?.profiles?.name || 'N/A'}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  if (!userProfile) {
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
                <CardTitle className="text-2xl font-bold">📧 Leads Capturados</CardTitle>
                <CardDescription className="text-base mt-2">
                  Total de {totalLeads} leads capturados
                </CardDescription>
              </div>
              <Button onClick={exportToCSV} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <LeadsFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              clientFilter={clientFilter}
              onClientChange={setClientFilter}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              userProfile={userProfile}
              onFiltersApply={loadLeads}
            />
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Carregando leads...</p>
              </div>
            ) : (
              <>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Site</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data/Hora</TableHead>
                        {userProfile?.user_type === "admin" && <TableHead>Cliente</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell>
                            <span className="font-medium">{lead.name}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{lead.email}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{lead.phone}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{lead.website_url}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(lead.status)}>
                              {lead.status === "new" ? "Novo" : 
                               lead.status === "contacted" ? "Contatado" :
                               lead.status === "qualified" ? "Qualificado" :
                               lead.status === "converted" ? "Convertido" : lead.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{formatDate(lead.created_at)}</span>
                          </TableCell>
                          {userProfile?.user_type === "admin" && (
                            <TableCell>
                              <span className="text-sm">
                                {lead.clients?.profiles?.name || 'N/A'}
                              </span>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {leads.length === 0 && !loading && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Nenhum lead encontrado.</p>
                    </div>
                  )}
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>

                    {/* Números das páginas */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageClick(page)}
                        className="min-w-[40px]"
                      >
                        {page}
                      </Button>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      Próximo
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeadsCaptured;
