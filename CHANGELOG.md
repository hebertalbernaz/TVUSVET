# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Não Lançado] - Trabalho Atual

### Adicionado (Added)
- **Documentação**: Nova estrutura de documentação na pasta `docs/` (Arquitetura e Guia de Desenvolvimento).
- **Paciente**: Restaurado o campo de seleção de **Porte** (Pequeno, Médio, Grande) no formulário de cadastro/edição.
- **Exame**: Funcionalidade de "Restaurar Imagem Original" na edição de imagens.
- **Backup**: Opção de exportar/importar backup criptografado (.enc) nas Configurações.

### Corrigido (Fixed)
- **PDF/Impressão**: Corrigido bug onde o PDF saía em branco ou desconfigurado. Foi adicionada a importação do `print.css` na `ExamPage`.
- **Cache**: Adicionado script no `index.js` para remover Service Workers antigos e forçar atualização da aplicação.
- **Configurações**: Corrigido erro no botão de "Importar Backup" que não abria a janela de arquivos (adicionado `useRef`).
- **Assets**: Corrigido caminho de importação do logo (`logo-tvusvet.png`) na Home.

### Alterado (Changed)
- **ExamPage**: Revertido para a versão estável original (removidas alterações experimentais de layout que causavam bugs).
- **Navegação**: Links para "Histórico" e "Galeria" agora abrem em janelas pop-up dedicadas para facilitar o uso em múltiplas telas.

---

## [1.0.0] - Versão Inicial Estável
- Lançamento inicial do sistema TVUSVET.
- Cadastro de Pacientes, Exames e Configurações da Clínica.
- Geração de Laudos em PDF e DOCX.
- Banco de dados local (IndexedDB).