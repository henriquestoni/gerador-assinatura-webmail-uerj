# Auditoria: ponto de partida

Documento preparado para quem for auditar o projeto, humano ou automático. Descreve o que existe, o que já foi corrigido, onde estão as partes frágeis e o que precisa ser testado. Versão auditada: **1**.

## 1. Escopo

Aplicação de página única, sem servidor, sem build e sem dependências em produção. Arquivos:

| Arquivo | Linhas | Responsabilidade |
| --- | --- | --- |
| `index.html` | ~210 | estrutura, textos de ajuda, metadados e dados estruturados |
| `estilo.css` | ~240 | apresentação |
| `assinatura.js` | ~1.610 | campos, titulação, matriz, cadeado, arraste, títulos, histórico, validação, expurgo e geração do HTML |
| `testes/` | ~1.230 | bateria em jsdom; única parte com dependência (`jsdom`) |

O comportamento esperado de cada controle está no `README.md` e não se repete aqui.

## 2. Arquitetura, em uma passada

- `defs` descreve os campos; `DEFS_BASE` guarda a lista original para recriar o que for apagado; `porId` indexa por identificador.
- Todo `id` gerado leva o prefixo `PRE` (`asg_`), e o acesso passa por `campo(id)`, `tituloEl(id)` e `marca(k, id)`. O identificador lógico continua sem prefixo, no `dataset.id` do bloco.
- **Cadeado**: mora na classe `travada` da linha. `travada(l)` responde, `travas()` serializa, `aplicarTravas()` reconstrói, `TRAVAS_PADRAO` é o padrão (só a primeira linha). `alvoSubir`/`alvoDescer` decidem para onde uma linha vai, saltando blocos travados; `pontoDeInsercao()` diz onde o rodapé cria. Nenhuma outra parte do código deve testar `classList.contains("travada")` diretamente.
- **Títulos**: `formaTitulo()` decide qual forma sai; `partesTitulo()` a reparte em antes, palavra e depois; `escreverTitulo()` aplica maiúscula, caixa alta, negrito e itálico a cada pedaço. As formas moram nas `defs`, em minúsculas, com a palavra que recebe os efeitos entre chaves. `ajustarBotoesTitulo()` desabilita os botões do campo enquanto a automação manda naquela linha.
- **Trechos de vírgula**: dentro de `corpoHTML()`, cada peça da linha recebe um número de trecho, e `caixaDoTrecho` diz se aquele trecho pode ir a maiúsculas. É a unidade da congruência da caixa alta, e não a linha inteira.
- **Titulação**: é um campo com `dentroDe:"nome"`, sem bloco próprio na matriz — mora dentro do bloco do Nome e por isso o acompanha de graça. `marcarTitulacao()` é o único lugar que decide se ela está aberta, porque são duas classes, a dela e a do bloco, que reserva a largura no rateio da linha. `fecharTitulacao()` apaga e devolve as marcações ao padrão; `abrirTitulacao()` é a versão que passa pelo histórico.
- **Escolhas sem quadradinho**: os `input` continuam no DOM, invisíveis, e a classe `escolhida` é posta por `sincronizarEscolhas()`, chamada em `atualizar()`, ao abrir o diálogo e a cada `change` do documento. Não usar `:has(input:checked)` para isso: a marcação muda por código com frequência e a repintura não é confiável em todos os motores.
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

### Corrigidos na versão 1

10. **Ctrl+Z durante a digitação apagava o trecho sem volta.** `registrar()` agrupa a digitação com 350 ms de atraso, e `desfazer()`/`refazer()` não fechavam esse agrupamento: o texto recém-escrito nunca entrava na pilha. Hoje as duas chamam `firmar()` antes de andar no histórico.
11. **Desfazer devolvia o campo livre do padrão em branco.** `aplicarEstado()` recriava campos livres por `/^livre\d+$/`, que não casa com o id `livre`; o bloco voltava depois, pela `garantirCampos()`, já sem valores. Hoje `garantirCampos()` roda antes de repor os valores e recebe do estado quais ids eram campos livres.
12. **Linha vazia a mais não contava como fora do padrão**, então não havia como restaurá-la. `camposMudaram()` passou a comparar a disposição inteira.
13. **Parâmetro `registrar` de `aplicar()` sombreava a função `registrar()`** — renomeado para `comHistorico`.
14. **`const linhas = saida` em `corpoHTML()`** sombreava a função `linhas()` no escopo inteiro, com zona morta antes da declaração. Removido.
15. **A linha que se esvaziava por arraste sumia sozinha.** Passou a permanecer, vazia; quem elimina é a lixeira. Junto, `abrirLinhaEm()` deixou de reaproveitar a última linha vazia, que podia estar em uso como espaço proposital.
16. **Setas sem destino continuavam clicáveis.** Agora quem não tem para onde ir recebe a classe `inerte` e o atributo `disabled`.

