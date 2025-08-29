
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

    console.log('Enviando email de alerta:', leadData);

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

    // Ajustar a data para o fuso horário brasileiro (UTC-3)
    const leadDate = new Date(leadData.created_at || Date.now());
    const brazilDate = new Date(leadDate.getTime() - (3 * 60 * 60 * 1000)); // Subtrair 3 horas
    const formattedDate = brazilDate.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Configurações SMTP
    const smtpHost = Deno.env.get('HOSTGATOR_SMTP_HOST') || 'mail.flut.com.br';
    const smtpPort = parseInt(Deno.env.get('HOSTGATOR_SMTP_PORT') || '587');
    const smtpUser = Deno.env.get('HOSTGATOR_SMTP_USER') || 'lead@flut.com.br';
    const smtpPass = Deno.env.get('HOSTGATOR_SMTP_PASSWORD') || '';

    console.log('Configurações SMTP:', {
      host: smtpHost,
      port: smtpPort,
      user: smtpUser,
      secure: false,
      requireTLS: true
    });

    if (!smtpPass) {
      console.error('Senha SMTP não configurada');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Configuração SMTP incompleta' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Preparar conteúdo do email
    const emailSubject = `🚨 Novo Lead Recebido - Sistema Flut`;
    const emailBody = `
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
          <p><strong>Origem:</strong> ${leadData.origin || 'Tráfego Direto'}</p>
          <p><strong>Campanha:</strong> ${leadData.campaign || 'Não informada'}</p>
          <p><strong>Site de Origem:</strong> ${leadData.website_url || 'Não informado'}</p>
          <p><strong>Data/Hora:</strong> ${formattedDate}</p>
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
    `;

    try {
      // Conectar ao servidor SMTP
      const conn = await Deno.connect({
        hostname: smtpHost,
        port: smtpPort,
      });

      console.log('Conectado ao servidor SMTP');

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      // Função para ler resposta do servidor
      const readResponse = async () => {
        const buffer = new Uint8Array(1024);
        const n = await conn.read(buffer);
        const response = decoder.decode(buffer.subarray(0, n || 0));
        console.log('SMTP Response:', response.trim());
        return response;
      };

      // Função para enviar comando
      const sendCommand = async (command: string) => {
        console.log('SMTP Command:', command.trim());
        await conn.write(encoder.encode(command));
      };

      // Sequência SMTP
      await readResponse(); // Ler greeting

      await sendCommand(`EHLO ${smtpHost}\r\n`);
      await readResponse();

      // Iniciar TLS
      await sendCommand('STARTTLS\r\n');
      await readResponse();

      // Upgrade para TLS
      const tlsConn = await Deno.startTls(conn, { hostname: smtpHost });
      
      // Reenviar EHLO após TLS
      await tlsConn.write(encoder.encode(`EHLO ${smtpHost}\r\n`));
      const tlsBuffer = new Uint8Array(1024);
      await tlsConn.read(tlsBuffer);

      // Autenticação
      const authString = btoa(`\0${smtpUser}\0${smtpPass}`);
      await tlsConn.write(encoder.encode(`AUTH PLAIN ${authString}\r\n`));
      const authBuffer = new Uint8Array(1024);
      await tlsConn.read(authBuffer);

      // Envio do email
      await tlsConn.write(encoder.encode(`MAIL FROM:<${smtpUser}>\r\n`));
      const mailBuffer = new Uint8Array(1024);
      await tlsConn.read(mailBuffer);

      await tlsConn.write(encoder.encode(`RCPT TO:<${profile.email}>\r\n`));
      const rcptBuffer = new Uint8Array(1024);
      await tlsConn.read(rcptBuffer);

      await tlsConn.write(encoder.encode('DATA\r\n'));
      const dataBuffer = new Uint8Array(1024);
      await tlsConn.read(dataBuffer);

      const emailContent = [
        `From: ${smtpUser}`,
        `To: ${profile.email}`,
        `Subject: ${emailSubject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        '',
        emailBody,
        '.',
        ''
      ].join('\r\n');

      await tlsConn.write(encoder.encode(emailContent));
      const sendBuffer = new Uint8Array(1024);
      await tlsConn.read(sendBuffer);

      await tlsConn.write(encoder.encode('QUIT\r\n'));
      
      tlsConn.close();

      console.log('Email enviado com sucesso via SMTP');

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Email enviado com sucesso',
        to: profile.email,
        date: formattedDate
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (smtpError) {
      console.error('Erro SMTP:', smtpError);
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Erro no envio do email',
        details: smtpError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
