let locked = false;
let engine = null;
let historias = [];

const MODELOS = {
  alta: "Llama-3.2-3B-Instruct-q4f32_1-MLC",
  equilibrado: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
  baixa: "Phi-3-mini-4k-instruct-q4f16_1-MLC"
};

const statusFloat = document.getElementById("statusFloat");

function setStatus(msg){
  statusFloat.innerText = "Status: " + msg;
}

const menuButton = document.getElementById("menuButton");
const sideMenu = document.getElementById("sideMenu");

menuButton.onclick = () => sideMenu.classList.toggle("hidden");

sideMenu.querySelectorAll("li").forEach(el=>{
  el.onclick = () => {
    show(el.dataset.screen);
    sideMenu.classList.add("hidden");
    if(el.dataset.screen === "telaHistorias") atualizarLista();
  };
});

function progressToNumber(p){
  if (typeof p === "number") return p;
  if (p && typeof p.progress === "number") return p.progress;
  return 0;
}

async function initModel(modelName){
  if (!window.webllm){
    throw new Error("WebLLM ainda não carregado.");
  }
  setStatus("carregando modelo: " + modelName);

  engine = await window.webllm.CreateMLCEngine(
    modelName,
    {
      initProgressCallback: (p)=>{
        const prog = progressToNumber(p);
        atualizarBarra(prog);
      }
    }
  );
  setStatus("modelo carregado: " + modelName);
}

function atualizarBarra(prog){
  const pct = Math.floor((prog || 0) * 100);
  document.getElementById("barra").style.width = pct + "%";
  document.getElementById("barraTexto").innerText = "Carregando IA... " + pct + "%";
}

function show(id){
  document.querySelectorAll(".tela").forEach(t=>t.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function salvarHistoria(h){
  const idx = historias.findIndex(x=>x.id === h.id);
  if (idx >= 0) historias[idx] = h; else historias.push(h);
  localStorage.setItem("historias", JSON.stringify(historias));
}

function carregarHistorias(){
  try{
    historias = JSON.parse(localStorage.getItem("historias") || "[]");
  }catch(e){
    historias = [];
  }
}
carregarHistorias();

function atualizarLista(){
  const div = document.getElementById("listaHistorias");
  if (!historias.length){
    div.innerHTML = "<p>Nenhuma história criada ainda.</p>";
    return;
  }
  div.innerHTML = "";
  historias.forEach(h=>{
    const el = document.createElement("div");
    el.className = "histItem";
    el.innerHTML = `<b>${h.titulo}</b><br>Status: ${h.status}`;
    el.onclick = () => abrirHistoria(h.id);
    div.appendChild(el);
  });
}

function abrirHistoria(id){
  const h = historias.find(x=>x.id === id);
  if (!h) return;
  show("telaHistoria");
  document.getElementById("tituloDisplay").innerText = h.titulo;
  if (h.texto){
    document.getElementById("texto").innerHTML = h.texto;
  } else {
    document.getElementById("texto").innerHTML =
      "Esta história ainda não foi gerada. Status atual: " + h.status +
      "<br>Clique novamente em 'Iniciar História' na tela de criação para tentar gerar.";
  }
}

document.getElementById("btnIniciar").onclick = async () => {
  if (locked) return;
  locked = true;

  const titulo = document.getElementById("titulo").value.trim();
  const enredo = document.getElementById("enredo").value.trim();
  const nucleos = document.getElementById("nucleos").value.trim();
  const genero = document.getElementById("genero").value;
  const qualidade = document.getElementById("qualidade").value;
  const primeiraPessoa = document.getElementById("primeiraPessoa").checked;

  const id = Date.now().toString();
  let historia = {
    id, titulo, enredo, nucleos, genero, qualidade,
    primeiraPessoa, status: "gerando", texto: ""
  };
  salvarHistoria(historia);

  document.getElementById("tituloDisplay").innerText = titulo;
  show("telaHistoria");
  document.getElementById("carregamento").classList.remove("hidden");

  const modelName = MODELOS[qualidade];

  try{
    await initModel(modelName);
  }catch(e){
    console.error(e);
    setStatus("erro ao conectar IA");
    historia.status = "erro";
    salvarHistoria(historia);
    document.getElementById("carregamento").classList.add("hidden");
    locked = false;
    return;
  }

  document.getElementById("carregamento").classList.add("hidden");
  setStatus("gerando capítulo 1 (50%)");

  const prompt = `Crie o início do Capítulo 1 (aprox. 50%) de uma história em português brasileiro.
Enredo base: ${enredo}
Núcleos: ${nucleos}
Gênero: ${genero}
${primeiraPessoa ? "Narre em primeira pessoa, o leitor é o personagem principal." : ""}
Ao final, liste exatamente 3 opções numeradas (1., 2., 3.) para os próximos caminhos da história.`;

  const out = await engine.chat.completions.create({
    messages:[{role:"user",content:prompt}]
  });

  const texto = out.choices[0].message.content;
  document.getElementById("texto").innerHTML = texto;
  historia.texto = texto;
  historia.status = "capítulo 1 - 50%";
  salvarHistoria(historia);

  const opcoes = texto.split("\n").filter(l=>l.trim().match(/^\d\./));
  if (opcoes.length >= 3){
    const e = document.getElementById("escolhas");
    e.classList.remove("hidden");
    document.querySelector('[data-n="1"]').innerText = opcoes[0];
    document.querySelector('[data-n="2"]').innerText = opcoes[1];
    document.querySelector('[data-n="3"]').innerText = opcoes[2];
  }

  locked = false;
};
