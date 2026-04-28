ALTER TABLE public.site_configs
  ADD COLUMN IF NOT EXISTS external_api_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS external_api_token text;

UPDATE public.site_configs
SET external_api_enabled = true,
    external_api_token = 'oxp_0dce50f0048ae1b4e0cc37487232b9fc'
WHERE site_id = 'df6ab23f-cce8-44e4-88cc-36053df8d48b';