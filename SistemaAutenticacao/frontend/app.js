const authPanel = document.querySelector("#auth-panel");
const dashboard = document.querySelector("#dashboard");
const registerForm = document.querySelector("#register-form");
const loginForm = document.querySelector("#login-form");
const registerView = document.querySelector("#register-view");
const loginView = document.querySelector("#login-view");
const authMessage = document.querySelector("#auth-message");
const dashboardMessage = document.querySelector("#dashboard-message");
const adminPanel = document.querySelector("#admin-panel");
const userList = document.querySelector("#user-list");
const csrfInput = document.querySelector("#csrf-token");
let csrfToken = "";
let currentUser = null;

function setMessage(element, text, type = "") {
  element.textContent = text;
  element.className = "message " + type;
}

async function api(path, options = {}) {
  const method = options.method || "GET";
  const headers = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET" && csrfToken) headers["X-CSRF-Token"] = csrfToken;
  const response = await fetch(path, {
    method,
    headers,
    credentials: "same-origin",
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Não foi possível concluir a operação.");
    error.status = response.status;
    throw error;
  }
  return data;
}

function showAuth(view = "login") {
  authPanel.hidden = false;
  dashboard.hidden = true;
  adminPanel.hidden = true;
  registerView.hidden = view !== "register";
  loginView.hidden = view !== "login";
  setMessage(authMessage, "");
}

function showDashboard(user) {
  currentUser = user;
  authPanel.hidden = true;
  dashboard.hidden = false;
  document.querySelector("#welcome").textContent = "Olá, " + user.name + "!";
  document.querySelector("#account-email").textContent = user.email;
  document.querySelector("#account-role").textContent =
    user.role === "admin" ? "Administrador" : "Usuário";
  adminPanel.hidden = user.role !== "admin";
  if (user.role === "admin") loadUsers();
}

async function loadUsers() {
  try {
    const data = await api("/api/admin/users");
    userList.replaceChildren();
    for (const user of data.users) {
      const row = document.createElement("tr");
      const nameCell = document.createElement("td");
      const emailCell = document.createElement("td");
      const roleCell = document.createElement("td");
      const actionCell = document.createElement("td");
      nameCell.textContent = user.name;
      emailCell.textContent = user.email;

      const select = document.createElement("select");
      select.setAttribute("aria-label", "Perfil de " + user.name);
      for (const role of ["user", "admin"]) {
        const option = document.createElement("option");
        option.value = role;
        option.textContent = role === "admin" ? "Administrador" : "Usuário";
        option.selected = role === user.role;
        select.append(option);
      }

      const save = document.createElement("button");
      save.type = "button";
      save.className = "small-button";
      save.textContent = "Salvar";
      save.disabled = user.id === currentUser.id;
      save.addEventListener("click", async () => {
        try {
          await api("/api/admin/users/" + user.id + "/role", {
            method: "PATCH",
            body: { role: select.value }
          });
          setMessage(dashboardMessage, "Permissão atualizada.", "success");
          await loadUsers();
        } catch (error) {
          setMessage(dashboardMessage, error.message, "error");
        }
      });

      roleCell.append(select);
      actionCell.append(save);
      row.append(nameCell, emailCell, roleCell, actionCell);
      userList.append(row);
    }
  } catch (error) {
    setMessage(dashboardMessage, error.message, "error");
  }
}

document.querySelector("#show-register").addEventListener("click", () => showAuth("register"));
document.querySelector("#show-login").addEventListener("click", () => showAuth("login"));

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(registerForm);
  try {
    const data = await api("/api/register", {
      method: "POST",
      body: {
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password")
      }
    });
    loginForm.elements.email.value = form.get("email");
    registerForm.reset();
    showAuth("login");
    setMessage(authMessage, data.message, "success");
  } catch (error) {
    setMessage(authMessage, error.message, "error");
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(loginForm);
  try {
    const data = await api("/api/login", {
      method: "POST",
      body: { email: form.get("email"), password: form.get("password") }
    });
    csrfToken = data.csrf_token;
    loginForm.reset();
    setMessage(dashboardMessage, data.message, "success");
    showDashboard(data.user);
  } catch (error) {
    setMessage(authMessage, error.message, "error");
  }
});

document.querySelector("#logout-button").addEventListener("click", async () => {
  try {
    const data = await api("/api/logout", { method: "POST" });
    csrfToken = data.csrf_token;
    currentUser = null;
    showAuth("login");
    setMessage(authMessage, data.message, "success");
  } catch (error) {
    setMessage(dashboardMessage, error.message, "error");
  }
});

async function initialize() {
  try {
    const state = await api("/api/status");
    csrfToken = state.csrf_token;
    csrfInput.value = csrfToken;
    if (state.authenticated && state.user) {
      showDashboard(state.user);
    } else {
      showAuth("login");
    }
  } catch (_error) {
    showAuth("login");
    setMessage(authMessage, "Não foi possível conectar ao servidor. Atualize a página e tente novamente.", "error");
  }
}

initialize();
