# **Contexto Geral e Visão do Projeto: Central de Cobrança Automatizada**

## Histórico e Evolução

O projeto iniciou com a necessidade de otimizar a cobrança de royalties e insumos de mais de 700 unidades da franquia Cresci e Perdi. A abordagem inicial era baseada na importação de planilhas e no uso de ferramentas de automação externas como N8N e Make para disparar mensagens.

Ao longo da conceituação, o projeto evoluiu significativamente, pivotando para uma solução muito mais robusta, autônoma e inteligente. A decisão foi **recomeçar do zero** para construir um sistema proprietário, eliminando dependências externas para a lógica de negócio e introduzindo um **agente de Inteligência Artificial (IA)** como peça central do processo.

## Visão Final

O objetivo é criar uma **Central de Contas a Receber e Cobrança 100% autônoma**, onde quase 90% do ciclo de vida da cobrança — desde a emissão do boleto até a negociação e quitação — seja gerenciado pelo sistema, com a IA atuando como o principal ponto de contato com os franqueados. A intervenção humana será sob demanda, agendada e orquestrada pela própria IA, garantindo eficiência, padronização e rastreabilidade total.

## Pilares do Sistema

1. **Agente de IA Autônomo:** Um agente baseado em modelos da OpenAI (ou similar) que negocia, emite boletos, agenda reuniões e responde a dúvidas, seguindo regras de negócio estritas.
2. **Arquitetura Interna Robusta:** Backend próprio (Node.js/Python), banco de dados PostgreSQL com capacidades vetoriais (`pgvector`), e uma fila de tarefas para gerenciar agendamentos e processos assíncronos.
3. **Integrações-Chave:**
    * **Asaas:** Para emissão, segunda via e baixa automática de boletos via API e webhooks.
    * **Z-API:** Como gateway para envio e recebimento de mensagens no WhatsApp.
    * **Google Calendar:** Para verificação de disponibilidade e agendamento de reuniões com a equipe humana.
4. **Base de Conhecimento Viva (RAG):** Uma base de dados interna que alimenta a IA com políticas, manuais, e dados em tempo real sobre as cobranças, permitindo respostas contextuais e precisas.
5. **Portais de Acesso:** Interfaces distintas e seguras para a equipe de Cobrança/Admin, Jurídico e para o Franqueado (autoatendimento).

---

## 1. Lógica de Negócio

### Ciclo de Vida da Cobrança

1. **Emissão:** O sistema, com base nos contratos cadastrados, gera as cobranças (royalties, taxas) via **Asaas API** em datas pré-definidas.
2. **Pré-Vencimento:** A régua de comunicação inicia com lembretes amistosos.
3. **Inadimplência Detectada:** No dia seguinte ao vencimento, o webhook do Asaas (ou uma verificação diária) ativa o processo de cobrança. O sistema calcula juros e multa automaticamente.
4. **Primeiro Contato (IA):** O Agente de IA envia a primeira notificação via Z-API, já com o valor atualizado e um link para o portal do franqueado.
5. **Negociação (IA):** Se o franqueado responde, a IA inicia a negociação, oferecendo opções configuradas (desconto à vista, parcelamento).
6. **Acordo e Pagamento (IA):** Ao aceitar uma proposta, a IA aciona a API do Asaas para gerar os novos boletos/links de pagamento e os envia ao franqueado.
7. **Acompanhamento (IA):** A IA monitora os pagamentos (via webhooks do Asaas) e envia lembretes para as parcelas do acordo.
8. **Escalonamento para Humano (IA):** Se o franqueado solicitar, ou se a negociação falhar, a IA consulta o **Google Calendar** da equipe, propõe horários e agenda a reunião, movendo o caso para o Kanban da equipe.
9. **Escalonamento Jurídico (Automático):** Após N tentativas sem sucesso ou quebra de acordo, o sistema move o caso para o painel jurídico e gera uma notificação formal.
10. **Quitação:** O webhook do Asaas confirma o pagamento final. O sistema atualiza o status para "Quitado", encerra o caso e envia uma mensagem de confirmação.

