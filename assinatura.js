/* Assinatura de e-mail Uerj | assinatura.js | versão 1 */
const VERSAO = "1";
const LINHAS = 14, COLS = 3;   /* o rodapé já cria linhas quando preciso */

/* prefixo de todos os id gerados: isola os campos de qualquer id do HTML */
const PRE = "asg_";

/* `numero`: campo só de algarismos, que não ganha o sinal de caixa alta.
   `tel`: aceita telefone e pode virar link de WhatsApp. `dentroDe`: mora dentro de outro campo.

   Títulos. Cada forma é escrita em minúsculas, com a palavra que pode ir a negrito
   entre chaves; a maiúscula entra por regra, quando o campo abre a linha ou vem
   depois de uma barra. `corrido` marca quem se cola ao vizinho por vírgula em vez
   de barra, e `semAutomacao`, quem a automação não silencia.
     titulo  → forma completa            {matrícula}:
     abrev   → forma abreviada           {mat.}
     verPadrao / abrevPadrao → estado inicial dos botões do campo */
let defs = [
  /* a titulação vive dentro do bloco do Nome e anda colada a ele: não é um bloco
     da matriz, não tem título, e a caixa alta do Nome e a dos títulos não a alcançam */
  {id:"titulacao",   rotulo:"Titulação",     dica:"Prof. Dr.", dentroDe:"nome", negrito:true},
  {id:"nome",        rotulo:"Nome",          dica:"Maria da Silva", obrigatorio:true, negrito:true, temTitulacao:true},
  {id:"cargo",       rotulo:"Cargo",         dica:"Técnico Universitário",
                     titulo:"{cargo}: ", podeOcultar:true, verPadrao:true},
  {id:"funcao",      rotulo:"Função",        dica:"Chefe de Serviço",
                     titulo:"{função}: ", podeOcultar:true, verPadrao:true},
  /* dentro dos parênteses, depois do Nome, a matrícula troca o ":" por "n." */
  {id:"matricula",   rotulo:"Matrícula",     dica:"00.000-0", mascara:"mat", numero:true,
                     titulo:"{matrícula}: ", abrev:"{mat.} ", podeAbreviar:true, semAutomacao:true,
                     tituloParenteses:"matrícula n. ", abrevParenteses:"mat. n. "},
  {id:"lotacao",     rotulo:"Lotação",       dica:"ECOMUSEU/PR-3", negrito:true, caixaPadrao:true},
  {id:"celular",     rotulo:"Celular",       dica:"(21)91234-5678", tel:true, numero:true, mascaraSempre:true,
                     titulo:"{celular}: ", abrev:"{cel}: ", podeOcultar:true, podeAbreviar:true, verPadrao:true},
  /* Telefone não leva máscara: aceita ramal, dois números, o que a pessoa escrever */
  {id:"fixo",        rotulo:"Telefone",      dica:"(21)2334-0000, ramais 210, 211", tel:true, numero:true,
                     titulo:"{telefone}: ", abrev:"{tel}: ", podeOcultar:true, podeAbreviar:true, verPadrao:true},
  {id:"email",       rotulo:"E-mail",        dica:"usuario@uerj.br",
                     titulo:"{e-mail}:&nbsp;", podeOcultar:true, verPadrao:true},
  {id:"sala",        rotulo:"Sala",          dica:"3.002, bloco F, 3º andar",
                     titulo:"{sala}: ", abrev:"{sala} n. ", podeAbreviar:true, corrido:true, semAutomacao:true, pontoFinal:true},
  {id:"atendimento", rotulo:"Atendimento",   dica:"seg. a sex., 9h às 17h",
                     titulo:"{atendimento}: ", abrev:"{atendimento} de ", podeAbreviar:true, corrido:true, semAutomacao:true, pontoFinal:true},
  /* o campo livre aceita telefone e vira link de WhatsApp, mas não leva máscara:
     ela reescreveria o que se digita num campo cuja razão de ser é aceitar qualquer coisa */
  {id:"livre",       rotulo:"Campo livre",   dica:"Conteúdo", dicaTitulo:"Título (necessário)",
                     livre:true, tel:true}
];
const porId = Object.fromEntries(defs.map(d => [d.id, d]));
const DEFS_BASE = defs.map(d => Object.assign({}, d));   /* lista original, para recriar o que for apagado */
const PADRAO = [["nome"],["cargo","funcao","matricula"],["lotacao"],[],["celular","fixo"],["email","sala"],[],["atendimento"],["livre"]];
/* a linha do Nome sai travada; as demais, livres */
const TRAVAS_PADRAO = PADRAO.map((l, i) => i === 0);

/* enquanto nada for digitado, a visualização mostra um exemplo */
const EXEMPLO = {
  nome:"Fulano de Tal", cargo:"Técnico", funcao:"Diretor", matricula:"00.000-0",
  lotacao:"Dali/Uerj", celular:"(21)99999-9999", fixo:"(21)1111-1111, ramal 000",
  email:"daliuerj@uerj.br", sala:"3.002, bloco F, 3º andar",
  atendimento:"seg. a sex., 9h às 17h", t_livre:"", livre:""
};
let exemplo = true;

/* autocomplete: ajuda o preenchimento do navegador e cala o aviso do console */
const AUTOCOMPLETE = {
  nome:"name", email:"email", celular:"tel", fixo:"tel-national",
  cargo:"organization-title", lotacao:"organization"
};
function autoDe(id){ return AUTOCOMPLETE[id] || "off"; }

let pilha = [], indice = -1, restaurando = false, agendado = null;
let arrastado = null, linhaOrigem = null;

/* pontuação de fim de conteúdo; mora aqui no topo porque a matriz é montada no meio
   do arquivo e já chama atualizar(), o que derrubaria uma const declarada lá embaixo */
const FIM_PONTUADO = /[.!?…:;,]+$/;

/* corpo do texto da assinatura. O "Atenciosamente," sai do mesmo tamanho: menor
   que o restante ele ficava miúdo demais, e o teto de 12pt não permitiria crescer muito. */
const TAM_CORPO = 14;

const el = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const B = t => '<span style="font-weight:900">' + t + '</span>';

/* acesso aos elementos de cada campo, sempre pelo prefixo */
const campo   = id      => el(PRE + id);                 /* caixa de conteúdo */
const tituloEl = id     => el(PRE + "t_" + id);          /* caixa de título do campo livre */
const marca   = (k, id) => el(PRE + k + "_" + id);       /* c, b, i, w, e v e r dos títulos */

/* Sinais desenhados, em traço fechado, herdando a cor do texto do chip.
   Traçado do balão e do fone; a caixa de cada um foi medida no próprio desenho.
   O sistema de coordenadas é o do arquivo original: décimos, com o eixo Y invertido. */
const TRACO_BALAO = "M6255 6844 c-540 -35 -1107 -229 -1555 -532 -473 -320 -848 -752 -1091 -1256 -133 -276 -216 -536 -273 -856 -43 -240 -52 -602 -22 -880 40 -374 177 -822 362 -1188 l53 -103 -123 -367 c-68 -202 -191 -570 -274 -818 -84 -249 -152 -459 -152 -469 0 -9 13 -22 29 -28 26 -10 29 -14 24 -45 -6 -32 -5 -34 18 -27 41 13 936 298 1314 420 198 63 368 115 378 115 9 0 52 -17 95 -39 366 -184 756 -294 1171 -332 164 -14 498 -7 659 16 954 132 1766 659 2266 1468 163 264 318 632 401 952 79 307 117 688 96 982 -54 781 -356 1473 -881 2017 -509 527 -1157 853 -1895 952 -108 14 -482 26 -600 18z m391 -684 c357 -29 650 -108 959 -259 419 -206 770 -514 1030 -906 200 -301 323 -625 371 -979 23 -168 23 -508 0 -680 -163 -1209 -1161 -2141 -2372 -2217 -427 -26 -824 44 -1212 214 -107 47 -284 143 -339 183 -17 13 -39 24 -49 24 -9 0 -222 -65 -472 -145 -250 -80 -456 -145 -457 -143 -2 2 62 197 141 433 79 237 144 442 144 458 0 16 -18 53 -44 90 -418 599 -554 1426 -351 2127 45 152 82 245 155 390 200 391 505 732 880 982 473 316 1064 472 1616 428z";
const TRACO_FONE = "M5323 5236 c-23 -7 -56 -23 -75 -34 -51 -32 -199 -190 -245 -262 -147 -229 -180 -534 -92 -832 67 -225 149 -397 299 -629 190 -292 313 -450 510 -653 296 -305 545 -476 927 -635 282 -118 490 -185 607 -197 81 -8 258 20 362 58 144 52 309 168 373 262 64 96 130 313 138 457 l6 95 -31 36 c-22 24 -112 78 -294 176 -432 232 -487 254 -555 218 -17 -8 -81 -73 -141 -143 -178 -207 -215 -243 -245 -243 -38 0 -287 127 -403 205 -135 92 -223 166 -334 281 -132 137 -275 333 -355 486 l-18 36 72 79 c95 101 134 162 172 268 39 108 37 141 -20 290 -51 133 -92 243 -163 434 -58 157 -101 221 -161 240 -57 17 -287 22 -334 7z";
const ESCALA_TRACO = 'transform="translate(0,720) scale(0.1,-0.1)"';
function sinalSVG(caixa, tracos){
  return '<svg viewBox="' + caixa + '" width="12" height="12" aria-hidden="true" focusable="false">' +
         '<g ' + ESCALA_TRACO + ' fill="currentColor" stroke="none">' + tracos + '</g></svg>';
}
const SINAL_ZAP = sinalSVG("318 35.3 645.7 657.5", '<path d="' + TRACO_BALAO + '"/><path d="' + TRACO_FONE + '"/>');

/* Um chip de marcação: só o sinal, sem rótulo. O leitor de tela recebe o nome fixo
   da marcação, e o `title` diz a ação que o clique faz agora — aplicar ou remover —,
   guardada nos dois atributos para `sincronizarEscolhas` alternar. */
function sinalMarc(chave, id, ligado, acoes, sinal, extra){
  return '<label class="marc' + (extra ? " " + extra : "") + '"' +
    ' data-lig="' + esc(acoes.lig) + '" data-desl="' + esc(acoes.desl) + '"' +
    ' title="' + esc(ligado ? acoes.desl : acoes.lig) + '">' +
    '<input type="checkbox" autocomplete="off" id="' + PRE + chave + "_" + id + '"' + (ligado ? " checked" : "") +
    ' aria-label="' + esc(acoes.nome) + '">' + sinal + '</label>';
}
/* os textos de cada marcação, num lugar só */
const ACOES = {
  c: { nome:"Caixa alta", lig:"Aplicar caixa alta", desl:"Remover a caixa alta" },
  b: { nome:"Negrito",    lig:"Aplicar negrito",    desl:"Remover o negrito" },
  i: { nome:"Itálico",    lig:"Aplicar itálico",    desl:"Remover o itálico" },
  w: { nome:"WhatsApp",   lig:"Gerar link do WhatsApp", desl:"Remover o link do WhatsApp" },
  v: { nome:"Título",     lig:"Mostrar o título deste campo", desl:"Ocultar o título deste campo" },
  r: { nome:"Forma do título", lig:"Usar a forma abreviada do título", desl:"Usar a forma completa do título" }
};

/* A titulação: fechada, é só um botão colado ao Nome; aberta, é um campo com
   caixa alta, negrito e itálico próprios. Fechar apaga o que estiver escrito. */
