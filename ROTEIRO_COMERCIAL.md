# TVUSVET - Roteiro de Transição Comercial (SaaS & Multi-Especialidade)
**Versão:** 2.0.0
**Status:** Em Desenvolvimento (Fase 1)

## 1. Estratégia de Branching
* `main`: Versão Estável (Offline/Pessoal).
* `develop-v2`: Branch de Integração da V2 (SaaS).
* `feature/*`: Desenvolvimento de novos módulos.

## 2. Arquitetura Híbrida (Local-First)
* **Banco Local:** RxDB (Futuro) / SQLite (Atual).
* **Nuvem:** Firebase/Supabase (Auth + Sync).
* **Segurança:** Criptografia Ponta-a-Ponta para dados sensíveis.

## 3. Checklist de Implementação

### FASE 1: Fundação Conectada (Em Progresso)
- [ ] Configurar Projeto Firebase/Supabase.
- [ ] Criar Contexto de Autenticação (`AuthContext`).
- [ ] Criar Tela de Login (`LoginPage`).
- [ ] Implementar verificação de HWID (Hardware ID).

### FASE 2: Banco de Dados 2.0
- [ ] Migrar `idb-keyval` para RxDB.
- [ ] Criar Schemas JSON (Patients, Exams).
- [ ] Serviço de Sincronização Background.

### FASE 3: Painel Admin & Multi-Tenant
- [ ] Web Admin (React separado).
- [ ] Seletor de Especialidade (Vet/Humano).

### FASE 4: Financeiro & Segurança
- [ ] Dashboard Financeiro Local.
- [ ] Ofuscação de Código.