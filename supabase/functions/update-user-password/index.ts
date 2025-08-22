
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const { user_id, password } = await req.json()

    if (!user_id || !password) {
      throw new Error("user_id e password são obrigatórios")
    }

    if (password.length < 6) {
      throw new Error("A senha deve ter pelo menos 6 caracteres")
    }

    // Atualizar senha do usuário usando service role
    const { data, error } = await supabaseClient.auth.admin.updateUserById(
      user_id,
      { password: password }
    )

    if (error) throw error

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Senha atualizada com sucesso!"
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