### Base de Conhecimento (RAG)

* **Alimentação:** Qualquer registro no sistema (unidade, cobrança, notificação, acordo) terá um botão **"Enviar para a Base de Conhecimento da IA"**. Isso transforma dados estruturados em texto para o RAG.
* **Categorias:** Políticas de Cobrança, Contratos, Procedimentos, Jurídico, Manuais, FAQ, etc.
* **Uso:** A IA consulta esta base antes de responder, garantindo que suas informações estejam sempre atualizadas com as últimas ações do sistema e políticas da empresa.

---

## 2. Schemas das Tabelas (Estrutura do Banco de Dados - Supabase/PostgreSQL)

| Tabela | Campos Principais | Descrição |
| :--- | :--- | :--- |
| **unidades** | `id`, `codigo`, `nome_padrao`, `cnpj`, `endereco`, `ativo` | Dados mestres da unidade, sincronizados com o Central GiraBoti. |
| **franqueados**| `id`, `nome`, `cpf_rnm`, `email`, `telefone`, `principal` | Dados pessoais dos franqueados. |
| **unidade_franqueado** | `unidade_id`, `franqueado_id`, `tipo_vinculo` | Tabela de junção para múltiplos franqueados por unidade. |
| **contratos_unidade**| `id`, `unidade_id`, `tipo_taxa`, `valor`, `dia_vencimento`| Regras de faturamento fixas por unidade. |
| **cobrancas** | `id`, `unidade_id`, `valor_original`, `data_venc`, `status` | Registro de cada débito, seja ele gerado automaticamente ou manualmente. |
| **acordos** | `id`, `unidade_id`, `valor_total`, `parcelas`, `status` | Formalização de negociações, com link para o termo em PDF. |
| **parcelas** | `id`, `acordo_id`, `valor`, `data_venc`, `status`, `asaas_id`| Detalhamento de cada parcela de um acordo. |
| **mensagens** | `id`, `unidade_id`, `canal`, `direcao`, `conteudo`, `ia_agent`| Log de toda a comunicação via WhatsApp/Email. |
| **eventos_agenda** | `id`, `unidade_id`, `data_hora`, `status`, `google_event_id`| Registro de reuniões agendadas pela IA ou manualmente. |
| **kb_docs** | `id`, `categoria`, `fulltext`, `embedding` (vetor)| A Base de Conhecimento da IA, com embeddings para busca semântica. |
| **audit_logs** | `id`, `user_id/ia`, `entidade`, `acao`, `antes`, `depois`| Tabela de auditoria para todas as ações críticas do sistema. |
| **usuarios** | `id`, `nome`, `email`, `role`, `ativo` | Usuários internos do sistema com seus respectivos papéis. |

---

## 3. Interface, Layout e Funcionalidades (UI/UX)

### Estrutura Visual Geral

* **Painel Lateral Fixo:** Com navegação clara entre os módulos.
* **Layout Limpo e Profissional:** Inspirado em sistemas SaaS modernos.
* **Responsividade:** Foco em desktop e tablets.

### Portais de Acesso

1. **Painel Admin/Cobrança:**
    * **Dashboard:** KPIs centrais (inadimplência, recuperação), alertas de risco, agenda do dia.
    * **Kanban de Cobrança:** Visão visual do ciclo de vida de cada unidade inadimplente.
    * **Módulo de Unidades e Franqueados:** CRUD completo, com visão 360° de cada unidade.
    * **Chat ao Vivo:** Timeline das conversas da IA com franqueados, com opção de "takeover" humano.
    * **Módulos Jurídico, Relatórios e Configurações.**
