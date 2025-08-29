
-- Função para atualizar leads baseado no email-cliente
CREATE OR REPLACE FUNCTION public.update_leads_by_client_email()
RETURNS TABLE(
    total_processed integer,
    updated_leads integer,
    skipped_null_emails integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    lead_record RECORD;
    client_record RECORD;
    processed_count INTEGER := 0;
    updated_count INTEGER := 0;
    skipped_count INTEGER := 0;
BEGIN
    -- Processar todos os leads que têm email-cliente não nulo
    FOR lead_record IN 
        SELECT id, "email-cliente", client_id, website_url, origin, status
        FROM leads 
        WHERE "email-cliente" IS NOT NULL AND "email-cliente" != ''
    LOOP
        processed_count := processed_count + 1;
        
        -- Buscar cliente pelo user_id que corresponde ao email na tabela profiles
        SELECT c.id, c.website_url, c.user_id
        INTO client_record
        FROM clients c
        JOIN profiles p ON p.user_id = c.user_id
        WHERE LOWER(p.email) = LOWER(lead_record."email-cliente")
        AND c.is_active = true
        LIMIT 1;
        
        -- Se encontrou o cliente, atualizar o lead
        IF client_record.id IS NOT NULL THEN
            UPDATE leads 
            SET 
                client_id = client_record.id,
                website_url = COALESCE(client_record.website_url, website_url),
                origin = CASE 
                    WHEN origin IS NULL OR origin = '' THEN 'Tráfego Direto'
                    ELSE origin
                END,
                status = 'read',
                updated_at = now()
            WHERE id = lead_record.id;
            
            updated_count := updated_count + 1;
            
            RAISE NOTICE 'Lead % atualizado: client_id=%, website_url=%, status=read', 
                lead_record.id, client_record.id, client_record.website_url;
        ELSE
            RAISE NOTICE 'Cliente não encontrado para email: %', lead_record."email-cliente";
        END IF;
        
        -- Reset para próxima iteração
        client_record := NULL;
    END LOOP;
    
    -- Contar leads com email-cliente nulo que foram ignorados
    SELECT COUNT(*) INTO skipped_count
    FROM leads 
    WHERE "email-cliente" IS NULL OR "email-cliente" = '';
    
    -- Também atualizar origin para "Tráfego Direto" em todos os leads onde origin é NULL
    UPDATE leads 
    SET 
        origin = 'Tráfego Direto',
        updated_at = now()
    WHERE origin IS NULL OR origin = '';
    
    RETURN QUERY SELECT processed_count, updated_count, skipped_count;
END;
$$;

-- Executar a função para processar os leads
SELECT * FROM public.update_leads_by_client_email();
