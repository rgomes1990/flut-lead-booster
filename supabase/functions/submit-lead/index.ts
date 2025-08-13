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

    if (clientError || !client || !client.is_active) {
      console.error('Client not found or inactive:', clientError);
      return new Response('Client not found or inactive', { 
        status: 404, 
        headers: corsHeaders 
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