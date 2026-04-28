
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
      return new Response(JSON.stringify({ 
        error: 'Site ID is required' 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!name && !email && !phone) {
      return new Response(JSON.stringify({ 
        error: 'At least one contact field is required' 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
      return new Response(JSON.stringify({ 
        error: 'Site not found or inactive' 
      }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
        return new Response(JSON.stringify({ 
          error: 'Error creating client' 
        }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
      .select('phone, attendant_name, external_api_enabled, external_api_token')
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
      return new Response(JSON.stringify({ 
        error: 'Error saving lead' 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Lead saved successfully with origin:', finalOrigin, 'and UTM data:', utmData);

    // Enviar lead para CRM externo se habilitado
    if (siteConfig?.external_api_enabled && siteConfig?.external_api_token) {
      try {
        // Normalizar celular: apenas dígitos, sem +55
        const celularDigits = String(phone || '').replace(/[^\d]/g, '').replace(/^55/, '');

        const externalPayload = {
          nome: name || 'Não informado',
          email: email || '',
          celular: celularDigits,
          mensagem: message || '',
        };

        console.log('🔗 Enviando lead para CRM externo:', externalPayload);

        const externalResponse = await fetch('https://crm.flut.com.br/api/leads', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${siteConfig.external_api_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(externalPayload),
        });

        const externalText = await externalResponse.text();
        if (externalResponse.ok) {
          console.log('✅ Lead enviado ao CRM externo com sucesso:', externalResponse.status, externalText);
        } else {
          console.error('❌ CRM externo retornou erro:', externalResponse.status, externalText);
        }
      } catch (externalError) {
        console.error('❌ Exceção ao enviar lead para CRM externo:', externalError);
      }
    }

    // Buscar email e nome do usuário para enviar alerta
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('user_id', site.user_id)
      .single();

    if (profileError) {
      console.error('⚠️ Erro ao buscar perfil do usuário:', profileError);
    }

    // Enviar alerta por email via SMTP (aguardar resposta)
    let emailSuccess = false;
    
    if (!userProfile?.email) {
      console.error('❌ Email do usuário não encontrado para user_id:', site.user_id);
      console.log('Perfil encontrado:', userProfile);
    } else {
      try {
        console.log('📧 Iniciando envio de email de alerta para:', userProfile.email);
        console.log('📧 Nome do cliente:', userProfile.name || 'Cliente');
        console.log('📧 Lead data:', { 
          name: leadData.name, 
          email: leadData.email, 
          phone: leadData.phone,
          website_url: website_url || ''
        });
        
        const emailResponse = await supabase.functions.invoke('send-smtp-email', {
          body: { 
            to: userProfile.email,
            subject: '🚨 Novo Lead Recebido - Sistema Flut',
            clientName: userProfile.name || 'Cliente',
            leadData: { 
              ...leadData, 
              created_at: insertedLead.created_at,
              website_url: website_url || ''
            } 
          }
        });

        console.log('📧 Resposta completa do envio de email:', JSON.stringify(emailResponse, null, 2));
        
        if (emailResponse.error) {
          console.error('❌ Erro na resposta do envio de email:', JSON.stringify(emailResponse.error, null, 2));
        } else if (emailResponse.data?.success) {
          console.log('✅ Email de alerta enviado com sucesso via SMTP');
          emailSuccess = true;
        } else {
          console.error('⚠️ Email enviado mas sem confirmação de sucesso:', emailResponse.data);
        }
      } catch (emailError) {
        console.error('❌ Exceção ao chamar função de envio de email:', emailError);
        console.error('❌ Stack trace:', emailError instanceof Error ? emailError.stack : 'Sem stack trace');
      }
    }

    // Preparar resposta com dados para redirecionamento do WhatsApp
    const normalizeWhatsAppPhone = (value: string): string => {
      let digits = String(value || '').trim().replace(/[^\d]/g, '');
      if (digits && (digits.length === 10 || digits.length === 11)) {
        digits = `55${digits}`;
      }
      return digits;
    };

    const whatsappPhone = normalizeWhatsAppPhone(siteConfig?.phone || '');
    const attendantName = siteConfig?.attendant_name || 'Atendimento';
    
    // Criar mensagem para WhatsApp
    const whatsappMessage = `Olá ${attendantName}! Meu nome é ${name || 'Cliente'}. 
${message ? `${message}` : ''}`;

    const whatsappUrl = whatsappPhone
      ? `https://api.whatsapp.com/send?phone=${whatsappPhone}&text=${encodeURIComponent(whatsappMessage)}`
      : '';

    const responseData = {
      success: true,
      message: 'Lead enviado com sucesso!',
      emailSent: emailSuccess,
      whatsapp: {
        phone: whatsappPhone,
        message: whatsappMessage,
        url: whatsappUrl
      }
    };

    console.log('Retornando resposta de sucesso:', responseData);

    return new Response(JSON.stringify(responseData), { 
      status: 200, 
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error geral:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: 'Erro interno do servidor'
    }), { 
      status: 500, 
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
