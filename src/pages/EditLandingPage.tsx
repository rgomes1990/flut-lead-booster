
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import AdminNavigation from "@/components/AdminNavigation";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Eye } from "lucide-react";

interface ProfileField {
  id: string;
  step_name: string;
  field_name: string;
  field_type: string;
  field_label: string;
  placeholder: string;
  is_required: boolean;
  field_order: number;
  step_order: number;
}

interface LandingPageData {
  [key: string]: string;
}

interface LandingPage {
  id: string;
  name: string;
  slug: string;
  is_published: boolean;
  profile_id: string;
}

const EditLandingPage = () => {
  const { userProfile } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [landingPage, setLandingPage] = useState<LandingPage | null>(null);
  const [profileFields, setProfileFields] = useState<ProfileField[]>([]);
  const [landingData, setLandingData] = useState<LandingPageData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadLandingPage();
    }
  }, [id]);

  const loadLandingPage = async () => {
    try {
      setLoading(true);
      
      // Carregar dados da landing page
      const { data: pageData, error: pageError } = await supabase
        .from("user_landing_pages")
        .select("*")
        .eq("id", id)
        .single();

      if (pageError) throw pageError;
      
      // Verificar se o usuário tem permissão
      if (userProfile?.user_type !== 'admin' && pageData.user_id !== userProfile?.user_id) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para editar esta landing page.",
          variant: "destructive",
        });
        navigate("/landing-pages");
        return;
      }

      setLandingPage(pageData);

      // Carregar campos do perfil
      const { data: fieldsData, error: fieldsError } = await supabase
        .from("landing_profile_fields")
        .select("*")
        .eq("profile_id", pageData.profile_id)
        .order("step_order", { ascending: true })
        .order("field_order", { ascending: true });

      if (fieldsError) throw fieldsError;
      setProfileFields(fieldsData || []);

      // Carregar dados salvos da landing page
      const { data: savedData, error: dataError } = await supabase
        .from("landing_page_data")
        .select("*")
        .eq("landing_page_id", id);

      if (dataError) throw dataError;
      
      const dataMap: LandingPageData = {};
      savedData?.forEach(item => {
        dataMap[item.field_name] = item.field_value || '';
      });
      setLandingData(dataMap);

    } catch (error: any) {
      console.error("Error loading landing page:", error);
      toast({
        title: "Erro ao carregar landing page",
        description: error.message,
        variant: "destructive",
      });
      navigate("/landing-pages");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setLandingData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Salvar cada campo
      for (const [fieldName, fieldValue] of Object.entries(landingData)) {
        await supabase
          .from("landing_page_data")
          .upsert({
            landing_page_id: id,
            field_name: fieldName,
            field_value: fieldValue
          });
      }

      toast({
        title: "Landing page salva com sucesso!",
        description: "Suas alterações foram salvas.",
      });

    } catch (error: any) {
      console.error("Error saving landing page:", error);
      toast({
        title: "Erro ao salvar landing page",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: ProfileField) => {
    const value = landingData[field.field_name] || '';

    switch (field.field_type) {
      case 'textarea':
        return (
          <Textarea
            id={field.field_name}
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            placeholder={field.placeholder}
            required={field.is_required}
            rows={4}
          />
        );
      case 'number':
        return (
          <Input
            id={field.field_name}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            placeholder={field.placeholder}
            required={field.is_required}
          />
        );
      case 'email':
        return (
          <Input
            id={field.field_name}
            type="email"
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            placeholder={field.placeholder}
            required={field.is_required}
          />
        );
      default:
        return (
          <Input
            id={field.field_name}
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            placeholder={field.placeholder}
            required={field.is_required}
          />
        );
    }
  };

  // Agrupar campos por etapa
  const fieldsByStep = profileFields.reduce((acc, field) => {
    if (!acc[field.step_name]) {
      acc[field.step_name] = [];
    }
    acc[field.step_name].push(field);
    return acc;
  }, {} as Record<string, ProfileField[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation />
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Carregando...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!landingPage) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation />
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Landing page não encontrada</h2>
              <Button onClick={() => navigate("/landing-pages")}>
                Voltar para Landing Pages
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate("/landing-pages")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{landingPage.name}</h1>
                <p className="text-muted-foreground">Personalize sua landing page</p>
              </div>
            </div>
            <div className="flex gap-2">
              {landingPage.is_published && (
                <Button 
                  variant="outline" 
                  onClick={() => window.open(`/public/${landingPage.slug}`, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>
              )}
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {Object.entries(fieldsByStep).map(([stepName, fields]) => (
              <Card key={stepName}>
                <CardHeader>
                  <CardTitle>{stepName}</CardTitle>
                  <CardDescription>
                    Preencha as informações desta seção
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.field_name}>
                        {field.field_label}
                        {field.is_required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {renderField(field)}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditLandingPage;
