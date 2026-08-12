/* Assinatura de e-mail Uerj | testes/casos.js | versão beta 14 */
/* Cada seção corresponde a um bloco de "Verificações sugeridas" da AUDITORIA.md.
   Um caso é uma função assíncrona que recebe `ok` e verifica uma coisa só. */

const { abrir, esperar, igual } = require("./comum");

const casos = [];
const caso = (secao, nome, corpo) => casos.push({ secao, nome, corpo });

/* ---------------------------------------------------------------- carga */

caso("Carga", "a página carrega sem exceção", ok => {
  const c = abrir();
  ok(!c.erro, c.erro && c.erro.message);
  c.fechar();
});

caso("Carga", "a matriz começa exatamente no padrão", ok => {
  const c = abrir();
  ok(igual(c.api.disposicao(), c.api.PADRAO), c.api.disposicao());
  c.fechar();
});

caso("Carga", "Gerar e Restaurar começam desabilitados", ok => {
  const c = abrir();
  ok(c.el("btnGerar").disabled && c.el("btnPadrao").disabled);
  c.fechar();
});

caso("Carga", "carrega mesmo com o armazenamento local bloqueado", ok => {
  const c = abrir({ semLocalStorage:true });
  ok(!c.erro, c.erro && c.erro.message);
  c.fechar();
});

caso("Carga", "há uma faixa de soltura por linha, menos acima do Nome", ok => {
  const c = abrir();
  const faixas = c.w.document.querySelectorAll(".matriz > .entre").length;
  ok(faixas === c.api.linhas().length - 1, { faixas, linhas:c.api.linhas().length });
  c.fechar();
});

/* ------------------------------------------------------- geração do HTML */

caso("Geração", "o código sai em linha única, sem quebras", ok => {
  const c = abrir();
  c.digitar("nome", "Maria da Silva");
  ok(!c.api.gerar().includes("\n"));
  c.fechar();
});

caso("Geração", "conteúdo com <, > e & sai escapado", ok => {
  const c = abrir();
  c.digitar("nome", '<b>x</b> & "y"');
  const corpo = c.api.corpoHTML();
  ok(!corpo.includes("<b>x</b>") && corpo.includes("&amp;") && corpo.includes("&quot;"), corpo);
  c.fechar();
});

caso("Geração", "título de campo livre não injeta HTML", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.digitar("t_livre", '"><img src=x onerror=alert(1)>');
  c.digitar("livre", "210");
  const corpo = c.api.corpoHTML();
  ok(corpo.includes("210") && !/<img/i.test(corpo), corpo);
  c.fechar();
});

caso("Geração", "colspan bate com o número de células, com barra", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  const s = c.api.gerar();
  const celulas = (s.split("<tr>").pop().match(/<td/g) || []).length;
  const cols = [...s.matchAll(/colspan="(\d+)"/g)].map(m => +m[1]);
  ok(cols.every(v => v === celulas), { cols, celulas });
  c.fechar();
});

caso("Geração", "colspan bate com o número de células, sem barra", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.el("espessura").value = "0";
  c.el("espessura").dispatchEvent(new c.w.Event("input", { bubbles:true }));
  const s = c.api.gerar();
  const celulas = (s.split("<tr>").pop().match(/<td/g) || []).length;
  const cols = [...s.matchAll(/colspan="(\d+)"/g)].map(m => +m[1]);
  ok(cols.every(v => v === celulas), { cols, celulas });
  c.fechar();
});

caso("Geração", "celular com WhatsApp vira link wa.me", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.digitar("celular", "(21)99999-9999");
  c.marcar("w_celular", true);
  ok(c.api.gerar().includes("https://wa.me/5521999999999"));
  c.fechar();
});

caso("Geração", "o link de WhatsApp leva rel=noopener", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.digitar("celular", "(21)99999-9999");
  c.marcar("w_celular", true);
  ok(c.api.gerar().includes('rel="noopener noreferrer"'), c.api.corpoHTML());
  c.fechar();
});

caso("Geração", "número incompleto não vira link", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.digitar("celular", "(21)9999");
  c.marcar("w_celular", true);
  ok(!c.api.gerar().includes("wa.me"), c.api.corpoHTML());
  c.fechar();
});

caso("Geração", "sem a marcação de WhatsApp, telefone algum vira link", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.digitar("celular", "(21)91234-5678");
  c.marcar("k_fixo", false);
  c.digitar("fixo", "(21)2334-0000, ramal 210");
  ok(!c.api.gerar().includes("wa.me"), c.api.corpoHTML());
  c.fechar();
});

caso("Geração", "o campo Telefone com WhatsApp aceita número internacional", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.marcar("w_fixo", true);
  c.digitar("fixo", "+5521912345678");
  ok(c.api.gerar().includes("https://wa.me/5521912345678"), c.api.corpoHTML());
  c.fechar();
});

caso("Geração", "itálico sai como estilo embutido", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.digitar("cargo", "Analista");
  c.marcar("i_cargo", true);
  ok(c.api.corpoHTML().includes("font-style:italic"), c.api.corpoHTML());
  c.fechar();
});

