const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { JSDOM } = require("jsdom");

const frontendDir = path.resolve(__dirname, "..");
const html = readFileSync(path.join(frontendDir, "index.html"), "utf8");
const appScript = readFileSync(path.join(frontendDir, "app.js"), "utf8");

function jsonResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  };
}

function createMockFetch(overrides = {}) {
  const calls = [];
  const fetch = async (url, options = {}) => {
    const method = options.method || "GET";
    const call = {
      url,
      method,
      options,
      body: options.body ? JSON.parse(options.body) : undefined,
    };
    calls.push(call);

    const key = method + " " + url;
    if (overrides[key]) return overrides[key](call, calls);

    if (key === "GET /api/status") {
      return jsonResponse({
        authenticated: false,
        csrf_token: "csrf-initial",
        user: null,
      });
    }
    if (key === "GET /api/admin/users") return jsonResponse({ users: [] });
    if (key === "POST /api/logout") {
      return jsonResponse({
        message: "Você saiu da sua conta.",
        csrf_token: "csrf-after-logout",
      });
    }
    return jsonResponse({ message: "Rota não configurada no teste." }, 404);
  };
  return { fetch, calls };
}

function createHarness(overrides = {}) {
  const dom = new JSDOM(html, {
    url: "http://localhost/",
    runScripts: "outside-only",
  });
  const mock = createMockFetch(overrides);
  dom.window.fetch = mock.fetch;
  dom.window.eval(appScript);
  return { dom, window: dom.window, document: dom.window.document, calls: mock.calls };
}

function nextTurn() {
  return new Promise((resolve) => setImmediate(resolve));
}

async function waitFor(predicate, message = "A condição esperada não foi atingida.") {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (predicate()) return;
    await nextTurn();
  }
  assert.fail(message);
}

function submit(window, selector) {
  const form = window.document.querySelector(selector);
  form.dispatchEvent(new window.Event("submit", {
    bubbles: true,
    cancelable: true,
  }));
}

function fillLogin(document, email = "user@example.com", password = "UserPassword123") {
  document.querySelector("#login-email").value = email;
  document.querySelector("#login-password").value = password;
}

test("inicializa a tela de login e carrega o token CSRF", async (t) => {
  const { dom, document } = createHarness();
  t.after(() => dom.window.close());

  await waitFor(() => document.querySelector("#csrf-token").value === "csrf-initial");
  assert.equal(document.querySelector("#login-view").hidden, false);
  assert.equal(document.querySelector("#register-view").hidden, true);
  assert.equal(document.querySelector("#dashboard").hidden, true);
});

test("abre o cadastro e envia os dados com o token CSRF", async (t) => {
  const { dom, window, document, calls } = createHarness({
    "POST /api/register": () => jsonResponse({
      message: "Cadastro concluído. Entre com seu e-mail e senha.",
    }, 201),
  });
  t.after(() => window.close());

  await waitFor(() => document.querySelector("#csrf-token").value === "csrf-initial");
  document.querySelector("#show-register").click();
  document.querySelector("#register-name").value = "Pessoa Teste";
  document.querySelector("#register-email").value = "pessoa@example.com";
  document.querySelector("#register-password").value = "SenhaSegura123";
  submit(window, "#register-form");

  await waitFor(() => document.querySelector("#auth-message").textContent.includes("Cadastro concluído"));
  const request = calls.find((call) => call.url === "/api/register");
  assert.equal(request.method, "POST");
  assert.equal(request.options.headers["X-CSRF-Token"], "csrf-initial");
  assert.deepEqual(request.body, {
    name: "Pessoa Teste",
    email: "pessoa@example.com",
    password: "SenhaSegura123",
  });
  assert.equal(document.querySelector("#login-view").hidden, false);
  assert.equal(document.querySelector("#login-email").value, "pessoa@example.com");
});

