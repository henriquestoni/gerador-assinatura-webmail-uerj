/* Assinatura de e-mail Uerj | testes/executar.js | versão 1 */
/* Roda todos os casos e devolve código de saída 1 se algum falhar.
   Uso:  node testes/executar.js            (tudo)
         node testes/executar.js Matriz     (só uma seção) */

const { casos } = require("./casos");

const filtro = process.argv[2];
const escolhidos = filtro
  ? casos.filter(c => c.secao.toLowerCase().includes(filtro.toLowerCase())
                   || c.nome.toLowerCase().includes(filtro.toLowerCase()))
  : casos;

(async () => {
  let falhas = 0, secaoAtual = "";
  for(const c of escolhidos){
    if(c.secao !== secaoAtual){ secaoAtual = c.secao; console.log("\n— " + secaoAtual); }
    let passou = false, detalhe = "";
    const ok = (cond, extra) => {
      passou = !!cond;
      if(!passou && extra !== undefined) detalhe = typeof extra === "string" ? extra : JSON.stringify(extra);
    };
    try { await c.corpo(ok); }
    catch(e){ passou = false; detalhe = "exceção: " + e.message; }
    console.log((passou ? "  ok    " : "  FALHA ") + c.nome + (passou || !detalhe ? "" : "\n          " + detalhe));
    if(!passou) falhas++;
  }
  console.log("\n" + escolhidos.length + " casos, " + falhas + " falha(s).");
  process.exit(falhas ? 1 : 0);
})();
