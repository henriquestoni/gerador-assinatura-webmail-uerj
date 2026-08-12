# Gerador de assinatura de e-mail da Uerj

Ferramenta web que monta a assinatura de e-mail no padrão da Universidade do Estado do Rio de Janeiro e devolve o código HTML pronto para colar no webmail.

Em produção: <https://inot.com.br/gerador-assinatura-webmail-uerj/>

Versão atual: **beta 14**.

## Arquivos

| Arquivo | Papel |
| --- | --- |
| `index.html` | estrutura da página, textos de ajuda e metadados |
| `estilo.css` | toda a apresentação |
| `assinatura.js` | montagem dos campos, arraste, histórico e geração do HTML |
| `testes/` | bateria automatizada; não vai para o ar |

Não há dependências, build nem servidor: basta abrir o `index.html` ou publicar os três arquivos numa pasta. Ao alterar CSS ou JavaScript, troque o número de versão nos links do `index.html` (`?v=beta14`), senão o navegador continua usando o arquivo em cache.

## Testes

```bash
npm install jsdom
node testes/executar.js
```

Oitenta e dois casos cobrindo geração do HTML, validação, matriz, escolhas, cadeado, histórico, restauração, cópia e expurgo por inatividade, além de uma bateria de quatrocentas operações aleatórias que confere os invariantes da matriz. Para rodar só uma seção: `node testes/executar.js Matriz`. O comando devolve código de saída 1 se algo falhar.

## Campos

Cada bloco da matriz é um campo. Campo vazio não aparece no resultado.

| Campo | Título sozinho na linha | Título acompanhado | Observações |
| --- | --- | --- | --- |
| Nome | sem título | sem título | obrigatório; 16px; a linha dele vem travada, e é o cadeado que o mantém no alto |
| Cargo | `Cargo:` | sem título | |
| Função | `Função:` | sem título | |
| Matrícula | `Matrícula:` | `mat.` | máscara `00.000-0` |
| Lotação | sem título | sem título | caixa alta marcada por padrão |
| Celular | `Celular:` | `Cel:` | máscara `(00)00000-0000` |
| Telefone | `Telefone:` | `Tel:` | texto livre, aceita ramais |
| E-mail | `E-mail:` | sem título | vira link `mailto:` |
| Sala | `Sala:` | `sala` | |
| Atendimento | `Atendimento:` | `Atendimento:` | |
| Campo livre | título digitado por quem usa | idem | entra na assinatura pelo título; conteúdo sozinho não aparece |

### Como se escolhe

Não há quadradinho nem bolinha à vista: a opção em uso é a que está com a caixa marcada, em azul. Vale para os logotipos, os títulos, as marcações de cada bloco e as opções da caixa de restauração. O controle continua sendo um `input` de verdade, invisível mas alcançável por Tab e anunciado pelo leitor de tela; quem pinta a caixa é a classe `escolhida`, posta pelo JavaScript, porque a marcação também muda por código (desfazer, restaurar) e nem todo motor repinta `:has()` nesses casos.

### Marcações de cada bloco

Cada marcação é uma caixa com o sinal à esquerda e o nome à direita; em bloco estreito fica só o sinal, e o nome volta pelo `title`.

| Sinal | Marcação | O que faz |
| --- | --- | --- |
| **B** | Negrito | deixa o conteúdo em negrito no resultado |
| Aa | Caixa alta (Nome e Lotação) | converte o conteúdo para maiúsculas apenas na saída; o que foi digitado continua intacto |
| 📱 | Celular (campo Telefone) | trata o campo como celular, aplicando máscara e títulos de celular |
| 💬 | WhatsApp | gera link `wa.me` a partir do número. Só funciona com celular válido (11 dígitos, começando por 9 depois do DDD). Sozinho na linha o título vira `Celular/WhatsApp:`; acompanhado, sai sem título |
- **Lixeira do bloco** (vermelha, só aparece com conteúdo): apaga o conteúdo daquele campo, e o título, no caso do campo livre.

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
| continua fazendo | aceitar texto em todos os campos, aceitar as marcações (Negrito, Caixa alta, Cel, Zap) e criar linhas vazias acima e abaixo de si |

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

## Código gerado

Tabela com estilos embutidos, `role="presentation"`, `cellspacing` e `cellpadding` zerados, dimensões explícitas e `bgcolor` além de `background-color`, para atravessar clientes de e-mail antigos. Sai em linha única, sem quebras, pronto para colar no campo de assinatura em modo HTML.

## Privacidade

Nada é enviado a servidor algum: tudo acontece no navegador. O único dado guardado localmente é a data da última verificação dos logotipos. Nenhum rascunho é gravado: dado preenchido vive só na aba aberta, e o expurgo por inatividade o apaga sozinho.

## Autoria

Desenvolvido por Toni Henriques, <oliveira.toni@uerj.br>.
