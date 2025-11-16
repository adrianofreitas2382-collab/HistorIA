let locked=false;function show(id){document.querySelectorAll('.tela').forEach(t=>t.classList.add('hidden'));document.getElementById(id).classList.remove('hidden');}
document.getElementById('menuCriar').onclick=()=>show('telaCriacao');
document.getElementById('menuTutorial').onclick=()=>show('telaTutorial');
document.getElementById('menuControles').onclick=()=>show('telaControles');

document.getElementById('btnIniciar').onclick=()=>{
 if(locked)return;
 locked=true;
 document.getElementById('enredo').disabled=true;
 document.getElementById('nucleos').disabled=true;
 document.getElementById('genero').disabled=true;
 document.getElementById('qualidade').disabled=true;
 document.getElementById('primeiraPessoa').disabled=true;
 show('telaHistoria');
 document.getElementById('texto').innerHTML="Capítulo 1 - Início gerado... (modelo placeholder)";
 document.getElementById('escolhas').classList.remove('hidden');
 document.querySelector('[data-n="1"]').innerText="Opção 1";
 document.querySelector('[data-n="2"]').innerText="Opção 2";
 document.querySelector('[data-n="3"]').innerText="Opção 3";
};

document.querySelectorAll('.opcao').forEach(btn=>{
 btn.onclick=()=>{ if(btn.classList.contains('chosen'))return; document.querySelectorAll('.opcao').forEach(b=>b.disabled=true); btn.classList.add('chosen'); document.getElementById('texto').innerHTML+="<br><br>Continuação gerada...";}
});
