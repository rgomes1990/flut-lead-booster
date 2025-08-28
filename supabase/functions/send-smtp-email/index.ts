
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para limpar o hostname removendo protocolo e barras
function cleanHostname(hostname: string): string {
  if (!hostname) return '';
  
  // Remover protocolo (http://, https://)
  let cleaned = hostname.replace(/^https?:\/\//, '');
  
  // Remover barra final
  cleaned = cleaned.replace(/\/$/, '');
  
  // Remover qualquer path adicional
  cleaned = cleaned.split('/')[0];
  
  return cleaned;
}

// Função melhorada para enviar email via SendGrid SMTP
async function sendSMTPEmail(to: string, subject: string, htmlContent: string) {
  const rawSmtpHost = Deno.env.get('HOSTGATOR_SMTP_HOST');
  const smtpPort = parseInt(Deno.env.get('HOSTGATOR_SMTP_PORT') || '587');
  const smtpUser = Deno.env.get('HOSTGATOR_SMTP_USER');
  const smtpPassword = Deno.env.get('HOSTGATOR_SMTP_PASSWORD');

  // Limpar o hostname removendo protocolo e barras
  const smtpHost = cleanHostname(rawSmtpHost || '');

  // Endereço para MAIL FROM conforme solicitado
  const mailFromAddress = 'lead@flut.com.br';

  console.log('Configurações SMTP SendGrid:', {
    host: smtpHost,
    port: smtpPort,
    user: smtpUser ? 'Definido' : 'Não definido',
    password: smtpPassword ? 'Definido' : 'Não definido',
    mailFrom: mailFromAddress
  });

  if (!smtpHost || !smtpUser || !smtpPassword) {
    throw new Error('Credenciais SMTP não configuradas');
  }

  let conn;
  
  try {
    // Conectar inicialmente sem TLS
    console.log('Conectando ao SendGrid...');
    conn = await Deno.connect({
      hostname: smtpHost,
      port: smtpPort,
    });

    const textEncoder = new TextEncoder();
    const textDecoder = new TextDecoder();

    // Função melhorada para ler resposta
    async function readResponse(): Promise<string> {
      const buffer = new Uint8Array(8192);
      const bytesRead = await conn.read(buffer);
      if (!bytesRead) {
        throw new Error('Conexão fechada pelo servidor');
      }
      
      const response = textDecoder.decode(buffer.subarray(0, bytesRead));
      console.log('← Servidor:', response.trim().replace(/\r\n/g, ' | '));
      return response.trim();
    }

    // Função para enviar comando
    async function sendCommand(command: string): Promise<string> {
      const logCommand = command.startsWith('AUTH ') || command.match(/^[A-Za-z0-9+/=]+$/) 
        ? '[DADOS AUTH OCULTOS]' 
        : command;
      console.log('→ Cliente:', logCommand);
      
      await conn.write(textEncoder.encode(command + '\r\n'));
      await new Promise(resolve => setTimeout(resolve, 100)); // Pequena pausa
      return await readResponse();
    }

    // 1. Ler banner inicial
    console.log('=== Iniciando comunicação SMTP ===');
    let response = await readResponse();
    
    if (!response.startsWith('220')) {
      throw new Error(`Banner inválido: ${response}`);
    }

    // 2. EHLO inicial
    response = await sendCommand(`EHLO ${smtpHost}`);
    if (!response.startsWith('250')) {
      throw new Error(`EHLO falhou: ${response}`);
    }

    // 3. STARTTLS (obrigatório para SendGrid na porta 587)
    console.log('=== Iniciando STARTTLS ===');
    response = await sendCommand('STARTTLS');
    if (!response.startsWith('220')) {
      throw new Error(`STARTTLS rejeitado: ${response}`);
    }

    // 4. Fechar conexão atual e estabelecer TLS
    conn.close();
    console.log('Estabelecendo conexão TLS segura...');
    
    conn = await Deno.connectTls({
      hostname: smtpHost,
      port: smtpPort,
    });

    // Aguardar estabilização da conexão TLS
    await new Promise(resolve => setTimeout(resolve, 500));

    // 5. EHLO após TLS
    console.log('=== EHLO pós-TLS ===');
    response = await sendCommand(`EHLO ${smtpHost}`);
    if (!response.startsWith('250')) {
      throw new Error(`EHLO pós-TLS falhou: ${response}`);
    }

    // 6. Autenticação AUTH LOGIN
    console.log('=== Autenticação ===');
    response = await sendCommand('AUTH LOGIN');
    if (!response.startsWith('334')) {
      throw new Error(`AUTH LOGIN rejeitado: ${response}`);
    }

    // 7. Enviar username (base64)
    const usernameB64 = btoa(smtpUser);
    response = await sendCommand(usernameB64);
    if (!response.startsWith('334')) {
      throw new Error(`Username rejeitado: ${response}`);
    }

    // 8. Enviar password (base64)
    const passwordB64 = btoa(smtpPassword);
    response = await sendCommand(passwordB64);
    if (!response.startsWith('235')) {
      throw new Error(`Autenticação falhou: ${response}`);
    }

    console.log('✓ Autenticação bem-sucedida');

    // 9. MAIL FROM
    response = await sendCommand(`MAIL FROM:<${mailFromAddress}>`);
    if (!response.startsWith('250')) {
      throw new Error(`MAIL FROM rejeitado: ${response}`);
    }

    // 10. RCPT TO
    response = await sendCommand(`RCPT TO:<${to}>`);
    if (!response.startsWith('250')) {
      throw new Error(`RCPT TO rejeitado: ${response}`);
    }

    // 11. DATA
    response = await sendCommand('DATA');
    if (!response.startsWith('354')) {
      throw new Error(`DATA rejeitado: ${response}`);
    }

    // 12. Conteúdo do email
    console.log('=== Enviando conteúdo ===');
    const emailDate = new Date().toUTCString();
    const emailContent = [
      `Date: ${emailDate}`,
      `From: Sistema FLUT <${mailFromAddress}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      htmlContent,
      '.'
    ].join('\r\n');

    await conn.write(textEncoder.encode(emailContent + '\r\n'));
    response = await readResponse();
    
    if (!response.startsWith('250')) {
      throw new Error(`Envio falhou: ${response}`);
    }

    console.log('✓ Email enviado com sucesso');

    // 13. QUIT
    await sendCommand('QUIT');
    conn.close();

    return { success: true, message: 'Email enviado via SendGrid' };

  } catch (error) {
    console.error('❌ Erro SMTP SendGrid:', error);
    if (conn) {
      try {
        conn.close();
      } catch (e) {
        console.error('Erro ao fechar conexão:', e);
      }
    }
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

    console.log('✓ Email de alerta enviado com sucesso para:', profile.email);

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
