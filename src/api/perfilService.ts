import { supabase } from './supabaseClient';
import { limparNumeros, formatarTelefone } from '../utils/validations';
import type {
  PerfilUsuario,
  EditarDadosPessoaisData,
  AlterarSenhaData,
  UpdatePerfilResponse,
  UpdateSenhaResponse,
  UploadFotoResult,
} from '../types/perfil';

export class PerfilService {
  // Buscar dados do perfil do usuário atual
  static async getPerfilUsuario(): Promise<PerfilUsuario | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar dados do perfil na tabela correspondente
      const { data: perfilData, error: perfilError } = await supabase
        .from('usuarios_internos')
        .select(`
          id,
          nome,
          email,
          telefone,
          foto_perfil,
          perfil,
          created_at,
          ultimo_login,
          equipe_id,
          equipes(nome_equipe)
        `)
        .eq('user_id', user.id)
        .single();

      if (perfilError) {
        // Se não encontrou em usuarios_internos, tenta em franqueados
        const { data: franqueadoData, error: franqueadoError } = await supabase
          .from('franqueados')
          .select(`
            id,
            nome,
            email,
            telefone,
            foto_perfil,
            tipo,
            created_at
          `)
          .eq('user_id', user.id)
          .single();

        if (franqueadoError) {
          throw new Error('Perfil não encontrado');
        }

        return {
          id: franqueadoData.id,
          nome: franqueadoData.nome,
          email: franqueadoData.email,
          telefone: franqueadoData.telefone ? formatarTelefone(franqueadoData.telefone) : undefined,
          fotoPerfil: franqueadoData.foto_perfil,
          tipo: franqueadoData.tipo,
          dataCriacao: franqueadoData.created_at,
        };
      }

      return {
        id: perfilData.id,
        nome: perfilData.nome,
        email: perfilData.email,
        telefone: perfilData.telefone ? formatarTelefone(perfilData.telefone) : undefined,
        fotoPerfil: perfilData.foto_perfil,
        perfil: perfilData.perfil,
        equipe_nome: Array.isArray(perfilData.equipes) && perfilData.equipes.length > 0 
          ? perfilData.equipes[0].nome_equipe 
          : undefined,
        dataCriacao: perfilData.created_at,
        ultimoLogin: perfilData.ultimo_login,
      };

    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      throw error;
    }
  }

  // Atualizar dados pessoais
  static async atualizarDadosPessoais(dados: EditarDadosPessoaisData): Promise<UpdatePerfilResponse> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // Limpar telefone para salvar apenas números no banco
      const telefoneNumerico = dados.telefone ? limparNumeros(dados.telefone) : null;

      // Primeiro, tenta atualizar na tabela usuarios_internos
      const { data: internData, error: internError } = await supabase
        .from('usuarios_internos')
        .update({
          nome: dados.nome,
          telefone: telefoneNumerico,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (internError) {
        // Se não encontrou em usuarios_internos, tenta em franqueados
        const { data: franqData, error: franqError } = await supabase
          .from('franqueados')
          .update({
            nome: dados.nome,
            telefone: telefoneNumerico,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .select()
          .single();

        if (franqError) {
          throw new Error('Erro ao atualizar dados pessoais');
        }

        // Atualizar email no auth se for diferente
        if (dados.email !== user.email) {
          const { error: emailError } = await supabase.auth.updateUser({
            email: dados.email,
          });

          if (emailError) {
            throw new Error('Erro ao atualizar email');
          }
        }

        return {
          success: true,
          message: 'Dados atualizados com sucesso!',
          data: {
            id: franqData.id,
            nome: franqData.nome,
            email: dados.email,
            telefone: telefoneNumerico ? formatarTelefone(telefoneNumerico) : undefined,
            tipo: franqData.tipo,
          },
        };
      }

      // Atualizar email no auth se for diferente
      if (dados.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: dados.email,
        });

        if (emailError) {
          throw new Error('Erro ao atualizar email');
        }
      }

      return {
        success: true,
        message: 'Dados atualizados com sucesso!',
        data: {
          id: internData.id,
          nome: internData.nome,
          email: dados.email,
          telefone: telefoneNumerico ? formatarTelefone(telefoneNumerico) : undefined,
          perfil: internData.perfil,
        },
      };

    } catch (error) {
      console.error('Erro ao atualizar dados pessoais:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  // Alterar senha
  static async alterarSenha(dados: AlterarSenhaData): Promise<UpdateSenhaResponse> {
    try {
      // Verificar senha atual fazendo login
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar a senha atual tentando fazer signIn
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: dados.senhaAtual,
      });

      if (loginError) {
        throw new Error('Senha atual incorreta');
      }

      // Atualizar a senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: dados.novaSenha,
      });

      if (updateError) {
        throw new Error('Erro ao alterar senha');
      }

      return {
        success: true,
        message: 'Senha alterada com sucesso!',
      };

    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  // Upload de foto de perfil
  static async uploadFotoPerfil(file: File): Promise<UploadFotoResult> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/perfil-${Date.now()}.${fileExt}`;

      // Upload do arquivo
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error('Erro ao fazer upload da imagem');
      }

      // Obter URL pública
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(uploadData.path);

      // Atualizar referência na tabela do usuário
      await this.atualizarFotoPerfilBanco(publicUrlData.publicUrl, user.id);

      return {
        url: publicUrlData.publicUrl,
        path: uploadData.path,
      };

    } catch (error) {
      console.error('Erro no upload da foto:', error);
      throw error;
    }
  }

  // Atualizar referência da foto no banco
  private static async atualizarFotoPerfilBanco(fotoUrl: string, userId: string): Promise<void> {
    // Tentar atualizar em usuarios_internos primeiro
    const { error: internError } = await supabase
      .from('usuarios_internos')
      .update({ foto_perfil: fotoUrl })
      .eq('user_id', userId);

    if (internError) {
      // Se não encontrou em usuarios_internos, tenta em franqueados
      const { error: franqError } = await supabase
        .from('franqueados')
        .update({ foto_perfil: fotoUrl })
        .eq('user_id', userId);

      if (franqError) {
        throw new Error('Erro ao atualizar foto no banco de dados');
      }
    }
  }

  // Remover foto de perfil
  static async removerFotoPerfil(): Promise<void> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // Remover referência do banco
      await this.atualizarFotoPerfilBanco('', user.id);

      // TODO: Remover arquivo do storage se necessário
      // Isso pode ser feito posteriormente com uma limpeza periódica

    } catch (error) {
      console.error('Erro ao remover foto:', error);
      throw error;
    }
  }
}