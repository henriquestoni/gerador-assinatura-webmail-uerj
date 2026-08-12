/* Assinatura de e-mail Uerj | assinatura.js | versão beta 13 */
const LINHAS = 14, COLS = 3, VAZIAS_MIN = 0;   /* o rodapé já cria linhas quando preciso */

let defs = [
  {id:"nome",        rotulo:"Nome",          titulo:"",              dica:"Maria da Silva", fixo:true, negrito:true, caixa:true},
  {id:"cargo",       rotulo:"Cargo",         titulo:"Cargo: ",       dica:"Técnico Universitário"},
  {id:"funcao",      rotulo:"Função",        titulo:"Função: ",      dica:"Chefe de Serviço"},
  {id:"matricula",   rotulo:"Matrícula",     titulo:"Matrícula: ",   dica:"00.000-0", mascara:"mat", curto:"mat. "},
  {id:"lotacao",     rotulo:"Lotação",       titulo:"",              dica:"ECOMUSEU/PR-3", negrito:true, caixa:true, caixaPadrao:true},
  {id:"celular",     rotulo:"Celular",       titulo:"Celular: ",     dica:"(00)00000-0000", curto:"Cel: ", tel:true, modoCel:true},
  {id:"fixo",        rotulo:"Telefone",      titulo:"Telefone: ",    dica:"(21)2334-0000, ramais 210, 211", curto:"Tel: ", tel:true, modoCel:false},
  {id:"email",       rotulo:"E-mail",        titulo:"E-mail:&nbsp;", dica:"usuario@uerj.br", curto:""},
  {id:"sala",        rotulo:"Sala",          titulo:"Sala: ",        dica:"3.002, bloco F, 3º andar", curto:"sala "},
  {id:"atendimento", rotulo:"Atendimento",   titulo:"Atendimento: ", dica:"seg. a sex., 9h às 17h", curto:"Atendimento: "},
  {id:"livre",       rotulo:"Campo livre",   titulo:"",              dica:"Conteúdo", dicaTitulo:"Título (opcional)", livre:true}
];
const porId = Object.fromEntries(defs.map(d => [d.id, d]));
const DEFS_BASE = defs.map(d => Object.assign({}, d));   /* lista original, para recriar o que for apagado */
const PADRAO = [["nome"],["cargo","funcao","matricula"],["lotacao"],[],["celular","fixo"],["email","sala"],[],["atendimento"],["livre"]];

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

const el = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const B = t => '<span style="font-weight:900">' + t + '</span>';

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
const hoje = () => new Date().toISOString().slice(0, 10);
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
  /* o primeiro da lista fica sempre visível; os outros somem se não responderem */
  const primeiro = LOGOS[0].id === l.id;
  alvo.classList.toggle("hide", l.ok === false && !primeiro);
}

