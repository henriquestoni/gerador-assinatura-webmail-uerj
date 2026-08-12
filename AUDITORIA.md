# Auditoria: ponto de partida

Documento preparado para quem for auditar o projeto, humano ou automático. Descreve o que existe, o que já foi corrigido, onde estão as partes frágeis e o que precisa ser testado. Versão auditada: **beta 13**.

## 1. Escopo

Aplicação de página única, sem servidor, sem build e sem dependências. Três arquivos:

| Arquivo | Linhas | Responsabilidade |
| --- | --- | --- |
| `index.html` | ~170 | estrutura, textos de ajuda, metadados e dados estruturados |
| `estilo.css` | ~200 | apresentação |
| `assinatura.js` | ~1.040 | campos, matriz, arraste, histórico, validação e geração do HTML |

O comportamento esperado de cada controle está no `README.md` e não se repete aqui.

## 2. Arquitetura, em uma passada

- `defs` descreve os campos; `DEFS_BASE` guarda a lista original para recriar o que for apagado; `porId` indexa por identificador.
- `PADRAO` é a disposição inicial, um vetor de linhas contendo identificadores.
- A matriz é DOM puro: `.matriz > .linha > .tile`, mais `.entre` (faixas de soltura) e `.rodapeMatriz` (barra fixa, sempre o último filho).
- `disposicao()` lê o DOM e devolve o vetor de linhas; `aplicar(disp)` faz o caminho inverso, movendo blocos, nunca recriando, salvo quando o campo não existe mais.
- Histórico: `estadoAtual()` serializa campos, marcações, disposição, logotipo, cor, espessura e títulos; `aplicarEstado()` reconstrói. Digitação entra com atraso de 350 ms (`registrar`), ações indivisíveis entram na hora (`registrarAgora`).
- `gerar()` monta a tabela final; `corpoHTML()` monta as linhas do texto.

## 3. Defeitos já corrigidos, com atenção a regressões

Cada item abaixo já quebrou uma vez. Vale testar de novo a cada mudança.

1. `setPointerCapture` na alça cancelava o arrasto ao mover o bloco no DOM; hoje os ouvintes ficam no documento.
2. Restaurar padrões limpava as linhas com `innerHTML`, destruindo blocos e derrubando o arrasto.
3. Ao cruzar várias faixas durante o arrasto, cada uma abria uma linha, acumulando vazias.
4. Reordenar a matriz durante a digitação tirava o foco do campo.
5. `requestIdleCallback` recebia número em vez de objeto e lançava exceção, interrompendo a inicialização.
6. Desfazer não removia campos criados depois, deixando blocos órfãos e embaralhando a disposição.
7. `.modal{display:flex}` vencia `.hide`, deixando o diálogo aberto ao carregar.
8. `button.sec` vencia `button:disabled`, deixando botão desabilitado branco.
9. Cópia dizia "copiado" mesmo quando `execCommand` devolvia falso, e apagava os dados em seguida.

## 4. Pontos frágeis conhecidos

- **Chaves dinâmicas por convenção.** Campos livres criados depois usam identificadores `livre2`, `livre3`, e o código os reconhece por expressão regular `/^livre\d+$/`. Renomear o campo original `livre` quebra a recriação no desfazer.
- **Elementos por `id` global.** Cada campo cria `id`, `t_id`, `b_id`, `c_id`, `m_id`, `w_id`. Não há prefixo de espaço de nomes; colisão com qualquer `id` do HTML derruba a lógica.
- **Estado repartido.** Parte vive no DOM (disposição, marcações), parte em variáveis (`logoEscolhido`, `exemplo`, `contadorLivre`). `estadoAtual()` precisa acompanhar toda variável nova, senão o desfazer fica incompleto.
- **`compactar()` roda dentro de `atualizar()`**, que é chamada em quase tudo. Há uma guarda para não reorganizar enquanto se digita ou arrasta; mexer nessa guarda tende a produzir perda de foco ou linhas fantasmas.
- **Ordem de declaração.** O arquivo executa código no meio do módulo (monta a matriz antes de várias funções). Já houve três erros de zona morta temporal com `const`/`let`. Novas constantes precisam ficar no topo.
- **Verificação de logotipos** depende de `localStorage`; em navegação anônima com armazenamento bloqueado, os testes acontecem a cada carga. O `try/catch` cobre a exceção, mas convém confirmar.
- **Sem testes automatizados no repositório.** A verificação tem sido feita com jsdom, fora do projeto.

## 5. Verificações sugeridas

### Geração do HTML

- Tabela balanceada, linha única, sem `\n`, sem campo vazio produzindo linha ou espaço.
- `colspan` coerente nos três cenários: com barra, sem barra (espessura 0) e sem logotipo.
- Escape: digitar `<b>x</b>`, `"` e `&` em todos os campos e conferir que sai literal.
- Link de WhatsApp só com celular válido; telefone fixo nunca vira link.
- Caixa alta afeta a saída, não o valor digitado.

### Matriz e arraste

- Arrastar com mouse, com toque e pelo teclado (foco na alça, setas).
- Soltar em faixa entre linhas cria uma linha só, mesmo cruzando várias.
- Linha que esvazia é removida, não empurrada para o fim.
- Máximo de três blocos por linha respeitado em todos os caminhos.
- Nome sempre na primeira posição da primeira linha.

### Histórico

- Sequência longa de operações, desfazer até o início e refazer até o fim, comparando disposição e conteúdo.
- Criar campo livre, apagar a linha, desfazer duas vezes: o campo volta com título e conteúdo.
- Ctrl+Z e Ctrl+Shift+Z fora e dentro de campos de texto.

### Restauração

- Cada opção isolada e a combinação "Restaurar tudo".
- Após restaurar, o botão precisa ficar desabilitado.
- Cancelar, Esc e clique fora não alteram nada.

### Cópia

- Falha da área de transferência não pode apagar dado algum.
- "Copiar e recomeçar" preserva títulos de campos livres, marcações e disposição.

### Acessibilidade

- Navegação completa por teclado, incluindo o diálogo com foco preso e devolvido.
- Leitor de tela: nomes acessíveis dos campos, avisos com `aria-live`.
- Contraste dos textos pequenos e dos controles de linha.

### Compatibilidade

- Chrome, Edge, Firefox e Safari, além de um navegador móvel para o arraste por toque.
- Assinatura colada no webmail da Uerj, no Outlook e no Gmail, com e sem carregamento de imagens.

## 6. Perguntas em aberto

- Vale hospedar os logotipos em endereço institucional garantido, em vez de depender de três domínios distintos da Uerj?
- O limite de três blocos por linha e de catorze linhas atende, ou convém tornar configurável?
- Guardar rascunho no navegador, em `sessionStorage`, seria útil ou traria risco de dado pessoal esquecido na máquina?

## 7. Como reproduzir o ambiente de teste

Não há instalação. Para os testes automatizados que foram usados até aqui:

```bash
npm install jsdom
node script-de-teste.js
```

O padrão adotado foi carregar o `index.html` com jsdom, avaliar o `assinatura.js` no mesmo contexto, simular eventos e comparar a disposição resultante.