caso("Geração", "caixa alta não estraga o endereço do mailto", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.digitar("email", "Usuario@uerj.br");
  c.marcar("c_email", true);
  const corpo = c.api.corpoHTML();
  ok(corpo.includes('href="mailto:Usuario@uerj.br"') && corpo.includes(">USUARIO@UERJ.BR<"), corpo);
  c.fechar();
});

caso("Geração", "e-mail vira mailto", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.digitar("email", "usuario@uerj.br");
  ok(c.api.gerar().includes('href="mailto:usuario@uerj.br"'));
  c.fechar();
});

caso("Geração", "caixa alta muda a saída, não o que foi digitado", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.digitar("lotacao", "Ecomuseu/PR-3");
  ok(c.api.gerar().includes("ECOMUSEU/PR-3") && c.el("lotacao").value === "Ecomuseu/PR-3");
  c.fechar();
});

caso("Geração", "campo livre só entra pelo título", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.digitar("livre", "conteudo solto");
  const semTitulo = c.api.corpoHTML().includes("conteudo solto");
  c.digitar("t_livre", "Sítio");
  ok(!semTitulo && c.api.corpoHTML().includes("conteudo solto"));
  c.fechar();
});

caso("Geração", "título longo sozinho, curto acompanhado", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.digitar("fixo", "(21)2334-0000");
  const sozinho = c.api.corpoHTML().includes("Telefone: ");
  c.digitar("celular", "(21)99999-9999");
  const juntos = c.api.corpoHTML();
  ok(sozinho && juntos.includes("Tel: ") && juntos.includes("Cel: "), juntos);
  c.fechar();
});

caso("Geração", "sem 'Mostrar títulos' nenhum título aparece", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.digitar("cargo", "Analista");
  c.marcar("titMostrar", false);
  ok(!c.api.corpoHTML().includes("Cargo"), c.api.corpoHTML());
  c.fechar();
});

caso("Geração", "linha vazia entre campos vira espaço; as das pontas somem", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.digitar("atendimento", "9h às 17h");
  const corpo = c.api.corpoHTML();
  ok(corpo.includes("font-size:8px")
     && !corpo.startsWith('<span style="font-size:8px')
     && !corpo.endsWith("&nbsp;</span>"), corpo);
  c.fechar();
});

caso("Geração", "o exemplo dá lugar aos dados na primeira digitação", ok => {
  const c = abrir();
  const antes = c.api.gerar().includes("Fulano de Tal");
  c.digitar("nome", "Ana");
  ok(antes && !c.api.gerar().includes("Fulano de Tal") && c.api.gerar().includes("Ana"));
  c.fechar();
});

/* ------------------------------------------------------------ validação */

caso("Validação", "Nome vazio bloqueia a geração", ok => {
  const c = abrir();
  ok(c.el("btnGerar").disabled && c.el("pendencia").textContent.includes("Nome"));
  c.fechar();
});

caso("Validação", "celular incompleto é acusado", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.digitar("celular", "(21)9999");
  ok(c.el("btnGerar").disabled && /Celular incompleto/i.test(c.el("pendencia").textContent),
     c.el("pendencia").textContent);
  c.fechar();
});

caso("Validação", "dez algarismos bastam: o celular não precisa começar por 9", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.digitar("celular", "(11)2222-2222");
  c.marcar("w_celular", true);
  ok(!c.el("btnGerar").disabled && c.api.gerar().includes("https://wa.me/551122222222"),
     { pendencia: c.el("pendencia").textContent, corpo: c.api.corpoHTML() });
  c.fechar();
});

caso("Validação", "sem máscara, o Telefone aceita texto livre", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.marcar("k_fixo", false);
  c.digitar("fixo", "(21)2334-0000, ramais 210, 211");
  ok(!c.el("btnGerar").disabled && c.el("fixo").value === "(21)2334-0000, ramais 210, 211",
     { pendencia: c.el("pendencia").textContent, valor: c.el("fixo").value });
  c.fechar();
});

caso("Validação", "com máscara, o Telefone formata enquanto se digita", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.digitar("fixo", "2123340000");
  const dez = c.el("fixo").value;
  c.digitar("celular", "21912345678");
  ok(dez === "(21)2334-0000" && c.el("celular").value === "(21)91234-5678",
     { dez, onze: c.el("celular").value });
  c.fechar();
});

caso("Validação", "a máscara descarta o 55 digitado à frente", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.digitar("celular", "+5521967395087");
  ok(c.el("celular").value === "(21)96739-5087", c.el("celular").value);
  c.fechar();
});

caso("Validação", "matrícula incompleta é acusada", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.digitar("matricula", "1234");
  ok(c.el("btnGerar").disabled, c.el("pendencia").textContent);
  c.fechar();
});

caso("Validação", "e-mail malformado é acusado", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.digitar("email", "invalido@");
  ok(c.el("btnGerar").disabled && c.el("pendencia").textContent.includes("E-mail"));
  c.fechar();
});

caso("Validação", "máscaras de celular e matrícula", ok => {
  const c = abrir();
  ok(c.api.mascaraTelefone("21999999999") === "(21)99999-9999"
     && c.api.mascaraMatricula("123456") === "12.345-6");
  c.fechar();
});

