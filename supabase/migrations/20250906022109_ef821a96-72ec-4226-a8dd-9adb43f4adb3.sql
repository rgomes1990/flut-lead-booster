-- Move the description fields from step 2 ("Descrição") to step 3 ("Informações")
UPDATE landing_profile_fields 
SET step_name = 'Informações', step_order = 3
WHERE field_name IN ('description_title', 'description_content');