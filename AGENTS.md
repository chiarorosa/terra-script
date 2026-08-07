# Diretrizes de UI e Design - TerraScript

## Regra de Ouro: Proibição Estreita de Emojis
- **NUNCA** utilize emojis Unicode na interface do usuário, em modals, menus, botões, headers ou mensagens.
- Quando forem necessários ícones gráficos:
  1. Utilize ícones **Lucide React** (`lucide-react`) para controles de UI, menus e botões funcionais.
  2. Utilize componentes em **Pixel Art** do próprio jogo (ex: `PixelResourceIcon`, `PixelGiftIcon`, `GameLogo`) para recursos, itens e elementos do mundo.

## Processo Obrigatório de Versionamento e Migrações SQL
- **Migrações SQL Incrementais**: Nunca altere o schema base de versões estáveis (como `schema_v280.sql`). Toda alteração ou recurso que exija suporte no Supabase deve gerar um arquivo de migração SQL incremental separado (ex: `src/db/migration_v281.sql`) para ser executado no SQL Editor.
- **Sincronização Integrada de Versão da Engine**:
  1. **Versão Local (`src/version.ts`)**: Atualizar a constante `GAME_ENGINE_VERSION`.
  2. **Versão no Supabase (`migration_vXXX.sql`)**: Incluir o `INSERT ... ON CONFLICT DO UPDATE` atualizando a chave `'game_engine_version'` na tabela `terrascript_config`.
  3. **Changelog do Jogo (`src/data/changelogData.ts`)**: Adicionar o registro de lançamento com título e lista de alterações detalhadas.
- **Linguagem dos Changelogs (Segurança e Anti-Exploit)**: No changelog (`src/data/changelogData.ts`), NUNCA descreva nomes de variáveis internas, constantes de sistema, schemas/tabelas de banco de dados ou detalhes de guardrails/regras anti-fraude. As notas de lançamento devem focar exclusivamente na experiência do jogador, recursos visuais e melhorias de gameplay, sem expor detalhes técnicos de infraestrutura ou mecânicas internas que possam sugerir exploits.

