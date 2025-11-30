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

# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.1.0] - Atualização "Mini-Workstation" e UI - 2024-11-30

### Adicionado (Added)
- **Suporte a DICOM (Mini-Workstation):**
  - Visualizador nativo integrado (Cornerstone.js) com ferramentas de Zoom (Scroll), Pan (Arrastar) e Janelamento (Brilho/Contraste).
  - Suporte a arquivos `.dcm` e arquivos sem extensão (detecção via Magic Bytes).
  - Decodificadores (Codecs) locais para abrir imagens comprimidas (JPEG Lossless) sem internet.
  - Extração automática de metadados (Worklist) ao importar exames.
- **Gestão de Perfis (Multi-Empresa):**
  - Sistema para criar, editar e trocar perfis de atendimento (Clínicas diferentes).
  - Cada perfil salva seu próprio Logo, Assinatura, Endereço e Dados do Veterinário.
  - Seletor rápido de perfil na Página Inicial.
- **Backup Simplificado:**
  - Nova opção "Sincronizar Textos" que gera um JSON leve apenas com Templates e Referências para facilitar o compartilhamento via Google Drive/Email.
- **Galeria Externa:** Nova página de galeria (`/gallery`) com suporte a visualização DICOM em tela cheia.

### Alterado (Changed)
- **Interface (UI/UX):**
  - Nova identidade visual **"Rose & Lilac"** (Tons de Rosa/Lilás e Cinza).
  - Modo Escuro (Dark Mode) totalmente refatorado para melhor contraste e conforto visual.
  - Componentes padronizados (Botões, Cards, Inputs) usando Shadcn/UI.
- **Relatórios (Output):**
  - **Títulos Dinâmicos:** O sistema agora escreve "Relatório Ecocardiográfico", "Radiográfico", etc., automaticamente baseado no tipo de exame.
  - **Paridade DOCX/PDF:** O gerador de Word foi reescrito para ficar visualmente idêntico ao PDF (Tabelas de cabeçalho, caixas de paciente, assinatura no rodapé).
  - **Impressão Inteligente:** O PDF agora ignora arquivos DICOM brutos (evitando imagens quebradas) e imprime apenas imagens estáticas (JPG/PNG).
- **Config