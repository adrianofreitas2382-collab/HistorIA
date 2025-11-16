let locked = false;
let generator = null;
let historias = [];

const statusFloat = document.getElementById("statusFloat");

function setStatus(txt){
  statusFloat.innerText = "Status: " + txt;
}

const menuButton = document.getElementById("menuButton");
const sideMenu = document.getElementById("sideMenu");

menuButton.onclick = () => sideMenu.classList.toggle("hidden");

sideMenu.querySelectorAll("li").forEach(el => {
  el.onclick = () => {
    show(el.dataset.screen);
    sideMenu.classList.add("hidden");
    if (el.dataset.screen === "telaHistorias") atualizarLista();
  };
});

function modelo(q){
  if (q === "alta") return "Llama-3.1-8B-Instruct-q4f16_1";
  if (q === "baixa") return "Phi-3-mini-4k-instruct-q4f16_1";
  return "Qwen2.5-7B-Instruct-q4f16_1";
}

async function initModel(name){
  if (!window.webllm){
    throw new Error("WebLLM ainda não carregado");
  }
  return await window.webllm.CreateMLCEngine({
    model: name,
    model_url: `https://huggingface.co/mlc-ai/${name}/resolve/main/`,
    progress_callback: (info) => atualizarBarra(info)
  });
}

function atualizarBarra(info){
  const barra = document.getElementById("barra");
  const texto = document.getElementById("barraTexto");
  const pct = Math.floor((info.progress || 0) * 100);
  barra.style.width = pct + "%";
  texto.innerText = `Carregando IA... ${pct}%`;
}

function show(id){
  document.querySelectorAll('.tela').forEach(t => t.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

function salvarHistoria(h){
  const idx = historias.findIndex(x => x.id === h.id);
  if (idx >= 0){
    historias[idx] = h;
  } else {
    historias.push(h);
  }
  localStorage.setItem("historias", JSON.stringify(historias));
}

function carregarHistorias(){
  const h = localStorage.getItem("historias");
  if (h){
    try{
      historias = JSON.parse(h);
    }catch(e){
      historias = [];
    }
  }
}
carregarHistorias();

function atualizarLista(){
  const div = document.getElementById("listaHistorias");
  if (!div) return;
  if (!historias.length){
    div.innerHTML = "<p>Nenhuma história criada ainda.</p>";
    return;
  }
  div.innerHTML = "";
  historias.forEach((h) => {
    const el = document.createElement("div");
    el.className = "histItem";
    el.innerHTML = `<b>${h.titulo || "(sem título)"}</b><br>Status: ${h.status}`;
    el.onclick = () => abrirHistoria(h.id);
    div.appendChild(el);
  });
}

function abrirHistoria(id){
  const h = historias.find(x => x.id === id);
  if (!h) return;
  document.getElementById("tituloDisplay").innerText = h.titulo;
  show("telaHistoria");
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
    id,
    titulo,
    enredo,
    nucleos,
    genero,
    qualidade,
    primeiraPessoa,
    status: "gerando",
    texto: ""
  };
  salvarHistoria(historia);

  document.getElementById("tituloDisplay").innerText = titulo;
  show("telaHistoria");

  document.getElementById("carregamento").classList.remove("hidden");
  setStatus("conectando IA");

  const m = modelo(qualidade);
  try{
    generator = await initModel(m);
    setStatus("conectado");
  }catch(e){
    console.error(e);
    setStatus("erro ao conectar");
    historia.status = "erro";
    salvarHistoria(historia);
    document.getElementById("carregamento").classList.add("hidden");
    locked = false;
    return;
  }

  document.getElementById("carregamento").classList.add("hidden");

  setStatus("gerando capítulo 1 (50%)");

  const basePrompt = `Crie o início do Capítulo 1 (aprox. 50%) de uma história em português brasileiro.
Enredo base: ${enredo}
Núcleos obrigatórios: ${nucleos}
Gênero: ${genero}
${primeiraPessoa ? "Narre em primeira pessoa, o leitor é o personagem principal." : ""}
Ao final do texto, liste exatamente 3 opções numeradas (1., 2., 3.) para o próximo caminho, sem explicações longas.`;

  const out = await generator.chat.completions.create({
    messages: [{ role: "user", content: basePrompt }]
  });

  const text = out.choices[0].message.content;
  document.getElementById("texto").innerHTML = text;
  historia.texto = text;
  historia.status = "capítulo 1 - 50%";
  salvarHistoria(historia);

  const opcoes = text.split("\n").filter(l => l.trim().match(/^\d\./));
  if (opcoes.length >= 3){
    const e = document.getElementById("escolhas");
    e.classList.remove("hidden");
    document.querySelector('[data-n="1"]').innerText = opcoes[0];
    document.querySelector('[data-n="2"]').innerText = opcoes[1];
    document.querySelector('[data-n="3"]').innerText = opcoes[2];

    document.querySelectorAll(".opcao").forEach(btn => {
      btn.disabled = false;
      btn.classList.remove("chosen");
      btn.onclick = async () => {
        if (btn.classList.contains("chosen")) return;
        document.querySelectorAll(".opcao").forEach(b => b.disabled = true);
        btn.classList.add("chosen");

        setStatus("gerando continuação (até 90%)");

        const escolha = btn.innerText;
        const textoArea = document.getElementById("texto");
        textoArea.innerHTML += "<br><br><em>Gerando continuação...</em>";

        const out2 = await generator.chat.completions.create({
          messages: [{ role: "user", content:
            `Continue o capítulo 1 a partir da seguinte escolha do leitor: ${escolha}.
Mantenha o mesmo estilo e narração. Gere conteúdo até cerca de 90% do capítulo 1, ainda sem concluir totalmente.` }]
        });

        const text2 = out2.choices[0].message.content;
        textoArea.innerHTML = text + "\n\n" + text2;
        historia.texto = textoArea.innerHTML;
        historia.status = "capítulo 1 - 90%";
        salvarHistoria(historia);
        setStatus("capítulo 1 gerado até 90%");
      };
    });
  } else {
    setStatus("capítulo 1 gerado (sem opções detectadas)");
    historia.status = "capítulo 1 - gerado";
    salvarHistoria(historia);
  }

  locked = false;
};

