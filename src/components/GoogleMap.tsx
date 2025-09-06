import { MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GoogleMapProps {
  address: string;
  neighborhood?: string;
  city?: string;
  className?: string;
}

const GoogleMap = ({ address, neighborhood, city, className = "" }: GoogleMapProps) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getApiKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-maps-config');
        if (error) throw error;
        setApiKey(data.apiKey);
      } catch (error) {
        console.error('Erro ao buscar chave da API do Google Maps:', error);
      } finally {
        setLoading(false);
      }
    };

    getApiKey();
  }, []);

  // Construir endereço completo
  const fullAddress = [address, neighborhood, city].filter(Boolean).join(', ');
  
  if (!fullAddress.trim() || loading) {
    return (
      <div className={`bg-gray-200 rounded-lg flex items-center justify-center ${className}`}>
        <MapPin className="h-12 w-12 text-gray-400" />
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className={`bg-gray-200 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p>Chave da API do Google Maps não configurada</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg shadow-lg overflow-hidden ${className}`}>
      <iframe
        src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(fullAddress)}&zoom=16`}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Localização: ${fullAddress}`}
      />
    </div>
  );
};

export default GoogleMap;