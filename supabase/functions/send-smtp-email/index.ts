
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para enviar email via SMTP
async function sendSMTPEmail(to: string, subject: string, htmlContent: string) {
  const smtpHost = Deno.env.get('HOSTGATOR_SMTP_HOST');
  const smtpPort = parseInt(Deno.env.get('HOSTGATOR_SMTP_PORT') || '587');
  const smtpUser = Deno.env.get('HOSTGATOR_SMTP_USER');
  const smtpPassword = Deno.env.get('HOSTGATOR_SMTP_PASSWORD');

  if (!smtpHost || !smtpUser || !smtpPassword) {
    throw new Error('Credenciais SMTP não configuradas');
  }

  try {
    // Conectar ao servidor SMTP
    const conn = await Deno.connect({
      hostname: smtpHost,
      port: smtpPort,
    });

    const textEncoder = new TextEncoder();
    const textDecoder = new TextDecoder();

    // Função para enviar comando e ler resposta
    async function sendCommand(command: string): Promise<string> {
      await conn.write(textEncoder.encode(command + '\r\n'));
      const buffer = new Uint8Array(1024);
      const bytesRead = await conn.read(buffer);
      return textDecoder.decode(buffer.subarray(0, bytesRead || 0));
    }

    // Iniciar comunicação SMTP
    let response = await sendCommand('');
    console.log('Connect response:', response);

    // EHLO
    response = await sendCommand(`EHLO ${smtpHost}`);
    console.log('EHLO response:', response);

    // STARTTLS se disponível
    if (smtpPort === 587) {
      response = await sendCommand('STARTTLS');
      console.log('STARTTLS response:', response);
    }

    // AUTH LOGIN
    response = await sendCommand('AUTH LOGIN');
    console.log('AUTH response:', response);

    // Enviar usuário (base64)
    const userBase64 = btoa(smtpUser);
    response = await sendCommand(userBase64);
    console.log('User response:', response);

    // Enviar senha (base64)
    const passwordBase64 = btoa(smtpPassword);
    response = await sendCommand(passwordBase64);
    console.log('Password response:', response);

    // MAIL FROM
    response = await sendCommand(`MAIL FROM:<${smtpUser}>`);
    console.log('MAIL FROM response:', response);

    // RCPT TO
    response = await sendCommand(`RCPT TO:<${to}>`);
    console.log('RCPT TO response:', response);

    // DATA
    response = await sendCommand('DATA');
    console.log('DATA response:', response);

    // Cabeçalhos e conteúdo do email
    const emailContent = [
      `From: Sistema FLUT <${smtpUser}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=UTF-8',
      'MIME-Version: 1.0',
      '',
      htmlContent,
      '.'
    ].join('\r\n');

    await conn.write(textEncoder.encode(emailContent + '\r\n'));
    const buffer = new Uint8Array(1024);
    const bytesRead = await conn.read(buffer);
    response = textDecoder.decode(buffer.subarray(0, bytesRead || 0));
    console.log('Email content response:', response);

    // QUIT
    await sendCommand('QUIT');
    conn.close();

    return 'Email enviado com sucesso';

  } catch (error) {
    console.error('Erro SMTP:', error);
    throw error;
  }
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

    console.log('Enviando email de alerta de lead:', leadData);

    // Buscar dados do cliente através da tabela clients
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

    // Preparar conteúdo HTML do email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Novo Lead Recebido</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
          .lead-info { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2563eb; }
          .field { margin-bottom: 10px; }
          .field strong { color: #1f2937; }
          .footer { text-align: center; margin-top: 20px; padding: 15px; background-color: #e5e7eb; border-radius: 8px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚨 Novo Lead Capturado!</h1>
          <p>Sistema FLUT - Gestão de Leads Inteligente</p>
        </div>
        
        <div class="content">
          <p><strong>Olá ${profile.name},</strong></p>
          <p>Um novo lead foi capturado pelo seu sistema! Confira os detalhes abaixo:</p>
          
          <div class="lead-info">
            <h3 style="margin-top: 0; color: #1f2937;">📋 Dados do Lead</h3>
            
            <div class="field">
              <strong>👤 Nome:</strong> ${leadData.name || 'Não informado'}
            </div>
            
            <div class="field">
              <strong>📧 Email:</strong> ${leadData.email || 'Não informado'}
            </div>
            
            <div class="field">
              <strong>📱 Telefone:</strong> ${leadData.phone || 'Não informado'}
            </div>
            
            <div class="field">
              <strong>💬 Mensagem:</strong> ${leadData.message || 'Não informada'}
            </div>
            
            <div class="field">
              <strong>🌐 Site de Origem:</strong> ${leadData.website_url || 'Não informado'}
            </div>
            
            <div class="field">
              <strong>📍 Origem do Tráfego:</strong> ${leadData.origin || 'Site Orgânico'}
            </div>
            
            <div class="field">
              <strong>🎯 Campanha:</strong> ${leadData.campaign || 'Não informada'}
            </div>
            
            <div class="field">
              <strong>⏰ Data/Hora:</strong> ${new Date(leadData.created_at || Date.now()).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
          
          <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 20px 0;">
            <p style="margin: 0; color: #1e40af;">
              <strong>💡 Próximos Passos:</strong><br>
              • Entre em contato com o lead o quanto antes<br>
              • Acesse o painel administrativo para gerenciar este e outros leads<br>
              • Monitore as métricas de conversão no dashboard
            </p>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>Sistema FLUT - Gestão de Leads Inteligente</strong></p>
          <p>Este é um email automático do sistema. Não responda a esta mensagem.</p>
        </div>
      </body>
      </html>
    `;

    // Enviar email via SMTP
    await sendSMTPEmail(
      profile.email,
      `🚨 Novo Lead Capturado - ${leadData.name || 'Lead'}`,
      htmlContent
    );

    console.log('Email enviado com sucesso para:', profile.email);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email de alerta enviado com sucesso',
      recipient: profile.email
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Erro ao enviar email de alerta:', error);
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
