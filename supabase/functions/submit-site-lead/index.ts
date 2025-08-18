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

    // Determinar origem com base na URL
    const determineOrigin = (url: string, providedOrigin?: string) => {
      if (providedOrigin && providedOrigin !== 'Site Orgânico') {
        return providedOrigin;
      }
      
      if (!url) return 'Site Orgânico';
      
      try {
        const urlObj = new URL(url);
        const params = urlObj.searchParams;
        
        // Verificar Google Ads
        if (params.has('gad_source') || params.has('gclid')) {
          return 'Google Ads';
        }
        
        // Verificar Meta Ads
        if (params.get('utm_source') === 'Meta') {
          return 'Meta Ads';
        }
        
        return 'Site Orgânico';
      } catch {
        return 'Site Orgânico';
      }
    };

    const detectedOrigin = determineOrigin(website_url, origin);

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
    const { error: leadError } = await supabase
      .from('leads')
      .insert({
        client_id: client.id,
        name: name || 'Não informado',
        email: email || 'Não informado',
        phone: phone || 'Não informado',
        message: message || '',
        website_url: website_url || '',
        origin: detectedOrigin,
        status: 'new'
      });

    if (leadError) {
      console.error('Lead insertion error:', leadError);
      return new Response('Error saving lead', { 
        status: 500, 
        headers: corsHeaders 
      });
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