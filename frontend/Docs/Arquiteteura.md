# Arquitetura do Sistema TVUSVET

## 1. Banco de Dados Local (Offline-First)
O sistema não utiliza um servidor backend tradicional. Todos os dados são salvos localmente no computador do usuário utilizando o navegador/Electron como hospedeiro.

* **Tecnologia:** `idb-keyval` (Wrapper para IndexedDB).
* **Localização:** `frontend/src/services/database.js`.
* **Schema Simplificado:**
    * `patients`: Array de objetos de pacientes.
    * `exams`: Array de exames vinculados por `patient_id`.
    * `settings`: Objeto único de configuração global.
    * `images`: As imagens são salvas em Base64 diretamente dentro do objeto do exame (cuidado com performance em exames muito grandes).

> **Nota:** O sistema possui backup/restore via JSON criptografado (`cryptoBackup.js`) para segurança dos dados.

## 2. Sistema de Impressão (PDF)
A geração de PDF não utiliza bibliotecas pesadas de geração de canvas. Ela utiliza o motor de renderização nativo do navegador (Chrome/Electron).

* **Arquivo Chave:** `frontend/src/print.css`.
* **Funcionamento:**
    1.  O CSS define `@media print`.
    2.  Esconde toda a interface (`.no-print`, menus, botões).
    3.  Exibe apenas a `div#printable-report` que fica oculta durante a navegação normal.
    4.  Ao clicar em "Imprimir/PDF", o comando `window.print()` é acionado.

**Atenção:** Se o PDF sair em branco ou com a interface do programa, verifique se o `print.css` foi importado corretamente na página.

## 3. Integração Desktop (Electron)
O Electron atua apenas como um "casco" para rodar a aplicação React como um programa nativo.
* **Entrada:** `public/electron.js`.
* O React não sabe que está no Electron, exceto por algumas configurações de arquivo local.

# Arquitetura do Sistema TVUSVET (v1.1)

## 1. Banco de Dados Local (IndexedDB)
O sistema utiliza `idb-keyval` para persistência local.
* **Schema Atualizado:**
    * `profiles`: Array de objetos contendo configurações de clínicas (Logo, Endereço, Assinatura).
    * `settings`: Agora armazena `active_profile_id` para saber qual empresa está logada.
    * `exams`: As imagens agora possuem um campo `mimeType`. Se for `application/dicom`, o sistema ativa o Cornerstone.

## 2. Processamento de Imagens e DICOM
O sistema utiliza uma arquitetura híbrida para lidar com imagens leves e pesadas.

* **Imagens Comuns (JPG/PNG):**
    * Renderizadas via tag `<img>` padrão.
    * Editadas via `ImageEditor.js` (Canvas/Konva).
    * Impressas normalmente no PDF/DOCX.

* **Imagens Médicas (DICOM):**
    * **Detecção:** Via extensão `.dcm` ou leitura de "Magic Bytes" (cabeçalho `DICM` nos bytes 128-131) para arquivos sem extensão.
    * **Renderização:** Utiliza `Cornerstone.js`.
    * **Decodificação:** Utiliza **Web Workers** hospedados na pasta `public/`. Isso retira o processamento pesado da thread principal do React, evitando travamentos.
    * **Impressão:** Imagens DICOM são ignoradas na geração de laudos impressos (PDF/DOCX) pois não são estáticas. O usuário deve capturar "Snapshots" (futura feature) se quiser imprimir.

## 3. Sistema de Perfis (Multi-Tenant Local)
Para suportar profissionais volantes, o sistema implementa uma lógica de "Hot-Swap" de configurações.
1.  O usuário cria um Perfil.
2.  Ao ativar (`db.activateProfile`), o sistema copia os dados daquele perfil para o objeto global `settings`.
3.  A UI reage às mudanças em `settings`, atualizando cabeçalhos e rodapés instantaneamente.

## 4. Geração de Relatórios
* **PDF:** Utiliza CSS `@media print`. O layout é controlado por `src/print.css`. Margens são zeradas (`@page { margin: 0 }`) para remover cabeçalhos do navegador e controladas via `padding` no container.
* **DOCX:** Utiliza a biblioteca `docx`. Foi implementada uma lógica de tabelas invisíveis para alinhar o cabeçalho (Logo à esquerda, Texto à direita) de forma idêntica ao PDF.