caso("Validação", "normalização aceita +55 e reconhece fixo", ok => {
  const c = abrir();
  ok(c.api.normalizarTelefone("+5521999999999").celularValido
     && c.api.normalizarTelefone("2123340000").fixoValido);
  c.fechar();
});

caso("Validação", "marcar WhatsApp no Telefone desliga e trava a máscara", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.marcar("w_fixo", true);
  ok(c.api.el("k_fixo").disabled === true && c.el("fixo").placeholder === "+5521912345678",
     { travada: c.api.el("k_fixo").disabled, exemplo: c.el("fixo").placeholder });
  c.fechar();
});

caso("Validação", "o campo Celular não tem botão de máscara: ela é permanente", ok => {
  const c = abrir();
  ok(c.api.el("k_celular") === null && c.api.el("k_fixo") !== null);
  c.fechar();
});

/* posição fixa, sempre nesta ordem, encostada à direita: Aa, WhatsApp, máscara, N, I */
caso("Validação", "os sinais guardam a mesma posição em todos os campos", ok => {
  const c = abrir();
  const marcas = id => [...c.api.tile(id).querySelectorAll(".marc input")].map(i => i.id.replace("asg_" , "").replace("_" + id, ""));
  ok(igual(marcas("livre"),     ["c","w","b","i"])
     && igual(marcas("fixo"),      ["w","k","b","i"])
     && igual(marcas("celular"),   ["w","b","i"])
     && igual(marcas("cargo"),     ["c","b","i"])
     && igual(marcas("matricula"),     ["b","i"]),
     { livre:marcas("livre"), fixo:marcas("fixo"), celular:marcas("celular"),
       cargo:marcas("cargo"), matricula:marcas("matricula") });
  c.fechar();
});

caso("Validação", "o campo livre não leva máscara: ela reescreveria o que se digita", ok => {
  const c = abrir();
  c.digitar("t_livre", "Plantão");
  c.digitar("livre", "3º andar, sala 12");
  ok(c.api.el("k_livre") === null && c.el("livre").value === "3º andar, sala 12", c.el("livre").value);
  c.fechar();
});

caso("Validação", "caixa alta e WhatsApp se excluem", ok => {
  const c = abrir();
  c.marcar("c_livre", true);
  const bloqueouZap = c.api.el("w_livre").disabled;
  c.marcar("c_livre", false);
  c.marcar("w_livre", true);
  ok(bloqueouZap && c.api.el("c_livre").disabled, { bloqueouZap, caixa: c.api.el("c_livre").disabled });
  c.fechar();
});

caso("Validação", "no Telefone, a máscara também exclui a caixa alta e vice-versa", ok => {
  const c = abrir();
  c.marcar("w_fixo", true);
  const zapTrava = c.api.el("k_fixo").disabled;
  c.marcar("w_fixo", false);
  ok(zapTrava && c.api.el("k_fixo").disabled === false);
  c.fechar();
});

caso("Validação", "o campo livre também vira link de WhatsApp", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.digitar("t_livre", "Plantão");
  c.marcar("w_livre", true);
  c.digitar("livre", "+5521912345678");
  ok(c.api.corpoHTML().includes("https://wa.me/5521912345678"), c.api.corpoHTML());
  c.fechar();
});

/* --------------------------------------------------------------- matriz */

caso("Matriz", "o Nome está protegido pelo cadeado padrão, não por código", ok => {
  const c = abrir();
  c.tecla(c.alca("cargo"), "ArrowUp");            /* a linha do Nome vem travada */
  const protegido = c.api.disposicao()[0].join() === "nome";
  c.api.travar(c.api.linhas()[0], false);
  c.tecla(c.alca("cargo"), "ArrowUp");            /* destravada, aceita o bloco */
  ok(protegido && c.api.disposicao()[0].includes("cargo"), c.api.disposicao());
  c.fechar();
});

caso("Matriz", "nunca passa de três blocos por linha", ok => {
  const c = abrir();
  c.tecla(c.alca("lotacao"), "ArrowUp");
  ok(c.api.disposicao().every(l => l.length <= 3), c.api.disposicao());
  c.fechar();
});

caso("Matriz", "nunca passa de catorze linhas", ok => {
  const c = abrir();
  for(let i = 0; i < 25; i++) c.api.novaLinha(null, false);
  ok(c.api.linhas().length <= 14, c.api.linhas().length);
  c.fechar();
});

caso("Matriz", "a linha que se esvazia por arraste permanece na matriz", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  const antes = c.api.disposicao();
  const iOrigem = antes.findIndex(l => l.includes("lotacao"));
  const destino = c.api.linhas()[antes.findIndex(l => l.join() === "celular,fixo")];
  c.arrastar("lotacao", destino);
  const depois = c.api.disposicao();
  ok(depois.length === antes.length && depois[iOrigem].length === 0
     && depois.some(l => l.includes("lotacao") && l.includes("celular")), { antes, depois });
  c.fechar();
});

