
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

    const { name, email, password, website_url, whatsapp, user_type } = await req.json()

    // Criar usuário usando service role (não afeta sessão do admin)
    const { data: userData, error: userError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirma automaticamente
      user_metadata: {
        name,
        website_url: website_url || null,
        whatsapp: whatsapp || null
      }
    })

    if (userError) throw userError
    if (!userData.user) throw new Error("Falha ao criar usuário")

    // Atualizar perfil do usuário com o tipo selecionado
    const { error: profileError } = await supabaseClient
      .from("profiles")
      .update({ user_type })
      .eq("user_id", userData.user.id)

    if (profileError) throw profileError

    // Se for cliente, criar registro na tabela clients E criar site automaticamente
    if (user_type === "client") {
      // Limpar e validar o domínio se fornecido
      let domain = null
      if (website_url && website_url.trim()) {
        domain = website_url.trim()
        domain = domain.replace(/^https?:\/\//, '')
        domain = domain.replace(/^www\./, '')
        domain = domain.replace(/\/$/, '')
      }

      // Criar registro na tabela clients incluindo WhatsApp
      const { error: clientError } = await supabaseClient
        .from("clients")
        .insert({
          user_id: userData.user.id,
          website_url: domain || '',
          whatsapp: whatsapp || '', // Incluir WhatsApp
          script_id: '' // Será sobrescrito pelo trigger
        })

      if (clientError) throw clientError

      // Criar site automaticamente se um domínio foi fornecido
      if (domain) {
        const { data: siteData, error: siteError } = await supabaseClient
          .from("sites")
          .insert({
            domain: domain,
            user_id: userData.user.id
          })
          .select()
          .single()

        if (siteError) {
          console.error("Erro ao criar site:", siteError)
        } else if (siteData) {
          console.log("Site criado automaticamente:", siteData)
          
          // Criar configurações do site automaticamente incluindo WhatsApp
          const { error: configError } = await supabaseClient
            .from("site_configs")
            .insert({
              site_id: siteData.id,
              company_name: name,
              attendant_name: name,
              email: email,
              phone: whatsapp || null, // Usar WhatsApp como telefone
            })

          if (configError) {
            console.error("Erro ao criar configurações do site:", configError)
          } else {
            console.log("Configurações do site criadas automaticamente")
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${user_type === 'admin' ? 'Administrador' : 'Cliente'} criado com sucesso!`,
        user_id: userData.user.id
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
