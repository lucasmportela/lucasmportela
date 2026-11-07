const {useEffect,useState} = React;
const API = "/api";
function App(){
  const [baterias,setBaterias] = useState([]);
  const [form,setForm] = useState({identificacao:"",capacidade_maxima:"",carga_atual:"0"});
  const [quantidades,setQuantidades] = useState({});
  const [aviso,setAviso] = useState(null);
  const [carregando,setCarregando] = useState(true);

  async function atualizar(){
    try{
      const resposta = await fetch(`${API}/baterias`);
      if(!resposta.ok) throw new Error("Não foi possível consultar o backend.");
      setBaterias(await resposta.json());
    }catch(e){setAviso({tipo:"error",texto:e.message});}
    finally{setCarregando(false);}
  }
  useEffect(()=>{atualizar();},[]);

  async function criar(e){
    e.preventDefault();
    try{
      const resposta = await fetch(`${API}/baterias`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,capacidade_maxima:Number(form.capacidade_maxima),carga_atual:Number(form.carga_atual)})});
      const dados = await resposta.json();
      if(!resposta.ok) throw new Error(dados.erro || "Erro ao cadastrar.");
      setForm({identificacao:"",capacidade_maxima:"",carga_atual:"0"});
      setAviso({tipo:"success",texto:"Bateria cadastrada com sucesso."});
      atualizar();
    }catch(e){setAviso({tipo:"error",texto:e.message});}
  }

  async function operar(bateria,operacao){
    const mah = Number(quantidades[bateria.id] || 0);
    try{
      const resposta = await fetch(`${API}/baterias/${bateria.id}/${operacao}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mah})});
      const dados = await resposta.json();
      if(!resposta.ok) throw new Error(dados.mensagem || dados.erro || "Operação rejeitada.");
      setAviso({tipo:"success",texto:dados.mensagem});
      atualizar();
    }catch(e){setAviso({tipo:"error",texto:e.message});}
  }

  async function excluir(id){
    if(!confirm("Deseja remover esta bateria?")) return;
    const resposta = await fetch(`${API}/baterias/${id}`,{method:"DELETE"});
    const dados = await resposta.json();
    setAviso({tipo:"success",texto:dados.mensagem || dados.erro});
    atualizar();
  }

  const alertas = baterias.filter(b=>b.alerta_bateria_fraca).length;
  const media = baterias.length ? baterias.reduce((s,b)=>s+b.porcentagem_carga,0)/baterias.length : 0;

  return <main className="shell">
    <header><div className="brand"><div className="logo">ϟ</div><div><h1>VoltWatch</h1><p>Industrial battery control</p></div></div><div className="live"><span className="dot"></span> SISTEMA ONLINE</div></header>
    <section className="hero"><div className="eyebrow">Painel de controle / energia</div><h2>Monitoramento de baterias</h2><p>Acompanhe os níveis de carga e gerencie a energia dos seus equipamentos.</p></section>
    <section className="stats">
      <div className="stat"><span>Baterias cadastradas</span><strong>{baterias.length}</strong></div>
      <div className="stat"><span>Média de carga</span><strong>{media.toFixed(1)}%</strong></div>
      <div className="stat"><span>Alertas de carga baixa</span><strong>{alertas}</strong></div>
    </section>
    {aviso && <div className={`notice ${aviso.tipo==="error"?"error":""}`}>{aviso.texto}</div>}
    <section className="content">
      <div className="panel"><div className="panel-head"><h3>Baterias monitoradas</h3><span className="muted">{baterias.length} unidade(s)</span></div>
        {carregando ? <div className="empty">Carregando dados...</div> : baterias.length===0 ? <div className="empty">Nenhuma bateria cadastrada. Adicione uma ao lado para começar.</div> :
        <div className="cards">{baterias.map(b=><article className="battery-card" key={b.id}>
          <div className="card-top"><span className="battery-name">{b.identificacao}</span><span className={`chip ${b.alerta_bateria_fraca?"warning":""}`}>{b.alerta_bateria_fraca?"Carga baixa":"Normal"}</span></div>
          <div className="charge">{b.porcentagem_carga.toFixed(1)}<small>% carregada</small></div>
          <div className="track"><div className={`fill ${b.alerta_bateria_fraca?"warning":""}`} style={{width:`${b.porcentagem_carga}%`}}></div></div>
          <div className="details"><span>{b.carga_atual.toLocaleString("pt-BR")} mAh</span><span>Cap. {b.capacidade_maxima.toLocaleString("pt-BR")} mAh</span></div>
          <input type="number" min="1" placeholder="Quantidade em mAh" value={quantidades[b.id]||""} onChange={e=>setQuantidades({...quantidades,[b.id]:e.target.value})}/>
          <div className="actions"><button onClick={()=>operar(b,"carregar")}>＋ Carregar</button><button onClick={()=>operar(b,"descarregar")}>－ Descarregar</button><button className="remove" title="Remover" onClick={()=>excluir(b.id)}>×</button></div>
        </article>)}</div>}
      </div>
      <aside className="panel"><h3>Cadastrar bateria</h3><p className="muted">Adicione uma nova unidade ao monitoramento.</p>
        <form onSubmit={criar}>
          <label>Identificação<input required placeholder="Ex.: Bateria-A" value={form.identificacao} onChange={e=>setForm({...form,identificacao:e.target.value})}/></label>
          <label>Capacidade máxima (mAh)<input required type="number" min="1" placeholder="Ex.: 5000" value={form.capacidade_maxima} onChange={e=>setForm({...form,capacidade_maxima:e.target.value})}/></label>
          <label>Carga inicial (mAh)<input required type="number" min="0" placeholder="Ex.: 2000" value={form.carga_atual} onChange={e=>setForm({...form,carga_atual:e.target.value})}/></label>
          <button className="primary" type="submit">＋ Adicionar bateria</button>
        </form>
      </aside>
    </section>
    <footer>VoltWatch · Sistema demonstrativo de monitoramento de baterias · Python + Flask + React</footer>
  </main>;
}
ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
