
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

  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('x');
    const websiteUrl = url.searchParams.get('z');

    if (!clientId) {
      return new Response('Client ID is required', { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    if (req.method === 'GET') {
      // Retornar script JavaScript
      const script = `
(function() {
  const FLUT_CLIENT_ID = '${clientId}';
  const WEBSITE_URL = '${websiteUrl || window.location.href}';
  const API_URL = 'https://qwisnnipdjqmxpgfvhij.supabase.co/functions/v1';

  // Criar botão flutuante do WhatsApp
  function createWhatsAppButton() {
    const button = document.createElement('div');
    button.id = 'flut-whatsapp-button';
    button.innerHTML = \`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" fill="#fff"/>
      </svg>
    \`;
    
    button.style.cssText = \`
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: #25D366;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      transition: all 0.3s ease;
    \`;

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
    });

    button.addEventListener('click', showModal);
    document.body.appendChild(button);
  }

  // Criar modal de formulário
  function createModal() {
    const modal = document.createElement('div');
    modal.id = 'flut-modal';
    modal.innerHTML = \`
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 20000;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          background: white;
          padding: 30px;
          border-radius: 12px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        ">
          <h2 style="margin: 0 0 20px 0; color: #333; text-align: center;">Fale Conosco</h2>
          <form id="flut-form">
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; color: #555;">DDD + Celular *</label>
              <input type="tel" id="flut-phone" required style="
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
                box-sizing: border-box;
              " placeholder="(11) 99999-9999">
            </div>
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; color: #555;">E-mail *</label>
              <input type="email" id="flut-email" required style="
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
                box-sizing: border-box;
              " placeholder="seu@email.com">
            </div>
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; color: #555;">Nome Completo *</label>
              <input type="text" id="flut-name" required style="
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
                box-sizing: border-box;
              " placeholder="Seu nome completo">
            </div>
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 5px; color: #555;">Mensagem</label>
              <textarea id="flut-message" style="
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
                min-height: 80px;
                resize: vertical;
                box-sizing: border-box;
              " placeholder="Sua mensagem (opcional)"></textarea>
            </div>
            <div style="display: flex; gap: 10px;">
              <button type="button" id="flut-close" style="
                flex: 1;
                padding: 12px;
                background: #f0f0f0;
                color: #666;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
              ">Fechar</button>
              <button type="submit" id="flut-submit" style="
                flex: 1;
                padding: 12px;
                background: #25D366;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
              ">Enviar</button>
            </div>
          </form>
        </div>
      </div>
    \`;

    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('flut-close').addEventListener('click', hideModal);
    document.getElementById('flut-form').addEventListener('submit', submitForm);
    
    // Fechar modal ao clicar fora
    modal.addEventListener('click', (e) => {
      if (e.target === modal) hideModal();
    });
  }

  function showModal() {
    if (!document.getElementById('flut-modal')) {
      createModal();
    }
    document.getElementById('flut-modal').style.display = 'flex';
  }

  function hideModal() {
    const modal = document.getElementById('flut-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  async function submitForm(e) {
    e.preventDefault();
    
    const submitButton = document.getElementById('flut-submit');
    const originalText = submitButton.textContent;
    
    // Mostrar estado de carregamento
    submitButton.textContent = 'Enviando...';
    submitButton.disabled = true;
    submitButton.style.opacity = '0.7';
    
    const name = document.getElementById('flut-name').value;
    const email = document.getElementById('flut-email').value;
    const phone = document.getElementById('flut-phone').value;
    const message = document.getElementById('flut-message').value;

    try {
      console.log('Enviando dados do formulário...');
      
      const response = await fetch(\`\${API_URL}/submit-site-lead\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site_id: FLUT_CLIENT_ID,
          name,
          email,
          phone,
          message,
          website_url: WEBSITE_URL
        })
      });

      console.log('Resposta recebida:', response.status);
      
      const responseData = await response.json();
      console.log('Dados da resposta:', responseData);

      if (response.ok && responseData.success) {
        // Sucesso
        alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
        hideModal();
        document.getElementById('flut-form').reset();
        
        // Se houver dados do WhatsApp, abrir
        if (responseData.whatsapp && responseData.whatsapp.phone) {
          const whatsappUrl = \`https://wa.me/\${responseData.whatsapp.phone}?text=\${responseData.whatsapp.message}\`;
          window.open(whatsappUrl, '_blank');
        }
      } else {
        // Erro do servidor
        const errorMessage = responseData.message || responseData.error || 'Erro ao enviar mensagem';
        console.error('Erro do servidor:', errorMessage);
        alert(\`Erro: \${errorMessage}\`);
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      alert('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      // Restaurar estado do botão
      submitButton.textContent = originalText;
      submitButton.disabled = false;
      submitButton.style.opacity = '1';
    }
  }

  // Inicializar quando a página carregar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWhatsAppButton);
  } else {
    createWhatsAppButton();
  }
})();
      `;

      return new Response(script, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/javascript',
        },
      });
    }

    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
