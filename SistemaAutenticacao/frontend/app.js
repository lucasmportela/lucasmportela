const setupForm = document.querySelector("#setup-form");
const loginForm = document.querySelector("#login-form");
const setupSection = document.querySelector("#setup-section");
const loginSection = document.querySelector("#login-section");
const newPassword = document.querySelector("#new-password");
const password = document.querySelector("#password");
const loginButton = document.querySelector("#login-button");
const attemptsLabel = document.querySelector("#attempts");
const feedback = document.querySelector("#feedback");
const boot = document.querySelector("#boot");
const resetButton = document.querySelector("#reset-button");

function message(text, type = "") {
  feedback.textContent = text;
  feedback.className = `feedback ${type}`;
}

async function api(path, body) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok && response.status !== 401 && response.status !== 403) {
    throw new Error(data.message || "Não foi possível concluir a operação.");
  }
  return { response, data };
}

async function loadStatus() {
  const response = await fetch("/api/status");
  const state = await response.json();
  const configured = state.configured;
  const blocked = state.blocked;
  const authenticated = state.authenticated;

  setupSection.classList.toggle("locked", configured);
  newPassword.disabled = configured;
  setupForm.querySelector("button").disabled = configured;

  password.disabled = !configured || blocked || authenticated;
  loginButton.disabled = !configured || blocked || authenticated;
  loginSection.classList.toggle("locked", !configured || blocked || authenticated);

  attemptsLabel.textContent = `${state.attempts_left} tentativa(s) disponível(is)`;

  if (blocked) {
    message("Conta bloqueada após 3 tentativas incorretas. Reinicie a demonstração para começar novamente.", "error");
  } else if (authenticated) {
    message("Acesso liberado com sucesso!", "success");
  } else if (configured) {
    message("Senha cadastrada. Confirme a senha para liberar o sistema.", "success");
  } else {
    message("Aguardando cadastro da senha.");
  }
}

setupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const { data } = await api("/api/setup", { password: newPassword.value });
    message(data.message, "success");
    newPassword.value = "";
    await loadStatus();
    password.focus();
  } catch (error) {
    message(error.message, "error");
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const { data } = await api("/api/login", { password: password.value });
    password.value = "";

    if (data.authenticated) {
      message(data.message, "success");
      loginButton.disabled = true;
      password.disabled = true;
      boot.hidden = false;
      await countdown();
    } else {
      message(data.message, "error");
      attemptsLabel.textContent = `${data.attempts_left} tentativa(s) disponível(is)`;
      password.focus();
      if (data.blocked) await loadStatus();
    }
  } catch (error) {
    message(error.message, "error");
  }
});

async function countdown() {
  const count = document.querySelector("#count");
  const progress = document.querySelector("#progress");
  const bootMessage = document.querySelector("#boot-message");

  for (let i = 5; i >= 1; i--) {
    count.textContent = i;
    progress.style.width = `${((6 - i) / 5) * 100}%`;
    bootMessage.textContent = "Preparando ambiente seguro...";
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  count.textContent = "✓";
  progress.style.width = "100%";
  bootMessage.textContent = "Sistema inicializado com sucesso!";
}

resetButton.addEventListener("click", async () => {
  await fetch("/api/reset", { method: "POST" });
  boot.hidden = true;
  message("Sessão reiniciada. Cadastre uma nova senha.");
  await loadStatus();
});

loadStatus();
