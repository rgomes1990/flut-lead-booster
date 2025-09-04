import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Search, X, Phone, Send, Trash2, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import AdminNavigation from "@/components/AdminNavigation";
import LeadsFilters from "@/components/LeadsFilters";
import { extractUTMFromUrl, updateLeadWithUTMData } from "@/utils/utmExtractor";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  website_url: string;
  status: string;
  created_at: string;
  campaign: string;
  ad_content: string;
  audience: string;
  origin: string;
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
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reprocessing, setReprocessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const { userProfile } = useAuth();
  const { toast } = useToast();

  // Calculate server-side pagination
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);

  useEffect(() => {
    if (userProfile) {
      loadLeads();
    }
  }, [userProfile, currentPage, itemsPerPage]);

  useEffect(() => {
    // Reset to first page when search changes
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      loadLeads();
    }
  }, [searchTerm]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      console.log("=== loadLeads chamada ===");
      console.log("currentPage:", currentPage, "itemsPerPage:", itemsPerPage, "searchTerm:", searchTerm);
      
      const offset = (currentPage - 1) * itemsPerPage;
      console.log("offset calculado:", offset);
      let query = supabase.from("leads").select("*", { count: 'exact' });
      
      // Build search filters
      if (searchTerm.trim()) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,website_url.ilike.%${searchTerm}%`);
      }
      
      // Filter by client if user is not admin
      if (userProfile?.user_type === 'client') {
        // First, get the client ID
        const { data: clientData } = await supabase
          .from("clients")
          .select("id")
          .eq("user_id", userProfile.user_id)
          .single();

        if (clientData) {
          query = query.eq('client_id', clientData.id);
        }
      }
      
      // Apply pagination and ordering
      const { data: leadsData, error, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + itemsPerPage - 1);

      if (error) throw error;

      // Set total count for pagination
      console.log("Count retornado:", count, "Leads data length:", leadsData?.length);
      setTotalCount(count || 0);
      console.log("totalCount definido para:", count || 0);

      if (leadsData && leadsData.length > 0) {
        // Get client and profile information for the current page only
        const clientIds = [...new Set(leadsData.map(lead => lead.client_id))];
        const { data: clientsData, error: clientsError } = await supabase
          .from("clients")
          .select("id, user_id, website_url")
          .in("id", clientIds);

        if (clientsError) throw clientsError;

        // Get user profiles
        const userIds = [...new Set(clientsData?.map(client => client.user_id) || [])];
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, name, email")
          .in("user_id", userIds);

        if (profilesError) throw profilesError;

        // Transform and combine data
        const transformedLeads = leadsData.map((lead: any) => {
          const client = clientsData?.find(c => c.id === lead.client_id);
          const profile = profilesData?.find(p => p.user_id === client?.user_id);
          
          const baseData = {
            ...lead,
            client: {
              user_id: client?.user_id,
              website_url: client?.website_url,
            },
            profile: {
              name: profile?.name || 'N/A',
              email: profile?.email || 'N/A',
            }
          };

          return updateLeadWithUTMData(baseData);
        });

        setLeads(transformedLeads);
        setFilteredLeads(transformedLeads);
      } else {
        setLeads([]);
        setFilteredLeads([]);
      }
      
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

  const reprocessAllLeads = async () => {
    try {
      setReprocessing(true);
      
      // Chamar função do banco para reprocessar todos os leads
      const { data, error } = await supabase.rpc('reprocess_leads_utm_data');
      
      if (error) {
        throw error;
      }
      
      const result = data[0];
      
      toast({
        title: "Reprocessamento concluído!",
        description: `${result.processed_count} leads processados, ${result.updated_count} leads atualizados com dados UTM`,
      });
      
      // Recarregar leads para mostrar os dados atualizados
      await loadLeads();
      
    } catch (error) {
      console.error("Erro ao reprocessar leads:", error);
      toast({
        title: "Erro",
        description: "Erro ao reprocessar leads. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setReprocessing(false);
    }
  };

  const updateExistingLeadsWithUTM = async (leads: any[]) => {
    try {
      const leadsToUpdate = leads.filter(lead => {
        const utmData = extractUTMFromUrl(lead.website_url);
        // Verificar se há dados UTM e se os campos não estão preenchidos
        return (utmData.campaign || utmData.content || utmData.medium) && 
               (!lead.ad_content || !lead.audience || lead.campaign === 'Não informado');
      });

      if (leadsToUpdate.length > 0) {
        console.log(`Atualizando ${leadsToUpdate.length} leads com dados UTM...`);
        
        for (const lead of leadsToUpdate) {
          const utmData = extractUTMFromUrl(lead.website_url);
          
          const updateData: any = {};
          if (utmData.campaign && lead.campaign === 'Não informado') {
            updateData.campaign = utmData.campaign;
          }
          if (utmData.content && !lead.ad_content) {
            updateData.ad_content = utmData.content;
          }
          if (utmData.medium && !lead.audience) {
            updateData.audience = utmData.medium;
          }

          if (Object.keys(updateData).length > 0) {
            await supabase
              .from("leads")
              .update(updateData)
              .eq("id", lead.id);
          }
        }
        
        toast({
          title: "Dados atualizados",
          description: `${leadsToUpdate.length} leads foram atualizados com informações UTM`,
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar leads com UTM:", error);
    }
  };

  const exportToCSV = () => {
    const headers = ["ID", "Nome", "E-mail", "WhatsApp", "Site", "Usuário", "Status", "Data e Hora", "Origem", "Campanha", "Anúncio", "Público"];
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
          lead.status,
          formatDate(lead.created_at),
          `"${lead.origin || 'Não informado'}"`,
          `"${lead.campaign || 'Não informado'}"`,
          `"${lead.ad_content || 'Não informado'}"`,
          `"${lead.audience || 'Não informado'}"`
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

  const extractMainDomain = (url: string) => {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}`;
    } catch {
      return url;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "new":
        return "destructive";
      case "read":
        return "secondary";
      case "contacted":
        return "outline";
      case "qualified":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "new":
        return "Não Lido";
      case "read":
        return "Lido";
      case "contacted":
        return "Contatado";
      case "qualified":
        return "Qualificado";
      default:
        return status;
    }
  };

  const handleFilteredLeads = (filtered: Lead[]) => {
    setFilteredLeads(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleItemsPerPageChange = (value: string) => {
    console.log("Mudando items per page:", value);
    setItemsPerPage(parseInt(value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  // Simple pagination function
  const changePage = (newPage: number) => {
    console.log("Tentando mudar para página:", newPage, "Total páginas:", totalPages);
    if (newPage >= 1 && newPage <= totalPages) {
      console.log("Mudando página para:", newPage);
      setCurrentPage(newPage);
    } else {
      console.log("Página inválida:", newPage);
    }
  };

  const handleViewMessage = async (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
    
    // Marcar o lead como lido se ainda não foi lido
    if (lead.status === 'new') {
      try {
        const { error } = await supabase
          .from("leads")
          .update({ status: 'read' })
          .eq("id", lead.id);

        if (error) throw error;

        // Atualizar o lead na lista local
        setLeads(prev => prev.map(l => 
          l.id === lead.id ? { ...l, status: 'read' } : l
        ));
        
        toast({
          title: "Lead marcado como lido",
          description: "O status do lead foi atualizado",
        });
      } catch (error) {
        console.error("Erro ao marcar lead como lido:", error);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLead(null);
  };

  const handleDeleteClick = (lead: Lead) => {
    setLeadToDelete(lead);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!leadToDelete) return;

    try {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", leadToDelete.id);

      if (error) throw error;

      // Remove o lead da lista local
      setLeads(prev => prev.filter(lead => lead.id !== leadToDelete.id));
      
      toast({
        title: "Sucesso",
        description: "Lead excluído com sucesso",
      });
    } catch (error) {
      console.error("Erro ao excluir lead:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir lead. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setLeadToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setLeadToDelete(null);
  };

  const handleSelectLead = (leadId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedLeads(leads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedLeads.length === 0) {
      toast({
        title: "Nenhum lead selecionado",
        description: "Selecione pelo menos um lead para excluir",
        variant: "destructive",
      });
      return;
    }
    setIsBulkDeleteDialogOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      const { error } = await supabase
        .from("leads")
        .delete()
        .in("id", selectedLeads);

      if (error) throw error;

      // Remove os leads da lista local
      setLeads(prev => prev.filter(lead => !selectedLeads.includes(lead.id)));
      setSelectedLeads([]);
      
      toast({
        title: "Sucesso",
        description: `${selectedLeads.length} lead(s) excluído(s) com sucesso`,
      });
    } catch (error) {
      console.error("Erro ao excluir leads:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir leads. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsBulkDeleteDialogOpen(false);
    }
  };

  const handleBulkDeleteCancel = () => {
    setIsBulkDeleteDialogOpen(false);
  };

  if (!userProfile || (userProfile.user_type !== "admin" && userProfile.user_type !== "client")) {
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
              {userProfile?.user_type === 'admin' && (
                <Button 
                  onClick={reprocessAllLeads}
                  disabled={reprocessing}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <RefreshCw className={`h-4 w-4 ${reprocessing ? 'animate-spin' : ''}`} />
                  {reprocessing ? 'Reprocessando...' : 'Reprocessar Leads'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Componente de Filtros */}
            <LeadsFilters
              leads={leads}
              onFilteredLeads={handleFilteredLeads}
              userType={userProfile.user_type}
            />

            <div className="flex items-center justify-between mb-6 mt-6">
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
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Mostrar:</span>
                  <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">
                    resultados por página
                  </span>
                </div>
                {userProfile?.user_type === 'admin' && selectedLeads.length > 0 && (
                  <Button 
                    onClick={handleBulkDelete} 
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir Selecionados ({selectedLeads.length})
                  </Button>
                )}
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
              <>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {userProfile?.user_type === 'admin' && (
                           <TableHead className="w-12">
                             <Checkbox 
                               checked={selectedLeads.length === leads.length && leads.length > 0}
                               onCheckedChange={handleSelectAll}
                             />
                           </TableHead>
                        )}
                        <TableHead className="w-48">Nome</TableHead>
                        <TableHead>Site</TableHead>
                        {userProfile?.user_type === 'admin' && <TableHead>Usuário</TableHead>}
                        <TableHead>WhatsApp</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Data e Hora</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Campanha</TableHead>
                        <TableHead>Anúncio</TableHead>
                        <TableHead>Público</TableHead>
                        <TableHead className="w-20">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead, index) => (
                        <TableRow key={lead.id}>
                          {userProfile?.user_type === 'admin' && (
                            <TableCell>
                              <Checkbox 
                                checked={selectedLeads.includes(lead.id)}
                                onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                              />
                            </TableCell>
                          )}
                           <TableCell>
                             <div className="space-y-2">
                               <div className="flex items-center gap-2">
                                 <Button 
                                   variant="secondary" 
                                   size="sm"
                                   onClick={() => handleViewMessage(lead)}
                                   className="bg-green-100 text-green-800 border-green-300 hover:bg-green-200 text-xs px-2 py-1 h-6"
                                 >
                                   Ver Mensagem
                                 </Button>
                                 <Badge 
                                   variant={getStatusBadgeVariant(lead.status)}
                                   className={lead.status === 'new' ? 'bg-red-100 text-red-800 border-red-300 animate-pulse' : ''}
                                 >
                                   {getStatusLabel(lead.status)}
                                 </Badge>
                                 <span className="text-sm text-muted-foreground">#{startIndex + index + 1}</span>
                               </div>
                               <div className="flex items-center gap-2">
                                 <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                   lead.status === 'new' ? 'bg-red-100 border-2 border-red-300' : 'bg-muted'
                                 }`}>
                                   <span className="text-xs font-medium">
                                     {lead.name.charAt(0).toUpperCase()}
                                   </span>
                                 </div>
                                 <span className={`font-medium text-sm ${
                                   lead.status === 'new' ? 'font-bold text-red-800' : ''
                                 }`}>
                                   {lead.name}
                                   {lead.status === 'new' && <span className="ml-1 text-red-500">●</span>}
                                 </span>
                               </div>
                             </div>
                           </TableCell>
                           <TableCell>
                             <span className="text-sm">{extractMainDomain(lead.website_url)}</span>
                           </TableCell>
                          {userProfile?.user_type === 'admin' && (
                            <TableCell>
                              <span className="font-medium">{lead.profile?.name || 'N/A'}</span>
                            </TableCell>
                          )}
                          <TableCell>
                            <span className="text-sm">{lead.phone}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{lead.email}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{formatDate(lead.created_at)}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{lead.origin || 'Não informado'}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{lead.campaign || 'Não informado'}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{lead.ad_content || 'Não informado'}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{lead.audience || 'Não informado'}</span>
                          </TableCell>
                          <TableCell>
                            {userProfile?.user_type === 'admin' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteClick(lead)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
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

                {/* Simplified Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {startIndex + 1} até {endIndex} de {totalCount} resultados (Página {currentPage} de {totalPages})
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => changePage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => changePage(pageNum)}
                              className="w-10 h-10"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => changePage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Próximo
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Modal para visualizar detalhes do lead */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md bg-white p-0 overflow-hidden">
            {selectedLead && (
              <>
                {/* Header verde com avatar */}
                <div className="bg-green-500 text-white p-6 text-center relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCloseModal}
                    className="absolute top-2 right-2 text-white hover:bg-white/20 w-8 h-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-white">
                      {selectedLead.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold">{selectedLead.name}</h2>
                  <p className="text-green-100">{selectedLead.email}</p>
                </div>

                {/* Conteúdo do modal */}
                <div className="p-6 space-y-4">
                  <div className="text-center text-sm text-gray-600">
                    recebido em: {formatDate(selectedLead.created_at)}
                  </div>

                  <div>
                    <span className="inline-block bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-sm font-medium">
                      mensagem:
                    </span>
                    <p className="mt-2 text-gray-800">
                      {selectedLead.message || 'Nenhuma mensagem especificada'}
                    </p>
                  </div>

                   <div>
                     <span className="text-xs text-gray-500">🌐 URL de Origem:</span>
                     <p className="text-sm font-medium text-gray-800 break-all">{selectedLead.website_url}</p>
                   </div>

                  {/* Botão de telefone */}
                  <div className="text-center">
                    <Button
                      onClick={() => window.open(`tel:${selectedLead.phone}`, '_self')}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto"
                    >
                      <Phone className="h-4 w-4" />
                      {selectedLead.phone}
                    </Button>
                  </div>

                  {/* Botão de enviar mensagem */}
                  <div className="text-center">
                    <Button
                      onClick={() => window.open(`https://wa.me/${selectedLead.phone.replace(/\D/g, '')}`, '_blank')}
                      className="bg-green-500 hover:bg-green-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Botão fechar */}
                <div className="p-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handleCloseModal}
                    className="w-full"
                  >
                    Fechar
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmação de exclusão */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o lead <strong>{leadToDelete?.name}</strong>? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleDeleteCancel}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog de confirmação de exclusão em massa */}
        <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão em Massa</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir <strong>{selectedLeads.length} lead(s)</strong> selecionado(s)? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleBulkDeleteCancel}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleBulkDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir Todos ({selectedLeads.length})
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default LeadsCaptured;