function blocoTitulacao(){
  const t = porId.titulacao;
  return '<div class="titulacao fechada">' +
    /* o rótulo na horizontal, quebrando em linhas: vertical não se lia */
    '<button type="button" class="mini abrirTit" title="Acrescentar uma titulação antes do nome">' +
      '<span class="mais">＋</span><span class="rotuloTit">Adicionar titulação</span></button>' +
    '<div class="dentroTit">' +
      /* mesmo desenho dos outros blocos: rótulo à esquerda, setinha e fecho à direita,
         e as marcações recolhidas acima do campo, encostadas à direita */
      '<div class="cabTit"><span>Titulação</span>' +
        '<button type="button" class="mini fecharTit" title="Remover a titulação e apagar o que foi escrito">✕</button>' +
      '</div>' +
      '<div class="opcsTit"><span class="grupo forma">' +
        sinalMarc("c", t.id, t.caixaPadrao, ACOES.c, '<span class="sinal caixa">Aa</span>') +
        sinalMarc("b", t.id, t.negrito, ACOES.b, '<span class="sinal grosso">N</span>') +
        sinalMarc("i", t.id, t.italico, ACOES.i, '<span class="sinal inclinado">I</span>') +
      '</span></div>' +
      '<input type="text" id="' + PRE + t.id + '" name="' + PRE + t.id + '" autocomplete="off"' +
        ' aria-label="Titulação" placeholder="' + t.dica + '">' +
    '</div></div>';
}
function titulacaoAberta(){
  const cx = document.querySelector(".titulacao");
  return !!cx && !cx.classList.contains("fechada");
}
/* Um lugar só para dizer se a titulação está aberta: são duas classes, a dela e a do
   bloco, que reserva a largura no rateio da linha. Separá-las já produziu desfazer torto. */
function marcarTitulacao(aberta){
  const cx = document.querySelector(".titulacao");
  if(!cx) return;
  cx.classList.toggle("fechada", !aberta);
  const bloco = cx.closest(".tile");
  if(bloco) bloco.classList.toggle("titAberta", aberta);
}
/* fecha e limpa sem passar pelo histórico: para quem já registra o próprio passo */
function fecharTitulacao(){
  marcarTitulacao(false);
  const t = porId.titulacao || {};
  if(campo("titulacao")) campo("titulacao").value = "";
  /* as marcações voltam ao padrão do campo, não a "tudo desmarcado" */
  [["c", t.caixaPadrao], ["b", t.negrito], ["i", t.italico]].forEach(([k, padrao]) => {
    const m = marca(k, "titulacao"); if(m) m.checked = !!padrao;
  });
}
function abrirTitulacao(abrir){
  if(!document.querySelector(".titulacao")) return;
  firmar();                       /* fecha a digitação pendente: fechar apaga, e o desfazer tem de achar o que havia */
  if(abrir) marcarTitulacao(true); else fecharTitulacao();
  atualizar();
  registrarAgora();
  if(abrir && campo("titulacao")) campo("titulacao").focus();
}

/* molde de campo livre: um lugar só, usado na criação e na recriação */
const RE_LIVRE = /^livre(\d+)$/;                         /* só para numerar; o que identifica é d.livre */
function defLivre(id){
  return { id, rotulo:"Campo livre", dica:"Conteúdo", dicaTitulo:"Título (necessário)",
           livre:true, tel:true };
}
/* campo livre criado por quem usa, que some ao restaurar o padrão */
function livreExtra(id){
  return !!(porId[id] && porId[id].livre) && !DEFS_BASE.some(d => d.id === id);
}

/* ---------- logotipo ---------- */
/* Todos hospedados em endereços da Uerj; a página confere se respondem. */
/* largura máxima de 120px: acima disso o logotipo domina a assinatura */
const LOGOS = [
  { id:"selo", rotulo:"Selo Uerj", seguro:true,
    src:"https://www.uerj.br/wp-content/uploads/2021/04/Uerj_email_h98.png", w:87, h:98 },
  { id:"75",   rotulo:"Uerj + 75 anos",
    src:"https://www.sgp.uerj.br/wp-content/uploads/2025/08/logo_uerj.png", w:120, h:72 },
  { id:"75of", rotulo:"75 anos (hotsite)",
    src:"https://www.75anos.uerj.br/wp-content/uploads/2025/06/Logo-Header.png", w:120, h:51 }
];
let logoEscolhido = "selo";

/* memória do teste: guarda só a data em que cada selo respondeu, nada pessoal */
const CHAVE_LOGOS = "assinaturaUerj.logosOk";
/* data local, não UTC: no fuso de Brasília o dia mudaria às 21h */
const hoje = () => {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
};
function memoria(){
  try { return JSON.parse(localStorage.getItem(CHAVE_LOGOS)) || {}; }
  catch(e){ return {}; }
}
function anotar(id, ok){
  try {
    const m = memoria();
    if(ok) m[id] = hoje(); else delete m[id];   /* falhou: some do registro e volta a ser testado */
    localStorage.setItem(CHAVE_LOGOS, JSON.stringify(m));
  } catch(e){}
}

function verificarLogos(){
  /* confere os três, no máximo uma vez por dia; o padrão continua sempre visível */
  const m = memoria();
  const testar = LOGOS.filter(l => {
    if(m[l.id] === hoje()){ l.ok = true; marcarLogo(l); return false; }   /* já respondeu hoje */
    return true;
  });
  if(!testar.length){ escolherDisponivel(); return; }
  let pendentes = testar.length;
  testar.forEach(l => testarLogo(l, 1, () => { if(--pendentes === 0) escolherDisponivel(); }));
}
/* chamada uma única vez, quando todos os testes terminam */
function escolherDisponivel(){
  const atual = LOGOS.find(l => l.id === logoEscolhido);
  if(atual && atual.ok !== false) return;
  const livre = LOGOS.find(l => l.ok !== false);
  logoEscolhido = livre ? livre.id : null;
  montarLogos();
  atualizar();
}
function testarLogo(l, tentativa, pronto){
  const im = new Image();
  im.onload  = () => { l.ok = true;  anotar(l.id, true);  marcarLogo(l); pronto && pronto(); };
  im.onerror = () => {
    if(tentativa < 2){ setTimeout(() => testarLogo(l, tentativa + 1, pronto), 2500); return; }
    l.ok = false; anotar(l.id, false); marcarLogo(l); pronto && pronto();
  };
  im.src = l.src + (tentativa > 1 ? "?t=" + Date.now() : "");
}
function marcarLogo(l){
  const alvo = document.querySelector('.opcaoLogo[data-id="' + l.id + '"]');
  if(!alvo) return;
  /* enquanto não foi testado, todo logotipo aparece; o que falhou some, inclusive o primeiro:
     manter na lista um endereço fora do ar só produziria imagem quebrada */
  alvo.classList.toggle("hide", l.ok === false);
  semLogotipos();
}
/* aviso quando nenhum endereço responde */
function semLogotipos(){
  const box = el("logos");
  const nenhum = !box.querySelector(".opcaoLogo:not(.hide)");
  let nota = box.querySelector(".semLogo");
  if(nenhum && !nota){
    nota = document.createElement("span");
    nota.className = "dica semLogo";
    nota.textContent = "Nenhum logotipo está respondendo agora; a assinatura sai sem imagem.";
    box.appendChild(nota);
  } else if(!nenhum && nota) nota.remove();
}

function montarLogos(){
  const box = el("logos");
  box.innerHTML = LOGOS.filter(l => l.ok !== false).map(l =>
    '<label class="marc opcaoLogo" data-id="' + l.id + '" style="font-size:12px">' +
      '<input type="radio" autocomplete="off" name="logo" value="' + l.id + '"' + (l.id === logoEscolhido ? " checked" : "") + '>' +
      '<img src="' + l.src + '" alt="' + l.rotulo + '" height="34">' +
      '<span>' + l.rotulo + (l.seguro ? ' <span class="selo">mais seguro</span>' : '') + '</span>' +
    '</label>'
  ).join("");
  LOGOS.forEach(marcarLogo);
  box.querySelectorAll('input[name=logo]').forEach(r => r.addEventListener("change", () => {
    logoEscolhido = r.value;
    atualizar();
  }));
}
function logoAtual(){
  return LOGOS.find(l => l.id === logoEscolhido && l.ok !== false)
      || LOGOS.find(l => l.ok !== false)
      || null;                       /* nenhum disponível: assinatura sai sem logotipo */
}
function logoMudou(){ return logoEscolhido !== "selo"; }

/* ---------- barra vertical ---------- */
const PALETA = [
  ["#AD841F","Ouro Uerj"], ["#0072CE","Azul Uerj"], ["#C8102E","Vermelho"],
  ["#1A7F37","Verde"], ["#5A6270","Cinza"], ["#000000","Preto"]
];
function montarPaleta(){
  const box = document.getElementById("amostras");
  PALETA.forEach(([hex, nome]) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "amostra"; b.title = nome;
    b.style.background = hex; b.dataset.hex = hex;
    b.addEventListener("click", () => { document.getElementById("cor").value = hex; sincronizarPaleta(); atualizar(); });
    box.appendChild(b);
  });
}
function sincronizarPaleta(){
  const atual = document.getElementById("cor").value.toUpperCase();
  document.querySelectorAll(".amostra").forEach(b => b.classList.toggle("ativa", b.dataset.hex.toUpperCase() === atual));
}
function corBarra(){ return document.getElementById("cor").value.toUpperCase(); }
function espessuraBarra(){ return document.getElementById("espessura").value; }

/* ---------- máscaras ---------- */
/* Aceita fixo e celular: (21)2334-0000 e (21)91234-5678.
   Um +55 ou 55 digitado à frente é descartado, para não virar DDD. */
function mascaraTelefone(v){
  let d = String(v).replace(/\D/g,"");
  if(d.length > 11 && d.startsWith("55")) d = d.slice(2);
  d = d.slice(0,11);
  if(d.length <= 2) return d.length ? "(" + d : "";
  if(d.length <= 6) return "(" + d.slice(0,2) + ")" + d.slice(2);
  /* com 11 algarismos o corte vai depois do quinto; com 10, depois do quarto */
  const corte = d.length > 10 ? 7 : 6;
  return "(" + d.slice(0,2) + ")" + d.slice(2,corte) + "-" + d.slice(corte);
}
function mascaraMatricula(v){
  const d = v.replace(/\D/g,"").slice(0,6);
  if(d.length <= 2) return d;
  if(d.length <= 5) return d.slice(0,2) + "." + d.slice(2);
  return d.slice(0,2) + "." + d.slice(2,5) + "-" + d.slice(5);
}

/* ---------- matriz ---------- */
const matriz = el("matriz");
const linhas = () => [...matriz.querySelectorAll(":scope > .linha")];   /* o rodapé fica fora */

const blocos = l => [...l.querySelectorAll(":scope > .tile")];

for(let i = 0; i < PADRAO.length; i++){          /* começa só com as linhas do padrão */
  const linha = document.createElement("div");
  linha.className = "linha";
  linha.appendChild(controlesLinha());
  matriz.appendChild(linha);
}

/* ---------- cadeado da linha ---------- */
/* Linha travada não se move, não é removida, não recebe nem entrega blocos.
   O texto dos campos dela continua editável, e as marcações também. */
const travada = l => !!l && l.classList.contains("travada");

/* Para onde a linha `i` vai ao subir. Vizinha destravada: troca simples.
   Vizinha travada: salta o bloco contíguo de travadas e para logo abaixo da
   primeira destravada acima. Tudo travado acima: não há para onde ir. */