caso("Matriz", "a linha esvaziada pode ser eliminada pela lixeira", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  const antes = c.api.disposicao();
  const iOrigem = antes.findIndex(l => l.includes("lotacao"));
  c.arrastar("lotacao", c.api.linhas()[antes.findIndex(l => l.join() === "celular,fixo")]);
  ok(c.api.removivel(c.api.linhas()[iOrigem]));
  c.fechar();
});

caso("Matriz", "soltar numa faixa não rouba linha vazia de outro ponto", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  const antes = c.api.disposicao().filter(l => !l.length).length;
  const faixas = [...c.w.document.querySelectorAll(".matriz > .entre")];
  c.arrastar("sala", faixas[faixas.length - 1]);
  const depois = c.api.disposicao();
  ok(depois.filter(l => !l.length).length >= antes && depois.length <= 14, { antes, depois });
  c.fechar();
});

/* botão sem ação possível recebe a classe "inerte"; o CSS decide se some ou fica apagado */
const inerte = (c, i, acao) =>
  c.api.linhas()[i].querySelector('.ctrl .mini[data-acao="' + acao + '"]').classList.contains("inerte");

caso("Matriz", "sem destino, a seta de subir fica inerte nas duas primeiras linhas", ok => {
  const c = abrir();
  ok(inerte(c, 0, "subir") && inerte(c, 1, "subir") && !inerte(c, 2, "subir"));
  c.fechar();
});

caso("Matriz", "a seta de descer fica inerte na última linha e nas travadas", ok => {
  const c = abrir();
  const ls = c.api.linhas(), presas = c.api.travas();
  const sozinha = ls.every((l, i) => inerte(c, i, "descer") === (i === ls.length - 1 || presas[i]));
  c.api.novaLinha(null, false);
  const dep = c.api.linhas();
  ok(sozinha && inerte(c, dep.length - 1, "descer") && !inerte(c, dep.length - 2, "descer"));
  c.fechar();
});

caso("Matriz", "linha com campo fixo não é removível", ok => {
  const c = abrir();
  ok(c.api.removivel(c.api.tile("atendimento").parentElement) === false);
  c.fechar();
});

caso("Matriz", "quatrocentas operações aleatórias sem quebrar invariante", ok => {
  const c = abrir();
  let semente = 42;
  const sorte = () => (semente = (semente * 1103515245 + 12345) % 2147483648) / 2147483648;
  let erro = null;
  try {
    for(let i = 0; i < 400; i++){
      const r = sorte();
      const todos = c.api.disposicao().flat();
      const alvo = todos[Math.floor(sorte() * todos.length)];
      if(r < .25) c.digitar("nome", "Nome" + i);
      else if(r < .4 && alvo && alvo !== "nome"){
        const alca = c.api.tile(alvo) && c.api.tile(alvo).querySelector(".alca");
        if(alca) c.tecla(alca, ["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"][Math.floor(sorte()*4)]);
      }
      else if(r < .55) c.api.novaLinha(null, sorte() < .5);
      else if(r < .7){
        const ls = c.api.linhas().filter((l, idx) => idx > 0 && c.api.removivel(l));
        if(ls.length) c.api.removerLinha(ls[Math.floor(sorte() * ls.length)]);
      }
      else if(r < .85) c.api.desfazer();
      else c.api.refazer();

      const disp = c.api.disposicao();
      const plano = disp.flat();
      if(disp[0].join() !== "nome") throw new Error("a linha travada do Nome mudou na volta " + i);
      if(!c.api.travas()[0]) throw new Error("a primeira linha destravou sozinha na volta " + i);
      if(disp.some(l => l.length > 3)) throw new Error("mais de três por linha na volta " + i);
      if(disp.length > 14) throw new Error("mais de catorze linhas na volta " + i);
      if(new Set(plano).size !== plano.length) throw new Error("id repetido na volta " + i);
      c.api.gerar();
    }
  } catch(e){ erro = e; }
  ok(!erro, erro && erro.message);
  c.fechar();
});

/* --------------------------------------------------------------- escolhas */
/* Não há quadradinho à vista: quem mostra a opção em uso é a classe "escolhida" na caixa. */

const caixa = (c, id) => c.el(id).closest(".marc, .opc");

caso("Escolhas", "a caixa marcada acompanha o clique", ok => {
  const c = abrir();
  const cx = caixa(c, "titNegrito");
  const comecaMarcada = cx.classList.contains("escolhida");
  c.marcar("titNegrito", false);
  const desmarcou = !cx.classList.contains("escolhida");
  c.marcar("titNegrito", true);
  ok(comecaMarcada && desmarcou && cx.classList.contains("escolhida"), cx.className);
  c.fechar();
});

caso("Escolhas", "a caixa acompanha mudança feita por código, como o desfazer", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.api.registrarAgora();
  c.marcar("b_cargo", true);
  c.api.registrarAgora();
  const marcada = caixa(c, "b_cargo").classList.contains("escolhida");
  c.api.desfazer();
  ok(marcada && !caixa(c, "b_cargo").classList.contains("escolhida"),
     caixa(c, "b_cargo").className);
  c.fechar();
});

