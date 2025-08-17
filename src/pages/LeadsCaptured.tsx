import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Search, X, Phone, Send, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
  campaign: string;
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Buscar informações dos clientes separadamente
      const clientIds = [...new Set(leadsData?.map(lead => lead.client_id))];
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select(`
          id,
          user_id,
          website_url
        `)
        .in("id", clientIds);

      if (clientsError) throw clientsError;

      // Buscar perfis dos usuários
      const userIds = [...new Set(clientsData?.map(client => client.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      // Combinar os dados
      const transformedLeads = leadsData?.map((lead: any) => {
        const client = clientsData?.find(c => c.id === lead.client_id);
        const profile = profilesData?.find(p => p.user_id === client?.user_id);
        
        return {
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
      }) || [];

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
    const headers = ["ID", "Nome", "E-mail", "WhatsApp", "Site", "Usuário", "Mensagem", "Status", "Data e Hora", "Origem", "Campanha"];
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
          formatDate(lead.created_at),
          `"${lead.origin || 'Não informado'}"`,
          `"${lead.campaign || 'Não informado'}"`
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

  const handleViewMessage = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
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
                      <TableHead className="w-48">Atendimento / Nome</TableHead>
                      <TableHead>Site</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Mensagem</TableHead>
                      <TableHead>Data e Hora</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Campanha</TableHead>
                      <TableHead className="w-20">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead, index) => (
                      <TableRow key={lead.id}>
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
                              <span className="text-sm text-muted-foreground">#{index + 1}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium">
                                  {lead.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="font-medium text-sm">{lead.name}</span>
                            </div>
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
                          <span className="text-sm">{formatDate(lead.created_at)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{lead.origin || 'Não informado'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{lead.campaign || 'Não informado'}</span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(lead)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
                    <a 
                      href={selectedLead.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline text-sm"
                    >
                      Página de Origem
                    </a>
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
      </div>
    </div>
  );
};

export default LeadsCaptured;