### Mudanças de comportamento na versão 1

- O Nome deixou de ser preso por código (`garantirNome()` não existe mais). A linha dele sai travada, e é o cadeado que o mantém no alto. Destravada, a linha se move e o bloco arrasta como qualquer outro.
- Quem audita precisa saber: **a primeira linha não é mais especial**. Qualquer teste que pressuponha "Nome na posição 0" deve, em vez disso, verificar o cadeado.
- Os títulos deixaram de ser automáticos por natureza: agora cada campo tem os próprios botões, e "Automatizar títulos" é um modo que só age em linha compartilhada.
- O "Atenciosamente," saiu de 12px e passou a usar `TAM_CORPO`, o mesmo do corpo da assinatura. Menor que o restante, ele ficava miúdo demais.

### Defeitos encontrados na revisão da titulação

17. Digitar só na titulação zerava a visualização, porque `entra("nome")` exigia o Nome preenchido.
18. Restaurar padrões, Recomeçar, Copiar e recomeçar e o expurgo não fechavam a titulação, que ficava aberta e vazia — estado que trava a geração.
19. O desfazer devolvia a titulação sem a classe que reserva a largura do bloco. As duas classes viraram uma função só, `marcarTitulacao()`.
20. O ✕ limpava o conteúdo e deixava as marcações antigas.
21. O negrito próprio da titulação não produzia efeito: ela herdava o peso do invólucro da linha do Nome.
22. O bloco do Nome com titulação disputava largura em igualdade com os vizinhos, e a caixa do Nome ficava espremida.

## 4. Pontos frágeis conhecidos

- **Numeração dos campos livres por convenção.** Os ids seguem `livre2`, `livre3`, e `RE_LIVRE` só serve para achar o próximo número. O que identifica um campo livre é a propriedade `livre` da definição, guardada também no estado do histórico — não mais o formato do id.
- **Estado repartido.** Parte vive no DOM (disposição, marcações), parte em variáveis (`logoEscolhido`, `exemplo`, `contadorLivre`). `estadoAtual()` precisa acompanhar toda variável nova, senão o desfazer fica incompleto.
- **`realcar()` roda dentro de `atualizar()`**, que é chamada em quase tudo. Há uma guarda para não mexer na matriz enquanto se digita ou arrasta; mexer nessa guarda tende a produzir perda de foco.
- **Ordem de declaração.** O arquivo executa código no meio do módulo (monta a matriz antes de várias funções). Já houve três erros de zona morta temporal com `const`/`let`. Novas constantes precisam ficar no topo.
- **Verificação de logotipos** depende de `localStorage`; em navegação anônima com armazenamento bloqueado, os testes acontecem a cada carga. Há caso automatizado cobrindo a carga nessa condição.
- **Relógio de inatividade em ouvintes de captura no `document`.** Qualquer novo diálogo precisa lembrar que Esc, clique e tecla contam como interação e reiniciam a contagem.
- **Chaves do estado do histórico.** `estadoAtual()` guarda o valor do campo em `v` e o título em `t`; por isso os botões de título ficaram em `vt` e `rt`. Uma colisão de chave aí já fez o desfazer escrever `false` dentro dos campos, e não dá erro nenhum — só corrompe o dado.
- **Campo dentro de campo.** A titulação não tem bloco na matriz, então todo laço que percorre `defs` esperando um `tile` precisa da guarda `if(!t) return`, e `camposMudaram()` ignora quem tem `dentroDe`.

## 5. Verificações sugeridas

Cento e dezessete casos automatizados em `testes/casos.js`, uma seção para cada bloco abaixo. Rode `npm test` antes e depois de qualquer mudança. O que a bateria ainda não alcança está marcado com **(à mão)**.

### Geração do HTML

- Tabela balanceada, linha única, sem `\n`, sem campo vazio produzindo linha ou espaço.
- `colspan` coerente nos três cenários: com barra, sem barra (espessura 0) e sem logotipo.
- Escape: digitar `<b>x</b>`, `"` e `&` em todos os campos e conferir que sai literal.
- Link de WhatsApp: normalização de forma nacional, internacional e 0800; recusa de número curto, sem DDD ou com letra.
- Caixa alta afeta a saída, não o valor digitado.

### Matriz e arraste

- Arrastar com mouse **(à mão)**, com toque **(à mão)** e pelo teclado (foco na alça, setas).
- Soltar em faixa entre linhas cria uma linha só, mesmo cruzando várias **(à mão)**.
- Linha que esvazia **permanece**, vazia, e só sai pela lixeira.
- Máximo de três blocos por linha respeitado em todos os caminhos.
- Setas de subir e descer só agem onde há para onde ir.

### Cadeado

