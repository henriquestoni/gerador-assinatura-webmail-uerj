# Gerador de assinatura de e-mail da Uerj

Ferramenta web que monta a assinatura de e-mail no padrão da Universidade do Estado do Rio de Janeiro e devolve o código HTML pronto para colar no webmail.

Em produção: <https://inot.com.br/gerador-assinatura-webmail-uerj/>

Versão atual: **1**.

## Arquivos

| Arquivo | Papel |
| --- | --- |
| `index.html` | estrutura da página, textos de ajuda e metadados |
| `estilo.css` | toda a apresentação |
| `assinatura.js` | montagem dos campos, arraste, histórico e geração do HTML |
| `testes/` | bateria automatizada; não vai para o ar |

Não há dependências, build nem servidor: basta abrir o `index.html` ou publicar os três arquivos numa pasta. Ao alterar CSS ou JavaScript, troque o número de versão nos links do `index.html` (`?v=1`), senão o navegador continua usando o arquivo em cache.

## Testes

```bash
npm install jsdom
node testes/executar.js
```

Cento e dezessete casos cobrindo geração do HTML, títulos, titulação, validação, matriz, escolhas, cadeado, histórico, restauração, cópia e expurgo por inatividade, além de uma bateria de quatrocentas operações aleatórias que confere os invariantes da matriz. As seções "Títulos" e "Titulação" têm um caso para cada linha das tabelas de decisão. Para rodar só uma seção: `node testes/executar.js Matriz`. O comando devolve código de saída 1 se algo falhar.

O que a bateria **não** alcança, e continua dependendo de conferência à mão: o arraste com mouse e com toque, que exige layout, e a aparência da assinatura depois de colada num cliente de e-mail de verdade.

## Campos

Cada bloco da matriz é um campo. Campo vazio não aparece no resultado.

| Campo | Título completo | Abreviado | Observações |
| --- | --- | --- | --- |
| Nome | — | — | obrigatório; 16px; a linha dele vem travada, e é o cadeado que o mantém no alto |
| Cargo | `Cargo:` | — | |
| Função | `Função:` | — | |
| Matrícula | `Matrícula:` · `matrícula:` nos parênteses | `Mat.` · `mat.` nos parênteses | máscara `00.000-0`; nunca fica sem rótulo |
| Lotação | — | — | caixa alta marcada por padrão |
| Celular | `Celular:` | `Cel:` | máscara `(21)91234-5678`, permanente e calada |
| Telefone | `Telefone:` | `Tel:` | texto livre: aceita ramais, dois números, o que se escrever |
| E-mail | `E-mail:` | — | vira link `mailto:` |
| Sala | `Sala:` | `Sala n.` · `, sala n.` acompanhada | nunca fica sem rótulo |
| Atendimento | `Atendimento:` | `Atendimento de` · `, atendimento de` acompanhado | nunca fica sem rótulo |
| Campo livre | título digitado por quem usa, sempre terminado em `:` | — | título e conteúdo aparecem um sem o outro |
| Titulação | — | — | mora dentro do bloco do Nome; ver adiante |

### Titulação

O botão **＋ Adicionar titulação**, colado por fora à esquerda do bloco do Nome, abre um campo para `Prof.`, `Dr.ª`, `Me.` e afins. Ele sai imediatamente antes do nome, separado por um espaço, e **anda sempre junto**: mover o Nome de linha leva a titulação atrás, aberta ou fechada.

- Tem **Aa**, **N** e **I** próprios, acima do campo e encostados à direita. O **N** vem marcado, como no Nome.
- O negrito dela é independente do negrito do Nome: a titulação declara o próprio peso na saída, e por isso os dois botões produzem quatro combinações distintas.
- A **caixa alta do Nome e a dos títulos não a alcançam**. Só o Aa dela própria.
- Aberta, é **obrigatória**: ou se preenche, ou se fecha.
- O **✕** remove a titulação, apaga o que estiver escrito e devolve as marcações ao padrão. Ctrl+Z desfaz.
- **Recomeçar**, **Copiar e recomeçar**, **Restaurar padrões** e o expurgo por inatividade fecham a titulação junto — deixá-la aberta e vazia travaria a geração seguinte.
- Enquanto ela está aberta, o bloco do Nome reserva a largura dela antes do rateio da linha, para a caixa do Nome não ficar espremida contra os vizinhos.