caso("Escolhas", "marcar um logotipo desmarca a caixa do anterior", ok => {
  const c = abrir();
  const caixas = () => [...c.w.document.querySelectorAll(".opcaoLogo")].map(l => l.classList.contains("escolhida"));
  const antes = caixas();
  const segundo = c.w.document.querySelectorAll('.opcaoLogo input')[1];
  segundo.checked = true;
  segundo.dispatchEvent(new c.w.Event("change", { bubbles:true }));
  ok(antes[0] === true && antes[1] === false && caixas()[0] === false && caixas()[1] === true, caixas());
  c.fechar();
});

caso("Escolhas", "a caixa desabilitada é marcada como tal", ok => {
  const c = abrir();
  const antes = caixa(c, "k_fixo").classList.contains("desabilitada");
  c.marcar("w_fixo", true);                                   /* WhatsApp trava a máscara */
  ok(!antes && caixa(c, "k_fixo").classList.contains("desabilitada"), caixa(c, "k_fixo").className);
  c.fechar();
});

caso("Escolhas", "as marcações ficam recolhidas atrás da setinha", ok => {
  const c = abrir();
  const t = c.api.tile("cargo");
  const seta = t.querySelector(".abrir");
  const fechado = !t.classList.contains("aberto") && seta.getAttribute("aria-expanded") === "false";
  c.clicar(seta);
  ok(fechado && t.classList.contains("aberto") && seta.getAttribute("aria-expanded") === "true");
  c.fechar();
});

caso("Escolhas", "a setinha avisa quando o campo tem marcação fora do padrão", ok => {
  const c = abrir();
  const seta = () => c.api.tile("cargo").querySelector(".abrir");
  const limpo = !seta().classList.contains("temMarca");
  c.marcar("i_cargo", true);
  ok(limpo && seta().classList.contains("temMarca") && seta().title.includes("Itálico"), seta().title);
  c.fechar();
});

caso("Escolhas", "restaurar padrões devolve as caixas ao estado inicial", ok => {
  const c = abrir();
  c.marcar("titNegrito", false);
  c.marcar("b_cargo", true);
  c.clicar("btnPadrao");
  const barra = c.el("mOpcoes").querySelector('input[data-k="barra"]');
  barra.checked = true;
  barra.dispatchEvent(new c.w.Event("change", { bubbles:true }));
  const dialogoMarca = barra.closest(".opc").classList.contains("escolhida");
  c.clicar("mRestaurar");
  ok(dialogoMarca && caixa(c, "titNegrito").classList.contains("escolhida"),
     { dialogoMarca, titulo: caixa(c, "titNegrito").className });
  c.fechar();
});

/* --------------------------------------------------------------- cadeado */

const travarLinhas = (c, ...indices) => indices.forEach(i => c.api.travar(c.api.linhas()[i], true));

caso("Cadeado", "a estrutura padrão sai com a primeira linha travada e as demais livres", ok => {
  const c = abrir();
  ok(igual(c.api.travas(), c.api.TRAVAS_PADRAO), c.api.travas());
  c.fechar();
});

caso("Cadeado", "o botão alterna o estado e troca o desenho", ok => {
  const c = abrir();
  const l = c.api.linhas()[2];
  const cad = l.querySelector('.ctrl .mini[data-acao="travar"]');
  c.clicar(cad);
  const fechou = c.api.travada(l) && cad.textContent === "🔒" && cad.getAttribute("aria-pressed") === "true";
  c.clicar(cad);
  ok(fechou && !c.api.travada(l) && cad.textContent === "🔓");
  c.fechar();
});

caso("Cadeado", "linha travada não sobe nem desce", ok => {
  const c = abrir();
  travarLinhas(c, 2);
  const antes = c.api.disposicao();
  const l = c.api.linhas()[2];
  ok(c.api.moverLinha(l, true) === false && c.api.moverLinha(l, false) === false
     && igual(c.api.disposicao(), antes));
  c.fechar();
});

caso("Cadeado", "na linha travada as setas e a lixeira ficam inertes", ok => {
  const c = abrir();
  travarLinhas(c, 8);                                  /* linha do campo livre, removível */
  ok(inerte(c, 8, "subir") && inerte(c, 8, "descer") && inerte(c, 8, "remover"));
  c.fechar();
});

caso("Cadeado", "linha vazia travada não recebe campo livre, mas ainda cria linhas", ok => {
  const c = abrir();
  travarLinhas(c, 3);                                  /* linha vazia do padrão */
  const l = c.api.linhas()[3];
  c.api.criarCampoLivre(l);
  const naoCriou = c.api.blocos(l).length === 0;
  const criarLivres = !inerte(c, 3, "acima") && !inerte(c, 3, "abaixo");
  ok(naoCriou && inerte(c, 3, "novo") && criarLivres);
  c.fechar();
});

caso("Cadeado", "linha travada não é removível", ok => {
  const c = abrir();
  travarLinhas(c, 3);
  ok(c.api.removivel(c.api.linhas()[3]) === false);
  c.fechar();
});

caso("Cadeado", "bloco de linha travada não se move pelo teclado", ok => {
  const c = abrir();
  travarLinhas(c, 1);
  const antes = c.api.disposicao();
  c.tecla(c.alca("cargo"), "ArrowDown");
  c.tecla(c.alca("cargo"), "ArrowRight");
  ok(igual(c.api.disposicao(), antes), c.api.disposicao());
  c.fechar();
});

