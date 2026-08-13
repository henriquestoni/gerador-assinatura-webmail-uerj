/* Assinatura de e-mail Uerj | testes/comum.js | versão 1 */
/* Carrega a página em jsdom e devolve um contexto de teste isolado.
   Cada chamada de `abrir()` monta uma página nova, sem estado da anterior. */

const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const RAIZ = path.join(__dirname, "..");

/* Ponte para o miolo do arquivo: o assinatura.js não exporta nada,
   então o teste anexa um objeto com o que precisa inspecionar. */
const PONTE = `
;window.__api = {
  get defs(){return defs}, porId, PADRAO, DEFS_BASE,
  gerar, corpoHTML, aplicar, disposicao, atualizar, tile,
  campo, tituloEl, marca,
  el: id => document.getElementById(id) || document.getElementById(PRE + id),
  desfazer, refazer, firmar, estadoAtual, aplicarEstado, registrarAgora,
  criarCampoLivre, removerLinha, novaLinha, removivel, linhas, blocos,
  camposMudaram, podeRestaurar, normalizarTelefone, mascaraTelefone, mascaraMatricula,
  realcar, esc, conteudo, formaTitulo, escreverTitulo, automatizarTitulos,
  travada, travar, travas, alvoSubir, alvoDescer, moverLinha, pontoDeInsercao, TRAVAS_PADRAO,
  abrirContagem, apagarTudo, pararContagem, reiniciarOcio, OCIO, CONTAGEM,
  get pilha(){return pilha}, get indice(){return indice}, get exemplo(){return exemplo}
};
`;

function abrir(opcoes = {}){
  const html = fs.readFileSync(path.join(RAIZ, "index.html"), "utf8");
  /* o jsdom não navega: o location.reload() do expurgo vira um erro esperado, que não é falha */
  const console2 = new VirtualConsole();
  console2.sendTo(console, { omitJSDOMErrors:true });
  console2.on("jsdomError", e => {
    if(!/Not implemented: navigation/.test(e.message)) console.error(e.message);
  });
  const dom = new JSDOM(html, {
    runScripts:"outside-only", pretendToBeVisual:true,
    url:"https://inot.com.br/", virtualConsole:console2
  });
  const w = dom.window;
  w.requestIdleCallback = undefined;
  w.Image = class { set src(v){} };            /* nenhum teste vai à rede */
  if(opcoes.semLocalStorage){
    Object.defineProperty(w, "localStorage", { get(){ throw new Error("armazenamento bloqueado"); } });
  }
  const js = fs.readFileSync(path.join(RAIZ, "assinatura.js"), "utf8");
  let erro = null;
  try { w.eval(js + PONTE); } catch(e){ erro = e; }
  const api = w.__api;
  const c = {
    dom, w, api, erro,
    el: id => api && api.el(id),
    /* digita num campo, disparando o mesmo evento que o navegador dispara */
    digitar(id, valor){
      const i = api.el(id);
      i.value = valor;
      i.dispatchEvent(new w.Event("input", { bubbles:true }));
      return i;
    },
    marcar(id, ligado){
      const i = api.el(id);
      i.checked = ligado;
      i.dispatchEvent(new w.Event("change", { bubbles:true }));
      return i;
    },
    clicar(alvo){ (typeof alvo === "string" ? api.el(alvo) : alvo)
      .dispatchEvent(new w.MouseEvent("click", { bubbles:true })); },
    tecla(alvo, key, extra = {}){ (typeof alvo === "string" ? api.el(alvo) : alvo)
      .dispatchEvent(new w.KeyboardEvent("keydown", Object.assign({ key, bubbles:true }, extra))); },
    alca(id){ return api.tile(id).querySelector(".alca"); },
    /* arrasta o bloco `id` para dentro de `alvo` (uma .linha ou uma faixa .entre) */
    arrastar(id, alvo){
      const t = api.tile(id);
      w.document.elementFromPoint = () => alvo;
      t.querySelector(".alca").dispatchEvent(new w.MouseEvent("pointerdown", { bubbles:true, button:0 }));
      w.document.dispatchEvent(new w.MouseEvent("pointermove", { bubbles:true, clientX:10, clientY:10 }));
      w.document.dispatchEvent(new w.MouseEvent("pointerup", { bubbles:true }));
    },
    /* encerra relógios pendentes: sem isso o processo do teste não termina */
    fechar(){ try { api.pararContagem(); } catch(e){} dom.window.close(); }
  };
  return c;
}

const esperar = ms => new Promise(r => setTimeout(r, ms));
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

module.exports = { abrir, esperar, igual, RAIZ };
