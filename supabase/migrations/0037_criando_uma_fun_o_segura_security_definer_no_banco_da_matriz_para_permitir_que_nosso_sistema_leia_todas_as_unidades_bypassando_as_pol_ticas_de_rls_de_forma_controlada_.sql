CREATE OR REPLACE FUNCTION public.get_all_unidades_for_sync()
RETURNS SETOF public.unidades
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.unidades;
END;
$$;