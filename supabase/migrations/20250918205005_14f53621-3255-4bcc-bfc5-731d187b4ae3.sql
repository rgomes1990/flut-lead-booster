-- Corrigir a função format_whatsapp_number para adicionar search_path
CREATE OR REPLACE FUNCTION format_whatsapp_number(input_phone TEXT)
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    numbers TEXT;
    formatted_result TEXT;
BEGIN
    -- Se for NULL ou vazio, retornar +55
    IF input_phone IS NULL OR input_phone = '' THEN
        RETURN '+55 ';
    END IF;
    
    -- Remove tudo que não é número
    numbers := regexp_replace(input_phone, '[^\d]', '', 'g');
    
    -- Se já começa com 55, usa os números como estão
    -- Se não, assume que faltam os 55 do Brasil
    IF length(numbers) >= 2 AND left(numbers, 2) = '55' THEN
        numbers := numbers;
    ELSE
        -- Se tem 11 dígitos (DDD + número), adiciona 55 no início
        IF length(numbers) = 11 THEN
            numbers := '55' || numbers;
        -- Se tem 10 dígitos (DDD + número sem 9), adiciona 55 no início
        ELSIF length(numbers) = 10 THEN
            numbers := '55' || numbers;
        -- Se tem menos de 10 dígitos, adiciona 55 no início mesmo assim
        ELSE
            numbers := '55' || numbers;
        END IF;
    END IF;
    
    -- Se tem menos de 4 dígitos no total (55 + pelo menos 2 do DDD), retorna +55
    IF length(numbers) < 4 THEN
        RETURN '+55 ';
    END IF;
    
    -- Se tem exatamente 4 dígitos (55 + DDD incompleto), formata: +55 (X
    IF length(numbers) = 4 THEN
        RETURN '+55 (' || substr(numbers, 3, 1);
    END IF;
    
    -- Se tem 5 dígitos (55 + DDD completo), formata: +55 (XX) 
    IF length(numbers) = 5 THEN
        RETURN '+55 (' || substr(numbers, 3, 2) || ') ';
    END IF;
    
    -- Se tem entre 6 e 12 dígitos (55 + DDD + número parcial/completo)
    IF length(numbers) >= 6 AND length(numbers) <= 13 THEN
        DECLARE
            ddd TEXT := substr(numbers, 3, 2);
            phone_part TEXT := substr(numbers, 5);
        BEGIN
            -- Se o número tem 9 dígitos (celular completo)
            IF length(phone_part) = 9 THEN
                formatted_result := '+55 (' || ddd || ') ' || substr(phone_part, 1, 5) || '-' || substr(phone_part, 6, 4);
            -- Se o número tem 8 dígitos (fixo completo)
            ELSIF length(phone_part) = 8 THEN
                formatted_result := '+55 (' || ddd || ') ' || substr(phone_part, 1, 4) || '-' || substr(phone_part, 5, 4);
            -- Se o número tem menos de 8 dígitos, não adiciona hífen
            ELSE
                formatted_result := '+55 (' || ddd || ') ' || phone_part;
            END IF;
        END;
    ELSE
        -- Se tem mais de 13 dígitos, trunca
        DECLARE
            ddd TEXT := substr(numbers, 3, 2);
            phone_part TEXT := substr(numbers, 5, 9); -- Pega no máximo 9 dígitos do telefone
        BEGIN
            IF length(phone_part) = 9 THEN
                formatted_result := '+55 (' || ddd || ') ' || substr(phone_part, 1, 5) || '-' || substr(phone_part, 6, 4);
            ELSE
                formatted_result := '+55 (' || ddd || ') ' || phone_part;
            END IF;
        END;
    END IF;
    
    RETURN formatted_result;
END;
$$;