caso("Cadeado", "linha travada não recebe bloco arrastado", ok => {
  const c = abrir();
  travarLinhas(c, 2);                                  /* linha da lotação */
  const antes = c.api.disposicao();
  c.arrastar("sala", c.api.linhas()[2]);
  ok(igual(c.api.disposicao(), antes), c.api.disposicao());
  c.fechar();
});

caso("Cadeado", "bloco de linha travada não sai por arraste", ok => {
  const c = abrir();
  travarLinhas(c, 2);
  const antes = c.api.disposicao();
  c.arrastar("lotacao", c.api.linhas()[5]);
  ok(igual(c.api.disposicao(), antes), c.api.disposicao());
  c.fechar();
});

caso("Cadeado", "subir salta o bloco contíguo de travadas (cenário da img 5)", ok => {
  const c = abrir();
  c.api.travar(c.api.linhas()[0], false);              /* primeira destravada */
  travarLinhas(c, 1, 2);                               /* segunda e terceira travadas */
  const alvo = c.api.disposicao()[3];
  c.api.moverLinha(c.api.linhas()[3], true);
  ok(igual(c.api.disposicao()[1], alvo), c.api.disposicao());
  c.fechar();
});

caso("Cadeado", "com tudo travado acima, não há para onde subir", ok => {
  const c = abrir();
  travarLinhas(c, 1);                                  /* a 0 já vem travada */
  ok(c.api.alvoSubir(c.api.linhas(), 2) === null && inerte(c, 2, "subir"));
  c.fechar();
});

caso("Cadeado", "com tudo travado abaixo, não há para onde descer", ok => {
  const c = abrir();
  const ls = c.api.linhas();
  travarLinhas(c, ls.length - 1, ls.length - 2);
  ok(c.api.alvoDescer(c.api.linhas(), ls.length - 3) === null && inerte(c, ls.length - 3, "descer"));
  c.fechar();
});

caso("Cadeado", "o rodapé cria acima do bloco travado do fim (cenário da img 4)", ok => {
  const c = abrir();
  const ls = c.api.linhas();
  travarLinhas(c, ls.length - 1, ls.length - 2, ls.length - 3);   /* três últimas travadas */
  const antes = c.api.disposicao();
  c.clicar(c.w.document.querySelector('.rodapeMatriz [data-nova="vazia"]'));
  const dep = c.api.disposicao();
  ok(dep.length === antes.length + 1 && dep[antes.length - 3].length === 0
     && igual(dep.slice(-3), antes.slice(-3)), dep);
  c.fechar();
});

caso("Cadeado", "a linha nova acima do bloco travado do fim não tem para onde descer", ok => {
  const c = abrir();
  const ls = c.api.linhas();
  travarLinhas(c, ls.length - 1, ls.length - 2);
  c.clicar(c.w.document.querySelector('.rodapeMatriz [data-nova="vazia"]'));
  const i = c.api.linhas().length - 3;
  ok(inerte(c, i, "descer"), c.api.travas());
  c.fechar();
});

caso("Cadeado", "com a matriz toda travada, o rodapé desiste e avisa", ok => {
  const c = abrir();
  c.api.linhas().forEach(l => l.classList.add("travada"));
  c.api.realcar();
  const antes = c.api.disposicao();
  const botao = c.w.document.querySelector('.rodapeMatriz [data-nova="vazia"]');
  c.clicar(botao);
  ok(c.api.pontoDeInsercao() === null && botao.disabled === true
     && !c.w.document.querySelector(".tudoTravado").classList.contains("hide")
     && igual(c.api.disposicao(), antes));
  c.fechar();
});

caso("Cadeado", "os dois botões criam linha vazia acima e abaixo da linha-mãe", ok => {
  const c = abrir();
  const antes = c.api.disposicao();
  c.clicar(c.api.linhas()[2].querySelector('[data-acao="acima"]'));
  const meio = c.api.disposicao();
  const criouAcima = meio[2].length === 0 && igual(meio[3], antes[2]);
  c.clicar(c.api.linhas()[3].querySelector('[data-acao="abaixo"]'));
  const dep = c.api.disposicao();
  ok(criouAcima && dep[4].length === 0 && igual(dep[3], antes[2]), dep);
  c.fechar();
});

caso("Cadeado", "o texto e as marcações da linha travada continuam editáveis", ok => {
  const c = abrir();
  travarLinhas(c, 1);
  c.digitar("cargo", "Analista");
  c.marcar("b_cargo", true);
  ok(c.el("cargo").value === "Analista" && c.el("b_cargo").checked === true
     && c.el("b_cargo").disabled === false);
  c.fechar();
});

caso("Cadeado", "travar e destravar entram no histórico", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.api.registrarAgora();
  c.api.travar(c.api.linhas()[4], true);
  const travou = c.api.travas()[4] === true;
  c.api.desfazer();
  ok(travou && c.api.travas()[4] === false, c.api.travas());
  c.fechar();
});

