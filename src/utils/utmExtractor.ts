
interface UTMData {
  campaign?: string;
  content?: string;
  medium?: string;
}

export const extractUTMFromUrl = (url: string): UTMData => {
  if (!url) return {};

  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    return {
      campaign: params.get('utm_campaign') || undefined,
      content: params.get('utm_content') || undefined,
      medium: params.get('utm_medium') || undefined,
    };
  } catch {
    // Se a URL for inválida, tentar extrair com regex
    const campaignMatch = url.match(/[?&]utm_campaign=([^&]*)/);
    const contentMatch = url.match(/[?&]utm_content=([^&]*)/);
    const mediumMatch = url.match(/[?&]utm_medium=([^&]*)/);
    
    return {
      campaign: campaignMatch ? decodeURIComponent(campaignMatch[1]) : undefined,
      content: contentMatch ? decodeURIComponent(contentMatch[1]) : undefined,
      medium: mediumMatch ? decodeURIComponent(mediumMatch[1]) : undefined,
    };
  }
};

export const updateLeadWithUTMData = (lead: any) => {
  const utmData = extractUTMFromUrl(lead.website_url);
  
  return {
    ...lead,
    campaign: utmData.campaign || lead.campaign || 'Não informado',
    ad_content: utmData.content || 'Não informado',
    audience: utmData.medium || 'Não informado',
  };
};
