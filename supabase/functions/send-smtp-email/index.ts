import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

interface EmailData {
  to: string;
  subject: string;
  html: string;
  leadData?: {
    name: string;
    email: string;
    phone: string;
    message?: string;
    created_at: string;
    website_url: string;
  };
}

function formatDateToBrasilia(dateString: string): string {
  const date = new Date(dateString);
  // Ajustar para fuso horário de Brasília (UTC-3)
  const brasiliaDate = new Date(date.getTime() - (3 * 60 * 60 * 1000));
  
  return brasiliaDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo"
  });
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { to, subject, html, leadData }: EmailData = await req.json();
    
    // Buscar credenciais SMTP das secrets
    const smtpHost = Deno.env.get('HOSTGATOR_SMTP_HOST');
    const smtpPort = Deno.env.get('HOSTGATOR_SMTP_PORT');
    const smtpUser = Deno.env.get('HOSTGATOR_SMTP_USER');
    const smtpPassword = Deno.env.get('HOSTGATOR_SMTP_PASSWORD');

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
      console.error('SMTP credentials not configured');
      return new Response('SMTP not configured', { status: 500 });
    }

    let emailBody = html;
    
    // Se há dados do lead, formatar o email
    if (leadData) {
      const formattedDate = formatDateToBrasilia(leadData.created_at);
      
      emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">🎯 Novo Lead Capturado!</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #28a745; margin-top: 0;">Informações do Contato:</h3>
            
            <p><strong>Nome:</strong> ${leadData.name}</p>
            <p><strong>E-mail:</strong> ${leadData.email}</p>
            <p><strong>WhatsApp:</strong> ${leadData.phone}</p>
            ${leadData.message ? `<p><strong>Mensagem:</strong> ${leadData.message}</p>` : ''}
            <p><strong>Data/Hora:</strong> ${formattedDate}</p>
            <p><strong>URL de origem:</strong> ${leadData.website_url}</p>
          </div>
          
          <div style="background-color: #e7f3ff; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff;">
            <p style="margin: 0; color: #0066cc;">
              💡 <strong>Dica:</strong> Entre em contato rapidamente para aumentar suas chances de conversão!
            </p>
          </div>
        </div>
      `;
    }

    // Configurar e enviar email via fetch para serviço SMTP
    const emailPayload = {
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: smtpPort === '465',
      auth: {
        user: smtpUser,
        pass: smtpPassword
      },
      from: smtpUser,
      to: to,
      subject: subject,
      html: emailBody
    };

    console.log('Enviando email para:', to);
    console.log('Dados formatados:', { formattedDate: leadData ? formatDateToBrasilia(leadData.created_at) : 'N/A' });

    // Configurar cliente SMTP
    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: parseInt(smtpPort),
        tls: smtpPort === '465',
        auth: {
          username: smtpUser,
          password: smtpPassword,
        },
      },
    });

    // Enviar email
    await client.send({
      from: smtpUser,
      to: to,
      subject: subject,
      content: emailBody,
      html: emailBody,
    });

    await client.close();

    console.log('Email enviado com sucesso para:', to);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email enviado com sucesso',
      timestamp: formatDateToBrasilia(new Date().toISOString())
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
