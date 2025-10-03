import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

interface EmailData {
  to: string;
  subject: string;
  html: string;
  clientName?: string;
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
    const { to, subject, html, clientName, leadData }: EmailData = await req.json();
    
    // Buscar API key do SendGrid
    const sendgridApiKey = Deno.env.get('SENDGRID_SMTP_PASSWORD');
    const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL') || 'lead@flut.com.br';

    if (!sendgridApiKey) {
      console.error('SendGrid API key not configured');
      return new Response(JSON.stringify({ error: 'SendGrid not configured' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let emailBody = html;
    
    // Se há dados do lead, formatar o email
    if (leadData) {
      const formattedDate = formatDateToBrasilia(leadData.created_at);
      
      emailBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                🎯 Novo Lead Capturado!
              </h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 14px;">
                Sistema FLUT - Gestão de Leads Inteligente
              </p>
            </div>
            
            <!-- Body -->
            <div style="padding: 30px; background-color: #ffffff;">
              <p style="color: #333333; font-size: 16px; margin: 0 0 10px 0;">
                <strong>Olá ${clientName || 'Cliente'},</strong>
              </p>
              
              <p style="color: #666666; font-size: 14px; margin: 0 0 25px 0;">
                Um novo lead foi capturado pelo seu sistema! Confira os detalhes abaixo:
              </p>
              
              <!-- Lead Data Box -->
              <div style="border-left: 4px solid #667eea; background-color: #f8f9ff; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <h2 style="color: #667eea; font-size: 16px; margin: 0 0 15px 0; font-weight: bold;">
                  📋 Dados do Lead
                </h2>
                
                <div style="margin: 10px 0;">
                  <span style="color: #667eea; font-weight: bold;">👤 Nome:</span>
                  <span style="color: #333333; margin-left: 5px;">${leadData.name}</span>
                </div>
                
                <div style="margin: 10px 0;">
                  <span style="color: #667eea; font-weight: bold;">✉️ Email:</span>
                  <span style="color: #333333; margin-left: 5px;">${leadData.email}</span>
                </div>
                
                <div style="margin: 10px 0;">
                  <span style="color: #667eea; font-weight: bold;">📱 Telefone:</span>
                  <span style="color: #333333; margin-left: 5px;">${leadData.phone}</span>
                </div>
                
                ${leadData.message ? `
                <div style="margin: 10px 0;">
                  <span style="color: #667eea; font-weight: bold;">💬 Mensagem:</span>
                  <span style="color: #333333; margin-left: 5px;">${leadData.message}</span>
                </div>
                ` : ''}
                
                <div style="margin: 10px 0;">
                  <span style="color: #667eea; font-weight: bold;">🌐 Site de Origem:</span>
                  <span style="color: #333333; margin-left: 5px;">${leadData.website_url}</span>
                </div>
                
                <div style="margin: 10px 0;">
                  <span style="color: #667eea; font-weight: bold;">🕐 Data/Hora:</span>
                  <span style="color: #333333; margin-left: 5px;">${formattedDate}</span>
                </div>
              </div>
              
              <!-- Next Steps Box -->
              <div style="background-color: #e7f3ff; padding: 20px; margin: 20px 0; border-radius: 4px; border-left: 4px solid #2196F3;">
                <h3 style="color: #2196F3; font-size: 16px; margin: 0 0 15px 0; font-weight: bold;">
                  Próximos Passos:
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #333333; font-size: 14px; line-height: 1.8;">
                  <li>Entre em contato com o lead o quanto antes</li>
                  <li>Acesse o painel administrativo para gerenciar este e outros leads</li>
                  <li>Monitore as métricas de conversão no dashboard</li>
                </ul>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © 2025 Sistema FLUT - Gestão de Leads Inteligente
              </p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    console.log('Enviando email via SendGrid API para:', to);

    // Enviar email via API do SendGrid
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }],
            subject: subject,
          },
        ],
        from: {
          email: fromEmail,
          name: 'Sistema Flut',
        },
        content: [
          {
            type: 'text/html',
            value: emailBody,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro SendGrid:', response.status, errorText);
      throw new Error(`SendGrid API error: ${response.status} - ${errorText}`);
    }

    console.log('Email enviado com sucesso via SendGrid API');

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
      error: 'Erro ao enviar email',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
