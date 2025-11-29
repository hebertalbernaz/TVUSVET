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