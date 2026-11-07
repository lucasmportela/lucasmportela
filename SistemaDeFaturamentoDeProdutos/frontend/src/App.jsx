import React, { useEffect, useMemo, useState } from "react";

const API = "/api";
const dinheiro = (valor) => Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function App() {
  const [produtos, setProdutos] = useState([]);
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [quantidade, setQuantidade] = useState("0");
  const [busca, setBusca] = useState("");
  const [aviso, setAviso] = useState(null);
  const [carregando, setCarregando] = useState(true);

  async function api(caminho, metodo = "GET", corpo) {
    const config = { method: metodo, headers: { "Content-Type": "application/json" } };
    if (corpo !== undefined) config.body = JSON.stringify(corpo);
    const resposta = await fetch(`${API}${caminho}`, config);
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.erro || "Não foi possível concluir a operação.");
    return dados;
  }

  async function carregar() {
    try {
      const dados = await api("/produtos");
      setProdutos(dados.produtos);
    } catch (e) {
      setAviso({ tipo: "erro", texto: `${e.message} Verifique se o backend está em execução.` });
    } finally { setCarregando(false); }
  }
  useEffect(() => { carregar(); }, []);

  async function cadastrar(e) {
    e.preventDefault();
    try {
      await api("/produtos", "POST", { nome, preco: Number(preco), quantidade: Number(quantidade) });
      setNome(""); setPreco(""); setQuantidade("0");
      setAviso({ tipo: "sucesso", texto: "Produto cadastrado com sucesso!" });
      await carregar();
    } catch (err) { setAviso({ tipo: "erro", texto: err.message }); }
  }

  async function movimentar(produto, acao) {
    const texto = window.prompt(acao === "adicionar" ? `Quantidade para adicionar a ${produto.nome}:` : `Quantidade para retirar de ${produto.nome}:`);
    if (texto === null) return;
    const qtd = Number(texto);
    if (!Number.isInteger(qtd) || qtd <= 0) {
      setAviso({ tipo: "erro", texto: "Informe uma quantidade inteira maior que zero." }); return;
    }
    try {
      await api(`/produtos/${produto.id}/estoque/${acao}`, "POST", { quantidade: qtd });
      setAviso({ tipo: "sucesso", texto: acao === "adicionar" ? "Entrada de estoque registrada." : "Saída de estoque registrada." });
      await carregar();
    } catch (err) { setAviso({ tipo: "erro", texto: err.message }); }
  }

  async function excluir(produto) {
    if (!window.confirm(`Excluir o produto ${produto.nome}?`)) return;
    try {
      await api(`/produtos/${produto.id}`, "DELETE");
      setAviso({ tipo: "sucesso", texto: "Produto excluído." });
      await carregar();
    } catch (err) { setAviso({ tipo: "erro", texto: err.message }); }
  }

  const filtrados = useMemo(() => produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase())), [produtos, busca]);
  const total = produtos.reduce((s, p) => s + p.valor_total_estoque, 0);
  const unidades = produtos.reduce((s, p) => s + p.quantidade, 0);

  return <main className="container">
    <header className="header">
      <div className="logo">FC</div>
      <div><span className="eyebrow">GESTÃO COMERCIAL</span><h1>Faturamento & Estoque</h1></div>
      <span className="online"><i /> API integrada</span>
    </header>

    <section className="intro">
      <span className="eyebrow">PAINEL DE CONTROLE</span>
      <h2>Seus produtos em um só lugar</h2>
      <p>Gerencie cadastros, movimentações e o valor total do estoque.</p>
    </section>

    <section className="summary">
      <article className="metric"><span>Produtos cadastrados</span><strong>{produtos.length}</strong><small>Itens no catálogo</small></article>
      <article className="metric"><span>Unidades em estoque</span><strong>{unidades}</strong><small>Quantidade total</small></article>
      <article className="metric featured"><span>Valor total do estoque</span><strong>{dinheiro(total)}</strong><small>Preço unitário × quantidade</small></article>
    </section>

    <section className="layout">
      <article className="card cadastro">
        <div className="card-title"><div><span className="eyebrow">NOVO CADASTRO</span><h3>Adicionar produto</h3></div><b>＋</b></div>
        <form onSubmit={cadastrar}>
          <label htmlFor="nome">Nome do produto</label>
          <input id="nome" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex.: Notebook" required maxLength="100" />
          <label htmlFor="preco">Preço unitário (R$)</label>
          <input id="preco" type="number" min="0.01" step="0.01" value={preco} onChange={e => setPreco(e.target.value)} placeholder="3500.00" required />
          <label htmlFor="quantidade">Quantidade inicial</label>
          <input id="quantidade" type="number" min="0" step="1" value={quantidade} onChange={e => setQuantidade(e.target.value)} required />
          <button className="primary" type="submit">Cadastrar produto</button>
          <p className="hint">Preço maior que zero. Quantidade inteira e não negativa.</p>
        </form>
      </article>

      <article className="card catalogo">
        <div className="card-title"><div><span className="eyebrow">CATÁLOGO</span><h3>Produtos cadastrados</h3></div><span className="pill">{produtos.length} produtos</span></div>
        <input className="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar produto pelo nome..." aria-label="Buscar produto" />
        {aviso && <div className={`alerta ${aviso.tipo}`} role="status">{aviso.texto}<button onClick={() => setAviso(null)}>×</button></div>}
        {carregando ? <p className="empty">Carregando...</p> : filtrados.length === 0 ? <p className="empty">{busca ? "Nenhum resultado encontrado." : "Nenhum produto cadastrado."}</p> :
          <div className="table-wrap"><table><thead><tr><th>Produto</th><th>Preço</th><th>Estoque</th><th>Valor em estoque</th><th>Ações</th></tr></thead>
          <tbody>{filtrados.map(p => <tr key={p.id}>
            <td className="product">{p.nome}</td><td>{dinheiro(p.preco)}</td>
            <td><span className={`quantity ${p.quantidade === 0 ? "zero" : ""}`}>{p.quantidade} un.</span></td>
            <td className="value">{dinheiro(p.valor_total_estoque)}</td>
            <td><div className="actions">
              <button className="add" title="Adicionar estoque" onClick={() => movimentar(p, "adicionar")}>＋</button>
              <button className="remove" title="Remover estoque" onClick={() => movimentar(p, "remover")}>−</button>
              <button className="delete" title="Excluir produto" onClick={() => excluir(p)}>×</button>
            </div></td>
          </tr>)}</tbody></table></div>}
        <p className="hint">＋ entrada de estoque · − saída de estoque · × excluir produto</p>
      </article>
    </section>
    <footer>Projeto de estudo • Python + Flask • React + Webpack</footer>
  </main>;
}