function alvoSubir(ls, i){
  if(i <= 0 || travada(ls[i])) return null;
  let j = i - 1;
  if(!travada(ls[j])) return j;
  while(j >= 0 && travada(ls[j])) j--;
  return j < 0 ? null : j + 1;
}
function alvoDescer(ls, i){
  if(i < 0 || i >= ls.length - 1 || travada(ls[i])) return null;
  let j = i + 1;
  if(!travada(ls[j])) return j;
  while(j < ls.length && travada(ls[j])) j++;
  return j >= ls.length ? null : j - 1;
}
function moverLinha(linha, paraCima){
  const ls = linhas(), i = ls.indexOf(linha);
  const destino = paraCima ? alvoSubir(ls, i) : alvoDescer(ls, i);
  if(destino === null) return false;
  if(paraCima) matriz.insertBefore(linha, ls[destino]);
  else matriz.insertBefore(linha, ls[destino].nextElementSibling);
  return true;
}
function travar(linha, valor){
  linha.classList.toggle("travada", valor);
  realcar(); atualizar(); registrarAgora();
}

/* Onde o rodapé cria linha: acima do bloco travado do fim.
   Devolve null quando toda a matriz está travada. */
function pontoDeInsercao(){
  const ls = linhas();
  let j = ls.length - 1;
  while(j >= 0 && travada(ls[j])) j--;
  if(j < 0) return null;
  return ls[j + 1] || rodapeMatriz;
}

/* botões de cada linha: mover, criar, remover e travar */
function controlesLinha(){
  const c = document.createElement("div");
  c.className = "ctrl";
  c.innerHTML =
    '<button type="button" class="mini" data-acao="subir" title="Subir linha">▲</button>' +
    '<button type="button" class="mini soVazia" data-acao="acima" title="Criar linha vazia acima desta">⧉↑</button>' +
    '<button type="button" class="mini soVazia" data-acao="abaixo" title="Criar linha vazia abaixo desta">⧉↓</button>' +
    '<button type="button" class="mini" data-acao="remover" title="Remover esta linha">🗑</button>' +
    '<button type="button" class="mini soVazia" data-acao="novo" title="Novo campo livre nesta linha">✎</button>' +
    '<button type="button" class="mini trava" data-acao="travar" aria-pressed="false" title="Travar esta linha">🔓</button>' +
    '<button type="button" class="mini" data-acao="descer" title="Descer linha">▼</button>';
  c.addEventListener("click", ev => {
    const b = ev.target.closest("button"); if(!b) return;
    if(b.classList.contains("inerte")) return;      /* botão sem ação neste momento */
    const linha = c.parentElement;
    const acao = b.dataset.acao;
    if(acao === "travar"){ travar(linha, !travada(linha)); return; }
    if(acao === "novo"){ criarCampoLivre(linha); return; }
    if(acao === "acima"){ novaLinha(linha, false); return; }
    if(acao === "abaixo"){ novaLinha(linha.nextElementSibling, false); return; }
    if(acao === "remover"){ if(removivel(linha)) removerLinha(linha); return; }
    if(acao === "subir" || acao === "descer"){
      if(!moverLinha(linha, acao === "subir")) return;
      sincronizarSeparadores(); realcar(); atualizar(); registrarAgora();
    }
  });
  return c;
}
/* rodapé fixo: cria linhas acima dele */
const rodapeMatriz = document.createElement("div");
rodapeMatriz.className = "rodapeMatriz";
rodapeMatriz.innerHTML =
  '<div class="botoesRodape">' +
  '<button type="button" class="mini" data-nova="vazia" title="Criar uma linha vazia acima; entre campos preenchidos, ela abre um respiro">＋ linha</button>' +
  '<button type="button" class="mini" data-nova="livre" title="Criar uma linha com um campo livre acima">✎ campo livre</button>' +
  '</div>' +
  '<p class="aviso tudoTravado hide" role="status" aria-live="polite">Todas as linhas estão travadas. Destrave alguma para criar linha nova.</p>';
/* a dica desta barra fica logo acima dos botões */
rodapeMatriz.insertBefore(el("ajudaRodape"), rodapeMatriz.firstChild);
rodapeMatriz.addEventListener("click", ev => {
  const b = ev.target.closest("button"); if(!b) return;
  const onde = pontoDeInsercao();
  if(!onde) return;                     /* matriz toda travada: os botões já estão desabilitados */
  novaLinha(onde, b.dataset.nova === "livre");
});
matriz.appendChild(rodapeMatriz);

/* criados soltos e posicionados a seguir; quem mora dentro de outro campo não vira bloco */
defs.forEach(d => { if(!d.dentroDe) document.body.appendChild(criarTile(d)); });
sincronizarSeparadores();
aplicar(PADRAO, false, false, undefined, TRAVAS_PADRAO);

/* faixas finas entre as linhas: soltar ali abre uma linha nova naquele ponto */
function sincronizarSeparadores(){
  matriz.querySelectorAll(":scope > .entre").forEach(s => s.remove());
  const ls = linhas();
  ls.forEach((l, i) => {
    if(i === 0) return;                       /* nunca acima da linha do Nome */
    const s = document.createElement("div");
    s.className = "entre";
    matriz.insertBefore(s, l);
  });
}

/* abre espaço no ponto indicado, com uma linha nova.
   Só no limite de linhas é que uma vazia já existente é reaproveitada:
   fora disso, mover um bloco não pode roubar o espaço que a pessoa deixou em outro lugar. */
function abrirLinhaEm(separador){
  const ls = linhas();
  let vazia = null;
  if(ls.length < LINHAS){
    vazia = document.createElement("div");
    vazia.className = "linha";
    vazia.appendChild(controlesLinha());
  } else {
    vazia = [...ls].reverse().find(l => blocos(l).length === 0 && !travada(l));
    if(!vazia) return null;
  }
  matriz.insertBefore(vazia, separador);
  sincronizarSeparadores();
  return vazia;
}

function criarTile(d){
  const t = document.createElement("div");
  t.className = "tile" + (d.obrigatorio ? " obrigatorio" : "");
  t.dataset.id = d.id;
  /* o bloco com titulação vira dois: a titulação, colada por fora à esquerda,
     e a caixa do campo, que é quem tem borda e fundo */
  if(d.temTitulacao) t.classList.add("comTitulacao");
  t.innerHTML =
    (d.temTitulacao ? blocoTitulacao() : '') +
    (d.temTitulacao ? '<div class="caixaTile">' : '') +
    '<div class="cab"><span class="ini">' + d.rotulo +
      (d.obrigatorio ? ' <span class="obrig">(obrigatório)</span>' : '') +
      ' <span class="alca" tabindex="0" role="button" aria-label="Mover ' + d.rotulo +
      '" aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"' +
      ' title="Arraste, ou use as setas do teclado para mover este campo">⠿</span></span>' +
    '<span class="fim">' +
      '<button type="button" class="mini abrir" aria-expanded="false" title="Mostrar opções deste campo">⌄</button>' +
      '<button type="button" class="mini limpar" title="Apagar conteúdo deste campo">🗑</button>' +
    '</span></div>' +
    /* uma fileira só: título à esquerda, formato à direita */
    '<div class="opcs"><span class="grupo tit">' +
      (d.podeOcultar ? sinalMarc("v", d.id, d.verPadrao, ACOES.v, '<span class="sinal titulo">T</span>') : "") +
      (d.podeAbreviar ? sinalMarc("r", d.id, d.abrevPadrao, ACOES.r, '<span class="sinal titulo">T.</span>') : "") +
    '</span><span class="grupo forma">' +
      /* Posição fixa, sempre na mesma ordem, encostada à direita: Aa, WhatsApp, máscara,
         negrito e itálico. Assim os sinais que todo campo tem, N e I, ficam sempre no
         mesmo lugar, e os que faltam abrem espaço à esquerda em vez de embaralhar a fila. */
      (d.numero ? "" : sinalMarc("c", d.id, d.caixaPadrao, ACOES.c, '<span class="sinal caixa">Aa</span>')) +
      (d.tel ? sinalMarc("w", d.id, d.zap, ACOES.w, '<span class="sinal">' + SINAL_ZAP + '</span>', "zap") : "") +
      sinalMarc("b", d.id, d.negrito, ACOES.b, '<span class="sinal grosso">N</span>') +
      sinalMarc("i", d.id, d.italico, ACOES.i, '<span class="sinal inclinado">I</span>') +
    '</span></div>' +
    (d.livre ? '<input type="text" class="tituloLivre" id="' + PRE + 't_' + d.id + '" name="' + PRE + 't_' + d.id + '" autocomplete="off" aria-label="Título do campo livre" placeholder="' + d.dicaTitulo + '">' : '') +
    '<input type="text" class="principal" id="' + PRE + d.id + '" name="' + PRE + d.id + '" autocomplete="' + autoDe(d.id) + '"' +
      (d.obrigatorio ? ' required aria-required="true"' : '') +
      ' aria-label="' + d.rotulo + (d.obrigatorio ? " (obrigatório)" : "") + '" placeholder="' + d.dica + '">' +
    (d.temTitulacao ? '</div>' : '');

  if(d.temTitulacao){
    t.querySelector(".abrirTit").addEventListener("click", () => abrirTitulacao(true));
    t.querySelector(".fecharTit").addEventListener("click", () => abrirTitulacao(false));
    t.querySelector(".dentroTit input[type=text]").addEventListener("input", atualizar);
    t.querySelectorAll(".dentroTit .marc input").forEach(c => c.addEventListener("change", atualizar));
  }

  /* as marcações ficam recolhidas; a setinha as revela quando forem precisas */
  const abrir = t.querySelector(".abrir");
  abrir.addEventListener("click", () => {
    const aberto = t.classList.toggle("aberto");
    abrir.setAttribute("aria-expanded", aberto ? "true" : "false");
    abrir.title = aberto ? "Ocultar opções deste campo" : "Mostrar opções deste campo";
  });

  t.querySelector(".limpar").addEventListener("click", () => {
    campo(d.id).value = "";
    if(tituloEl(d.id)) tituloEl(d.id).value = "";
    atualizar();
  });
  const livre = t.querySelector(".tituloLivre");
  if(livre) livre.addEventListener("input", atualizar);
  t.querySelector("input.principal").addEventListener("input", e => {
    if(d.mascara === "mat") e.target.value = mascaraMatricula(e.target.value);
    if(comMascara(d.id)) e.target.value = mascaraTelefone(e.target.value);
    atualizar();
  });
  t.querySelectorAll(".marc input").forEach(c => c.addEventListener("change", () => {
    if(d.tel){
      const txt = t.querySelector("input.principal");
      if(comMascara(d.id)) txt.value = mascaraTelefone(txt.value);
      ajustarCampoTel(d);
    }
    atualizar();
  }));
  if(d.tel) setTimeout(() => ajustarCampoTel(d), 0);   /* o bloco ainda não está no documento */

  const alca = t.querySelector(".alca");
  if(alca){
    alca.addEventListener("pointerdown", ev => iniciarArrasto(ev, t));
    alca.addEventListener("keydown", ev => teclado(ev, t));
  }
  return t;
}

/* devolve os campos que a disposição pede e que foram apagados.
   `livres` marca quais ids eram campos livres, quando a informação vem de um estado guardado */