2. **Portal do Franqueado:**
    * Acesso seguro (login por CNPJ + token).
    * Visualização apenas dos seus débitos.
    * Opções de autoatendimento: aceitar propostas da IA, gerar 2ª via de boleto, solicitar nova data, baixar comprovantes.

---

## 4. O Que Queremos Obter (Objetivo Final)

* Automatizar 90% do processo de cobrança, liberando a equipe humana para casos estratégicos.
* Reduzir a taxa de inadimplência da rede em pelo menos 30% no primeiro ano.
* Centralizar toda a comunicação e o histórico de cobrança em uma única plataforma.
* Garantir compliance jurídico e padronização em todas as negociações.
* Oferecer uma experiência de cobrança mais fluida e menos conflituosa para o franqueado.

---

## 5. Regras de Qualidade (O Que Não Deve Ser Feito)

* **Não depender de lógicas em ferramentas externas:** Toda a regra de negócio reside no backend.
* **A IA não deve ter autonomia para criar políticas:** Ela apenas executa as regras configuradas no painel.
* **Não deve haver dados "órfãos":** Toda cobrança, mensagem e acordo deve estar vinculado a uma unidade.
* **A interface não pode ser poluída:** A informação deve ser clara e direta, focada na ação.
* **Não deve haver valores hard-coded:** Juros, multas, prazos e textos de mensagem devem ser 100% configuráveis.
* **A segurança não é opcional:** Implementar RLS (Row-Level Security) no Supabase/Postgres para garantir que cada usuário/franqueado veja apenas seus próprios dados.

---

## 6. Métricas de Sucesso

* **Taxa de Recuperação:** % de valor recuperado sobre o total em aberto.
* **Tempo Médio de Resolução:** Dias entre o vencimento e a quitação.
* **% de Resolução pela IA:** % de casos resolvidos sem intervenção humana.
* **Taxa de Adoção do Portal do Franqueado:** % de franqueados que utilizam o autoatendimento.
* **NPS (Net Promoter Score) do Processo de Cobrança:** Medir a satisfação do franqueado com a nova abordagem.

---

## 7. Plano de Implementação (Roadmap Sugerido)

### Fase 1: Fundação e Núcleo de Cobrança (4-6 semanas)

* **Backend:** Estrutura das tabelas principais no Supabase/Postgres.
* **Cadastros:** CRUD de Unidades, Franqueados e Contratos.
* **Integração Asaas:** Emissão de boletos e webhook de pagamento.
* **Régua Básica:** Jobs para cálculo de juros/multa e mudança de status.
* **UI:** Telas de cadastro e painel de listagem de cobranças.
* **MVP do Portal do Franqueado:** Apenas para visualização de débitos e geração de 2ª via.

### Fase 2: Inteligência Artificial e Automação (6-8 semanas)

* **Agente de IA:** Integração com OpenAI/Bedrock, implementação de `tool calling`.
* **Integração Z-API:** Webhooks de entrada/saída para conversas no WhatsApp.
* **Chat ao Vivo:** Tela para visualização das conversas da IA.
* **Base de Conhecimento:** Implementação do RAG com `pgvector`.
* **Negociação Automatizada:** IA oferece propostas e gera acordos e parcelas no Asaas.
* **UI:** Expansão do Portal do Franqueado com negociação.

### Fase 3: Gestão Avançada e Jurídico (4-6 semanas)

* **Integração Google Calendar:** Agendamento de reuniões pela IA.
* **Kanban de Cobrança:** Interface visual para gestão do ciclo.
* **Módulo Jurídico:** Escalonamento automático e geração de notificações formais.
* **Relatórios Estratégicos:** Dashboards consolidados para a diretoria.
* **Auditoria:** Logs completos de todas as ações.
* **UI:** Finalização de todos os painéis de gestão.

### Pós-Lançamento (Contínuo)

* Monitoramento da performance da IA e otimização de prompts.
* Treinamento da equipe de cobrança para usar a ferramenta.
* Coleta de feedback dos franqueados e iteração sobre os portais.
