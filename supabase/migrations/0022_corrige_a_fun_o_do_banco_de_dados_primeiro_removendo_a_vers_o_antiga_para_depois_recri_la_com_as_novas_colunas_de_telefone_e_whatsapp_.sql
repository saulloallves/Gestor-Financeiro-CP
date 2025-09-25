-- Primeiro, removemos a função existente para permitir a alteração do seu retorno.
DROP FUNCTION IF EXISTS public.get_franchisee_by_unit_code(text);

-- Agora, recriamos a função com as novas colunas (telefone, whatsapp)
CREATE OR REPLACE FUNCTION public.get_franchisee_by_unit_code(codigo_param text)
 RETURNS TABLE(id uuid, nome text, email text, tipo text, user_id uuid, codigo_unidade text, nome_unidade text, telefone text, whatsapp text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.nome,
        f.email,
        f.tipo,
        f.user_id,
        u.codigo_unidade,
        u.nome_padrao as nome_unidade,
        f.telefone,
        f.whatsapp
    FROM franqueados f
    JOIN franqueados_unidades fu ON f.id = fu.franqueado_id AND fu.ativo = true
    JOIN unidades u ON fu.unidade_id = u.id
    WHERE u.codigo_unidade = codigo_param
    LIMIT 1;
END;
$function$