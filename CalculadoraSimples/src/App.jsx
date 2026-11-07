import React, { useState } from "react";

export default function App() {
  const [primeiroNumero, setPrimeiroNumero] = useState("");
  const [segundoNumero, setSegundoNumero] = useState("");
  const [operacao, setOperacao] = useState("+");
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");
  const [historico, setHistorico] = useState([]);

  function calcular(event) {
    event.preventDefault();
    setErro("");
    setResultado(null);

    const a = Number(primeiroNumero);
    const b = Number(segundoNumero);

    if (primeiroNumero.trim() === "" || segundoNumero.trim() === "") {
      setErro("Preencha os dois números.");
      return;
    }
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      setErro("Digite valores numéricos válidos.");
      return;
    }
    if (operacao === "/" && b === 0) {
      setErro("Não é possível dividir por zero.");
      return;
    }

    let valor;
    switch (operacao) {
      case "+": valor = a + b; break;
      case "-": valor = a - b; break;
      case "*": valor = a * b; break;
      case "/": valor = a / b; break;
      default:
        setErro("Selecione uma operação válida.");
        return;
    }

    setResultado(valor);
    setHistorico((atual) => [
      { id: Date.now(), expressao: `${a} ${operacao} ${b}`, resultado: valor },
      ...atual,
    ].slice(0, 6));
  }

  function limpar() {
    setPrimeiroNumero("");
    setSegundoNumero("");
    setOperacao("+");
    setResultado(null);
    setErro("");
  }

  return (
    <main className="page">
      <section className="calculator">
        <div className="eyebrow">FERRAMENTA DE CÁLCULO</div>
        <h1>Calculadora</h1>
        <p className="subtitle">Faça operações matemáticas de forma simples.</p>

        <form onSubmit={calcular}>
          <label htmlFor="numero1">Primeiro número</label>
          <input
            id="numero1"
            type="number"
            step="any"
            value={primeiroNumero}
            onChange={(e) => setPrimeiroNumero(e.target.value)}
            placeholder="Ex.: 10"
          />

          <label htmlFor="operacao">Operação</label>
          <select
            id="operacao"
            value={operacao}
            onChange={(e) => setOperacao(e.target.value)}
          >
            <option value="+">Adição (+)</option>
            <option value="-">Subtração (−)</option>
            <option value="*">Multiplicação (×)</option>
            <option value="/">Divisão (÷)</option>
          </select>

          <label htmlFor="numero2">Segundo número</label>
          <input
            id="numero2"
            type="number"
            step="any"
            value={segundoNumero}
            onChange={(e) => setSegundoNumero(e.target.value)}
            placeholder="Ex.: 5"
          />

          <div className="actions">
            <button className="primary" type="submit">Calcular</button>
            <button className="secondary" type="button" onClick={limpar}>Limpar</button>
          </div>
        </form>

        {erro && <div className="message error" role="alert">{erro}</div>}
        {resultado !== null && (
          <div className="result" aria-live="polite">
            <span>Resultado</span>
            <strong>{Number(resultado.toFixed(8)).toLocaleString("pt-BR")}</strong>
          </div>
        )}

        <section className="history">
          <div className="history-heading">
            <h2>Histórico</h2>
            <button
              type="button"
              className="clear-history"
              onClick={() => setHistorico([])}
              disabled={historico.length === 0}
            >
              Limpar histórico
            </button>
          </div>
          {historico.length === 0 ? (
            <p className="empty">As operações realizadas aparecerão aqui.</p>
          ) : (
            <ul>
              {historico.map((item) => (
                <li key={item.id}>
                  <span>{item.expressao}</span>
                  <strong>{Number(item.resultado.toFixed(8)).toLocaleString("pt-BR")}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
      <footer>Calculadora desenvolvida com React e Webpack.</footer>
    </main>
  );
}
