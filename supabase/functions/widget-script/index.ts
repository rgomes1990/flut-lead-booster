import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log('Widget script function called:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const siteId = url.searchParams.get('siteId');
    console.log('Site ID received:', siteId);

    if (!siteId) {
      return new Response('Site ID is required', { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    if (req.method === 'GET') {
      console.log('Processing GET request for widget script');
      
      // Inicializar cliente Supabase
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      
      console.log('Supabase URL:', supabaseUrl);
      console.log('Creating Supabase client...');
      
      const supabase = createClient(supabaseUrl, supabaseKey);

      console.log('Fetching site config for siteId:', siteId);
      
      // Buscar configurações do site
      const { data: siteConfig, error: configError } = await supabase
        .from('site_configs')
        .select('*')
        .eq('site_id', siteId)
        .single();

      console.log('Site config result:', { siteConfig, configError });

      const { data: site, error: siteError } = await supabase
        .from('sites')
        .select('*')
        .eq('id', siteId)
        .single();

      console.log('Site result:', { site, siteError });

      if (!siteConfig || !site) {
        console.log('Site or config not found');
        return new Response('Site or configuration not found', { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });
      }

      console.log('Generating script...');

      // Script JavaScript personalizado
      const script = `
(function() {
  const SITE_ID = '${siteId}';
  const API_URL = '${supabaseUrl}/functions/v1';
  const SITE_CONFIG = ${JSON.stringify(siteConfig || {})};
  const SITE_DATA = ${JSON.stringify(site || {})};

  // Criar botão flutuante do WhatsApp
  function createWhatsAppButton() {
    const button = document.createElement('div');
    button.id = 'flut-whatsapp-button';
    
    const iconType = SITE_CONFIG.icon_type || 'whatsapp';
    
    if (iconType === 'whatsapp-alt') {
      // Ícone branco com botão verde dentro
      button.innerHTML = \`
        <div style="
          width: 44px;
          height: 44px;
          background: #25D366;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" fill="#fff"/>
          </svg>
        </div>
      \`;
    } else {
      // Ícone padrão verde
      button.innerHTML = \`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" fill="#fff"/>
        </svg>
      \`;
    }
    
    const position = SITE_CONFIG.icon_position || 'bottom';
    let positionStyle = 'bottom: 20px;';
    
    if (position === 'top') {
      positionStyle = 'top: 20px;';
    } else if (position === 'center') {
      positionStyle = 'top: 50%; transform: translateY(-50%);';
    }
    
    const baseBackground = iconType === 'whatsapp-alt' ? '#ffffff' : '#25D366';
    const baseBorder = iconType === 'whatsapp-alt' ? '2px solid #e5e7eb' : 'none';
    
    button.style.cssText = \`
      position: fixed;
      \${positionStyle}
      right: 20px;
      width: 60px;
      height: 60px;
      background: \${baseBackground};
      border: \${baseBorder};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      transition: all 0.3s ease;
    \`;

    button.addEventListener('mouseenter', () => {
      button.style.transform = position === 'center' ? 'translateY(-50%) scale(1.1)' : 'scale(1.1)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = position === 'center' ? 'translateY(-50%) scale(1)' : 'scale(1)';
    });

    button.addEventListener('click', showModal);
    document.body.appendChild(button);
  }

  // Criar modal de formulário
  function createModal() {
    const modal = document.createElement('div');
    modal.id = 'flut-modal';
    
    const companyName = SITE_CONFIG.company_name || 'Empresa';
    const attendantName = SITE_CONFIG.attendant_name || 'Atendimento';
    
    modal.innerHTML = \`
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 20000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
      ">
        <div style="
          background: #f0f0f0;
          border-radius: 16px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          overflow: hidden;
          position: relative;
        ">
          <!-- Header -->
          <div style="
            background: linear-gradient(135deg, #128C7E 0%, #25D366 100%);
            padding: 20px;
            color: white;
            position: relative;
          ">
            <button id="flut-close" style="
              position: absolute;
              top: 15px;
              right: 15px;
              background: none;
              border: none;
              color: white;
              font-size: 24px;
              cursor: pointer;
              width: 30px;
              height: 30px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 50%;
              transition: background 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='none'">×</button>
            
            <div style="display: flex; align-items: center; gap: 15px;">
              <div style="
                width: 50px;
                height: 50px;
                background: rgba(255,255,255,0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" fill="#fff"/>
                </svg>
              </div>
              <div>
                <h3 style="margin: 0; font-size: 18px; font-weight: 600;">\${attendantName}</h3>
                <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                  <div style="width: 8px; height: 8px; background: #4CAF50; border-radius: 50%;"></div>
                  <span style="font-size: 14px; opacity: 0.9;">Online</span>
                </div>
              </div>
            </div>
            
            <div style="
              position: absolute;
              top: 15px;
              right: 60px;
              background: rgba(255,255,255,0.9);
              color: #128C7E;
              padding: 8px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
            ">\${companyName}</div>
          </div>
          
          <!-- Content -->
          <div style="padding: 20px;">
            <div style="
              background: #FFF3CD;
              color: #856404;
              padding: 12px 16px;
              border-radius: 8px;
              margin-bottom: 20px;
              text-align: center;
              font-size: 14px;
            ">
              Fale com a gente pelo WhatsApp
            </div>
            
            <form id="flut-form" style="display: flex; flex-direction: column; gap: 15px;">
              \${SITE_CONFIG.field_phone !== false ? \`
               <input type="tel" id="flut-phone" required placeholder="DDD + Celular" style="
                 all: unset !important;
                 display: block !important;
                 width: calc(100% - 30px) !important;
                 padding: 15px !important;
                 border: none !important;
                 border-radius: 25px !important;
                 background: white !important;
                 font-size: 14px !important;
                 box-shadow: inset 0 2px 4px rgba(0,0,0,0.1) !important;
                 outline: none !important;
                 transition: box-shadow 0.2s !important;
                 box-sizing: border-box !important;
                 font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                 color: #333 !important;
                 line-height: 1.2 !important;
               " onfocus="this.style.boxShadow='inset 0 2px 8px rgba(37,211,102,0.2) !important'" onblur="this.style.boxShadow='inset 0 2px 4px rgba(0,0,0,0.1) !important'">
              \` : ''}
              
              \${SITE_CONFIG.field_email !== false ? \`
               <input type="email" id="flut-email" \${SITE_CONFIG.field_phone === false ? 'required' : ''} placeholder="E-mail" style="
                 all: unset !important;
                 display: block !important;
                 width: calc(100% - 30px) !important;
                 padding: 15px !important;
                 border: none !important;
                 border-radius: 25px !important;
                 background: white !important;
                 font-size: 14px !important;
                 box-shadow: inset 0 2px 4px rgba(0,0,0,0.1) !important;
                 outline: none !important;
                 transition: box-shadow 0.2s !important;
                 box-sizing: border-box !important;
                 font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                 color: #333 !important;
                 line-height: 1.2 !important;
               " onfocus="this.style.boxShadow='inset 0 2px 8px rgba(37,211,102,0.2) !important'" onblur="this.style.boxShadow='inset 0 2px 4px rgba(0,0,0,0.1) !important'">
              \` : ''}
              
              \${SITE_CONFIG.field_name !== false ? \`
               <input type="text" id="flut-name" \${!SITE_CONFIG.field_phone && !SITE_CONFIG.field_email ? 'required' : ''} placeholder="Nome Completo" style="
                 all: unset !important;
                 display: block !important;
                 width: calc(100% - 30px) !important;
                 padding: 15px !important;
                 border: none !important;
                 border-radius: 25px !important;
                 background: white !important;
                 font-size: 14px !important;
                 box-shadow: inset 0 2px 4px rgba(0,0,0,0.1) !important;
                 outline: none !important;
                 transition: box-shadow 0.2s !important;
                 box-sizing: border-box !important;
                 font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                 color: #333 !important;
                 line-height: 1.2 !important;
               " onfocus="this.style.boxShadow='inset 0 2px 8px rgba(37,211,102,0.2) !important'" onblur="this.style.boxShadow='inset 0 2px 4px rgba(0,0,0,0.1) !important'">
              \` : ''}
              
              \${SITE_CONFIG.field_message !== false ? \`
               <textarea id="flut-message" placeholder="Mensagem:" style="
                 all: unset !important;
                 display: block !important;
                 width: calc(100% - 30px) !important;
                 padding: 15px !important;
                 border: none !important;
                 border-radius: 15px !important;
                 background: white !important;
                 font-size: 14px !important;
                 min-height: 80px !important;
                 resize: vertical !important;
                 box-shadow: inset 0 2px 4px rgba(0,0,0,0.1) !important;
                 outline: none !important;
                 transition: box-shadow 0.2s !important;
                 font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                 box-sizing: border-box !important;
                 color: #333 !important;
                 line-height: 1.4 !important;
               " onfocus="this.style.boxShadow='inset 0 2px 8px rgba(37,211,102,0.2) !important'" onblur="this.style.boxShadow='inset 0 2px 4px rgba(0,0,0,0.1) !important'"></textarea>
              \` : ''}
              
              <!-- Área para mensagens de erro -->
              <div id="flut-error-message" style="
                display: none;
                background: #f8d7da;
                color: #721c24;
                padding: 12px 16px;
                border-radius: 8px;
                margin-bottom: 15px;
                text-align: center;
                font-size: 14px;
                border: 1px solid #f5c6cb;
              "></div>
              
              <button type="submit" id="flut-submit-btn" style="
                padding: 15px;
                background: linear-gradient(135deg, #128C7E 0%, #25D366 100%);
                color: white;
                border: none;
                border-radius: 25px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 600;
                transition: transform 0.2s;
                margin-top: 10px;
              " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                Enviar
              </button>
            </form>
            
            <div style="
              text-align: center;
              margin-top: 20px;
              padding-top: 15px;
              border-top: 1px solid #e0e0e0;
            ">
              <div style="
                display: inline-flex;
                align-items: center;
                gap: 8px;
                color: #666;
                font-size: 12px;
              ">
                <div style="width: 12px; height: 12px; background: #25D366; border-radius: 50%;"></div>
                Instale a Flut em seu website
                <a href="https://flut.com.br/" target="_blank" style="color: #25D366; text-decoration: none; font-weight: 600;">clicando aqui</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    \`;

    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('flut-close').addEventListener('click', hideModal);
    document.getElementById('flut-form').addEventListener('submit', submitForm);
    
    // Fechar modal ao clicar fora
    modal.addEventListener('click', (e) => {
      if (e.target === modal) hideModal();
    });
  }

  function showModal() {
    if (!document.getElementById('flut-modal')) {
      createModal();
    }
    document.getElementById('flut-modal').style.display = 'flex';
  }

  function hideModal() {
    const modal = document.getElementById('flut-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  function showErrorMessage(message) {
    const errorDiv = document.getElementById('flut-error-message');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    }
  }

  function hideErrorMessage() {
    const errorDiv = document.getElementById('flut-error-message');
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  }

  function detectOriginAndCampaign() {
    const referrer = document.referrer;
    const url = new URL(window.location.href);
    
    // Verificar parâmetros UTM
    const utmSource = url.searchParams.get('utm_source');
    const utmMedium = url.searchParams.get('utm_medium');
    const utmCampaign = url.searchParams.get('utm_campaign');
    const utmContent = url.searchParams.get('utm_content');
    const utmTerm = url.searchParams.get('utm_term');
    
    let origin = '';
    let campaign = 'Não informado';
    
    // Google Ads
    if (utmSource === 'google' && utmMedium === 'cpc') {
      origin = 'Google Ads';
      // Para Google Ads, priorizar utm_campaign, depois utm_term, depois utm_content
      if (utmCampaign) {
        campaign = utmCampaign;
      } else if (utmTerm) {
        campaign = utmTerm;
      } else if (utmContent) {
        campaign = utmContent;
      }
    }
    // Meta Ads
    else if ((utmSource === 'facebook' || utmSource === 'instagram') && utmMedium === 'cpc') {
      origin = 'Meta Ads';
      // Para Meta Ads, priorizar utm_campaign, depois utm_content
      if (utmCampaign) {
        campaign = utmCampaign;
      } else if (utmContent) {
        campaign = utmContent;
      }
    }
    // Verificar referrer
    else if (referrer) {
      const referrerUrl = new URL(referrer);
      const domain = referrerUrl.hostname.toLowerCase();
      
      // Google Orgânico
      if (domain.includes('google.')) {
        origin = 'Google Organico';
      }
      // Facebook
      else if (domain.includes('facebook.com') || domain.includes('fb.com')) {
        origin = 'Facebook';
      }
      // Instagram
      else if (domain.includes('instagram.com')) {
        origin = 'Instagram';
      }
      // Meta Ads (outros domínios do Meta)
      else if (domain.includes('l.facebook.com') || domain.includes('l.instagram.com')) {
        origin = 'Meta Ads';
        // Tentar capturar campanha dos parâmetros UTM mesmo vindo de links do Meta
        if (utmCampaign) {
          campaign = utmCampaign;
        } else if (utmContent) {
          campaign = utmContent;
        }
      }
    }
    
    // Se não houver referrer ou não for identificado, é tráfego direto
    if (!origin) {
      origin = 'Trafego Direto';
    }
    
    return { origin, campaign };
  }

  async function submitForm(e) {
    e.preventDefault();
    
    // Limpar mensagens de erro anteriores
    hideErrorMessage();
    
    const submitBtn = document.getElementById('flut-submit-btn');
    const phoneEl = document.getElementById('flut-phone');
    const emailEl = document.getElementById('flut-email');
    const nameEl = document.getElementById('flut-name');
    const messageEl = document.getElementById('flut-message');
    
    const { origin, campaign } = detectOriginAndCampaign();
    
    const leadData = {
      site_id: SITE_ID,
      website_url: window.location.href,
      phone: phoneEl ? phoneEl.value : '',
      email: emailEl ? emailEl.value : '',
      name: nameEl ? nameEl.value : '',
      message: messageEl ? messageEl.value : '',
      origin: origin,
      campaign: campaign
    };

    // Validar se pelo menos um campo obrigatório foi preenchido
    if (!leadData.phone && !leadData.email && !leadData.name) {
      showErrorMessage('Por favor, preencha pelo menos um campo de contato.');
      return;
    }

    // Desabilitar botão e mostrar carregamento
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    try {
      const response = await fetch(\`\${API_URL}/submit-site-lead\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData)
      });

      if (response.ok) {
        const responseData = await response.json();
        
        // Fechar modal e resetar formulário
        hideModal();
        document.getElementById('flut-form').reset();
        
        // Redirecionar para WhatsApp se os dados estiverem disponíveis
        if (responseData.whatsapp && responseData.whatsapp.phone) {
          const whatsappUrl = \`https://wa.me/\${responseData.whatsapp.phone.replace(/[^0-9]/g, '')}?text=\${responseData.whatsapp.message}\`;
          window.open(whatsappUrl, '_blank');
        }
      } else {
        try {
          const errorData = await response.json();
          if (errorData.error === 'Plano inativo') {
            showErrorMessage(errorData.message || 'O plano de assinatura expirou. Entre em contato com o administrador do sistema.');
            return;
          }
          throw new Error(errorData.error || 'Erro ao enviar mensagem');
        } catch (jsonError) {
          // Se não conseguir fazer parse do JSON, usa texto plano
          const errorText = await response.text();
          console.error('Server error:', errorText);
          throw new Error('Erro ao enviar mensagem');
        }
      }
    } catch (error) {
      console.error('Erro:', error);
      showErrorMessage('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      // Reabilitar botão
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar';
    }
  }

  // Inicializar quando a página carregar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWhatsAppButton);
  } else {
    createWhatsAppButton();
  }
})();
      `;

      console.log('Script generated successfully, sending response');
      
      return new Response(script, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/javascript; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Error in widget-script function:', error);
    return new Response(`Internal server error: ${error.message}`, { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  }
});