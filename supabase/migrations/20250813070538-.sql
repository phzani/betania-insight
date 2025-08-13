-- Create API cache table for BetanIA
CREATE TABLE public.api_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  endpoint TEXT NOT NULL,
  params JSONB,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_api_cache_key_expiry ON public.api_cache(cache_key, expires_at);
CREATE INDEX idx_api_cache_expires ON public.api_cache(expires_at);

-- RLS for API cache (public readable for sports data)
ALTER TABLE public.api_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "API cache is publicly readable" ON public.api_cache FOR SELECT USING (true);

-- Function to clean expired cache
CREATE OR REPLACE FUNCTION public.clean_expired_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.api_cache 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;