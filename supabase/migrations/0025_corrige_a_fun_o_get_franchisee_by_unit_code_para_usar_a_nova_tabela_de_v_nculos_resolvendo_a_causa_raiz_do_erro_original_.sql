-- Remove a função antiga para garantir que a nova versão seja criada corretamente
DROP FUNCTION IF EXISTS public.get_franchisee_by_unit_code(text);

-- Recria a função com a lógica de JOIN correta através da tabela de vínculos
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
    FROM unidades u
    JOIN franqueados_unidades fu ON u.id = fu.unidade_id
    JOIN franqueados f ON fu.franqueado_id = f.id
    WHERE u.codigo_unidade = codigo_param AND fu.ativo = true
    LIMIT 1; -- Garante que retorne apenas um franqueado (o principal, se houver múltiplos)
END;
$function$