function garantirCampos(disp, livres){
  disp.flat().forEach(id => {
    if(tile(id)) return;
    let base = DEFS_BASE.find(d => d.id === id);
    if(!base && (livres ? livres.has(id) : RE_LIVRE.test(id))) base = defLivre(id);
    if(!base) return;
    if(!porId[id]){ defs.push(base); porId[id] = base; }
    document.body.appendChild(criarTile(base));
    const n = RE_LIVRE.exec(id);
    if(n && +n[1] > contadorLivre) contadorLivre = +n[1];
  });
}

/* volta ao conjunto original de campos: os livres criados depois somem */
function descartarExtras(disp){
  const previstos = new Set(disp.flat());
  defs.filter(d => livreExtra(d.id) && !previstos.has(d.id)).forEach(d => {
    const t = tile(d.id);
    if(t) t.remove();
    defs = defs.filter(x => x.id !== d.id);
    delete porId[d.id];
  });
  contadorLivre = 1;
  linhas().slice(PADRAO.length).forEach(l => { if(blocos(l).length === 0) l.remove(); });
}

/* uma linha some de vez quando está destravada e ou está vazia, ou só tem campos livres */
function removivel(linha){
  if(travada(linha)) return false;
  const bs = blocos(linha);
  return bs.length === 0 || bs.every(t => porId[t.dataset.id] && porId[t.dataset.id].livre);
}
function removerLinha(linha){
  blocos(linha).forEach(t => {                     /* descarta junto os campos livres da linha */
    const id = t.dataset.id;
    defs = defs.filter(d => d.id !== id);
    delete porId[id];
    t.remove();
  });
  linha.remove();
  sincronizarSeparadores(); realcar(); atualizar(); registrarAgora();
}

/* ---------- criação de linhas ---------- */
function novaLinha(antesDe, comCampoLivre){
  if(linhas().length >= LINHAS) return null;
  const l = document.createElement("div");
  l.className = "linha";
  l.appendChild(controlesLinha());
  matriz.insertBefore(l, antesDe || rodapeMatriz);
  if(comCampoLivre) criarCampoLivre(l);
  else { sincronizarSeparadores(); realcar(); atualizar(); registrarAgora(); }
  return l;
}

/* ---------- campos livres extras ---------- */
let contadorLivre = 1;
function criarCampoLivre(linha){
  if(blocos(linha).length >= COLS || travada(linha)) return;
  contadorLivre++;
  while(porId["livre" + contadorLivre]) contadorLivre++;   /* nunca reaproveita um id em uso */
  const d = defLivre("livre" + contadorLivre);
  defs.push(d);
  porId[d.id] = d;
  linha.appendChild(criarTile(d));
  sincronizarSeparadores(); realcar(); atualizar(); registrarAgora();
  const caixa = tituloEl(d.id);
  if(caixa) caixa.focus();
}

/* ---------- disposição ---------- */
function disposicao(){
  return linhas().map(l => blocos(l).map(t => t.dataset.id));
}
/* estado dos cadeados, uma posição por linha, na mesma ordem da disposição */
function travas(){ return linhas().map(travada); }
function aplicarTravas(lista){
  if(!lista) return;
  linhas().forEach((l, i) => l.classList.toggle("travada", !!lista[i]));
}
function tile(id){ return document.querySelector('.tile[data-id="' + id + '"]'); }

/* `comHistorico` não se chama `registrar` de propósito: o nome sombrearia a função de histórico */
function aplicar(disp, comHistorico = true, limparExtras = false, livres, listaTravas){
  if(comHistorico) registrarHistorico();
  if(limparExtras) fecharTitulacao();     /* voltar ao padrão é voltar sem titulação */
  linhas().forEach(l => l.classList.remove("travada"));   /* as travas do estado novo entram no fim */
  if(limparExtras) descartarExtras(disp);
  garantirCampos(disp, livres);
  /* os blocos são movidos (nunca recriados), para não perder estado nem ouvintes */
  const usados = new Set();
  while(linhas().length < disp.length && linhas().length < LINHAS){   /* recria as linhas que o estado tinha */
    const l = document.createElement("div");
    l.className = "linha";
    l.appendChild(controlesLinha());
    matriz.insertBefore(l, rodapeMatriz);
  }
  linhas().forEach((l, i) => {
    (disp[i] || []).forEach(id => {
      const t = tile(id);
      if(t && !usados.has(id)){ l.appendChild(t); usados.add(id); }
    });
  });
  defs.forEach(d => {
    if(usados.has(d.id)) return;
    const t = tile(d.id);
    if(!t) return;
    /* campos livres criados depois vão para linhas próprias no fim */
    const ls = linhas();
    let destino = ls.slice(1).find(l => blocos(l).length === 0);
    if(!destino){
      destino = document.createElement("div");
      destino.className = "linha";
      destino.appendChild(controlesLinha());
      matriz.insertBefore(destino, rodapeMatriz);
    }
    destino.appendChild(t);
  });
  /* sobrou linha vazia além do que o estado tinha: descarta */
  while(linhas().length > disp.length){
    const ultima = linhas()[linhas().length - 1];
    if(blocos(ultima).length) break;
    ultima.remove();
  }
  sincronizarSeparadores();
  aplicarTravas(listaTravas);
  realcar();
  atualizar();
}

/* ---------- histórico geral (texto, marcações, barra e disposição) ---------- */

function estadoAtual(){
  const campos = {};
  defs.forEach(d => {
    campos[d.id] = {
      v: campo(d.id) ? campo(d.id).value : "",
      t: tituloEl(d.id) ? tituloEl(d.id).value : "",
      b: !!(marca("b", d.id) && marca("b", d.id).checked),
      c: !!(marca("c", d.id) && marca("c", d.id).checked),
      i: !!(marca("i", d.id) && marca("i", d.id).checked),
      /* vt e rt, não v e r: a chave "v" já guarda o valor digitado do campo */
      vt: !!(marca("v", d.id) && marca("v", d.id).checked),
      rt: !!(marca("r", d.id) && marca("r", d.id).checked),
      w: !!(marca("w", d.id) && marca("w", d.id).checked),
      livre: !!d.livre                       /* o estado guarda o que o campo é, sem depender do nome do id */
    };
  });
  return JSON.stringify({
    campos, layout: disposicao(), travas: travas(), tit: titulacaoAberta(),
    logo: logoEscolhido,
    cor: el("cor").value, esp: el("espessura").value,
    tm: el("titAuto").checked, tn: el("titNegrito").checked,
    ti: el("titItalico").checked, tc: el("titCaixa").checked
  });
}

function aplicarEstado(txt){
  const e = JSON.parse(txt);
  restaurando = true;
  /* recria TODOS os campos do estado guardado que já não existem, antes de repor os valores;
     fazer isso depois devolveria o campo em branco */
  const livres = new Set(Object.keys(e.campos).filter(id => e.campos[id].livre));
  garantirCampos(e.layout, livres);
  Object.keys(e.campos).forEach(id => {          /* usa o que o estado guardou, não a lista atual */
    const d = porId[id]; if(!d) return;
    const s = e.campos[id];
    if(campo(d.id)) campo(d.id).value = s.v;
    if(tituloEl(d.id)) tituloEl(d.id).value = s.t || "";
    [["b","b"],["c","c"],["i","i"],["w","w"],["v","vt"],["r","rt"]]
      .forEach(([chave, guardada]) => { const c = marca(chave, d.id); if(c) c.checked = !!s[guardada]; });
    if(d.tel) ajustarCampoTel(d);
  });
  marcarTitulacao(!!e.tit);
  if(e.logo && e.logo !== logoEscolhido){ logoEscolhido = e.logo; montarLogos(); }
  el("cor").value = e.cor;
  el("espessura").value = e.esp;
  el("espessuraVal").textContent = e.esp + "px";
  el("titAuto").checked = e.tm;
  el("titNegrito").checked = e.tn;
  el("titItalico").checked = !!e.ti;
  el("titCaixa").checked = !!e.tc;
  sincronizarPaleta();
  /* tira o que não existia naquele momento: sem isso o desfazer deixa campos órfãos */
  const previstos = new Set(e.layout.flat());
  [...document.querySelectorAll(".tile")].forEach(t => {
    const id = t.dataset.id;
    if(previstos.has(id)) return;
    t.remove();
    if(livreExtra(id)){ defs = defs.filter(x => x.id !== id); delete porId[id]; }
  });
  aplicar(e.layout, false, false, livres, e.travas);
  restaurando = false;
  atualizar();
}

function registrar(){                     /* guarda o estado atual, agrupando digitação */
  if(restaurando) return;
  clearTimeout(agendado);
  agendado = setTimeout(() => {
    agendado = null;
    const e = estadoAtual();
    if(pilha[indice] === e) return;
    pilha = pilha.slice(0, indice + 1);
    pilha.push(e);
    if(pilha.length > 100){ pilha.shift(); } else indice++;
    botoesHistorico();
  }, 350);
}
function botoesHistorico(){
  el("btnDesfazer").disabled = indice <= 0;
  el("btnRefazer").disabled = indice >= pilha.length - 1;
}
/* fecha o agrupamento da digitação: sem isso, desfazer logo depois de digitar
   descartaria o trecho recém-escrito, que ainda não tinha entrado na pilha */
function firmar(){ if(agendado){ clearTimeout(agendado); agendado = null; registrarAgora(); } }
function desfazer(){ firmar(); if(indice > 0){ indice--; aplicarEstado(pilha[indice]); botoesHistorico(); } }
function refazer(){ firmar(); if(indice < pilha.length - 1){ indice++; aplicarEstado(pilha[indice]); botoesHistorico(); } }

/* ações indivisíveis (arrastar, mover, restaurar, marcar) entram no histórico na hora */
function registrarAgora(){
  if(restaurando) return;
  clearTimeout(agendado); agendado = null;
  const e = estadoAtual();
  if(pilha[indice] === e) return;
  pilha = pilha.slice(0, indice + 1);
  pilha.push(e);
  if(pilha.length > 100) pilha.shift(); else indice++;
  botoesHistorico();
}
const registrarHistorico = registrarAgora;
/* O Nome não é mais preso por código: quem protege a primeira linha é o cadeado,
   que vem fechado na estrutura padrão. */
function realcar(){
  const ls = linhas();
  ls.forEach((l, i) => {
    const vazia = blocos(l).length === 0;
    const presa = travada(l);
    l.classList.toggle("cheia", blocos(l).length >= COLS);
    l.classList.toggle("semnada", vazia);
    l.classList.toggle("removivel", removivel(l));
    /* Botão sem ação possível ganha "inerte": na linha vazia ele fica visível e apagado,
       para não desalinhar a fileira; na linha com campos, some. Quem faz isso é o CSS. */
    const inerte = (acao, sim) => {
      const b = l.querySelector('.ctrl .mini[data-acao="' + acao + '"]');
      if(b){ b.classList.toggle("inerte", sim); b.disabled = sim; }
    };
    inerte("subir",   alvoSubir(ls, i) === null);
    inerte("descer",  alvoDescer(ls, i) === null);
    inerte("remover", presa || !removivel(l));
    inerte("novo",    presa || blocos(l).length >= COLS);
    const cad = l.querySelector('.ctrl .mini[data-acao="travar"]');
    if(cad){
      cad.textContent = presa ? "🔒" : "🔓";
      cad.title = presa ? "Destravar esta linha" : "Travar esta linha";
      cad.setAttribute("aria-pressed", presa ? "true" : "false");
      cad.setAttribute("aria-label", (presa ? "Destravar" : "Travar") + " linha " + (i + 1));
    }
  });
  /* rodapé: sem nenhuma linha destravada não há onde criar */
  const semLugar = !pontoDeInsercao();
  rodapeMatriz.querySelectorAll("[data-nova]").forEach(b => { b.disabled = semLugar; });
  const nota = rodapeMatriz.querySelector(".tudoTravado");
  if(nota) nota.classList.toggle("hide", !semLugar);
}

