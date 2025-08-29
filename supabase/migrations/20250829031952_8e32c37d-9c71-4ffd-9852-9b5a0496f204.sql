
-- Função para corrigir a vinculação de leads aos usuários corretos
CREATE OR REPLACE FUNCTION fix_lead_client_associations()
RETURNS TABLE (
    total_leads INTEGER,
    corrected_leads INTEGER,
    orphaned_leads INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    lead_record RECORD;
    correct_client_id UUID;
    total INTEGER := 0;
    corrected INTEGER := 0;
    orphaned INTEGER := 0;
BEGIN
    -- Processar todos os leads
    FOR lead_record IN 
        SELECT l.id, l.client_id, l.website_url, l.name
        FROM leads l
        WHERE l.website_url IS NOT NULL
    LOOP
        total := total + 1;
        
        -- Encontrar o client_id correto baseado no domínio do website_url do lead
        SELECT c.id INTO correct_client_id
        FROM clients c
        JOIN sites s ON s.user_id = c.user_id
        WHERE s.is_active = true
        AND (
            -- Verificar se o domínio do site corresponde ao domínio da URL do lead
            LOWER(s.domain) = LOWER(SPLIT_PART(REPLACE(REPLACE(lead_record.website_url, 'https://', ''), 'http://', ''), '/', 1))
            OR
            -- Verificar se o domínio está contido na URL (para subdomínios)
            lead_record.website_url ILIKE '%' || s.domain || '%'
            OR
            -- Verificar se a URL do cliente contém o domínio do site
            c.website_url ILIKE '%' || s.domain || '%'
        )
        ORDER BY 
            -- Priorizar correspondências exatas
            CASE WHEN LOWER(s.domain) = LOWER(SPLIT_PART(REPLACE(REPLACE(lead_record.website_url, 'https://', ''), 'http://', ''), '/', 1)) THEN 1 ELSE 2 END,
            -- Depois por data de criação mais recente
            s.created_at DESC
        LIMIT 1;
        
        -- Se não encontrou pelo domínio, tentar pelo website_url do cliente
        IF correct_client_id IS NULL THEN
            SELECT c.id INTO correct_client_id
            FROM clients c
            WHERE c.is_active = true
            AND (
                -- Extrair domínio da URL do cliente e comparar com o lead
                LOWER(SPLIT_PART(REPLACE(REPLACE(c.website_url, 'https://', ''), 'http://', ''), '/', 1)) = 
                LOWER(SPLIT_PART(REPLACE(REPLACE(lead_record.website_url, 'https://', ''), 'http://', ''), '/', 1))
            )
            ORDER BY c.created_at DESC
            LIMIT 1;
        END IF;
        
        -- Se encontrou o cliente correto e é diferente do atual, atualizar
        IF correct_client_id IS NOT NULL AND correct_client_id != lead_record.client_id THEN
            UPDATE leads 
            SET client_id = correct_client_id,
                updated_at = now()
            WHERE id = lead_record.id;
            
            corrected := corrected + 1;
            
            -- Log da correção
            RAISE NOTICE 'Lead % (%): client_id alterado para %', 
                lead_record.id, lead_record.name, correct_client_id;
        
        -- Se não encontrou nenhum cliente correspondente
        ELSIF correct_client_id IS NULL THEN
            orphaned := orphaned + 1;
            
            RAISE NOTICE 'Lead órfão encontrado - ID: %, URL: %', 
                lead_record.id, lead_record.website_url;
        END IF;
        
        -- Reset para próxima iteração
        correct_client_id := NULL;
    END LOOP;
    
    RETURN QUERY SELECT total, corrected, orphaned;
END;
$$;

-- Função auxiliar para verificar e reportar leads órfãos
CREATE OR REPLACE FUNCTION report_orphaned_leads()
RETURNS TABLE (
    lead_id UUID,
    lead_name TEXT,
    lead_email TEXT,
    website_url TEXT,
    current_client_id UUID,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.name,
        l.email,
        l.website_url,
        l.client_id,
        l.created_at
    FROM leads l
    LEFT JOIN clients c ON c.id = l.client_id
    LEFT JOIN sites s ON s.user_id = c.user_id AND s.is_active = true
    WHERE c.id IS NULL 
       OR NOT EXISTS (
           SELECT 1 FROM sites s2 
           WHERE s2.user_id = c.user_id 
           AND s2.is_active = true
           AND (
               LOWER(s2.domain) = LOWER(SPLIT_PART(REPLACE(REPLACE(l.website_url, 'https://', ''), 'http://', ''), '/', 1))
               OR l.website_url ILIKE '%' || s2.domain || '%'
           )
       )
    ORDER BY l.created_at DESC;
END;
$$;
