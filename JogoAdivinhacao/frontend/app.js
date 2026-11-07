const form=document.querySelector("#form"), input=document.querySelector("#guess");
const send=document.querySelector("#send"), start=document.querySelector("#start");
const feedback=document.querySelector("#feedback");
let active=false;

function message(text,type=""){feedback.textContent=text;feedback.className=`feedback ${type}`;}
function update(data){
 document.querySelector("#round").textContent=`${data.rodada} / 3`;
 document.querySelector("#score").textContent=data.pontos_totais;
 document.querySelector("#attempts").textContent=data.tentativas_restantes;
}
function enable(value){input.disabled=!value;send.disabled=!value;if(value)input.focus();}
async function post(url,body={}){
 const response=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
 const data=await response.json();if(!response.ok)throw new Error(data.erro||"Erro na comunicação com o servidor.");return data;
}
async function begin(){
 try{
  const data=await post("/api/jogo/iniciar");active=true;update(data);enable(true);
  start.hidden=true;document.querySelector("#final").hidden=true;
  document.querySelector("#status").textContent="PARTIDA EM ANDAMENTO";
  message(data.mensagem,"success");
 }catch(error){message(error.message,"error");}
}
form.addEventListener("submit",async event=>{
 event.preventDefault();if(!active)return;
 const palpite=Number(input.value);
 if(!Number.isInteger(palpite)||palpite<1||palpite>50){message("Digite um número inteiro entre 1 e 50.","error");return;}
 send.disabled=true;
 try{
  const data=await post("/api/jogo/palpite",{palpite});update(data);input.value="";
  if(data.jogo_finalizado){
   active=false;enable(false);document.querySelector("#status").textContent="PARTIDA FINALIZADA";
   document.querySelector("#classification").textContent=data.classificacao;
   document.querySelector("#final-score").textContent=`${data.pontos_totais} pontos`;
   document.querySelector("#final-message").textContent=data.mensagem;
   document.querySelector("#final").hidden=false;message(data.mensagem,"success");
   document.querySelector("#final").scrollIntoView({behavior:"smooth"});return;
  }
  if(data.rodada_encerrada)message(data.mensagem+" A próxima rodada começou.",data.acertou?"success":"warning");
  else message(data.mensagem+` Restam ${data.tentativas_restantes} tentativa(s).`,data.acertou?"success":"warning");
 }catch(error){message(error.message,"error");}
 finally{if(active)send.disabled=false;}
});
start.addEventListener("click",begin);
document.querySelector("#restart").addEventListener("click",begin);
