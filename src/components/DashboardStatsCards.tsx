
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Users, TrendingUp, Eye, EyeOff, Calendar, Clock } from "lucide-react";

interface StatsCardsProps {
  stats: {
    totalLeads: number;
    newLeads: number;
    leadsToday: number;
    leadsThisMonth: number;
    readLeads: number;
    unreadLeads: number;
    dailyAverage: number;
  };
  originStats: {
    [key: string]: number;
  };
}

const DashboardStatsCards = ({ stats, originStats }: StatsCardsProps) => {
  return (
    <>
      {/* Stats principais */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <Card className="border-l-4 border-l-accent hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-primary">{stats.leadsToday}</div>
            <p className="text-xs text-muted-foreground mt-1">leads captados</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Este Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-primary">{stats.leadsThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">leads no mês</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-primary">{stats.totalLeads}</div>
            <p className="text-xs text-muted-foreground mt-1">todos os leads</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lidos</CardTitle>
            <Eye className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-primary">{stats.readLeads}</div>
            <p className="text-xs text-muted-foreground mt-1">leads lidos</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Não Lidos</CardTitle>
            <EyeOff className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-primary">{stats.unreadLeads}</div>
            <p className="text-xs text-muted-foreground mt-1">aguardando</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Média</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-primary">{stats.dailyAverage}</div>
            <p className="text-xs text-muted-foreground mt-1">leads/dia</p>
          </CardContent>
        </Card>
      </div>

      {/* Cards por Origem */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        {Object.entries(originStats).map(([origin, count]) => (
          <Card key={origin} className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{origin}</CardTitle>
              <Globe className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-primary">{count}</div>
              <p className="text-xs text-muted-foreground mt-1">leads</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
};

export default DashboardStatsCards;
