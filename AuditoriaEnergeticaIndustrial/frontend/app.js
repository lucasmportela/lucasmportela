const form = document.querySelector("#audit-form");
const feedback = document.querySelector("#feedback");
const results = document.querySelector("#results");
const submitButton = document.querySelector("#submit-button");

function notify(text, type = "") {
  feedback.textContent = text;
  feedback.className = `feedback ${type}`;
}
function kwh(value) {
  return `${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kWh`;
}
function moneyNumber(value) {
  return Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const maquinas = [];
  for (let i = 0; i < 5; i++) {
    maquinas.push({
      codigo: document.querySelector(`[name="codigo-${i}"]`).value,
      consumo: document.querySelector(`[name="consumo-${i}"]`).value
    });
  }
  const teto = document.querySelector("#teto").value;
  submitButton.disabled = true;
  submitButton.textContent = "Analisando dados...";

  try {
    const response = await fetch("/api/auditoria", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maquinas, teto })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Não foi possível executar a auditoria.");

    document.querySelector("#overall-status").textContent = data.message;
    document.querySelector("#overall-status").classList.toggle("alert", !data.dentro_dos_parametros);
    document.querySelector("#max-value").textContent = kwh(data.maior_consumo.consumo);
    document.querySelector("#max-code").textContent = `Código ${data.maior_consumo.codigo}`;
    document.querySelector("#average-value").textContent = kwh(data.media);
    document.querySelector("#exceeded-count").textContent = data.ultrapassaram.length;

    const exceededList = document.querySelector("#exceeded-list");
    exceededList.innerHTML = data.ultrapassaram.length
      ? data.ultrapassaram.map(item => `<div class="alert-row"><span>Máquina código ${item.codigo}</span><b>${kwh(item.consumo)}</b></div>`).join("")
      : '<p class="no-alert">✓ Operação Dentro dos Parâmetros de Eficiência</p>';

    document.querySelector("#machine-results").innerHTML = data.maquinas.map((item, index) => {
      const exceeded = item.consumo > data.teto;
      return `<tr><td>Máquina ${String(index + 1).padStart(2, "0")}</td><td>${item.codigo}</td><td>${kwh(item.consumo)}</td><td class="${exceeded ? "warn" : "ok"}">${exceeded ? "Acima do teto" : "Dentro do limite"}</td></tr>`;
    }).join("");

    results.hidden = false;
    notify("Auditoria concluída. Confira o relatório abaixo.", "success");
    results.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    notify(error.message === "Failed to fetch" ? "Não foi possível conectar ao backend. Inicie o servidor Flask e acesse pelo endereço http://127.0.0.1:5000." : error.message, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Executar auditoria <span>→</span>';
  }
});

form.addEventListener("reset", () => {
  results.hidden = true;
  notify("Preencha os dados das cinco máquinas para iniciar a auditoria.");
});
