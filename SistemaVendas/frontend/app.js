const money = value => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const productForm = document.querySelector("#product-form");
const productValue = document.querySelector("#product-value");
const productList = document.querySelector("#product-list");
const closeButton = document.querySelector("#close-button");
const finalizeButton = document.querySelector("#finalize-button");
const checkoutForm = document.querySelector("#checkout-form");
const feedback = document.querySelector("#feedback");
let currentState = null;

function notify(text, type = "") {
  feedback.textContent = text;
  feedback.className = `feedback ${type}`;
}

async function api(path, body = {}) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Não foi possível concluir a operação.");
  return data;
}

async function refresh() {
  const response = await fetch("/api/status");
  currentState = await response.json();
  render();
}

function render() {
  const state = currentState;
  document.querySelector("#revenue").textContent = money(state.faturamento_total);
  document.querySelector("#item-count").textContent = state.itens.length;
  document.querySelector("#subtotal").textContent = money(state.subtotal);
  document.querySelector("#checkout-subtotal").textContent = money(state.resumo_venda?.subtotal ?? state.subtotal);
  document.querySelector("#discount").textContent = `− ${money(state.resumo_venda?.desconto ?? state.desconto)}`;
  document.querySelector("#total").textContent = money(state.resumo_venda?.total ?? state.total);
  document.querySelector("#list-total").textContent = `${state.itens.length} ITEM(NS)`;
  document.querySelector("#sale-status").textContent = state.venda_fechada ? "VENDA FECHADA" : "VENDA ABERTA";

  if (state.itens.length) {
    productList.innerHTML = state.itens.map(item =>
      `<div class="product-row"><span>Produto ${item.numero}</span><b>${money(item.valor)}</b></div>`
    ).join("");
  } else {
    productList.innerHTML = '<div class="empty">Nenhum produto adicionado ainda.</div>';
  }

  const open = !state.venda_fechada;
  productValue.disabled = !open;
  document.querySelector("#add-button").disabled = !open;
  closeButton.disabled = !open || state.itens.length === 0;
  document.querySelector("#installments").disabled = !open;
  finalizeButton.disabled = open;

  const installmentBox = document.querySelector("#installment-result");
  if (state.venda_fechada && state.resumo_venda) {
    const resumo = state.resumo_venda;
    installmentBox.hidden = false;
    installmentBox.innerHTML = `<b>Plano de pagamento · ${resumo.parcelas}x</b>` +
      Array.from({ length: resumo.parcelas }, (_, index) =>
        `<div class="installment-line"><span>${index + 1}ª parcela</span><strong>${money(resumo.valor_parcela)}</strong></div>`
      ).join("");
  } else {
    installmentBox.hidden = true;
    installmentBox.innerHTML = "";
  }
}

productForm.addEventListener("submit", async event => {
  event.preventDefault();
  try {
    const value = Number(productValue.value);
    const data = await api("/api/produtos", { valor: value });
    productValue.value = "";
    notify(data.message, "success");
    await refresh();
    productValue.focus();
  } catch (error) { notify(error.message, "error"); }
});

checkoutForm.addEventListener("submit", async event => {
  event.preventDefault();
  try {
    const data = await api("/api/fechar-venda", {
      parcelas: Number(document.querySelector("#installments").value)
    });
    notify(data.message, "success");
    await refresh();
  } catch (error) { notify(error.message, "error"); }
});

finalizeButton.addEventListener("click", async () => {
  try {
    const data = await api("/api/finalizar-venda");
    notify(`${data.message} Faturamento acumulado: ${money(data.faturamento_total)}.`, "success");
    await refresh();
  } catch (error) { notify(error.message, "error"); }
});

document.querySelector("#cancel-button").addEventListener("click", async () => {
  try {
    const data = await api("/api/cancelar-venda");
    notify(data.message, "success");
    await refresh();
  } catch (error) { notify(error.message, "error"); }
});

refresh().catch(error => notify(error.message, "error"));
