ALTER TABLE public.site_configs 
ADD COLUMN IF NOT EXISTS external_api_type text NOT NULL DEFAULT 'flut',
ADD COLUMN IF NOT EXISTS external_api_stage_id text;