# Prompt Vault - Extensão para Chrome

## Como Instalar Manualmente

1. Faça o download de todos os arquivos deste projeto para uma pasta no seu computador.
2. Certifique-se de que a estrutura de arquivos está assim:
   - manifest.json
   - popup.html/css/js
   - options.html/css/js
   - background.js
   - content.js
   - utils.js
   - **Ícones**: Removi a obrigatoriedade de ícones no `manifest.json` para que você consiga carregar a extensão imediatamente sem erros. O Chrome usará um ícone padrão. Se quiser adicionar os seus, basta criar a pasta `icons` com os arquivos PNG e atualizar o manifesto.
3. Abra o Google Chrome e acesse `chrome://extensions/`.
4. Ative o **Modo do desenvolvedor** no canto superior direito.
5. Clique em **Carregar sem compactação** (Load unpacked).
6. Selecione a pasta onde você salvou os arquivos.
7. A extensão aparecerá na sua barra de ferramentas!

## Arquitetura do Projeto

- **manifest.json**: Configurações da extensão, permissões e declaração de arquivos.
- **utils.js**: Núcleo de lógica de dados. Centraliza o acesso ao `chrome.storage.local`, extração de variáveis e manipulação de strings. É importado tanto no popup quanto nas opções e no background.
- **background.js**: Service worker que roda em segundo plano. Gerencia o menu de contexto (botão direito) para capturar prompts de qualquer site.
- **popup.js/html/css**: Interface rápida que aparece ao clicar no ícone. Focada em busca rápida, filtragem por domínio e preenchimento de variáveis dinâmicas.
- **options.js/html/css**: Interface completa de gerenciamento. Permite edição detalhada, exclusão, duplicação e importação/exportação de dados.
- **content.js**: Script injetado nas páginas para possíveis integrações futuras (como botões dentro do ChatGPT).

## Próximas Melhorias Sugeridas

1. **Sincronização em Nuvem**: Integrar com Firebase ou Supabase para manter prompts sincronizados entre diferentes computadores.
2. **Atalhos de Teclado**: Permitir abrir o popup ou copiar o último prompt usado via comandos de teclado.
3. **Pastas Aninhadas**: Melhorar a organização para usuários com centenas de prompts.
4. **Integração Direta**: Adicionar um botão "Vault" diretamente na interface do ChatGPT, Claude e Gemini para inserir prompts com um clique.
5. **IA Integrada**: Usar a API do Gemini para sugerir melhorias nos prompts salvos ou gerar variações automaticamente.
