-- Inserir a regra de permissão para o menu de administração
INSERT INTO public.perfis_permissoes (recurso, perfil, permitido)
VALUES ('sidebar:administracao', 'admin', true);