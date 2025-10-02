import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

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
