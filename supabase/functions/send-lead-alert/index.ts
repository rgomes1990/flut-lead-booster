
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { leadData } = await req.json();

    console.log('Enviando alerta de lead:', leadData);

    // Buscar dados do cliente através da tabela clients e profiles
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select(`
        id,
        user_id
      `)
      .eq('id', leadData.client_id)
      .single();

    if (clientError || !client) {
      console.error('Erro ao buscar cliente:', clientError);
      return new Response('Cliente não encontrado', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Buscar o perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('user_id', client.user_id)
      .single();

    if (profileError || !profile) {
      console.error('Erro ao buscar perfil do usuário:', profileError);
      return new Response('Perfil do usuário não encontrado', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Preparar dados do email
    const emailData = {
      to: profile.email,
      subject: `🚨 Novo Lead Recebido - Sistema Flut`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            📩 Novo Lead Recebido!
          </h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Dados do Lead:</h3>
            <p><strong>Nome:</strong> ${leadData.name}</p>
            <p><strong>Email:</strong> ${leadData.email}</p>
            <p><strong>Telefone:</strong> ${leadData.phone}</p>
            <p><strong>Mensagem:</strong> ${leadData.message || 'Não informada'}</p>
            <p><strong>Origem:</strong> ${leadData.origin || 'Site Orgânico'}</p>
            <p><strong>Campanha:</strong> ${leadData.campaign || 'Não informada'}</p>
            <p><strong>Site de Origem:</strong> ${leadData.website_url || 'Não informado'}</p>
            <p><strong>Data/Hora:</strong> ${new Date(leadData.created_at || Date.now()).toLocaleString('pt-BR')}</p>
          </div>
          
          <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
            <p style="margin: 0; color: #1e40af;">
              <strong>💡 Sistema Flut:</strong> Este lead foi capturado automaticamente pelo seu sistema de captura de leads. 
              Acesse o painel administrativo para gerenciar todos os seus leads.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              Sistema Flut - Captura de Leads Automatizada<br>
              Este é um email automático, não responda a esta mensagem.
            </p>
          </div>
        </div>
      `
    };

    console.log('Email preparado para:', emailData.to);

    // Por enquanto, apenas log o email (implementar Resend depois se necessário)
    console.log('Dados do email:', emailData);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Alerta de lead preparado com sucesso',
      emailData: {
        to: emailData.to,
        subject: emailData.subject
      }
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Erro ao processar alerta de lead:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }), { 
      status: 500, 
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
    });
  }
});
