import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const webhookUrl = Deno.env.get('FLUT_WEBHOOK_URL')
    const webhookSecret = Deno.env.get('FLUT_WEBHOOK_SECRET')
    if (!webhookUrl || !webhookSecret) {
      return new Response(
        JSON.stringify({ error: 'FLUT_WEBHOOK_URL/SECRET não configurados' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    let clientId: string | null = null
    try {
      if (req.method === 'POST') {
        const body = await req.json().catch(() => ({}))
        clientId = body?.client_id ?? null
      }
    } catch (_) {
      clientId = null
    }

    // Buscar clientes (todos ou apenas o alterado)
    let query = supabase
      .from('clients')
      .select('id, user_id, website_url, script_id, is_active, created_at, updated_at')
    if (clientId) query = query.eq('id', clientId)
    const { data: clients, error: clientsError } = await query
    if (clientsError) throw clientsError

    // Buscar profiles correspondentes
    const userIds = Array.from(new Set((clients ?? []).map((c) => c.user_id).filter(Boolean)))
    const { data: profiles } = userIds.length
      ? await supabase.from('profiles').select('user_id, name, email, phone').in('user_id', userIds)
      : { data: [] as any[] }
    const profileByUser = new Map((profiles ?? []).map((p: any) => [p.user_id, p]))

    const clientes = (clients ?? []).map((c) => {
      const p: any = profileByUser.get(c.user_id) || {}
      return {
        id: c.id,
        nome: p.name || '',
        email: p.email || '',
        telefone: String(p.phone || '').replace(/[^\d]/g, ''),
        website: c.website_url || '',
        ativo: c.is_active,
      }
    })

    const payload = { tipo: 'clientes', clientes }

    console.log('🌐 Enviando clientes para webhook RSG:', clientes.length)

    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-flut-secret': webhookSecret,
      },
      body: JSON.stringify(payload),
    })
    const text = await resp.text()
    console.log('Resposta RSG:', resp.status, text)

    return new Response(
      JSON.stringify({ success: resp.ok, status: resp.status, sent: clientes.length, response: text }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('Erro sync-clients-rsg:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})