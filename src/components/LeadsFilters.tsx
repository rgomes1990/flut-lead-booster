import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { X, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

interface Client {
  id: string;
  user_id: string;
  profile: {
    name: string;
    email: string;
  };
}

interface LeadsFiltersProps {
  leads: Lead[];
  onFilteredLeads: (filteredLeads: Lead[]) => void;
  userType: string;
}

const LeadsFilters = ({ leads, onFilteredLeads, userType }: LeadsFiltersProps) => {
  const [filters, setFilters] = useState({
    client: "",
    dateFrom: "",
    dateTo: "",
    origin: "",
    campaign: "",
    adContent: "",
    audience: ""
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filteredCount, setFilteredCount] = useState(leads.length);

  // Carregar clientes se for admin
  useEffect(() => {
    if (userType === 'admin') {
      loadClients();
    }
  }, [userType]);

  const loadClients = async () => {
    try {
      console.log("Carregando clientes...");
      
      // Buscar todos os perfis de usuários do tipo cliente
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, name, email, user_type")
        .eq("user_type", "client")
        .order("name");

      if (profilesError) {
        console.error("Erro ao buscar profiles:", profilesError);
        throw profilesError;
      }

      console.log("Profiles encontrados:", profilesData);

      // Buscar dados dos clientes correspondentes
      const userIds = profilesData?.map(profile => profile.user_id) || [];
      
      if (userIds.length > 0) {
        const { data: clientsData, error: clientsError } = await supabase
          .from("clients")
          .select("id, user_id")
          .in("user_id", userIds);

        if (clientsError) {
          console.error("Erro ao buscar clients:", clientsError);
          throw clientsError;
        }

        console.log("Clients encontrados:", clientsData);

        // Combinar os dados
        const transformedClients = profilesData?.map((profile: any) => {
          const client = clientsData?.find(c => c.user_id === profile.user_id);
          return {
            id: client?.id || profile.user_id,
            user_id: profile.user_id,
            profile: {
              name: profile.name || 'Sem nome',
              email: profile.email || 'Sem email'
            }
          };
        }) || [];

        console.log("Clientes transformados:", transformedClients);
        setClients(transformedClients);
      } else {
        console.log("Nenhum perfil de cliente encontrado");
        setClients([]);
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      setClients([]);
    }
  };

  // Aplicar filtros sempre que os filtros ou leads mudarem
  useEffect(() => {
    applyFilters();
  }, [filters, leads]);

  const applyFilters = () => {
    let filtered = [...leads];

    // Filtro por cliente (apenas para admin) - PRIMEIRO
    if (filters.client && filters.client !== "all" && userType === 'admin') {
      filtered = filtered.filter(lead => 
        lead.client?.user_id === filters.client
      );
    }

    // Filtro por data
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(lead => new Date(lead.created_at) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Incluir todo o dia
      filtered = filtered.filter(lead => new Date(lead.created_at) <= toDate);
    }

    // Filtro por origem
    if (filters.origin && filters.origin !== "all") {
      filtered = filtered.filter(lead => 
        lead.origin?.toLowerCase().includes(filters.origin.toLowerCase())
      );
    }

    // Filtro por campanha
    if (filters.campaign && filters.campaign !== "all") {
      filtered = filtered.filter(lead => 
        lead.campaign?.toLowerCase().includes(filters.campaign.toLowerCase())
      );
    }

    // Filtro por anúncio
    if (filters.adContent && filters.adContent !== "all") {
      filtered = filtered.filter(lead => 
        lead.ad_content?.toLowerCase().includes(filters.adContent.toLowerCase())
      );
    }

    // Filtro por público
    if (filters.audience && filters.audience !== "all") {
      filtered = filtered.filter(lead => 
        lead.audience?.toLowerCase().includes(filters.audience.toLowerCase())
      );
    }

    setFilteredCount(filtered.length);
    onFilteredLeads(filtered);
  };

  const clearAllFilters = () => {
    setFilters({
      client: "",
      dateFrom: "",
      dateTo: "",
      origin: "",
      campaign: "",
      adContent: "",
      audience: ""
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== "");

  // Obter leads filtrados pelo cliente selecionado (para filtros subsequentes)
  const getLeadsForCurrentClient = () => {
    if (filters.client && filters.client !== "all" && userType === 'admin') {
      return leads.filter(lead => lead.client?.user_id === filters.client);
    }
    return leads;
  };

  // Obter valores únicos baseados no cliente selecionado
  const currentLeads = getLeadsForCurrentClient();
  const uniqueOrigins = [...new Set(currentLeads.map(lead => lead.origin).filter(Boolean))];
  const uniqueCampaigns = [...new Set(currentLeads.map(lead => lead.campaign).filter(Boolean))];
  const uniqueAdContents = [...new Set(currentLeads.map(lead => lead.ad_content).filter(Boolean))];
  const uniqueAudiences = [...new Set(currentLeads.map(lead => lead.audience).filter(Boolean))];

  // Limpar filtros subsequentes quando cliente mudar
  const handleClientChange = (value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      client: value === "all" ? "" : value,
      // Limpar outros filtros quando cliente mudar
      origin: "",
      campaign: "",
      adContent: "",
      audience: ""
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <span className="bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs">
              Ativo
            </span>
          )}
        </Button>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">
            Total de leads: <span className="text-primary">{filteredCount}</span>
          </span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Limpar Filtros
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Filtro por Cliente (apenas para admin) - PRIMEIRO FILTRO */}
              {userType === 'admin' && (
                <div className="space-y-2">
                  <Label htmlFor="client">Cliente</Label>
                  <Select
                    value={filters.client || "all"}
                    onValueChange={handleClientChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os clientes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os clientes</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.user_id}>
                          {client.profile.name} ({client.profile.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Filtro por Data */}
              <div className="space-y-2">
                <Label htmlFor="dateFrom">Data Inicial</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateTo">Data Final</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>

              {/* Filtro por Origem */}
              <div className="space-y-2">
                <Label htmlFor="origin">Origem</Label>
                <Select
                  value={filters.origin || "all"}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, origin: value === "all" ? "" : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as origens" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as origens</SelectItem>
                    {uniqueOrigins.map((origin) => (
                      <SelectItem key={origin} value={origin}>
                        {origin}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Campanha */}
              <div className="space-y-2">
                <Label htmlFor="campaign">Campanha</Label>
                <Select
                  value={filters.campaign || "all"}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, campaign: value === "all" ? "" : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as campanhas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as campanhas</SelectItem>
                    {uniqueCampaigns.map((campaign) => (
                      <SelectItem key={campaign} value={campaign}>
                        {campaign}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Anúncio */}
              <div className="space-y-2">
                <Label htmlFor="adContent">Anúncio</Label>
                <Select
                  value={filters.adContent || "all"}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, adContent: value === "all" ? "" : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os anúncios" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os anúncios</SelectItem>
                    {uniqueAdContents.map((adContent) => (
                      <SelectItem key={adContent} value={adContent}>
                        {adContent}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Público */}
              <div className="space-y-2">
                <Label htmlFor="audience">Público</Label>
                <Select
                  value={filters.audience || "all"}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, audience: value === "all" ? "" : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os públicos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os públicos</SelectItem>
                    {uniqueAudiences.map((audience) => (
                      <SelectItem key={audience} value={audience}>
                        {audience}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LeadsFilters;
