# Guia de Desenvolvimento

## Padrões de Código
* **UI:** Shadcn/UI + Tailwind CSS.
* **Ícones:** Lucide React.
* **Paleta:** Use as variáveis CSS (`bg-primary`, `text-muted-foreground`) em vez de cores fixas (`bg-blue-500`) para garantir compatibilidade com o Tema Rosa/Lilás e Modo Escuro.

## Trabalhando com DICOM (Cornerstone)
O visualizador DICOM é a parte mais sensível do sistema.

### Arquivos Estáticos (Crucial)
O Cornerstone precisa de arquivos "Workers" para decodificar imagens comprimidas (JPEG Lossless, etc.).
Esses arquivos **NÃO** são empacotados pelo Webpack. Eles vivem soltos na pasta `public/`:
1.  `cornerstoneWADOImageLoaderWebWorker.min.js`
2.  `cornerstoneWADOImageLoaderCodecs.min.js`

**Regra de Ouro:** Se atualizar a versão do `cornerstone-wado-image-loader` no `package.json`, você **DEVE** baixar manualmente os arquivos JS dessa nova versão e substituí-los na pasta `public/`. Se as versões não baterem, o visualizador ficará carregando eternamente.

## Adicionando Novos Tipos de Exame
1.  Edite `src/lib/exam_types.js`.
2.  Adicione a configuração no objeto `EXAM_TYPES`.
3.  Atualize a função `getReportTitle` em `ExamPage.js` se o novo exame precisar de um título específico no laudo (ex: "Relatório Neurológico").

## Build e Deploy
Para gerar a versão desktop (Electron):
1.  `npm run build` (Gera o bundle React)
2.  `npm run electron:build` (Empacota o .exe)