### Títulos

Cada bloco traz, à esquerda das opções, **T** para mostrar ou ocultar o título e **T.** para trocar a forma completa pela abreviada — onde cada um fizer sentido:

| Campo | T | T. |
| --- | :---: | :---: |
| Cargo, Função, E-mail | ✔ | — |
| Celular, Telefone | ✔ | ✔ |
| Matrícula, Sala, Atendimento | — | ✔ |
| Nome, Lotação, Campo livre | — | — |

**Automatizar títulos**, na coluna da direita, age só nas linhas com mais de um campo preenchido, e ali silencia os títulos. Linha de um campo só obedece aos botões do bloco. Enquanto a automação estiver no comando de uma linha, os botões dos campos dela ficam desabilitados, dizendo o porquê.

Três exceções escapam da automação, porque sem rótulo o conteúdo delas fica ilegível: **Matrícula**, que mantém a forma escolhida no botão, e **Sala** e **Atendimento**, que acompanhados assumem a forma corrida e se colam ao vizinho por vírgula — `Cargo: Técnico, sala n. 3.002, atendimento de 9h às 17h`.

**Nome e Matrícula na mesma linha**, com o Nome à frente, é caso à parte: a matrícula entra entre parênteses, em minúsculas e com `n.` no lugar dos dois-pontos — `Toni Henriques (matrícula n. 43.447-2)` ou `Toni Henriques (mat. n. 43.447-2)`.

Ali dentro o rótulo não é título, é parte da frase, e por isso os efeitos se combinam de outro jeito:

| Efeito | Alcança o parêntese quando |
| --- | --- |
| Negrito | "Títulos em negrito" **e** o **N** do campo Matrícula estão ligados; então vale do `(` ao `)` |
| Itálico | "Títulos em itálico" **e** o **I** do campo Matrícula estão ligados; idem |
| Caixa alta | "Títulos em caixa alta" **e** o **Aa** do campo **Nome** estão ligados |

Com o efeito só no campo, e não nos títulos, ele estiliza apenas o número, como em qualquer outro campo.

A primeira posição da linha é a do primeiro campo **preenchido**, não a da grade: se o campo à esquerda estiver vazio, quem abre a linha é o seguinte, e vai com maiúscula e sem vírgula. A maiúscula na abertura, e depois de cada `|`, vale também para o título que você escrever no campo livre.

### Negrito, itálico e caixa alta dos títulos

Os três botões da coluna Títulos são independentes e se somam. Valem só para a palavra do título: nem o `:`, nem a vírgula, nem o `n.` ou o `de` os recebem. A exceção é o ponto que abrevia a própria palavra — o de `Mat.` —, que faz parte dela e acompanha.

**A pontuação acompanha quando os dois lados acompanham.** Se o título e o conteúdo estiverem ambos em negrito, o `:` entre eles deixa de ser a única exceção e engrossa junto. Sozinho de um lado só, fica como está.

**Caixa alta tem regra própria de congruência.** Um título em posição de rótulo — o que abre o trecho e é seguido de `:` — obedece só ao botão. Já o título em posição corrida, o que entra por vírgula no meio da frase, e os conectivos `n.` e `de` só vão a maiúsculas se **todo o trecho de vírgula** estiver em caixa alta. Campos sem botão Aa, como telefone e matrícula, não contam na conta. Sem isso, sairiam coisas como `SALA n. 11.050, bloco C, ATENDIMENTO de terça a domingo` — maiúscula em cima de texto em caixa comum.

### Pontuação de fecho

Sala e Atendimento, quando ocupam a **última posição preenchida** da linha, ganham um ponto final; se você já tiver escrito outra pontuação ali, ela é substituída pelo ponto. Nenhum outro campo recebe pontuação de fecho.

