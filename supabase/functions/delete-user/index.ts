
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DELETE-USER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Use service role to perform admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    // Extract token from Bearer header
    const token = authHeader.replace("Bearer ", "");
    
    // Use regular supabase client to verify user session
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Set the session using the token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      logStep("Authentication failed", { error: userError?.message });
      throw new Error(`Authentication failed: ${userError?.message || 'User not found'}`);
    }

    logStep("User authenticated", { userId: user.id });

    // Check if requesting user is admin using service role client
    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_type')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      logStep("Error fetching admin profile", profileError);
      throw new Error(`Error fetching user profile: ${profileError.message}`);
    }

    if (adminProfile?.user_type !== 'admin') {
      throw new Error("Only admins can delete users");
    }

    const { userId } = await req.json();
    if (!userId) throw new Error("User ID is required");

    logStep("Admin verified, deleting user", { userId });

    // 1. Get client IDs for this user first
    const { data: clientsData } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('user_id', userId);

    const clientIds = clientsData?.map(client => client.id) || [];
    logStep("Found clients", { clientIds });

    // 2. Get site IDs for this user
    const { data: sitesData } = await supabaseAdmin
      .from('sites')
      .select('id')
      .eq('user_id', userId);

    const siteIds = sitesData?.map(site => site.id) || [];
    logStep("Found sites", { siteIds });

    // 3. Delete all related data in order (respecting foreign key constraints)
    
    // Delete leads first (references clients)
    if (clientIds.length > 0) {
      const { error: leadsError } = await supabaseAdmin
        .from('leads')
        .delete()
        .in('client_id', clientIds);
      
      if (leadsError) logStep("Error deleting leads", leadsError);
      else logStep("Deleted leads for clients");
    }

    // Delete subscription plans (references clients)
    if (clientIds.length > 0) {
      const { error: plansError } = await supabaseAdmin
        .from('subscription_plans')
        .delete()
        .in('client_id', clientIds);
      
      if (plansError) logStep("Error deleting subscription plans", plansError);
      else logStep("Deleted subscription plans for clients");
    }

    // Delete site configs (references sites)
    if (siteIds.length > 0) {
      const { error: configsError } = await supabaseAdmin
        .from('site_configs')
        .delete()
        .in('site_id', siteIds);
      
      if (configsError) logStep("Error deleting site configs", configsError);
      else logStep("Deleted site configs for sites");
    }

    // Delete sites
    const { error: sitesError } = await supabaseAdmin
      .from('sites')
      .delete()
      .eq('user_id', userId);
    
    if (sitesError) logStep("Error deleting sites", sitesError);
    else logStep("Deleted sites for user");

    // Delete clients
    const { error: clientsError } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('user_id', userId);
    
    if (clientsError) logStep("Error deleting clients", clientsError);
    else logStep("Deleted clients for user");

    // Delete profile
    const { error: profileDeleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', userId);
    
    if (profileDeleteError) logStep("Error deleting profile", profileDeleteError);
    else logStep("Deleted profile for user");

    // Finally, delete the auth user
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (authDeleteError) {
      logStep("Error deleting auth user", authDeleteError);
      throw new Error(`Failed to delete auth user: ${authDeleteError.message}`);
    }

    logStep("User completely deleted", { userId });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "User and all related data deleted successfully" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in delete-user", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