- Linha travada: não sobe, não desce, não é removida, não recebe nem entrega bloco, não ganha campo livre; texto e marcações seguem editáveis.
- Subir salta o bloco contíguo de travadas e para logo acima dele.
- Tudo travado acima ou abaixo: a seta correspondente fica inerte.
- O rodapé cria acima do bloco travado do fim; com tudo travado, desabilita e avisa.
- Cadeado entra no histórico e conta em "Restaurar padrões".

### Títulos

- Um caso por linha da tabela de decisão: campo sozinho, campo acompanhado, com e sem automação, abreviado e completo.
- A primeira posição da linha é a do primeiro campo **preenchido**; deixar o campo à esquerda em branco tem de promover o seguinte, com maiúscula e sem vírgula. É a regra mais fácil de quebrar numa mudança.
- Matrícula, Sala e Atendimento nunca ficam sem rótulo, mesmo com a automação ligada.
- Nome + Matrícula sai entre parênteses e em minúsculas, e só nesse par.
- O negrito do título não alcança `:`, vírgula, `n.` nem `de`.
- Campo livre: o título ganha um `:` e nunca dois; título e conteúdo aparecem um sem o outro.
- Congruência da caixa alta: título em posição de rótulo obedece ao botão; em posição corrida, ao trecho de vírgula inteiro, ignorando os campos sem botão Aa.
- Pontuação de fecho: só Sala e Atendimento, só na última posição preenchida, trocando a pontuação que houver. Com os dois na mesma linha, o ponto sai só no fim.
- O conectivo do título não se repete no conteúdo — nada de "de de" nem "n. n.".
- A pontuação entre título e conteúdo só recebe formatação quando os dois lados a têm.

### Titulação

- Todo caminho que apaga conteúdo tem de fechá-la: Recomeçar, Copiar e recomeçar, as três opções de Restaurar padrões e o expurgo por inatividade. Aberta e vazia, ela trava a geração, e foi assim que os defeitos apareceram.
- O desfazer devolve as duas classes, a dela e a da reserva de largura do bloco.
- O negrito dela é declarado à força na saída, porque o invólucro da linha do Nome carrega o peso do Nome e ela o herdaria.
- A caixa alta do Nome e a dos títulos não a alcançam.

### Escolhas

- A caixa marcada acompanha clique, desfazer e restauração.
- Rádio: marcar um logotipo desmarca a caixa do anterior.
- Caixa de opção desabilitada aparece como tal (WhatsApp quando a caixa alta está marcada).

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

### Expurgo por inatividade

- Só arma com campo preenchido; página em branco nunca abre o aviso.
- "Continuar", Esc e qualquer tecla reiniciam a contagem.
- O expurgo apaga conteúdo, títulos de campos livres, código gerado e histórico antes de recarregar, de modo que uma recarga bloqueada não deixe dado na tela.

### Acessibilidade

- Navegação completa por teclado, incluindo os diálogos com foco preso e devolvido; com diálogo aberto, o resto da página fica `inert`.
- Leitor de tela: nomes acessíveis dos campos, avisos com `aria-live`, `aria-expanded` nas lâmpadas de dica, e a região `#avisoTeclado` que anuncia para onde o campo foi.
- Contraste dos textos pequenos e dos controles de linha **(à mão)**.

### Compatibilidade

- Chrome, Edge, Firefox e Safari, além de um navegador móvel para o arraste por toque.
- Assinatura colada no webmail da Uerj, no Outlook e no Gmail, com e sem carregamento de imagens.

## 6. Perguntas resolvidas e em aberto

- ~~Vale hospedar os logotipos fora dos domínios da Uerj?~~ **Não.** Decisão de projeto: nenhum endereço fora da Universidade entra na assinatura, mesmo ao custo de depender de caminhos que o portal pode mudar. O que se fez foi deixar de oferecer opção que não responde e avisar quando nenhuma responder.
- ~~Guardar rascunho em `sessionStorage`?~~ **Não.** O risco de dado pessoal esquecido numa máquina de balcão supera a comodidade. Seguiu-se o caminho oposto: expurgo automático por inatividade.
- O limite de três blocos por linha e de catorze linhas atende, ou convém tornar configurável?
- Dez minutos de ócio e sessenta segundos de resposta são os tempos certos para o balcão?

## 7. Como reproduzir o ambiente de teste

```bash
npm install jsdom
node testes/executar.js
```

A bateria carrega o `index.html` com jsdom, avalia o `assinatura.js` no mesmo contexto e anexa uma ponte (`window.__api`) com as funções internas; daí simula eventos e compara resultados. `testes/comum.js` monta o contexto e oferece os auxiliares (`digitar`, `marcar`, `clicar`, `tecla`, `arrastar`); `testes/casos.js` traz os casos, agrupados pelas mesmas seções da lista acima. Para rodar só uma parte: `node testes/executar.js Histórico`.
