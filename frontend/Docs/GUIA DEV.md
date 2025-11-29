# Guia de Desenvolvimento

## Padrões de Código

### Componentes (UI)
Utilizamos a biblioteca **Shadcn/UI** (baseada em Radix UI e Tailwind).
* Sempre importe componentes de `@/components/ui/...`.
* Não crie estilos CSS globais se puder usar classes do Tailwind (ex: `p-4 bg-white rounded`).

### Ícones
Utilizamos **Lucide React**.
* Importe apenas os ícones necessários: `import { Save, User } from 'lucide-react'`.

## Como Adicionar um Novo Tipo de Exame

Os tipos de exames (ex: Ultrassom Abdominal, Cardiológico) não estão "hardcoded" nas páginas, mas sim definidos em um arquivo de configuração.

1.  Abra `frontend/src/lib/exam_types.js`.
2.  Adicione a nova entrada no array ou objeto de configuração.
3.  Defina:
    * `id`: Identificador único (ex: `ultrasound_cardio`).
    * `name`: Nome visível.
    * `structures`: Lista de órgãos/estruturas que compõem este exame.

Ao fazer isso, a página de Exame (`ExamPage.js`) irá gerar automaticamente os campos de texto e medidas para as novas estruturas.

## Fluxo de Trabalho (Git)
1.  Nunca commite diretamente na `main` se estiver trabalhando em equipe.
2.  Crie uma branch: `git checkout -b feature/novo-recurso`.
3.  Teste o build antes de enviar: `npm run build`.