let locked=false;
function show(id){
 document.querySelectorAll('.tela').forEach(t=>t.classList.add('hidden'));
 document.getElementById(id).classList.remove('hidden');
}
document.getElementById('menuCriar').onclick=()=>show('telaCriacao');
document.getElementById('menuTutorial').onclick=()=>show('telaTutorial');
document.getElementById('menuControles').onclick=()=>show('telaControles');

document.getElementById('btnIniciar').onclick=()=>{
 if(locked)return;
 locked=true;

 const titulo=document.getElementById('titulo').value.trim();
 document.getElementById('tituloDisplay').innerText=titulo;

 ['titulo','enredo','nucleos','genero','qualidade','primeiraPessoa']
 .forEach(id=>document.getElementById(id).disabled=true);

 show('telaHistoria');
 document.getElementById('texto').innerHTML="Capítulo 1 - Início criado com sucesso.<br><br>Escolha como continuar.";
 document.getElementById('escolhas').classList.remove('hidden');
 document.querySelector('[data-n="1"]').innerText="Caminho 1";
 document.querySelector('[data-n="2"]').innerText="Caminho 2";
 document.querySelector('[data-n="3"]').innerText="Caminho 3";
};

document.querySelectorAll('.opcao').forEach(btn=>{
 btn.onclick=()=>{ if(btn.classList.contains('chosen'))return;
 document.querySelectorAll('.opcao').forEach(b=>b.disabled=true);
 btn.classList.add('chosen');
 document.getElementById('texto').innerHTML+="<br><br>Continuação aplicada.";
 };
});