Quando os dois estão na mesma linha, o ponto sai só depois do último, e a pontuação que houver no fim do primeiro cede lugar à vírgula do segundo.

O conectivo do título não se repete no conteúdo: escrever `de segunda a sexta` no Atendimento sai como `atendimento de segunda a sexta`, e não `de de`. O mesmo vale para o `n.` de Sala.

### Como se escolhe

Não há quadradinho nem bolinha à vista: a opção em uso é a que está com a caixa marcada, em azul. Vale para os logotipos, os títulos, as marcações de cada bloco e as opções da caixa de restauração. O controle continua sendo um `input` de verdade, invisível mas alcançável por Tab e anunciado pelo leitor de tela; quem pinta a caixa é a classe `escolhida`, posta pelo JavaScript, porque a marcação também muda por código (desfazer, restaurar) e nem todo motor repinta `:has()` nesses casos.

### Marcações de cada bloco

As marcações ficam recolhidas atrás da setinha ⌄ de cada bloco; um ponto ocre nela avisa quando o campo tem alguma fora do padrão. Cada uma é uma caixa com o sinal dentro, e o nome vem pelo `title`.

| Sinal | Marcação | O que faz |
| --- | --- | --- |
| Aa | Caixa alta | converte o conteúdo para maiúsculas apenas na saída; o que foi digitado continua intacto. Não existe em campo só de algarismos |
| **N** | Negrito | deixa o conteúdo em negrito no resultado |
| *I* | Itálico | deixa o conteúdo em itálico |
| balão | WhatsApp | gera link `wa.me` a partir do número, nos campos de telefone e no campo livre |

Caixa alta e WhatsApp se excluem: um é coisa de texto, o outro é coisa de número.

A **lixeira do bloco**, vermelha, só aparece com conteúdo, e apaga apenas aquele campo — no campo livre, também o título.

## Controles de linha

Cada linha da matriz mostra os controles à direita; a linha vazia mostra os cinco distribuídos na largura.

| Botão | Onde aparece | O que faz |
| --- | --- | --- |
| ▲ | onde há para onde subir | sobe a linha inteira |
| ▼ | onde há para onde descer | desce a linha inteira |
| ⧉↑ ⧉↓ | só em linha vazia | criam outra linha vazia acima ou abaixo desta |
| ✎ | só em linha vazia | transforma a linha num campo livre |
| 🗑 | linha vazia ou que só tenha campos livres | elimina a linha; os campos livres dela são descartados junto |
| 🔓 🔒 | todas | trava ou destrava a linha |

Botão sem ação possível no momento não some de qualquer jeito: na linha com campos ele desaparece, e na linha vazia fica visível e apagado, para a fileira de controles não dançar a cada mudança.

## Cadeado

Travar uma linha congela a estrutura dela, não o conteúdo.

| Enquanto travada | |
| --- | --- |
| não faz | subir, descer, ser eliminada, receber bloco arrastado, deixar sair o que está nela, ganhar campo livre |
| continua fazendo | aceitar texto em todos os campos, aceitar as marcações de título e de formato, e criar linhas vazias acima e abaixo de si |

A linha do Nome sai travada na estrutura padrão: é isso, e não uma regra de código, que a mantém no alto. Destravando, o Nome anda como qualquer outro campo.

O cadeado também governa a vizinhança:

- Uma linha nunca para dentro de um trecho travado. Ao subir, ela salta o bloco contíguo de linhas travadas e para logo acima dele; ao descer, logo abaixo.
- Se tudo o que está acima estiver travado, não há para onde subir, e a seta fica sem função. O mesmo para baixo.
- O rodapé cria a linha nova acima do bloco travado do fim. Com atendimento e dois campos livres travados no pé, por exemplo, a linha nova nasce antes deles.
- Travadas todas as linhas, o rodapé fica desabilitado e diz por quê.

### Barra do rodapé

| Botão | O que faz |
| --- | --- |
| ＋ linha | cria uma linha vazia acima do bloco travado do fim |
| ✎ campo livre | cria, no mesmo ponto, uma linha já com um campo livre |

