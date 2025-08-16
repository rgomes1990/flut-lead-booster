-- Inserir cliente de demonstração (versão corrigida)
DO $$
DECLARE
    demo_user_id uuid;
    demo_client_id uuid;
    existing_client_id uuid;
BEGIN
    -- Verificar se o usuário financeiro@rsgtecnologia.com existe
    SELECT id INTO demo_user_id 
    FROM auth.users 
    WHERE email = 'financeiro@rsgtecnologia.com';
    
    -- Se não existir, criar
    IF demo_user_id IS NULL THEN
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            role
        ) VALUES (
            gen_random_uuid(),
            '00000000-0000-0000-0000-000000000000',
            'financeiro@rsgtecnologia.com',
            crypt('Rsg@9090', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "RSG Tecnologia"}',
            false,
            'authenticated'
        ) RETURNING id INTO demo_user_id;
        
        -- Criar perfil para o usuário
        INSERT INTO public.profiles (user_id, email, name, user_type)
        VALUES (demo_user_id, 'financeiro@rsgtecnologia.com', 'RSG Tecnologia', 'client');
    END IF;
    
    -- Verificar se cliente já existe
    SELECT id INTO existing_client_id 
    FROM public.clients 
    WHERE user_id = demo_user_id;
    
    -- Se não existir, criar cliente
    IF existing_client_id IS NULL THEN
        INSERT INTO public.clients (user_id, company_name, website_url)
        VALUES (demo_user_id, 'RSG Tecnologia', 'https://rsgtecnologia.com')
        RETURNING id INTO demo_client_id;
    ELSE
        demo_client_id := existing_client_id;
    END IF;
    
    -- Inserir alguns leads de demonstração (só se não existirem)
    IF NOT EXISTS (SELECT 1 FROM public.leads WHERE client_id = demo_client_id) THEN
        INSERT INTO public.leads (client_id, name, email, phone, message, website_url, status) VALUES
        (demo_client_id, 'João Silva', 'joao@exemplo.com', '(11) 99999-1111', 'Gostaria de saber mais sobre os serviços', 'https://rsgtecnologia.com', 'new'),
        (demo_client_id, 'Maria Santos', 'maria@exemplo.com', '(11) 99999-2222', 'Preciso de um orçamento', 'https://rsgtecnologia.com', 'contacted'),
        (demo_client_id, 'Pedro Costa', 'pedro@exemplo.com', '(11) 99999-3333', 'Quando podem me atender?', 'https://rsgtecnologia.com', 'new'),
        (demo_client_id, 'Ana Oliveira', 'ana@exemplo.com', '(11) 99999-4444', 'Quero contratar os serviços', 'https://rsgtecnologia.com', 'qualified');
    END IF;
    
END $$;