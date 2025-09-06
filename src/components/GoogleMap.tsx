import { MapPin } from "lucide-react";

interface GoogleMapProps {
  address: string;
  neighborhood?: string;
  city?: string;
  className?: string;
}

const GoogleMap = ({ address, neighborhood, city, className = "" }: GoogleMapProps) => {
  // Construir endereço completo
  const fullAddress = [address, neighborhood, city].filter(Boolean).join(', ');
  
  if (!fullAddress.trim()) {
    return (
      <div className={`bg-gray-200 rounded-lg flex items-center justify-center ${className}`}>
        <MapPin className="h-12 w-12 text-gray-400" />
      </div>
    );
  }

  return (
    <div className={`rounded-lg shadow-lg overflow-hidden ${className}`}>
      <iframe
        src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyD5bZF6tJN8fNn9qo4U7vT8xA3jQqG9bPm&q=${encodeURIComponent(fullAddress)}&zoom=16`}
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