/* ---------- arrasto (mouse, caneta e toque) ---------- */
function iniciarArrasto(ev, t){
  if(ev.button !== undefined && ev.button !== 0) return;
  if(travada(t.parentElement)) return;        /* bloco de linha travada não sai do lugar */
  ev.preventDefault();
  /* ouvintes no documento: mover o bloco no DOM cancela a captura de ponteiro em alguns navegadores */
  arrastado = t; linhaOrigem = t.parentElement;
  const antes = disposicao();
  let linhaAberta = null;                     /* linha criada durante este arrasto */
  /* chamada DEPOIS de mover o bloco: a linha aberta antes, se ficou vazia, volta para o fim */
  const devolverLinhaAberta = anterior => {
    if(anterior && anterior !== linhaAberta && anterior.isConnected && blocos(anterior).length === 0){
      anterior.remove();                       /* linha aberta que não recebeu nada simplesmente some */
      sincronizarSeparadores();
    }
  };
  t.classList.add("arrastando");
  document.body.classList.add("arrastando");

  const mover = e => {
    const alvo = document.elementFromPoint(e.clientX, e.clientY);
    if(!alvo || !alvo.closest) return;

    /* soltou entre duas linhas: abre uma linha nova ali, usando a última vazia */
    const separador = alvo.closest(".entre");
    if(separador){
      matriz.querySelectorAll(".entre").forEach(s => s.classList.toggle("alvo", s === separador));
      linhas().forEach(l => l.classList.remove("alvo"));
      /* já abriu a linha nesta faixa: não abrir outra a cada movimento do ponteiro */
      const seguinte = separador.nextElementSibling;
      if(seguinte && seguinte.classList.contains("linha") && blocos(seguinte).length === 1 && blocos(seguinte)[0] === t) return;
      const anterior = linhaAberta;
      const nova = abrirLinhaEm(separador);
      if(nova){
        nova.appendChild(t);
        linhaAberta = nova;
        devolverLinhaAberta(anterior);        /* não deixa rastro de linhas vazias pelo caminho */
      realcar();
      }
      return;
    }
    matriz.querySelectorAll(".entre").forEach(s => s.classList.remove("alvo"));

    const linha = alvo.closest(".linha");
    linhas().forEach(l => l.classList.toggle("alvo", l === linha && !travada(l)));
    if(!linha || travada(linha)) return;        /* linha travada não recebe blocos */
    if(linha !== t.parentElement && blocos(linha).length >= COLS) return;
    const ref = posicao(linha, e.clientX);
    const anterior = linhaAberta;
    if(ref === null){ if(t.parentElement !== linha || blocos(linha)[blocos(linha).length-1] !== t) linha.appendChild(t); }
    else if(ref !== t.nextSibling) linha.insertBefore(t, ref);
    if(linha !== linhaAberta){ linhaAberta = null; devolverLinhaAberta(anterior); }

    realcar();
  };
  const soltar = () => {
    document.removeEventListener("pointermove", mover);
    document.removeEventListener("pointerup", soltar);
    document.removeEventListener("pointercancel", soltar);
    t.classList.remove("arrastando");
    document.body.classList.remove("arrastando");
    matriz.querySelectorAll(".alvo").forEach(l => l.classList.remove("alvo"));
    /* a linha de onde o bloco saiu FICA, mesmo vazia: quem decide eliminá-la é a pessoa, pela lixeira.
       Linha vazia no meio é espaço na assinatura, e isso costuma ser proposital. */

    realcar();
    if(JSON.stringify(antes) !== JSON.stringify(disposicao())) registrarAgora();
    arrastado = null; linhaOrigem = null;
    atualizar();
  };
  document.addEventListener("pointermove", mover);
  document.addEventListener("pointerup", soltar);
  document.addEventListener("pointercancel", soltar);
}

function posicao(linha, x){
  for(const c of blocos(linha).filter(c => c !== arrastado)){
    const r = c.getBoundingClientRect();
    if(x < r.left + r.width/2) return c;
  }
  return null;
}

/* ---------- teclado na alça ---------- */
/* Enter e Espaço não arrastam nada: dizem em voz alta como se move o campo */
function teclado(ev, t){
  if(ev.key === "Enter" || ev.key === " "){
    ev.preventDefault();
    avisar("Use as setas do teclado para mover " + (porId[t.dataset.id] || {}).rotulo + ".");
    return;
  }
  if(!ev.key.startsWith("Arrow")) return;   /* com a alça em foco, as setas já movem */
  const ls = linhas();
  const linha = t.parentElement, i = ls.indexOf(linha);
  if(travada(linha)){
    ev.preventDefault();
    avisar("Linha travada: destrave o cadeado para mover este campo.");
    return;
  }
  const irmaos = blocos(linha), j = irmaos.indexOf(t);
  /* vizinha na vertical: a primeira destravada naquele sentido */
  const vizinha = passo => {
    let k = i + passo;
    while(k >= 0 && k < ls.length && travada(ls[k])) k += passo;
    return (k >= 0 && k < ls.length) ? ls[k] : null;
  };
  const acima = vizinha(-1), abaixo = vizinha(1);
  let agiu = true;
  if(ev.key === "ArrowLeft" && j > 0) linha.insertBefore(t, irmaos[j-1]);
  else if(ev.key === "ArrowRight" && j < irmaos.length - 1) linha.insertBefore(irmaos[j+1], t);
  else if(ev.key === "ArrowUp" && acima && blocos(acima).length < COLS) acima.appendChild(t);
  else if(ev.key === "ArrowDown" && abaixo && blocos(abaixo).length < COLS) abaixo.appendChild(t);
  else agiu = false;
  ev.preventDefault();   /* evita rolar a página com as setas */
  if(!agiu) return;
  registrarHistorico();
  realcar(); atualizar(); registrarAgora();
  t.querySelector(".alca").focus();
  const ls2 = linhas(), li = ls2.indexOf(t.parentElement);
  avisar((porId[t.dataset.id] || {}).rotulo + ": linha " + (li + 1) + ", posição " + (blocos(t.parentElement).indexOf(t) + 1) + ".");
}

/* ---------- escolhas ---------- */
/* Não há mais quadradinho à vista: o que mostra a opção em uso é a caixa em volta.
   A classe entra por aqui, e não por :has(), porque a marcação também muda por código. */
function sincronizarEscolhas(){
  document.querySelectorAll(".marc, .opc").forEach(l => {
    const i = l.querySelector("input");
    if(!i || i.type === "range") return;
    l.classList.toggle("escolhida", !!i.checked);
    l.classList.toggle("desabilitada", !!i.disabled);
    /* a dica diz o que o clique faz agora; em botão desabilitado, quem escreve
       o texto é quem o desabilitou, explicando o motivo */
    if(!i.disabled && l.dataset.lig) l.title = i.checked ? l.dataset.desl : l.dataset.lig;
  });
  avisarMarcas();
}

/* Enquanto a automação manda naquela linha, os botões de título do campo não têm
   efeito nenhum: ficam desabilitados, dizendo o porquê, em vez de aceitar cliques à toa. */
function ajustarBotoesTitulo(){
  const auto = automatizarTitulos();
  const porLinha = {};
  disposicao().forEach(l => {
    const cheios = l.filter(entra);
    cheios.forEach(id => { porLinha[id] = cheios.length > 1; });
  });
  defs.forEach(d => {
    const acompanhado = !!porLinha[d.id];
    const mandaAutomacao = auto && acompanhado && !d.semAutomacao;
    const corridoImposto = auto && acompanhado && d.corrido;
    [["v", mandaAutomacao], ["r", mandaAutomacao || corridoImposto]].forEach(([chave, inerte]) => {
      const c = marca(chave, d.id);
      if(!c) return;
      c.disabled = inerte;
      const cx = c.closest(".marc");
      if(cx && inerte) cx.title = "A automação está no comando desta linha; desligue-a para escolher o título campo a campo";
    });
    /* título oculto não tem forma: o botão de abreviar sai de cena */
    const v = marca("v", d.id), r = marca("r", d.id);
    if(r && r.closest(".marc")) r.closest(".marc").classList.toggle("oculta", !!v && !v.checked);
  });
}

/* Com as marcações recolhidas, a setinha precisa dizer que há algo fora do comum
   naquele campo: um ponto, e a lista no title. */
const NOMES_MARCA = { c:"Caixa alta", b:"Negrito", i:"Itálico", w:"WhatsApp",
                      v:"título oculto", r:"título abreviado" };
function avisarMarcas(){
  defs.forEach(d => {
    const t = tile(d.id); if(!t) return;
    const b = t.querySelector(".abrir"); if(!b) return;
    const ligada = k => { const c = marca(k, d.id); return !!(c && c.checked); };
    const mudou = [];
    if(marca("c", d.id) && ligada("c") !== !!d.caixaPadrao) mudou.push(NOMES_MARCA.c);
    if(ligada("b") !== !!d.negrito) mudou.push(NOMES_MARCA.b);
    if(ligada("i") !== !!d.italico) mudou.push(NOMES_MARCA.i);
    if(marca("w", d.id) && ligada("w") !== !!d.zap) mudou.push(NOMES_MARCA.w);
    if(marca("v", d.id) && ligada("v") !== !!d.verPadrao) mudou.push(NOMES_MARCA.v);
    if(marca("r", d.id) && ligada("r") !== !!d.abrevPadrao) mudou.push(NOMES_MARCA.r);
      b.classList.toggle("temMarca", mudou.length > 0);
    const aberto = t.classList.contains("aberto");
    b.title = (aberto ? "Ocultar opções deste campo" : "Mostrar opções deste campo")
            + (mudou.length ? " (" + mudou.join(", ") + ")" : "");
  });
}
document.addEventListener("change", sincronizarEscolhas);

/* recado curto para leitor de tela; a região fica fora da vista */
let avisoTempo = null;
function avisar(texto){
  const r = el("avisoTeclado");
  if(!r) return;
  r.textContent = texto;
  clearTimeout(avisoTempo);
  avisoTempo = setTimeout(() => { r.textContent = ""; }, 4000);
}