caso("Cadeado", "cadeado fora do padrão acende o botão Restaurar", ok => {
  const c = abrir();
  c.api.travar(c.api.linhas()[4], true);
  const acendeu = c.api.camposMudaram() === true && c.el("btnPadrao").disabled === false;
  c.api.aplicar(c.api.PADRAO, false, true, undefined, c.api.TRAVAS_PADRAO);
  ok(acendeu && igual(c.api.travas(), c.api.TRAVAS_PADRAO) && c.api.camposMudaram() === false,
     c.api.travas());
  c.fechar();
});

/* ------------------------------------------------------------ histórico */

caso("Histórico", "desfazer logo após digitar não perde o trecho digitado", async ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  await esperar(500);
  c.digitar("cargo", "Analista");     /* ainda dentro do agrupamento de 350 ms */
  c.tecla(c.w.document, "z", { ctrlKey:true });
  await esperar(600);
  const apagou = c.el("cargo").value === "";
  c.api.refazer();
  ok(apagou && c.el("cargo").value === "Analista", c.el("cargo").value);
  c.fechar();
});

caso("Histórico", "desfazer devolve o campo livre do padrão com título e conteúdo", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.api.registrarAgora();
  c.digitar("livre", "conteúdo importante");
  c.digitar("t_livre", "Sítio");
  c.api.registrarAgora();
  c.api.removerLinha(c.api.tile("livre").parentElement);
  c.api.desfazer();
  ok(c.api.tile("livre") && c.el("livre").value === "conteúdo importante"
     && c.el("t_livre").value === "Sítio",
     c.api.tile("livre") ? [c.el("livre").value, c.el("t_livre").value] : "campo não voltou");
  c.fechar();
});

caso("Histórico", "desfazer devolve campo livre criado depois, com o que tinha", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.api.registrarAgora();
  const linha = c.api.novaLinha(null, true);
  const id = c.api.blocos(linha)[0].dataset.id;
  c.digitar("t_" + id, "Ramal");
  c.digitar(id, "210");
  c.api.registrarAgora();
  c.api.removerLinha(c.api.tile(id).parentElement);
  c.api.desfazer();
  ok(c.api.tile(id) && c.el(id).value === "210" && c.el("t_" + id).value === "Ramal");
  c.fechar();
});

caso("Histórico", "desfazer até o início e refazer até o fim reconstrói o estado", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");        c.api.registrarAgora();
  c.digitar("cargo", "Analista");  c.api.registrarAgora();
  c.el("cor").value = "#0072CE";
  c.el("cor").dispatchEvent(new c.w.Event("input", { bubbles:true }));
  c.api.registrarAgora();
  c.api.novaLinha(null, false);
  const alvo = c.api.estadoAtual();
  for(let i = 0; i < 10; i++) c.api.desfazer();
  for(let i = 0; i < 10; i++) c.api.refazer();
  ok(c.api.estadoAtual() === alvo);
  c.fechar();
});

caso("Histórico", "Ctrl+Z e Ctrl+Shift+Z funcionam fora dos campos", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.api.registrarAgora();
  c.digitar("cargo", "Analista");
  c.api.registrarAgora();
  c.tecla(c.w.document, "z", { ctrlKey:true });
  const desfez = c.el("cargo").value === "";
  c.tecla(c.w.document, "z", { ctrlKey:true, shiftKey:true });
  ok(desfez && c.el("cargo").value === "Analista");
  c.fechar();
});

/* ---------------------------------------------------------- restauração */

caso("Restauração", "uma linha vazia a mais já conta como fora do padrão", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.api.novaLinha(null, false);
  ok(c.api.camposMudaram() === true, c.api.disposicao());
  c.fechar();
});

caso("Restauração", "remover a linha vazia do meio conta como fora do padrão", ok => {
  const c = abrir();
  const vazia = c.api.linhas().find(l => c.api.blocos(l).length === 0);
  c.api.removerLinha(vazia);
  ok(c.api.camposMudaram() === true, c.api.disposicao());
  c.fechar();
});

caso("Restauração", "'Restaurar tudo' devolve exatamente o padrão", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.api.novaLinha(null, false);
  c.el("cor").value = "#000000";
  c.el("cor").dispatchEvent(new c.w.Event("input", { bubbles:true }));
  c.tecla(c.alca("sala"), "ArrowDown");
  c.clicar("btnPadrao");
  const tudo = c.el("mOpcoes").querySelector('input[data-k="tudo"]');
  tudo.checked = true;
  tudo.dispatchEvent(new c.w.Event("change", { bubbles:true }));
  c.clicar("mRestaurar");
  ok(igual(c.api.disposicao(), c.api.PADRAO)
     && c.el("cor").value.toUpperCase() === "#AD841F"
     && c.el("nome").value === ""
     && c.el("btnPadrao").disabled === true, c.api.disposicao());
  c.fechar();
});

caso("Restauração", "restaurar só a disposição preserva o texto digitado", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.tecla(c.alca("sala"), "ArrowDown");
  c.clicar("btnPadrao");
  const campos = c.el("mOpcoes").querySelector('input[data-k="campos"]');
  campos.checked = true;
  campos.dispatchEvent(new c.w.Event("change", { bubbles:true }));
  c.clicar("mRestaurar");
  ok(igual(c.api.disposicao(), c.api.PADRAO) && c.el("nome").value === "Ana");
  c.fechar();
});

