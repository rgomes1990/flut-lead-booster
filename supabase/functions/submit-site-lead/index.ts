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

    // Validar campos obrigatórios
    if (!site_id) {
      return new Response('Site ID is required', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    if (!name && !email && !phone) {
      return new Response('At least one contact field is required', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Verificar se o site existe e obter o client_id
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('user_id')
      .eq('id', site_id)
      .eq('is_active', true)
      .single();

    if (siteError || !site) {
      return new Response('Site not found or inactive', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Inserir lead na tabela leads
    const { error: leadError } = await supabase
      .from('leads')
      .insert({
        client_id: site.user_id,
        name: name || 'Não informado',
        email: email || 'Não informado',
        phone: phone || 'Não informado',
        message: message || '',
        website_url: website_url || '',
        origin: origin || 'Site Orgânico',
        status: 'new'
      });

    if (leadError) {
      console.error('Lead insertion error:', leadError);
      return new Response('Error saving lead', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    return new Response('Lead submitted successfully', { 
      status: 200, 
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