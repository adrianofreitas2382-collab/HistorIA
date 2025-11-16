let locked=false;
let generator=null;

function modelo(qualidade){
 if(qualidade==="alta") return "Llama-3.1-8B-Instruct-q4f16_1";
 if(qualidade==="baixa") return "Phi-3-mini-4k-instruct-q4f16_1";
 return "Qwen2.5-7B-Instruct-q4f16_1";
}

async function initModel(name){
 const engine = await webllm.CreateMLCEngine({model:name});
 return engine;
}

function show(id){
 document.querySelectorAll('.tela').forEach(t=>t.classList.add('hidden'));
 document.getElementById(id).classList.remove('hidden');
}

document.getElementById('menuCriar').onclick=()=>show('telaCriacao');
document.getElementById('menuTutorial').onclick=()=>show('telaTutorial');
document.getElementById('menuControles').onclick=()=>show('telaControles');

document.getElementById('btnIniciar').onclick=async ()=>{
 if(locked)return;
 locked=true;

 const titulo=document.getElementById('titulo').value.trim();
 const enredo=document.getElementById('enredo').value.trim();
 const nucleos=document.getElementById('nucleos').value.trim();
 const genero=document.getElementById('genero').value;
 const qualidade=document.getElementById('qualidade').value;
 const primeiraPessoa=document.getElementById('primeiraPessoa').checked;

 ['titulo','enredo','nucleos','genero','qualidade','primeiraPessoa']
 .forEach(id=>document.getElementById(id).disabled=true);

 show('telaHistoria');
 document.getElementById('tituloDisplay').innerText=titulo;
 document.getElementById('texto').innerHTML="Carregando modelo...";

 const m = modelo(qualidade);
 generator = await initModel(m);

 const prompt = `Crie o início do Capítulo 1 (50%) baseado no enredo: ${enredo}. Núcleos: ${nucleos}. Gênero: ${genero}. ${primeiraPessoa?"Narrar em primeira pessoa.":""} Inclua ao final 3 opções numeradas.`;

 const out = await generator.chat.completions.create({
   messages:[{role:"user", content:prompt}]
 });

 const text = out.choices[0].message.content;
 document.getElementById('texto').innerHTML=text;

 const opcoes = text.split("\n").filter(l=>l.trim().match(/^\d\./));
 if(opcoes.length>=3){
   document.getElementById('escolhas').classList.remove('hidden');
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

  const escolha = btn.innerText;
  const textoArea=document.getElementById('texto');
  textoArea.innerHTML+="<br><br>Gerando continuação...";

  const out = await generator.chat.completions.create({
    messages:[{role:"user", content:`Continue o capítulo a partir da escolha: ${escolha}. Gere até 90%. Depois liste 3 novas opções.`}]
  });

  const text = out.choices[0].message.content;
  textoArea.innerHTML=text;
 };
});
