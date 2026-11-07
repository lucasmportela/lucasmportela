const form = document.querySelector("#vehicle-form");
const feedback = document.querySelector("#feedback");
const submitButton = document.querySelector("#submit-button");

let vehicleCount = 0;
let totalKm = 0;
let sumConsumptions = 0;
let shiftClosed = false;

const format = (value, digits = 2) =>
  Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });

function notify(message, type = "") {
  feedback.textContent = message;
  feedback.className = `feedback ${type}`;
}

function updateMetrics() {
  document.querySelector("#vehicle-count").textContent = vehicleCount;
  document.querySelector("#km-total").textContent = `${format(totalKm, 1)} km`;
  const average = vehicleCount ? sumConsumptions / vehicleCount : 0;
  document.querySelector("#average").textContent = `${format(average)} km/l`;
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (shiftClosed) return;

  const km = Number(document.querySelector("#km").value);
  const litros = Number(document.querySelector("#litros").value);

  if (!Number.isFinite(km) || km <= 0) {
    notify("A distância deve ser maior que zero. Para encerrar, utilize o botão Encerrar turno.", "error");
    return;
  }
  if (!Number.isFinite(litros) || litros <= 0) {
    notify("Informe uma quantidade de combustível estritamente maior que zero.", "error");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Processando...";
  try {
    const response = await fetch("/api/auditoria/processar", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({km, litros})
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.erro || "Falha ao processar o veículo.");

    vehicleCount += 1;
    totalKm += data.km;
    sumConsumptions += data.consumo;
    updateMetrics();

    document.querySelector("#empty-result").hidden = true;
    document.querySelector("#vehicle-result").hidden = false;
    document.querySelector("#result-consumption").innerHTML = `${format(data.consumo)} <small>km/l</small>`;
    document.querySelector("#classification").textContent = data.classificacao;
    document.querySelector("#classification").className = `classification ${data.nivel}`;
    document.querySelector("#result-km").textContent = `${format(data.km, 1)} km`;
    document.querySelector("#result-litros").textContent = `${format(data.litros)} L`;

    form.reset();
    document.querySelector("#km").focus();
    notify(`Veículo auditado: ${data.classificacao}. Consumo médio de ${format(data.consumo)} km/l.`, "success");
  } catch (error) {
    notify(error.message === "Failed to fetch"
      ? "Não foi possível conectar ao backend. Inicie o Flask e acesse http://127.0.0.1:5000."
      : error.message, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Calcular consumo <span>→</span>';
  }
});

async function closeShift() {
  if (shiftClosed) return;
  try {
    const response = await fetch("/api/auditoria/resumo", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        quantidade: vehicleCount,
        km_total: totalKm,
        soma_consumos: sumConsumptions
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.erro || "Não foi possível fechar o turno.");

    shiftClosed = true;
    document.querySelector("#final-count").textContent = data.quantidade_veiculos;
    document.querySelector("#final-km").textContent = `${format(data.km_total, 1)} km`;
    document.querySelector("#final-average").textContent = `${format(data.media_geral)} km/l`;
    document.querySelector("#closing").hidden = false;
    form.querySelectorAll("input, button").forEach(element => element.disabled = true);
    document.querySelector("#finish-button").disabled = true;
    notify("Turno encerrado. Resumo final da frota disponível abaixo.", "success");
    document.querySelector("#closing").scrollIntoView({behavior: "smooth", block: "start"});
  } catch (error) {
    notify(error.message, "error");
  }
}

document.querySelector("#finish-button").addEventListener("click", closeShift);

document.querySelector("#new-shift").addEventListener("click", () => {
  vehicleCount = 0;
  totalKm = 0;
  sumConsumptions = 0;
  shiftClosed = false;
  form.reset();
  form.querySelectorAll("input, button").forEach(element => element.disabled = false);
  document.querySelector("#finish-button").disabled = false;
  document.querySelector("#closing").hidden = true;
  document.querySelector("#vehicle-result").hidden = true;
  document.querySelector("#empty-result").hidden = false;
  updateMetrics();
  notify("Novo turno iniciado. Registre o primeiro veículo.");
  document.querySelector("#km").focus();
});
