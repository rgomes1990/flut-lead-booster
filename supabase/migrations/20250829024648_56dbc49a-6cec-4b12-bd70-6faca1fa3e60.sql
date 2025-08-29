
-- Função para atualizar leads existentes com dados UTM
CREATE OR REPLACE FUNCTION reprocess_leads_utm_data()
RETURNS TABLE (
    processed_count INTEGER,
    updated_count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    lead_record RECORD;
    utm_campaign TEXT;
    utm_content TEXT;
    utm_medium TEXT;
    detected_origin TEXT;
    processed INTEGER := 0;
    updated INTEGER := 0;
BEGIN
    -- Processar todos os leads
    FOR lead_record IN 
        SELECT id, website_url, origin, campaign, ad_content, audience
        FROM leads 
        WHERE website_url IS NOT NULL
    LOOP
        processed := processed + 1;
        
        -- Extrair UTM parameters da URL
        utm_campaign := NULL;
        utm_content := NULL;
        utm_medium := NULL;
        
        -- Extrair utm_campaign
        IF lead_record.website_url ~* '[?&]utm_campaign=([^&]*)' THEN
            SELECT (regexp_matches(lead_record.website_url, '[?&]utm_campaign=([^&]*)', 'i'))[1] INTO utm_campaign;
        END IF;
        
        -- Extrair utm_content
        IF lead_record.website_url ~* '[?&]utm_content=([^&]*)' THEN
            SELECT (regexp_matches(lead_record.website_url, '[?&]utm_content=([^&]*)', 'i'))[1] INTO utm_content;
        END IF;
        
        -- Extrair utm_medium
        IF lead_record.website_url ~* '[?&]utm_medium=([^&]*)' THEN
            SELECT (regexp_matches(lead_record.website_url, '[?&]utm_medium=([^&]*)', 'i'))[1] INTO utm_medium;
        END IF;
        
        -- Detectar origem usando a função existente
        SELECT determine_origin_from_url(lead_record.website_url) INTO detected_origin;
        
        -- Atualizar apenas se houver dados para atualizar
        IF utm_campaign IS NOT NULL OR utm_content IS NOT NULL OR utm_medium IS NOT NULL OR 
           detected_origin IS NOT NULL OR detected_origin != COALESCE(lead_record.origin, '') THEN
            
            UPDATE leads SET
                origin = COALESCE(detected_origin, origin, 'Tráfego Direto'),
                campaign = CASE 
                    WHEN utm_campaign IS NOT NULL THEN utm_campaign
                    WHEN campaign IS NULL OR campaign = 'Não informado' THEN 'Não informado'
                    ELSE campaign
                END,
                ad_content = CASE 
                    WHEN utm_content IS NOT NULL THEN utm_content
                    WHEN ad_content IS NULL OR ad_content = 'Não informado' THEN 'Não informado'
                    ELSE ad_content
                END,
                audience = CASE 
                    WHEN utm_medium IS NOT NULL THEN utm_medium
                    WHEN audience IS NULL OR audience = 'Não informado' THEN 'Não informado'
                    ELSE audience
                END,
                updated_at = now()
            WHERE id = lead_record.id;
            
            updated := updated + 1;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT processed, updated;
END;
$$;

-- Adicionar coluna ad_content e audience se não existirem
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'ad_content') THEN
        ALTER TABLE leads ADD COLUMN ad_content TEXT DEFAULT 'Não informado';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'audience') THEN
        ALTER TABLE leads ADD COLUMN audience TEXT DEFAULT 'Não informado';
    END IF;
END $$;
