# Gerador de assinatura de e-mail da Uerj

Ferramenta web que monta a assinatura de e-mail no padrão da Universidade do Estado do Rio de Janeiro e devolve o código HTML pronto para colar no webmail.

Em produção: <https://inot.com.br/gerador-assinatura-webmail-uerj/>

## O que faz

- Visualização em tempo real enquanto você digita, começando por um exemplo.
- Campos institucionais: nome, cargo, função, matrícula, lotação, celular, telefone, e-mail, sala, atendimento e campos livres criados por quem usa.
- Organização por arraste numa matriz de linhas e colunas: campos na mesma linha saem lado a lado, separados por barra; linhas vazias viram espaços na assinatura.
- Máscaras de telefone e matrícula, com link de WhatsApp opcional para o celular.
- Negrito e caixa alta por campo; títulos em forma longa ou curta, com opção de ocultar.
- Três logotipos oficiais da Uerj, com verificação diária de disponibilidade.
- Barra vertical com cor e espessura ajustáveis.
- Desfazer e refazer para tudo (Ctrl+Z e Ctrl+Shift+Z) e restauração seletiva dos padrões.

## Arquivos

| Arquivo | Papel |
| --- | --- |
| `index.html` | estrutura da página, textos de ajuda e metadados |
| `estilo.css` | toda a apresentação |
| `assinatura.js` | montagem dos campos, arraste, histórico e geração do HTML |

Não há dependências, build nem servidor: basta abrir o `index.html` ou publicar os três arquivos numa pasta.

## Como publicar

1. Copie `index.html`, `estilo.css` e `assinatura.js` para a pasta do site.
2. Ao alterar o CSS ou o JavaScript, troque o número de versão nos links do `index.html` (`?v=beta2`), para o navegador buscar o arquivo novo em vez do que está em cache.

## Logotipos

As imagens usadas na assinatura não vêm deste repositório: o código aponta para arquivos hospedados em domínios da Uerj.

- Selo institucional: `www.uerj.br/wp-content/uploads/2021/04/Uerj_email_h98.png`
- Uerj com o selo de 75 anos: `www.sgp.uerj.br/wp-content/uploads/2025/08/logo_uerj.png`
- Marca dos 75 anos: `www.75anos.uerj.br/wp-content/uploads/2025/06/Logo-Header.png`

A página confere uma vez por dia se os dois últimos respondem e esconde os que estiverem fora do ar. O selo institucional aparece sempre.

Os arquivos `logo_uerj.png`, `logo_uerj-75.png` e `uerj-75.png` ficam guardados aqui apenas como reserva.

## Privacidade

Nada é enviado a servidor algum: tudo acontece no navegador. O único dado guardado localmente é a data da última verificação dos logotipos.

## Autoria

Desenvolvido por Toni Henriques, <oliveira.toni@uerj.br>.