test("login de usuário comum abre o painel sem exibir controles administrativos", async (t) => {
  const { dom, window, document, calls } = createHarness({
    "POST /api/login": () => jsonResponse({
      message: "Login realizado com sucesso.",
      csrf_token: "csrf-login",
      user: {
        id: 8,
        name: "Maria",
        email: "maria@example.com",
        role: "user",
      },
    }),
  });
  t.after(() => window.close());

  await waitFor(() => document.querySelector("#csrf-token").value === "csrf-initial");
  fillLogin(document, "maria@example.com");
  submit(window, "#login-form");

  await waitFor(() => document.querySelector("#dashboard").hidden === false);
  const request = calls.find((call) => call.url === "/api/login");
  assert.equal(request.options.headers["X-CSRF-Token"], "csrf-initial");
  assert.equal(request.options.credentials, "same-origin");
  assert.equal(document.querySelector("#welcome").textContent, "Olá, Maria!");
  assert.equal(document.querySelector("#account-email").textContent, "maria@example.com");
  assert.equal(document.querySelector("#account-role").textContent, "Usuário");
  assert.equal(document.querySelector("#admin-panel").hidden, true);
});

test("login de administrador carrega a lista e permite solicitar alteração de perfil", async (t) => {
  let roleUpdated = false;
  const users = [
    { id: 1, name: "Admin", email: "admin@example.com", role: "admin" },
    { id: 2, name: "Pessoa", email: "pessoa@example.com", role: "user" },
  ];
  const { dom, window, document, calls } = createHarness({
    "POST /api/login": () => jsonResponse({
      message: "Login realizado com sucesso.",
      csrf_token: "csrf-admin",
      user: {
        id: 1,
        name: "Admin",
        email: "admin@example.com",
        role: "admin",
      },
    }),
    "GET /api/admin/users": () => jsonResponse({
      users: roleUpdated
        ? users.map((user) => user.id === 2 ? { ...user, role: "admin" } : user)
        : users,
    }),
    "PATCH /api/admin/users/2/role": (call) => {
      roleUpdated = true;
      return jsonResponse({ message: "Permissão do usuário atualizada." });
    },
  });
  t.after(() => window.close());

  await waitFor(() => document.querySelector("#csrf-token").value === "csrf-initial");
  fillLogin(document, "admin@example.com", "AdminPassword123");
  submit(window, "#login-form");

  await waitFor(() => document.querySelectorAll("#user-list tr").length === 2);
  assert.equal(document.querySelector("#admin-panel").hidden, false);

  const rows = document.querySelectorAll("#user-list tr");
  const targetRow = rows[1];
  targetRow.querySelector("select").value = "admin";
  targetRow.querySelector("button").click();

  await waitFor(() => roleUpdated && calls.some((call) => call.method === "PATCH")
    && document.querySelector("#dashboard-message").textContent === "Permissão atualizada.");
  const patch = calls.find((call) => call.method === "PATCH");
  assert.equal(patch.options.headers["X-CSRF-Token"], "csrf-admin");
  assert.deepEqual(patch.body, { role: "admin" });
  assert.equal(document.querySelector("#dashboard-message").textContent, "Permissão atualizada.");
});

test("exibe mensagem de erro quando a API rejeita o login", async (t) => {
  const { dom, window, document } = createHarness({
    "POST /api/login": () => jsonResponse({
      message: "E-mail ou senha inválidos.",
    }, 401),
  });
  t.after(() => window.close());

  await waitFor(() => document.querySelector("#csrf-token").value === "csrf-initial");
  fillLogin(document);
  submit(window, "#login-form");

  await waitFor(() => document.querySelector("#auth-message").textContent === "E-mail ou senha inválidos.");
  assert.match(document.querySelector("#auth-message").className, /error/);
  assert.equal(document.querySelector("#dashboard").hidden, true);
});

test("logout encerra a sessão e retorna à tela de login", async (t) => {
  const { dom, window, document, calls } = createHarness({
    "POST /api/login": () => jsonResponse({
      message: "Login realizado com sucesso.",
      csrf_token: "csrf-login",
      user: {
        id: 8,
        name: "Maria",
        email: "maria@example.com",
        role: "user",
      },
    }),
  });
  t.after(() => window.close());

  await waitFor(() => document.querySelector("#csrf-token").value === "csrf-initial");
  fillLogin(document, "maria@example.com");
  submit(window, "#login-form");
  await waitFor(() => document.querySelector("#dashboard").hidden === false);

  document.querySelector("#logout-button").click();
  await waitFor(() => document.querySelector("#dashboard").hidden === true
    && document.querySelector("#auth-message").textContent === "Você saiu da sua conta.");

  const logout = calls.find((call) => call.url === "/api/logout");
  assert.equal(logout.method, "POST");
  assert.equal(logout.options.headers["X-CSRF-Token"], "csrf-login");
  assert.equal(document.querySelector("#login-view").hidden, false);
});
