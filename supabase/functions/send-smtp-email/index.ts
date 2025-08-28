
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função simplificada para envio via SendGrid SMTP
async function sendSMTPEmail(to: string, subject: string, htmlContent: string) {
  const smtpHost = Deno.env.get('HOSTGATOR_SMTP_HOST')?.replace(/^https?:\/\//, '').replace(/\/$/, '') || 'smtp.sendgrid.net';
  const smtpPort = parseInt(Deno.env.get('HOSTGATOR_SMTP_PORT') || '465');
  const smtpUser = Deno.env.get('HOSTGATOR_SMTP_USER') || 'apikey';
  const smtpPassword = Deno.env.get('HOSTGATOR_SMTP_PASSWORD');
  const mailFromAddress = 'lead@flut.com.br';

  console.log('📧 Configurações SMTP:', {
    host: smtpHost,
    port: smtpPort,
    user: smtpUser,
    from: mailFromAddress,
    to: to
  });

  if (!smtpPassword) {
    throw new Error('Senha SMTP não configurada');
  }

  try {
    console.log('🔗 Conectando ao SendGrid SMTP via SSL (porta 465)...');
    
    // Conectar ao SendGrid com SSL na porta 465
    const conn = await Deno.connectTls({
      hostname: smtpHost,
      port: smtpPort,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    // Função para ler resposta com timeout
    async function readResponse(): Promise<string> {
      const buffer = new Uint8Array(4096);
      const n = await conn.read(buffer);
      if (!n) throw new Error('Conexão fechada pelo servidor');
      const response = decoder.decode(buffer.subarray(0, n)).trim();
      console.log('← Servidor:', response);
      return response;
    }

    // Função para enviar comando
    async function sendCommand(command: string): Promise<string> {
      const logCmd = command.startsWith('AUTH ') ? 'AUTH [HIDDEN]' : command;
      console.log('→ Cliente:', logCmd);
      
      await conn.write(encoder.encode(command + '\r\n'));
      
      // Pequeno delay para permitir processamento
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return await readResponse();
    }

    // 1. Ler banner inicial do servidor
    console.log('📥 Aguardando banner inicial...');
    let response = await readResponse();
    if (!response.startsWith('220')) {
      throw new Error(`Banner SMTP inválido: ${response}`);
    }

    // 2. Enviar EHLO
    response = await sendCommand(`EHLO ${smtpHost}`);
    if (!response.startsWith('250')) {
      throw new Error(`Comando EHLO falhou: ${response}`);
    }

    // 3. Iniciar autenticação LOGIN
    response = await sendCommand('AUTH LOGIN');
    if (!response.startsWith('334')) {
      throw new Error(`AUTH LOGIN não suportado: ${response}`);
    }

    // 4. Enviar username (codificado em base64)
    const encodedUser = btoa(smtpUser);
    response = await sendCommand(encodedUser);
    if (!response.startsWith('334')) {
      throw new Error(`Username rejeitado: ${response}`);
    }

    // 5. Enviar password (codificado em base64)
    const encodedPassword = btoa(smtpPassword);
    response = await sendCommand(encodedPassword);
    if (!response.startsWith('235')) {
      throw new Error(`Falha na autenticação SMTP: ${response}`);
    }

    console.log('✅ Autenticação SMTP realizada com sucesso');

    // 6. Definir remetente
    response = await sendCommand(`MAIL FROM:<${mailFromAddress}>`);
    if (!response.startsWith('250')) {
      throw new Error(`MAIL FROM rejeitado: ${response}`);
    }

    // 7. Definir destinatário
    response = await sendCommand(`RCPT TO:<${to}>`);
    if (!response.startsWith('250')) {
      throw new Error(`RCPT TO rejeitado: ${response}`);
    }

    // 8. Iniciar envio de dados
    response = await sendCommand('DATA');
    if (!response.startsWith('354')) {
      throw new Error(`Comando DATA rejeitado: ${response}`);
    }

    // 9. Construir e enviar o conteúdo do email
    const emailHeaders = [
      `From: Sistema FLUT <${mailFromAddress}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      'Date: ' + new Date().toUTCString(),
      ''
    ].join('\r\n');

    const fullEmailContent = emailHeaders + htmlContent + '\r\n.\r\n';
    
    console.log('📤 Enviando conteúdo do email...');
    await conn.write(encoder.encode(fullEmailContent));
    
    // Aguardar confirmação do envio
    response = await readResponse();
    if (!response.startsWith('250')) {
      throw new Error(`Falha no envio do email: ${response}`);
    }

    console.log('✅ Email enviado com sucesso via SendGrid');

    // 10. Encerrar sessão SMTP
    await sendCommand('QUIT');
    conn.close();

    return { 
      success: true, 
      message: 'Email enviado com sucesso via SendGrid SMTP (porta 465)',
      messageId: response.match(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i)?.[0] || 'unknown'
    };

  } catch (error) {
    console.error('❌ Erro na comunicação SMTP:', error);
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

    console.log('📧 Processando envio de email para lead:', {
      name: leadData.name,
      email: leadData.email,
      client_id: leadData.client_id
    });

    // Buscar dados do cliente
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
      return new Response(JSON.stringify({ 
        error: 'Cliente não encontrado' 
      }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
      return new Response(JSON.stringify({ 
        error: 'Perfil do usuário não encontrado' 
      }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

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

    // Enviar email via SendGrid SMTP
    const emailResult = await sendSMTPEmail(
      profile.email,
      `🚨 Novo Lead Capturado - ${leadData.name || 'Lead'}`,
      htmlContent
    );

    console.log('✅ Email de alerta enviado com sucesso para:', profile.email);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email de alerta enviado com sucesso via SendGrid',
      recipient: profile.email,
      emailResult
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('❌ Erro geral no envio de email:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro ao enviar email',
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