caso("Restauração", "restaurar recria campo do padrão que tinha sido apagado", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.api.removerLinha(c.api.tile("livre").parentElement);
  const sumiu = !c.api.tile("livre");
  c.api.aplicar(c.api.PADRAO, false, true);
  ok(sumiu && !!c.api.tile("livre"));
  c.fechar();
});

caso("Restauração", "Cancelar não altera nada", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.api.novaLinha(null, false);
  const antes = c.api.estadoAtual();
  c.clicar("btnPadrao");
  c.clicar("mCancelar");
  ok(c.api.estadoAtual() === antes && c.el("modal").classList.contains("hide"));
  c.fechar();
});

caso("Restauração", "Esc fecha a caixa sem alterar nada", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.api.novaLinha(null, false);
  const antes = c.api.estadoAtual();
  c.clicar("btnPadrao");
  c.tecla(c.w.document, "Escape");
  ok(c.api.estadoAtual() === antes && c.el("modal").classList.contains("hide"));
  c.fechar();
});

caso("Restauração", "com a caixa aberta o resto da página fica inerte", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.clicar("btnPadrao");
  const trancado = c.w.document.querySelector(".wrap").hasAttribute("inert");
  c.clicar("mCancelar");
  ok(trancado && !c.w.document.querySelector(".wrap").hasAttribute("inert"));
  c.fechar();
});

/* ---------------------------------------------------------------- cópia */

caso("Cópia", "falha na cópia não apaga dado algum", async ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.clicar("btnGerar");
  c.w.navigator.clipboard = { writeText: () => Promise.reject(new Error("negado")) };
  c.w.document.execCommand = () => false;
  c.clicar("btnCopiarLimpar");
  await esperar(50);
  ok(c.el("nome").value === "Ana" && c.el("aviso").textContent.includes("Ctrl+C"), c.el("aviso").textContent);
  c.fechar();
});

caso("Cópia", "Recomeçar preserva título de campo livre e disposição", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.digitar("t_livre", "Ramal");
  c.digitar("livre", "210");
  c.clicar("btnGerar");
  const disp = c.api.disposicao();
  c.clicar("btnRecomecar");
  ok(c.el("nome").value === "" && c.el("livre").value === ""
     && c.el("t_livre").value === "Ramal" && igual(c.api.disposicao(), disp));
  c.fechar();
});

/* --------------------------------------------------------- inatividade */

caso("Inatividade", "sem nada preenchido o aviso não aparece", ok => {
  const c = abrir();
  c.api.abrirContagem();
  ok(c.el("modalTempo").classList.contains("hide"));
  c.fechar();
});

caso("Inatividade", "com dado preenchido o aviso abre, conta e prende o foco", async ok => {
  const c = abrir();
  c.digitar("nome", "Ana Maria");
  c.api.abrirContagem();
  const abriu = !c.el("modalTempo").classList.contains("hide");
  const comecou = c.el("tContagem").textContent === String(c.api.CONTAGEM);
  const inerte = c.w.document.querySelector(".wrap").hasAttribute("inert");
  const foco = c.w.document.activeElement === c.el("tContinuar");
  await esperar(1100);
  ok(abriu && comecou && inerte && foco && +c.el("tContagem").textContent < c.api.CONTAGEM,
     { abriu, comecou, inerte, foco, resta:c.el("tContagem").textContent });
  c.fechar();
});

caso("Inatividade", "'Continuar' fecha o aviso e não apaga nada", async ok => {
  const c = abrir();
  c.digitar("nome", "Ana Maria");
  c.api.abrirContagem();
  c.clicar("tContinuar");
  await esperar(1200);
  ok(c.el("modalTempo").classList.contains("hide")
     && c.el("nome").value === "Ana Maria"
     && !c.w.document.querySelector(".wrap").hasAttribute("inert"));
  c.fechar();
});

caso("Inatividade", "Esc durante o aviso vale como interação", ok => {
  const c = abrir();
  c.digitar("nome", "Ana Maria");
  c.api.abrirContagem();
  c.tecla(c.w.document, "Escape");
  ok(c.el("modalTempo").classList.contains("hide") && c.el("nome").value === "Ana Maria");
  c.fechar();
});

caso("Inatividade", "o expurgo apaga conteúdo, títulos, código e histórico", ok => {
  const c = abrir();
  c.digitar("nome", "Ana");
  c.digitar("celular", "(21)99999-9999");
  c.digitar("t_livre", "Ramal");
  c.digitar("livre", "210");
  c.clicar("btnGerar");
  c.api.abrirContagem();
  c.clicar("tApagar");
  ok(c.el("nome").value === "" && c.el("celular").value === "" && c.el("livre").value === ""
     && c.el("t_livre").value === "" && c.el("saida").value === ""
     && c.el("blocoCodigo").classList.contains("hide")
     && c.el("btnDesfazer").disabled === true && c.api.pilha.length === 1
     && c.el("modalTempo").classList.contains("hide"));
  c.fechar();
});

module.exports = { casos };