el("btnDesfazer").addEventListener("click", desfazer);
el("btnRefazer").addEventListener("click", refazer);
document.addEventListener("keydown", ev => {
  if(!(ev.ctrlKey || ev.metaKey)) return;
  const k = ev.key.toLowerCase();
  if(k === "z" && !ev.shiftKey){ ev.preventDefault(); desfazer(); }
  else if((k === "z" && ev.shiftKey) || k === "y"){ ev.preventDefault(); refazer(); }
});
function apagarConteudos(){
  fecharTitulacao();          /* apagar o conteúdo inclui a titulação, que sem texto trava a geração */
  defs.forEach(d => {
    if(tituloEl(d.id)) tituloEl(d.id).value = "";
    if(campo(d.id)) campo(d.id).value = "";
    const b = marca("b", d.id); if(b) b.checked = !!d.negrito;
    const c = marca("c", d.id); if(c) c.checked = !!d.caixaPadrao;
    const i = marca("i", d.id); if(i) i.checked = !!d.italico;
    const v = marca("v", d.id); if(v) v.checked = !!d.verPadrao;
    const r = marca("r", d.id); if(r) r.checked = !!d.abrevPadrao;
    const w = marca("w", d.id); if(w) w.checked = !!d.zap;
    if(d.tel) ajustarCampoTel(d);
  });
  atualizar();
}
function restaurarBarra(){
  logoEscolhido = "selo";
  montarLogos();
  el("cor").value = "#AD841F";
  el("espessura").value = 3;
  el("espessuraVal").textContent = "3px";
  el("titAuto").checked = true;
  el("titNegrito").checked = true;
  el("titItalico").checked = false;
  el("titCaixa").checked = false;
  sincronizarPaleta();
}
/* o que fugiu do padrão */
function camposMudaram(){
  if(titulacaoAberta()) return true;                         /* a titulação é acréscimo à estrutura */
  if(defs.some(d => livreExtra(d.id))) return true;          /* campo livre criado depois */
  if(DEFS_BASE.some(d => !d.dentroDe && !tile(d.id))) return true;          /* algum campo do padrão foi apagado */
  /* comparação literal, linha a linha: uma linha vazia a mais, mesmo no fim, está fora do padrão.
     Ela aparece na matriz, então precisa ser restaurável. Os cadeados contam junto. */
  return JSON.stringify(disposicao()) !== JSON.stringify(PADRAO)
      || JSON.stringify(travas()) !== JSON.stringify(TRAVAS_PADRAO);
}
function barraMudou(){
  return logoMudou() || el("cor").value.toUpperCase() !== "#AD841F" || el("espessura").value !== "3"
      || !el("titAuto").checked || !el("titNegrito").checked
      || el("titItalico").checked || el("titCaixa").checked;
}
function podeRestaurar(){
  return { campos: camposMudaram(), barra: barraMudou(), limpar: algoDigitado() };
}

const ROTULOS = {
  campos: "Apenas disposições dos campos",
  barra:  "Apenas aparência (logotipo, barra e títulos)",
  limpar: "Apenas apagar os campos preenchidos"
};

let focoAnterior = null;
/* enquanto o diálogo está aberto, o resto da página sai do alcance do teclado e do leitor de tela */
function trancarFundo(trancar){
  const fundo = document.querySelector(".wrap");
  if(!fundo) return;
  if(trancar){ fundo.setAttribute("inert", ""); fundo.setAttribute("aria-hidden", "true"); }
  else { fundo.removeAttribute("inert"); fundo.removeAttribute("aria-hidden"); }
}
function fecharModal(){
  if(el("modal").classList.contains("hide")) return;
  el("modal").classList.add("hide");
  trancarFundo(false);
  if(focoAnterior){ focoAnterior.focus(); focoAnterior = null; }
}
/* mantém o foco dentro do diálogo enquanto ele estiver aberto */
el("modal").addEventListener("keydown", ev => {
  if(ev.key !== "Tab") return;
  const foco = [...el("modal").querySelectorAll("input, button")].filter(e => !e.disabled);
  if(!foco.length) return;
  const primeiro = foco[0], ultimo = foco[foco.length - 1];
  if(ev.shiftKey && document.activeElement === primeiro){ ev.preventDefault(); ultimo.focus(); }
  else if(!ev.shiftKey && document.activeElement === ultimo){ ev.preventDefault(); primeiro.focus(); }
});

function abrirModal(itens){
  const box = el("mOpcoes");
  box.innerHTML = itens.map(k =>
    '<label class="opc"><input type="checkbox" autocomplete="off" data-k="' + k + '"> ' + ROTULOS[k] + '</label>'
  ).join("") + (itens.length > 1 ? '<label class="opc"><input type="checkbox" autocomplete="off" data-k="tudo"> Restaurar tudo</label>' : "");

  el("mRestaurar").textContent = itens.length > 1 ? "Restaurar Selecionados" : "Restaurar Selecionado";
  el("mRestaurar").disabled = true;
  sincronizarEscolhas();
  focoAnterior = document.activeElement;
  el("modal").classList.remove("hide");
  trancarFundo(true);
  el("mCancelar").focus();                    /* Cancelar é o botão padrão */
}

el("mOpcoes").addEventListener("change", ev => {
  const alvo = ev.target;
  const todas = [...el("mOpcoes").querySelectorAll('input[data-k]:not([data-k="tudo"])')];
  const tudo = el("mOpcoes").querySelector('input[data-k="tudo"]');
  if(alvo.dataset.k === "tudo") todas.forEach(c => c.checked = tudo.checked);
  else if(tudo) tudo.checked = todas.every(c => c.checked);
  el("mRestaurar").disabled = !todas.some(c => c.checked);
});

el("btnPadrao").addEventListener("click", () => {
  const p = podeRestaurar();
  const itens = Object.keys(ROTULOS).filter(k => p[k]);
  if(!itens.length){ aplicar(PADRAO, true, true, undefined, TRAVAS_PADRAO); return; }
  abrirModal(itens);
});

el("mRestaurar").addEventListener("click", () => {
  const marcado = k => !!el("mOpcoes").querySelector('input[data-k="' + k + '"]:checked');
  registrarHistorico();
  if(marcado("limpar")) apagarConteudos();
  if(marcado("barra")) restaurarBarra();
  if(marcado("campos")) aplicar(PADRAO, false, true, undefined, TRAVAS_PADRAO);
  atualizar();
  fecharModal();
});
el("mCancelar").addEventListener("click", fecharModal);
el("modal").addEventListener("click", ev => { if(ev.target === el("modal")) fecharModal(); });
document.addEventListener("keydown", ev => {
  if(ev.key !== "Escape") return;
  /* Esc no aviso de inatividade vale como "continuar": é interação */
  if(!el("modalTempo").classList.contains("hide")){ pararContagem(); reiniciarOcio(); return; }
  fecharModal();
});

/* ---------- conteúdo ---------- */
function digitado(id){ const i = campo(id); return i ? i.value.trim() : ""; }
function algoDigitado(){
  return defs.some(d => digitado(d.id) || (tituloEl(d.id) && tituloEl(d.id).value.trim()));
}
/* o campo livre entra por qualquer um dos dois: título e conteúdo são independentes,
   e nenhum deles some calado por falta do outro */
function entra(id){
  const d = porId[id];
  if(!d) return false;
  if(d.livre) return !!(tituloLivre(id) || valor(id));
  /* o Nome entra também com só a titulação escrita: senão a visualização fica
     vazia enquanto a pessoa digita, sem dizer por quê */
  if(d.temTitulacao && titulacaoAberta() && valor("titulacao")) return true;
  return !!valor(id);
}
function valor(id){ return exemplo ? (EXEMPLO[id] || "") : digitado(id); }
function negrito(id){ const c = marca("b", id); return !!(c && c.checked); }
function caixaAlta(id){ const c = marca("c", id); return !!(c && c.checked); }
function italico(id){ const c = marca("i", id); return !!(c && c.checked); }
/* estilo embutido, que é o que atravessa cliente de e-mail antigo */
function estilar(id, html, semNegrito){
  if(negrito(id) && !semNegrito) html = B(html);
  if(italico(id)) html = '<span style="font-style:italic">' + html + '</span>';
  return html;
}

/* Número brasileiro em forma nacional: DDD + 8 ou 9 algarismos.
   Não exige que o celular comece por 9: há WhatsApp em linha fixa e em número antigo. */
function normalizarTelefone(v){
  let d = String(v || "").replace(/\D/g, "");
  if(d.startsWith("55") && d.length > 11) d = d.slice(2);      /* aceita +55 digitado */
  return {
    digitos: d,
    ddd: d.slice(0, 2),
    fixoValido: d.length === 10,
    celularValido: d.length === 11,
    completo: d.length === 10 || d.length === 11,
    internacional: "55" + d
  };
}

/* ---------- número para o wa.me ----------
   Regra oficial: número completo em formato internacional, só algarismos,
   sem "+", sem zeros de prefixo, sem parênteses e sem traços. O teto é o da
   E.164: 15 algarismos. Aqui a entrada pode vir de três jeitos:
     +55 21 91234-5678  → já internacional, é só limpar
     0021 21 9...       → 00 é prefixo de discagem internacional, cai fora
     (21) 91234-5678    → forma nacional, ganha o 55
     0800 570 0800      → o zero é prefixo nacional; cai o zero e entra o 55
   Devolve { digitos, valido, motivo }. */
function paraWhats(v){
  const bruto = String(v || "").trim();
  const internacional = /^\s*(\+|00)/.test(bruto);
  let d = bruto.replace(/\D/g, "");
  let motivo = "";
  if(!d) return { digitos:"", valido:false, motivo:"sem número" };
  /* "2334-0000, ramal 210" colaria o 210 no fim do número e produziria um link errado */
  if(/[^\d\s()+.\-]/.test(bruto))
    return { digitos:"", valido:false, motivo:"só algarismos, com o código do país (ex.: +5521912345678)" };

  if(internacional){
    if(d.startsWith("00")) d = d.slice(2);
    if(d.length < 8) motivo = "curto demais para um número internacional";
    else if(d.length > 15) motivo = "passa dos 15 algarismos do padrão internacional";
    return { digitos: d, valido: !motivo, motivo, internacional: true };
  }

  /* forma nacional: o zero da frente é prefixo de discagem e cai fora.
     Sobram 10 ou 11 algarismos, seja DDD + número, seja 0800 e afins. */
  const semZero = d.replace(/^0+/, "");
  if(semZero.length === 12 || semZero.length === 13){
    /* a pessoa digitou o 55 sem o + */
    return { digitos: semZero, valido: true, motivo: "", internacional: true };
  }
  if(semZero.length < 10) motivo = "faltam algarismos: são 10 ou 11, com o DDD";
  else if(semZero.length > 11) motivo = "algarismos demais para um número brasileiro";
  return { digitos: motivo ? semZero : "55" + semZero, valido: !motivo, motivo, internacional: false };
}

/* Só o Celular tem máscara, e ela é calada: ali o número é sempre brasileiro e não
   comporta ramal nem observação. O WhatsApp a desliga, porque o número pode ser
   estrangeiro e a máscara brasileira o estragaria. */
function comMascara(id){
  const d = porId[id];
  return !!(d && d.mascaraSempre) && !comWhats(id);
}
function comWhats(id){
  const c = marca("w", id);
  return !!(c && c.checked);
}
/* o campo muda de exemplo conforme o que está pedindo, e os sinais se excluem:
   caixa alta é coisa de texto; máscara e WhatsApp são coisa de número. */
function ajustarCampoTel(d){
  const txt = campo(d.id);
  if(!txt) return;
  const zap = comWhats(d.id);
  const c = marca("c", d.id), w = marca("w", d.id);
  txt.placeholder = zap ? "+5521912345678" : d.dica;
  /* caixa alta é coisa de texto; WhatsApp é coisa de número */
  if(w){
    w.disabled = !!(c && c.checked);
    if(w.disabled) w.closest(".marc").title = "A caixa alta está marcada; remova-a para usar o WhatsApp";
  }
  if(c){
    c.disabled = zap;
    if(c.disabled) c.closest(".marc").title = "O WhatsApp está marcado; remova-o para usar a caixa alta";
  }
  sincronizarEscolhas();
}

function tituloLivre(id){
  if(exemplo) return EXEMPLO["t_" + id] || "";
  const i = tituloEl(id);
  return i ? i.value.trim() : "";
}

/* ---------- títulos ---------- */
/* declaradas como função, e não como const: a matriz é montada no meio do arquivo
   e chama atualizar() antes daqui, o que derrubaria uma const pela zona morta */
function automatizarTitulos(){ return el("titAuto").checked; }
function verTitulo(id){ const c = marca("v", id); return !!(c && c.checked); }
function abreviarTitulo(id){ const c = marca("r", id); return !!(c && c.checked); }

