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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { client_id, name, email, phone, message, website_url } = await req.json();

    if (!client_id || !name || !email || !phone) {
      return new Response('Missing required fields', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Buscar cliente pelo script_id
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, is_active')
      .eq('script_id', client_id)
      .single();

    if (clientError || !client) {
      console.error('Client not found:', clientError);
      return new Response(JSON.stringify({ 
        error: 'Cliente não encontrado' 
      }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se o cliente tem plano ativo
    const { data: hasActivePlan, error: planError } = await supabase
      .rpc('client_has_active_plan', { client_uuid: client.id });

    if (planError) {
      console.error('Erro ao verificar plano:', planError);
      return new Response(JSON.stringify({ 
        error: 'Erro interno do servidor' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!hasActivePlan) {
      return new Response(JSON.stringify({ 
        error: 'Plano inativo',
        message: 'Seu plano de assinatura expirou. Entre em contato para renovar.'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Inserir lead
    const { error: leadError } = await supabase
      .from('leads')
      .insert({
        client_id: client.id,
        name,
        email,
        phone,
        message: message || null,
        website_url,
        status: 'new'
      });

    if (leadError) {
      console.error('Error inserting lead:', leadError);
      return new Response('Error saving lead', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    console.log('Lead saved successfully for client:', client_id);

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});