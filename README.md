# Gerador de assinatura de e-mail da Uerj

Ferramenta web que monta a assinatura de e-mail no padrão da Universidade do Estado do Rio de Janeiro e devolve o código HTML pronto para colar no webmail.

Em produção: <https://inot.com.br/gerador-assinatura-webmail-uerj/>

Versão atual: **beta 13**.

## Arquivos

| Arquivo | Papel |
| --- | --- |
| `index.html` | estrutura da página, textos de ajuda e metadados |
| `estilo.css` | toda a apresentação |
| `assinatura.js` | montagem dos campos, arraste, histórico e geração do HTML |

Não há dependências, build nem servidor: basta abrir o `index.html` ou publicar os três arquivos numa pasta. Ao alterar CSS ou JavaScript, troque o número de versão nos links do `index.html` (`?v=beta13`), senão o navegador continua usando o arquivo em cache.

## Campos

Cada bloco da matriz é um campo. Campo vazio não aparece no resultado.

| Campo | Título sozinho na linha | Título acompanhado | Observações |
| --- | --- | --- | --- |
| Nome | sem título | sem título | obrigatório; fixo na primeira posição; 16px |
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

### Marcações de cada bloco

- **Negrito**: deixa o conteúdo em negrito no resultado.
- **Caixa alta** (Nome e Lotação): converte o conteúdo para maiúsculas apenas na saída; o que foi digitado continua intacto.
- **Cel** (campo Telefone): trata o campo como celular, aplicando máscara e títulos de celular.
- **Zap**: gera link `wa.me` a partir do número. Só funciona com celular válido (11 dígitos, começando por 9 depois do DDD). Sozinho na linha o título vira `Celular/WhatsApp:`; acompanhado, sai sem título.
- **Lixeira do bloco** (vermelha, só aparece com conteúdo): apaga o conteúdo daquele campo, e o título, no caso do campo livre.

## Controles de linha

Cada linha da matriz mostra os controles à direita; a linha vazia mostra os cinco distribuídos na largura.

| Botão | Onde aparece | O que faz |
| --- | --- | --- |
| ▲ | todas, menos a do Nome | sobe a linha inteira |
| ▼ | todas, menos a última | desce a linha inteira |
| ⧉ | só em linha vazia | cria outra linha vazia logo abaixo |
| ✎ | só em linha vazia | transforma a linha num campo livre |
| 🗑 | linha vazia ou que só tenha campos livres | elimina a linha; os campos livres dela são descartados junto |

A linha do Nome é fixa: não sobe, não desce e não pode ser eliminada.

### Barra do rodapé

| Botão | O que faz |
| --- | --- |
| ＋ linha | cria uma linha vazia acima da barra |
| ✎ campo livre | cria uma linha já com um campo livre acima da barra |

## Botões da coluna de visualização

| Botão | Estado | O que faz |
| --- | --- | --- |
| Restaurar padrões | só acende quando algo saiu do padrão | abre uma caixa listando apenas o que pode ser restaurado |
| ↶ Desfazer | acende quando há passo anterior | desfaz a última ação; também Ctrl+Z |
| ↷ Refazer | acende quando há passo desfeito | refaz; também Ctrl+Shift+Z ou Ctrl+Y |
| Gerar código | acende com o Nome preenchido e sem campo incompleto | mostra o HTML pronto abaixo |

O histórico cobre tudo: texto, marcações, cor, espessura, títulos, logotipo, arraste, criação e remoção de linhas e campos. A digitação é agrupada em blocos de cerca de 0,3 segundo, então cada passo desfaz um trecho, não uma letra.

### Caixa "Restaurar padrões"

Lista só as opções aplicáveis no momento; com mais de uma, aparece também "Restaurar tudo". Cancelar recebe o foco ao abrir e responde a Esc.

| Opção | O que restaura |
| --- | --- |
| Apenas disposições dos campos | volta a matriz ao padrão, recria campos apagados e descarta campos livres criados depois |
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

## Logotipos

As imagens não ficam no repositório: o código aponta para arquivos hospedados em domínios da Uerj.

| Opção | Endereço | Tamanho no código |
| --- | --- | --- |
| Selo Uerj | `www.uerj.br/wp-content/uploads/2021/04/Uerj_email_h98.png` | 87×98 |
| Uerj + 75 anos | `www.sgp.uerj.br/wp-content/uploads/2025/08/logo_uerj.png` | 120×72 |
| 75 anos (hotsite) | `www.75anos.uerj.br/wp-content/uploads/2025/06/Logo-Header.png` | 120×51 |

Depois que a página carrega, e no máximo uma vez por dia, ela confere se cada endereço responde e guarda a data no navegador. Endereço que falha volta a ser testado no carregamento seguinte. Opção fora do ar desaparece da lista, com exceção do Selo Uerj, que fica sempre visível. Se nenhum responder, a assinatura é gerada sem logotipo.

Os arquivos `logo_uerj.png`, `logo_uerj-75.png` e `uerj-75.png` ficam guardados no repositório apenas como reserva.

## Barra vertical

Cor pelos seis atalhos ou pelo seletor do sistema, e espessura de 0 a 10 pixels. Em 0, a barra e o espaçamento extra saem do código; permanece o afastamento de 12px entre logotipo e texto.

## Código gerado

Tabela com estilos embutidos, `role="presentation"`, `cellspacing` e `cellpadding` zerados, dimensões explícitas e `bgcolor` além de `background-color`, para atravessar clientes de e-mail antigos. Sai em linha única, sem quebras, pronto para colar no campo de assinatura em modo HTML.

## Privacidade

Nada é enviado a servidor algum: tudo acontece no navegador. O único dado guardado localmente é a data da última verificação dos logotipos.

## Autoria

Desenvolvido por Toni Henriques, <oliveira.toni@uerj.br>.
