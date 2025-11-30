# TVUSVET - Sistema de Laudos Veterinários

Sistema desktop _offline-first_ para gestão de pacientes e emissão de laudos de ultrassonografia veterinária. Desenvolvido para oferecer agilidade, funcionamento sem internet e backup local seguro.

## 🚀 Tecnologias Principais

* **Frontend:** React 19, Tailwind CSS, Shadcn/UI.
* **Desktop Engine:** Electron + Capacitor.
* **Banco de Dados:** Local (IndexedDB via `idb-keyval`).
* **Documentos:** Geração de PDF (nativo via CSS Print) e DOCX (`docx` library).

## 🛠️ Como Rodar o Projeto

### Pré-requisitos
* Node.js (v18 ou superior)
* NPM

### Passo a Passo

1.  **Instalar dependências:**
    ```bash
    cd frontend
    npm install
    ```

2.  **Rodar em modo Desenvolvimento (Browser):**
    ```bash
    npm start
    ```
    _Acesse http://localhost:3000_

3.  **Rodar em modo Desktop (Electron):**
    ```bash
    npm run electron:dev
    ```

4.  **Gerar Executável (Build):**
    ```bash
    npm run electron:build
    ```
    _O executável será gerado na pasta `frontend/dist`._

## 📂 Estrutura de Pastas

* `frontend/src/components`: Componentes UI reutilizáveis (botões, inputs, cards).
* `frontend/src/pages`: Telas principais (Home, Exame, Configurações).
* `frontend/src/services`: Lógica de banco de dados (`database.js`) e tradução.
* `frontend/src/lib`: Utilitários e definições de tipos de exames.
* `docs/`: Documentação técnica detalhada.

## 📚 Documentação Técnica

Para entender a fundo como o sistema funciona, consulte:

* [Arquitetura do Sistema](docs/ARQUITETURA.md): Detalhes sobre o banco de dados local e sistema de impressão.
* [Guia de Desenvolvimento](docs/GUIA_DEV.md): Como criar novos tipos de exames e padrões de código.

---
**TVUSVET** - Desenvolvido por Hebert Albernaz Junior.
