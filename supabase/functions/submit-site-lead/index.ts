import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { site_id, name, email, phone, message, website_url, origin } = await req.json();

    console.log('Lead submission data:', { 
      site_id, 
      name, 
      email, 
      phone, 
      website_url, 
      origin 
    });

    // Função melhorada para detectar origem
    const detectOriginFromUrl = (url: string): string => {
      if (!url) return 'Tráfego Direto';

      try {
        const urlObj = new URL(url);
        const params = urlObj.searchParams;
        
        // Verificar Facebook (parâmetro fbclid) - ALTERADO para Meta Ads
        if (params.has('fbclid') || url.includes('fbclid=')) {
          return 'Meta Ads';
        }
        
        // Verificar Instagram (parâmetro utm_source=instagram)
        const utmSource = params.get('utm_source')?.toLowerCase();
        if (utmSource === 'instagram') {
          return 'Instagram';
        }
        
        // Verificar Meta Ads (parâmetro utm_source=meta) - CORRIGIDO
        if (utmSource === 'meta') {
          return 'Meta Ads';
        }
        
        // Verificar Tráfego Orgânico (parâmetro srsltid) - CORRIGIDO
        if (params.has('srsltid')) {
          return 'Tráfego Orgânico';
        }
        
        // Verificar Google Ads (parâmetros gclid ou gad_source)
        if (params.has('gclid') || params.has('gad_source')) {
          return 'Google Ads';
        }
        
        // Verificar outros UTM sources
        if (utmSource) {
          return 'UTM Campaign';
        }
        
        // Se não tem parâmetros na URL, é tráfego direto
        if (!url.includes('?') && !url.includes('&')) {
          return 'Tráfego Direto';
        }
        
        return 'Tráfego Direto';
      } catch {
        // Se a URL for inválida, usar regex - ALTERADO para Meta Ads
        if (url.match(/[?&]fbclid=/)) return 'Meta Ads';
        if (url.match(/[?&]utm_source=instagram(&|$)/i)) return 'Instagram';
        if (url.match(/[?&]utm_source=meta(&|$)/i)) return 'Meta Ads'; // CORRIGIDO
        if (url.match(/[?&]srsltid=/)) return 'Tráfego Orgânico'; // CORRIGIDO
        if (url.match(/[?&](gclid|gad_source)=/)) return 'Google Ads';
        if (url.match(/[?&]utm_source=/)) return 'UTM Campaign';
        
        // Se não tem parâmetros na URL, é tráfego direto
        if (!url.includes('?') && !url.includes('&')) {
          return 'Tráfego Direto';
        }
        
        return 'Tráfego Direto';
      }
    };

    const detectedOrigin = detectOriginFromUrl(website_url);

    console.log('Origin detection result:', { 
      website_url, 
      detectedOrigin
    });

    const finalOrigin = detectedOrigin || 'Tráfego Direto';

    console.log('Final origin assigned:', finalOrigin);

    // Extrair dados UTM da URL
    const extractUTMFromUrl = (url: string) => {
      if (!url) return { campaign: null };

      try {
        const urlObj = new URL(url);
        const params = urlObj.searchParams;
        
        return {
          campaign: params.get('utm_campaign') || null,
        };
      } catch {
        // Se a URL for inválida, tentar extrair com regex
        const campaignMatch = url.match(/[?&]utm_campaign=([^&]*)/);
        
        return {
          campaign: campaignMatch ? decodeURIComponent(campaignMatch[1]) : null,
        };
      }
    };

    const utmData = extractUTMFromUrl(website_url);

    // Validar campos obrigatórios
    if (!site_id) {
      return new Response('Site ID is required', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    if (!name && !email && !phone) {
      return new Response('At least one contact field is required', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Verificar se o site existe e obter user_id
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('user_id')
      .eq('id', site_id)
      .eq('is_active', true)
      .single();

    if (siteError || !site) {
      console.error('Site error:', siteError);
      return new Response('Site not found or inactive', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Verificar se existe um client para este user_id
    let { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', site.user_id)
      .single();

    if (clientError || !client) {
      // Criar client se não existir
      const { data: newClient, error: createClientError } = await supabase
        .from('clients')
        .insert({
          user_id: site.user_id,
          website_url: website_url || '',
          script_id: Math.floor(Math.random() * 9000 + 1000).toString()
        })
        .select('id')
        .single();

      if (createClientError) {
        console.error('Client creation error:', createClientError);
        return new Response('Error creating client', { 
          status: 500, 
          headers: corsHeaders 
        });
      }
      
      client = newClient;
    }

    // Verificar se o cliente tem plano ativo
    const { data: hasActivePlan, error: planError } = await supabase
      .rpc('client_has_active_plan', { client_uuid: client.id });

    if (planError) {
      console.error('Erro ao verificar plano:', planError);
      return new Response(JSON.stringify({ 
        error: 'Erro interno do servidor' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!hasActivePlan) {
      return new Response(JSON.stringify({ 
        error: 'Plano inativo',
        message: 'O plano de assinatura deste site expirou. Entre em contato com o proprietário.'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Obter configuração do site para o telefone do WhatsApp
    const { data: siteConfig } = await supabase
      .from('site_configs')
      .select('phone, attendant_name')
      .eq('site_id', site_id)
      .single();

    // Inserir lead na tabela leads
    const leadData = {
      client_id: client.id,
      name: name || 'Não informado',
      email: email || 'Não informado',
      phone: phone || 'Não informado',
      message: message || '',
      website_url: website_url || '',
      origin: finalOrigin,
      campaign: utmData.campaign || 'Não informado',
      status: 'new'
    };

    const { data: insertedLead, error: leadError } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (leadError) {
      console.error('Lead insertion error:', leadError);
      return new Response('Error saving lead', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    console.log('Lead saved successfully with origin:', finalOrigin, 'and UTM data:', utmData);

    // Enviar alerta por email via SMTP (não blocking)
    try {
      await supabase.functions.invoke('send-smtp-email', {
        body: { leadData: { ...leadData, created_at: insertedLead.created_at } }
      });
      console.log('Email de alerta enviado com sucesso via SMTP');
    } catch (emailError) {
      console.error('Erro ao enviar email de alerta via SMTP:', emailError);
      // Não falhar a operação principal por causa do email
    }

    // Preparar resposta com dados para redirecionamento do WhatsApp
    const whatsappPhone = siteConfig?.phone || '';
    const attendantName = siteConfig?.attendant_name || 'Atendimento';
    
    // Criar mensagem para WhatsApp
    const whatsappMessage = `Olá ${attendantName}! Meu nome é ${name || 'Cliente'}. 
${message ? `${message}` : ''}`;

    const responseData = {
      success: true,
      message: 'Lead submitted successfully',
      whatsapp: {
        phone: whatsappPhone,
        message: encodeURIComponent(whatsappMessage)
      }
    };

    return new Response(JSON.stringify(responseData), { 
      status: 200, 
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
