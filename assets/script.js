let locked=false;
let generator=null;

const menuButton=document.getElementById("menuButton");
const sideMenu=document.getElementById("sideMenu");

menuButton.onclick=()=>sideMenu.classList.toggle("hidden");

sideMenu.querySelectorAll("li").forEach(el=>{
  el.onclick=()=>{
    show(el.dataset.screen);
    sideMenu.classList.add("hidden");
  };
});

function modelo(q){
 if(q==="alta") return "Llama-3.1-8B-Instruct-q4f16_1";
 if(q==="baixa") return "Phi-3-mini-4k-instruct-q4f16_1";
 return "Qwen2.5-7B-Instruct-q4f16_1";
}

async function initModel(name){
 return await webllm.CreateMLCEngine({
   model:name,
   model_url:`https://huggingface.co/mlc-ai/${name}/resolve/main/`,
   progress_callback:(info)=>atualizarBarra(info)
 });
}

function atualizarBarra(info){
 const barra=document.getElementById("barra");
 const texto=document.getElementById("barraTexto");
 const pct=Math.floor(info.progress*100);
 barra.style.width=pct+"%";
 texto.innerText=`Carregando IA... ${pct}%`;
}

function show(id){
 document.querySelectorAll('.tela').forEach(t=>t.classList.add('hidden'));
 document.getElementById(id).classList.remove('hidden');
}

document.getElementById('btnIniciar').onclick=async ()=>{
 if(locked)return;
 locked=true;

 const titulo=document.getElementById('titulo').value.trim();
 const enredo=document.getElementById('enredo').value.trim();
 const nucleos=document.getElementById('nucleos').value.trim();
 const genero=document.getElementById('genero').value;
 const qualidade=document.getElementById('qualidade').value;
 const primeiraPessoa=document.getElementById('primeiraPessoa').checked;

 show('telaHistoria');
 document.getElementById('tituloDisplay').innerText=titulo;

 document.getElementById("carregamento").classList.remove("hidden");

 const m=modelo(qualidade);
 generator=await initModel(m);

 document.getElementById("carregamento").classList.add("hidden");

 const prompt = `Crie o início do Capítulo 1 (50%) baseado no enredo: ${enredo}. Núcleos: ${nucleos}. Gênero: ${genero}. ${
   primeiraPessoa?"Narrar em primeira pessoa.":""}`;

 const out = await generator.chat.completions.create({
   messages:[{role:"user",content:prompt}]
 });

 const text=out.choices[0].message.content;
 document.getElementById("texto").innerHTML=text;

 const opcoes=text.split("\n").filter(l=>l.trim().match(/^\d\./));
 if(opcoes.length>=3){
   const e=document.getElementById("escolhas");
   e.classList.remove("hidden");
   document.querySelector('[data-n="1"]').innerText=opcoes[0];
   document.querySelector('[data-n="2"]').innerText=opcoes[1];
   document.querySelector('[data-n="3"]').innerText=opcoes[2];
 }
};

document.querySelectorAll('.opcao').forEach(btn=>{
 btn.onclick=async ()=>{
  if(btn.classList.contains('chosen'))return;
  document.querySelectorAll('.opcao').forEach(b=>b.disabled=true);
  btn.classList.add('chosen');

  const escolha=btn.innerText;
  const textoArea=document.getElementById('texto');
  textoArea.innerHTML+="<br><br>Gerando continuação...";

  const out = await generator.chat.completions.create({
    messages:[{role:"user",content:`Continue o capítulo a partir da escolha: ${escolha}. Gere até 90%. Depois liste 3 novas opções.`}]
  });

  textoArea.innerHTML=out.choices[0].message.content;
 };
});