/* Qual forma o campo usa nesta linha, ou "" quando o título não sai.
   `primeiro` diz se ele abre a linha (contados só os campos preenchidos);
   `acompanhado`, se divide a linha com algum outro. */
function formaTitulo(id, primeiro, acompanhado){
  const d = porId[id];
  if(!d) return "";
  if(d.livre){
    /* o título do campo livre sempre termina em dois-pontos, e nunca em dois deles;
       as chaves são escapadas para não confundir a marcação do negrito */
    const t = esc(tituloLivre(id)).replace(/[{}]/g, m => m === "{" ? "&#123;" : "&#125;")
              .replace(/[:\s]+$/, "");
    return t ? "{" + t + "}: " : "";
  }
  if(!d.titulo) return "";                                  /* Nome e Lotação não têm título */

  let abreviar;
  if(automatizarTitulos() && acompanhado){
    /* a automação só age em linha com mais de um campo, e silencia os títulos.
       Matrícula, Sala e Atendimento escapam: sem o rótulo, o conteúdo deles fica ilegível. */
    if(!d.semAutomacao) return "";
    abreviar = d.corrido ? true : abreviarTitulo(id);        /* corrido é o que faz a frase correr */
  } else {
    if(d.podeOcultar && !verTitulo(id)) return "";
    abreviar = d.podeAbreviar && abreviarTitulo(id);
  }
  return abreviar && d.abrev ? d.abrev : d.titulo;
}

/* Reparte a forma em três: o que vem antes da palavra do título, a palavra que
   carrega os efeitos, e o que vem depois — o ":" ou o conectivo "n." e "de". */
function partesTitulo(forma){
  const m = /^([^{]*)\{([^}]*)\}(.*)$/.exec(forma || "");
  return m ? { pre:m[1], palavra:m[2], pos:m[3] } : { pre:"", palavra:"", pos:forma || "" };
}
const ITAL = t => '<span style="font-style:italic">' + t + '</span>';
function vestir(texto, comN, comI){
  if(!texto) return texto;
  let t = texto;
  if(comI) t = ITAL(t);
  if(comN) t = B(t);
  return t;
}
/* Escreve a forma já repartida, com a maiúscula de abertura, a caixa alta que a
   congruência do trecho permitir e os efeitos que couberem a cada pedaço. */
function escreverTitulo(forma, o){
  const p = partesTitulo(forma);
  if(!p.palavra && !p.pos) return "";
  let palavra = p.palavra;
  if(!o.minusculo && palavra) palavra = palavra.replace(/^./, c => c.toLocaleUpperCase("pt-BR"));
  if(o.caixa) palavra = palavra.toLocaleUpperCase("pt-BR");
  /* o conectivo — "n.", "de" — sobe junto com o trecho, mas não leva os efeitos
     do título; só acompanha o campo quando o efeito é pleno */
  let pos = o.caixaConectivo ? p.pos.toLocaleUpperCase("pt-BR") : p.pos;
  return p.pre + vestir(palavra, o.negrito, o.italico) + vestir(pos, o.negritoPos, o.italicoPos);
}

/* pontuação de fecho, só onde a regra manda: `tirarPontuacao` limpa o fim para o
   vizinho entrar por vírgula; `pontoFinal` fecha a frase, trocando o que houver. */
function conteudo(id, ajuste){
  const a = ajuste || {};
  let bruto = valor(id);
  if(!bruto) return "";
  if(a.semRepetir){
    /* o conectivo do título já disse a palavra; repeti-la no conteúdo produz "de de" */
    const p = a.semRepetir.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    bruto = bruto.replace(new RegExp("^" + p + "\\s+", "i"), "");
  }
  if(a.tirarPontuacao) bruto = bruto.replace(FIM_PONTUADO, "");
  if(a.pontoFinal) bruto = bruto.replace(FIM_PONTUADO, "") + ".";
  const v = caixaAlta(id) ? bruto.toLocaleUpperCase("pt-BR") : bruto;
  if(porId[id].tel){
    if(!comWhats(id)) return esc(v);                       /* sem WhatsApp: texto puro, sem link */
    const w = paraWhats(bruto);
    if(!w.valido) return esc(v);                           /* número que não fecha não vira link */
    return '<a target="_blank" rel="noopener noreferrer" style="color:#0072CE; text-decoration:none;" href="https://wa.me/' + esc(w.digitos) + '">' + esc(v) + '</a>';
  }
  /* o endereço vai no href como foi digitado; a caixa alta muda só o que se lê */
  if(id === "email") return '<a style="color:#0072CE; text-decoration:none;" href="mailto:' + esc(bruto) + '">' + esc(v) + '</a>';
  return esc(v);
}

function corpoHTML(){
  const EST_LINHA = 'font-size:' + TAM_CORPO + 'px; color:#000000; font-weight:400; line-height:1.4';
  const VAZIA = "";
  const ESPACO = '<span style="font-size:8px; line-height:8px;">&nbsp;</span>';

  const saida = [];
  const EST_NOME = () => 'font-size:16px; color:#000000; font-weight:' + (negrito("nome") ? "700" : "300") + '; line-height:1.4';

  /* Monta uma linha. Três junções convivem aqui:
       barra   — o caso comum
       vírgula — Sala e Atendimento na forma corrida, colados ao vizinho
       ( )     — a Matrícula logo depois do Nome, e só nesse par */
  const monta = grupo => {
    if(!grupo.length) return;
    const acompanhado = grupo.length > 1;
    const abreNome = grupo[0] === "nome";
    /* o par Nome + Matrícula: a matrícula entra entre parênteses, em minúsculas */
    const parenteses = abreNome && grupo[1] === "matricula" ? "matricula" : null;

    /* Cada peça sabe se entra por vírgula. Um "trecho" é a sequência ligada por
       vírgulas: é a unidade da congruência da caixa alta. */
    const pecas = grupo.map((id, i) => {
      const d = porId[id] || {};
      const forma = formaTitulo(id, i === 0, acompanhado);
      /* `formaCorrida` é o título que entra na frase, com conectivo em vez de ":".
         Ele segue a congruência do trecho mesmo quando abre a linha — "atendimento de
         segunda a sexta" com o conteúdo em caixa comum não pede maiúscula no rótulo.
         `corrido` é o mesmo, mas só quando há vizinho antes: é o que traz a vírgula. */
      const formaCorrida = !!(d.corrido && forma && forma === d.abrev);
      return { id, d, forma, formaCorrida, corrido: i > 0 && formaCorrida };
    });
    let trecho = 0;
    pecas.forEach((p, i) => { if(i && !p.corrido) trecho++; p.trecho = trecho; });
    /* o trecho vai a maiúsculas quando todo campo dele que TEM caixa alta está com ela;
       quem não tem o botão — telefone, matrícula — não conta nem a favor nem contra */
    const caixaDoTrecho = {};
    pecas.forEach(p => {
      if(caixaDoTrecho[p.trecho] === false) return;
      const podeCaixa = !!marca("c", p.id);
      if(podeCaixa && !caixaAlta(p.id)) caixaDoTrecho[p.trecho] = false;
      else if(caixaDoTrecho[p.trecho] === undefined) caixaDoTrecho[p.trecho] = true;
    });

    /* pontuação de fecho: só Sala e Atendimento, e só na última posição preenchida.
       Quando o vizinho seguinte entra por vírgula, a pontuação do anterior cede lugar. */
    const ultima = pecas[pecas.length - 1];
    pecas.forEach((p, i) => {
      const seguinteCorrido = pecas[i+1] && pecas[i+1].corrido;
      if(seguinteCorrido) p.tirarPontuacao = true;
      else if(p === ultima && p.d.pontoFinal) p.pontoFinal = true;
    });

    let linha = "", primeiro = true;
    pecas.forEach(({ id, d, forma, corrido, formaCorrida, trecho, tirarPontuacao, pontoFinal }) => {
      /* "atendimento de" + "de segunda a sexta" viraria "de de": a repetição é engolida.
         Vale para o "n." de Sala do mesmo jeito; o ":' de rótulo não conta, por não ter letra. */
      const pos = partesTitulo(forma).pos.trim();
      const conectivo = /[a-zà-ú]/i.test(pos) ? pos : "";
      const escrito = conteudo(id, { tirarPontuacao, pontoFinal, semRepetir: conectivo });
      let corpo = escrito ? estilar(id, escrito, id === "nome") : "";
      /* a titulação entra colada ao Nome, com formatação só dela; sem nome ainda
         digitado, sai sozinha, e sem espaço sobrando atrás */
      if(id === "nome" && titulacaoAberta() && valor("titulacao")){
        /* peso declarado à força: o invólucro da linha do Nome carrega o negrito dele,
           e sem isto a titulação o herdaria, deixando o botão próprio sem efeito */
        let t = conteudo("titulacao");
        if(italico("titulacao")) t = ITAL(t);
        t = '<span style="font-weight:' + (negrito("titulacao") ? "900" : "400") + '">' + t + '</span>';
        corpo = corpo ? t + " " + corpo : t;
      }
      /* o Nome guarda o corpo maior; o resto da linha volta ao tamanho comum */
      const vestir = p => id === "nome" ? '<span style="' + EST_NOME() + '">' + p + '</span>' : p;

      if(id === parenteses){
        /* Dentro dos parênteses o rótulo não é título, é parte da frase.
           Negrito e itálico dos títulos só o alcançam se o próprio campo tiver o
           mesmo efeito, e aí valem do "(" ao ")". A caixa alta dos títulos só
           alcança aqui se for o Nome que estiver em caixa alta. */
        const rotulo = (d.podeAbreviar && abreviarTitulo(id)) ? d.abrevParenteses : d.tituloParenteses;
        const plenoN = el("titNegrito").checked && negrito(id);
        const plenoI = el("titItalico").checked && italico(id);
        const plenoC = el("titCaixa").checked && caixaAlta("nome");
        let dentro = conteudo(id);
        if(italico(id) && !plenoI) dentro = '<span style="font-style:italic">' + dentro + '</span>';
        if(negrito(id) && !plenoN) dentro = B(dentro);
        let tudo = "(" + (plenoC ? rotulo.toLocaleUpperCase("pt-BR") : rotulo) + dentro + ")";
        if(plenoI) tudo = '<span style="font-style:italic">' + tudo + '</span>';
        if(plenoN) tudo = B(tudo);
        linha += " " + tudo;
        return;
      }
      /* efeito pleno: o título e o conteúdo trazem o mesmo efeito, e aí a pontuação
         entre eles — o ":" — deixa de ser a única exceção e acompanha */
      const plenoN = el("titNegrito").checked && negrito(id);
      const plenoI = el("titItalico").checked && italico(id);
      const titulo = forma ? escreverTitulo(corrido ? ", " + forma : forma, {
        minusculo: corrido,                    /* no meio da frase, minúscula */
        /* rótulo obedece ao botão; título dentro da frase, à congruência do trecho */
        caixa: el("titCaixa").checked && (formaCorrida ? caixaDoTrecho[trecho] !== false : true),
        caixaConectivo: el("titCaixa").checked && caixaDoTrecho[trecho] !== false,
        negrito: el("titNegrito").checked, italico: el("titItalico").checked,
        negritoPos: plenoN, italicoPos: plenoI
      }) : "";
      const peca = vestir(titulo + corpo);
      linha += primeiro ? peca : (corrido ? peca : " | " + peca);
      primeiro = false;
    });
    saida.push('<span style="' + EST_LINHA + '">' + linha + '</span>');
  };

  disposicao().forEach(linha => {
    /* só linha sem nenhum campo é espaçador; linha com campos em branco simplesmente não sai */
    if(!linha.length){ saida.push(VAZIA); return; }
    const itens = linha.filter(entra);
    if(!itens.length) return;
    monta(itens);
  });

  /* cada linha vazia é um espaço; várias seguidas aumentam o espaço.
     Só as das pontas são descartadas. */
  const limpo = [...saida];
  while(limpo.length && limpo[limpo.length-1] === VAZIA) limpo.pop();
  while(limpo.length && limpo[0] === VAZIA) limpo.shift();

  return limpo.map(l => l === VAZIA ? ESPACO : l).join('<br />');
}