function montarLogos(){
  const box = el("logos");
  box.innerHTML = LOGOS.filter(l => l.ok !== false || LOGOS[0].id === l.id).map(l =>
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
/* celular: (00)00000-0000 — nove dígitos após o DDD */
function mascaraTelefone(v){
  const d = v.replace(/\D/g,"").slice(0,11);
  if(d.length <= 2) return d.length ? "(" + d : "";
  if(d.length <= 7) return "(" + d.slice(0,2) + ")" + d.slice(2);
  return "(" + d.slice(0,2) + ")" + d.slice(2,7) + "-" + d.slice(7);
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

/* botões de cada linha: subir, descer e remover (a linha removida vai para o fim) */
function controlesLinha(){
  const c = document.createElement("div");
  c.className = "ctrl";
  c.innerHTML =
    '<button type="button" class="mini" data-acao="subir"    title="Subir linha">▲</button>' +
    '<button type="button" class="mini soVazia" data-acao="duplicar" title="Criar outra linha vazia abaixo desta">⧉</button>' +
    '<button type="button" class="mini" data-acao="remover"  title="Remover esta linha">🗑</button>' +
    '<button type="button" class="mini soVazia" data-acao="novo" title="Novo campo livre nesta linha">✎</button>' +
    '<button type="button" class="mini" data-acao="descer"   title="Descer linha">▼</button>';
  c.addEventListener("click", ev => {
    const b = ev.target.closest("button"); if(!b) return;
    const linha = c.parentElement, ls = linhas(), i = ls.indexOf(linha);
    const antes = disposicao();
    if(b.dataset.acao === "subir" && i > 1) matriz.insertBefore(linha, ls[i-1]);
    else if(b.dataset.acao === "descer" && i > 0 && i < ls.length - 1) matriz.insertBefore(ls[i+1], linha);
    else if(b.dataset.acao === "remover" && i > 0 && removivel(linha)) removerLinha(linha);
    else if(b.dataset.acao === "novo"){ criarCampoLivre(linha); return; }
    else if(b.dataset.acao === "duplicar"){ novaLinha(linha.nextElementSibling, false); return; }
    else return;
    sincronizarSeparadores(); garantirNome(); realcar(); atualizar(); registrarAgora();
  });
  return c;
}
/* rodapé fixo: cria linhas acima dele */
const rodapeMatriz = document.createElement("div");
rodapeMatriz.className = "rodapeMatriz";
rodapeMatriz.innerHTML =
  '<div class="botoesRodape">' +
  '<button type="button" class="mini" data-nova="vazia" title="Criar uma linha vazia acima (vira espaço na assinatura)">＋ linha</button>' +
  '<button type="button" class="mini" data-nova="livre" title="Criar uma linha com um campo livre acima">✎ campo livre</button>' +
  '</div>';
/* a dica desta barra fica logo acima dos botões */
rodapeMatriz.insertBefore(el("ajudaRodape"), rodapeMatriz.firstChild);
rodapeMatriz.addEventListener("click", ev => {
  const b = ev.target.closest("button"); if(!b) return;
  novaLinha(rodapeMatriz, b.dataset.nova === "livre");
});
matriz.appendChild(rodapeMatriz);

defs.forEach(d => { document.body.appendChild(criarTile(d)); }); /* criados soltos e posicionados a seguir */
sincronizarSeparadores();
aplicar(PADRAO, false);

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

/* linhas vazias seguidas viram uma só; as sobrando vão para o fim */
function compactar(){
  /* linhas vazias no meio são espaços propositais e ficam onde estão;
     só o excesso depois do último campo é ajustado */
  const antes = linhas().length;
  ajustarVazias();
  if(linhas().length !== antes) sincronizarSeparadores();
}

/* garante ao menos uma linha livre no fim; as demais quem controla é a pessoa — nem sobra de linhas vazias, nem falta espaço */
function ajustarVazias(){
  const conta = () => {
    const ls = linhas(); let n = 0;
    for(let i = ls.length - 1; i >= 0 && blocos(ls[i]).length === 0; i--) n++;
    return n;
  };
  let n = conta();
  while(n < VAZIAS_MIN && linhas().length < LINHAS){
    const l = document.createElement("div");
    l.className = "linha";
    l.appendChild(controlesLinha());
    matriz.insertBefore(l, rodapeMatriz);
    n++;
  }
  realcar();                      /* a linha recém-criada precisa das classes na hora */
}

/* usa a última linha vazia para abrir espaço no ponto indicado */
function abrirLinhaEm(separador){
  const ls = linhas();
  let vazia = [...ls].reverse().find(l => blocos(l).length === 0);
  if(!vazia){                                   /* sem linha vazia sobrando: cria uma */
    if(ls.length >= LINHAS) return null;
    vazia = document.createElement("div");
    vazia.className = "linha";
    vazia.appendChild(controlesLinha());
  }
  matriz.insertBefore(vazia, separador);
  sincronizarSeparadores();
  return vazia;
}

function criarTile(d){
  const t = document.createElement("div");
  t.className = "tile" + (d.fixo ? " fixo" : "");
  t.dataset.id = d.id;
  t.innerHTML =
    '<div class="cab"><span>' + d.rotulo +
      (d.fixo ? "" : ' <span class="alca" tabindex="0" role="button" aria-label="Mover ' + d.rotulo + '">⠿</span>') + '</span>' +
    '<span class="opcs">' +
      (d.tel ? '<label class="marc" title="Tratar como celular"><input type="checkbox" autocomplete="off" id="m_' + d.id + '"' + (d.modoCel ? " checked" : "") + '><span class="longo">Celular</span><span class="curto">Cel</span></label>' +
               '<label class="marc" title="Gerar link do WhatsApp"><input type="checkbox" autocomplete="off" id="w_' + d.id + '"' + (d.zap ? " checked" : "") + '><span class="longo">WhatsApp</span><span class="curto">Zap</span></label>' : '') +
      (d.caixa ? '<label class="marc" title="Caixa alta"><input type="checkbox" autocomplete="off" id="c_' + d.id + '"' + (d.caixaPadrao ? " checked" : "") + '><span class="longo">Caixa alta</span><span class="curto">AA</span></label>' : '') +
      '<label class="marc" title="Negrito"><input type="checkbox" autocomplete="off" id="b_' + d.id + '"' + (d.negrito ? " checked" : "") + '><span class="longo">Negrito</span><span class="curto">N</span></label>' +
      '<button type="button" class="mini limpar" title="Apagar conteúdo deste campo">🗑</button>' +
    '</span></div>' +
    (d.livre ? '<input type="text" class="tituloLivre" id="t_' + d.id + '" name="t_' + d.id + '" autocomplete="off" aria-label="Título do campo livre" placeholder="' + d.dicaTitulo + '">' : '') +
    '<input type="text" id="' + d.id + '" name="' + d.id + '" autocomplete="' + autoDe(d.id) + '" aria-label="' + d.rotulo + '" placeholder="' + d.dica + '">';

  t.querySelector(".limpar").addEventListener("click", () => {
    el(d.id).value = "";
    if(el("t_" + d.id)) el("t_" + d.id).value = "";
    atualizar();
  });
  const livre = t.querySelector(".tituloLivre");
  if(livre) livre.addEventListener("input", atualizar);
  t.querySelector("input[type=text]:not(.tituloLivre)").addEventListener("input", e => {
    if(d.mascara === "mat") e.target.value = mascaraMatricula(e.target.value);
    if(d.tel && modoCelular(d.id)) e.target.value = mascaraTelefone(e.target.value);
    atualizar();
  });
  t.querySelectorAll(".marc input").forEach(c => c.addEventListener("change", () => {
    if(d.tel){
      const zap = t.querySelector('#w_' + d.id);
      const cel = modoCelular(d.id);
      zap.disabled = !cel;
      zap.parentElement.style.opacity = cel ? 1 : .4;
      if(!cel) zap.checked = false;
      const txt = t.querySelector("input[type=text]");
      if(cel) txt.value = mascaraTelefone(txt.value);
    }
    atualizar();
  }));
  if(d.tel){
    const zap = t.querySelector('#w_' + d.id);
    zap.disabled = !d.modoCel;
    zap.parentElement.style.opacity = d.modoCel ? 1 : .4;
  }

  const alca = t.querySelector(".alca");
  if(alca){
    alca.addEventListener("pointerdown", ev => iniciarArrasto(ev, t));
    alca.addEventListener("keydown", ev => teclado(ev, t));
  }
  return t;
}

/* devolve os campos que a disposição pede e que foram apagados */
function garantirCampos(disp){
  disp.flat().forEach(id => {
    if(tile(id)) return;
    let base = DEFS_BASE.find(d => d.id === id);
    if(!base && /^livre\d+$/.test(id)){
      base = { id, rotulo:"Campo livre", titulo:"", dica:"Conteúdo", dicaTitulo:"Título (opcional)", livre:true };
    }
    if(!base) return;
    if(!porId[id]){ defs.push(base); porId[id] = base; }
    document.body.appendChild(criarTile(base));
  });
}

/* volta ao conjunto original de campos: os livres criados depois somem */
function descartarExtras(disp){
  const previstos = new Set(disp.flat());
  defs.filter(d => d.livre && !previstos.has(d.id)).forEach(d => {
    const t = tile(d.id);
    if(t) t.remove();
    defs = defs.filter(x => x.id !== d.id);
    delete porId[d.id];
  });
  contadorLivre = 1;
  linhas().slice(PADRAO.length).forEach(l => { if(blocos(l).length === 0) l.remove(); });
}

/* uma linha some de vez quando está vazia ou só tem campos livres criados aqui */
function removivel(linha){
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
  sincronizarSeparadores(); garantirNome(); realcar(); atualizar(); registrarAgora();
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
  if(blocos(linha).length >= COLS) return;
  contadorLivre++;
  const d = {
    id: "livre" + contadorLivre, rotulo: "Campo livre", titulo: "",
    dica: "Conteúdo", dicaTitulo: "Título (opcional)", livre: true
  };
  defs.push(d);
  porId[d.id] = d;
  linha.appendChild(criarTile(d));
  garantirNome(); sincronizarSeparadores(); realcar(); atualizar(); registrarAgora();
  const campo = el("t_" + d.id);
  if(campo) campo.focus();
}

/* ---------- disposição ---------- */
function disposicao(){
  return linhas().map(l => blocos(l).map(t => t.dataset.id));
}
function tile(id){ return document.querySelector('.tile[data-id="' + id + '"]'); }

function aplicar(disp, registrar = true, limparExtras = false){
  if(registrar) registrarHistorico();
  if(limparExtras) descartarExtras(disp);
  garantirCampos(disp);
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
    /* campos livres criados depois vão para linhas próprias no fim, nunca para a linha do Nome */
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
  garantirNome();
  realcar();
  atualizar();
}

/* ---------- histórico geral (texto, marcações, barra e disposição) ---------- */

function estadoAtual(){
  const campos = {};
  defs.forEach(d => {
    campos[d.id] = {
      v: el(d.id) ? el(d.id).value : "",
      t: el("t_" + d.id) ? el("t_" + d.id).value : "",
      b: !!(el("b_" + d.id) && el("b_" + d.id).checked),
      c: !!(el("c_" + d.id) && el("c_" + d.id).checked),
      m: !!(el("m_" + d.id) && el("m_" + d.id).checked),
      w: !!(el("w_" + d.id) && el("w_" + d.id).checked)
    };
  });
  return JSON.stringify({
    campos, layout: disposicao(),
    logo: logoEscolhido,
    cor: el("cor").value, esp: el("espessura").value,
    tm: el("titMostrar").checked, tn: el("titNegrito").checked
  });
}

function aplicarEstado(txt){
  const e = JSON.parse(txt);
  restaurando = true;
  /* recria campos livres que existiam no estado guardado */
  e.layout.flat().forEach(id => {
    if(porId[id] || !/^livre\d+$/.test(id)) return;
    const d = { id, rotulo:"Campo livre", titulo:"", dica:"Conteúdo", dicaTitulo:"Título (opcional)", livre:true };
    defs.push(d); porId[id] = d;
    document.body.appendChild(criarTile(d));
    const n = parseInt(id.replace("livre",""), 10);
    if(n > contadorLivre) contadorLivre = n;
  });
  Object.keys(e.campos).forEach(id => {          /* usa o que o estado guardou, não a lista atual */
    const d = porId[id]; if(!d) return;
    const s = e.campos[id];
    if(el(d.id)) el(d.id).value = s.v;
    if(el("t_" + d.id)) el("t_" + d.id).value = s.t || "";
    ["b","c","m","w"].forEach(k => { const c = el(k + "_" + d.id); if(c) c.checked = s[k]; });
    const w = el("w_" + d.id);
    if(w){ w.disabled = !s.m; w.parentElement.style.opacity = s.m ? 1 : .4; }
  });
  if(e.logo && e.logo !== logoEscolhido){ logoEscolhido = e.logo; montarLogos(); }
  el("cor").value = e.cor;
  el("espessura").value = e.esp;
  el("espessuraVal").textContent = e.esp + "px";
  el("titMostrar").checked = e.tm;
  el("titNegrito").checked = e.tn;
  sincronizarPaleta();
  /* tira o que não existia naquele momento: sem isso o desfazer deixa campos órfãos */
  const previstos = new Set(e.layout.flat());
  [...document.querySelectorAll(".tile")].forEach(t => {
    const id = t.dataset.id;
    if(previstos.has(id)) return;
    t.remove();
    if(/^livre\d+$/.test(id)){ defs = defs.filter(x => x.id !== id); delete porId[id]; }
  });
  aplicar(e.layout, false);
  restaurando = false;
  atualizar();
}

function registrar(){                     /* guarda o estado atual, agrupando digitação */
  if(restaurando) return;
  clearTimeout(agendado);
  agendado = setTimeout(() => {
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
function desfazer(){ if(indice > 0){ indice--; aplicarEstado(pilha[indice]); botoesHistorico(); } }
function refazer(){ if(indice < pilha.length - 1){ indice++; aplicarEstado(pilha[indice]); botoesHistorico(); } }

/* ações indivisíveis (arrastar, mover, restaurar, marcar) entram no histórico na hora */
function registrarAgora(){
  if(restaurando) return;
  clearTimeout(agendado);
  const e = estadoAtual();
  if(pilha[indice] === e) return;
  pilha = pilha.slice(0, indice + 1);
  pilha.push(e);
  if(pilha.length > 100) pilha.shift(); else indice++;
  botoesHistorico();
}
const registrarHistorico = registrarAgora;
function garantirNome(){
  const n = tile("nome"), primeira = linhas()[0];
  if(!n || !primeira) return;
  if(n.parentElement !== primeira || blocos(primeira)[0] !== n) primeira.insertBefore(n, blocos(primeira)[0] || null);
}
function realcar(){
  linhas().forEach(l => {
    l.classList.toggle("cheia", blocos(l).length >= COLS);
    l.classList.toggle("semnada", blocos(l).length === 0);
    l.classList.toggle("removivel", removivel(l));
  });
}

/* ---------- arrasto (mouse, caneta e toque) ---------- */
function iniciarArrasto(ev, t){
  if(ev.button !== undefined && ev.button !== 0) return;
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
        garantirNome(); realcar();
      }
      return;
    }
    matriz.querySelectorAll(".entre").forEach(s => s.classList.remove("alvo"));

    const linha = alvo.closest(".linha");
    linhas().forEach(l => l.classList.toggle("alvo", l === linha));
    if(!linha) return;
    if(linha !== t.parentElement && blocos(linha).length >= COLS) return;
    const ref = posicao(linha, e.clientX);
    const anterior = linhaAberta;
    if(ref === null){ if(t.parentElement !== linha || blocos(linha)[blocos(linha).length-1] !== t) linha.appendChild(t); }
    else if(ref !== t.nextSibling) linha.insertBefore(t, ref);
    if(linha !== linhaAberta){ linhaAberta = null; devolverLinhaAberta(anterior); }
    garantirNome();
    realcar();
  };
  const soltar = () => {
    document.removeEventListener("pointermove", mover);
    document.removeEventListener("pointerup", soltar);
    document.removeEventListener("pointercancel", soltar);
    t.classList.remove("arrastando");
    document.body.classList.remove("arrastando");
    matriz.querySelectorAll(".alvo").forEach(l => l.classList.remove("alvo"));
    /* a linha de onde o bloco saiu, se esvaziou, some: não vira espaço nem sobra no fim */
    if(linhaOrigem && linhaOrigem !== t.parentElement && linhaOrigem.isConnected && blocos(linhaOrigem).length === 0){
      linhaOrigem.remove();
      sincronizarSeparadores();
    }
    compactar();
    garantirNome();
    realcar();
    if(JSON.stringify(antes) !== JSON.stringify(disposicao())) registrarAgora();
    arrastado = null;
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

/* ---------- teclado: Alt + setas ---------- */
function teclado(ev, t){
  if(!ev.key.startsWith("Arrow")) return;   /* com a alça em foco, as setas já movem */
  const ls = linhas();
  const linha = t.parentElement, i = ls.indexOf(linha);
  const irmaos = blocos(linha), j = irmaos.indexOf(t);
  let agiu = true;
  if(ev.key === "ArrowLeft" && j > 0 && !(i === 0 && j === 1)) linha.insertBefore(t, irmaos[j-1]);
  else if(ev.key === "ArrowRight" && j < irmaos.length - 1) linha.insertBefore(irmaos[j+1], t);
  else if(ev.key === "ArrowUp" && i > 0 && blocos(ls[i-1]).length < COLS) ls[i-1].appendChild(t);
  else if(ev.key === "ArrowDown" && i < ls.length - 1 && blocos(ls[i+1]).length < COLS) ls[i+1].appendChild(t);
  else agiu = false;
  ev.preventDefault();   /* evita rolar a página com as setas */
  if(!agiu) return;
  registrarHistorico();
  garantirNome(); realcar(); atualizar(); registrarAgora();
  t.querySelector(".alca").focus();
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
  defs.forEach(d => {
    if(el("t_" + d.id)) el("t_" + d.id).value = "";
    el(d.id).value = "";
    const b = el("b_" + d.id); if(b) b.checked = !!d.negrito;
    const c = el("c_" + d.id); if(c) c.checked = !!d.caixaPadrao;
    const m = el("m_" + d.id); if(m) m.checked = !!d.modoCel;
    const w = el("w_" + d.id); if(w){ w.checked = !!d.zap; w.disabled = !d.modoCel; w.parentElement.style.opacity = d.modoCel ? 1 : .4; }
  });
  atualizar();
}
function restaurarBarra(){
  logoEscolhido = "selo";
  montarLogos();
  el("cor").value = "#AD841F";
  el("espessura").value = 3;
  el("espessuraVal").textContent = "3px";
  el("titMostrar").checked = true;
  el("titNegrito").checked = true;
  sincronizarPaleta();
}
/* o que fugiu do padrão */
function camposMudaram(){
  if(defs.some(d => d.livre && !PADRAO.flat().includes(d.id))) return true;
  if(DEFS_BASE.some(d => !tile(d.id))) return true;          /* algum campo do padrão foi apagado */
  const atual = disposicao().filter(l => l.length).map(l => l.join(","));
  const padrao = PADRAO.filter(l => l.length).map(l => l.join(","));
  if(atual.length !== padrao.length) return true;
  /* também considera a linha vazia intencional entre lotação e telefones */
  const vaziasAtuais = disposicao().slice(0, disposicao().findLastIndex(l => l.length)).filter(l => !l.length).length;
  const vaziasPadrao = PADRAO.slice(0, PADRAO.length).filter(l => !l.length).length;
  return atual.some((l, i) => l !== padrao[i]) || vaziasAtuais !== vaziasPadrao;
}
function barraMudou(){
  return logoMudou() || el("cor").value.toUpperCase() !== "#AD841F" || el("espessura").value !== "3"
      || !el("titMostrar").checked || !el("titNegrito").checked;
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
function fecharModal(){
  el("modal").classList.add("hide");
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
  focoAnterior = document.activeElement;
  el("modal").classList.remove("hide");
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
  if(!itens.length){ aplicar(PADRAO, true, true); return; }
  abrirModal(itens);
});

el("mRestaurar").addEventListener("click", () => {
  const marcado = k => !!el("mOpcoes").querySelector('input[data-k="' + k + '"]:checked');
  registrarHistorico();
  if(marcado("limpar")) apagarConteudos();
  if(marcado("barra")) restaurarBarra();
  if(marcado("campos")) aplicar(PADRAO, false, true);
  atualizar();
  fecharModal();
});
el("mCancelar").addEventListener("click", fecharModal);
el("modal").addEventListener("click", ev => { if(ev.target === el("modal")) fecharModal(); });
document.addEventListener("keydown", ev => { if(ev.key === "Escape") fecharModal(); });

/* ---------- conteúdo ---------- */
function digitado(id){ const i = el(id); return i ? i.value.trim() : ""; }
function algoDigitado(){
  return defs.some(d => digitado(d.id) || (el("t_" + d.id) && el("t_" + d.id).value.trim()));
}
/* o campo livre entra pelo título; conteúdo sozinho não aparece */
function entra(id){ return porId[id].livre ? !!tituloLivre(id) : !!valor(id); }
function valor(id){ return exemplo ? (EXEMPLO[id] || "") : digitado(id); }
function negrito(id){ const c = el("b_" + id); return !!(c && c.checked); }
function caixaAlta(id){ const c = el("c_" + id); return !!(c && c.checked); }

/* normalização única de telefone brasileiro */
function normalizarTelefone(v){
  let d = String(v || "").replace(/\D/g, "");
  if(d.startsWith("55") && d.length > 11) d = d.slice(2);      /* aceita +55 digitado */
  const ddd = d.slice(0, 2);
  return {
    digitos: d,
    ddd,
    fixoValido: d.length === 10,
    celularValido: d.length === 11 && d[2] === "9",
    internacional: "55" + d
  };
}

function modoCelular(id){
  const c = el("m_" + id);
  return !!(c && c.checked);
}
function comWhats(id){
  const c = el("w_" + id);
  return modoCelular(id) && !!(c && c.checked);
}
/* nada ocupa linha exclusiva: quem manda é a disposição montada na matriz */
function exclusivo(){ return false; }

function tituloLivre(id){
  if(exemplo) return EXEMPLO["t_" + id] || "";
  const i = el("t_" + id);
  return i ? i.value.trim() : "";
}

function tituloDe(id, sozinho){
  const d = porId[id];
  if(d.livre){ const t = tituloLivre(id); return t ? esc(t) + " " : ""; }
  if(!d.tel) return sozinho ? d.titulo : (d.curto || "");
  if(comWhats(id)) return sozinho ? "Celular/WhatsApp: " : "";
  if(modoCelular(id)) return sozinho ? "Celular: " : "Cel: ";
  return sozinho ? "Telefone: " : "Tel: ";
}

function conteudo(id){
  let v = valor(id);
  if(!v) return "";
  if(caixaAlta(id)) v = v.toLocaleUpperCase("pt-BR");
  if(porId[id].tel){
    if(!comWhats(id)) return esc(v);                       /* sem WhatsApp: texto puro, sem link */
    const t = normalizarTelefone(v);
    if(!t.celularValido) return esc(v);                        /* só vira link se o número for válido */
    return '<a target="_blank" style="color:#0072CE; text-decoration:none;" href="https://wa.me/' + esc(t.internacional) + '">' + esc(v) + '</a>';
  }
  if(id === "email") return '<a style="color:#0072CE; text-decoration:none;" href="mailto:' + esc(v) + '">' + esc(v) + '</a>';
  return esc(v);
}

function corpoHTML(){
  const EST_LINHA = 'font-size:14px; color:#000000; font-weight:400; line-height:1.4';
  const VAZIA = "";
  const ESPACO = '<span style="font-size:8px; line-height:8px;">&nbsp;</span>';

  const saida = [];
  const mostrarTitulo = el("titMostrar").checked;
  const tituloNegrito = el("titNegrito").checked;

  const monta = grupo => {
    if(!grupo.length) return;
    const sozinho = grupo.length === 1;
    const ehNome = sozinho && grupo[0] === "nome";
    const texto = grupo.map(id => {
      const c = (negrito(id) && !ehNome) ? B(conteudo(id)) : conteudo(id);
      const tit = mostrarTitulo ? tituloDe(id, sozinho) : "";
      if(!tit) return c;
      return (tituloNegrito ? B(tit) : tit) + c;
    }).join(" | ");
    const estilo = ehNome
      ? 'font-size:16px; color:#000000; font-weight:' + (negrito("nome") ? "700" : "300") + '; line-height:1.4'
      : EST_LINHA;
    saida.push('<span style="' + estilo + '">' + texto + '</span>');
  };

  disposicao().forEach(linha => {
    /* só linha sem nenhum campo é espaçador; linha com campos em branco simplesmente não sai */
    if(!linha.length){ saida.push(VAZIA); return; }
    const itens = linha.filter(entra);
    if(!itens.length) return;
    let grupo = [];
    itens.forEach(id => {
      if(exclusivo(id)){ monta(grupo); grupo = []; monta([id]); }
      else grupo.push(id);
    });
    monta(grupo);
  });
  const linhas = saida;

  /* cada linha vazia é um espaço; várias seguidas aumentam o espaço.
     Só as das pontas são descartadas. */
  const limpo = [...linhas];
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
'<!-- INICIO ASSINATURA -->',
'<table role="presentation" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse; table-layout:auto;">',
'<tbody>',
'<tr>',
'<td colspan="' + colunas + '" valign="top" style="font-family:Trebuchet MS,Helvetica,sans-serif;">',
'<span style="font-size:12px; color:#000000; font-weight:400; line-height:1">Atenciosamente,</span>',
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
  if(!arrastado && !editando) compactar();
  exemplo = !algoDigitado();
  el("notaExemplo").style.display = exemplo ? "block" : "none";
  el("preview").innerHTML = gerar();
  const faltam = [];
  if(!digitado("nome")) faltam.push("Nome é obrigatório");
  defs.filter(d => d.tel).forEach(d => {
    const bruto = digitado(d.id);
    if(!bruto) return;
    const t = normalizarTelefone(bruto);
    if(modoCelular(d.id) && !t.celularValido) faltam.push(d.rotulo + ": celular incompleto");
  });
  const mat = digitado("matricula").replace(/\D/g,"");
  if(mat && mat.length < 6) faltam.push("Matrícula incompleta");
  const em = digitado("email");
  if(em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) faltam.push("E-mail inválido");
  /* a lixeirinha só aparece em campo com conteúdo */
  defs.forEach(d => {
    const t = tile(d.id); if(!t) return;
    const cheio = !!digitado(d.id) || !!(el("t_" + d.id) && el("t_" + d.id).value.trim());
    t.querySelector(".limpar").style.display = cheio ? "flex" : "none";
    t.classList.toggle("cheio", cheio);
  });

  const p = podeRestaurar();
  el("btnPadrao").disabled = !(p.campos || p.barra || p.limpar);
  registrar();
  const pronto = faltam.length === 0;
  el("btnGerar").disabled = !pronto;
  el("pendencia").textContent = pronto ? "" : faltam.join(" · ");
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
  defs.forEach(d => { if(el(d.id)) el(d.id).value = ""; });
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
  });
  document.querySelectorAll(".ajuda").forEach(a => a.classList.toggle("hide", !dicasLigadas));
}));

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
el("titMostrar").addEventListener("change", atualizar);
el("titNegrito").addEventListener("change", atualizar);
el("espessura").addEventListener("input", () => { el("espessuraVal").textContent = el("espessura").value + "px"; atualizar(); });

atualizar();
/* estado inicial no histórico, sem esperar o agrupamento da digitação */
pilha = [estadoAtual()]; indice = 0; botoesHistorico();