## Botões da coluna de visualização

| Botão | Estado | O que faz |
| --- | --- | --- |
| Restaurar padrões | só acende quando algo saiu do padrão | abre uma caixa listando apenas o que pode ser restaurado |
| ↶ Desfazer | acende quando há passo anterior | desfaz a última ação; também Ctrl+Z |
| ↷ Refazer | acende quando há passo desfeito | refaz; também Ctrl+Shift+Z ou Ctrl+Y |
| Gerar código | acende com o Nome preenchido e sem campo incompleto | mostra o HTML pronto abaixo |

O Nome se anuncia obrigatório no próprio bloco, com o rótulo `(obrigatório)` e o atributo `required`. O espaço de aviso ao lado do título da coluna fica só para erro passageiro — celular incompleto, e-mail inválido, titulação aberta e vazia —, e o botão Gerar diz no `title` por que está apagado.

O histórico cobre tudo: texto, marcações, cor, espessura, títulos, logotipo, cadeados, arraste, criação e remoção de linhas e campos. A digitação é agrupada em blocos de cerca de 0,3 segundo, então cada passo desfaz um trecho, não uma letra.

### Caixa "Restaurar padrões"

Lista só as opções aplicáveis no momento; com mais de uma, aparece também "Restaurar tudo". Cancelar recebe o foco ao abrir e responde a Esc.

| Opção | O que restaura |
| --- | --- |
| Apenas disposições dos campos | volta a matriz ao padrão, recria campos apagados, descarta campos livres criados depois e devolve os cadeados ao padrão (só a primeira linha travada) |
| Apenas aparência (logotipo, barra e títulos) | selo padrão, ouro Uerj, 3px, títulos visíveis e em negrito |
| Apenas apagar os campos preenchidos | apaga conteúdo e títulos de campos livres, e devolve as marcações ao padrão |

## Botões que aparecem depois de gerar o código

| Botão | O que faz | O que preserva |
| --- | --- | --- |
| Recomeçar | apaga o conteúdo de todos os campos | títulos de campos livres, marcações, disposição, logotipo e barra |
| Apenas copiar | copia o HTML para a área de transferência | tudo |
| Copiar e recomeçar | copia e, só se a cópia for confirmada, apaga o conteúdo dos campos | títulos, marcações, disposição, logotipo e barra |

Se a cópia falhar, nada é apagado: o código fica selecionado e a página avisa para usar Ctrl+C.

## WhatsApp

Marcado o balão, o número vira link `wa.me`. A regra oficial do WhatsApp é uma só: número completo em formato internacional, **só algarismos, sem `+`, sem zeros de prefixo, sem parênteses e sem traços**, com o teto de 15 algarismos do padrão E.164. A página normaliza o que for digitado:

| Digitado | Link |
| --- | --- |
| `(21)91234-5678` | `wa.me/5521912345678` |
| `(11)2222-2222` | `wa.me/551122222222` |
| `+5521967395087` | `wa.me/5521967395087` |
| `00 55 21 91234-5678` | `wa.me/5521912345678` |
| `0800 570 0800` | `wa.me/558005700800` |
| `+1 (555) 123-4567` | `wa.me/15551234567` |

Recusa, dizendo o motivo: número nacional com menos de 10 ou mais de 11 algarismos, número sem DDD como `4004-1234`, e qualquer conteúdo com letra — `(21)2334-0000, ramal 210` colaria o 210 no fim e produziria um link errado. Não se exige que o celular comece por 9: existe WhatsApp em linha fixa e em número antigo.

Sobre 0800: a Meta não o proíbe, mas ele só se registra pela API do WhatsApp Business, por parceiro oficial — no aplicativo comum a ligação de verificação esbarra na própria URA. Como número, entra no link pela mesma regra: cai o zero, entra o 55.

## Espaços na assinatura

Linha vazia entre campos preenchidos vira um respiro de 8px no resultado. Linhas vazias seguidas somam espaço. Linhas vazias no começo e no fim são ignoradas. Linha que tem campos, mas todos em branco, não gera espaço nenhum.