function gerar(){
  const logo = logoAtual();
  const semLogo = !logo;
  const esp = parseInt(espessuraBarra(), 10);
  const colunas = (esp > 0 ? 3 : 1) + (semLogo ? 0 : 1);
  const barra = esp > 0
    ? '<td width="20">&nbsp;</td><td width="' + esp + '" bgcolor="' + corBarra() + '" style="background-color:' + corBarra() + '; font-size:0; line-height:0;">&nbsp;</td>'
    : '';
  return [
'<!-- INICIO ASSINATURA | gerador Uerj ' + VERSAO + ' -->',
'<table role="presentation" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse; table-layout:auto;">',
'<tbody>',
'<tr>',
'<td colspan="' + colunas + '" valign="top" style="font-family:Trebuchet MS,Helvetica,sans-serif;">',
'<span style="font-size:' + TAM_CORPO + 'px; color:#000000; font-weight:400; line-height:1.4">Atenciosamente,</span>',
'</td>',
'</tr>',
'<tr>',
'<td colspan="' + colunas + '" height="12" style="line-height:12px; font-size:0;">&nbsp;</td>',
'</tr>',
'<tr>',
semLogo ? '' : '<td width="' + logo.w + '" valign="middle"><a href="https://www.uerj.br/"><img src="' + logo.src + '" alt="Uerj" width="' + logo.w + '" height="' + logo.h + '" border="0" style="display:block; border:0; outline:none; text-decoration:none;" /></a></td>',
barra,
'<td valign="middle" style="padding-left:12px; font-family:Trebuchet MS,Helvetica,sans-serif; color:#000000;">',
corpoHTML(),
'</td>',
'</tr>',
'</tbody>',
'</table>',
'<!-- FIM ASSINATURA -->'
  ].join("");
}

/* ---------- atualização ---------- */
function atualizar(){
  /* nunca reorganiza a matriz enquanto a pessoa digita: mover linhas tira o foco do campo */
  const editando = document.activeElement && matriz.contains(document.activeElement);
  if(!arrastado && !editando) realcar();
  exemplo = !algoDigitado();
  el("notaExemplo").style.display = exemplo ? "block" : "none";
  el("preview").innerHTML = gerar();
  /* o Nome não entra nesta lista: o bloco dele já se anuncia obrigatório.
     Aqui ficam só os erros passageiros, que aparecem e somem conforme se digita. */
  const faltam = [];
  const semNome = !digitado("nome");
  /* aberta, a titulação é obrigatória: ou se preenche, ou se fecha */
  if(titulacaoAberta() && !digitado("titulacao")) faltam.push("Titulação em branco: preencha ou remova");
  defs.filter(d => d.tel).forEach(d => {
    const bruto = digitado(d.id);
    if(!bruto) return;
    if(comWhats(d.id)){
      /* com WhatsApp o que vale é o número internacional, não o formato brasileiro */
      const w = paraWhats(bruto);
      if(!w.valido) faltam.push(d.rotulo + " para WhatsApp: " + w.motivo);
    } else if(comMascara(d.id) && !normalizarTelefone(bruto).completo){
      faltam.push(d.rotulo + " incompleto: faltam algarismos");
    }
  });
  const mat = digitado("matricula").replace(/\D/g,"");
  if(mat && mat.length < 6) faltam.push("Matrícula incompleta");
  const em = digitado("email");
  if(em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) faltam.push("E-mail inválido");
  /* a lixeirinha só aparece em campo com conteúdo */
  defs.forEach(d => {
    const t = tile(d.id); if(!t) return;
    const cheio = !!digitado(d.id) || !!(tituloEl(d.id) && tituloEl(d.id).value.trim());
    t.querySelector(".limpar").style.display = cheio ? "flex" : "none";
    t.classList.toggle("cheio", cheio);
  });
  /* a titulação mora dentro do bloco do Nome e tem o próprio estado de preenchida */
  const cxTitulacao = document.querySelector(".titulacao");
  if(cxTitulacao) cxTitulacao.classList.toggle("cheia", !!digitado("titulacao"));

  ajustarBotoesTitulo();
  sincronizarEscolhas();
  const p = podeRestaurar();
  el("btnPadrao").disabled = !(p.campos || p.barra || p.limpar);
  registrar();
  const pronto = faltam.length === 0 && !semNome;
  el("btnGerar").disabled = !pronto;
  /* o botão diz por que está apagado, mesmo quando a pendência é só o Nome em branco */
  el("btnGerar").title = pronto ? "Gerar o código HTML da assinatura"
                       : semNome ? "Preencha o Nome, que é obrigatório"
                       : faltam.join(" · ");
  el("pendencia").textContent = faltam.join(" · ");
  el("blocoCodigo").classList.add("hide");
}

/* ---------- saídas ---------- */
el("btnGerar").addEventListener("click", () => {
  el("saida").value = gerar();
  el("blocoCodigo").classList.remove("hide");
  el("btnCopiarLimpar").focus();   /* botão padrão depois de gerar */
});

async function copiarCodigo(){
  const ta = el("saida");
  let feito = false;
  try { await navigator.clipboard.writeText(ta.value); feito = true; }
  catch(e){
    ta.focus(); ta.select();
    try { feito = document.execCommand("copy"); } catch(e2){ feito = false; }
  }
  const av = el("aviso");
  av.classList.toggle("ok", feito);
  av.classList.toggle("aviso", !feito);
  av.textContent = feito
    ? "Código copiado!"
    : "Não foi possível copiar automaticamente. O código está selecionado: use Ctrl+C.";
  setTimeout(()=>{ av.textContent = ""; }, feito ? 2500 : 8000);
  return feito;
}

el("btnCopiarSeguir").addEventListener("click", copiarCodigo);

/* apaga só o conteúdo dos campos: títulos personalizados, marcações, disposição e barra ficam como estão */
function limparDados(){
  fecharTitulacao();     /* sem isso ela fica aberta e vazia, travando a geração seguinte */
  defs.forEach(d => { if(campo(d.id)) campo(d.id).value = ""; });
  atualizar();
}

el("btnCopiarLimpar").addEventListener("click", async () => {
  if(!await copiarCodigo()) return;          /* só apaga se a cópia foi confirmada */
  registrarAgora();
  limparDados();
  el("blocoCodigo").classList.add("hide");
});

el("btnRecomecar").addEventListener("click", () => {
  registrarAgora();
  limparDados();
  el("blocoCodigo").classList.add("hide");
});

/* ao sair do campo, a matriz se arruma */
matriz.addEventListener("focusout", () => setTimeout(() => {
  if(!(document.activeElement && matriz.contains(document.activeElement))) atualizar();
}, 0));

let dicasLigadas = false;
document.querySelectorAll(".lamp").forEach(b => b.addEventListener("click", () => {
  dicasLigadas = !dicasLigadas;
  document.querySelectorAll(".lamp").forEach(l => {
    l.classList.toggle("ativo", dicasLigadas);
    l.title = dicasLigadas ? "Ocultar dicas" : "Mostrar dicas";
    l.setAttribute("aria-expanded", dicasLigadas ? "true" : "false");
    l.setAttribute("aria-label", dicasLigadas ? "Ocultar dicas" : "Mostrar dicas");
  });
  document.querySelectorAll(".ajuda").forEach(a => a.classList.toggle("hide", !dicasLigadas));
}));

/* ---------- expurgo por inatividade ---------- */
/* dado pessoal não fica esquecido numa tela de balcão: sem uso e com campo preenchido,
   a página avisa, conta o tempo em voz alta e recomeça sozinha */
const OCIO = 10 * 60 * 1000;      /* silêncio até o aviso */
const CONTAGEM = 60;              /* segundos de resposta antes de apagar */
let relogioOcio = null, relogioContagem = null;

/* apaga primeiro, recarrega depois: se a recarga for bloqueada, nada pessoal fica na tela */
function apagarTudo(){
  pararContagem();
  clearTimeout(agendado); agendado = null;
  limparDados();
  defs.forEach(d => { if(tituloEl(d.id)) tituloEl(d.id).value = ""; });
  el("saida").value = "";
  el("blocoCodigo").classList.add("hide");
  atualizar();
  pilha = [estadoAtual()]; indice = 0; botoesHistorico();
  avisar("Os dados preenchidos foram apagados por inatividade.");
  try { location.reload(); } catch(e){}
}
function pararContagem(){
  clearInterval(relogioContagem); relogioContagem = null;
  el("modalTempo").classList.add("hide");
  trancarFundo(false);
}
function abrirContagem(){
  if(!algoDigitado() || !el("modalTempo").classList.contains("hide")) return;
  let resta = CONTAGEM;
  el("tContagem").textContent = resta;
  el("modalTempo").classList.remove("hide");
  trancarFundo(true);
  el("tContinuar").focus();
  relogioContagem = setInterval(() => {
    resta--;
    el("tContagem").textContent = resta;
    if(resta <= 0) apagarTudo();
  }, 1000);
}
function reiniciarOcio(){
  if(relogioContagem) return;             /* durante a contagem, só os botões do aviso respondem */
  clearTimeout(relogioOcio);
  relogioOcio = algoDigitado() ? setTimeout(abrirContagem, OCIO) : null;
}
["pointerdown","keydown","input","change","focusin"].forEach(ev =>
  document.addEventListener(ev, reiniciarOcio, true));
el("tContinuar").addEventListener("click", () => { pararContagem(); reiniciarOcio(); });
el("tApagar").addEventListener("click", apagarTudo);

/* o passo a passo do webmail fica recolhido: quem já sabe colar não precisa dele */
el("btnTour").addEventListener("click", () => {
  const aberto = el("passosTour").classList.toggle("hide") === false;
  el("btnTour").setAttribute("aria-expanded", aberto ? "true" : "false");
  el("btnTour").textContent = aberto ? "Ocultar o passo a passo" : "Ver o passo a passo";
});

montarLogos();
/* os outros selos são conferidos só depois que a página termina de carregar */
const conferirDepois = () => {
  if(window.requestIdleCallback) requestIdleCallback(verificarLogos, { timeout: 1500 });
  else setTimeout(verificarLogos, 300);
};
if(document.readyState === "complete") conferirDepois();
else window.addEventListener("load", conferirDepois, { once:true });
montarPaleta();
sincronizarPaleta();
el("cor").addEventListener("input", () => { sincronizarPaleta(); atualizar(); });
el("titAuto").addEventListener("change", atualizar);
el("titNegrito").addEventListener("change", atualizar);
el("titItalico").addEventListener("change", atualizar);
el("titCaixa").addEventListener("change", atualizar);
el("espessura").addEventListener("input", () => { el("espessuraVal").textContent = el("espessura").value + "px"; atualizar(); });

atualizar();
/* estado inicial no histórico, sem esperar o agrupamento da digitação */
pilha = [estadoAtual()]; indice = 0; botoesHistorico();
