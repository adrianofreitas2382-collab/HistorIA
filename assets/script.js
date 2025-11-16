let locked=false;
let generator=null;
let historias=[];

const MODELOS={
 alta:"Llama-3.1-8B-Instruct-q4f32_1-MLC",
 equilibrado:"Qwen2.5-7B-Instruct-q4f32_1-MLC",
 baixa:"Phi-3-mini-128k-instruct-q4f32_1-MLC"
};

const statusFloat=document.getElementById("statusFloat");

function setStatus(txt){statusFloat.innerText="Status: "+txt;}

const menuButton=document.getElementById("menuButton");
const sideMenu=document.getElementById("sideMenu");

menuButton.onclick=()=>sideMenu.classList.toggle("hidden");

sideMenu.querySelectorAll("li").forEach(el=>{
 el.onclick=()=>{
   show(el.dataset.screen);
   sideMenu.classList.add("hidden");
   if(el.dataset.screen==="telaHistorias") atualizarLista();
 };
});

async function initModel(modelName){
 setStatus("carregando modelo: "+modelName);
 return await window.webllm.CreateMLCEngine({
   model:modelName,
   model_url:`https://huggingface.co/mlc-ai/${modelName}/resolve/main/`,
   progress_callback:(info)=>atualizarBarra(info)
 });
}

function atualizarBarra(info){
 const pct=Math.floor((info.progress||0)*100);
 document.getElementById("barra").style.width=pct+"%";
 document.getElementById("barraTexto").innerText=`Carregando IA... ${pct}%`;
}

function show(id){
 document.querySelectorAll('.tela').forEach(t=>t.classList.add('hidden'));
 document.getElementById(id).classList.remove('hidden');
}

function salvarHistoria(h){
 let i=historias.findIndex(x=>x.id===h.id);
 if(i>=0) historias[i]=h; else historias.push(h);
 localStorage.setItem("historias",JSON.stringify(historias));
}

function carregarHistorias(){
 try{
   historias=JSON.parse(localStorage.getItem("historias")||"[]");
 }catch(e){historias=[];}
}
carregarHistorias();

function atualizarLista(){
 const div=document.getElementById("listaHistorias");
 if(!historias.length){
   div.innerHTML="<p>Nenhuma história criada ainda.</p>";
   return;
 }
 div.innerHTML="";
 historias.forEach(h=>{
   let el=document.createElement("div");
   el.className="histItem";
   el.innerHTML=`<b>${h.titulo}</b><br>Status: ${h.status}`;
   el.onclick=()=>abrirHistoria(h.id);
   div.appendChild(el);
 });
}

function abrirHistoria(id){
 let h=historias.find(x=>x.id===id);
 if(!h) return;
 show("telaHistoria");
 document.getElementById("tituloDisplay").innerText=h.titulo;
 document.getElementById("texto").innerHTML=h.texto||"História pendente.";
}

document.getElementById("btnIniciar").onclick=async ()=>{
 if(locked) return;
 locked=true;

 const titulo=document.getElementById("titulo").value.trim();
 const enredo=document.getElementById("enredo").value.trim();
 const nucleos=document.getElementById("nucleos").value.trim();
 const genero=document.getElementById("genero").value;
 const qualidade=document.getElementById("qualidade").value;
 const primeiraPessoa=document.getElementById("primeiraPessoa").checked;

 const id=Date.now().toString();
 let historia={id,titulo,enredo,nucleos,genero,qualidade,primeiraPessoa,status:"criando",texto:""};
 salvarHistoria(historia);

 document.getElementById("tituloDisplay").innerText=titulo;
 show("telaHistoria");

 document.getElementById("carregamento").classList.remove("hidden");

 const modelName=MODELOS[qualidade];

 try{
   generator=await initModel(modelName);
   setStatus("modelo carregado: "+modelName);
 }catch(e){
   console.error(e);
   setStatus("erro ao carregar modelo");
   historia.status="erro"; salvarHistoria(historia);
   locked=false;
   return;
 }

 document.getElementById("carregamento").classList.add("hidden");
 setStatus("gerando 50%…");

 const prompt=`Crie o início do Capítulo 1 (50%)...
Enredo: ${enredo}
Núcleos: ${nucleos}
Gênero: ${genero}
${primeiraPessoa?"Narrar em primeira pessoa.":""}
Liste 3 opções numeradas ao final.`;

 const out=await generator.chat.completions.create({
   messages:[{role:"user",content:prompt}]
 });

 let texto=out.choices[0].message.content;
 document.getElementById("texto").innerHTML=texto;
 historia.texto=texto;
 historia.status="capítulo 1 - 50%";
 salvarHistoria(historia);

 const opcoes=texto.split("\n").filter(l=>l.trim().match(/^\d\./));
 if(opcoes.length>=3){
   const e=document.getElementById("escolhas");
   e.classList.remove("hidden");
   document.querySelector('[data-n="1"]').innerText=opcoes[0];
   document.querySelector('[data-n="2"]').innerText=opcoes[1];
   document.querySelector('[data-n="3"]').innerText=opcoes[2];
 }

 locked=false;
};