Tirar o último bloco de uma linha, por arraste ou pelas setas, deixa a linha vazia no lugar: ela passa a valer como espaço. Quem elimina a linha é a lixeira, nunca o programa.

## Layout da página

A coluna da esquerda é a matriz de campos. A da direita traz a visualização e, abaixo dela, Logotipo e Títulos lado a lado, e depois a barra vertical. Abaixo de 820px as duas seções empilham; abaixo de 980px as duas colunas viram uma.

## Expurgo por inatividade

Com algum campo preenchido e dez minutos sem qualquer interação, a página abre um aviso e conta sessenta segundos em voz alta. "Continuar preenchendo", Esc ou qualquer tecla fecham o aviso e reiniciam a contagem. Sem resposta, ou com "Apagar agora", o conteúdo dos campos, os títulos de campos livres, o código gerado e o histórico são apagados e a página recomeça. O relógio só existe enquanto há dado na tela: página em branco nunca dispara o aviso.

## Logotipos

As imagens não ficam no repositório: o código aponta para arquivos hospedados em domínios da Uerj.

| Opção | Endereço | Tamanho no código |
| --- | --- | --- |
| Selo Uerj | `www.uerj.br/wp-content/uploads/2021/04/Uerj_email_h98.png` | 87×98 |
| Uerj + 75 anos | `www.sgp.uerj.br/wp-content/uploads/2025/08/logo_uerj.png` | 120×72 |
| 75 anos (hotsite) | `www.75anos.uerj.br/wp-content/uploads/2025/06/Logo-Header.png` | 120×51 |

Depois que a página carrega, e no máximo uma vez por dia, ela confere se cada endereço responde e guarda a data no navegador. Endereço que falha volta a ser testado no carregamento seguinte. Opção fora do ar desaparece da lista, para não oferecer imagem quebrada. Se nenhum responder, a página avisa e a assinatura é gerada sem logotipo.

Por decisão de projeto, as imagens ficam só em domínios da Uerj: nenhum endereço fora da Universidade entra na assinatura, mesmo que isso deixe a imagem sujeita a mudanças de caminho no portal.

Os arquivos `logo_uerj.png`, `logo_uerj-75.png` e `uerj-75.png` ficam guardados no repositório apenas como reserva.

## Barra vertical

Cor pelos seis atalhos ou pelo seletor do sistema, e espessura de 0 a 10 pixels. Em 0, a barra e o espaçamento extra saem do código; permanece o afastamento de 12px entre logotipo e texto.

## Passo a passo do webmail

No fim da página, um bloco recolhido — "Como colocar a assinatura no webmail" — descreve o caminho no SOGo com os rótulos como aparecem na tela: **Preferências** → aba **Correio** → **CONTAS IMAP** → **Editar Contas** → **Identidades** → campo **Assinatura**.

Três passos vão destacados, porque são onde se erra:

1. O botão chamado **Fonte** não é tipo de letra: é o código-fonte do editor. Colar sem apertá-lo destrói a tabela.
2. É preciso apertar **Fonte** de novo depois de colar. Esse segundo clique é o que faz o editor absorver o conteúdo.
3. O **coração** na lista de Identidades marca a identidade padrão. Editar a assinatura numa identidade que não é a padrão não produz efeito nenhum.

## Código gerado

Tabela com estilos embutidos, `role="presentation"`, `cellspacing` e `cellpadding` zerados, dimensões explícitas e `bgcolor` além de `background-color`, para atravessar clientes de e-mail antigos. Sai em linha única, sem quebras, pronto para colar no campo de assinatura em modo HTML.

## Privacidade

Nada é enviado a servidor algum: tudo acontece no navegador. O único dado guardado localmente é a data da última verificação dos logotipos. Nenhum rascunho é gravado: dado preenchido vive só na aba aberta, e o expurgo por inatividade o apaga sozinho.

## Autoria

Desenvolvido por Toni Henriques, <tonihenriques@gmail.com>.
