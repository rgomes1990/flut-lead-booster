
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

  // Função para obter leads filtrados baseados nos filtros já aplicados
  const getFilteredLeadsForOptions = () => {
    let filtered = [...leads];

    // Aplicar filtros na ordem: cliente -> data -> origem -> campanha -> anúncio -> público
    if (filters.client && filters.client !== "all" && userType === 'admin') {
      filtered = filtered.filter(lead => 
        lead.client?.user_id === filters.client
      );
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(lead => new Date(lead.created_at) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(lead => new Date(lead.created_at) <= toDate);
    }

    if (filters.origin && filters.origin !== "all") {
      filtered = filtered.filter(lead => 
        lead.origin?.toLowerCase().includes(filters.origin.toLowerCase())
      );
    }

    if (filters.campaign && filters.campaign !== "all") {
      filtered = filtered.filter(lead => 
        lead.campaign?.toLowerCase().includes(filters.campaign.toLowerCase())
      );
    }

    if (filters.adContent && filters.adContent !== "all") {
      filtered = filtered.filter(lead => 
        lead.ad_content?.toLowerCase().includes(filters.adContent.toLowerCase())
      );
    }

    return filtered;
  };

  const applyFilters = () => {
    const filtered = getFilteredLeadsForOptions();
    
    // Aplicar último filtro (público) se estiver selecionado
    const finalFiltered = filters.audience && filters.audience !== "all" 
      ? filtered.filter(lead => 
          lead.audience?.toLowerCase().includes(filters.audience.toLowerCase())
        )
      : filtered;

    setFilteredCount(finalFiltered.length);
    onFilteredLeads(finalFiltered);
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

  // Obter valores únicos baseados nos filtros aplicados até o momento
  const getOptionsForFilter = (filterType: string) => {
    const currentFiltered = getFilteredLeadsForOptions();
    
    switch (filterType) {
      case 'origin':
        return [...new Set(currentFiltered.map(lead => lead.origin).filter(Boolean))];
      case 'campaign':
        // Se origem estiver selecionada, filtrar campanhas baseadas na origem
        const originFiltered = filters.origin && filters.origin !== "all" 
          ? currentFiltered.filter(lead => 
              lead.origin?.toLowerCase().includes(filters.origin.toLowerCase())
            )
          : currentFiltered;
        return [...new Set(originFiltered.map(lead => lead.campaign).filter(Boolean))];
      case 'adContent':
        // Filtrar anúncios baseados em origem e campanha
        let adFiltered = currentFiltered;
        if (filters.origin && filters.origin !== "all") {
          adFiltered = adFiltered.filter(lead => 
            lead.origin?.toLowerCase().includes(filters.origin.toLowerCase())
          );
        }
        if (filters.campaign && filters.campaign !== "all") {
          adFiltered = adFiltered.filter(lead => 
            lead.campaign?.toLowerCase().includes(filters.campaign.toLowerCase())
          );
        }
        return [...new Set(adFiltered.map(lead => lead.ad_content).filter(Boolean))];
      case 'audience':
        // Filtrar público baseado em todos os filtros anteriores
        let audienceFiltered = currentFiltered;
        if (filters.origin && filters.origin !== "all") {
          audienceFiltered = audienceFiltered.filter(lead => 
            lead.origin?.toLowerCase().includes(filters.origin.toLowerCase())
          );
        }
        if (filters.campaign && filters.campaign !== "all") {
          audienceFiltered = audienceFiltered.filter(lead => 
            lead.campaign?.toLowerCase().includes(filters.campaign.toLowerCase())
          );
        }
        if (filters.adContent && filters.adContent !== "all") {
          audienceFiltered = audienceFiltered.filter(lead => 
            lead.ad_content?.toLowerCase().includes(filters.adContent.toLowerCase())
          );
        }
        return [...new Set(audienceFiltered.map(lead => lead.audience).filter(Boolean))];
      default:
        return [];
    }
  };

  // Lidar com mudanças de filtros e limpar filtros dependentes
  const handleFilterChange = (filterType: string, value: string) => {
    const newFilters = { ...filters };
    newFilters[filterType as keyof typeof filters] = value === "all" ? "" : value;

    // Limpar filtros dependentes quando um filtro pai muda
    switch (filterType) {
      case 'client':
        // Limpar todos os outros filtros quando cliente mudar
        newFilters.origin = "";
        newFilters.campaign = "";
        newFilters.adContent = "";
        newFilters.audience = "";
        break;
      case 'origin':
        // Limpar filtros dependentes da origem
        newFilters.campaign = "";
        newFilters.adContent = "";
        newFilters.audience = "";
        break;
      case 'campaign':
        // Limpar filtros dependentes da campanha
        newFilters.adContent = "";
        newFilters.audience = "";
        break;
      case 'adContent':
        // Limpar apenas o público
        newFilters.audience = "";
        break;
    }

    setFilters(newFilters);
  };

  const uniqueOrigins = getOptionsForFilter('origin');
  const uniqueCampaigns = getOptionsForFilter('campaign');
  const uniqueAdContents = getOptionsForFilter('adContent');
  const uniqueAudiences = getOptionsForFilter('audience');

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
              {/* Filtro por Cliente (apenas para admin) */}
              {userType === 'admin' && (
                <div className="space-y-2">
                  <Label htmlFor="client">Cliente</Label>
                  <Select
                    value={filters.client || "all"}
                    onValueChange={(value) => handleFilterChange('client', value)}
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

              {/* Filtros de Data */}
              <div className="space-y-2">
                <Label htmlFor="dateFrom">Data Inicial</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateTo">Data Final</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>

              {/* Filtro por Origem */}
              <div className="space-y-2">
                <Label htmlFor="origin">Origem</Label>
                <Select
                  value={filters.origin || "all"}
                  onValueChange={(value) => handleFilterChange('origin', value)}
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
                  onValueChange={(value) => handleFilterChange('campaign', value)}
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
                  onValueChange={(value) => handleFilterChange('adContent', value)}
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
                  onValueChange={(value) => handleFilterChange('audience', value)}
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
