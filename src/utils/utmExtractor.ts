
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

export const detectOriginFromUrl = (url: string): string => {
  if (!url) return 'Tráfego Direto';

  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    // Verificar Facebook (parâmetro fbclid) - ALTERADO para Meta Ads
    if (params.has('fbclid') || url.includes('fbclid=')) {
      return 'Meta Ads';
    }
    
    // Verificar Instagram (parâmetro utm_source=instagram) - Redirecionar para Tráfego Orgânico
    const utmSource = params.get('utm_source')?.toLowerCase();
    if (utmSource === 'instagram') {
      return 'Tráfego Orgânico';
    }
    
    // Verificar Meta Ads (parâmetro utm_source=meta) - CORRIGIDO para case insensitive
    if (utmSource === 'meta') {
      return 'Meta Ads';
    }
    
    // Verificar Chat GPT (parâmetro utm_source=chatgpt ou chatgpt.com)
    if (utmSource === 'chatgpt' || utmSource === 'chatgpt.com') {
      return 'Chat GPT';
    }
    
    // Verificar Tráfego Orgânico (parâmetro srsltid)
    if (params.has('srsltid')) {
      return 'Tráfego Orgânico';
    }
    
    // Verificar Google Ads (parâmetros gclid ou gad_source)
    if (params.has('gclid') || params.has('gad_source')) {
      return 'Google Ads';
    }
    
    // Se não tem parâmetros na URL, é tráfego direto
    if (!url.includes('?') && !url.includes('&')) {
      return 'Tráfego Direto';
    }
    
    return 'Tráfego Direto'; // ALTERADO de 'Site Orgânico' para 'Tráfego Direto'
  } catch {
    // Se a URL for inválida, usar regex - ALTERADO para Meta Ads
    if (url.match(/[?&]fbclid=/)) return 'Meta Ads';
    if (url.match(/[?&]utm_source=instagram(&|$)/i)) return 'Tráfego Orgânico';
    if (url.match(/[?&]utm_source=meta(&|$)/i)) return 'Meta Ads'; // CORRIGIDO
    if (url.match(/[?&]utm_source=(chatgpt|chatgpt\.com)(&|$)/i)) return 'Chat GPT';
    if (url.match(/[?&]srsltid=/)) return 'Tráfego Orgânico';
    if (url.match(/[?&](gclid|gad_source)=/)) return 'Google Ads';
    
    // Se não tem parâmetros na URL, é tráfego direto
    if (!url.includes('?') && !url.includes('&')) {
      return 'Tráfego Direto';
    }
    
    return 'Tráfego Direto'; // ALTERADO de 'Site Orgânico' para 'Tráfego Direto'
  }
};

export const updateLeadWithUTMData = (lead: any) => {
  const utmData = extractUTMFromUrl(lead.website_url);
  const origin = detectOriginFromUrl(lead.website_url);
  
  return {
    ...lead,
    origin: origin,
    campaign: utmData.campaign || lead.campaign || 'Não informado',
    ad_content: utmData.content || 'Não informado',
    audience: utmData.medium || 'Não informado',
  };
};
