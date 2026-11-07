const form = document.querySelector("#stock-form");
const feedback = document.querySelector("#feedback");
const report = document.querySelector("#report");
const analyzeButton = document.querySelector("#analyze");

function notify(message, type = "") {
  feedback.textContent = message;
  feedback.className = `feedback ${type}`;
}
function quantity(value) {
  return Number(value).toLocaleString("pt-BR");
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const produtos = [];
  for (let i = 0; i < 6; i++) {
    produtos.push({
      codigo: document.querySelector(`[name="codigo-${i}"]`).value,
      saldo: document.querySelector(`[name="saldo-${i}"]`).value
    });
  }

  analyzeButton.disabled = true;
  analyzeButton.textContent = "Analisando estoque...";
  try {
    const response = await fetch("/api/estoque/analisar", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        produtos,
        estoque_minimo: document.querySelector("#minimum").value
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.erro || "Não foi possível analisar o estoque.");

    const status = document.querySelector("#status");
    status.textContent = data.mensagem;
    status.classList.toggle("warning", !data.normal);
    document.querySelector("#lowest").textContent = quantity(data.menor.saldo);
    document.querySelector("#lowest-code").textContent = `Código ${data.menor.codigo}`;
    document.querySelector("#highest").textContent = quantity(data.maior.saldo);
    document.querySelector("#highest-code").textContent = `Código ${data.maior.codigo}`;
    document.querySelector("#low-count").textContent = data.abaixo_minimo.length;

    document.querySelector("#alerts").innerHTML = data.abaixo_minimo.length
      ? data.abaixo_minimo.map(item => `<div class="alert-row"><span>Produto código ${item.codigo}</span><b>${quantity(item.saldo)} un.</b></div>`).join("")
      : '<p class="all-clear">✓ Nenhum produto abaixo do estoque mínimo de segurança.</p>';

    document.querySelector("#inventory").innerHTML = data.produtos.map((item, index) => {
      const abaixo = item.saldo < data.estoque_minimo;
      return `<tr><td>Produto ${String(index + 1).padStart(2, "0")}</td><td>${item.codigo}</td><td>${quantity(item.saldo)}</td><td class="${abaixo ? "low" : "normal"}">${abaixo ? "Repor estoque" : "Parâmetros normais"}</td></tr>`;
    }).join("");

    report.hidden = false;
    notify("Análise concluída. Consulte o diagnóstico do almoxarifado abaixo.", "success");
    report.scrollIntoView({behavior: "smooth", block: "start"});
  } catch (error) {
    notify(error.message === "Failed to fetch"
      ? "Não foi possível conectar ao backend. Inicie o Flask e acesse http://127.0.0.1:5000."
      : error.message, "error");
  } finally {
    analyzeButton.disabled = false;
    analyzeButton.innerHTML = 'Analisar estoque <span>→</span>';
  }
});

form.addEventListener("reset", () => {
  report.hidden = true;
  notify("Preencha os seis produtos e informe o estoque mínimo para executar a análise.");
});
